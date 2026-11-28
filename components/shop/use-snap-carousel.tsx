"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Swipeable, scroll-snapping carousel that advances by itself.
 * - Touch/drag/scroll works natively (CSS scroll-snap).
 * - Autoplay pauses while the visitor interacts, when it's off-screen or the
 *   tab is hidden, and is off entirely for reduced-motion users.
 * Children of `track` are the slides; the track must be position: relative.
 */
export function useSnapCarousel({
  count,
  interval = 5500,
  onFrame,
}: {
  count: number;
  interval?: number;
  /** Called on every scroll frame (e.g. to apply 3D transforms). */
  onFrame?: (track: HTMLDivElement) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const pausedUntil = useRef(0);
  const onScreen = useRef(false);
  const frame = useRef(0);
  const onFrameRef = useRef(onFrame);
  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  const slides = () => Array.from(track.current?.children ?? []) as HTMLElement[];

  const scrollToIndex = useCallback((target: number, smooth = true) => {
    const el = track.current;
    const child = slides()[target];
    if (!el || !child) return;
    const left = child.offsetLeft + child.offsetWidth / 2 - el.clientWidth / 2;
    el.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
  }, []);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const centre = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDistance = Infinity;
    slides().forEach((child, i) => {
      const distance = Math.abs(child.offsetLeft + child.offsetWidth / 2 - centre);
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    if (best !== indexRef.current) {
      indexRef.current = best;
      setIndex(best);
    }
    onFrameRef.current?.(el);
  }, []);

  const onScroll = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(measure);
  }, [measure]);

  const pause = useCallback(() => {
    pausedUntil.current = Date.now() + 8000;
  }, []);

  // First paint + resize.
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  // Only autoplay while visible on screen.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => (onScreen.current = entry.isIntersecting), { threshold: 0.4 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (document.hidden || !onScreen.current || Date.now() < pausedUntil.current) return;
      scrollToIndex((indexRef.current + 1) % count);
    }, interval);
    return () => window.clearInterval(timer);
  }, [count, interval, scrollToIndex]);

  const goTo = useCallback(
    (target: number) => {
      pause();
      scrollToIndex(((target % count) + count) % count);
    },
    [count, pause, scrollToIndex],
  );

  return {
    track,
    index,
    goTo,
    trackProps: {
      ref: track,
      onScroll,
      onPointerDown: pause,
      onTouchStart: pause,
      onWheel: pause,
      onFocus: pause,
    },
  };
}

export function Dots({ count, index, onSelect, label, tone = "auto" }: { count: number; index: number; onSelect: (i: number) => void; label: string; tone?: "auto" | "dark" }) {
  if (count < 2) return null;
  return (
    <div className="flex items-center justify-center gap-1" role="group" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <button key={i} type="button" onClick={() => onSelect(i)} aria-label={`Show ${i + 1} of ${count}`} aria-current={i === index ? "true" : undefined} className="flex h-8 items-center px-1">
          <span
            className={`block h-1.5 rounded-full transition-all duration-500 ${
              i === index ? `w-6 ${tone === "dark" ? "bg-neutral-800" : "bg-silver-strong"}` : `w-1.5 ${tone === "dark" ? "bg-neutral-400" : "bg-line"}`
            }`}
          />
        </button>
      ))}
    </div>
  );
}
