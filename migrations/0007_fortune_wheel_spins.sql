ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "fortune_wheel_spins" integer NOT NULL DEFAULT 0;
