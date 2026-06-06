import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OrderApp, type OCategory, type ORestaurant } from "./OrderApp";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      menuCategories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          items: {
            where: { isAvailable: true },
            orderBy: { popularityScore: "desc" },
            include: {
              modifierGroups: {
                orderBy: { sortOrder: "asc" },
                include: { modifiers: { orderBy: { sortOrder: "asc" } } },
              },
            },
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  const r: ORestaurant = {
    slug,
    name: restaurant.name,
    description: restaurant.description,
    cuisineType: restaurant.cuisineType,
    deliveryFee: Number(restaurant.deliveryFee),
    minimumOrder: Number(restaurant.minimumOrder),
    estimatedDeliveryMin: restaurant.estimatedDeliveryMin,
    estimatedDeliveryMax: restaurant.estimatedDeliveryMax,
  };

  const categories: OCategory[] = restaurant.menuCategories.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: Number(i.price),
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

  return <OrderApp restaurant={r} categories={categories} />;
}
