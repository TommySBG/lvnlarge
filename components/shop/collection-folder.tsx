import Image from "next/image";
import Link from "next/link";

export type FolderData = {
  slug: string;
  name: string;
  description: string | null;
  count: number;
  images: string[];
};

// Folder colours cycle through the brand palette.
const tones = [
  { body: "bg-[#161718]", tab: "bg-[#161718]" },
  { body: "bg-[#414d22]", tab: "bg-[#414d22]" },
  { body: "bg-[#3a3d42]", tab: "bg-[#3a3d42]" },
];

/**
 * A collection drawn as a file folder: tab with its number, the name in big
 * letters, and the clothes inside sliding past in the background.
 * `asLink` = the whole folder opens the collection (collections page).
 */
export function CollectionFolder({ folder, index, asLink = true, priority = false }: { folder: FolderData; index: number; asLink?: boolean; priority?: boolean }) {
  const tone = tones[index % tones.length];
  // Repeat the photos so the sliding strip never shows a gap.
  const strip = folder.images.length ? Array.from({ length: Math.max(2, Math.ceil(8 / folder.images.length)) * 2 }, () => folder.images).flat() : [];

  const body = (
    <>
      <div className={`flex h-9 w-[58%] max-w-xs items-center gap-3 rounded-t-2xl px-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 ${tone.tab}`}>
        <span>{String(index + 1).padStart(2, "0")}</span>
        <span className="truncate">Collection</span>
      </div>
      <div className={`relative isolate overflow-hidden rounded-2xl rounded-tl-none border-t border-white/10 text-white shadow-[0_-20px_50px_-20px_rgba(0,0,0,0.6)] ${tone.body}`}>
        {strip.length > 0 && (
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-55">
            <div className="flex h-full w-max animate-marquee gap-2 py-2" style={{ ["--marquee-duration" as string]: `${strip.length * 4}s` }}>
              {strip.map((src, i) => (
                <div key={i} className="relative h-full w-[42vw] max-w-[260px] shrink-0 overflow-hidden rounded-xl sm:w-[22vw]">
                  <Image src={src} alt="" fill sizes="260px" priority={priority && i < 3} loading={priority && i < 3 ? undefined : "eager"} className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/40" />

        <div className="flex min-h-[58svh] flex-col justify-end gap-4 p-5 sm:min-h-[62svh] sm:p-10">
          <h2 className="break-words font-display text-[15vw] uppercase leading-[0.85] tracking-wide text-chrome sm:text-8xl lg:text-9xl">{folder.name}</h2>
          {folder.description && <p className="line-clamp-3 max-w-lg text-sm leading-relaxed text-white/75">{folder.description}</p>}
          <div className="flex items-center justify-between gap-4 border-t border-white/15 pt-4 text-[11px] uppercase tracking-[0.3em] text-white/80">
            <span>
              {folder.count} {folder.count === 1 ? "piece" : "pieces"}
            </span>
            {asLink && <span>Open folder →</span>}
          </div>
        </div>
      </div>
    </>
  );

  return asLink ? (
    <Link href={`/collections/${folder.slug}`} className="block transition-transform duration-300 active:scale-[0.99]" aria-label={`${folder.name} collection`}>
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}
