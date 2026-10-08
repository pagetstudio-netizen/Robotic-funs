ALTER TABLE "products"
ADD COLUMN IF NOT EXISTS "is_archived" boolean NOT NULL DEFAULT false;

UPDATE "products" AS product
SET "is_active" = false,
    "is_archived" = true
WHERE EXISTS (
  SELECT 1
  FROM "admin_audit_log" AS audit
  WHERE audit."action" = 'delete_product'
    AND audit."details" =
      'Produit ' || product."id" || ' retiré du catalogue, historique conservé'
);
