import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { db } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";
import { ConnectButton } from "./ConnectButton";
import { PosSection } from "./PosSection";

export default async function SettingsPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Settings will appear once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const initial = {
    name: restaurant.name,
    description: restaurant.description ?? "",
    phone: restaurant.phone ?? "",
    email: restaurant.email ?? "",
    address: restaurant.address ?? "",
    city: restaurant.city ?? "",
    state: restaurant.state ?? "",
    zip: restaurant.zip ?? "",
    cuisineType: restaurant.cuisineType ?? "",
    deliveryFee: Number(restaurant.deliveryFee),
    minimumOrder: Number(restaurant.minimumOrder),
    estimatedDeliveryMin: restaurant.estimatedDeliveryMin,
    estimatedDeliveryMax: restaurant.estimatedDeliveryMax,
    onDoorDash: restaurant.onDoorDash,
    onUberEats: restaurant.onUberEats,
  };

  const pos = await db.posConnection.findUnique({
    where: { restaurantId: restaurant.id },
    select: { provider: true, status: true },
  });

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Settings
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          {restaurant.name}
        </h1>
      </div>

      <SettingsForm initial={initial} />

      <div className="card-base p-6">
        <h2 className="font-display text-lg font-bold mb-1" style={{ color: "var(--navy)" }}>
          Payouts
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Connect Stripe so diner orders pay your restaurant directly, with zero
          UPREVI transaction fees.
        </p>
        <ConnectButton connected={Boolean(restaurant.stripeConnectId)} />
      </div>

      <div className="card-base p-6">
        <h2 className="font-display text-lg font-bold mb-1" style={{ color: "var(--navy)" }}>
          POS integration
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Connect your point-of-sale so menu and orders stay in sync. Live sync
          is rolling out provider by provider.
        </p>
        <PosSection connection={pos} />
      </div>
    </div>
  );
}
