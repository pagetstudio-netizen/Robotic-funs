import assert from "node:assert/strict";
import test from "node:test";
import { calculateMaturityPayout } from "./product-payout";

test("maturity payout deducts earnings already paid before the policy change", () => {
  assert.equal(calculateMaturityPayout(1500, 500), 1000);
});

test("maturity payout pays the full return when nothing was previously paid", () => {
  assert.equal(calculateMaturityPayout(1500, 0), 1500);
});

test("maturity payout never becomes negative when prior payments exceed the return", () => {
  assert.equal(calculateMaturityPayout(1500, 1800), 0);
});
