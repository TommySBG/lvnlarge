"use client";

import { useLayoutEffect } from "react";
import { THEME_EVENT, THEME_STORAGE_KEY } from "@/components/theme-toggle";

// In development, React Strict Mode remounts <html> and resets data-theme to the
// JSX default. Re-apply the saved theme before paint. No-op in production.
export function ThemeSync() {
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      const theme = saved === "light" ? "light" : "dark";
      if (document.documentElement.dataset.theme !== theme) {
        document.documentElement.dataset.theme = theme;
        window.dispatchEvent(new Event(THEME_EVENT));
      }
    } catch {
      // localStorage unavailable: keep the default dark theme.
    }
  }, []);

  return null;
}
