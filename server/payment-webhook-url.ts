interface PaymentWebhookUrlInput {
  configuredUrl?: string;
  fallbackUrl: string;
  requestHost?: string;
  forwardedProto?: string;
  requestProtocol?: string;
  origin?: string;
}

export function resolvePaymentWebhookBaseUrl({
  configuredUrl,
  fallbackUrl,
  requestHost,
  forwardedProto,
  requestProtocol,
  origin,
}: PaymentWebhookUrlInput): string {
  const baseUrl = new URL((configuredUrl || fallbackUrl).trim());
  const normalizedRequestHost = requestHost?.trim().toLowerCase();
  const normalizedOriginProto = String(forwardedProto || "").split(",")[0].trim().toLowerCase();
  let originIsHttpsForRequestHost = false;

  if (origin && normalizedRequestHost) {
    try {
      const originUrl = new URL(origin);
      originIsHttpsForRequestHost =
        originUrl.protocol === "https:" &&
        originUrl.host.toLowerCase() === normalizedRequestHost;
    } catch {
      originIsHttpsForRequestHost = false;
    }
  }

  // Plesk may retain an old http://PUBLIC_APP_URL while serving this same
  // configured host over HTTPS. Upgrade only when the incoming request proves
  // HTTPS and matches the configured host.
  if (
    baseUrl.protocol === "http:" &&
    normalizedRequestHost &&
    baseUrl.host.toLowerCase() === normalizedRequestHost &&
    (normalizedOriginProto === "https" ||
      requestProtocol?.toLowerCase() === "https" ||
      originIsHttpsForRequestHost)
  ) {
    baseUrl.protocol = "https:";
  }

  return baseUrl.toString().replace(/\/+$/, "");
}
