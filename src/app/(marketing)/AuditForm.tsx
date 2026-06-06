"use client";

import { useActionState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { submitLead, type LeadFormState } from "./actions";

export function AuditForm() {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(
    submitLead,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="card-base p-8 text-center">
        <span
          className="inline-flex w-12 h-12 items-center justify-center rounded-full mb-4"
          style={{ background: "var(--green-dim)", color: "var(--green)" }}
        >
          <Check size={22} />
        </span>
        <h3 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          You&apos;re on the list
        </h3>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          We&apos;ll reach out within one business day to book your free delivery
          revenue audit.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="card-base p-6 sm:p-8 flex flex-col gap-4">
      {state?.error && (
        <div
          className="text-sm rounded-md px-3 py-2"
          style={{ background: "var(--red-dim)", color: "var(--red)" }}
        >
          {state.error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="name" label="Your name" placeholder="Jane Restaurateur" required errors={state?.fieldErrors?.name} />
        <Field name="restaurantName" label="Restaurant" placeholder="Bella Cucina" />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="email" label="Email" type="email" placeholder="you@restaurant.com" required errors={state?.fieldErrors?.email} />
        <Field name="phone" label="Phone" type="tel" placeholder="(312) 555-0142" />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
          What&apos;s your biggest delivery challenge? <span style={{ color: "var(--text-dim)" }}>(optional)</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="input-base px-3 py-2.5 text-sm resize-none"
          placeholder="Tell us about your DoorDash / UberEats setup…"
        />
      </div>

      <button type="submit" disabled={pending} className="btn-accent py-3.5 text-base mt-1 disabled:opacity-60">
        {pending ? "Sending…" : "Book my free audit"}
        {!pending && <ArrowRight size={17} />}
      </button>
      <p className="text-xs text-center" style={{ color: "var(--text-dim)" }}>
        No commitment. We&apos;ll review your delivery presence and show you where the revenue is.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
  errors,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
        {label}
        {required && <span style={{ color: "var(--accent)" }}> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="input-base px-3 py-2.5 text-sm"
      />
      {errors && (
        <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
          {errors[0]}
        </p>
      )}
    </div>
  );
}
