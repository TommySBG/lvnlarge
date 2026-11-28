// Email gate settings, shared by proxy.ts and the /enter page.

/** Set after a visitor enters their email. Not a login — it only skips the gate. */
export const ENTRY_COOKIE = "lvn_entry";
export const ENTRY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // remember for a year

/** Only allow sending visitors back to a page on this site (never an outside link). */
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.startsWith("/enter") || value.startsWith("/admin")) return "/";
  return value.slice(0, 500);
}
