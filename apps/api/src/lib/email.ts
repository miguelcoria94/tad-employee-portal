import { config } from "../config.js";

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  /** Optional plain-text fallback; derived from html when omitted. */
  text?: string;
};

export type EmailResult =
  | { ok: true; provider: "resend"; id: string }
  | { ok: true; provider: "log"; id: null }
  | { ok: false; provider: "resend" | "log"; error: string };

export function isEmailConfigured(): boolean {
  return config.EMAIL_PROVIDER === "resend" && !!config.RESEND_API_KEY;
}

function toRecipients(to: string | string[]): string[] {
  return (Array.isArray(to) ? to : [to])
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Send an email through the configured provider. This is intentionally
 * best-effort: it never throws, so a mail failure can never break the request
 * that triggered it (in-app notifications are the source of truth). When no
 * provider is configured it logs the message so flows are observable in dev.
 */
export async function sendEmail(args: SendEmailArgs): Promise<EmailResult> {
  const recipients = toRecipients(args.to);
  if (recipients.length === 0) {
    return { ok: false, provider: config.EMAIL_PROVIDER, error: "no recipients" };
  }

  const text = args.text ?? htmlToText(args.html);

  if (!isEmailConfigured()) {
    // Dev/no-provider mode: log instead of sending so the flow is visible.
    console.info(
      `[email:log] to=${recipients.join(", ")} subject="${args.subject}"\n${text}`,
    );
    return { ok: true, provider: "log", id: null };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: config.EMAIL_FROM,
        to: recipients,
        subject: args.subject,
        html: args.html,
        text,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[email:resend] failed status=${res.status} body=${body.slice(0, 500)}`,
      );
      return {
        ok: false,
        provider: "resend",
        error: `resend responded ${res.status}`,
      };
    }

    const json = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, provider: "resend", id: json.id ?? "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email:resend] error ${message}`);
    return { ok: false, provider: "resend", error: message };
  }
}

const BRAND = "#0f766e";

/**
 * Minimal, inline-styled HTML wrapper so emails render consistently across
 * clients without a templating dependency.
 */
export function renderEmail(opts: {
  heading: string;
  intro: string;
  bodyHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<tr><td style="padding-top:24px;">
           <a href="${opts.ctaUrl}" style="background:${BRAND};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;display:inline-block;">${opts.ctaLabel}</a>
         </td></tr>`
      : "";
  return `<!doctype html>
<html><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;padding:32px;max-width:560px;">
        <tr><td style="font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:${BRAND};">TadHealth</td></tr>
        <tr><td style="padding-top:8px;font-size:22px;font-weight:800;color:#0f172a;">${opts.heading}</td></tr>
        <tr><td style="padding-top:12px;font-size:15px;line-height:1.55;color:#334155;">${opts.intro}</td></tr>
        ${opts.bodyHtml ? `<tr><td style="padding-top:16px;font-size:15px;line-height:1.55;color:#334155;">${opts.bodyHtml}</td></tr>` : ""}
        ${cta}
        <tr><td style="padding-top:28px;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0;margin-top:24px;">You're receiving this because you have a TadHealth employee portal account.</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
