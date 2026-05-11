import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  // Only set Content-Type when we're actually sending a JSON body. With no
  // body, declaring Content-Type: application/json makes Fastify's JSON
  // parser try (and fail) to read the empty payload and reply 400.
  const hasJsonBody = typeof init.body === "string" && init.body.length > 0;
  const baseHeaders: Record<string, string> = {
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...(await authHeader()),
  };
  const headers: Record<string, string> = {
    ...baseHeaders,
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = body?.error ?? {};
    throw new ApiError(
      res.status,
      err.code ?? "REQUEST_FAILED",
      err.message ?? `Request failed (${res.status})`,
      err.details,
    );
  }
  return body as T;
}