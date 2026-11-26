"use client";

import { createContext, startTransition, use, useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { idle, type ActionState } from "@/lib/admin/action-state";
import { buttonClass } from "./ui";

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

const PendingContext = createContext<boolean | null>(null);

/** Pending state from the nearest ActionForm, or from a plain <form action>. */
function usePending() {
  const fromActionForm = use(PendingContext);
  const { pending } = useFormStatus();
  return fromActionForm ?? pending;
}

/**
 * A form wired to a Server Action that shows the result message underneath.
 * Submits via onSubmit so React does NOT clear what the owner typed when a
 * save fails validation (React resets <form action> fields after every submit).
 */
export function ActionForm({
  action,
  children,
  className = "flex flex-col gap-5",
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      <PendingContext value={pending}>
        {children}
        <FormMessage state={state} />
      </PendingContext>
    </form>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-sm empty:hidden ${state.ok ? "text-army-strong dark:text-silver" : "text-danger"}`}
    >
      {state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  variant = "primary",
  className = "",
  ...rest
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof buttonClass;
  className?: string;
} & Omit<React.ComponentProps<"button">, "type" | "className" | "children">) {
  const pending = usePending();
  return (
    <button type="submit" disabled={pending} className={`${buttonClass[variant]} ${className}`} {...rest}>
      {pending ? pendingLabel : children}
    </button>
  );
}

/** Submit button that asks "Are you sure?" first (for deletes). */
export function ConfirmButton({
  children,
  confirmText,
  variant = "danger",
  className = "",
}: {
  children: ReactNode;
  confirmText: string;
  variant?: keyof typeof buttonClass;
  className?: string;
}) {
  const pending = usePending();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${buttonClass[variant]} ${className}`}
      onClick={(event) => {
        if (!window.confirm(confirmText)) event.preventDefault();
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
