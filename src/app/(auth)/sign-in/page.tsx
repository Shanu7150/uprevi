"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signInAction, type AuthFormState } from "../actions";

export default function SignInPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signInAction,
    undefined,
  );

  return (
    <div className="card-base p-8">
      <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "var(--navy)" }}>
        Welcome back
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Sign in to your UPREVI portal.
      </p>

      {state?.error && (
        <div
          className="mb-4 text-sm rounded-md px-3 py-2"
          style={{ background: "var(--red-dim)", color: "var(--red)" }}
        >
          {state.error}
        </div>
      )}

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-base px-3 py-2.5 text-sm"
            placeholder="you@restaurant.com"
          />
          {state?.fieldErrors?.email && (
            <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="input-base px-3 py-2.5 text-sm"
            placeholder="••••••••"
          />
          {state?.fieldErrors?.password && (
            <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="btn-accent w-full py-2.5 text-sm mt-1 disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
        New to UPREVI?{" "}
        <Link href="/sign-up" className="font-semibold" style={{ color: "var(--accent)" }}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
