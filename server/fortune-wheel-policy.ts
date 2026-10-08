import type { ProductType } from "@shared/schema";

interface StablePurchaseSpinAwardsInput {
  productType: ProductType;
  isPaidPurchase: boolean;
  assignedByAdmin: boolean;
  isFirstStableProductPurchase: boolean;
  isReferred: boolean;
}

export function getStablePurchaseSpinAwards({
  productType,
  isPaidPurchase,
  assignedByAdmin,
  isFirstStableProductPurchase,
  isReferred,
}: StablePurchaseSpinAwardsInput) {
  const qualifies =
    productType === "stable" &&
    isPaidPurchase &&
    !assignedByAdmin &&
    isReferred;

  return {
    buyerSpins: qualifies ? 1 : 0,
    sponsorSpins: qualifies && isFirstStableProductPurchase ? 1 : 0,
  };
}
