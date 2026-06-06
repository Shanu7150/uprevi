"use client";

import { useState, useTransition } from "react";
import { CreditCard, CheckCircle2 } from "lucide-react";
import { startConnectOnboarding } from "./actions";

export function ConnectButton({ connected }: { connected: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (connected) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "var(--green)" }}>
        <CheckCircle2 size={16} /> Stripe payouts connected.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await startConnectOnboarding();
            if (res?.ok) {
              window.location.href = res.url;
            } else {
              setError(res?.error ?? "Could not start onboarding.");
            }
          })
        }
        className="btn-accent px-4 py-2.5 text-sm disabled:opacity-60"
      >
        <CreditCard size={15} />
        {pending ? "Starting…" : "Connect Stripe payouts"}
      </button>
      {error && <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  );
}
