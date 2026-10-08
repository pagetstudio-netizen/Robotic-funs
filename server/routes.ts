import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { registerSchema, loginSchema, depositSchema, walletSchema, phoneNumberSchema, type Product, type Withdrawal } from "@shared/schema";
import { normalizeBeninPhone } from "@shared/phone";
import { z } from "zod";
import { isProductAvailableForCountry, isValidLaunchSchedule } from "./product-schedule";
import { hasPurchasedActivityLaunch } from "../shared/product-purchase-limit";
import ConnectPgSimple from "connect-pg-simple";
import { 
  initiatePayment, 
  verifyPayment, 
  isSoleaspaySupported, 
  mapSoleaspayStatus,
  SOLEASPAY_SERVICE_MAP 
} from "./soleaspay";
import {
  createPayment as sendavapayCreate,
  initiatePayment as sendavapayInitiate,
  submitOtp as sendavapaySubmitOtp,
  retryPayment as sendavapayRetry,
  verifyPayment as sendavapayVerify,
  verifyWebhookSignature as sendavapayVerifySignature,
  mapSendavapayStatus,
  formatPhone as sendavapayFormatPhone,
  getCurrency as sendavapayGetCurrency,
  toSendavapayCountry,
} from "./sendavapay";
import {
  createPpayProsMerchantOrderNo,
  createPpayProsPayin,
  createPpayProsPayout,
  formatPpayProsBeninPhone,
  getPpayProsCredentials,
  parsePpayProsMerchantOrderNo,
  PpayProsApiError,
  queryPpayProsPayout,
  toPpayProsAmount,
  verifyPpayProsSignature,
} from "./ppaypros";
import {
  buildPaymentUrl as westpayBuildUrl,
  verifyWebhookSignature as westpayVerifySignature,
  transfer as westpayTransfer,
  formatMsisdn as westpayFormatMsisdn,
} from "./westpay";
import {
  createPayin as inpayCreatePayin,
  createPayout as inpayCreatePayout,
  createOutTradeNo as inpayCreateOutTradeNo,
  findVerifiedAccount as inpayFindVerifiedAccount,
  getBalance as inpayGetBalance,
  getInpayAccount,
  getInpayEnabledCountries,
  getCountryName as inpayGetCountryName,
  isInpayConfigured,
  isInpayCountryEnabled,
  mapPayinStatus as mapInpayPayinStatus,
  mapPayoutStatus as mapInpayPayoutStatus,
  resolveBankCode as inpayResolveBankCode,
} from "./inpay";
import {
  collectPayment as ashtechCollect,
  getCountries as ashtechGetCountries,
  getTransaction as ashtechGetTransaction,
  isAshtechConfigured,
  mapAshtechStatus,
  AshtechApiError,
  verifyAshtechWebhookSignature,
} from "./ashtechpay";
import {
  createDrimPayReference,
  drimPayGetBalance,
  drimPayGetPayin,
  DRIMPAY_MAX_PAYIN_STATUS_CHECKS,
  drimPayGetPayout,
  drimPayInitiatePayin,
  drimPayInitiatePayout,
  drimPayOperatorsForCountry,
  getDrimPayWavePaymentUrl,
  getDrimPayOperatorSlug,
  getDrimPayWebhookSecret,
  isDrimPayConfigured,
  isDrimPayCountry,
  isDrimPayWebhookConfigured,
  mapDrimPayStatus,
  normalizeDrimPayPhone,
  unwrapDrimPayResponse,
  verifyDrimPayWebhookSignature,
  DrimPayApiError,
} from "./drimpay";
import {
  formatTelegramValue,
  sendTelegramInpayError,
  sendTelegramMessage,
  sendTelegramSecurityAlert,
} from "./telegram";
import { requestWithdrawal } from "./withdrawal-request";
import express from "express";

// --- Brute-force protection (in-memory) ---
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getClientKey(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0].trim() : req.socket.remoteAddress || "unknown";
  return ip;
}

function getPublicBaseUrl(req: Request): string {
  const configuredUrl = process.env.PUBLIC_APP_URL?.trim().replace(/\/+$/, "");
  if (configuredUrl) return configuredUrl;

  const devDomain = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (devDomain) return `https://${devDomain}`;

  const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol)
    .split(",")[0]
    .trim();
  return `${forwardedProto}://${req.get("host")}`;
}

function ppayProsCallbackPayload(req: Request): Record<string, unknown> {
  const combined = {
    ...(req.query as Record<string, unknown>),
    ...((req.body && typeof req.body === "object" ? req.body : {}) as Record<string, unknown>),
  };
  return Object.fromEntries(
    Object.entries(combined)
      .filter(([, value]) => typeof value === "string" || typeof value === "number")
      .map(([key, value]) => [key, String(value)]),
  );
}

async function reconcilePpayProsPayout(
  withdrawal: Withdrawal,
  merchantOrderNo: string,
  stateValue: unknown,
  transferId?: string,
): Promise<Withdrawal | undefined> {
  if (withdrawal.omnipayReference !== merchantOrderNo) {
    throw new Error("Référence PPayPros différente de celle du retrait.");
  }
  if (withdrawal.status === "approved" || withdrawal.status === "rejected") return withdrawal;

  const state = Number(stateValue);
  if (state === 0 || state === 1) {
    return storage.updateWithdrawal(withdrawal.id, {
      status: "processing",
      ...(transferId ? { omnipayId: transferId } : {}),
    });
  }
  if (state !== 2 && state !== 3 && state !== 4) {
    throw new Error("État de virement PPayPros inconnu.");
  }

  const terminalStatus = state === 2 ? "approved" : "rejected";
  const finalized = await storage.claimWithdrawalFinalization(withdrawal.id, terminalStatus);
  if (!finalized) return await storage.getWithdrawal(withdrawal.id);

  let updated = finalized;
  if (transferId) {
    updated = await storage.updateWithdrawal(withdrawal.id, { omnipayId: transferId });
  }
  if (terminalStatus === "rejected") {
    const user = await storage.getUser(withdrawal.userId);
    if (user) {
      const refundedBalance = parseFloat(user.balance) + withdrawal.amount;
      await storage.updateUser(user.id, { balance: refundedBalance.toFixed(2) });
    }
  }
  return updated;
}

function checkBruteForce(req: Request, res: Response): boolean {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (record && record.blockedUntil > now) {
    const minutesLeft = Math.ceil((record.blockedUntil - now) / 60000);
    res.status(429).json({ message: `Trop de tentatives. Réessayez dans ${minutesLeft} minute(s).` });
    return true;
  }
  return false;
}

function recordFailedAttempt(req: Request) {
  const key = getClientKey(req);
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  record.count += 1;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    record.count = 0;
    void sendTelegramSecurityAlert(
      key,
      "Trop de tentatives. Réessayez dans 15 minute(s).",
    ).catch((error) => console.error("[telegram] security notification failed:", error.message));
  }
  loginAttempts.set(key, record);
}

function clearFailedAttempts(req: Request) {
  loginAttempts.delete(getClientKey(req));
}

function getBlockedIps(value: string | undefined): string[] {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

const BLOCKED_IP_CACHE_TTL_MS = 15_000;
let blockedIpsCache: { values: string[]; expiresAt: number } | null = null;

async function getCachedBlockedIps(): Promise<string[]> {
  const now = Date.now();
  if (blockedIpsCache && blockedIpsCache.expiresAt > now) {
    return blockedIpsCache.values;
  }

  const values = getBlockedIps((await storage.getSetting("blockedIps")) ?? undefined);
  blockedIpsCache = { values, expiresAt: now + BLOCKED_IP_CACHE_TTL_MS };
  return values;
}

function updateBlockedIpsCache(values: string[]) {
  blockedIpsCache = {
    values,
    expiresAt: Date.now() + BLOCKED_IP_CACHE_TTL_MS,
  };
}
// --- end brute-force protection ---

function parseDrimPayOperators(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((operator): operator is string => typeof operator === "string");
  }
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((operator) =>
          typeof operator === "string"
            ? operator
            : operator?.name || operator?.operator || operator?.code || "",
        )
        .filter((operator): operator is string => typeof operator === "string" && Boolean(operator.trim()));
    }
  } catch {
    // Older country records may contain comma-separated operator names.
  }
  return value.split(",").map((operator) => operator.trim()).filter(Boolean);
}

function isDrimPayCountryEnabled(
  settings: Record<string, string>,
  kind: "Payin" | "Payout",
  country: string,
) {
  const normalizedCountry = country.trim().toUpperCase();
  const enabled = settings[`drimpay${kind}Enabled`] === "true";
  const countries = (settings[`drimpay${kind}Countries`] || "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean);
  return enabled && countries.includes(normalizedCountry) && isDrimPayCountry(normalizedCountry);
}

function getRouteParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] ?? "" : value;
}

async function refundRejectedWithdrawal(
  withdrawal: { id: number; userId: number; amount: number },
  provider = "InPay",
) {
  const user = await storage.getUser(withdrawal.userId);
  if (!user) return;
  await storage.updateUser(user.id, {
    balance: (parseFloat(user.balance) + withdrawal.amount).toFixed(2),
  });
  await storage.createTransaction({
    userId: user.id,
    type: "withdrawal_refund",
    amount: withdrawal.amount.toString(),
    description: `Remboursement retrait ${provider} #${withdrawal.id}`,
  });
}

async function creditApprovedDeposit(deposit: {
  id: number;
  userId: number;
  amount: number;
}) {
  const user = await storage.getUser(deposit.userId);
  if (!user) return;

  await storage.updateUser(user.id, {
    balance: (parseFloat(user.balance) + deposit.amount).toFixed(2),
    hasDeposited: true,
  });
  await storage.createTransaction({
    userId: user.id,
    type: "deposit",
    amount: deposit.amount.toString(),
    description: `Dépôt RobotPay #${deposit.id}`,
  });
  await storage.processDepositReferralCommissions(user.id, deposit.amount);
  void sendTelegramMessage(
    [
      "✅ <b>Dépôt validé</b>",
      `Utilisateur : ${formatTelegramValue(user.fullName)}`,
      `Montant : <b>${formatTelegramValue(deposit.amount)} XOF</b>`,
      `Référence : ${formatTelegramValue(deposit.id)}`,
      `Pays : ${formatTelegramValue(user.country)}`,
    ].join("\n"),
  ).catch((error) => console.error("[telegram] deposit notification failed:", error.message));
}

async function reconcileDrimPayDeposit(
  deposit: Awaited<ReturnType<typeof storage.getDeposit>> & {},
  response: Record<string, any>,
) {
  const data = unwrapDrimPayResponse(response);
  if (data.amount !== undefined && Number(data.amount) !== deposit.amount) {
    throw new Error("Le montant confirmé par DrimPay ne correspond pas au dépôt.");
  }
  if (data.country_code && String(data.country_code).toUpperCase() !== deposit.country.toUpperCase()) {
    throw new Error("Le pays confirmé par DrimPay ne correspond pas au dépôt.");
  }
  if (data.order_id && deposit.drimpayOrderId && String(data.order_id) !== deposit.drimpayOrderId) {
    throw new Error("La référence de commande DrimPay ne correspond pas au dépôt.");
  }
  if (data.reference && deposit.drimpayReference && String(data.reference) !== deposit.drimpayReference) {
    throw new Error("La référence DrimPay ne correspond pas au dépôt.");
  }

  const status = mapDrimPayStatus(data.status);
  if (status === "approved") {
    const claimed = await storage.claimDepositApproval(deposit.id);
    if (claimed) await creditApprovedDeposit(claimed);
  } else if (status === "rejected") {
    await storage.claimDepositRejection(deposit.id);
  } else if (deposit.status === "pending") {
    await storage.updateDeposit(deposit.id, { status: "processing" });
  }
  if (status === "approved" || status === "rejected") {
    await storage.clearDrimPayStatusCheckCount(deposit.id).catch(() => undefined);
  }
  return (await storage.getDeposit(deposit.id)) || deposit;
}

let drimPayStatusReconciliationRunning = false;

export async function reconcilePendingDrimPayDeposits() {
  if (drimPayStatusReconciliationRunning || !isDrimPayConfigured()) return;
  drimPayStatusReconciliationRunning = true;
  try {
    const pendingDeposits = await storage.getPendingDrimPayDeposits();
    for (const deposit of pendingDeposits) {
      if (!deposit.drimpayReference) continue;

      let attempt: number;
      try {
        attempt = await storage.incrementDrimPayStatusCheckCount(deposit.id);
      } catch (error: any) {
        console.error(`[drimpay] failed to record status check for deposit #${deposit.id}:`, error?.message || error);
        continue;
      }

      if (attempt > DRIMPAY_MAX_PAYIN_STATUS_CHECKS) {
        await storage.claimDepositRejection(deposit.id);
        await storage.clearDrimPayStatusCheckCount(deposit.id).catch(() => undefined);
        continue;
      }

      try {
        const providerStatus = await drimPayGetPayin(deposit.drimpayReference);
        const updated = await reconcileDrimPayDeposit(deposit, providerStatus);
        if (updated.status === "approved" || updated.status === "rejected") continue;
        if (attempt === DRIMPAY_MAX_PAYIN_STATUS_CHECKS) {
          await storage.claimDepositRejection(deposit.id);
          await storage.clearDrimPayStatusCheckCount(deposit.id).catch(() => undefined);
          console.info(`[drimpay] deposit #${deposit.id} marked failed after five status checks`);
        }
      } catch (error: any) {
        console.error(`[drimpay] automatic status check ${attempt}/${DRIMPAY_MAX_PAYIN_STATUS_CHECKS} failed for deposit #${deposit.id}:`, error?.message || error);
        if (attempt === DRIMPAY_MAX_PAYIN_STATUS_CHECKS) {
          await storage.claimDepositRejection(deposit.id);
          await storage.clearDrimPayStatusCheckCount(deposit.id).catch(() => undefined);
          console.info(`[drimpay] deposit #${deposit.id} marked failed after five status checks`);
        }
      }
    }
  } catch (error: any) {
    console.error("[drimpay] automatic deposit reconciliation failed:", error?.message || error);
  } finally {
    drimPayStatusReconciliationRunning = false;
  }
}

async function reconcileDrimPayPayout(
  withdrawal: Withdrawal,
  response: Record<string, any>,
) {
  const data = unwrapDrimPayResponse(response);
  if (data.amount !== undefined && Number(data.amount) !== withdrawal.netAmount) {
    throw new Error("Le montant confirmé par DrimPay ne correspond pas au retrait.");
  }
  if (data.country_code && String(data.country_code).toUpperCase() !== withdrawal.country.toUpperCase()) {
    throw new Error("Le pays confirmé par DrimPay ne correspond pas au retrait.");
  }
  if (
    data.external_ref &&
    withdrawal.drimpayExternalRef &&
    String(data.external_ref) !== withdrawal.drimpayExternalRef
  ) {
    throw new Error("La référence externe DrimPay ne correspond pas au retrait.");
  }
  if (
    data.reference &&
    withdrawal.drimpayReference &&
    String(data.reference) !== withdrawal.drimpayReference
  ) {
    throw new Error("La référence DrimPay ne correspond pas au retrait.");
  }

  const status = mapDrimPayStatus(data.status);
  if (status === "approved" || status === "rejected") {
    const finalized = await storage.claimWithdrawalFinalization(withdrawal.id, status);
    if (finalized && status === "rejected") {
      await refundRejectedWithdrawal(finalized, "DrimPay");
    }
  } else if (withdrawal.status !== "approved" && withdrawal.status !== "rejected") {
    await storage.updateWithdrawal(withdrawal.id, {
      status: "processing",
      ...(data.reference ? { drimpayReference: String(data.reference) } : {}),
    });
  }
  return (await storage.getWithdrawal(withdrawal.id)) || withdrawal;
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

const PgSession = ConnectPgSimple(session);
const sessionDatabaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionDatabaseUrl) {
  throw new Error("DATABASE_URL is not configured for session storage.");
}
if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be configured.");
}

