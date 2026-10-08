export type ActivityLaunchPurchase = {
  productType?: string | null;
  launchDate?: string | null;
  launchTime?: string | null;
  assignedByAdmin?: boolean;
};

export type StableProductPurchase = {
  productType?: string | null;
  purchasePrice?: number | string | null;
  productPrice?: number | string | null;
  isFree?: boolean | null;
  assignedByAdmin?: boolean;
};

export function isProductStockFull(
  stockLimit: number | null | undefined,
  distinctPurchaserCount: number,
): boolean {
  return stockLimit != null && distinctPurchaserCount >= stockLimit;
}

export function hasPurchasedStableProduct(purchases: StableProductPurchase[]): boolean {
  return purchases.some((purchase) => {
    if (purchase.productType !== "stable" || purchase.assignedByAdmin) return false;
    if (purchase.purchasePrice == null) return purchase.isFree === false;
    const price = Number(purchase.purchasePrice);
    return Number.isFinite(price) && price > 0;
  });
}

export function getHighestStablePurchasePrice(
  purchases: StableProductPurchase[],
): number | null {
  const prices = purchases.flatMap((purchase) => {
    if (purchase.productType !== "stable" || purchase.assignedByAdmin) return [];
    if (purchase.purchasePrice != null) {
      const price = Number(purchase.purchasePrice);
      return Number.isFinite(price) && price > 0 ? [price] : [];
    }
    if (purchase.isFree !== false || purchase.productPrice == null) return [];
    const price = Number(purchase.productPrice);
    return Number.isFinite(price) && price > 0 ? [price] : [];
  });
  return prices.length ? prices.reduce((highest, price) => Math.max(highest, price), prices[0]) : null;
}

export function isActivityProductWithinStablePurchaseLimit(
  activityProductPrice: number,
  purchases: StableProductPurchase[],
): boolean {
  const highestStablePrice = getHighestStablePurchasePrice(purchases);
  return highestStablePrice != null
    && Number.isFinite(activityProductPrice)
    && activityProductPrice <= highestStablePrice;
}

export function hasPurchasedActivityLaunch(
  launchDate: string | null | undefined,
  launchTime: string | null | undefined,
  purchases: ActivityLaunchPurchase[],
): boolean {
  if (!launchDate || !launchTime) return false;
  return purchases.some((purchase) =>
    purchase.productType === "activity"
    && !purchase.assignedByAdmin
    && purchase.launchDate === launchDate
    && purchase.launchTime === launchTime,
  );
}
