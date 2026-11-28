"use client";

import { useEffect, useRef } from "react";

/**
 * Marks <html data-past-hero> once the welcome photo has scrolled under the
 * header, so the header turns solid (see .site-header in globals.css).
 */
export function HeroWatcher() {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const hero = marker.current?.parentElement;
    if (!hero) return;
    const root = document.documentElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) delete root.dataset.pastHero;
        else root.dataset.pastHero = "";
      },
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(hero);
    return () => {
      observer.disconnect();
      delete root.dataset.pastHero;
    };
  }, []);

  return <span ref={marker} hidden />;
}
