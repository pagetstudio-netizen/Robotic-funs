export type ManualDepositProofResult =
  | { valid: true }
  | { valid: false; message: string };

export function validateManualDepositProof(
  paymentSource: unknown,
  reference: string,
  paymentMessage: string,
  screenshot: unknown,
): ManualDepositProofResult {
  if (paymentSource === "robotpay") {
    return reference || paymentMessage
      ? { valid: true }
      : { valid: false, message: "Saisissez la référence du paiement ou le message de confirmation reçu." };
  }

  return screenshot
    ? { valid: true }
    : { valid: false, message: "La capture d'écran du paiement est requise" };
}