const SENSITIVE_SETTING_KEYS = new Set([
  "sendavapayWebhookSecret",
  "omnipayCallbackKey",
  "westpayWebhookSecret",
  "ashtechWebhookSecret",
]);
const INPAY_COUNTRY_CODES = ["SN", "ML", "CI", "BF", "TG", "BJ", "GH", "CM", "CG", "KE", "TZ", "UG", "ZA"];
const INPAY_MERCHANT_SETTING_KEYS = new Set(
  INPAY_COUNTRY_CODES.map((country) => `inpayMerchantId_${country}`),
);
const PUBLIC_SETTING_KEYS = new Set([
  "supportLink", "supportType", "supportLabel",
  "support2Link", "support2Type", "support2Label",
  "channelLink", "channelType", "channelLabel",
  "groupLink", "groupType", "groupLabel", "noticeText", "popupButtonLabel",
  "supportEnabled", "support2Enabled", "channelEnabled", "groupEnabled",
  "signupBonus", "minDeposit", "minWithdrawal", "withdrawalFees",
  "maxWithdrawalsPerDay", "withdrawalStartHour", "withdrawalEndHour",
  "level1Commission", "level2Commission", "level3Commission",
  "sendavapayEnabled", "sendavapayChannelName",
  "westpayEnabled", "westpayChannelName", "westpayCountries",
  "ppayprosPayinEnabled", "ppayprosPayoutEnabled",
  "ashtechEnabled", "ashtechChannelName", "ashtechCountries",
  "drimpayPayinEnabled", "drimpayPayoutEnabled",
  "drimpayPayinCountries", "drimpayPayoutCountries",
  "inpayEnabled", "inpayChannelName", "inpayCountries",
]);
const ADMIN_SETTING_KEYS = new Set([
  ...Array.from(PUBLIC_SETTING_KEYS),
  "sendavapayWebhookSecret", "omnipayCallbackKey",
  "westpayWebhookSecret",
  "ashtechWebhookSecret",
  ...Array.from(INPAY_MERCHANT_SETTING_KEYS),
]);
const MASKED_SETTING_VALUE = "********";

function publicSettings(settings: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(settings).filter(([key]) => PUBLIC_SETTING_KEYS.has(key)),
  );
}

function adminSettings(settings: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(settings)
      .filter(([key]) => ADMIN_SETTING_KEYS.has(key))
      .map(([key, value]) => [
      key,
      SENSITIVE_SETTING_KEYS.has(key) && value ? MASKED_SETTING_VALUE : value,
      ]),
  );
}

function validatePhone(value: unknown, fieldName: string): string {
  const result = phoneNumberSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`${fieldName} invalide`);
  }
  return result.data;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

