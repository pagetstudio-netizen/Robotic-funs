import assert from "node:assert/strict";
import test from "node:test";
import { isUserProductRevoked, type ProductRevocationEvent } from "./product-revocation";

const revokedAt = new Date("2026-10-08T00:00:00.000Z");
const priorRevocation: ProductRevocationEvent = { productId: 7, revokedAt };

test("explicitly revoked positions are hidden", () => {
  assert.equal(
    isUserProductRevoked({
      productId: 7,
      purchaseDate: new Date("2026-10-01T00:00:00.000Z"),
      isActive: false,
      isRevoked: true,
    }, []),
    true,
  );
});

test("legacy inactive positions with a matching admin revoke event are hidden", () => {
  assert.equal(
    isUserProductRevoked({
      productId: 7,
      purchaseDate: new Date("2026-10-01T00:00:00.000Z"),
      isActive: false,
      isRevoked: false,
    }, [priorRevocation]),
    true,
  );
});

test("normally completed positions remain visible without a matching revoke event", () => {
  assert.equal(
    isUserProductRevoked({
      productId: 7,
      purchaseDate: new Date("2026-10-01T00:00:00.000Z"),
      isActive: false,
      isRevoked: false,
    }, []),
    false,
  );
});

test("a later purchase remains visible when its product had an older revoke event", () => {
  assert.equal(
    isUserProductRevoked({
      productId: 7,
      purchaseDate: new Date("2026-10-09T00:00:00.000Z"),
      isActive: false,
      isRevoked: false,
    }, [priorRevocation]),
    false,
  );
});
