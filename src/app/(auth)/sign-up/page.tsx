"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "../actions";

export default function SignUpPage() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    undefined,
  );

  return (
    <div className="card-base p-8">
      <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "var(--navy)" }}>
        Create your account
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Start managing your restaurant with UPREVI.
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
          <label htmlFor="name" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="input-base px-3 py-2.5 text-sm"
            placeholder="Jane Restaurateur"
          />
          {state?.fieldErrors?.name && (
            <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
              {state.fieldErrors.name[0]}
            </p>
          )}
        </div>

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
            autoComplete="new-password"
            required
            className="input-base px-3 py-2.5 text-sm"
            placeholder="At least 8 characters"
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
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-center" style={{ color: "var(--text-muted)" }}>
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold" style={{ color: "var(--accent)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
