---
name: Database hosting choice
description: The user selected Replit-managed PostgreSQL as this project's database.
---

Use Replit-managed PostgreSQL (`DATABASE_URL`) as the canonical datastore rather than `SUPABASE_DATABASE_URL`. The user chose to start fresh on Replit, without importing Supabase records; preserve Supabase data.

On 2026-10-07, `drizzle-kit push` stopped before applying changes and asked whether to truncate the existing five-row `countries` table to add `countries_code_unique`. Do not accept that prompt automatically.

**Why:** The user chose Replit PostgreSQL, and truncating seeded country rows would be destructive. Schema drift in unrelated tables should not erase valid data.

**How to apply:** Keep normal application and schema tooling on `DATABASE_URL`. If a push asks to truncate `countries`, stop and inspect the current data/constraint mismatch; apply only a safe, targeted change. Do not copy or delete Supabase records unless the user changes this decision.
