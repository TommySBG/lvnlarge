import "server-only";
import { updateTag } from "next/cache";

/** Every storefront read is tagged with this, so one call refreshes the shop. */
export const CATALOGUE_TAG = "catalogue";

/**
 * Call from an admin Server Action after changing anything shoppers can see
 * (products, photos, stock, collections, size guides, gallery). The shop shows
 * the change on the next page load.
 */
export function catalogueChanged() {
  updateTag(CATALOGUE_TAG);
}
