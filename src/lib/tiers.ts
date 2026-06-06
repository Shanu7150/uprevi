import type { Tier } from "@/generated/prisma/enums";

/**
 * Pure tier + feature metadata — no database, no `server-only`.
 *
 * Safe to import from both client and server. The DB-backed enforcement
 * (getTier / requireEntitlement) lives in `src/lib/entitlements.ts`.
 *
 * Data is reconciled to UPREVI-MASTER-BUILD-PROMPT.md §6 (tiers + entitlement
 * map) and §9 (brand). The master map is additive up the ladder, so a single
 * `minTier` per feature reproduces it exactly.
 */
export type { Tier };

/** Tier ladder, lowest → highest access. SPRINT is the 90-day entry engagement. */
export const TIER_ORDER: Tier[] = [
  "SPRINT",
  "STARTER",
  "PRO",
  "ACCELERATOR",
  "PARTNER",
];

export function tierRank(tier: Tier): number {
  return TIER_ORDER.indexOf(tier);
}

/** Gated capability keys (canonical set — master §6). */
export type FeatureKey =
  | "dashboard_basic"
  | "channel_single"
  | "reviews_monitor"
  | "reporting"
  | "tasks"
  | "channel_both"
  | "ordering"
  | "loyalty"
  | "reviews_ai"
  | "menu_optimization"
  | "smart_promos"
  | "predictive_dashboard"
  | "smart_upsell"
  | "winback_automation"
  | "competitive_analysis"
  | "google_ads"
  | "social_media"
  | "seo"
  | "dedicated_manager"
  | "video_content"
  | "catering_funnels";

export interface FeatureMeta {
  label: string;
  description: string;
  /** Minimum tier that unlocks this feature. */
  minTier: Tier;
}

export const FEATURES: Record<FeatureKey, FeatureMeta> = {
  // ── SPRINT / STARTER ──
  dashboard_basic: {
    label: "Dashboard",
    description: "Revenue, orders, and trends at a glance.",
    minTier: "SPRINT",
  },
  channel_single: {
    label: "Single-platform tracking",
    description: "Track performance on one delivery platform.",
    minTier: "SPRINT",
  },
  reviews_monitor: {
    label: "Review monitoring",
    description: "See reviews from every platform in one place.",
    minTier: "SPRINT",
  },
  reporting: {
    label: "Performance reporting",
    description: "Periodic performance reports for your store.",
    minTier: "SPRINT",
  },
  tasks: {
    label: "Tasks & collaboration",
    description: "See what your UPREVI team is doing and approve items.",
    minTier: "SPRINT",
  },
  // ── PRO ──
  channel_both: {
    label: "DoorDash + UberEats intelligence",
    description: "Both delivery platforms combined into one unified view.",
    minTier: "PRO",
  },
  ordering: {
    label: "Online ordering engine",
    description: "Your own branded ordering with zero transaction fees.",
    minTier: "PRO",
  },
  loyalty: {
    label: "Loyalty & rewards",
    description: "Points, tiers, rewards, and referrals.",
    minTier: "PRO",
  },
  reviews_ai: {
    label: "AI review responses",
    description: "Draft on-brand replies and detect recurring complaints.",
    minTier: "PRO",
  },
  menu_optimization: {
    label: "Menu & photo optimization",
    description: "Item positioning, pricing, and photo guidance.",
    minTier: "PRO",
  },
  // ── ACCELERATOR ──
  smart_promos: {
    label: "Smart promotions",
    description: "AI-timed promos tuned to weather, events, and game days.",
    minTier: "ACCELERATOR",
  },
  predictive_dashboard: {
    label: "Predictive revenue dashboard",
    description: "Weather and game-day demand forecasting.",
    minTier: "ACCELERATOR",
  },
  smart_upsell: {
    label: "Smart upsell engine",
    description: "Data-driven add-on suggestions that learn per restaurant.",
    minTier: "ACCELERATOR",
  },
  winback_automation: {
    label: "Win-back automation",
    description: "Automated re-engagement for lapsed customers.",
    minTier: "ACCELERATOR",
  },
  competitive_analysis: {
    label: "Competitive analysis",
    description: "Benchmark against nearby competitors.",
    minTier: "ACCELERATOR",
  },
  // ── PARTNER ──
  google_ads: {
    label: "Google Ads management",
    description: "Managed paid search campaigns.",
    minTier: "PARTNER",
  },
  social_media: {
    label: "Social media management",
    description: "Managed social presence and content.",
    minTier: "PARTNER",
  },
  seo: {
    label: "SEO",
    description: "Local search optimization.",
    minTier: "PARTNER",
  },
  dedicated_manager: {
    label: "Dedicated account manager",
    description: "A named growth strategist managing your account.",
    minTier: "PARTNER",
  },
  video_content: {
    label: "Video content creation",
    description: "Professionally produced menu and promo video.",
    minTier: "PARTNER",
  },
  catering_funnels: {
    label: "Catering funnels",
    description: "Dedicated catering lead capture and conversion.",
    minTier: "PARTNER",
  },
};

export function minTierFor(feature: FeatureKey): Tier {
  return FEATURES[feature].minTier;
}

export function hasFeature(tier: Tier, feature: FeatureKey): boolean {
  return tierRank(tier) >= tierRank(FEATURES[feature].minTier);
}

export interface TierMeta {
  tier: Tier;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  highlighted?: boolean;
}

/** Display metadata for the upgrade ladder (labels + prices per master §6). */
export const TIERS: TierMeta[] = [
  {
    tier: "SPRINT",
    name: "90-Day Sprint",
    price: "$99",
    cadence: "down, then plan",
    blurb: "The guaranteed growth engagement. Foundation tools included.",
    features: [
      "Dashboard",
      "Single-platform tracking",
      "Review monitoring",
      "Performance reporting",
      "Tasks & collaboration",
    ],
  },
  {
    tier: "STARTER",
    name: "Growth Starter",
    price: "$199",
    cadence: "/mo",
    blurb: "Stay optimized on a single platform after your sprint.",
    features: ["Everything in Sprint", "Ongoing optimization", "Monthly reporting"],
  },
  {
    tier: "PRO",
    name: "Growth Pro",
    price: "$499",
    cadence: "/mo",
    blurb: "Both platforms, unified intelligence, ordering, and AI reviews.",
    features: [
      "DoorDash + UberEats intelligence",
      "Online ordering engine",
      "Loyalty & rewards",
      "AI review responses",
      "Menu & photo optimization",
    ],
    highlighted: true,
  },
  {
    tier: "ACCELERATOR",
    name: "Growth Accelerator",
    price: "$999",
    cadence: "/mo",
    blurb: "Predictive demand, smart promos, and automated upsell.",
    features: [
      "Everything in Pro",
      "Smart promotions",
      "Predictive revenue dashboard",
      "Smart upsell engine",
      "Win-back automation",
      "Competitive analysis",
    ],
  },
  {
    tier: "PARTNER",
    name: "Growth Partner",
    price: "$2,499",
    cadence: "/mo",
    blurb: "Full-service growth team with a dedicated manager.",
    features: [
      "Everything in Accelerator",
      "Google Ads, Social, SEO",
      "Dedicated account manager",
      "Video content creation",
      "Catering funnels",
    ],
  },
];

export function tierMeta(tier: Tier): TierMeta {
  const found = TIERS.find((t) => t.tier === tier);
  if (!found) throw new Error(`Unknown tier: ${tier}`);
  return found;
}
