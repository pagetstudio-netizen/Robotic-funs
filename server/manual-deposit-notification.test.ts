import assert from "node:assert/strict";
import test from "node:test";
import { buildManualDepositNotification } from "./telegram";
import { validateManualDepositProof } from "./manual-deposit-validation";

test("RobotPay accepts a reference or message instead of a screenshot", () => {
  assert.deepEqual(validateManualDepositProof("robotpay", "REF-1", "", null), { valid: true });
  assert.deepEqual(validateManualDepositProof("robotpay", "", "Paiement reçu", null), { valid: true });
  assert.equal(validateManualDepositProof("robotpay", "", "", "image").valid, false);
});

test("other manual deposit forms keep their screenshot requirement", () => {
  assert.deepEqual(validateManualDepositProof(undefined, "", "", "image"), { valid: true });
  assert.deepEqual(validateManualDepositProof(undefined, "REF-1", "", null), {
    valid: false,
    message: "La capture d'écran du paiement est requise",
  });
});

test("manual deposit alert includes review details and safely escapes user text", () => {
  const message = buildManualDepositNotification({
    depositId: 42,
    userId: 7,
    userName: "Awa <admin>",
    userPhone: "+22890000000",
    payerPhone: "+22891111111",
    amount: 5000,
    currency: "XOF",
    country: "Togo (TG)",
    operator: "TMoney",
    paymentType: "numéro",
    paymentDestination: "+22892222222",
    recipientName: "Compte TMoney Admin",
    paymentNumberId: 3,
    reference: "REF-<123>",
    paymentMessage: "Paiement reçu <OK>",
    createdAt: "2026-10-08T08:00:00.000Z",
  });

  assert.match(message, /Dépôt : <b>#42<\/b> — En attente/);
  assert.match(message, /Awa &lt;admin&gt;/);
  assert.match(message, /Montant : <b>5000 XOF<\/b>/);
  assert.match(message, /Compte destinataire : Compte TMoney Admin/);
  assert.match(message, /ID du moyen de paiement : 3/);
  assert.match(message, /Numéro\/lien destinataire : <code>\+22892222222<\/code>/);
  assert.match(message, /Référence du paiement : <code>REF-&lt;123&gt;<\/code>/);
  assert.match(message, /Paiement reçu &lt;OK&gt;/);
  assert.match(message, /2026-10-08T08:00:00\.000Z/);
});
