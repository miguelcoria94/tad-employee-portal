import { createRemoteJWKSet, jwtVerify } from "jose";
import { config } from "../config.js";

// Supabase publishes the active JWT signing keys at this well-known URL.
// During key rotation it returns both the current and the previous keys, so
// in-flight tokens signed with either still verify cleanly.
const jwks = createRemoteJWKSet(
  new URL("/auth/v1/.well-known/jwks.json", config.SUPABASE_URL),
  { cooldownDuration: 30_000 },
);

export type SupabaseJwtPayload = {
  sub: string;
  email?: string;
  aud: string;
  exp: number;
  iat: number;
  role?: string;
};

export async function verifySupabaseJwt(
  token: string,
): Promise<SupabaseJwtPayload> {
  const { payload } = await jwtVerify(token, jwks, {
    // Supabase issues HS256 (legacy shared-secret) and asymmetric tokens
    // (ES256 / RS256). `jose` picks the right key from the JWKS automatically;
    // we accept any signature algorithm Supabase currently uses.
    algorithms: ["ES256", "RS256", "EdDSA", "HS256"],
  });
  if (typeof payload.sub !== "string") {
    throw new Error("JWT missing sub");
  }
  return payload as SupabaseJwtPayload;
}
