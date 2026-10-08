ALTER TABLE "products" ADD COLUMN "product_type" text NOT NULL DEFAULT 'stable';
ALTER TABLE "products" ADD COLUMN "launch_date" text;
ALTER TABLE "products" ADD COLUMN "launch_time" text;

ALTER TABLE "user_products" ADD COLUMN "purchase_price" integer;
ALTER TABLE "user_products" ADD COLUMN "purchase_daily_earnings" integer;
ALTER TABLE "user_products" ADD COLUMN "purchase_cycle_days" integer;
ALTER TABLE "user_products" ADD COLUMN "purchase_total_return" integer;
ALTER TABLE "user_products" ADD COLUMN "purchase_product_name" text;
ALTER TABLE "user_products" ADD COLUMN "purchase_image_url" text;
ALTER TABLE "user_products" ADD COLUMN "purchase_product_type" text;
ALTER TABLE "user_products" ADD COLUMN "payout_mode" text NOT NULL DEFAULT 'maturity';
ALTER TABLE "user_products" ADD COLUMN "purchase_prepaid_earnings" integer;
ALTER TABLE "user_products" ALTER COLUMN "payout_mode" SET DEFAULT 'maturity';

UPDATE "user_products" AS up
SET
  "purchase_price" = p."price",
  "purchase_daily_earnings" = p."daily_earnings",
  "purchase_cycle_days" = p."cycle_days",
  "purchase_total_return" = p."total_return",
  "purchase_product_name" = p."name",
  "purchase_image_url" = p."image_url",
  "purchase_product_type" = p."product_type",
  "payout_mode" = 'maturity',
  "purchase_prepaid_earnings" = GREATEST(0, COALESCE(up."total_earned", 0))
FROM "products" AS p
WHERE p."id" = up."product_id";
