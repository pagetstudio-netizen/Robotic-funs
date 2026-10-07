import type { ProductType } from "@shared/schema";

const COUNTRY_TIME_ZONES: Record<string, string> = {
  TG: "Africa/Lome",
  BF: "Africa/Ouagadougou",
  CI: "Africa/Abidjan",
  BJ: "Africa/Porto-Novo",
  CM: "Africa/Douala",
  NE: "Africa/Niamey",
};

const UTC_FALLBACK_TIME_ZONE = "Etc/UTC";

export type ScheduledProduct = {
  isActive: boolean;
  productType: ProductType | string;
  launchDate: string | null;
  launchTime: string | null;
};

export function isValidLaunchSchedule(date: unknown, time: unknown): date is string {
  if (typeof date !== "string" || typeof time !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function getLocalScheduleKey(now: Date, countryCode: string): string {
  const timeZone = COUNTRY_TIME_ZONES[countryCode.trim().toUpperCase()] || UTC_FALLBACK_TIME_ZONE;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function isProductAvailableForCountry(
  product: ScheduledProduct,
  countryCode: string,
  now = new Date(),
): boolean {
  if (!product.isActive) return false;
  if (product.productType !== "activity") return true;
  if (!isValidLaunchSchedule(product.launchDate, product.launchTime)) return false;

  const scheduledKey = `${product.launchDate}T${product.launchTime}`;
  return getLocalScheduleKey(now, countryCode) >= scheduledKey;
}
