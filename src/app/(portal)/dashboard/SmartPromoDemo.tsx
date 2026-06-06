"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { runSmartPromo, type PromoResult } from "../actions";

export function SmartPromoDemo({ restaurantId }: { restaurantId: string }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<PromoResult | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setResult(await runSmartPromo(restaurantId));
          })
        }
        className="btn-accent px-4 py-2 text-sm self-start disabled:opacity-60"
      >
        <Sparkles size={15} />
        {pending ? "Generating…" : "Generate smart promo"}
      </button>

      {result && (
        <div
          className="text-sm rounded-md px-3 py-2"
          style={
            result.ok
              ? { background: "var(--green-dim)", color: "var(--green)" }
              : { background: "var(--accent-dim)", color: "var(--accent)" }
          }
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
