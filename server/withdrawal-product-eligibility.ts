export type WithdrawalProductPosition = {
  purchaseProductType: string | null;
  currentProductType: string;
  isActive: boolean;
  isRevoked: boolean;
  daysRemaining: number;
  assignedByAdmin: boolean;
};

export function hasQualifyingActiveStableProduct(
  positions: WithdrawalProductPosition[],
): boolean {
  return positions.some((position) =>
    position.isActive
    && !position.isRevoked
    && position.daysRemaining > 0
    && (position.purchaseProductType ?? position.currentProductType) === "stable",
  );
}
