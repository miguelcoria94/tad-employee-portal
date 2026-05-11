import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "node:path";

loadEnv({ path: path.resolve(__dirname, "..", "..", "apps", "api", ".env.local") });
loadEnv({ path: path.resolve(__dirname, ".env.local"), override: false });

// Migrations need a session-mode connection (port 5432). Prefer DIRECT_URL,
// fall back to DATABASE_URL only if the user only provided one.
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    "DIRECT_URL (or DATABASE_URL) is required to run drizzle-kit. Set it in apps/api/.env.local.",
  );
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  strict: true,
  verbose: true,
});
