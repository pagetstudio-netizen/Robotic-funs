import { JOHN_DEERE_PRODUCT_IMAGE_PATHS } from "@shared/product-catalog";
import robotImage1 from "@assets/2f8842f7b2a0d529ad3c28a7051e4ae1_1791442600934.jpg";
import robotImage2 from "@assets/4f328eab0af150d94670be95cd8b6062_1791442601085.jpg";
import robotImage3 from "@assets/932663c45090185b53e20085e7c6307d_1791442601110.jpg";
import robotImage4 from "@assets/pp3_1791442601138.png";
import robotImage5 from "@assets/c8566ffd2635d4efbac9a0f5da184326_1791442601161.jpg";
import robotImage6 from "@assets/61150cc4f53d0da7aec9ab23c8139999_1791442601186.jpg";
import robotImage7 from "@assets/2aa4221a0af0a4f204a653ffd6d0677b_1791442601213.jpg";
import robotImage8 from "@assets/5663a418c899908e9c51efd1bd45f227_1791442601232.jpg";
import robotImage9 from "@assets/648e780b4a328b8e4b14801fe69a183d_(1)_1791442601258.jpg";
import robotImage10 from "@assets/ad0684c78196ddbf09f9d46d7e9342a4_(1)_1791442601286.jpg";

export const ROBOTICSFUND_LOGO = "/roboticsfund-logo.jpg";

export const JOHN_DEERE_PHOTOS = {
  homeHero: "/john-deere/home-hero.jpeg",
  expo: "/john-deere/expo-logo.jpg",
  dealership: "/john-deere/dealership.jpg",
  tractorService: "/john-deere/tractor-service.jpg",
  showroom: "/john-deere/showroom.jpg",
  tractorExpo: "/john-deere/tractor-expo.jpg",
  dealerTeam: "/john-deere/dealer-team.jpg",
  teamMachinery: "/john-deere/team-machinery.jpg",
  fieldTeam: "/john-deere/field-team.jpg",
  emblem: "/john-deere/deere-emblem.jpg",
} as const;

export const JOHN_DEERE_PRODUCT_IMAGES = JOHN_DEERE_PRODUCT_IMAGE_PATHS;

export const ROBOT_PRODUCT_IMAGES = [
  robotImage1,
  robotImage2,
  robotImage3,
  robotImage4,
  robotImage5,
  robotImage6,
  robotImage7,
  robotImage8,
  robotImage9,
  robotImage10,
] as const;

export function getRobotProductDisplayName(
  productId: number,
  productName?: string | null,
) {
  const robotNumber = productName?.match(/robot[\s_-]*(\d+)/i)?.[1];
  if (robotNumber) return `Robot-${Number(robotNumber)}`;

  const idIndex = Number.isFinite(productId) && productId > 0
    ? Math.trunc(productId) - 1
    : 0;
  const safeIndex = ((idIndex % ROBOT_PRODUCT_IMAGES.length) + ROBOT_PRODUCT_IMAGES.length)
    % ROBOT_PRODUCT_IMAGES.length;

  return `Robot-${safeIndex + 1}`;
}

export function getRobotProductImage(
  imageUrl: string | null | undefined,
  productId: number,
  productName?: string | null,
) {
  const storedImage = imageUrl?.trim();
  const robotNumber = productName?.match(/robot[\s_-]*(\d+)/i)?.[1];
  const namedIndex = robotNumber ? Number(robotNumber) - 1 : Number.NaN;
  if (Number.isInteger(namedIndex) && namedIndex >= 0) {
    const safeNamedIndex = namedIndex % ROBOT_PRODUCT_IMAGES.length;
    return ROBOT_PRODUCT_IMAGES[safeNamedIndex] ?? ROBOT_PRODUCT_IMAGES[0];
  }

  if (storedImage && !storedImage.startsWith("/john-deere/products/")) return storedImage;

  const idIndex = Number.isFinite(productId) && productId > 0
    ? Math.trunc(productId) - 1
    : 0;
  const safeIndex = ((idIndex % ROBOT_PRODUCT_IMAGES.length) + ROBOT_PRODUCT_IMAGES.length)
    % ROBOT_PRODUCT_IMAGES.length;

  return ROBOT_PRODUCT_IMAGES[safeIndex] ?? ROBOT_PRODUCT_IMAGES[0];
}

export const getJohnDeereProductImage = getRobotProductImage;