import "./load-env.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL (or DATABASE_URL) is required");

const sqlClient = postgres(url, { max: 1, prepare: false });
const db = drizzle(sqlClient);

async function run() {
  console.log("Running Drizzle migrations…");
  await migrate(db, { migrationsFolder: join(__dirname, "..", "drizzle") });
  console.log("Drizzle migrations applied.");

  const policiesDir = join(__dirname, "..", "policies");
  const files = readdirSync(policiesDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    console.log(`Applying policy: ${file}`);
    const content = readFileSync(join(policiesDir, file), "utf8");
    await sqlClient.unsafe(content);
  }

  console.log("All migrations + policies applied successfully.");
  await sqlClient.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});