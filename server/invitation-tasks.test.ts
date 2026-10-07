import test from "node:test";
import assert from "node:assert/strict";
import { countQualifiedDirectReferrals, INVITATION_TASK_DEFAULTS } from "./invitation-tasks";

test("seeds the seven requested FCFA invitation milestones", () => {
  assert.deepEqual(
    INVITATION_TASK_DEFAULTS.map(({ requiredInvites, reward }) => [requiredInvites, reward]),
    [
      [3, 60],
      [9, 180],
      [18, 540],
      [36, 1080],
      [72, 2880],
      [144, 5760],
      [288, 17280],
    ],
  );
});

test("counts a direct referral once only after a deposit and paid product purchase", () => {
  const directReferrals = [
    { id: 1, hasDeposited: false },
    { id: 2, hasDeposited: true },
    { id: 3, hasDeposited: false },
    { id: 4, hasDeposited: true },
  ];

  assert.equal(
    countQualifiedDirectReferrals(directReferrals, [1, 3], [1, 2, 2]),
    2,
  );
});

test("does not qualify on only a deposit or only a product purchase", () => {
  const directReferrals = [
    { id: 1, hasDeposited: false },
    { id: 2, hasDeposited: true },
  ];

  assert.equal(countQualifiedDirectReferrals(directReferrals, [1], []), 0);
  assert.equal(
    countQualifiedDirectReferrals([{ id: 2, hasDeposited: false }], [], [2]),
    0,
  );
});
