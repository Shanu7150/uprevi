"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import { switchRestaurant } from "./actions";

export function RestaurantSwitcher({
  restaurants,
  activeId,
}: {
  restaurants: { id: string; name: string }[];
  activeId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="relative">
      <select
        aria-label="Active restaurant"
        value={activeId ?? ""}
        disabled={pending || restaurants.length <= 1}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await switchRestaurant(id);
            router.refresh();
          });
        }}
        className="input-base appearance-none pl-3 pr-9 py-2 text-sm font-medium disabled:opacity-70"
        style={{ cursor: restaurants.length > 1 ? "pointer" : "default" }}
      >
        {restaurants.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <ChevronsUpDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: "var(--text-dim)" }}
      />
    </div>
  );
}
