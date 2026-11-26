"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const initialState: LoginState = { error: null, email: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.email}
          className="h-12 rounded-md border border-line bg-surface-2 px-4 text-ink outline-none transition-colors focus:border-silver"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.25em] text-ink-muted">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 rounded-md border border-line bg-surface-2 px-4 text-ink outline-none transition-colors focus:border-silver"
        />
      </label>

      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-danger">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-md bg-army text-sm font-semibold uppercase tracking-[0.25em] text-on-army transition-colors hover:bg-army-strong disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
