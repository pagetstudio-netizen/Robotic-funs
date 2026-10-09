import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

export const databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const usesSupabase = Boolean(process.env.SUPABASE_DATABASE_URL);

if (!databaseUrl) {
  throw new Error("SUPABASE_DATABASE_URL or DATABASE_URL is not configured.");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ...(usesSupabase ? { ssl: { rejectUnauthorized: false } } : {}),
});
export const db = drizzle(pool, { schema });
