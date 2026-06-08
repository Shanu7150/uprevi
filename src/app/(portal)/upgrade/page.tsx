import { Check } from "lucide-react";
import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { TIERS, FEATURES, tierRank, type FeatureKey } from "@/lib/tiers";
import { UpgradeButton } from "./UpgradeButton";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ feature?: string }>;
}) {
  await requireUser();
  const restaurant = await getActiveRestaurant();
  const currentTier = restaurant ? await getTier(restaurant.id) : "SPRINT";
  const currentRank = tierRank(currentTier);

  const { feature } = await searchParams;
  const featureMeta =
    feature && feature in FEATURES ? FEATURES[feature as FeatureKey] : null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Plan &amp; upgrade
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          Choose your growth plan
        </h1>
        {restaurant && (
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {restaurant.name} is currently on the{" "}
            <span style={{ color: "var(--navy)", fontWeight: 600 }}>
              {TIERS.find((t) => t.tier === currentTier)?.name}
            </span>{" "}
            plan.
          </p>
        )}
      </div>

      {featureMeta && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: "var(--accent-dim)", color: "var(--accent)" }}
        >
          <span style={{ fontWeight: 700 }}>{featureMeta.label}</span> is included
          with{" "}
          {TIERS.find((t) => t.tier === featureMeta.minTier)?.name} and above.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {TIERS.map((t) => {
          const isCurrent = t.tier === currentTier;
          const isDowngrade = tierRank(t.tier) < currentRank;
          return (
            <div
              key={t.tier}
              className="relative flex flex-col rounded-xl p-5 gap-4"
              style={{
                background: t.highlighted ? "var(--surface)" : "var(--card)",
                border: `${isCurrent ? "2px" : "1px"} solid ${
                  isCurrent ? "var(--accent-border)" : "var(--border)"
                }`,
                boxShadow: t.highlighted
                  ? "0 12px 40px rgba(30,58,95,0.10)"
                  : "0 1px 2px rgba(30,58,95,0.04)",
              }}
            >
              {isCurrent && (
                <span
                  className="absolute -top-2.5 left-4 badge px-2.5 py-0.5"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Current
                </span>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: "var(--text-dim)" }}>
                  {t.name}
                </p>
                <div className="flex items-end gap-1 mt-1.5">
                  <span className="font-display text-3xl font-bold font-mono-price" style={{ color: "var(--navy)" }}>
                    {t.price}
                  </span>
                  <span className="text-xs pb-1.5" style={{ color: "var(--text-muted)" }}>
                    {t.cadence}
                  </span>
                </div>
                <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                  {t.blurb}
                </p>
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs">
                    <Check size={12} className="mt-0.5 shrink-0" style={{ color: "var(--accent)" }} />
                    <span style={{ color: "var(--text-muted)" }}>{f}</span>
                  </li>
                ))}
              </ul>

              <UpgradeButton tier={t.tier} isCurrent={isCurrent} isDowngrade={isDowngrade} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
