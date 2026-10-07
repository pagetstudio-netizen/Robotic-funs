export const INVITATION_TASK_KEY_PREFIX = "invite_level1_";

export const INVITATION_TASK_DEFAULTS = [
  { taskKey: "invite_level1_3", requiredInvites: 3, reward: 60 },
  { taskKey: "invite_level1_9", requiredInvites: 9, reward: 180 },
  { taskKey: "invite_level1_18", requiredInvites: 18, reward: 540 },
  { taskKey: "invite_level1_36", requiredInvites: 36, reward: 1080 },
  { taskKey: "invite_level1_72", requiredInvites: 72, reward: 2880 },
  { taskKey: "invite_level1_144", requiredInvites: 144, reward: 5760 },
  { taskKey: "invite_level1_288", requiredInvites: 288, reward: 17280 },
].map((tier, index) => ({
  ...tier,
  name: tier.taskKey,
  description: `Inviter ${tier.requiredInvites} membres de niveau 1 à investir`,
  sortOrder: 101 + index,
  isActive: true,
}));

export function countQualifiedDirectReferrals(
  referrals: Array<{ id: number; hasDeposited: boolean }>,
  approvedDepositUserIds: number[],
  paidProductUserIds: number[],
): number {
  const depositedIds = new Set([
    ...referrals.filter(referral => referral.hasDeposited).map(referral => referral.id),
    ...approvedDepositUserIds,
  ]);
  const purchasedIds = new Set(paidProductUserIds);

  return new Set(
    referrals
      .filter(referral => depositedIds.has(referral.id) && purchasedIds.has(referral.id))
      .map(referral => referral.id),
  ).size;
}
