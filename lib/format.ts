// Shared formatting helpers (safe on server and client).

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** 1500000 kobo → "₦15,000" */
export function formatNaira(kobo: number): string {
  return naira.format(kobo / 100);
}

/** Kobo → plain naira string for form inputs: 1500000 → "15000" */
export function koboToNairaInput(kobo: number): string {
  const value = kobo / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/** "₦15,000.50" / "15000.5" → 1500050 kobo. Returns null if not a valid amount. */
export function parseNairaToKobo(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const kobo = Math.round(Number(cleaned) * 100);
  return Number.isSafeInteger(kobo) ? kobo : null;
}

/** "Money Motion Swag C" → "money-motion-swag-c"; "LVN'LRG Joggers" → "lvnlrg-joggers" */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
