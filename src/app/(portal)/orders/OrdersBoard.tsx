"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatus } from "./actions";

export interface BoardOrder {
  id: string;
  customerName: string;
  orderType: "DELIVERY" | "PICKUP" | "DINE_IN";
  channel: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: "var(--gold-dim)", fg: "var(--gold)" },
  CONFIRMED: { bg: "var(--blue-dim)", fg: "var(--blue)" },
  PREPARING: { bg: "var(--blue-dim)", fg: "var(--blue)" },
  READY: { bg: "var(--accent-dim)", fg: "var(--accent)" },
  OUT_FOR_DELIVERY: { bg: "var(--accent-dim)", fg: "var(--accent)" },
  DELIVERED: { bg: "var(--green-dim)", fg: "var(--green)" },
  CANCELLED: { bg: "var(--red-dim)", fg: "var(--red)" },
  REFUNDED: { bg: "var(--red-dim)", fg: "var(--red)" },
};

const FILTERS = ["ACTIVE", "ALL", "PENDING", "PREPARING", "DELIVERED"] as const;
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];

// Primary "advance" action per status (label + next state).
function primaryAction(o: BoardOrder): { label: string; next: string } | null {
  switch (o.status) {
    case "PENDING": return { label: "Confirm", next: "CONFIRMED" };
    case "CONFIRMED": return { label: "Start preparing", next: "PREPARING" };
    case "PREPARING": return { label: "Mark ready", next: "READY" };
    case "READY":
      return o.orderType === "DELIVERY"
        ? { label: "Out for delivery", next: "OUT_FOR_DELIVERY" }
        : { label: "Mark picked up", next: "DELIVERED" };
    case "OUT_FOR_DELIVERY": return { label: "Mark delivered", next: "DELIVERED" };
    default: return null;
  }
}

const CANCELLABLE = ["PENDING", "CONFIRMED", "PREPARING"];

export function OrdersBoard({ orders }: { orders: BoardOrder[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ACTIVE");
  const [pending, startTransition] = useTransition();
  const [live, setLive] = useState(true);

  // Live-ish: re-fetch the server component on an interval.
  // TODO(uprevi: phase 3) replace polling with WebSocket/SSE push.
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => router.refresh(), 8000);
    return () => clearInterval(t);
  }, [live, router]);

  const filtered = orders.filter((o) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return ACTIVE_STATUSES.includes(o.status);
    return o.status === filter;
  });

  const act = (orderId: string, next: string) =>
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, next as never);
      if (!res.ok) alert(res.error);
      router.refresh();
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: filter === f ? "var(--navy)" : "var(--card)", color: filter === f ? "#fff" : "var(--text-muted)", border: "1px solid var(--border)" }}>
              {f.charAt(0) + f.slice(1).toLowerCase().replace(/_/g, " ")}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setLive((v) => !v)} className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: live ? "var(--green)" : "var(--text-dim)" }} />
          {live ? "Live" : "Paused"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm py-10 text-center" style={{ color: "var(--text-dim)" }}>No orders here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((o) => {
            const c = STATUS_COLORS[o.status] ?? STATUS_COLORS.PENDING;
            const action = primaryAction(o);
            return (
              <div key={o.id} className="card-base p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold" style={{ color: "var(--navy)" }}>{o.customerName}</p>
                      <span className="badge" style={{ background: c.bg, color: c.fg }}>{o.status.replace(/_/g, " ")}</span>
                      <span className="text-xs" style={{ color: "var(--text-dim)" }}>{o.channel} · {o.orderType.toLowerCase()}</span>
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                    </p>
                  </div>
                  <span className="font-mono-price text-sm shrink-0" style={{ color: "var(--navy)" }}>${o.total.toFixed(2)}</span>
                </div>

                {(action || CANCELLABLE.includes(o.status)) && (
                  <div className="flex gap-2 mt-3">
                    {action && (
                      <button type="button" disabled={pending} onClick={() => act(o.id, action.next)} className="btn-accent px-3 py-1.5 text-xs disabled:opacity-60">
                        {action.label}
                      </button>
                    )}
                    {CANCELLABLE.includes(o.status) && (
                      <button type="button" disabled={pending} onClick={() => { if (confirm("Cancel this order?")) act(o.id, "CANCELLED"); }} className="btn-ghost px-3 py-1.5 text-xs">
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
