import assert from "node:assert/strict";
import test from "node:test";
import { buildRobotPayErrorNotification } from "./telegram";

test("RobotPay failure notifications contain the provider error without payment secrets", () => {
  const message = buildRobotPayErrorNotification({
    path: "/api/drimpay/payin",
    method: "POST",
    status: 502,
    userId: 42,
    amount: 3000,
    country: "TG",
    operator: "Moov Africa Togo",
    error: "Request failed: Bearer abc.def and dp_live_sk_123456",
  });

  assert.match(message, /Erreur réelle/);
  assert.match(message, /Request failed/);
  assert.match(message, /Utilisateur ID : <code>42<\/code>/);
  assert.doesNotMatch(message, /abc\.def|dp_live_sk_123456/);
});
