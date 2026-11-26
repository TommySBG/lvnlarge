"use client";

import { useOptimistic, useState, useTransition } from "react";
import { adjustStock } from "./actions";

/** Big − / + buttons for one size/colour. Shows the new number instantly. */
export function StockStepper({ variantId, quantity, label }: { variantId: string; quantity: number; label: string }) {
  const [optimistic, addOptimistic] = useOptimistic(quantity, (current: number, by: number) => current + by);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(by: number) {
    setError(null);
    startTransition(async () => {
      addOptimistic(by);
      const result = await adjustStock(variantId, by);
      if (!result.ok) setError(result.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1" aria-busy={pending}>
        <button
          type="button"
          aria-label={`Remove one ${label}`}
          disabled={optimistic <= 0}
          onClick={() => change(-1)}
          className="h-12 w-12 rounded-lg border border-line text-xl text-silver-strong transition-colors hover:border-silver disabled:opacity-30"
        >
          −
        </button>
        <output aria-live="polite" className="w-12 text-center font-display text-2xl text-silver-strong">
          {optimistic}
        </output>
        <button
          type="button"
          aria-label={`Add one ${label}`}
          onClick={() => change(1)}
          className="h-12 w-12 rounded-lg border border-line text-xl text-silver-strong transition-colors hover:border-silver"
        >
          +
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
