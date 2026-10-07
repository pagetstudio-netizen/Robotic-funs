---
name: Database hosting choice
description: The user selected Replit-managed PostgreSQL as this project's database.
---

Use Replit-managed PostgreSQL (`DATABASE_URL`) as the canonical datastore rather than `SUPABASE_DATABASE_URL`. The user chose to start fresh on Replit, without importing Supabase records; preserve Supabase data.

**Why:** The user stated that this project will use Replit's database.

**How to apply:** Keep normal application and schema tooling on `DATABASE_URL`. Do not copy or delete Supabase records unless the user changes this decision.
