import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (Next.js convention), then .env as fallback.
// .env.local is not committed to source control; shell env vars take precedence.
config({ path: ".env.local" });
config({ path: ".env" });

// For migrations: DIRECT_URL must be a non-pooled Neon connection string.
// Neon's PgBouncer pooler does not support the DDL statements prisma migrate requires.
// Falling back to DATABASE_URL (pooled) would cause silent migration failures.
// The Prisma client at runtime continues to use DATABASE_URL (pooled connection).
const migrationUrl = process.env["DIRECT_URL"];
if (!migrationUrl) {
  throw new Error(
    "DIRECT_URL is not set. Migrations require a direct (non-pooled) Neon connection string. " +
    "Set DIRECT_URL in .env.local to your Neon direct connection URL."
  );
}
const shadowDatabaseUrl =
  process.env["SHADOW_DATABASE_URL"] ??
  process.env["PRISMA_SHADOW_DATABASE_URL"];

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrationUrl,
    shadowDatabaseUrl,
  },
});
