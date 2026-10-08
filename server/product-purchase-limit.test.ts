import assert from "node:assert/strict";
import test from "node:test";
import {
  getHighestStablePurchasePrice,
  hasPurchasedActivityLaunch,
  hasPurchasedStableProduct,
  isActivityProductWithinStablePurchaseLimit,
  isProductStockFull,
} from "../shared/product-purchase-limit";

test("an unset activity stock limit is unlimited", () => {
  assert.equal(isProductStockFull(null, 500), false);
});

test("a product remains purchasable until its distinct-user stock is full", () => {
  assert.equal(isProductStockFull(30, 29), false);
  assert.equal(isProductStockFull(30, 30), true);
});

test("activity purchase eligibility requires a prior paid stable purchase", () => {
  assert.equal(hasPurchasedStableProduct([
    { productType: "stable", purchasePrice: 500, assignedByAdmin: false },
  ]), true);
  assert.equal(hasPurchasedStableProduct([
    { productType: "activity", purchasePrice: 500, assignedByAdmin: false },
  ]), false);
  assert.equal(hasPurchasedStableProduct([
    { productType: "stable", purchasePrice: 0, assignedByAdmin: false },
  ]), false);
  assert.equal(hasPurchasedStableProduct([
    { productType: "stable", purchasePrice: 500, assignedByAdmin: true },
  ]), false);
  assert.equal(hasPurchasedStableProduct([
    { productType: "stable", isFree: true, assignedByAdmin: false },
  ]), false);
});

test("an activity product cannot cost more than the highest stable product purchased", () => {
  const stablePurchases = [
    { productType: "stable", purchasePrice: 3_000, assignedByAdmin: false },
  ];

  assert.equal(getHighestStablePurchasePrice(stablePurchases), 3_000);
  assert.equal(isActivityProductWithinStablePurchaseLimit(3_000, stablePurchases), true);
  assert.equal(isActivityProductWithinStablePurchaseLimit(2_000, stablePurchases), true);
  assert.equal(isActivityProductWithinStablePurchaseLimit(3_001, stablePurchases), false);
});

test("the highest single stable purchase sets the activity product price ceiling", () => {
  const stablePurchases = [
    { productType: "stable", purchasePrice: 3_000, assignedByAdmin: false },
    { productType: "stable", purchasePrice: 20_000, assignedByAdmin: false },
    { productType: "activity", purchasePrice: 500_000, assignedByAdmin: false },
  ];

  assert.equal(getHighestStablePurchasePrice(stablePurchases), 20_000);
  assert.equal(isActivityProductWithinStablePurchaseLimit(20_000, stablePurchases), true);
  assert.equal(isActivityProductWithinStablePurchaseLimit(20_001, stablePurchases), false);
});

test("the activity price ceiling ignores activity and admin-assigned products and supports legacy stable prices", () => {
  const stablePurchases = [
    { productType: "activity", purchasePrice: 500_000, assignedByAdmin: false },
    { productType: "stable", purchasePrice: 100_000, assignedByAdmin: true },
    { productType: "stable", purchasePrice: null, productPrice: 7_000, isFree: false, assignedByAdmin: false },
  ];

  assert.equal(getHighestStablePurchasePrice(stablePurchases), 7_000);
});

test("a user may buy only one activity product in a launch schedule", () => {
  const previousPurchases = [
    { productType: "activity", launchDate: "2026-10-10", launchTime: "10:00", assignedByAdmin: false },
  ];
  assert.equal(hasPurchasedActivityLaunch("2026-10-10", "10:00", previousPurchases), true);
  assert.equal(hasPurchasedActivityLaunch("2026-10-11", "10:00", previousPurchases), false);
  assert.equal(hasPurchasedActivityLaunch("2026-10-10", "10:00", [
    { productType: "stable", launchDate: "2026-10-10", launchTime: "10:00", assignedByAdmin: false },
  ]), false);
  assert.equal(hasPurchasedActivityLaunch("2026-10-10", "10:00", [
    { productType: "activity", launchDate: "2026-10-10", launchTime: "10:00", assignedByAdmin: true },
  ]), false);
});
