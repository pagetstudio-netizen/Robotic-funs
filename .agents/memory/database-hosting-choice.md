---
name: Database hosting choice
description: The user selected Supabase as the application's primary database and authorized migrating development data.
---

Use Supabase (`SUPABASE_DATABASE_URL`) as the application's primary datastore. `DATABASE_URL` remains the Replit development source/fallback. Development data was copied to Supabase, and the Replit development database was cleaned to retain only its administrator account. Production data has not been migrated or inspected.

Never use the legacy Supabase migration script that truncates destination tables. The safe development transfer checks that destination tables are empty, copies without overwriting, and verifies row counts. Supabase currently contains the complete development copy; source development contains only the administrator and shared configuration.

**Why:** The user explicitly chose Supabase, authorized copying the Replit development database, and confirmed deleting non-admin accounts from the Replit source only after verification.

**How to apply:** Keep application runtime and Drizzle pointed at Supabase. Treat any production migration as a separate task; do not replace Supabase with development data or delete production records without explicit scope and verification.
