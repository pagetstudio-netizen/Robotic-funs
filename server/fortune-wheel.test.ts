import assert from "node:assert/strict";
import test from "node:test";
import {
  FORTUNE_WHEEL_DRAW_PRIZES,
  FORTUNE_WHEEL_PRIZES,
  getFortuneWheelRotationDegrees,
  selectFortuneWheelPrizeIndex,
} from "../shared/fortune-wheel";
import { getStablePurchaseSpinAwards } from "./fortune-wheel-policy";

test("fortune wheel uses the nine prize amounts shown to users", () => {
  assert.deepEqual(FORTUNE_WHEEL_PRIZES, [
    100,
    200,
    300,
    500,
    1500,
    5000,
    7000,
    30000,
    35000,
  ]);
  assert.ok(FORTUNE_WHEEL_PRIZES.every((amount) => amount >= 100));
});

test("wheel payouts never exceed 500 FCFA and keep the higher labels display-only", () => {
  assert.deepEqual(FORTUNE_WHEEL_DRAW_PRIZES, [100, 200, 300, 500]);
  assert.deepEqual(FORTUNE_WHEEL_DRAW_PRIZES, FORTUNE_WHEEL_PRIZES.slice(0, 4));
  assert.ok(FORTUNE_WHEEL_DRAW_PRIZES.every((amount) => amount <= 500));
});

test("500 FCFA is a rare 5 percent wheel prize", () => {
  const counts = new Map<number, number>();
  for (let roll = 0; roll < 100; roll += 1) {
    const prizeIndex = selectFortuneWheelPrizeIndex(roll);
    const amount = FORTUNE_WHEEL_PRIZES[prizeIndex];
    counts.set(amount, (counts.get(amount) ?? 0) + 1);
  }

  assert.deepEqual([...counts.entries()], [
    [100, 45],
    [200, 30],
    [300, 20],
    [500, 5],
  ]);
});

test("wheel prize selection rejects values outside the random draw range", () => {
  assert.throws(() => selectFortuneWheelPrizeIndex(-1), RangeError);
  assert.throws(() => selectFortuneWheelPrizeIndex(100), RangeError);
});

test("the selected wheel segment aligns with the fixed pointer after full rotations", () => {
  const segmentDegrees = 360 / FORTUNE_WHEEL_PRIZES.length;

  FORTUNE_WHEEL_PRIZES.forEach((_, prizeIndex) => {
    const rotation = getFortuneWheelRotationDegrees(prizeIndex);
    const normalized = rotation % 360;
    const expected = (360 - ((prizeIndex * segmentDegrees) + (segmentDegrees / 2))) % 360;
    assert.equal(normalized, expected);
  });
});

test("fortune wheel rotation rejects an invalid prize index", () => {
  assert.throws(() => getFortuneWheelRotationDegrees(-1), RangeError);
  assert.throws(
    () => getFortuneWheelRotationDegrees(FORTUNE_WHEEL_PRIZES.length),
    RangeError,
  );
});

test("a referred user earns one spin for every paid stable purchase, and the sponsor only on the first", () => {
  assert.deepEqual(getStablePurchaseSpinAwards({
    productType: "stable",
    isPaidPurchase: true,
    assignedByAdmin: false,
    isFirstStableProductPurchase: true,
    isReferred: true,
  }), { buyerSpins: 1, sponsorSpins: 1 });

  assert.deepEqual(getStablePurchaseSpinAwards({
    productType: "stable",
    isPaidPurchase: true,
    assignedByAdmin: false,
    isFirstStableProductPurchase: false,
    isReferred: true,
  }), { buyerSpins: 1, sponsorSpins: 0 });
});

test("free, admin-assigned, activity, and non-referred purchases do not award wheel spins", () => {
  const ineligiblePurchases = [
    { productType: "stable" as const, isPaidPurchase: false, assignedByAdmin: false, isFirstStableProductPurchase: true, isReferred: true },
    { productType: "stable" as const, isPaidPurchase: true, assignedByAdmin: true, isFirstStableProductPurchase: true, isReferred: true },
    { productType: "activity" as const, isPaidPurchase: true, assignedByAdmin: false, isFirstStableProductPurchase: false, isReferred: true },
    { productType: "stable" as const, isPaidPurchase: true, assignedByAdmin: false, isFirstStableProductPurchase: true, isReferred: false },
  ];

  for (const purchase of ineligiblePurchases) {
    assert.deepEqual(getStablePurchaseSpinAwards(purchase), {
      buyerSpins: 0,
      sponsorSpins: 0,
    });
  }
});
