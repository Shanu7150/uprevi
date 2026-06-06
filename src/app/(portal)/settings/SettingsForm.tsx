"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import { updateRestaurant, type SettingsState } from "./actions";

export interface SettingsInitial {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  cuisineType: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  onDoorDash: boolean;
  onUberEats: boolean;
}

export function SettingsForm({ initial }: { initial: SettingsInitial }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateRestaurant,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-6">
      {state?.ok && (
        <div className="text-sm rounded-md px-3 py-2 flex items-center gap-2" style={{ background: "var(--green-dim)", color: "var(--green)" }}>
          <Check size={15} /> Saved.
        </div>
      )}

      <Card title="Restaurant profile">
        <div className="grid sm:grid-cols-2 gap-4">
          <Text name="name" label="Name" defaultValue={initial.name} required errors={state && !state.ok ? state.fieldErrors?.name : undefined} />
          <Text name="cuisineType" label="Cuisine" defaultValue={initial.cuisineType} />
        </div>
        <Area name="description" label="Description" defaultValue={initial.description} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Text name="phone" label="Phone" defaultValue={initial.phone} />
          <Text name="email" label="Email" type="email" defaultValue={initial.email} />
        </div>
      </Card>

      <Card title="Location">
        <Text name="address" label="Street address" defaultValue={initial.address} />
        <div className="grid sm:grid-cols-3 gap-4">
          <Text name="city" label="City" defaultValue={initial.city} />
          <Text name="state" label="State" defaultValue={initial.state} />
          <Text name="zip" label="ZIP" defaultValue={initial.zip} />
        </div>
      </Card>

      <Card title="Delivery & platforms">
        <div className="grid sm:grid-cols-2 gap-4">
          <Num name="deliveryFee" label="Delivery fee ($)" step="0.01" defaultValue={initial.deliveryFee} />
          <Num name="minimumOrder" label="Minimum order ($)" step="0.01" defaultValue={initial.minimumOrder} />
          <Num name="estimatedDeliveryMin" label="Est. delivery min (min)" defaultValue={initial.estimatedDeliveryMin} />
          <Num name="estimatedDeliveryMax" label="Est. delivery max (min)" defaultValue={initial.estimatedDeliveryMax} />
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <Toggle name="onDoorDash" label="Active on DoorDash" defaultChecked={initial.onDoorDash} />
          <Toggle name="onUberEats" label="Active on UberEats" defaultChecked={initial.onUberEats} />
        </div>
      </Card>

      <div>
        <button type="submit" disabled={pending} className="btn-accent px-6 py-2.5 text-sm disabled:opacity-60">
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-base p-6">
      <h2 className="font-display text-lg font-bold mb-4" style={{ color: "var(--navy)" }}>{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium mb-1.5" style={{ color: "var(--text)" }}>
      {children}
    </label>
  );
}

function Text({ name, label, defaultValue, type = "text", required, errors }: { name: string; label: string; defaultValue?: string; type?: string; required?: boolean; errors?: string[] }) {
  return (
    <div>
      <Label htmlFor={name}>{label}{required && <span style={{ color: "var(--accent)" }}> *</span>}</Label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue} className="input-base px-3 py-2.5 text-sm" />
      {errors && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors[0]}</p>}
    </div>
  );
}

function Num({ name, label, defaultValue, step }: { name: string; label: string; defaultValue?: number; step?: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <input id={name} name={name} type="number" step={step ?? "1"} min="0" defaultValue={defaultValue} className="input-base px-3 py-2.5 text-sm font-mono-price" />
    </div>
  );
}

function Area({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <textarea id={name} name={name} rows={2} defaultValue={defaultValue} className="input-base px-3 py-2.5 text-sm resize-none" />
    </div>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2.5 text-sm cursor-pointer" style={{ color: "var(--text)" }}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="w-4 h-4 accent-[var(--navy)]" />
      {label}
    </label>
  );
}
