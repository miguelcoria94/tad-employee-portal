import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Single source of truth for DATABASE_URL: the API's .env.local. Load it here
// so drizzle-kit, migrate, and seed all see the same vars without each app
// needing its own copy.
config({ path: resolve(here, "..", "..", "..", "apps", "api", ".env.local") });
config({ path: resolve(here, "..", ".env.local"), override: false });
