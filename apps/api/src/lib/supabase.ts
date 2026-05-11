import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

// Service-role client — backend only. Bypasses RLS, used for privileged
// writes (Storage uploads, admin operations). Never expose this in any
// response.
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

export const UPLOADS_BUCKET = "updates-media";
