import Image from "next/image";
import logo from "@/public/brand/logo.png";
import welcome from "@/public/brand/welcome.jpg";
import { catalogueImageUrl } from "@/lib/storage";
import { getCatalogue, getGallery, newArrivals, productsIn } from "@/lib/shop/data";
import { toCard } from "@/lib/shop/card";
import { ProductCard } from "@/components/shop/product-card";
import { PillLink, SectionHeading } from "@/components/shop/ui";
import { WelcomeHero } from "@/components/shop/home/welcome-hero";
import { CollectionsCarousel, type CollectionSlide } from "@/components/shop/home/collections-carousel";
import { GalleryNotebook, type NotebookPhoto } from "@/components/shop/home/gallery-notebook";
import { ComingSoon } from "@/components/shop/home/coming-soon";

// Home: welcome screen → collections → LVN Gallery → coming soon → new in → brand line.
export default async function HomePage() {
  const [catalogue, gallery] = await Promise.all([getCatalogue(), getGallery()]);

  // Featured collections first, then the rest in the owner's order.
  const collections = [...catalogue.collections].sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
  const slides: CollectionSlide[] = collections.map((collection) => {
    const firstPhoto = productsIn(catalogue, collection).find((product) => product.images.length)?.images[0];
    const path = collection.coverPath ?? firstPhoto?.path ?? null;
    return { slug: collection.slug, name: collection.name, image: path ? catalogueImageUrl(path) : null, count: collection.productIds.length };
  });

  const notebook: NotebookPhoto[] = gallery.length
    ? gallery.slice(0, 12).map((photo) => ({ id: photo.id, url: catalogueImageUrl(photo.path), caption: photo.caption, concept: photo.kind === "concept" }))
    : [{ id: "founder", url: welcome.src, caption: "The founder", concept: false }];

  const comingSoon = catalogue.products
    .filter((product) => product.isComingSoon)
    .map((product) => ({ slug: product.slug, name: product.name, image: product.images[0] ? catalogueImageUrl(product.images[0].path) : null }));
  const comingSoonBackground = gallery[1] ?? gallery[0];

  const fresh = newArrivals(catalogue.products);

  return (
    <>
      <WelcomeHero />

      <section id="collections" aria-labelledby="collections-title" className="scroll-mt-16 overflow-hidden py-20 sm:py-28">
        <div className="reveal mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading id="collections-title" eyebrow="The collections" title="LVN’LARGE Collections" />
        </div>
        {slides.length ? (
          <div className="mt-6">
            <CollectionsCarousel slides={slides} />
          </div>
        ) : (
          <p className="mx-auto mt-10 max-w-7xl px-5 text-sm text-ink-muted sm:px-8">Collections are being styled. Check back soon.</p>
        )}
        <div className="mt-8 flex justify-center">
          <PillLink href="/collections">View all</PillLink>
        </div>
      </section>

      <section aria-labelledby="gallery-title" className="overflow-hidden bg-surface py-20 sm:py-28">
        <div className="reveal mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading id="gallery-title" eyebrow="Worn by you, styled by us" title="LVN Gallery" />
        </div>
        <div className="reveal mt-12 px-4 sm:px-8">
          <GalleryNotebook photos={notebook} />
        </div>
        <div className="mt-10 flex justify-center">
          <PillLink href="/gallery" variant="outline">
            View the gallery
          </PillLink>
        </div>
      </section>

      <ComingSoon items={comingSoon} background={comingSoonBackground ? catalogueImageUrl(comingSoonBackground.path) : welcome} />

      {fresh.length > 0 && (
        <section aria-labelledby="new-title" className="py-20 sm:py-28">
          <div className="reveal mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading id="new-title" eyebrow="Just landed" title="New In" action={{ href: "/shop", label: "Shop all" }} />
          </div>
          <ul className="no-scrollbar mx-auto mt-10 flex max-w-7xl snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:gap-5 sm:px-8">
            {fresh.map((product) => (
              <li key={product.id} className="w-[46vw] max-w-[280px] shrink-0 snap-start">
                <ProductCard card={toCard(product)} sizes="(min-width: 640px) 280px, 46vw" />
              </li>
            ))}
          </ul>
          <div className="mt-10 flex justify-center sm:hidden">
            <PillLink href="/shop" variant="outline">
              Shop all
            </PillLink>
          </div>
        </section>
      )}

      <section aria-label="Brand" className="reveal border-t border-line px-5 py-24 text-center sm:py-32">
        <Image src={logo} alt="" className="mx-auto h-auto w-28 animate-fade sm:w-36" />
        <p className="mx-auto mt-10 max-w-4xl font-display text-5xl uppercase leading-[0.95] tracking-wide text-chrome sm:text-7xl">
          Wear luxury. Feel luxury. Be luxury.
        </p>
        <div className="mt-10">
          <PillLink href="/about" variant="outline">
            Our story
          </PillLink>
        </div>
      </section>
    </>
  );
}
