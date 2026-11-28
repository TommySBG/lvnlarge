import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import welcome from "@/public/brand/welcome.jpg";
import { catalogueImageUrl } from "@/lib/storage";
import { getGallery, type GalleryKind } from "@/lib/shop/data";
import { PageIntro } from "@/components/shop/ui";

export const metadata: Metadata = {
  title: "LVN Gallery",
  description: "The LVN’LARGE lookbook — the founder, models, customers and campaigns.",
};

const kindLabel: Record<GalleryKind, string> = {
  founder: "Founder",
  model: "Model",
  customer: "Customer",
  campaign: "Campaign",
  editorial: "Editorial",
  concept: "Concept",
};

export default async function GalleryPage() {
  const photos = await getGallery();

  return (
    <>
      <PageIntro eyebrow="Lookbook" title="LVN Gallery">
        LVN’LARGE as it’s really worn — by the founder, our models and our people.
      </PageIntro>

      <div className="mx-auto max-w-7xl px-3 pb-24 sm:px-8">
        {photos.length === 0 ? (
          <figure className="mx-auto max-w-sm">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image src={welcome} alt="The LVN’LARGE founder" fill placeholder="blur" sizes="384px" className="object-cover" />
            </div>
            <figcaption className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-ink-muted">More of the lookbook is coming soon</figcaption>
          </figure>
        ) : (
          <ul className="columns-2 gap-3 sm:gap-5 lg:columns-3">
            {photos.map((photo, index) => (
              <li key={photo.id} className="reveal mb-3 break-inside-avoid sm:mb-5">
                <figure className="group relative overflow-hidden rounded-2xl bg-surface">
                  <Image
                    src={catalogueImageUrl(photo.path)}
                    alt={photo.caption ?? `LVN’LARGE ${kindLabel[photo.kind].toLowerCase()} photo`}
                    width={1000}
                    height={1250}
                    priority={index < 2}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                  <span
                    className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] backdrop-blur ${
                      photo.kind === "concept" ? "bg-white/90 text-black" : "bg-black/55 text-white"
                    }`}
                  >
                    {photo.kind === "concept" ? "Concept — not the final product" : kindLabel[photo.kind]}
                  </span>
                  {(photo.caption || photo.product) && (
                    <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/85 to-transparent p-3 pt-10 text-white">
                      {photo.caption && <span className="text-xs leading-snug">{photo.caption}</span>}
                      {photo.product && (
                        <Link href={`/product/${photo.product.slug}`} className="inline-flex min-h-9 w-fit items-center rounded-full bg-white px-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
                          Shop the look
                        </Link>
                      )}
                    </figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
