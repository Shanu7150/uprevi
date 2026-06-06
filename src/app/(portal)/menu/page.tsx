import { requireUser, getActiveRestaurant } from "@/lib/dal";
import { db } from "@/lib/db";
import { MenuManager, type MMCategory } from "./MenuManager";

export default async function MenuPage() {
  await requireUser();
  const restaurant = await getActiveRestaurant();

  if (!restaurant) {
    return (
      <div className="card-base p-8 max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: "var(--navy)" }}>
          No restaurant connected
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Your menu will appear once your account is linked to a restaurant.
        </p>
      </div>
    );
  }

  const categories = await db.menuCategory.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { sortOrder: "asc" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          modifierGroups: {
            orderBy: { sortOrder: "asc" },
            include: { modifiers: { orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  // Serialize Decimals → numbers for the client component.
  const tree: MMCategory[] = categories.map((c) => ({
    id: c.id,
    name: c.name,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: Number(i.price),
      isAvailable: i.isAvailable,
      isSignature: i.isSignature,
      isPopular: i.isPopular,
      modifierGroups: i.modifierGroups.map((g) => ({
        id: g.id,
        name: g.name,
        required: g.required,
        minSelections: g.minSelections,
        maxSelections: g.maxSelections,
        modifiers: g.modifiers.map((m) => ({
          id: m.id,
          name: m.name,
          price: Number(m.price),
        })),
      })),
    })),
  }));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--accent)" }}>
          Menu
        </p>
        <h1 className="font-display text-3xl font-bold" style={{ color: "var(--navy)" }}>
          {restaurant.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Manage categories, items, and modifiers. Changes are live on your ordering page.
        </p>
      </div>
      <MenuManager categories={tree} />
    </div>
  );
}
