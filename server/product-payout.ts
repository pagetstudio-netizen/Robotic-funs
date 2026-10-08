export function calculateMaturityPayout(totalReturn: number, prepaidEarnings: number): number {
  const safeTotalReturn = Number.isFinite(totalReturn) ? Math.max(0, totalReturn) : 0;
  const safePrepaidEarnings = Number.isFinite(prepaidEarnings) ? Math.max(0, prepaidEarnings) : 0;
  return Math.max(0, safeTotalReturn - safePrepaidEarnings);
}
