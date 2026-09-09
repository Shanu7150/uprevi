"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { createRestaurant, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createRestaurant, undefined);

  return (
    <form action={action} className="card-base p-6 sm:p-8 flex flex-col gap-5">
      {state?.error && <div className="text-sm rounded-md px-3 py-2" style={{ background: "var(--red-dim)", color: "var(--red)" }}>{state.error}</div>}
      <Field name="name" label="Restaurant name" placeholder="Bella Cucina" required errors={state?.fieldErrors?.name} />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field name="city" label="City" placeholder="Chicago" errors={state?.fieldErrors?.city} />
        <Field name="state" label="State" placeholder="IL" maxLength={2} errors={state?.fieldErrors?.state} />
      </div>
      <Field name="phone" label="Restaurant phone" type="tel" placeholder="(312) 555-0142" errors={state?.fieldErrors?.phone} />
      <fieldset>
        <legend className="text-sm font-medium mb-2" style={{ color: "var(--text)" }}>Delivery platforms</legend>
        <div className="flex flex-wrap gap-5 text-sm" style={{ color: "var(--text-muted)" }}>
          <label className="flex items-center gap-2"><input type="checkbox" name="onDoorDash" /> DoorDash</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="onUberEats" /> Uber Eats</label>
        </div>
      </fieldset>
      <button type="submit" disabled={pending} className="btn-accent py-3.5 text-base disabled:opacity-60">
        {pending ? "Connecting…" : "Connect restaurant"}{!pending && <ArrowRight size={17} />}
      </button>
      <p className="text-xs text-center" style={{ color: "var(--text-dim)" }}>This creates your secure restaurant workspace and starts you on the base Sprint access level.</p>
    </form>
  );
}

function Field({ name, label, placeholder, type = "text", required, maxLength, errors }: { name: string; label: string; placeholder?: string; type?: string; required?: boolean; maxLength?: number; errors?: string[] }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>{label}{required && <span style={{ color: "var(--accent)" }}> *</span>}</label>
      <input id={name} name={name} type={type} required={required} maxLength={maxLength} placeholder={placeholder} className="input-base px-3 py-2.5 text-sm" />
      {errors && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors[0]}</p>}
    </div>
  );
}
