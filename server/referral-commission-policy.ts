import {
  hasPurchasedStableProduct,
  type StableProductPurchase,
} from "../shared/product-purchase-limit";

export function isFirstPaidStableProductPurchase(
  productType: string | null | undefined,
  isPaidPurchase: boolean,
  assignedByAdmin: boolean,
  previousPurchases: StableProductPurchase[],
): boolean {
  return productType === "stable"
    && isPaidPurchase
    && !assignedByAdmin
    && !hasPurchasedStableProduct(previousPurchases);
}
