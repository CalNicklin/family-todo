import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Drizzle owns the table + RLS-policy schema. We `generate` SQL from it and
// apply that SQL to Supabase. `push`/`migrate` (which need a direct DB
// connection string in DATABASE_URL) are optional and only used if you want to
// sync from this machine instead of via the Supabase API.

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder",
  },
  // We manage the Postgres roles (anon/authenticated/etc.) via Supabase, so
  // don't let drizzle try to drop them.
  entities: {
    roles: {
      provider: "supabase",
    },
  },
});
