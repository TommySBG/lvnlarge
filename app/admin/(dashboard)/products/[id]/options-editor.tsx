"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/admin/forms";
import { buttonClass, inputClass } from "@/components/admin/ui";
import type { ActionState } from "@/lib/admin/action-state";

type Size = { id: string; label: string };
type Colour = { id?: string; name: string; hex: string | null };



export function OptionsEditor({
  action,
  sizes,
  selectedSizeIds,
  initialColours,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  sizes: Size[];
  selectedSizeIds: string[];
  initialColours: Colour[];
}) {
  const [colours, setColours] = useState(() =>
    initialColours.map((colour) => ({ ...colour, key: colour.id ?? crypto.randomUUID() })),
  );

  function update(key: string, patch: Partial<Colour>) {
    setColours((list) => list.map((colour) => (colour.key === key ? { ...colour, ...patch } : colour)));
  }

  return (
    <ActionForm action={action}>
      <fieldset>
        <legend className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">Sizes</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-7">
          {sizes.map((size) => (
            <label key={size.id} className="relative">
              <input
                type="checkbox"
                name="sizes"
                value={size.id}
                defaultChecked={selectedSizeIds.includes(size.id)}
                className="peer sr-only"
              />
              <span className="flex min-h-12 cursor-pointer items-center justify-center rounded-lg border border-line px-2 text-sm font-semibold text-ink-muted transition-colors peer-checked:border-army-strong peer-checked:bg-army peer-checked:text-on-army peer-focus-visible:outline-2 peer-focus-visible:outline-silver">
                {size.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-ink-muted">Colours</legend>
        <p className="mb-3 text-xs text-ink-muted">
          Leave empty if the product only comes in one colour (e.g. a green tee listed as green).
        </p>
        <ul className="flex flex-col gap-2">
          {colours.map((colour) => (
            <li key={colour.key} className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`Swatch for ${colour.name || "new colour"}`}
                value={colour.hex ?? "#4b5320"}
                onChange={(event) => update(colour.key, { hex: event.target.value })}
                className="h-12 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-surface-2 p-1"
              />
              <input
                aria-label="Colour name"
                value={colour.name}
                placeholder="e.g. Black"
                maxLength={60}
                onChange={(event) => update(colour.key, { name: event.target.value })}
                className={inputClass}
              />
              <button
                type="button"
                aria-label={`Remove ${colour.name || "colour"}`}
                onClick={() => setColours((list) => list.filter((item) => item.key !== colour.key))}
                className={buttonClass.icon}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => setColours((list) => [...list, { key: crypto.randomUUID(), name: "", hex: "#111111" }])}
          className={`${buttonClass.secondary} mt-3 w-full sm:w-auto`}
        >
          + Add colour
        </button>
      </fieldset>

      <input
        type="hidden"
        name="colours"
        value={JSON.stringify(colours.map(({ id, name, hex }) => ({ id, name: name.trim(), hex })))}
      />
      <SubmitButton>Save sizes &amp; colours</SubmitButton>
    </ActionForm>
  );
}
