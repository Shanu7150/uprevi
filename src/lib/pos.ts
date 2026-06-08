import "server-only";
import type { PosProvider } from "@/generated/prisma/enums";

/**
 * POS integration scaffold (§10.17 — "last, hardest, one at a time").
 *
 * This is the connection framework, not a live integration. Real provider OAuth
 * + menu/order sync is gated behind provider credentials and left as a TODO;
 * without them, a connection is recorded as PENDING (degrades gracefully).
 */
export const POS_PROVIDERS: { id: PosProvider; name: string; blurb: string }[] = [
  { id: "SQUARE", name: "Square", blurb: "Sync menu, orders, and inventory with Square." },
  { id: "CLOVER", name: "Clover", blurb: "Two-way order sync with Clover registers." },
  { id: "TOAST", name: "Toast", blurb: "Connect Toast for a unified order flow." },
];

const ENV_KEY: Record<PosProvider, string> = {
  SQUARE: "SQUARE_ACCESS_TOKEN",
  CLOVER: "CLOVER_ACCESS_TOKEN",
  TOAST: "TOAST_ACCESS_TOKEN",
};

/** Whether real credentials exist for live sync. Without them, connect is a PENDING request. */
export function posConfigured(provider: PosProvider): boolean {
  return Boolean(process.env[ENV_KEY[provider]]);
}

// TODO(uprevi): implement provider OAuth + menu/order sync, one provider at a time,
// starting with Square. Until then connect() records intent and the UPREVI team
// completes onboarding manually.
