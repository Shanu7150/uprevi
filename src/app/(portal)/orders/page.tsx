import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { db } from "@/lib/db";
import { OrdersBoard, type BoardOrder } from "./OrdersBoard";

export default async function OrdersPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Orders will appear once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const orders = await db.order.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { select: { name: true, quantity: true } } },
  });

  const board: BoardOrder[] = orders.map((o) => ({
    id: o.id,
    customerName: o.customerName,
    orderType: o.orderType,
    channel: o.channel,
    status: o.status,
    paymentStatus: o.paymentStatus,
    total: Number(o.total),
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((i) => ({ name: i.name, quantity: i.quantity })),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Orders
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          {restaurant.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Live order feed. Advance each order through its lifecycle.
        </p>
      </div>
      <OrdersBoard orders={board} />
    </div>
  );
}
