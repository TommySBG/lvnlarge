export const CATALOGUE_BUCKET = "catalogue";

/** Public URL for a file in the catalogue photo bucket. */
export function catalogueImageUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${CATALOGUE_BUCKET}/${encoded}`;
}
