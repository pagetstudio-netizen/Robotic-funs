import assert from "node:assert/strict";
import test from "node:test";
import { isFirstPaidStableProductPurchase } from "./referral-commission-policy";

test("only a user's first paid stable product purchase qualifies for referral commissions", () => {
  assert.equal(isFirstPaidStableProductPurchase("stable", true, false, []), true);

  assert.equal(isFirstPaidStableProductPurchase("activity", true, false, []), false);

  assert.equal(isFirstPaidStableProductPurchase("stable", true, false, [
    { productType: "activity", purchasePrice: 700, assignedByAdmin: false },
  ]), true);

  assert.equal(isFirstPaidStableProductPurchase("stable", true, false, [
    { productType: "stable", purchasePrice: 500, assignedByAdmin: false },
  ]), false);

  assert.equal(isFirstPaidStableProductPurchase("stable", false, false, []), false);
  assert.equal(isFirstPaidStableProductPurchase("stable", true, true, []), false);
});
