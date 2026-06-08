"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plug, Check, Clock } from "lucide-react";
import { connectPos, disconnectPos } from "./posActions";

const PROVIDERS = [
  { id: "SQUARE", name: "Square", blurb: "Sync menu, orders, and inventory with Square." },
  { id: "CLOVER", name: "Clover", blurb: "Two-way order sync with Clover registers." },
  { id: "TOAST", name: "Toast", blurb: "Connect Toast for a unified order flow." },
] as const;

type Provider = (typeof PROVIDERS)[number]["id"];

export function PosSection({ connection }: { connection: { provider: string; status: string } | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const connect = (provider: Provider) =>
    startTransition(async () => {
      const res = await connectPos(provider);
      if (res.ok && res.status === "PENDING") {
        alert("Connection requested. Live sync needs provider credentials; your UPREVI team will finish onboarding.");
      }
      router.refresh();
    });

  const disconnect = () =>
    startTransition(async () => {
      await disconnectPos();
      router.refresh();
    });

  if (connection) {
    const connected = connection.status === "CONNECTED";
    const meta = PROVIDERS.find((p) => p.id === connection.provider);
    return (
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: connected ? "var(--green-dim)" : "var(--gold-dim)", color: connected ? "var(--green)" : "var(--gold)" }}>
            {connected ? <Check size={18} /> : <Clock size={18} />}
          </span>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{meta?.name ?? connection.provider}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {connected ? "Connected" : "Pending — onboarding in progress"}
            </p>
          </div>
        </div>
        <button type="button" disabled={pending} onClick={disconnect} className="btn-ghost px-3 py-2 text-sm disabled:opacity-60">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {PROVIDERS.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{p.name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.blurb}</p>
          </div>
          <button type="button" disabled={pending} onClick={() => connect(p.id)} className="btn-ghost px-3 py-2 text-sm shrink-0 disabled:opacity-60">
            <Plug size={14} /> Connect
          </button>
        </div>
      ))}
    </div>
  );
}
