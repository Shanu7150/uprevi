import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { FEATURES, type FeatureKey } from "@/lib/tiers";
import { Gated } from "@/components/Gated";
import { Megaphone, Share2, Search, UserCheck, Video, UtensilsCrossed } from "lucide-react";

const PARTNER_FEATURES: { key: FeatureKey; icon: typeof Megaphone }[] = [
  { key: "google_ads", icon: Megaphone },
  { key: "social_media", icon: Share2 },
  { key: "seo", icon: Search },
  { key: "dedicated_manager", icon: UserCheck },
  { key: "video_content", icon: Video },
  { key: "catering_funnels", icon: UtensilsCrossed },
];

export default async function ServicesPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Growth services appear once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Growth services
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          Your full-service growth team
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Done-for-you marketing on the Partner plan. We run it; you watch the revenue.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {PARTNER_FEATURES.map(({ key, icon: Icon }) => {
          const f = FEATURES[key];
          return (
            <Gated key={key} feature={key} currentTier={tier}>
              <div className="card-base p-5 h-full flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                    <Icon size={18} />
                  </span>
                  <span className="badge" style={{ background: "var(--green-dim)", color: "var(--green)" }}>Active</span>
                </div>
                <p className="font-semibold" style={{ color: "var(--navy)" }}>{f.label}</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{f.description}</p>
                <p className="text-xs mt-auto pt-2" style={{ color: "var(--text-dim)" }}>Managed by your UPREVI team.</p>
              </div>
            </Gated>
          );
        })}
      </div>
    </div>
  );
}
