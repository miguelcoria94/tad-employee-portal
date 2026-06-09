import { config as loadEnv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// Explicitly load .env.local from this app's root. dotenv's default behavior
// only loads `.env` (not `.env.local`), so without this the API would only
// see env vars provided by the host environment (e.g. Railway in prod).
const here = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(here, "..", ".env.local") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z
    .string()
    .default("3001")
    .transform((v) => Number.parseInt(v, 10)),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  // Bind address. Defaults to 0.0.0.0 for prod/containers. Set to 127.0.0.1
  // locally to avoid Fastify enumerating network interfaces on startup (some
  // sandboxed/macOS environments throw on os.networkInterfaces()).
  HOST: z.string().default("0.0.0.0"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  // Optional: enables the "Ask Tad" assistant. When unset the assistant
  // endpoint returns a friendly "not configured" message instead of erroring.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  // Optional outbound email. When EMAIL_PROVIDER is unset (or "log") emails are
  // logged to the server console instead of being sent — the app still boots
  // and all in-app notifications still fire. Set EMAIL_PROVIDER=resend plus
  // RESEND_API_KEY to actually deliver mail (mirrors the optional OpenAI key).
  EMAIL_PROVIDER: z.enum(["log", "resend"]).default("log"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("TadHealth <onboarding@resend.dev>"),
  // Base URL used to build absolute links in emails (e.g. course links).
  APP_BASE_URL: z.string().url().default("http://localhost:5181"),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  ...parsed.data,
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(",").map((s) => s.trim()),
  isProd: parsed.data.NODE_ENV === "production",
};