async function requireBanker(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin && !user?.isBanker) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Trust proxy for production HTTPS (Replit deployment)
  app.set("trust proxy", 1);

  app.use(
    session({
      store: new PgSession({
        conString: sessionDatabaseUrl,
        tableName: "session",
        createTableIfMissing: true,
        pruneSessionInterval: 60 * 60,
      }),
       secret: sessionSecret as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      },
    })
  );

  app.use(async (req, res, next) => {
    try {
      const blockedIps = await getCachedBlockedIps();
      if (blockedIps.includes(getClientKey(req))) {
        return res.status(403).json({ message: "Accès bloqué pour cette adresse IP" });
      }
      next();
    } catch (error) {
      console.error("[security] IP block check failed:", error);
      next();
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const requestBody = req.body && typeof req.body === "object"
        ? req.body as Record<string, unknown>
        : {};
      const country = typeof requestBody.country === "string"
        ? requestBody.country.trim().toUpperCase()
        : requestBody.country;
      const beninRegistration = country === "BJ";
      const normalizedPhone = beninRegistration
        ? normalizeBeninPhone(requestBody.phone)
        : requestBody.phone;
      if (beninRegistration && !normalizedPhone) {
        return res.status(400).json({
          message: "Numéro béninois invalide : saisissez 8 chiffres locaux ou 01 suivi de 8 chiffres.",
        });
      }
      const data = registerSchema.parse({ ...requestBody, country, phone: normalizedPhone });

      const phoneCandidates = new Set([data.phone]);
      if (data.country === "BJ") {
        const localDigits = data.phone.startsWith("01") ? data.phone.slice(2) : data.phone;
        for (const candidate of [
          localDigits,
          `229${data.phone}`,
          `+229${data.phone}`,
          `229${localDigits}`,
          `+229${localDigits}`,
        ]) {
          phoneCandidates.add(candidate);
        }
      }
      for (const candidate of Array.from(phoneCandidates)) {
        const existing = await storage.getUserByPhone(candidate, data.country);
        if (existing) {
          return res.status(400).json({ message: "Ce numéro est déjà utilisé" });
        }
      }

      let referredBy: string | undefined;
      if (data.invitationCode && data.invitationCode.trim()) {
        const cleanCode = data.invitationCode.trim().toUpperCase();
        const referrer = await storage.getUserByReferralCode(cleanCode);
        if (!referrer) {
          return res.status(400).json({ message: "Code d'invitation invalide" });
        }
        referredBy = cleanCode;
      }

      const user = await storage.createUser({
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        password: data.password,
        referredBy,
      });

      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    if (checkBruteForce(req, res)) return;
    try {
      const data = loginSchema.parse(req.body);
      const country = data.country.toUpperCase();
      const phoneCandidates = new Set([data.phone]);
      if (country === "BJ") {
        const normalizedPhone = normalizeBeninPhone(data.phone);
        if (normalizedPhone) {
          const localDigits = normalizedPhone.slice(2);
          for (const candidate of [
            normalizedPhone,
            localDigits,
            `229${normalizedPhone}`,
            `+229${normalizedPhone}`,
            `229${localDigits}`,
            `+229${localDigits}`,
          ]) {
            phoneCandidates.add(candidate);
          }
        }
      }

      let user;
      for (const phone of Array.from(phoneCandidates)) {
        user = await storage.getUserByPhone(phone, country);
        if (user) break;
      }

      // Administrators may select any country at login. Regular users must
      // still authenticate with the country saved on their account.
      if (!user) {
        for (const phone of Array.from(phoneCandidates)) {
          const adminCandidate = await storage.getUserByPhoneAnyCountry(phone);
          if (adminCandidate?.isAdmin) {
            user = adminCandidate;
            break;
          }
        }
      }

      if (!user) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        recordFailedAttempt(req);
        return res.status(400).json({ message: "Identifiants incorrects" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Compte suspendu" });
      }

      clearFailedAttempts(req);
      req.session.userId = user.id;
      if (user.isAdmin) {
        void sendTelegramMessage(
          [
            "🔐 <b>Connexion administrateur</b>",
            `Administrateur : ${formatTelegramValue(user.fullName)}`,
            `Pays : ${formatTelegramValue(user.country)}`,
            `Adresse IP : ${formatTelegramValue(getClientKey(req))}`,
          ].join("\n"),
        ).catch((error) => console.error("[telegram] admin login notification failed:", error.message));
      }
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Non authentifié" });
    }
    res.json({ user: { ...user, password: undefined } });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Veuillez remplir tous les champs" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ success: true, message: "Mot de passe modifie avec succes" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Products
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const products = (await storage.getProducts())
        .filter(product => isProductAvailableForCountry(product, user.country));
      const userProductsList = await storage.getUserProducts(req.session.userId!);
      const allUserProductsList = await storage.getAllUserProducts(req.session.userId!);
      const stockCounts = await storage.getProductStockCounts(products.map((product) => product.id));
      const activityPurchases = allUserProductsList.map(({ userProduct, product }) => ({
        productType: userProduct.purchaseProductType ?? product.productType,
        launchDate: userProduct.purchaseLaunchDate ?? product.launchDate,
        launchTime: userProduct.purchaseLaunchTime ?? product.launchTime,
        assignedByAdmin: userProduct.assignedByAdmin,
      }));
      
      const productCounts = new Map<number, number>();
      userProductsList.forEach(up => {
        if (up.isActive) {
          productCounts.set(up.productId, (productCounts.get(up.productId) || 0) + 1);
        }
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const canClaimFree = !user?.lastFreeProductClaim || 
        new Date(user.lastFreeProductClaim) < today;

      const productsWithOwnership = products.map(p => ({
        ...p,
        isOwned: productCounts.has(p.id),
        ownedCount: productCounts.get(p.id) || 0,
        canClaimFree: p.isFree && canClaimFree,
        stockCount: stockCounts[p.id] || 0,
        canPurchaseThisLaunch: p.productType !== "activity"
          || !hasPurchasedActivityLaunch(p.launchDate, p.launchTime, activityPurchases),
      }));

      res.json(productsWithOwnership);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(getRouteParam(req.params.id));
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      if (!product.isActive) {
        return res.status(409).json({ message: "Ce produit n’est plus disponible." });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });
      if (!isProductAvailableForCountry(product, user.country)) {
        return res.status(409).json({ message: "Ce produit d’activité n’est pas encore disponible." });
      }
      
      if (product.isFree) {
        return res.status(400).json({ message: "Utilisez /claim-free pour ce produit" });
      }

      const userProduct = await storage.purchaseProduct(req.session.userId!, productId);
      res.json(userProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/claim-free", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(getRouteParam(req.params.id));
      const product = await storage.getProduct(productId);
      
      if (!product || !product.isFree) {
        return res.status(400).json({ message: "Produit non valide" });
      }
      if (!product.isActive) {
        return res.status(409).json({ message: "Ce produit n’est plus disponible." });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Non authentifié" });
      }
      if (!isProductAvailableForCountry(product, user.country)) {
        return res.status(409).json({ message: "Ce produit d’activité n’est pas encore disponible." });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (user.lastFreeProductClaim && new Date(user.lastFreeProductClaim) >= today) {
        return res.status(400).json({ message: "Déjà réclamé aujourd'hui" });
      }

      const newBalance = parseFloat(user.balance) + product.dailyEarnings;
      await storage.updateUser(user.id, { 
        balance: newBalance.toFixed(2),
        lastFreeProductClaim: new Date(),
      });

      await storage.createTransaction({
        userId: user.id,
        type: "free_claim",
        amount: product.dailyEarnings.toString(),
        description: "Bonus produit gratuit",
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's purchased products
  app.get("/api/user/products", requireAuth, async (req, res) => {
    try {
      const userProductsList = await storage.getAllUserProducts(req.session.userId!);
      
      const formattedProducts = userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        purchasedAt: up.userProduct.purchaseDate,
        daysRemaining: up.userProduct.daysRemaining,
        totalEarned: up.userProduct.totalEarned,
        payoutMode: up.userProduct.payoutMode,
        prepaidEarnings: up.userProduct.purchasePrepaidEarnings ?? (
          up.userProduct.payoutMode === "daily" ? up.userProduct.totalEarned : 0
        ),
        totalReturn: up.userProduct.purchaseTotalReturn ?? up.product.totalReturn,
        status: up.userProduct.isActive ? 'active' : 'completed',
        product: up.product
      }));
      
      res.json(formattedProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product earnings are only credited once the position reaches maturity.
  app.post("/api/user/collect-earnings", requireAuth, async (req, res) => {
    return res.json({
      success: true,
      collected: 0,
      productsCollected: 0,
      message: "Les gains des produits sont versés uniquement à l’échéance.",
    });
  });

  // Payment Channels
  app.get("/api/payment-channels", requireAuth, async (req, res) => {
    try {
      const [channels, settings] = await Promise.all([
        storage.getPaymentChannels(),
        storage.getSettings(),
      ]);

      const soleaspayEnabled = settings.soleaspayEnabled === "true";
      const soleaspayChannelName = settings.soleaspayChannelName || "Westpay";
      const sendavapayEnabled = settings.sendavapayEnabled === "true";
      const sendavapayChannelName = settings.sendavapayChannelName || "SendavaPay";
      // Build virtual gateway channels when enabled in settings
      const virtualChannels: any[] = [];
      if (sendavapayEnabled) {
        virtualChannels.push({
          id: -2,
          name: sendavapayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "sendavapay",
        });
      }
      if (soleaspayEnabled) {
        virtualChannels.push({
          id: -1,
          name: soleaspayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "soleaspay",
        });
      }
      const westpayEnabled = settings.westpayEnabled === "true";
      const westpayChannelName = settings.westpayChannelName || "WestPay";
      if (westpayEnabled) {
        virtualChannels.push({
          id: -3,
          name: westpayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "westpay",
        });
      }
      const inpayEnabled = settings.inpayEnabled === "true";
      const inpayChannelName = settings.inpayChannelName || "InPay";
      if (inpayEnabled) {
        virtualChannels.push({
          id: -4,
          name: inpayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "inpay",
        });
      }

      // Manual channels created by admin (no gateway auto-processing)
      const manualChannels = channels.map((ch) => ({ ...ch, gateway: null }));

      res.json([...virtualChannels, ...manualChannels]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Soleaspay supported services
  app.get("/api/soleaspay/services", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const soleaspayEnabled = settings.soleaspayEnabled !== "false";
      const soleaspayCountries = settings.soleaspayCountries ? settings.soleaspayCountries.split(",").filter(Boolean) : [];
      res.json({ 
        enabled: soleaspayEnabled,
        services: SOLEASPAY_SERVICE_MAP,
        enabledCountries: soleaspayCountries,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Staking Products (public)
  app.get("/api/staking/products", requireAuth, async (req, res) => {
    try {
      const all = await storage.getActiveStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/staking/purchase/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      const staking = await storage.purchaseStaking(req.session.userId!, id);
      res.json(staking);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/staking/my", requireAuth, async (req, res) => {
    try {
      const stakings = await storage.getUserStakings(req.session.userId!);
      res.json(stakings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Staking
  app.get("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getStakingProducts();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/staking/products", requireAdmin, async (req, res) => {
    try {
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      if (!name || !price || !returnAmount || !lockDays) {
        return res.status(400).json({ message: "Champs requis : nom, prix, retour, durée" });
      }
      const sp = await storage.createStakingProduct({
        name, description: description || null,
        price: parseInt(price),
        returnAmount: parseInt(returnAmount),
        lockDays: parseInt(lockDays),
        launchDate: launchDate ? new Date(launchDate) : null,
        imageUrl: imageUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      const { name, description, price, returnAmount, lockDays, launchDate, imageUrl, isActive } = req.body;
      const sp = await storage.updateStakingProduct(id, {
        name, description,
        price: price !== undefined ? parseInt(price) : undefined,
        returnAmount: returnAmount !== undefined ? parseInt(returnAmount) : undefined,
        lockDays: lockDays !== undefined ? parseInt(lockDays) : undefined,
        launchDate: launchDate ? new Date(launchDate) : (launchDate === null ? null : undefined),
        imageUrl, isActive,
      });
      res.json(sp);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/staking/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteStakingProduct(parseInt(getRouteParam(req.params.id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/staking/stakings", requireAdmin, async (req, res) => {
    try {
      const all = await storage.getAllUserStakings();
      res.json(all);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment Numbers (public — filtered by country)
  app.get("/api/payment-numbers", requireAuth, async (req, res) => {
    try {
      const country = typeof req.query.country === "string" ? req.query.country.trim().toUpperCase() : "";
      if (country) {
        const nums = await storage.getPaymentNumbersByCountry(country);
        return res.json(nums);
      }
      const nums = await storage.getPaymentNumbers();
      res.json(nums.filter(n => n.isActive));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Payment Numbers CRUD
  app.get("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const nums = await storage.getPaymentNumbers();
      res.json(nums);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/payment-numbers", requireAdmin, async (req, res) => {
    try {
      const { ownerName, phone, paymentLink, operatorName, country, logoUrl, isActive } = req.body;
      const normalizedLink = typeof paymentLink === "string" ? paymentLink.trim() : "";
      if (!ownerName || !operatorName || !country || (!phone && !normalizedLink)) {
        return res.status(400).json({ message: "Renseignez un numéro ou un lien de paiement" });
      }
      let normalizedPhone: string | null = null;
      if (!normalizedLink) {
        normalizedPhone = validatePhone(phone, "Numéro");
      } else {
        const parsedUrl = new URL(normalizedLink);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Le lien de paiement doit commencer par http:// ou https://");
        }
      }
      const num = await storage.createPaymentNumber({
        ownerName: String(ownerName).trim().slice(0, 100),
        phone: normalizedPhone,
        paymentLink: normalizedLink || null,
        operatorName: String(operatorName).trim().slice(0, 60),
        country: String(country).trim().toUpperCase(),
        logoUrl: logoUrl || null,
        isActive: isActive !== false,
        createdBy: req.session.userId,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      const { ownerName, phone, paymentLink, operatorName, country, logoUrl, isActive } = req.body;
      const normalizedLink = typeof paymentLink === "string" ? paymentLink.trim() : "";
      let normalizedPhone: string | null | undefined;
      if (normalizedLink) {
        const parsedUrl = new URL(normalizedLink);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error("Le lien de paiement doit commencer par http:// ou https://");
        }
        normalizedPhone = null;
      } else if (phone !== undefined) {
        normalizedPhone = phone ? validatePhone(phone, "Numéro") : null;
      }
      const num = await storage.updatePaymentNumber(id, {
        ownerName: ownerName === undefined ? undefined : String(ownerName).trim().slice(0, 100),
        phone: normalizedPhone,
        paymentLink: paymentLink === undefined ? undefined : (normalizedLink || null),
        operatorName: operatorName === undefined ? undefined : String(operatorName).trim().slice(0, 60),
        country: country === undefined ? undefined : String(country).trim().toUpperCase(),
        logoUrl, isActive,
      });
      res.json(num);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/payment-numbers/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentNumber(parseInt(getRouteParam(req.params.id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Deposits
  app.post("/api/deposits", requireAuth, async (req, res) => {
    try {
      const { amount, accountName, accountNumber, paymentMethod, country, paymentChannelId, useSoleaspay, useWestpay, usePpaypros, useInpay, inpayPhone, otpCode,
        paymentNumberId, channelName, screenshot, paymentMessage, reference } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "3500");
       const requestedAmount = typeof amount === "number" ? amount : Number(amount);
       if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
       }
       if (requestedAmount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} FCFA` });
      }
       if (
         useInpay === true &&
         (!Number.isInteger(requestedAmount) || requestedAmount % 5 !== 0)
       ) {
         return res.status(400).json({
           message: "Le montant InPay doit être un nombre entier multiple de 5 (ex. 300, 305 ou 310 FCFA)",
           inpay: true,
         });
       }

       const parsedDeposit = depositSchema.safeParse({
          amount: requestedAmount,
         accountName, accountNumber, paymentMethod, country,
         paymentChannelId: paymentChannelId === undefined ? undefined : Number(paymentChannelId),
       });
       if (!parsedDeposit.success) {
         return res.status(400).json({ message: parsedDeposit.error.errors[0]?.message || "Données invalides" });
       }
       if (screenshot !== undefined && screenshot !== null) {
         if (
           typeof screenshot !== "string" ||
           screenshot.length > 7_000_000 ||
           !/^data:image\/(?:jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(screenshot)
         ) {
           return res.status(400).json({ message: "Capture invalide ou trop volumineuse (7 Mo maximum)" });
         }
       }
       const normalizedDeposit = parsedDeposit.data;
       const hasManualPaymentNumber = paymentNumberId !== undefined && paymentNumberId !== null;
       let selectedPaymentNumber: Awaited<ReturnType<typeof storage.getPaymentNumber>> | undefined;
       if (hasManualPaymentNumber) {
         const parsedPaymentNumberId = Number(paymentNumberId);
         if (!Number.isInteger(parsedPaymentNumberId) || parsedPaymentNumberId <= 0) {
           return res.status(400).json({ message: "Numéro de paiement invalide" });
         }
         selectedPaymentNumber = await storage.getPaymentNumber(parsedPaymentNumberId);
         if (
           !selectedPaymentNumber ||
           !selectedPaymentNumber.isActive ||
           selectedPaymentNumber.country.toUpperCase() !== normalizedDeposit.country.toUpperCase()
         ) {
           return res.status(400).json({ message: "Ce numéro de paiement n'est plus disponible pour ce pays" });
         }
         if (!screenshot) {
           return res.status(400).json({ message: "La capture d'écran du paiement est requise" });
         }
       }

      const soleaspayEnabled = settings.soleaspayEnabled !== "false";
      const soleaspayCountries = settings.soleaspayCountries ? settings.soleaspayCountries.split(",").filter(Boolean) : [];
      const orderId = `JOLLIBEE-${Date.now()}-${user.id}`;
      
      // Only use Soleaspay when user explicitly chose the Soleaspay channel (Westpay)
      if (useSoleaspay && soleaspayEnabled) {
         if (!isSoleaspaySupported(normalizedDeposit.country, normalizedDeposit.paymentMethod)) {
          return res.status(400).json({
            message: `L'opérateur "${normalizedDeposit.paymentMethod}" n'est pas supporté par ce canal pour le pays "${normalizedDeposit.country}". Veuillez choisir un autre canal.`,
            soleaspay: true,
          });
        }
        try {
          const paymentResult = await initiatePayment(
            normalizedDeposit.accountNumber,
            normalizedDeposit.amount,
            normalizedDeposit.country,
            normalizedDeposit.paymentMethod,
            orderId,
            normalizedDeposit.accountName,
            `user${user.id}@intel.com`
          );

          if (paymentResult.success && paymentResult.data) {
            const deposit = await storage.createDeposit({
              userId: req.session.userId!,
             amount: normalizedDeposit.amount,
             accountName: normalizedDeposit.accountName,
             accountNumber: normalizedDeposit.accountNumber,
             country: normalizedDeposit.country,
             paymentMethod: normalizedDeposit.paymentMethod,
               paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
              status: "processing",
              soleaspayReference: paymentResult.data.reference,
              soleaspayOrderId: orderId,
            });

            return res.json({ 
              deposit,
              soleaspay: true,
              reference: paymentResult.data.reference,
              status: paymentResult.status,
              message: paymentResult.message
            });
          } else {
            return res.status(400).json({ 
              message: paymentResult.message || "Erreur Soleaspay",
              soleaspay: true
            });
          }
        } catch (soleaspayError: any) {
          console.error("[soleaspay] Payment error:", soleaspayError);
          return res.status(400).json({ 
            message: soleaspayError.message || "Erreur de paiement Soleaspay",
            soleaspay: true
          });
        }
      }

      // ── WestPay: redirect-based hosted-payment flow ─────────────────────────
      const westpayEnabledDeposit = settings.westpayEnabled === "true";
      if (useWestpay && westpayEnabledDeposit) {
        try {
          if (!process.env.WESTPAY_MERCHANT_SLUG) {
            return res.status(400).json({ message: "WestPay non configuré : la variable WESTPAY_MERCHANT_SLUG doit être définie sur le serveur", westpay: true });
          }
          const baseUrl = `${req.protocol}://${req.get("host")}`;
          // Create deposit to get an ID, then build the redirect URL
          const deposit = await storage.createDeposit({
            userId: req.session.userId!,
            amount: normalizedDeposit.amount,
            accountName: normalizedDeposit.accountName || user.fullName,
            accountNumber: normalizedDeposit.accountNumber || user.phone,
            country: normalizedDeposit.country,
            paymentMethod: "WestPay",
            paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
             status: "pending",
          });
          const callbackUrl = `${baseUrl}/api/westpay/callback?depositId=${deposit.id}`;
          const westpayUrl = westpayBuildUrl({
            amount: normalizedDeposit.amount,
            countryCode: normalizedDeposit.country,
            redirectUrl: callbackUrl,
          });
          return res.json({ deposit, westpayUrl, westpay: true });
        } catch (westpayError: any) {
          console.error("[westpay] deposit error:", westpayError);
          return res.status(400).json({ message: westpayError.message || "Erreur WestPay", westpay: true });
        }
      }

      // ── PPayPros: Benin hosted checkout, outside the RobotPay page ─────────
      if (usePpaypros === true) {
        if (settings.ppayprosPayinEnabled !== "true") {
          return res.status(403).json({ message: "Le dépôt PPayPros est désactivé.", ppaypros: true });
        }
        if (normalizedDeposit.country.toUpperCase() !== "BJ") {
          return res.status(400).json({ message: "PPayPros est activé uniquement pour le Bénin.", ppaypros: true });
        }
        if (user.country.toUpperCase() !== "BJ") {
          return res.status(400).json({ message: "PPayPros utilise le numéro béninois enregistré sur le compte.", ppaypros: true });
        }
        let ppayProsDepositId: number | null = null;
        try {
          const customerPhone = formatPpayProsBeninPhone(user.phone);
          const deposit = await storage.createDeposit({
            userId: user.id,
            amount: normalizedDeposit.amount,
            accountName: normalizedDeposit.accountName || user.fullName,
            accountNumber: customerPhone,
            country: "BJ",
            paymentMethod: "PPayPros",
            paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0
              ? normalizedDeposit.paymentChannelId
              : null,
            status: "pending",
          });
          ppayProsDepositId = deposit.id;
          const merchantOrderNo = createPpayProsMerchantOrderNo("payin", deposit.id);
          await storage.updateDeposit(deposit.id, { omnipayReference: merchantOrderNo });
          const baseUrl = getPublicBaseUrl(req);
          const payment = await createPpayProsPayin({
            merchantOrderNo,
            amountXof: normalizedDeposit.amount,
            customerName: normalizedDeposit.accountName || user.fullName,
            customerPhone,
            customerEmail: `user${user.id}@tonnew.app`,
            notifyUrl: `${baseUrl}/api/webhooks/ppaypros/payin`,
            returnUrl: `${baseUrl}/api/ppaypros/return?depositId=${deposit.id}`,
          });
          const payData = typeof payment.payData === "string" ? payment.payData : "";
          if (payment.payDataType !== "payUrl" || !payData) {
            await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
            return res.status(502).json({
              message: "PPayPros n'a pas renvoyé de lien de paiement pour ce dépôt.",
              ppaypros: true,
            });
          }
          let checkoutUrl: URL;
          try {
            checkoutUrl = new URL(payData);
          } catch {
            await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
            return res.status(502).json({ message: "PPayPros a renvoyé un lien de paiement invalide.", ppaypros: true });
          }
          if (checkoutUrl.protocol !== "https:") {
            await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
            return res.status(502).json({ message: "PPayPros a renvoyé un lien non sécurisé.", ppaypros: true });
          }
          await storage.updateDeposit(deposit.id, {
            omnipayId: payment.payOrderId ? String(payment.payOrderId) : null,
          });
          return res.json({ deposit, ppayprosUrl: checkoutUrl.toString(), ppaypros: true });
        } catch (ppayProsError: any) {
          if (ppayProsError instanceof PpayProsApiError && ppayProsError.providerRejected) {
            // A provider-declared rejection is definitive; transport errors remain pending
            // so a late notification can still be reconciled safely.
            if (ppayProsDepositId !== null) {
              await storage.claimDepositRejection(ppayProsDepositId);
            }
          }
          console.error("[ppaypros] payin error:", ppayProsError.message);
          return res.status(400).json({
            message: ppayProsError.message || "Erreur PPayPros",
            ppaypros: true,
          });
        }
      }

      // ── InPay: redirect-based hosted-payment flow ───────────────────────────
      const inpayEnabledDeposit = settings.inpayEnabled === "true";
      if (useInpay && inpayEnabledDeposit) {
        const normalizedCountry = normalizedDeposit.country.trim().toUpperCase();
        if (!isInpayCountryEnabled(normalizedCountry, settings)) {
          return res.status(400).json({ message: "InPay n'est pas activé pour ce pays", inpay: true });
        }
        if (!isInpayConfigured(normalizedCountry, settings)) {
          return res.status(400).json({
            message: `InPay n'est pas configuré pour ${normalizedCountry} : URL API, merchant ID ou clé API manquant`,
            inpay: true,
          });
        }
        const inpayPhoneValue = typeof inpayPhone === "string" && inpayPhone.trim()
          ? inpayPhone.trim()
          : normalizedDeposit.accountNumber || user.phone;
        const parsedInpayPhone = phoneNumberSchema.safeParse(inpayPhoneValue);
        if (!parsedInpayPhone.success) {
          return res.status(400).json({
            message: "Le numéro du compte est invalide",
            inpay: true,
          });
        }
        const inpayCustomerMobile = parsedInpayPhone.data;

        const inpayDeposit = await storage.createDeposit({
          userId: req.session.userId!,
          amount: normalizedDeposit.amount,
          accountName: normalizedDeposit.accountName || user.fullName,
          accountNumber: inpayCustomerMobile,
          country: normalizedCountry,
          paymentMethod: "InPay",
          paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
           status: "processing",
        });
        const outTradeNo = inpayCreateOutTradeNo("PAYIN", inpayDeposit.id, user.id);
        const account = getInpayAccount(normalizedCountry, settings);
        try {
          const result = await inpayCreatePayin({
            amount: normalizedDeposit.amount,
            country: normalizedCountry,
            merchantId: account.merchantId,
            apiKey: account.apiKey,
            customerName: normalizedDeposit.accountName || user.fullName,
            customerMobile: inpayCustomerMobile,
            customerEmail: `user${user.id}@tonnew.app`,
            notificationUrl: `${getPublicBaseUrl(req)}/api/webhooks/inpay`,
            outTradeNo,
          });
          const deposit = await storage.updateDeposit(inpayDeposit.id, {
           status: "processing",
            inpayOutTradeNo: outTradeNo,
            inpayOrderNumber: result.orderNumber,
          });
          return res.json({ deposit, inpayUrl: result.url, inpay: true });
        } catch (inpayError: any) {
          await storage.updateDeposit(inpayDeposit.id, { status: "rejected", processedAt: new Date() });
          void sendTelegramInpayError({
            operation: "Dépôt pay-in",
            error: inpayError,
            country: normalizedCountry,
            amount: normalizedDeposit.amount,
            reference: outTradeNo,
            recordId: inpayDeposit.id,
            orderNumber: outTradeNo,
            requestUrl: inpayError?.requestUrl,
            requestData: inpayError?.requestData,
          }).catch((notificationError) => {
            console.error("[telegram] InPay deposit error notification failed:", notificationError.message);
          });
          console.error("[inpay] payin error:", inpayError);
          return res.status(400).json({ message: inpayError.message || "Erreur InPay", inpay: true });
        }
      }

      const deposit = await storage.createDeposit({
        userId: req.session.userId!,
         amount: normalizedDeposit.amount,
         accountName: normalizedDeposit.accountName,
         accountNumber: normalizedDeposit.accountNumber,
         country: normalizedDeposit.country,
         paymentMethod: selectedPaymentNumber?.operatorName || normalizedDeposit.paymentMethod,
         paymentChannelId: normalizedDeposit.paymentChannelId && normalizedDeposit.paymentChannelId > 0 ? normalizedDeposit.paymentChannelId : null,
         paymentNumberId: selectedPaymentNumber?.id || null,
         channelName: selectedPaymentNumber
           ? `${selectedPaymentNumber.operatorName} - ${selectedPaymentNumber.paymentLink ? "Lien de paiement" : selectedPaymentNumber.phone}`
           : channelName || null,
        screenshot: screenshot || null,
        paymentMessage: paymentMessage || null,
        reference: reference || null,
         status: "pending",
      });

      res.json({ deposit, soleaspay: false });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Verify payment status (Soleaspay)
  app.get("/api/deposits/:id/verify", requireAuth, async (req, res) => {
    try {
      const depositId = parseInt(getRouteParam(req.params.id));
      const deposit = await storage.getDeposit(depositId);
      
      if (!deposit) {
        return res.status(404).json({ message: "Depot non trouve" });
      }

      if (deposit.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acces refuse" });
      }

      if (deposit.status === "approved") {
        return res.json({ status: deposit.status });
      }

      if (deposit.soleaspayReference && deposit.soleaspayOrderId) {
        try {
          const verifyResult = await verifyPayment(deposit.soleaspayOrderId, deposit.soleaspayReference);
          const newStatus = mapSoleaspayStatus(verifyResult.status);

          if (newStatus !== "pending" && newStatus !== deposit.status) {
            await storage.updateDeposit(depositId, { 
              status: newStatus,
              processedAt: new Date()
            });

            if (newStatus === "approved") {
              const user = await storage.getUser(deposit.userId);
              if (user) {
                const newBalance = parseFloat(user.balance) + deposit.amount;
                await storage.updateUser(deposit.userId, {
                  balance: newBalance.toFixed(2),
                  hasDeposited: true,
                });

                await storage.createTransaction({
                  userId: deposit.userId,
                  type: "deposit",
                  amount: deposit.amount.toString(),
                  description: `Depot Soleaspay #${deposit.id}`,
                });

                await storage.processDepositReferralCommissions(deposit.userId, deposit.amount);
              }

            }
          }

          return res.json({ 
            status: newStatus,
            soleaspay: true,
            soleaspayStatus: verifyResult.status,
            message: verifyResult.message
          });
        } catch (verifyError: any) {
          console.error("[soleaspay] Verify error:", verifyError);
          return res.json({ 
            status: deposit.status,
            soleaspay: true,
            error: "Erreur de verification"
          });
        }
      }

      return res.json({ status: deposit.status });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposits/history", requireAuth, async (req, res) => {
    try {
      const deposits = await storage.getUserDeposits(req.session.userId!);
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/drimpay/operators/:country", requireAuth, async (req, res) => {
    try {
      const country = getRouteParam(req.params.country).trim().toUpperCase();
      if (!isDrimPayConfigured() || !isDrimPayWebhookConfigured()) {
        return res.status(503).json({ message: "DrimPay n'est pas configuré sur le serveur" });
      }
      const settings = await storage.getSettings();
      if (!isDrimPayCountryEnabled(settings, "Payin", country)) {
        return res.status(403).json({ message: "DrimPay n'est pas activé pour ce pays" });
      }
      const countryRecord = (await storage.getActiveCountries()).find(
        (item) => item.code.toUpperCase() === country,
      );
      if (!countryRecord) return res.status(404).json({ message: "Pays indisponible" });

      const operators = drimPayOperatorsForCountry(
        country,
        parseDrimPayOperators(countryRecord.operators),
      ).map((operator) => ({ ...operator, provider: "drimpay" as const }));
      res.json({ country, operators });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Impossible de charger les opérateurs DrimPay" });
    }
  });

  app.post("/api/drimpay/payin", requireAuth, async (req, res) => {
    let depositId: number | undefined;
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });
      if (!isDrimPayConfigured() || !isDrimPayWebhookConfigured()) {
        return res.status(503).json({ message: "DrimPay n'est pas configuré sur le serveur" });
      }

      const settings = await storage.getSettings();
      const country = String(req.body?.country || "").trim().toUpperCase();
      if (!isDrimPayCountryEnabled(settings, "Payin", country)) {
        return res.status(403).json({ message: "Les dépôts DrimPay ne sont pas activés pour ce pays" });
      }

      const countryRecord = (await storage.getActiveCountries()).find(
        (item) => item.code.toUpperCase() === country,
      );
      if (!countryRecord) return res.status(400).json({ message: "Pays indisponible" });
      const configuredOperators = parseDrimPayOperators(countryRecord.operators);
      const operators = drimPayOperatorsForCountry(country, configuredOperators);
      const requestedOperator = String(req.body?.operator || req.body?.operatorName || "").trim();
      const operatorSlug = getDrimPayOperatorSlug(country, requestedOperator);
      const operator = operators.find((item) => item.id === operatorSlug);
      if (!operator) return res.status(400).json({ message: "Opérateur non disponible pour DrimPay dans ce pays" });

      const amount = Number(req.body?.amount);
      const minDeposit = Number.parseInt(settings.minDeposit || "3500", 10);
      if (!Number.isSafeInteger(amount) || amount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      if (amount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} FCFA` });
      }
      const phone = normalizeDrimPayPhone(String(req.body?.phone || ""), countryRecord.phonePrefix);
      const baseUrl = getPublicBaseUrl(req);
      if (!baseUrl.startsWith("https://")) {
        return res.status(400).json({ message: "DrimPay exige une URL webhook publique en HTTPS" });
      }

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: phone,
        country,
        paymentMethod: operator.name,
        status: "processing",
      });
      depositId = deposit.id;
      const orderId = createDrimPayReference("PAYIN", deposit.id);
      await storage.updateDeposit(deposit.id, { drimpayOrderId: orderId });

      const initiated = unwrapDrimPayResponse(await drimPayInitiatePayin({
        amount,
        currency: countryRecord.currency,
        country_code: country,
        operator: operator.id,
        phone,
        order_id: orderId,
        webhook_url: `${baseUrl}/api/webhooks/drimpay`,
        description: `Dépôt RobotPay #${deposit.id}`,
        expires_in_minutes: 5,
      }));
      const reference = typeof initiated.reference === "string" ? initiated.reference.trim() : "";
      if (!reference) {
        throw new Error("DrimPay n'a pas retourné de référence de transaction.");
      }
      await storage.updateDeposit(deposit.id, { drimpayReference: reference });
      const updated = await reconcileDrimPayDeposit(
        { ...deposit, drimpayOrderId: orderId, drimpayReference: reference },
        initiated,
      );
      const paymentUrl = getDrimPayWavePaymentUrl(country, operator.id, initiated.payment_url);
      const paymentLinkUnavailable = operator.id === "wave" && !paymentUrl;
      return res.status(202).json({
        depositId: deposit.id,
        reference,
        status: updated.status,
        paymentUrl: paymentUrl || null,
        paymentLinkUnavailable,
        message: paymentLinkUnavailable
          ? "Votre paiement est en cours de traitement. Veuillez patienter."
          : "",
      });
    } catch (error: any) {
      if (depositId && error instanceof DrimPayApiError && error.status >= 400 && error.status < 500) {
        await storage.claimDepositRejection(depositId).catch(() => undefined);
      }
      console.error("[drimpay] payin error:", error?.message || error);
      return res.status(error instanceof DrimPayApiError && error.status >= 400 && error.status < 500 ? 400 : 502)
        .json({ message: error.message || "Erreur DrimPay" });
    }
  });

  app.get("/api/deposits/:id/drimpay-status", requireAuth, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(Number.parseInt(getRouteParam(req.params.id), 10));
      if (!deposit || !deposit.drimpayOrderId) {
        return res.status(404).json({ message: "Dépôt DrimPay introuvable" });
      }
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Accès refusé" });
      return res.json({ status: deposit.status });
    } catch (error: any) {
      console.error("[drimpay] payin status error:", error?.message || error);
      return res.status(502).json({ message: error.message || "Impossible de vérifier le dépôt DrimPay" });
    }
  });

  // ── AshtechPay Direct API ───────────────────────────────────────────────────
  app.get("/api/ashtechpay/countries", requireAuth, async (_req, res) => {
    try {
      if (!isAshtechConfigured()) {
        return res.status(503).json({ message: "AshtechPay non configuré" });
      }
      res.json(await ashtechGetCountries());
    } catch (error: any) {
      console.error("[ashtechpay] countries error:", error);
      res.status(502).json({ message: error.message || "Impossible de charger les pays AshtechPay" });
    }
  });

  app.post("/api/ashtechpay/collect", requireAuth, async (req, res) => {
    try {
      const { amount, country, operator, phone, otp, depositId, reference: requestedReference } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const settings = await storage.getSettings();
      if (settings.ashtechEnabled !== "true") {
        return res.status(400).json({ message: "AshtechPay non activé" });
      }
      const numericAmount = Number(amount);
      const minDeposit = parseInt(settings.minDeposit || "3000");
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      const existingDeposit = depositId ? await storage.getDeposit(Number(depositId)) : undefined;
      if (existingDeposit && existingDeposit.userId !== user.id) {
        return res.status(403).json({ message: "Accès refusé" });
      }
      if (existingDeposit?.status === "approved") {
        return res.status(409).json({ message: "Ce dépôt est déjà confirmé" });
      }
      if (existingDeposit?.status === "rejected") {
        return res.status(409).json({ message: "Ce dépôt a déjà été refusé" });
      }
      if (numericAmount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} FCFA` });
      }
      if (!country || !operator || !phone) {
        return res.status(400).json({ message: "Pays, opérateur et numéro requis" });
      }

      const ashtechCountries = await ashtechGetCountries();
      const countryCode = String(country).trim().toUpperCase();
      const catalogCountry = ashtechCountries.find(
        (entry) => entry.code.toUpperCase() === countryCode,
      );
      if (!catalogCountry) {
        return res.status(400).json({ message: "Pays non pris en charge par AshtechPay" });
      }

      const requestedOperator = String(operator).trim();
      const operatorIsActive = catalogCountry.operators.some((entry) => {
        const operatorValue = typeof entry === "string"
          ? entry
          : entry.code || entry.id || entry.name || "";
        return operatorValue.trim().toLowerCase() === requestedOperator.toLowerCase();
      });
      if (!operatorIsActive) {
        return res.status(400).json({ message: "Opérateur non disponible pour ce pays" });
      }

      const generatedReference = `paget-studio-${Date.now()}-${user.id}`;
      const requestedAshtechReference = typeof requestedReference === "string"
        ? requestedReference.trim()
        : "";
      // AshtechPay requires the exact reference returned by an
      // `otp_required` response on the retry request. Preserve the reference
      // already stored on a deposit before generating a new one.
      const reference = existingDeposit?.ashtechReference?.trim()
        || requestedAshtechReference
        || generatedReference;
      const notifyBaseUrl = (
        process.env.ASHTECHPAY_WEBHOOK_BASE_URL ||
        process.env.PUBLIC_APP_URL ||
        getPublicBaseUrl(req)
      ).trim().replace(/\/+$/, "");
      if (!/^https:\/\//i.test(notifyBaseUrl)) {
        return res.status(400).json({
          message: "AshtechPay exige une URL webhook publique en HTTPS",
        });
      }
      const result = await ashtechCollect({
        amount: numericAmount,
        currency: catalogCountry.currency,
        phone: String(phone).trim(),
        operator: requestedOperator,
        countryCode,
        reference,
        notifyUrl: `${notifyBaseUrl}/api/webhooks/ashtechpay`,
        ...(otp ? { otp: String(otp).trim() } : {}),
      });

      const mappedStatus = mapAshtechStatus(result.status);
      const deposit = existingDeposit
        ? await storage.updateDeposit(existingDeposit.id, {
            // Keep successful responses claimable by the idempotent approval
            // gate below before crediting the wallet.
            status: mappedStatus === "approved" ? "processing" : mappedStatus,
            ashtechTransactionId: result.transaction_id || existingDeposit.ashtechTransactionId,
            ashtechReference: reference,
          })
        : await storage.createDeposit({
            userId: user.id,
            amount: numericAmount,
            accountName: user.fullName,
            accountNumber: String(phone).trim(),
            country: String(country).trim().toUpperCase(),
            paymentMethod: String(operator).trim(),
            status: mappedStatus === "approved" ? "processing" : mappedStatus,
            ashtechTransactionId: result.transaction_id,
            ashtechReference: reference,
          });

      if (mappedStatus === "approved") {
        const claimedDeposit = await storage.claimDepositApproval(deposit.id);
        if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
      }

      res.status(202).json({
        depositId: deposit.id,
        transactionId: result.transaction_id,
        reference,
        status: mappedStatus,
        requiresOtp: Boolean(result.ussd_code || result.message?.toLowerCase().includes("otp")),
        ussdCode: result.ussd_code || null,
        waveUrl: result.wave_url || null,
        flow: result.flow || null,
        message: result.message || null,
      });
    } catch (error: any) {
      if (error instanceof AshtechApiError && error.status === 400 && error.data?.error === "otp_required") {
        const {
          amount: requestedAmount,
          country: requestCountry,
          operator: requestOperator,
          phone: requestPhone,
           depositId: requestDepositId,
        } = req.body;
        const otpUser = await storage.getUser(req.session.userId!);
        if (!otpUser) return res.status(401).json({ message: "Non authentifié" });
        const otpAmount = Number(requestedAmount);
        const otpExistingDeposit = requestDepositId
          ? await storage.getDeposit(Number(requestDepositId))
          : undefined;
        if (otpExistingDeposit && otpExistingDeposit.userId !== otpUser.id) {
          return res.status(403).json({ message: "Accès refusé" });
        }
        const otpReference = String(error.data.reference || "").trim();
        if (!otpReference) {
          return res.status(400).json({ message: error.message || "Référence OTP AshtechPay manquante" });
        }

        const otpUssdCode = error.data.ussd_code
          || (requestCountry === "BF" && /orange/i.test(String(requestOperator)) ? `*144*4*6*${otpAmount}#` : null)
          || (requestCountry === "CI" && /orange/i.test(String(requestOperator)) ? "#144*82#" : null);
        const otpDeposit = otpExistingDeposit
          ? await storage.updateDeposit(otpExistingDeposit.id, { status: "pending", ashtechReference: otpReference })
          : await storage.createDeposit({
              userId: otpUser.id,
              amount: otpAmount,
              accountName: otpUser.fullName,
              accountNumber: String(requestPhone).trim(),
              country: String(requestCountry).trim().toUpperCase(),
              paymentMethod: String(requestOperator).trim(),
              status: "pending",
              ashtechReference: otpReference,
            });

        return res.status(400).json({
          error: "otp_required",
          message: error.message,
          depositId: otpDeposit.id,
          reference: otpReference,
          requiresOtp: true,
          ussdCode: otpUssdCode,
        });
      }
      const message = error.message || "Erreur AshtechPay";
      const errorUser = await storage.getUser(req.session.userId!);
      void sendTelegramMessage(
        [
          "❌ <b>Erreur de dépôt</b>",
          `Utilisateur : ${formatTelegramValue(errorUser?.fullName || "Inconnu")}`,
          `Montant : <b>${formatTelegramValue(req.body?.amount)} XOF</b>`,
          `Pays : ${formatTelegramValue(req.body?.country)}`,
          `Opérateur : ${formatTelegramValue(req.body?.operator)}`,
          `Erreur exacte : <code>${formatTelegramValue(message)}</code>`,
        ].join("\n"),
      ).catch((notificationError) => console.error("[telegram] deposit error notification failed:", notificationError.message));
      console.error("[ashtechpay] collect error:", message);
      res.status(400).json({ message });
    }
  });

  app.get("/api/deposits/:id/ashtechpay-status", requireAuth, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(parseInt(getRouteParam(req.params.id)));
      if (!deposit) return res.status(404).json({ message: "Dépôt non trouvé" });
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Accès refusé" });
      if (deposit.status === "approved") {
        return res.json({ status: deposit.status });
      }
      if (!deposit.ashtechTransactionId) return res.json({ status: deposit.status });

      const result = await ashtechGetTransaction(deposit.ashtechTransactionId);
      const newStatus = mapAshtechStatus(result.status);
      if (newStatus !== "pending" && newStatus !== deposit.status) {
        if (newStatus === "approved") {
          // The conditional update is the idempotency gate: only the request
          // that claims the pending deposit is allowed to credit the wallet.
          const claimedDeposit = await storage.claimDepositApproval(deposit.id);
          if (claimedDeposit) {
            const user = await storage.getUser(deposit.userId);
            if (user) {
              await storage.updateUser(user.id, {
                balance: (parseFloat(user.balance) + deposit.amount).toFixed(2),
                hasDeposited: true,
              });
              await storage.createTransaction({
                userId: user.id,
                type: "deposit",
                amount: deposit.amount.toString(),
                description: `Dépôt AshtechPay #${deposit.id}`,
              });
              await storage.processDepositReferralCommissions(user.id, deposit.amount);
            }
          }
        } else {
          await storage.updateDeposit(deposit.id, { status: newStatus, processedAt: new Date() });
        }
      }
      const finalDeposit = await storage.getDeposit(deposit.id);
      res.json({ status: finalDeposit?.status || newStatus, rawStatus: result.status });
    } catch (error: any) {
      console.error("[ashtechpay] status error:", error);
      res.status(502).json({ message: error.message || "Erreur de vérification AshtechPay" });
    }
  });

  // ── SendavaPay routes ──────────────────────────────────────────────────────

  // Proxy: operators for a given country (public SendavaPay endpoint)
  app.get("/api/sendavapay/operators/:country", requireAuth, async (req, res) => {
    try {
      const svCountry = toSendavapayCountry(getRouteParam(req.params.country));
      const r = await fetch(
        `https://sendavapay.com/api/sdk/v1/operators/${svCountry}`
      );
      const data = await r.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create payment (server-side, stores deposit record)
  app.post("/api/sendavapay/create", requireAuth, async (req, res) => {
    try {
      const { amount, country, operatorId, operatorName, payerPhone } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const settings = await storage.getSettings();
      if (settings.sendavapayEnabled !== "true") {
        return res.status(400).json({ message: "SendavaPay non activé" });
      }
      const minDeposit = parseInt(settings.minDeposit || "3000");
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Montant invalide" });
      }
      if (numericAmount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit.toLocaleString()} FCFA` });
      }
      if (!payerPhone || !payerPhone.trim()) {
        return res.status(400).json({ message: "Le numéro Mobile Money est requis" });
      }

      const svCountry = toSendavapayCountry(country);
      const currency = sendavapayGetCurrency(country);
      const externalRef = `DEP-${Date.now()}-${user.id}`;
      // Only use the number explicitly entered for this deposit; never reuse the profile phone.
      const customerPhone = sendavapayFormatPhone(payerPhone.trim(), country);
      const devDomain = process.env.REPLIT_DEV_DOMAIN;
      const baseUrl = devDomain ? `https://${devDomain}` : "https://sybotx.replit.app";
      const webhookUrl = `${baseUrl}/api/webhooks/sendavapay`;

      const result = await sendavapayCreate({
         amount: numericAmount,
        currency,
        description: `Dépôt #${externalRef}`,
        customerName: user.fullName,
        customerPhone,
        customerEmail: `user${user.id}@sybotx.app`,
        payerCountry: svCountry,
        webhookUrl,
        externalReference: externalRef,
      });

      if (!result.success || !result.data) {
        return res.status(400).json({
          message: result.error || "Erreur SendavaPay",
        });
      }

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: customerPhone,
        country,
        paymentMethod: operatorName || "SendavaPay",
        status: "processing",
        sendavapayReference: result.data.reference,
        sendavapayToken: result.data.paymentToken,
      });

      res.json({
        depositId: deposit.id,
        paymentToken: result.data.paymentToken,
        reference: result.data.reference,
        expiresAt: result.data.expiresAt,
      });
    } catch (error: any) {
      console.error("[sendavapay] create error:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Initiate payment (proxy, calls CORS endpoint on behalf of authenticated user)
  app.post("/api/sendavapay/initiate", requireAuth, async (req, res) => {
    try {
      const { paymentToken, payerCountry, operatorId, depositId, payerPhone } = req.body;
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });
      if (!payerPhone || !payerPhone.trim()) {
        return res.status(400).json({ message: "Le numéro Mobile Money est requis" });
      }

      const svCountry = toSendavapayCountry(payerCountry);
      const customerPhone = sendavapayFormatPhone(payerPhone.trim(), payerCountry);

      const result = await sendavapayInitiate({
        paymentToken,
        payerName: user.fullName,
        payerPhone: customerPhone,
        payerCountry: svCountry,
        operatorId,
      });

      // Update deposit status to processing
      if (depositId) {
        await storage.updateDeposit(depositId, { status: "processing" });
      }

      res.json(result);
    } catch (error: any) {
      console.error("[sendavapay] initiate error:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Submit OTP — CLIENT (CORS) endpoint, no SDK key
  app.post("/api/sendavapay/submit-otp", requireAuth, async (req, res) => {
    try {
      const { otpToken, otp } = req.body;
      if (!otpToken || !otp) {
        return res.status(400).json({ message: "otpToken et otp requis" });
      }
      const result = await sendavapaySubmitOtp({ otpToken, otp });
      res.json(result);
    } catch (error: any) {
      console.error("[sendavapay] submit-otp error:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Retry a failed payment — CLIENT (CORS) endpoint, no SDK key
  app.post("/api/sendavapay/retry", requireAuth, async (req, res) => {
    try {
      const { paymentToken, depositId } = req.body;
      if (!paymentToken) {
        return res.status(400).json({ message: "paymentToken requis" });
      }
      // Reset deposit status to processing
      if (depositId) {
        await storage.updateDeposit(depositId, { status: "processing" });
      }
      const result = await sendavapayRetry(paymentToken);
      res.json(result);
    } catch (error: any) {
      console.error("[sendavapay] retry error:", error);
      res.status(500).json({ message: error.message || "Erreur serveur" });
    }
  });

  // Poll payment status using GET /payment-status/:reference (lighter than verify-payment)
  app.get("/api/deposits/:id/sendavapay-status", requireAuth, async (req, res) => {
    try {
      const depositId = parseInt(getRouteParam(req.params.id));
      const deposit = await storage.getDeposit(depositId);
      if (!deposit) return res.status(404).json({ message: "Dépôt non trouvé" });
      if (deposit.userId !== req.session.userId) return res.status(403).json({ message: "Accès refusé" });

      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.json({ status: deposit.status });
      }

      if (!deposit.sendavapayReference) {
        return res.json({ status: deposit.status });
      }

      // Use lightweight GET payment-status endpoint for polling
      const statusRes = await fetch(
        `${process.env.SENDAVAPAY_API_BASE || "https://sendavapay.com/api/sdk/v1"}/payment-status/${deposit.sendavapayReference}`,
        { headers: { Authorization: `Bearer ${process.env.SENDAVAPAY_API_KEY || ""}` } }
      );
      const statusData = await statusRes.json() as { success: boolean; data?: { status: string } };

      if (!statusData.success || !statusData.data) {
        return res.json({ status: deposit.status });
      }

      const newStatus = mapSendavapayStatus(statusData.data.status);
      if (newStatus !== "pending" && newStatus !== deposit.status) {
        if (newStatus === "approved") {
          const claimedDeposit = await storage.claimDepositApproval(depositId);
          if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
        } else {
          await storage.updateDeposit(depositId, { status: newStatus, processedAt: new Date() });
        }
      }

      res.json({ status: newStatus || deposit.status, rawStatus: statusData.data.status });
    } catch (error: any) {
      console.error("[sendavapay] status check error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/webhooks/drimpay", async (req, res) => {
    try {
      if (!isDrimPayWebhookConfigured()) {
        return res.status(503).json({ message: "Webhook DrimPay non configuré" });
      }
      const rawBody = (req as any).rawBody as Buffer | undefined;
      const signature = String(req.headers["x-drimpay-signature"] || "");
      const timestamp = String(req.headers["x-drimpay-timestamp"] || "");
      const secret = getDrimPayWebhookSecret();
      if (!verifyDrimPayWebhookSignature(rawBody, signature, secret, timestamp || undefined)) {
        return res.status(401).json({ message: "Signature DrimPay invalide" });
      }

      const rawPayload = req.body && typeof req.body === "object"
        ? req.body as Record<string, any>
        : {};
      const payload = unwrapDrimPayResponse(rawPayload);
      const event = String(
        payload.event || req.headers["x-drimpay-event"] || "",
      ).trim().toLowerCase();
      const callbackStatus = String(payload.status || event.split(".")[1] || "").trim().toLowerCase();
      if (!event.startsWith("payin.") && !event.startsWith("payout.")) {
        return res.status(400).json({ message: "Événement DrimPay inconnu" });
      }

      if (event.startsWith("payout.")) {
        const providerReference = String(payload.reference || "").trim();
        const externalReference = String(payload.external_ref || payload.order_id || "").trim();
        if (!providerReference && !externalReference) {
          return res.status(400).json({ message: "Référence de retrait DrimPay manquante" });
        }
        const withdrawal = (
          providerReference
            ? await storage.getWithdrawalByDrimPayReference(providerReference)
            : undefined
        ) || await storage.getWithdrawalByDrimPayReference(externalReference);
        if (!withdrawal) return res.status(200).json({ received: true });
        await reconcileDrimPayPayout(withdrawal, { ...payload, status: callbackStatus });
        return res.status(200).json({ received: true });
      }

      const providerReference = String(payload.reference || "").trim();
      const orderId = String(payload.order_id || payload.external_ref || "").trim();
      if (!providerReference && !orderId) {
        return res.status(400).json({ message: "Référence de dépôt DrimPay manquante" });
      }
      const deposit = (
        providerReference
          ? await storage.getDepositByDrimPayReference(providerReference)
          : undefined
      ) || (
        orderId
          ? await storage.getDepositByDrimPayOrderId(orderId)
          : undefined
      );
      if (!deposit) return res.status(200).json({ received: true });
      await reconcileDrimPayDeposit(deposit, { ...payload, status: callbackStatus });
      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error("[drimpay webhook] processing error:", error?.message || error);
      return res.status(400).json({ message: error.message || "Webhook DrimPay invalide" });
    }
  });

  // AshtechPay Direct API webhook (HMAC-SHA256 verified).
  app.post("/api/webhooks/ashtechpay", async (req, res) => {
    try {
      if (!isAshtechConfigured()) {
        return res.status(503).json({ message: "AshtechPay non configuré" });
      }

      const settings = await storage.getSettings();
      const webhookSecret =
        process.env.ASHTECHPAY_WEBHOOK_SECRET ||
        process.env.ASHTECH_WEBHOOK_SECRET ||
        settings.ashtechWebhookSecret ||
        "";
      if (!webhookSecret) {
        console.error("[ashtechpay webhook] Webhook secret non configuré");
        return res.status(503).json({ message: "Webhook AshtechPay non configuré" });
      }

      const rawBody = (req as any).rawBody as Buffer | undefined;
      const timestamp = String(req.headers["x-ashtech-timestamp"] || "");
      const signature = String(req.headers["x-ashtech-signature"] || "");
      const timestampSeconds = Number(timestamp);
      const timestampIsFresh =
        Number.isFinite(timestampSeconds) &&
        Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) <= 5 * 60;
      if (
        !rawBody ||
        !timestampIsFresh ||
        !verifyAshtechWebhookSignature(rawBody, timestamp, signature, webhookSecret)
      ) {
        console.warn("[ashtechpay webhook] Signature invalide ou horodatage expiré");
        return res.status(401).json({ message: "Signature invalide" });
      }

      const payload = req.body || {};
      const reference = String(payload.reference || payload.data?.reference || "").trim();
      const transactionId = String(
        payload.transaction_id || payload.transactionId || payload.data?.transaction_id || payload.data?.transactionId || "",
      ).trim();
      const event = String(payload.event || "").toLowerCase();
      const rawStatus = String(payload.status || payload.data?.status || "").toLowerCase();

      // Acknowledge only after authenticating the delivery. The fulfillment
      // itself remains idempotent through claimDepositApproval.
      res.status(200).json({ received: true });

      let deposit = transactionId
        ? await storage.getDepositByAshtechTransactionId(transactionId)
        : undefined;
      if (!deposit && reference) {
        deposit = await storage.getDepositByAshtechReference(reference);
      }
      if (!deposit || deposit.status === "approved" || deposit.status === "rejected") return;

      if (event === "payment.failed" || ["failed", "expired", "cancelled", "canceled", "rejected"].includes(rawStatus)) {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
        return;
      }

      if (!deposit.ashtechTransactionId) return;
      const verified = await ashtechGetTransaction(deposit.ashtechTransactionId);
      const verifiedStatus = mapAshtechStatus(verified.status);
      if (verifiedStatus === "approved") {
        const claimedDeposit = await storage.claimDepositApproval(deposit.id);
        if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
      } else if (verifiedStatus === "rejected") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }
    } catch (error: any) {
      console.error("[ashtechpay webhook] verification error:", error);
      // The delivery was authenticated and already acknowledged. Reconciliation
      // will retry the provider status check independently.
    }
  });

  app.post(
    "/api/webhooks/sendavapay",
    async (req, res) => {
      try {
        const settings = await storage.getSettings();
        // Prefer the deployment secret; keep the admin setting as a
        // backwards-compatible fallback for existing installations.
        const secret = process.env.SENDAVAPAY_WEBHOOK_SECRET || settings.sendavapayWebhookSecret || "";
        if (!secret) {
          console.error("[sendavapay webhook] Webhook secret not configured");
          return res.status(503).json({ message: "Webhook secret non configuré" });
        }
        const sig = req.headers["x-sendavapay-signature"] as string || "";
        // req.rawBody is captured by the global express.json verify callback
        const rawBuf = (req as any).rawBody as Buffer | undefined;
        if (secret && rawBuf && !sendavapayVerifySignature(rawBuf, sig, secret)) {
          console.warn("[sendavapay webhook] Invalid signature");
          return res.status(401).json({ message: "Invalid signature" });
        }

        const payload = req.body;
        const { event, reference, status } = payload;

        if (!reference) return res.json({ received: true });

        // Find deposit by sendavapay reference
        const deposit = await storage.getDepositBySendavapayReference(reference);
        if (!deposit) {
          console.warn(`[sendavapay webhook] No deposit found for reference ${reference}`);
          return res.json({ received: true });
        }

        if (deposit.status === "approved" || deposit.status === "rejected") {
          return res.json({ received: true }); // already processed
        }

        if (event === "payment.completed" || status === "completed") {
          const claimedDeposit = await storage.claimDepositApproval(deposit.id);
          if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
        } else if (event === "payment.failed" || event === "payment.expired" || status === "failed" || status === "cancelled") {
          await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
        }

        res.json({ received: true });
      } catch (error: any) {
        console.error("[sendavapay webhook] error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  );

  // ── WestPay: payment callback (redirect after user pays on WestPay page) ────
  app.get("/api/westpay/callback", async (req, res) => {
    try {
      const { depositId, status, ref } = req.query as Record<string, string>;
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      if (!depositId) return res.redirect(`${baseUrl}/deposit?wp_status=error`);
      const deposit = await storage.getDeposit(parseInt(depositId));
      if (!deposit) return res.redirect(`${baseUrl}/deposit?wp_status=error`);
      // Persist the WestPay transaction reference; webhook will approve
      if (ref && (deposit.status === "pending" || deposit.status === "processing")) {
        await storage.updateDeposit(deposit.id, { westpayReference: ref });
      }
      const wpStatus = status === "success" ? "success" : "pending";
      res.redirect(`${baseUrl}/deposit?wp_status=${wpStatus}&wp_depositId=${depositId}`);
    } catch (err: any) {
      console.error("[westpay callback] error:", err);
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      res.redirect(`${baseUrl}/deposit?wp_status=error`);
    }
  });

  // ── WestPay webhook (HMAC-SHA256 via X-RobotPay-Signature) ──────────────────
  app.post(
    "/api/webhooks/westpay",
    async (req, res) => {
      try {
        const settings = await storage.getSettings();
        const secret = process.env.WESTPAY_WEBHOOK_SECRET || settings.westpayWebhookSecret || "";
        if (!secret) {
          console.error("[westpay webhook] Webhook secret not configured");
          return res.status(503).json({ message: "Webhook secret non configuré" });
        }
        const sig = (req.headers["x-robotpay-signature"] as string) || "";
        // req.rawBody is captured by the global express.json verify callback
        const rawBuf = (req as any).rawBody as Buffer | undefined;
        if (secret && rawBuf && !westpayVerifySignature(rawBuf, sig, secret)) {
          console.warn("[westpay webhook] Signature invalide");
          return res.status(401).json({ message: "Signature invalide" });
        }
        const payload = req.body;
        const { event, txId, status } = payload;
        const transactionReference =
          txId || payload.transactionId || payload.reference || payload.ref;
        if (!transactionReference) return res.json({ received: true });
        const deposit = await storage.getDepositByWestpayReference(transactionReference);
        if (!deposit) {
          console.warn(`[westpay webhook] Aucun dépôt pour référence: ${transactionReference}`);
          return res.json({ received: true });
        }
        if (deposit.status === "approved" || deposit.status === "rejected") {
          return res.json({ received: true });
        }
        if (event === "payment.confirmed" || status === "confirmed") {
          const claimedDeposit = await storage.claimDepositApproval(deposit.id);
          if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
        } else if (
          event === "payment.failed" ||
          event === "payment.expired" ||
          status === "failed" ||
          status === "expired" ||
          status === "cancelled"
        ) {
          await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
        }
        res.json({ received: true });
      } catch (err: any) {
        console.error("[westpay webhook] error:", err);
        res.status(500).json({ message: err.message });
      }
    }
  );

  // PPayPros returns the customer to the app, but only the signed notify callback
  // can approve a deposit.
  app.get("/api/ppaypros/return", (req, res) => {
    const depositId = Number(req.query.depositId);
    const suffix = Number.isSafeInteger(depositId) && depositId > 0
      ? `&ppaypros_depositId=${depositId}`
      : "";
    res.redirect(`${getPublicBaseUrl(req)}/deposit?ppaypros_status=returned${suffix}`);
  });

  app.post("/api/webhooks/ppaypros/payin", async (req, res) => {
    try {
      const credentials = getPpayProsCredentials();
      const payload = ppayProsCallbackPayload(req);
      if (
        payload.mchNo !== credentials.merchantNo ||
        payload.appId !== credentials.appId ||
        !verifyPpayProsSignature(payload, payload.sign, credentials.privateKey)
      ) {
        return res.status(401).type("text/plain").send("invalid signature");
      }

      const merchantOrderNo = String(payload.mchOrderNo || "");
      const depositId = parsePpayProsMerchantOrderNo("payin", merchantOrderNo);
      if (!depositId) return res.status(400).type("text/plain").send("invalid order");

      const deposit = await storage.getDeposit(depositId);
      if (
        !deposit ||
        deposit.paymentMethod !== "PPayPros" ||
        deposit.country.toUpperCase() !== "BJ" ||
        deposit.omnipayReference !== merchantOrderNo
      ) {
        return res.status(404).type("text/plain").send("deposit not found");
      }
      if (Number(payload.amount) !== toPpayProsAmount(deposit.amount)) {
        return res.status(400).type("text/plain").send("amount mismatch");
      }
      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.type("text/plain").send("success");
      }

      const state = Number(payload.state);
      if (state === 2) {
        const claimedDeposit = await storage.claimDepositApproval(deposit.id);
        if (claimedDeposit) await creditApprovedDeposit(claimedDeposit);
      } else if (state === 3) {
        await storage.claimDepositRejection(deposit.id);
      }
      return res.type("text/plain").send("success");
    } catch (error: any) {
      console.error("[ppaypros] payin callback error:", error.message);
      return res.status(500).type("text/plain").send("failed");
    }
  });

  app.post("/api/webhooks/ppaypros/payout", async (req, res) => {
    try {
      const credentials = getPpayProsCredentials();
      const payload = ppayProsCallbackPayload(req);
      if (
        payload.mchNo !== credentials.merchantNo ||
        payload.appId !== credentials.appId ||
        !verifyPpayProsSignature(payload, payload.sign, credentials.privateKey)
      ) {
        return res.status(401).type("text/plain").send("invalid signature");
      }

      const merchantOrderNo = String(payload.mchOrderNo || "");
      const withdrawalId = parsePpayProsMerchantOrderNo("payout", merchantOrderNo);
      if (!withdrawalId) return res.status(400).type("text/plain").send("invalid order");
      const withdrawal = await storage.getWithdrawal(withdrawalId);
      if (
        !withdrawal ||
        withdrawal.country.toUpperCase() !== "BJ" ||
        withdrawal.omnipayReference !== merchantOrderNo
      ) {
        return res.status(404).type("text/plain").send("withdrawal not found");
      }
      if (Number(payload.amount) !== toPpayProsAmount(withdrawal.netAmount)) {
        return res.status(400).type("text/plain").send("amount mismatch");
      }

      await reconcilePpayProsPayout(
        withdrawal,
        merchantOrderNo,
        payload.state,
        payload.transferId ? String(payload.transferId) : undefined,
      );
      return res.type("text/plain").send("success");
    } catch (error: any) {
      console.error("[ppaypros] payout callback error:", error.message);
      return res.status(500).type("text/plain").send("failed");
    }
  });

  // ── InPay webhooks (POST application/x-www-form-urlencoded, MD5 signature) ──
  app.post("/api/webhooks/inpay", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const payload = (req.body || {}) as Record<string, unknown>;
      const account = inpayFindVerifiedAccount(payload, settings);
      if (!account) {
        console.warn("[inpay webhook] Signature invalide ou merchant inconnu");
        return res.status(401).send("fail");
      }

      const outTradeNo = String(payload.out_trade_no || "");
      if (!outTradeNo) return res.send("success");

      // Both callback formats can contain order_number. Use our own reference
      // prefix first so a payin callback can never be mistaken for a payout.
      const callbackType = String(payload.type || payload.trade_type || "").toLowerCase();
      const callbackStatus = String(payload.status || "").toLowerCase();
      const isPayout =
        outTradeNo.startsWith("PAYOUT-") ||
        callbackType.includes("payout") ||
        callbackStatus.startsWith("payout");
      if (isPayout) {
        const withdrawal = await storage.getWithdrawalByInpayOutTradeNo(outTradeNo);
        if (!withdrawal) return res.send("success");

        const status = mapInpayPayoutStatus(payload.status || payload.trade_status || payload.result);
        if (status === "approved") {
          await storage.claimWithdrawalFinalization(withdrawal.id, "approved");
        } else if (status === "rejected" || String(payload.is_reverse) === "2") {
          const claimed = await storage.claimWithdrawalFinalization(withdrawal.id, "rejected");
          if (claimed) await refundRejectedWithdrawal(claimed);
        }
        return res.send("success");
      }

      const deposit = await storage.getDepositByInpayOutTradeNo(outTradeNo);
      if (!deposit) return res.send("success");

      const status = mapInpayPayinStatus(payload.status || payload.trade_status || payload.result);
      if (status === "approved") {
        const claimed = await storage.claimDepositApproval(deposit.id);
        if (claimed) await creditApprovedDeposit(claimed);
      } else if (status === "rejected") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }
      return res.send("success");
    } catch (error: any) {
      console.error("[inpay webhook] error:", error);
      return res.status(500).send("fail");
    }
  });

  // Withdrawals
  app.post("/api/withdrawal-fee/prepare", (_req, res) => {
    res.status(410).json({ message: "Le prépaiement des retraits n'est plus disponible." });
  });

  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const result = await requestWithdrawal(
        req.session.userId!,
        req.body?.amount,
        storage,
        req.body?.walletId,
      );

      void sendTelegramMessage(
        [
          "💸 <b>Retrait lancé</b>",
          `Utilisateur : ${formatTelegramValue(result.user.fullName)}`,
          `Montant : <b>${formatTelegramValue(result.amount)} XOF</b>`,
          `Net après frais : ${formatTelegramValue(result.netAmount)} XOF`,
          `Méthode : ${formatTelegramValue(result.wallet.paymentMethod)}`,
          `Pays : ${formatTelegramValue(result.wallet.country)}`,
          `ID retrait : ${formatTelegramValue(result.withdrawal.id)}`,
        ].join("\n"),
      ).catch((error) => console.error("[telegram] withdrawal notification failed:", error.message));

      res.json(result.withdrawal);
    } catch (error: any) {
      res.status(error.statusCode || 400).json({ message: error.message });
    }
  });

  app.get("/api/withdrawals/history", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.session.userId!);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wallets
  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets(req.session.userId!);
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const parsedWallet = walletSchema.safeParse(req.body);
      if (!parsedWallet.success) {
        return res.status(400).json({ message: parsedWallet.error.errors[0]?.message || "Données invalides" });
      }
      const wallet = await storage.createWallet({
        userId: req.session.userId!,
        ...parsedWallet.data,
      });
      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wallets/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWallet(parseInt(getRouteParam(req.params.id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/wallets/:id/default", requireAuth, async (req, res) => {
    try {
      await storage.setDefaultWallet(req.session.userId!, parseInt(getRouteParam(req.params.id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Team
  app.get("/api/team/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getTeamStats(req.session.userId!);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/team/details", requireAuth, async (req, res) => {
    try {
      const team = await storage.getDetailedTeam(req.session.userId!);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tasks
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksWithStatus(req.session.userId!);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/:id/claim", requireAuth, async (req, res) => {
    try {
      await storage.claimTask(req.session.userId!, parseInt(getRouteParam(req.params.id)));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Daily bonus claim (50 FCFA every 24h)
  app.post("/api/claim-daily-bonus", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceClaim);
          return res.status(400).json({ 
            message: `Vous pouvez reclamer dans ${hoursRemaining}h`,
            canClaim: false,
            nextClaimIn: hoursRemaining
          });
        }
      }

      // Add 50 FCFA to balance
      const newBalance = parseFloat(user.balance) + 50;
      await storage.updateUser(user.id, { 
        balance: newBalance.toString(),
        lastDailyBonusClaim: now
      });

      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: "bonus",
        amount: "50",
        description: "Bonus quotidien"
      });

      res.json({ success: true, message: "Bonus de 50 FCFA ajoute!" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/daily-bonus-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      let canClaim = true;
      let hoursRemaining = 0;

      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          canClaim = false;
          hoursRemaining = Math.ceil(24 - hoursSinceClaim);
        }
      }

      const allTransactions = await storage.getUserTransactions(req.session.userId!);
      const bonusTransactions = allTransactions.filter(
        (t: any) => t.type === "bonus" && t.description === "Bonus quotidien"
      );
      const totalBonusClaimed = bonusTransactions.reduce(
        (sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0
      );
      const daysPointed = bonusTransactions.length;

      res.json({ canClaim, hoursRemaining, totalBonusClaimed, daysPointed });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.session.userId!);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(publicSettings(settings));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/links", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        supportLink: settings.supportLink || "https://t.me/intelappgroup",
        support2Link: settings.support2Link || "https://t.me/intelappgroup",
        channelLink: settings.channelLink || "https://t.me/intelappgroup",
        groupLink: settings.groupLink || "https://t.me/intelappgroup",
        supportType: settings.supportType || "telegram",
        support2Type: settings.support2Type || "telegram",
        channelType: settings.channelType || "telegram",
        groupType: settings.groupType || "telegram",
        supportEnabled: settings.supportEnabled !== "false",
        support2Enabled: settings.support2Enabled !== "false",
        channelEnabled: settings.channelEnabled !== "false",
        groupEnabled: settings.groupEnabled !== "false",
        supportLabel: settings.supportLabel || "Service client",
        support2Label: settings.support2Label || "Service client 2",
        channelLabel: settings.channelLabel || "Chaîne officielle",
        groupLabel: settings.groupLabel || "Groupe de discussion",
        withdrawalStartHour: settings.withdrawalStartHour || "9",
        withdrawalEndHour: settings.withdrawalEndHour || "17",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/withdrawal", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        withdrawalFees: parseFloat(settings.withdrawalFees || "18"),
        withdrawalStartHour: parseInt(settings.withdrawalStartHour || "9"),
        withdrawalEndHour: parseInt(settings.withdrawalEndHour || "17"),
        maxWithdrawalsPerDay: parseInt(settings.maxWithdrawalsPerDay || "1"),
        minWithdrawal: parseInt(settings.minWithdrawal || "1000"),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await storage.getStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const deposits = await storage.getDeposits(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? deposits : deposits.filter(d => d.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/drimpay/status", requireAdmin, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(Number.parseInt(getRouteParam(req.params.id), 10));
      if (!deposit || !deposit.drimpayOrderId) {
        return res.status(404).json({ message: "Dépôt DrimPay introuvable" });
      }
      if (deposit.status === "approved") {
        return res.json({ status: deposit.status });
      }
      if (!deposit.drimpayReference || !isDrimPayConfigured()) {
        return res.status(400).json({ message: "Référence ou configuration DrimPay manquante" });
      }
      const providerStatus = await drimPayGetPayin(deposit.drimpayReference);
      const normalizedProviderStatus = mapDrimPayStatus(unwrapDrimPayResponse(providerStatus).status);
      const updated = await reconcileDrimPayDeposit(deposit, providerStatus);
      return res.json({ status: updated.status, providerStatus: normalizedProviderStatus });
    } catch (error: any) {
      console.error("[drimpay] admin payin status error:", error?.message || error);
      return res.status(502).json({ message: error.message || "Impossible de vérifier le dépôt DrimPay" });
    }
  });

  app.get("/api/admin/deposits/soleaspay-stats", requireAdmin, async (req, res) => {
    try {
      const allDeposits = await storage.getDeposits();
      const soleaspayDeposits = allDeposits.filter((d: any) => d.soleaspayReference || d.soleaspayOrderId);

      const approvedSoleaspay = soleaspayDeposits.filter((d: any) => d.status === "approved");
      const totalAll = approvedSoleaspay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countAll = approvedSoleaspay.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = approvedSoleaspay.filter((d: any) => new Date(d.createdAt) >= today);
      const totalToday = approvedToday.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countToday = approvedToday.length;

      const pendingSoleaspay = soleaspayDeposits.filter((d: any) => d.status === "pending" || d.status === "processing");
      const totalPending = pendingSoleaspay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countPending = pendingSoleaspay.length;

      res.json({
        totalAll,
        countAll,
        totalToday,
        countToday,
        totalPending,
        countPending,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/approve", requireAdmin, async (req, res) => {
    try {
      const deposit = await storage.claimAdminDepositApproval(parseInt(getRouteParam(req.params.id)), req.session.userId!);
      if (!deposit) return res.status(409).json({ message: "Ce dépôt est déjà approuvé" });
      if (deposit.drimpayOrderId) {
        await storage.clearDrimPayStatusCheckCount(deposit.id).catch(() => undefined);
      }

      const user = await storage.getUser(deposit.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + deposit.amount;
        await storage.updateUser(user.id, {
          balance: newBalance.toFixed(2),
          hasDeposited: true,
        });

        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: deposit.amount.toString(),
          description: "Dépôt validé",
        });
        await storage.processDepositReferralCommissions(deposit.userId, deposit.amount);
      }

      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé: ${deposit.amount}F`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/reject", requireAdmin, async (req, res) => {
    try {
      const { ban } = req.body;
      const deposit = await storage.updateDeposit(parseInt(getRouteParam(req.params.id)), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });
      if (deposit.drimpayOrderId) {
        await storage.clearDrimPayStatusCheckCount(deposit.id).catch(() => undefined);
      }

      if (ban) {
        await storage.updateUser(deposit.userId, { isBanned: true });
        await storage.logAdminAction(req.session.userId!, "ban_user", deposit.userId, `Utilisateur banni pour fraude`);
      }

      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/verify-pin", requireAuth, async (req, res) => {
    try {
      const { pin } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Acces refuse" });
      }
      
      // If password is not required for this admin, auto-verify
      if (user.isAdminPasswordRequired === false) {
        return res.json({ success: true });
      }

      if (!user.adminPin) {
        return res.status(400).json({ message: "Code PIN non configure" });
      }
      
      if (user.adminPin !== pin) {
        return res.status(401).json({ message: "Code PIN incorrect" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawals", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const withdrawals = await storage.getWithdrawals(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? withdrawals : withdrawals.filter(w => w.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(getRouteParam(req.params.id));
      const existingWithdrawal = await storage.getWithdrawals();
      const withdrawalData = existingWithdrawal.find(w => w.id === withdrawalId);
      
      if (!withdrawalData) {
        return res.status(404).json({ message: "Retrait non trouve" });
      }

      const withdrawal = await storage.updateWithdrawal(withdrawalId, {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé: ${withdrawalData.netAmount}F`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireAdmin, async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(parseInt(getRouteParam(req.params.id)), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      // Refund the user
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + withdrawal.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2) });
      }

      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/inpay", requireAdmin, async (req, res) => {
    try {
      const withdrawalId = parseInt(getRouteParam(req.params.id));
      const allWithdrawals = await storage.getWithdrawals();
      const withdrawal = allWithdrawals.find((item) => item.id === withdrawalId);
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      if (withdrawal.status !== "pending") {
        return res.status(409).json({ message: "Ce retrait a déjà été traité ou envoyé" });
      }

      const settings = await storage.getSettings();
      const country = withdrawal.country.trim().toUpperCase();
      if (!isInpayCountryEnabled(country, settings) || !isInpayConfigured(country, settings)) {
        return res.status(400).json({ message: `InPay n'est pas configuré pour ${country}` });
      }
      const account = getInpayAccount(country, settings);
      const bankCode = inpayResolveBankCode(country, withdrawal.paymentMethod);
      const outTradeNo = inpayCreateOutTradeNo("PAYOUT", withdrawal.id, withdrawal.userId);
      const result = await inpayCreatePayout({
        amount: withdrawal.netAmount,
        country,
        merchantId: account.merchantId,
        apiKey: account.apiKey,
        customerName: withdrawal.accountName,
        customerMobile: withdrawal.accountNumber,
        customerEmail: `user${withdrawal.userId}@tonnew.app`,
        bankCode,
        accountNumber: withdrawal.accountNumber,
        notificationUrl: `${getPublicBaseUrl(req)}/api/webhooks/inpay`,
        outTradeNo,
      });
      const updated = await storage.updateWithdrawal(withdrawal.id, {
        status: "processing",
        inpayOutTradeNo: outTradeNo,
        inpayOrderNumber: result.orderNumber || null,
      });
      await storage.logAdminAction(
        req.session.userId!,
        "send_withdrawal_to_inpay",
        withdrawal.userId,
        `Retrait ${withdrawal.id} envoyé à InPay (${country})`,
      );
      res.json(updated);
    } catch (error: any) {
      void sendTelegramInpayError({
        operation: "Retrait payout",
        error,
        recordId: getRouteParam(req.params.id),
      }).catch((notificationError) => {
        console.error("[telegram] InPay payout error notification failed:", notificationError.message);
      });
      console.error("[inpay] payout error:", error);
      res.status(400).json({ message: error.message || "Erreur d'envoi InPay" });
    }
  });

  app.post("/api/admin/withdrawals/:id/drimpay", requireAdmin, async (req, res) => {
    const withdrawalId = Number.parseInt(getRouteParam(req.params.id), 10);
    let externalRef: string | undefined;
    try {
      const withdrawal = await storage.getWithdrawal(withdrawalId);
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      if (withdrawal.status !== "pending") {
        return res.status(409).json({ message: "Ce retrait a déjà été traité ou envoyé." });
      }
      if (!isDrimPayConfigured() || !isDrimPayWebhookConfigured()) {
        return res.status(503).json({ message: "DrimPay n'est pas configuré sur le serveur" });
      }

      const settings = await storage.getSettings();
      const country = withdrawal.country.trim().toUpperCase();
      if (!isDrimPayCountryEnabled(settings, "Payout", country)) {
        return res.status(403).json({ message: `Les retraits DrimPay ne sont pas activés pour ${country}` });
      }
      const countryRecord = (await storage.getActiveCountries()).find(
        (item) => item.code.toUpperCase() === country,
      );
      if (!countryRecord) return res.status(400).json({ message: "Pays indisponible" });

      const operators = drimPayOperatorsForCountry(
        country,
        parseDrimPayOperators(countryRecord.operators),
      );
      const operatorSlug = getDrimPayOperatorSlug(country, withdrawal.paymentMethod);
      const operator = operators.find((item) => item.id === operatorSlug);
      if (!operator) {
        return res.status(400).json({ message: "Opérateur de retrait non disponible dans DrimPay" });
      }
      const phone = normalizeDrimPayPhone(withdrawal.accountNumber, countryRecord.phonePrefix);
      const baseUrl = getPublicBaseUrl(req);
      if (!baseUrl.startsWith("https://")) {
        return res.status(400).json({ message: "DrimPay exige une URL webhook publique en HTTPS" });
      }

      externalRef = `DRIMPAY-PAYOUT-${withdrawal.id}`;
      const claimed = await storage.claimDrimPayWithdrawal(withdrawal.id, externalRef);
      if (!claimed) return res.status(409).json({ message: "Ce retrait est déjà en cours de traitement." });

      const initiated = unwrapDrimPayResponse(await drimPayInitiatePayout({
        amount: withdrawal.netAmount,
        currency: countryRecord.currency,
        country_code: country,
        operator: operator.id,
        phone,
        external_ref: externalRef,
        webhook_url: `${baseUrl}/api/webhooks/drimpay`,
        description: `Retrait RobotPay #${withdrawal.id}`,
      }));
      if (initiated.external_ref && String(initiated.external_ref) !== externalRef) {
        throw new Error("DrimPay a retourné une référence externe différente.");
      }
      const providerReference = typeof initiated.reference === "string"
        ? initiated.reference.trim()
        : "";
      if (providerReference) {
        await storage.updateWithdrawal(withdrawal.id, { drimpayReference: providerReference });
      }
      const current = await storage.getWithdrawal(withdrawal.id);
      if (!current) throw new Error("Retrait introuvable après l'envoi DrimPay.");
      const updated = await reconcileDrimPayPayout(current, initiated);
      await storage.logAdminAction(
        req.session.userId!,
        "send_withdrawal_to_drimpay",
        withdrawal.userId,
        `Retrait ${withdrawal.id} envoyé à DrimPay (${country})`,
      );
      return res.json(updated);
    } catch (error: any) {
      if (
        externalRef &&
        error instanceof DrimPayApiError &&
        error.status >= 400 &&
        error.status < 500
      ) {
        await storage.releaseDrimPayWithdrawal(withdrawalId, externalRef).catch(() => undefined);
      }
      console.error("[drimpay] payout error:", error?.message || error);
      return res.status(error instanceof DrimPayApiError && error.status >= 400 && error.status < 500 ? 400 : 502)
        .json({
          message: error.message || "Erreur d'envoi DrimPay",
          statusCheckRequired: Boolean(externalRef) && !(error instanceof DrimPayApiError && error.status >= 400 && error.status < 500),
        });
    }
  });

  app.post("/api/admin/withdrawals/:id/drimpay/status", requireAdmin, async (req, res) => {
    try {
      const withdrawal = await storage.getWithdrawal(Number.parseInt(getRouteParam(req.params.id), 10));
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      if (!withdrawal.drimpayExternalRef && !withdrawal.drimpayReference) {
        return res.status(400).json({ message: "Ce retrait ne possède pas de référence DrimPay." });
      }
      if (!isDrimPayConfigured()) {
        return res.status(503).json({ message: "DrimPay n'est pas configuré sur le serveur" });
      }
      if (withdrawal.status === "approved" || withdrawal.status === "rejected") {
        return res.json(withdrawal);
      }
      const reference = withdrawal.drimpayReference || withdrawal.drimpayExternalRef!;
      const providerStatus = await drimPayGetPayout(reference);
      const updated = await reconcileDrimPayPayout(withdrawal, providerStatus);
      return res.json(updated);
    } catch (error: any) {
      console.error("[drimpay] payout status error:", error?.message || error);
      return res.status(502).json({ message: error.message || "Impossible de vérifier le retrait DrimPay." });
    }
  });

  app.post("/api/admin/withdrawals/:id/ppaypros", requireAdmin, async (req, res) => {
    const withdrawalId = parseInt(getRouteParam(req.params.id), 10);
    try {
      const withdrawal = await storage.getWithdrawal(withdrawalId);
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      if (withdrawal.status !== "pending") {
        return res.status(409).json({ message: "Ce retrait a déjà été traité ou envoyé." });
      }
      const settings = await storage.getSettings();
      if (settings.ppayprosPayoutEnabled !== "true") {
        return res.status(403).json({ message: "Les retraits PPayPros sont désactivés dans les paramètres." });
      }
      if (withdrawal.country.trim().toUpperCase() !== "BJ") {
        return res.status(400).json({ message: "PPayPros est activé uniquement pour les retraits du Bénin." });
      }

      // Validate configuration and the Benin phone before claiming the withdrawal.
      getPpayProsCredentials();
      const accountPhone = formatPpayProsBeninPhone(withdrawal.accountNumber);
      const amount = toPpayProsAmount(withdrawal.netAmount);
      const merchantOrderNo = createPpayProsMerchantOrderNo("payout", withdrawal.id);
      const claimed = await storage.claimPpayProsWithdrawal(withdrawal.id, merchantOrderNo);
      if (!claimed) {
        return res.status(409).json({ message: "Ce retrait est déjà en cours de traitement." });
      }

      try {
        const result = await createPpayProsPayout({
          merchantOrderNo,
          amountXof: withdrawal.netAmount,
          accountName: withdrawal.accountName,
          accountNumber: accountPhone,
          accountPhone,
          accountEmail: `user${withdrawal.userId}@tonnew.app`,
          notifyUrl: `${getPublicBaseUrl(req)}/api/webhooks/ppaypros/payout`,
        });
        if (result.mchOrderNo && String(result.mchOrderNo) !== merchantOrderNo) {
          throw new Error("PPayPros a renvoyé une référence de retrait différente.");
        }

        const transferId = result.transferId ? String(result.transferId) : undefined;
        if (transferId) {
          await storage.updateWithdrawal(withdrawal.id, { omnipayId: transferId });
        }
        let updated = await storage.getWithdrawal(withdrawal.id);
        if (updated && result.state !== undefined && result.state !== null) {
          updated = await reconcilePpayProsPayout(updated, merchantOrderNo, result.state, transferId) || updated;
        }
        await storage.logAdminAction(
          req.session.userId!,
          "send_withdrawal_to_ppaypros",
          withdrawal.userId,
          `Retrait ${withdrawal.id} envoyé à PPayPros (Bénin)`,
        );
        return res.json(updated);
      } catch (error: any) {
        if (error instanceof PpayProsApiError && error.providerRejected) {
          await storage.releasePpayProsWithdrawal(withdrawal.id, merchantOrderNo);
        }
        console.error("[ppaypros] payout error:", error.message);
        return res.status(502).json({
          message: error.message || "Erreur d'envoi PPayPros",
          statusCheckRequired: !(error instanceof PpayProsApiError && error.providerRejected),
        });
      }
    } catch (error: any) {
      console.error("[ppaypros] payout setup error:", error.message);
      return res.status(400).json({ message: error.message || "Erreur de configuration PPayPros" });
    }
  });

  app.post("/api/admin/withdrawals/:id/ppaypros/status", requireAdmin, async (req, res) => {
    const withdrawalId = parseInt(getRouteParam(req.params.id), 10);
    try {
      const withdrawal = await storage.getWithdrawal(withdrawalId);
      if (!withdrawal) return res.status(404).json({ message: "Retrait non trouvé" });
      const merchantOrderNo = createPpayProsMerchantOrderNo("payout", withdrawal.id);
      if (
        withdrawal.country.trim().toUpperCase() !== "BJ" ||
        withdrawal.omnipayReference !== merchantOrderNo
      ) {
        return res.status(400).json({ message: "Ce retrait ne possède pas de référence PPayPros." });
      }
      if (withdrawal.status === "approved" || withdrawal.status === "rejected") {
        return res.json(withdrawal);
      }

      const result = await queryPpayProsPayout({
        merchantOrderNo,
        transferId: withdrawal.omnipayId,
      });
      if (result.mchOrderNo && String(result.mchOrderNo) !== merchantOrderNo) {
        return res.status(502).json({ message: "PPayPros a renvoyé une autre référence de retrait." });
      }
      if (
        result.amount !== undefined &&
        Number(result.amount) !== toPpayProsAmount(withdrawal.netAmount)
      ) {
        return res.status(502).json({ message: "Le montant retourné par PPayPros ne correspond pas au retrait." });
      }
      const updated = await reconcilePpayProsPayout(
        withdrawal,
        merchantOrderNo,
        result.state,
        result.transferId ? String(result.transferId) : undefined,
      );
      return res.json(updated);
    } catch (error: any) {
      console.error("[ppaypros] payout status error:", error.message);
      return res.status(502).json({ message: error.message || "Impossible de vérifier le statut PPayPros." });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const search = (req.query.search as string) || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const { users: allUsers, total } = await storage.getAllUsers(search, limit, offset);
      const usersWithTeam = await Promise.all(allUsers.map(async (user) => {
        const teamStats = await storage.getTeamStatsSimple(user.id);
        return { ...user, password: undefined, ...teamStats, referrerName: null };
      }));
      res.json({ users: usersWithTeam, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/team", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(getRouteParam(req.params.id));
      const team = await storage.getDetailedTeam(userId);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/:action", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(getRouteParam(req.params.id));
      const action = getRouteParam(req.params.action);
      const { value } = req.body;
      const adminUser = await storage.getUser(req.session.userId!);

      switch (action) {
        case "balance":
          await storage.updateUser(userId, { balance: value.toFixed(2) });
          await storage.logAdminAction(req.session.userId!, "update_balance", userId, `Solde modifié: ${value}F`);
          break;
        case "password":
          await storage.updateUser(userId, { password: value });
          await storage.logAdminAction(req.session.userId!, "reset_password", userId, `Mot de passe réinitialisé`);
          break;
        case "toggle-ban":
          const user1 = await storage.getUser(userId);
          await storage.updateUser(userId, { isBanned: !user1?.isBanned });
          await storage.logAdminAction(req.session.userId!, "toggle_ban", userId, `Statut banni: ${!user1?.isBanned}`);
          break;
        case "toggle-withdrawal":
          const user2 = await storage.getUser(userId);
          await storage.updateUser(userId, { isWithdrawalBlocked: !user2?.isWithdrawalBlocked });
          await storage.logAdminAction(req.session.userId!, "toggle_withdrawal", userId, `Retrait bloqué: ${!user2?.isWithdrawalBlocked}`);
          break;
        case "toggle-promoter":
          const user3 = await storage.getUser(userId);
          await storage.updateUser(userId, { isPromoter: !user3?.isPromoter, promoterSetBy: req.session.userId });
          await storage.logAdminAction(req.session.userId!, "toggle_promoter", userId, `Promoteur: ${!user3?.isPromoter}`);
          break;
        case "toggle-must-invite":
          const user4 = await storage.getUser(userId);
          await storage.updateUser(userId, { mustInviteToWithdraw: !user4?.mustInviteToWithdraw });
          await storage.logAdminAction(req.session.userId!, "toggle_must_invite", userId, `Doit inviter: ${!user4?.mustInviteToWithdraw}`);
          break;
        case "toggle-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const user5 = await storage.getUser(userId);
          const newAdminStatus = !user5?.isAdmin;
          await storage.updateUser(userId, { 
            isAdmin: newAdminStatus,
            adminSetBy: req.session.userId,
            adminSetAt: new Date(),
            adminPin: newAdminStatus && value ? value : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_admin", userId, `Admin: ${newAdminStatus}`);
          break;
        case "update-admin-pin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { adminPin: value });
          await storage.logAdminAction(req.session.userId!, "update_admin_pin", userId, `PIN admin mis à jour`);
          break;
        case "toggle-password-required":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { isAdminPasswordRequired: value });
          await storage.logAdminAction(req.session.userId!, "toggle_password_required", userId, `Mot de passe admin requis: ${value}`);
          break;
        case "assign-product":
          await storage.purchaseProduct(userId, value, true);
          await storage.logAdminAction(req.session.userId!, "assign_product", userId, `Produit ${value} attribué`);
          break;
        case "revoke-product":
          await storage.removeUserProduct(userId, value);
          await storage.logAdminAction(req.session.userId!, "revoke_product", userId, `Produit ${value} révoqué`);
          break;
        case "toggle-super-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const userSA = await storage.getUser(userId);
          const newSuperAdminStatus = !userSA?.isSuperAdmin;
          await storage.updateUser(userId, {
            isSuperAdmin: newSuperAdminStatus,
            isAdmin: newSuperAdminStatus ? true : userSA?.isAdmin,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_super_admin", userId, `Super Admin: ${newSuperAdminStatus}`);
          break;
        case "toggle-banker":
          if (!adminUser?.isSuperAdmin && !adminUser?.isAdmin) {
            return res.status(403).json({ message: "Action réservée aux admins" });
          }
          const userBanker = await storage.getUser(userId);
          const newBankerStatus = !userBanker?.isBanker;
          await storage.updateUser(userId, { 
            isBanker: newBankerStatus,
            bankerSetBy: newBankerStatus ? req.session.userId : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_banker", userId, `Bankier: ${newBankerStatus}`);
          break;
        default:
          return res.status(400).json({ message: "Action invalide" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/products/all", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getAllProducts();
      const stockCounts = await storage.getProductStockCounts(allProducts.map((product) => product.id));
      res.json(allProducts.map((product) => ({
        ...product,
        stockCount: stockCounts[product.id] || 0,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/products", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(getRouteParam(req.params.id));
      const userProductsList = await storage.getAllUserProducts(userId);
      res.json(userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        productName: up.product.name,
        productPrice: up.product.price,
        dailyEarnings: up.product.dailyEarnings,
        payoutMode: up.userProduct.payoutMode,
        isActive: up.userProduct.isActive,
        purchaseDate: up.userProduct.purchaseDate,
        daysClaimed: up.product.cycleDays - up.userProduct.daysRemaining,
        totalCycle: up.product.cycleDays,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { name, price, dailyEarnings, cycleDays, imageUrl } = req.body;
      const priceInt = Number(price);
      const dailyInt = Number(dailyEarnings);
      const cycleInt = Number(cycleDays);
      if (typeof name !== "string" || name.trim().length < 2
        || !Number.isSafeInteger(priceInt) || priceInt <= 0
        || !Number.isSafeInteger(dailyInt) || dailyInt <= 0
        || !Number.isSafeInteger(cycleInt) || cycleInt <= 0
        || dailyInt * cycleInt > 2_147_483_647) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const product = await storage.createProduct({
        name: name.trim(),
        price: priceInt,
        dailyEarnings: dailyInt,
        cycleDays: cycleInt,
        totalReturn: dailyInt * cycleInt,
        imageUrl: imageUrl || null,
        productType: "stable",
        launchDate: null,
        launchTime: null,
        isFree: false,
        isActive: true,
        sortOrder: 0,
      });
      await storage.logAdminAction(req.session.userId!, "create_product", null, `Produit ${product.name} créé`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/products/bulk-activity", requireAdmin, async (req, res) => {
    try {
      const { launchDate, launchTime, products: submittedProducts } = req.body ?? {};
      if (!isValidLaunchSchedule(launchDate, launchTime)) {
        return res.status(400).json({ message: "La date et l’heure de lancement sont obligatoires et doivent être valides." });
      }
      if (!Array.isArray(submittedProducts) || submittedProducts.length < 1 || submittedProducts.length > 50) {
        return res.status(400).json({ message: "Le lot doit contenir entre 1 et 50 produits." });
      }

      const rows: Partial<Product>[] = [];
      for (const row of submittedProducts) {
        const name = typeof row?.name === "string" ? row.name.trim() : "";
        const price = Number(row?.price);
        const dailyEarnings = Number(row?.dailyEarnings);
        const cycleDays = Number(row?.cycleDays);
        const stockLimitInput = row?.stockLimit;
        const stockLimit = stockLimitInput == null || stockLimitInput === ""
          ? null
          : Number(stockLimitInput);
        if (name.length < 2
          || !Number.isSafeInteger(price) || price <= 0
          || !Number.isSafeInteger(dailyEarnings) || dailyEarnings <= 0
          || !Number.isSafeInteger(cycleDays) || cycleDays <= 0
          || (stockLimit !== null && (!Number.isSafeInteger(stockLimit) || stockLimit <= 0 || stockLimit > 2_147_483_647))
          || dailyEarnings * cycleDays > 2_147_483_647) {
          return res.status(400).json({ message: "Chaque produit doit avoir un nom, un prix, un gain journalier et une durée valides. La limite de places doit être un entier positif." });
        }

        rows.push({
          name,
          price,
          dailyEarnings,
          cycleDays,
          totalReturn: dailyEarnings * cycleDays,
          imageUrl: null,
          productType: "activity",
          launchDate,
          launchTime,
          stockLimit,
          isFree: false,
          isActive: true,
          sortOrder: 0,
        });
      }

      const createdProducts = await storage.createProducts(rows);
      await storage.logAdminAction(
        req.session.userId!,
        "create_activity_products",
        null,
        `${createdProducts.length} produit(s) d’activité créé(s), lancement local prévu le ${launchDate} à ${launchTime}`,
      );
      res.json(createdProducts);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      const existing = await storage.getProduct(id);
      if (!existing) return res.status(404).json({ message: "Produit non trouvé" });

      const body = req.body ?? {};
      const update: Partial<Product> = {};
      if (body.name !== undefined) {
        if (typeof body.name !== "string" || body.name.trim().length < 2) {
          return res.status(400).json({ message: "Le nom du produit est invalide." });
        }
        update.name = body.name.trim();
      }
      for (const field of ["price", "dailyEarnings", "cycleDays"] as const) {
        if (body[field] === undefined) continue;
        const value = Number(body[field]);
        if (!Number.isSafeInteger(value) || value <= 0) {
          return res.status(400).json({ message: "Le prix, le gain journalier et la durée doivent être des nombres entiers positifs." });
        }
        update[field] = value;
      }
      if (body.imageUrl !== undefined) {
        if (body.imageUrl !== null && typeof body.imageUrl !== "string") {
          return res.status(400).json({ message: "L’image du produit est invalide." });
        }
        update.imageUrl = typeof body.imageUrl === "string" && body.imageUrl.trim() ? body.imageUrl.trim() : null;
      }
      if (body.stockLimit !== undefined) {
        if (existing.productType !== "activity") {
          return res.status(400).json({ message: "La limite de places s’applique uniquement aux produits d’activité." });
        }
        if (body.stockLimit === null || body.stockLimit === "") {
          update.stockLimit = null;
        } else {
          const stockLimit = Number(body.stockLimit);
          if (!Number.isSafeInteger(stockLimit) || stockLimit <= 0 || stockLimit > 2_147_483_647) {
            return res.status(400).json({ message: "La limite de places doit être un entier positif." });
          }
          update.stockLimit = stockLimit;
        }
      }
      if (body.isActive !== undefined) {
        if (typeof body.isActive !== "boolean") return res.status(400).json({ message: "État du produit invalide." });
        update.isActive = body.isActive;
      }
      if (body.launchDate !== undefined || body.launchTime !== undefined) {
        if (existing.productType !== "activity") {
          return res.status(400).json({ message: "Seuls les produits d’activité ont une date de lancement." });
        }
        const launchDate = body.launchDate ?? existing.launchDate;
        const launchTime = body.launchTime ?? existing.launchTime;
        if (!isValidLaunchSchedule(launchDate, launchTime)) {
          return res.status(400).json({ message: "La date et l’heure de lancement sont invalides." });
        }
        update.launchDate = launchDate;
        update.launchTime = launchTime;
      }
      const nextDailyEarnings = update.dailyEarnings ?? existing.dailyEarnings;
      const nextCycleDays = update.cycleDays ?? existing.cycleDays;
      if (nextDailyEarnings * nextCycleDays > 2_147_483_647) {
        return res.status(400).json({ message: "Le gain total dépasse la limite autorisée." });
      }
      if (update.dailyEarnings !== undefined || update.cycleDays !== undefined) {
        update.totalReturn = nextDailyEarnings * nextCycleDays;
      }

      const product = await storage.updateProduct(id, update);
      await storage.logAdminAction(req.session.userId!, "update_product", null, `Produit ${product.id} modifié`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      const result = await storage.deleteProduct(id);
      await storage.logAdminAction(
        req.session.userId!,
        "delete_product",
        null,
        result.archived
          ? `Produit ${id} retiré du catalogue, historique conservé`
          : `Produit ${id} supprimé`,
      );
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channels = await storage.getPaymentChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.createPaymentChannel({
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "create_channel", null, `Canal ${channel.name} créé`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.updatePaymentChannel(parseInt(getRouteParam(req.params.id)), {
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "update_channel", null, `Canal ${channel.name} modifié`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentChannel(parseInt(getRouteParam(req.params.id)));
      await storage.logAdminAction(req.session.userId!, "delete_channel", null, `Canal supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(adminSettings(settings));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/drimpay/balance/:country", requireAdmin, async (req, res) => {
    const country = getRouteParam(req.params.country).trim().toUpperCase();
    try {
      if (!isDrimPayConfigured()) {
        return res.status(503).json({ message: "DrimPay n'est pas configuré sur le serveur" });
      }
      if (!isDrimPayCountry(country)) {
        return res.status(400).json({ message: "Pays non pris en charge par DrimPay" });
      }
      const result = unwrapDrimPayResponse(await drimPayGetBalance(country));
      if (result.balance === undefined || result.balance === null) {
        return res.status(502).json({ message: "DrimPay n'a pas retourné le solde du portefeuille." });
      }
      return res.json({
        country,
        balance: result.balance,
        currency: result.currency || "",
        active: result.active === true,
      });
    } catch (error: any) {
      console.error("[drimpay] balance error:", error?.message || error);
      return res.status(502).json({ message: error.message || "Impossible de consulter le solde DrimPay" });
    }
  });

  app.get("/api/admin/inpay/balance/:country", requireAdmin, async (req, res) => {
    const country = String(req.params.country).trim().toUpperCase();
    try {
      const settings = await storage.getSettings();
      if (!isInpayConfigured(country, settings)) {
        return res.status(400).json({ message: `InPay n'est pas configuré pour ${country}` });
      }
      const account = getInpayAccount(country, settings);
      const balance = await inpayGetBalance({
        merchantId: account.merchantId,
        apiKey: account.apiKey,
      });
      res.json({ country, name: inpayGetCountryName(country), balance });
    } catch (error: any) {
      void sendTelegramInpayError({
        operation: "Consultation du solde",
        error,
        country,
      }).catch((notificationError) => {
        console.error("[telegram] InPay balance error notification failed:", notificationError.message);
      });
      console.error("[inpay] balance error:", error);
      res.status(502).json({ message: error.message || "Impossible de consulter le solde InPay" });
    }
  });

  app.get("/api/admin/blocked-ips", requireAdmin, async (_req, res) => {
    try {
      res.json(await getCachedBlockedIps());
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/blocked-ips", requireAdmin, async (req, res) => {
    try {
      const ip = String(req.body?.ip || "").trim();
      const net = await import("net");
      if (!net.isIP(ip)) return res.status(400).json({ message: "Adresse IP invalide" });
      const blockedIps = [...await getCachedBlockedIps()];
      if (!blockedIps.includes(ip)) {
        blockedIps.push(ip);
        await storage.setSetting("blockedIps", JSON.stringify(blockedIps), req.session.userId);
        updateBlockedIpsCache(blockedIps);
      }
      await storage.logAdminAction(req.session.userId!, "block_ip", null, `Adresse IP bloquée: ${ip}`);
      res.json({ success: true, ip });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/blocked-ips/:ip", requireAdmin, async (req, res) => {
    try {
      const ip = decodeURIComponent(getRouteParam(req.params.ip));
      const blockedIps = await getCachedBlockedIps();
      const nextIps = blockedIps.filter((value) => value !== ip);
      await storage.setSetting("blockedIps", JSON.stringify(nextIps), req.session.userId);
      updateBlockedIpsCache(nextIps);
      await storage.logAdminAction(req.session.userId!, "unblock_ip", null, `Adresse IP débloquée: ${ip}`);
      res.json({ success: true, ip });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body);
      for (const [key, value] of entries) {
        if (!ADMIN_SETTING_KEYS.has(key)) continue;
        if (SENSITIVE_SETTING_KEYS.has(key) && (value === "" || value === MASKED_SETTING_VALUE)) continue;
        await storage.setSetting(key, value as string, req.session.userId);
      }
      await storage.logAdminAction(req.session.userId!, "update_settings", null, `Paramètres modifiés`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reset stats route (Super Admin only)
  app.post("/api/admin/reset-stats", requireAdmin, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser?.isSuperAdmin) {
        return res.status(403).json({ message: "Action réservée au super admin" });
      }

      await storage.resetStats();
      await storage.logAdminAction(req.session.userId!, "reset_stats", null, "Réinitialisation des statistiques de la plateforme");
      res.json({ success: true, message: "Statistiques réinitialisées" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Gift Codes Routes
  app.get("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllGiftCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const createGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
    amount: z.number().positive("Le montant doit etre positif").or(z.string().transform(Number)),
    maxUses: z.number().int().positive("Le nombre d'utilisations doit etre positif"),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Date d'expiration invalide"),
  });

  app.post("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const parseResult = createGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Donnees invalides" });
      }

      const { code, amount, maxUses, expiresAt } = parseResult.data;

      const existingCode = await storage.getGiftCodeByCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Ce code existe deja" });
      }

      const giftCode = await storage.createGiftCode({
        code,
        amount: amount.toString(),
        maxUses,
        expiresAt: new Date(expiresAt),
        createdBy: req.session.userId!,
      });

      await storage.logAdminAction(req.session.userId!, "create_gift_code", null, `Code cadeau cree: ${code} - ${amount} FCFA`);
      res.json(giftCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/gift-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      await storage.deleteGiftCode(id);
      await storage.logAdminAction(req.session.userId!, "delete_gift_code", null, `Code cadeau supprimé: #${id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const claimGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
  });

  app.post("/api/gift-codes/claim", requireAuth, async (req, res) => {
    try {
      const parseResult = claimGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Le code est requis" });
      }

      const code = parseResult.data.code.trim().toUpperCase();
      const userId = req.session.userId!;

      const giftCode = await storage.getGiftCodeByCode(code);
      if (!giftCode) {
        return res.status(404).json({ message: "Code invalide" });
      }

      if (!giftCode.isActive) {
        return res.status(400).json({ message: "Ce code n'est plus actif" });
      }

      if (new Date() > new Date(giftCode.expiresAt)) {
        return res.status(400).json({ message: "Ce code a expiré" });
      }

      if (giftCode.currentUses >= giftCode.maxUses) {
        return res.status(400).json({ message: "Ce code a atteint sa limite d'utilisation" });
      }

      const hasClaimed = await storage.hasUserClaimedGiftCode(userId, giftCode.id);
      if (hasClaimed) {
        return res.status(400).json({ message: "Vous avez déjà utilisé ce code" });
      }

      await storage.claimGiftCode(userId, giftCode.id, parseFloat(giftCode.amount));
      
      res.json({ 
        success: true, 
        message: `Félicitations! Vous avez reçu ${parseFloat(giftCode.amount).toLocaleString()} FCFA`,
        amount: parseFloat(giftCode.amount)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Countries routes (public)
  app.get("/api/countries", async (req, res) => {
    try {
      const activeCountries = await storage.getActiveCountries();
      res.json(activeCountries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposit/provider/:country", requireAuth, async (req, res) => {
    try {
      const country = getRouteParam(req.params.country).toUpperCase();
      const active = await storage.getActiveCountries();
      if (!active.some(c => c.code.toUpperCase() === country)) {
        return res.status(404).json({ message: "Pays indisponible" });
      }
      const settings = await storage.getSettings();
      const enabledCodes = (value: string | undefined) =>
        (value || "").split(",").map(code => code.trim().toUpperCase()).filter(Boolean);
      const ashtechCountries = enabledCodes(settings.ashtechCountries);
      const providers: Array<{ provider: "ashtech" | "sendavapay" | "drimpay"; name: string }> = [];
      if (settings.ashtechEnabled === "true" && ashtechCountries.includes(country)) {
        providers.push({ provider: "ashtech", name: settings.ashtechChannelName || "AshtechPay" });
      }
      if (settings.sendavapayEnabled === "true") {
        providers.push({ provider: "sendavapay", name: settings.sendavapayChannelName || "SendavaPay" });
      }
      if (
        isDrimPayConfigured() &&
        isDrimPayWebhookConfigured() &&
        isDrimPayCountryEnabled(settings, "Payin", country)
      ) {
        providers.push({ provider: "drimpay", name: "DrimPay" });
      }
      if (providers.length > 0) {
        return res.json({ ...providers[0], providers });
      }
      return res.status(503).json({ message: "Aucun canal de paiement disponible", provider: "sendavapay", name: "SendavaPay" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin country routes
  app.get("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const allCountries = await storage.getCountries();
      res.json(allCountries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/countries", requireAdmin, async (req, res) => {
    try {
      const { code, name, currency, phonePrefix, operators, isActive } = req.body;
      if (!code || !name || !currency || !phonePrefix) {
        return res.status(400).json({ message: "Code, nom, devise et indicatif sont requis" });
      }
      const country = await storage.createCountry({
        code: code.toUpperCase(),
        name,
        currency,
        phonePrefix,
        operators: operators || "[]",
        isActive: isActive !== undefined ? isActive : true,
      });
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      const { code, name, currency, phonePrefix, operators, isActive } = req.body;
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (currency !== undefined) updateData.currency = currency;
      if (phonePrefix !== undefined) updateData.phonePrefix = phonePrefix;
      if (operators !== undefined) updateData.operators = operators;
      if (isActive !== undefined) updateData.isActive = isActive;
      const country = await storage.updateCountry(id, updateData);
      res.json(country);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/countries/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(getRouteParam(req.params.id));
      await storage.deleteCountry(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ==================== BANKER ROUTES ====================
  // Accessible to both admins and bankers

  app.get("/api/banker/deposits", requireBanker, async (req, res) => {
    try {
      const deposits = await storage.getDeposits();
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/banker/withdrawals", requireBanker, async (req, res) => {
    try {
      const withdrawals = await storage.getWithdrawals();
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/approve", requireBanker, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(getRouteParam(req.params.id)), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      const user = await storage.getUser(deposit.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + deposit.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
        await storage.createTransaction({ userId: user.id, type: "deposit", amount: deposit.amount.toString(), description: "Dépôt validé par bankier" });
      }
      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé par bankier: ${deposit.amount}F`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/deposits/:id/reject", requireBanker, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(getRouteParam(req.params.id)), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
        screenshot: null,
      });
      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté par bankier`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/approve", requireBanker, async (req, res) => {
    try {
      const allWithdrawals = await storage.getWithdrawals();
      const withdrawalData = allWithdrawals.find(w => w.id === parseInt(getRouteParam(req.params.id)));
      if (!withdrawalData) return res.status(404).json({ message: "Retrait non trouvé" });
      const withdrawal = await storage.updateWithdrawal(parseInt(getRouteParam(req.params.id)), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé par bankier: ${withdrawalData.netAmount}F`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/banker/withdrawals/:id/reject", requireBanker, async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(parseInt(getRouteParam(req.params.id)), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + withdrawal.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2) });
      }
      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté par bankier et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  return httpServer;
}
