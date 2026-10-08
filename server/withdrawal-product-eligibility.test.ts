import assert from "node:assert/strict";
import test from "node:test";
import { hasQualifyingActiveStableProduct } from "./withdrawal-product-eligibility";

const activeStablePosition = {
  purchaseProductType: "stable",
  currentProductType: "stable",
  isActive: true,
  isRevoked: false,
  daysRemaining: 20,
  assignedByAdmin: false,
};

test("an active stable product bought by the user qualifies for withdrawal", () => {
  assert.equal(hasQualifyingActiveStableProduct([activeStablePosition]), true);
});

test("an active administrator-offered stable product qualifies for withdrawal", () => {
  assert.equal(
    hasQualifyingActiveStableProduct([{ ...activeStablePosition, assignedByAdmin: true }]),
    true,
  );
});

test("activity, completed, and revoked products do not qualify for withdrawal", () => {
  assert.equal(
    hasQualifyingActiveStableProduct([{
      ...activeStablePosition,
      purchaseProductType: "activity",
      currentProductType: "activity",
    }]),
    false,
  );
  assert.equal(
    hasQualifyingActiveStableProduct([{ ...activeStablePosition, daysRemaining: 0 }]),
    false,
  );
  assert.equal(
    hasQualifyingActiveStableProduct([{ ...activeStablePosition, isRevoked: true }]),
    false,
  );
});
