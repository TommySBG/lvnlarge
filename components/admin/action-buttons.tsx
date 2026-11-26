"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ActionState } from "@/lib/admin/action-state";
import { buttonClass } from "./ui";

/**
 * A button that calls a Server Action directly (no form fields needed), e.g.
 * move up/down or remove. Shows an error under it if the action fails.
 */
export function ActionButton({
  action,
  children,
  label,
  confirmText,
  variant = "icon",
  disabled,
  className = "",
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  label?: string;
  confirmText?: string;
  variant?: keyof typeof buttonClass;
  disabled?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        aria-label={label}
        disabled={disabled || pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (!result.ok && result.message) setError(result.message);
          });
        }}
        className={`${buttonClass[variant]} ${className}`}
      >
        {children}
      </button>
      {error && <span className="mt-1 max-w-48 text-xs text-danger">{error}</span>}
    </span>
  );
}
