import assert from "node:assert/strict";
import test from "node:test";
import { requestWithdrawal } from "./withdrawal-request.ts";

function createWithdrawalFixtures(overrides: {
  user?: Record<string, unknown>;
  settings?: Record<string, string>;
  todayCount?: number;
  hasActiveStableProduct?: boolean;
} = {}) {
  const updates: Array<{ userId: number; data: Record<string, unknown> }> = [];
  const createdWithdrawals: Array<Record<string, unknown>> = [];
  const user = {
    id: 42,
    fullName: "Utilisateur test",
    country: "TG",
    balance: "60000.00",
    depositBalance: "50000.00",
    withdrawalBalance: "10000.00",
    hasActiveProduct: true,
    isWithdrawalBlocked: false,
    mustInviteToWithdraw: false,
    ...overrides.user,
  };
  const wallet = {
    id: 8,
    userId: 42,
    accountName: "Compte test",
    accountNumber: "000000000",
    paymentMethod: "Mobile Money",
    country: String(user.country),
    isDefault: true,
  };
  const alternateWallet = {
    id: 9,
    userId: 42,
    accountName: "Autre compte",
    accountNumber: "0102030405",
    paymentMethod: "Moov Money",
    country: String(user.country),
    isDefault: false,
  };
  let nextWithdrawalId = 1;

  const storage = {
    async getUser(userId: number) {
      return userId === user.id ? user : undefined;
    },
    async hasActiveStableProduct() {
      return overrides.hasActiveStableProduct ?? true;
    },
    async getSettings() {
      return {
        minWithdrawal: "1000",
        maxWithdrawalsPerDay: "2",
        withdrawalFees: "20",
        ...overrides.settings,
      };
    },
    async getTeamStats() {
      return { level1Invested: 1 };
    },
    async getDefaultWallet() {
      return wallet;
    },
    async getWallets(userId: number) {
      return userId === user.id ? [wallet, alternateWallet] : [];
    },
    async getUserWithdrawalCountToday() {
      return overrides.todayCount ?? 0;
    },
    async reserveWithdrawal(userId: number, amount: number, data: Record<string, unknown>) {
      if (Number(user.withdrawalBalance) < amount) return undefined;
      user.withdrawalBalance = (Number(user.withdrawalBalance) - amount).toFixed(2);
      user.balance = (Number(user.balance) - amount).toFixed(2);
      updates.push({ userId, data: { withdrawalBalance: user.withdrawalBalance } });
      const withdrawal = { id: nextWithdrawalId++, userId, amount, ...data };
      createdWithdrawals.push(withdrawal);
      return withdrawal;
    },
  };

  return { storage, updates, createdWithdrawals, user, wallet, alternateWallet };
}

test("withdrawal requires an active stable product, not just a historical product flag", async () => {
  const fixtures = createWithdrawalFixtures({
    user: { hasActiveProduct: true },
    hasActiveStableProduct: false,
  });

  await assert.rejects(
    requestWithdrawal(42, 5000, fixtures.storage),
    { message: "Vous devez avoir un produit stable actif pour effectuer un retrait." },
  );

  assert.deepEqual(fixtures.updates, []);
  assert.deepEqual(fixtures.createdWithdrawals, []);
});

test("non-Benin withdrawal keeps using the default wallet even if another wallet ID is sent", async () => {
  const fixtures = createWithdrawalFixtures();

  const result = await requestWithdrawal(42, 5000, fixtures.storage, fixtures.alternateWallet.id);

  assert.equal(result.amount, 5000);
  assert.equal(result.netAmount, 4000);
  assert.equal(result.withdrawal.status, "pending");
  assert.deepEqual(fixtures.updates, [
    { userId: 42, data: { withdrawalBalance: "5000.00" } },
  ]);
  assert.deepEqual(fixtures.createdWithdrawals, [
    {
      id: 1,
      userId: 42,
      amount: 5000,
      netAmount: 4000,
      fees: 1000,
      accountName: fixtures.wallet.accountName,
      accountNumber: fixtures.wallet.accountNumber,
      country: fixtures.wallet.country,
      paymentMethod: fixtures.wallet.paymentMethod,
      status: "pending",
    },
  ]);
  assert.equal(
    "depositId" in fixtures.createdWithdrawals[0],
    false,
    "withdrawal should not link to a deposit",
  );
  assert.equal(
    "prepaymentId" in fixtures.createdWithdrawals[0],
    false,
    "withdrawal should not link to a prepayment",
  );
  assert.equal(fixtures.user.depositBalance, "50000.00");
  assert.equal(fixtures.user.withdrawalBalance, "5000.00");
});

test("a large deposit balance cannot be used to fund a withdrawal", async () => {
  const fixtures = createWithdrawalFixtures({
    user: { withdrawalBalance: "1000.00", balance: "51000.00" },
  });

  await assert.rejects(
    requestWithdrawal(42, 5000, fixtures.storage),
    { message: "Solde de retrait insuffisant" },
  );

  assert.deepEqual(fixtures.updates, []);
  assert.deepEqual(fixtures.createdWithdrawals, []);
});

test("Benin withdrawal uses the wallet selected by the user", async () => {
  const fixtures = createWithdrawalFixtures({ user: { country: "BJ" } });

  const result = await requestWithdrawal(42, 5000, fixtures.storage, fixtures.alternateWallet.id);

  assert.equal(result.wallet.id, fixtures.alternateWallet.id);
  assert.equal(result.withdrawal.accountName, fixtures.alternateWallet.accountName);
  assert.equal(result.withdrawal.accountNumber, fixtures.alternateWallet.accountNumber);
  assert.equal(result.withdrawal.country, "BJ");
  assert.equal(result.withdrawal.paymentMethod, fixtures.alternateWallet.paymentMethod);
});

test("Benin withdrawal without a selected wallet is rejected before balance changes", async () => {
  const fixtures = createWithdrawalFixtures({ user: { country: "BJ" } });

  await assert.rejects(
    requestWithdrawal(42, 5000, fixtures.storage),
    { message: "Sélectionnez le portefeuille de retrait pour le Bénin." },
  );

  assert.deepEqual(fixtures.updates, []);
  assert.deepEqual(fixtures.createdWithdrawals, []);
});

test("Benin withdrawal rejects a wallet that does not belong to the user", async () => {
  const fixtures = createWithdrawalFixtures({ user: { country: "BJ" } });

  await assert.rejects(
    requestWithdrawal(42, 5000, fixtures.storage, 999),
    { message: "Portefeuille de retrait invalide pour le Bénin." },
  );

  assert.deepEqual(fixtures.updates, []);
  assert.deepEqual(fixtures.createdWithdrawals, []);
});

test("invalid withdrawal amount is rejected without changing balance or creating a withdrawal", async () => {
  const fixtures = createWithdrawalFixtures();

  await assert.rejects(
    requestWithdrawal(42, 500, fixtures.storage),
    { message: "Montant minimum: 1000 FCFA" },
  );

  assert.deepEqual(fixtures.updates, []);
  assert.deepEqual(fixtures.createdWithdrawals, []);
});