"use client";

import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "lvn-theme";
export const THEME_EVENT = "lvn-theme-change";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

/** `plain`: no bubble, bold silver icon (shop header; needs the #lvn-silver-stroke gradient on the page). */
export function ThemeToggle({ className = "", plain = false }: { className?: string; plain?: boolean }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => "dark");
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private browsing: theme still switches for this visit.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} mode`}
      className={
        plain
          ? `inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 ${className}`
          : `inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-silver transition-colors hover:border-silver hover:text-silver-strong ${className}`
      }
    >
      {theme === "dark" ? (
        // Sun
        <svg aria-hidden="true" viewBox="0 0 24 24" className={plain ? "h-6 w-6" : "h-4 w-4"} fill="none" stroke={plain ? "url(#lvn-silver-stroke)" : "currentColor"} strokeWidth={plain ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        // Moon
        <svg aria-hidden="true" viewBox="0 0 24 24" className={plain ? "h-6 w-6" : "h-4 w-4"} fill="none" stroke={plain ? "url(#lvn-silver-stroke)" : "currentColor"} strokeWidth={plain ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
