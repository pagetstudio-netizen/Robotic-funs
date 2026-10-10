import assert from "node:assert/strict";
import test from "node:test";
import { resolvePaymentWebhookBaseUrl } from "./payment-webhook-url";

test("upgrades the configured webhook URL when the same host is serving HTTPS", () => {
  assert.equal(
    resolvePaymentWebhookBaseUrl({
      configuredUrl: "http://geenergy.top/",
      fallbackUrl: "http://internal",
      requestHost: "geenergy.top",
      forwardedProto: "https",
    }),
    "https://geenergy.top",
  );
});

test("does not upgrade an HTTP webhook URL for a different request host", () => {
  assert.equal(
    resolvePaymentWebhookBaseUrl({
      configuredUrl: "http://other.example",
      fallbackUrl: "http://internal",
      requestHost: "geenergy.top",
      forwardedProto: "https",
    }),
    "http://other.example",
  );
});

test("keeps explicitly configured HTTPS webhook URLs unchanged", () => {
  assert.equal(
    resolvePaymentWebhookBaseUrl({
      configuredUrl: "https://payments.example/base/",
      fallbackUrl: "http://internal",
      requestHost: "geenergy.top",
      forwardedProto: "http",
    }),
    "https://payments.example/base",
  );
});
