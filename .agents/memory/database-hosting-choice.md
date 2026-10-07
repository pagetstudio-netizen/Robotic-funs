---
name: Database hosting choice
description: The user selected Replit-managed PostgreSQL as this project's database.
---

Use Replit-managed PostgreSQL (`DATABASE_URL`) as the canonical datastore rather than `SUPABASE_DATABASE_URL`.

**Why:** The user stated that this project will use Replit's database.

**How to apply:** Before changing runtime connections, determine whether existing Supabase data should be migrated. Do not silently point the app at an empty database; keep the original data intact during a transition.
