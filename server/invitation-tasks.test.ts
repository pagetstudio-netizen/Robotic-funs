import test from "node:test";
import assert from "node:assert/strict";
import { countQualifiedDirectReferrals, INVITATION_TASK_DEFAULTS } from "./invitation-tasks";

test("seeds exactly the five requested FCFA invitation milestones", () => {
  assert.deepEqual(
    INVITATION_TASK_DEFAULTS.map(({ requiredInvites, reward }) => [requiredInvites, reward]),
    [
      [3, 500],
      [5, 1200],
      [10, 2500],
      [30, 6500],
      [100, 15000],
    ],
  );
});

test("counts a direct referral once only after a deposit and paid stable-product purchase", () => {
  const directReferrals = [
    { id: 1, hasDeposited: true },
    { id: 2, hasDeposited: true },
    { id: 3, hasDeposited: true },
    { id: 4, hasDeposited: true },
    { id: 5, hasDeposited: true },
    { id: 6, hasDeposited: false },
  ];

  assert.equal(
    countQualifiedDirectReferrals(directReferrals, [], [
      { userId: 1, purchaseProductType: "stable", productType: "stable", purchasePrice: 3000, productPrice: 3000, isFree: false, assignedByAdmin: false },
      { userId: 1, purchaseProductType: "stable", productType: "stable", purchasePrice: 3000, productPrice: 3000, isFree: false, assignedByAdmin: false },
      { userId: 2, purchaseProductType: "activity", productType: "activity", purchasePrice: 3000, productPrice: 3000, isFree: false, assignedByAdmin: false },
      { userId: 3, purchaseProductType: "stable", productType: "stable", purchasePrice: 3000, productPrice: 3000, isFree: false, assignedByAdmin: true },
      { userId: 4, purchaseProductType: "stable", productType: "stable", purchasePrice: 3000, productPrice: 3000, isFree: true, assignedByAdmin: false },
      { userId: 5, purchaseProductType: null, productType: "stable", purchasePrice: null, productPrice: 5000, isFree: false, assignedByAdmin: false },
      { userId: 6, purchaseProductType: "stable", productType: "stable", purchasePrice: 3000, productPrice: 3000, isFree: false, assignedByAdmin: false },
    ]),
    2,
  );
});

test("does not qualify on only a deposit or only a stable-product purchase", () => {
  const directReferrals = [
    { id: 1, hasDeposited: false },
    { id: 2, hasDeposited: true },
  ];

  assert.equal(countQualifiedDirectReferrals(directReferrals, [1], []), 0);
  assert.equal(
    countQualifiedDirectReferrals([{ id: 2, hasDeposited: false }], [], [
      { userId: 2, purchaseProductType: "stable", productType: "stable", purchasePrice: 3000, productPrice: 3000, isFree: false, assignedByAdmin: false },
    ]),
    0,
  );
});
