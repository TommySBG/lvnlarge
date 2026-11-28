import { formatNaira } from "@/lib/format";
import { catalogueImageUrl } from "@/lib/storage";
import { colourImages, type ShopProduct } from "@/lib/shop/data";

/** Plain, serialisable data for <ProductCard> (a Client Component). */
export type CardData = {
  slug: string;
  name: string;
  price: string;
  badge: "Sold out" | "Coming soon" | "New" | null;
  slides: { url: string | null; alt: string; colour: string | null; hex: string | null }[];
  /** Colour dots (shown even when photos aren't matched to colours yet). */
  colours: { name: string; hex: string | null }[];
  /** True when each slide is a colour, so tapping a dot can jump to it. */
  colourLinked: boolean;
};

export function toCard(product: ShopProduct): CardData {
  const colourLinked = product.colours.length > 0 && product.images.some((image) => image.colourId);
  return {
    slug: product.slug,
    name: product.name,
    price: formatNaira(product.priceKobo),
    badge: product.isComingSoon ? "Coming soon" : !product.inStock ? "Sold out" : product.isNew ? "New" : null,
    slides: colourLinked
      ? colourImages(product).map(({ colour, image }) => ({
          url: image ? catalogueImageUrl(image.path) : null,
          alt: image?.alt || (colour ? `${product.name} in ${colour.name}` : product.name),
          colour: colour?.name ?? null,
          hex: colour?.hex ?? null,
        }))
      : // Photos not matched to colours yet: swipe through the first few photos instead.
        (product.images.length ? product.images.slice(0, 4) : [null]).map((image, index) => ({
          url: image ? catalogueImageUrl(image.path) : null,
          alt: image?.alt || `${product.name}${index ? ` — photo ${index + 1}` : ""}`,
          colour: null,
          hex: null,
        })),
    colours: product.colours.map(({ name, hex }) => ({ name, hex })),
    colourLinked,
  };
}
