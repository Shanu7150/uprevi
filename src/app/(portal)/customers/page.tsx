import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { getTier } from "@/lib/entitlements";
import { db } from "@/lib/db";
import { CustomersClient, type CustomerT } from "./CustomersClient";

export default async function CustomersPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Customers appear once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const tier = await getTier(restaurant.id);
  const customers = await db.customer.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { clv: "desc" },
  });

  const list: CustomerT[] = customers.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    segment: c.segment,
    totalOrders: c.totalOrders,
    clv: Number(c.clv),
    avgOrderValue: Number(c.avgOrderValue),
    lastOrderAt: c.lastOrderAt ? c.lastOrderAt.toISOString() : null,
  }));

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Customers
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          {restaurant.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Customer value and segments. Automated segmentation and win-back on Accelerator.
        </p>
      </div>
      <CustomersClient customers={list} currentTier={tier} />
    </div>
  );
}
