import type { Metadata } from "next";
import { getCatalogue } from "@/lib/shop/data";
import { toFolder } from "@/lib/shop/folder";
import { CollectionFolder } from "@/components/shop/collection-folder";
import { PageIntro } from "@/components/shop/ui";

export const metadata: Metadata = {
  title: "Living Large Collections",
  description: "Every LVN’LARGE collection, from Swagging Since 06 to Cap A Lot.",
};

export default async function CollectionsPage() {
  const catalogue = await getCatalogue();

  return (
    <>
      <PageIntro eyebrow="Living Large" title="Collections">
        Each folder holds a different side of LVN’LARGE. Tap one to open it.
      </PageIntro>

      <div className="mx-auto max-w-7xl px-3 pb-24 sm:px-8">
        {catalogue.collections.length === 0 ? (
          <p className="px-2 text-sm text-ink-muted">Collections are being styled. Check back soon.</p>
        ) : (
          <ol>
            {catalogue.collections.map((collection, index) => (
              // Folders stick under the header and stack like files in a drawer.
              <li key={collection.id} className="sticky mb-6 sm:mb-10" style={{ top: `calc(4.5rem + ${Math.min(index, 6) * 0.9}rem)` }}>
                <CollectionFolder folder={toFolder(catalogue, collection)} index={index} priority={index === 0} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
