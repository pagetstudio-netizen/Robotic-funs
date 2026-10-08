import type { User, Withdrawal, WithdrawalWallet } from "../shared/schema";

export interface WithdrawalRequestStorage {
  getUser(userId: number): Promise<User | undefined>;
  hasActiveStableProduct(userId: number): Promise<boolean>;
  getSettings(): Promise<Record<string, string>>;
  getTeamStats(userId: number): Promise<{ level1Invested: number }>;
  getWallets(userId: number): Promise<WithdrawalWallet[]>;
  getDefaultWallet(userId: number): Promise<WithdrawalWallet | undefined>;
  getUserWithdrawalCountToday(userId: number): Promise<number>;
  updateUser(userId: number, data: Partial<User>): Promise<User>;
  createWithdrawal(data: Partial<Withdrawal>): Promise<Withdrawal>;
}

export class WithdrawalRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "WithdrawalRequestError";
  }
}

export async function requestWithdrawal(
  userId: number,
  rawAmount: unknown,
  storage: WithdrawalRequestStorage,
  rawWalletId?: unknown,
) {
  const numericAmount = Number(rawAmount);
  const user = await storage.getUser(userId);

  if (!user) {
    throw new WithdrawalRequestError("Non authentifié", 401);
  }

  const settingsForWithdrawal = await storage.getSettings();
  const minWithdrawal = parseInt(settingsForWithdrawal.minWithdrawal || "1000");
  if (!Number.isInteger(numericAmount) || numericAmount < minWithdrawal) {
    throw new WithdrawalRequestError(`Montant minimum: ${minWithdrawal} FCFA`);
  }

  if (!await storage.hasActiveStableProduct(user.id)) {
    throw new WithdrawalRequestError("Vous devez avoir un produit stable actif pour effectuer un retrait.");
  }

  if (user.isWithdrawalBlocked) {
    throw new WithdrawalRequestError("Retraits bloqués sur ce compte");
  }

  if (user.mustInviteToWithdraw) {
    const stats = await storage.getTeamStats(user.id);
    if (stats.level1Invested < 1) {
      throw new WithdrawalRequestError("Invitez quelqu'un qui investit");
    }
  }

  const balance = parseFloat(user.balance);
  if (numericAmount > balance) {
    throw new WithdrawalRequestError("Solde insuffisant");
  }

  let wallet: WithdrawalWallet | undefined;
  if (user.country.trim().toUpperCase() === "BJ") {
    const selectedWalletId = typeof rawWalletId === "number"
      ? rawWalletId
      : typeof rawWalletId === "string" && rawWalletId.trim()
        ? Number(rawWalletId)
        : Number.NaN;
    if (!Number.isSafeInteger(selectedWalletId) || selectedWalletId <= 0) {
      throw new WithdrawalRequestError("Sélectionnez le portefeuille de retrait pour le Bénin.");
    }

    const userWallets = await storage.getWallets(user.id);
    wallet = userWallets.find((candidate) => candidate.id === selectedWalletId);
    if (!wallet || wallet.country.trim().toUpperCase() !== "BJ") {
      throw new WithdrawalRequestError("Portefeuille de retrait invalide pour le Bénin.");
    }
  } else {
    wallet = await storage.getDefaultWallet(user.id);
  }

  if (!wallet) {
    throw new WithdrawalRequestError("Enregistrez un portefeuille de retrait");
  }

  const todayCount = await storage.getUserWithdrawalCountToday(user.id);
  const settingsForMax = await storage.getSettings();
  const maxPerDay = parseInt(settingsForMax.maxWithdrawalsPerDay || "1");
  if (todayCount >= maxPerDay) {
    throw new WithdrawalRequestError(
      `Maximum ${maxPerDay} retrait${maxPerDay > 1 ? "s" : ""} par jour`,
    );
  }

  const settings = await storage.getSettings();
  const fees = parseFloat(settings.withdrawalFees || "18");
  const feeAmount = Math.round(numericAmount * fees / 100);
  const netAmount = numericAmount - feeAmount;

  await storage.updateUser(user.id, {
    balance: (balance - numericAmount).toFixed(2),
  });

  const withdrawal = await storage.createWithdrawal({
    userId: user.id,
    amount: numericAmount,
    netAmount,
    fees: feeAmount,
    accountName: wallet.accountName,
    accountNumber: wallet.accountNumber,
    country: wallet.country,
    paymentMethod: wallet.paymentMethod,
    status: "pending",
  });

  return { user, wallet, withdrawal, amount: numericAmount, netAmount };
}