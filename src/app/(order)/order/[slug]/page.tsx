import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Star } from "lucide-react";
import { db } from "@/lib/db";

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
          },
        },
      },
    },
  });

  if (!restaurant) notFound();

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-md mx-auto pb-16">
        {/* Header */}
        <header
          className="px-5 pt-8 pb-6"
          style={{ background: "var(--navy)", color: "var(--cream)" }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--gold-light)" }}>
            {restaurant.cuisineType ?? "Restaurant"}
          </p>
          <h1 className="font-display text-3xl font-bold mt-1" style={{ color: "#fff" }}>
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-sm mt-2" style={{ color: "rgba(245,244,240,0.78)" }}>
              {restaurant.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "rgba(245,244,240,0.7)" }}>
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {restaurant.estimatedDeliveryMin}–{restaurant.estimatedDeliveryMax} min
            </span>
            <span>${Number(restaurant.deliveryFee).toFixed(2)} delivery</span>
            <span>${Number(restaurant.minimumOrder).toFixed(0)} min</span>
          </div>
        </header>

        {/* Menu */}
        <div className="px-5 mt-6 flex flex-col gap-8">
          {restaurant.menuCategories.map((cat) => (
            <section key={cat.id}>
              <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--navy)" }}>
                {cat.name}
              </h2>
              {cat.description && (
                <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>
                  {cat.description}
                </p>
              )}
              <div className="flex flex-col gap-2">
                {cat.items.map((item) => (
                  <div key={item.id} className="card-base p-4 flex justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate" style={{ color: "var(--navy)" }}>
                          {item.name}
                        </p>
                        {item.isSignature && (
                          <Star size={12} fill="var(--gold)" stroke="none" />
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="font-mono-price text-sm shrink-0" style={{ color: "var(--navy)" }}>
                      ${Number(item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {restaurant.menuCategories.length === 0 && (
            <p className="text-sm text-center py-12" style={{ color: "var(--text-dim)" }}>
              This menu is being prepared. Check back soon.
            </p>
          )}
        </div>

        {/* Powered-by (white-on-dark logo on a navy pill) */}
        <div className="mt-10 flex justify-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full"
            style={{ background: "var(--navy)" }}
          >
            <span className="text-xs" style={{ color: "rgba(245,244,240,0.7)" }}>
              Powered by
            </span>
            <Image
              src="/logo/UPREVI-logo-white-on-dark.png"
              alt="UPREVI"
              width={20}
              height={18}
            />
          </div>
        </div>

        {/* TODO(uprevi): full ordering PWA — cart, modifiers, checkout, tracking (Phase 2). */}
      </div>
    </div>
  );
}
