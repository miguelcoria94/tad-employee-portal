/**
 * Build a minimal RFC-5545 .ics file for one calendar event. Works with
 * Google Calendar, Apple Calendar, Outlook, etc.
 */

function fmtUtc(iso: string): string {
  const d = new Date(iso);
  return (
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  );
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function stripHtml(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}

export function buildEventIcs(event: {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
  startsAt: string;
  endsAt?: string | null;
}): string {
  const end = event.endsAt ?? event.startsAt;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TadHealth//Employee Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@tadhealth.com`,
    `DTSTAMP:${fmtUtc(new Date().toISOString())}`,
    `DTSTART:${fmtUtc(event.startsAt)}`,
    `DTEND:${fmtUtc(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];
  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(stripHtml(event.description))}`);
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }
  if (event.url) {
    lines.push(`URL:${event.url}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(event: Parameters<typeof buildEventIcs>[0]): void {
  const ics = buildEventIcs(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
