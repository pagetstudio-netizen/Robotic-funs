export const ACTIVITY_PRODUCT_NAME_PREFIX = "Robotics-fund AVC";

type ActivityProductNameSource = {
  name: string;
  productType: string;
};

export function formatActivityProductName(sequence: number): string {
  if (!Number.isSafeInteger(sequence) || sequence < 1) {
    throw new RangeError("Le numéro du produit d’activité doit être un entier positif.");
  }
  return `${ACTIVITY_PRODUCT_NAME_PREFIX}${sequence}`;
}

export function getNextActivityProductNumber(products: readonly ActivityProductNameSource[]): number {
  const activityProducts = products.filter((product) => product.productType === "activity");
  const largestExistingNumber = activityProducts.reduce((largest, product) => {
    const match = product.name.trim().match(/^Robotics-fund AVC(\d+)$/);
    return match ? Math.max(largest, Number(match[1])) : largest;
  }, 0);

  return Math.max(activityProducts.length, largestExistingNumber) + 1;
}
