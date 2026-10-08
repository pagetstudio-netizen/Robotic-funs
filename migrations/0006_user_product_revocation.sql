ALTER TABLE "user_products" ADD COLUMN IF NOT EXISTS "is_revoked" boolean NOT NULL DEFAULT false;
