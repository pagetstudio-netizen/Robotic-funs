import type { UserProduct } from "@shared/schema";

export interface ProductRevocationEvent {
  productId: number;
  revokedAt: Date;
}

export function isUserProductRevoked(
  position: Pick<UserProduct, "productId" | "purchaseDate" | "isActive" | "isRevoked">,
  legacyEvents: ProductRevocationEvent[],
): boolean {
  if (position.isRevoked) return true;
  if (position.isActive || !position.purchaseDate) return false;

  const purchaseTime = position.purchaseDate.getTime();
  if (!Number.isFinite(purchaseTime)) return false;

  return legacyEvents.some(
    (event) =>
      event.productId === position.productId &&
      event.revokedAt.getTime() >= purchaseTime,
  );
}
