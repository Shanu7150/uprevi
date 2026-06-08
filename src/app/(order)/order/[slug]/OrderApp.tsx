"use client";

import { useMemo, useState, useEffect, useRef, useTransition } from "react";
import { Clock, Star, Flame, Plus, Minus, ShoppingBag, X, Check, Sparkles } from "lucide-react";
import { placeOrder, getOrderStatus, recordUpsellEvent } from "./actions";

// ── Types (serialized from the server page) ──────────────────────────────────
export interface OModifier { id: string; name: string; price: number }
export interface OGroup {
  id: string; name: string; required: boolean; minSelections: number; maxSelections: number; modifiers: OModifier[];
}
export interface OItem {
  id: string; name: string; description: string | null; price: number;
  isSignature: boolean; isPopular: boolean; modifierGroups: OGroup[];
}
export interface OCategory { id: string; name: string; description: string | null; items: OItem[] }
export interface OUpsell { ruleId: string; itemId: string; name: string; price: number }
export interface ORestaurant {
  slug: string; name: string; description: string | null; cuisineType: string | null;
  deliveryFee: number; minimumOrder: number; estimatedDeliveryMin: number; estimatedDeliveryMax: number;
}

interface CartLine {
  lineId: string;
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  modifiers: OModifier[];
}

const TAX_RATE = 0.0875;

export function OrderApp({ restaurant, categories, upsells = {} }: { restaurant: ORestaurant; categories: OCategory[]; upsells?: Record<string, OUpsell[]> }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [modalItem, setModalItem] = useState<OItem | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const count = cart.reduce((s, l) => s + l.quantity, 0);
  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  if (placedOrderId) {
    return <OrderTracker orderId={placedOrderId} restaurant={restaurant} />;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-md mx-auto pb-28 relative">
        {/* Header */}
        <header className="px-5 pt-8 pb-6" style={{ background: "var(--navy)", color: "var(--cream)" }}>
          <p className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: "var(--gold-light)" }}>
            {restaurant.cuisineType ?? "Restaurant"}
          </p>
          <h1 className="font-display text-3xl font-bold mt-1" style={{ color: "#fff" }}>{restaurant.name}</h1>
          {restaurant.description && (
            <p className="text-sm mt-2" style={{ color: "rgba(245,244,240,0.78)" }}>{restaurant.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs" style={{ color: "rgba(245,244,240,0.7)" }}>
            <span className="flex items-center gap-1.5"><Clock size={13} />{restaurant.estimatedDeliveryMin}–{restaurant.estimatedDeliveryMax} min</span>
            <span>${restaurant.deliveryFee.toFixed(2)} delivery</span>
            <span>${restaurant.minimumOrder.toFixed(0)} min</span>
          </div>
        </header>

        {/* Menu */}
        <div className="px-5 mt-6 flex flex-col gap-8">
          {categories.map((cat) => (
            <section key={cat.id}>
              <h2 className="font-display text-xl font-bold mb-1" style={{ color: "var(--navy)" }}>{cat.name}</h2>
              {cat.description && <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>{cat.description}</p>}
              <div className="flex flex-col gap-2">
                {cat.items.map((item) => (
                  <button key={item.id} type="button" onClick={() => setModalItem(item)} className="card-base p-4 flex justify-between gap-4 text-left">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate" style={{ color: "var(--navy)" }}>{item.name}</p>
                        {item.isSignature && <Star size={12} fill="var(--gold)" stroke="none" />}
                        {item.isPopular && <Flame size={12} style={{ color: "var(--accent)" }} />}
                      </div>
                      {item.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
                    </div>
                    <span className="font-mono-price text-sm shrink-0" style={{ color: "var(--navy)" }}>${item.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-center py-12" style={{ color: "var(--text-dim)" }}>This menu is being prepared. Check back soon.</p>
          )}
        </div>

        {/* Floating cart button */}
        {count > 0 && !cartOpen && (
          <div className="fixed bottom-4 left-0 right-0 px-5 max-w-md mx-auto z-30">
            <button type="button" onClick={() => setCartOpen(true)} className="btn-accent w-full py-3.5 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2"><ShoppingBag size={16} /> {count} item{count === 1 ? "" : "s"}</span>
              <span className="font-mono-price">${subtotal.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>

      {modalItem && (
        <ItemModal
          item={modalItem}
          onClose={() => setModalItem(null)}
          onAdd={(line) => { setCart((c) => [...c, line]); setModalItem(null); }}
        />
      )}

      {cartOpen && (
        <CartDrawer
          cart={cart}
          restaurant={restaurant}
          subtotal={subtotal}
          upsells={upsells}
          onClose={() => setCartOpen(false)}
          onUpdate={setCart}
          onAddLine={(line) => setCart((c) => [...c, line])}
          onPlaced={(id) => { setPlacedOrderId(id); setCart([]); setCartOpen(false); }}
        />
      )}
    </div>
  );
}

function ItemModal({ item, onClose, onAdd }: { item: OItem; onClose: () => void; onAdd: (line: CartLine) => void }) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [qty, setQty] = useState(1);

  const toggle = (group: OGroup, modId: string) => {
    setSelected((prev) => {
      const cur = prev[group.id] ?? [];
      if (group.maxSelections === 1) return { ...prev, [group.id]: [modId] };
      if (cur.includes(modId)) return { ...prev, [group.id]: cur.filter((x) => x !== modId) };
      if (cur.length >= group.maxSelections) return prev;
      return { ...prev, [group.id]: [...cur, modId] };
    });
  };

  const chosen: OModifier[] = item.modifierGroups.flatMap((g) =>
    (selected[g.id] ?? []).map((id) => g.modifiers.find((m) => m.id === id)).filter(Boolean) as OModifier[],
  );
  const unitPrice = item.price + chosen.reduce((s, m) => s + m.price, 0);

  const missingRequired = item.modifierGroups.some(
    (g) => g.required && (selected[g.id]?.length ?? 0) < Math.max(1, g.minSelections),
  );

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center" style={{ background: "rgba(15,38,63,0.45)" }} onClick={onClose}>
      <div className="bg-white w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-5 py-4" style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-display text-lg font-bold" style={{ color: "var(--navy)" }}>{item.name}</h3>
          <button type="button" onClick={onClose} style={{ color: "var(--text-dim)" }}><X size={20} /></button>
        </div>
        <div className="px-5 py-4">
          {item.description && <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>{item.description}</p>}
          {item.modifierGroups.map((g) => (
            <div key={g.id} className="mb-5">
              <p className="text-sm font-semibold mb-2" style={{ color: "var(--navy)" }}>
                {g.name}{" "}
                <span className="text-xs font-normal" style={{ color: "var(--text-dim)" }}>
                  {g.required ? "(required)" : g.maxSelections > 1 ? `(up to ${g.maxSelections})` : "(optional)"}
                </span>
              </p>
              <div className="flex flex-col gap-1.5">
                {g.modifiers.map((m) => {
                  const isSel = (selected[g.id] ?? []).includes(m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => toggle(g, m.id)} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm" style={{ border: `1.5px solid ${isSel ? "var(--accent)" : "var(--border)"}`, background: isSel ? "var(--accent-dim)" : "#fff" }}>
                      <span style={{ color: "var(--text)" }}>{m.name}</span>
                      <span className="flex items-center gap-2">
                        {m.price > 0 && <span className="font-mono-price text-xs" style={{ color: "var(--text-muted)" }}>+${m.price.toFixed(2)}</span>}
                        {isSel && <Check size={14} style={{ color: "var(--accent)" }} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: "1.5px solid var(--border)" }}><Minus size={14} /></button>
              <span className="font-semibold w-5 text-center">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border: "1.5px solid var(--border)" }}><Plus size={14} /></button>
            </div>
            <button
              type="button"
              disabled={missingRequired}
              onClick={() => onAdd({ lineId: crypto.randomUUID(), itemId: item.id, name: item.name, unitPrice, quantity: qty, modifiers: chosen })}
              className="btn-accent px-5 py-2.5 text-sm disabled:opacity-50"
            >
              Add · ${(unitPrice * qty).toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  cart, restaurant, subtotal, upsells, onClose, onUpdate, onAddLine, onPlaced,
}: {
  cart: CartLine[];
  restaurant: ORestaurant;
  subtotal: number;
  upsells: Record<string, OUpsell[]>;
  onClose: () => void;
  onUpdate: (c: CartLine[]) => void;
  onAddLine: (line: CartLine) => void;
  onPlaced: (orderId: string) => void;
}) {
  const [orderType, setOrderType] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [tipPct, setTipPct] = useState(15);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [pending, startTransition] = useTransition();

  const deliveryFee = orderType === "DELIVERY" ? restaurant.deliveryFee : 0;
  const tax = subtotal * TAX_RATE;
  const tip = subtotal * (tipPct / 100);
  const total = subtotal + deliveryFee + tax + tip;

  const setQty = (lineId: string, delta: number) =>
    onUpdate(
      cart
        .map((l) => (l.lineId === lineId ? { ...l, quantity: l.quantity + delta } : l))
        .filter((l) => l.quantity > 0),
    );

  const place = () =>
    startTransition(async () => {
      const res = await placeOrder({
        slug: restaurant.slug,
        orderType,
        customer: { name, email: email || undefined, phone: phone || undefined, address: address || undefined },
        tip: Number(tip.toFixed(2)),
        items: cart.map((l) => ({ menuItemId: l.itemId, quantity: l.quantity, modifierIds: l.modifiers.map((m) => m.id) })),
      });
      if (res.ok) onPlaced(res.orderId);
      else alert(res.error);
    });

  const canPlace = cart.length > 0 && name.trim() && (orderType === "PICKUP" || address.trim());

  // Smart upsell — "goes well with" complements for what's in the cart.
  const suggestions = useMemo(() => {
    const inCart = new Set(cart.map((l) => l.itemId));
    const seen = new Set<string>();
    const out: OUpsell[] = [];
    for (const line of cart) {
      for (const s of upsells[line.itemId] ?? []) {
        if (!inCart.has(s.itemId) && !seen.has(s.itemId)) {
          seen.add(s.itemId);
          out.push(s);
        }
      }
    }
    return out.slice(0, 3);
  }, [cart, upsells]);

  // Track which suggestions we've already counted as "shown" without triggering
  // re-renders (a ref, not state — avoids setState-in-effect).
  const shownRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const s of suggestions) {
      if (!shownRef.current.has(s.ruleId)) {
        shownRef.current.add(s.ruleId);
        void recordUpsellEvent(restaurant.slug, s.ruleId, "shown");
      }
    }
  }, [suggestions, restaurant.slug]);

  const addSuggestion = (s: OUpsell) => {
    onAddLine({ lineId: crypto.randomUUID(), itemId: s.itemId, name: s.name, unitPrice: s.price, quantity: 1, modifiers: [] });
    void recordUpsellEvent(restaurant.slug, s.ruleId, "converted");
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" style={{ background: "rgba(15,38,63,0.45)" }} onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto" onClick={(e) => e.stopPropagation()} style={{ background: "var(--bg)" }}>
        <div className="sticky top-0 flex items-center justify-between px-5 py-4" style={{ background: "#fff", borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-display text-lg font-bold" style={{ color: "var(--navy)" }}>Your order</h3>
          <button type="button" onClick={onClose} style={{ color: "var(--text-dim)" }}><X size={20} /></button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Lines */}
          {cart.map((l) => (
            <div key={l.lineId} className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--navy)" }}>{l.name}</p>
                {l.modifiers.length > 0 && <p className="text-xs" style={{ color: "var(--text-dim)" }}>{l.modifiers.map((m) => m.name).join(", ")}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <button type="button" onClick={() => setQty(l.lineId, -1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid var(--border)" }}><Minus size={12} /></button>
                  <span className="text-sm w-4 text-center">{l.quantity}</span>
                  <button type="button" onClick={() => setQty(l.lineId, 1)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ border: "1px solid var(--border)" }}><Plus size={12} /></button>
                </div>
              </div>
              <span className="font-mono-price text-sm" style={{ color: "var(--navy)" }}>${(l.unitPrice * l.quantity).toFixed(2)}</span>
            </div>
          ))}

          {/* Smart upsell suggestions */}
          {suggestions.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: "var(--accent-dim)" }}>
              <p className="text-xs font-bold flex items-center gap-1.5 mb-2" style={{ color: "var(--accent)" }}>
                <Sparkles size={12} /> Goes well with
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((s) => (
                  <div key={s.ruleId} className="flex items-center justify-between gap-2 bg-white rounded-lg px-3 py-2">
                    <span className="text-sm" style={{ color: "var(--navy)" }}>{s.name}</span>
                    <button type="button" onClick={() => addSuggestion(s)} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      <span className="font-mono-price">+${s.price.toFixed(2)}</span>
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order type */}
          <div className="flex gap-2 pt-2">
            {(["DELIVERY", "PICKUP"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setOrderType(t)} className="flex-1 py-2 rounded-lg text-sm font-medium" style={{ border: `1.5px solid ${orderType === t ? "var(--navy)" : "var(--border)"}`, background: orderType === t ? "var(--navy)" : "#fff", color: orderType === t ? "#fff" : "var(--text)" }}>
                {t === "DELIVERY" ? "Delivery" : "Pickup"}
              </button>
            ))}
          </div>

          {/* Customer */}
          <div className="flex flex-col gap-2">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name *" className="input-base px-3 py-2.5 text-sm" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className="input-base px-3 py-2.5 text-sm" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="input-base px-3 py-2.5 text-sm" />
            {orderType === "DELIVERY" && (
              <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address *" className="input-base px-3 py-2.5 text-sm" />
            )}
          </div>

          {/* Tip */}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Tip</p>
            <div className="flex gap-2">
              {[0, 10, 15, 20].map((p) => (
                <button key={p} type="button" onClick={() => setTipPct(p)} className="flex-1 py-1.5 rounded-lg text-sm" style={{ border: `1.5px solid ${tipPct === p ? "var(--accent)" : "var(--border)"}`, background: tipPct === p ? "var(--accent-dim)" : "#fff", color: tipPct === p ? "var(--accent)" : "var(--text)" }}>
                  {p === 0 ? "None" : `${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col gap-1 pt-2 text-sm" style={{ borderTop: "1px solid var(--border)" }}>
            <Row label="Subtotal" value={subtotal} />
            {orderType === "DELIVERY" && <Row label="Delivery" value={deliveryFee} />}
            <Row label="Tax" value={tax} />
            <Row label="Tip" value={tip} />
            <div className="flex justify-between font-semibold pt-1.5 mt-1" style={{ borderTop: "1px solid var(--border)", color: "var(--navy)" }}>
              <span>Total</span>
              <span className="font-mono-price">${total.toFixed(2)}</span>
            </div>
          </div>

          <button type="button" disabled={!canPlace || pending} onClick={place} className="btn-accent w-full py-3.5 text-sm disabled:opacity-50">
            {pending ? "Placing order…" : "Place order"}
          </button>
          <p className="text-xs text-center" style={{ color: "var(--text-dim)" }}>
            Prices are confirmed securely on our server at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between" style={{ color: "var(--text-muted)" }}>
      <span>{label}</span>
      <span className="font-mono-price">${value.toFixed(2)}</span>
    </div>
  );
}

const STEPS = ["CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"] as const;
const STEP_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed", PREPARING: "Preparing", READY: "Ready", OUT_FOR_DELIVERY: "On the way", DELIVERED: "Delivered",
};

function OrderTracker({ orderId, restaurant }: { orderId: string; restaurant: ORestaurant }) {
  const [status, setStatus] = useState<string>("PENDING");
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      const res = await getOrderStatus(orderId);
      if (active && res.ok) { setStatus(res.status); setTotal(res.total); }
    };
    poll();
    const t = setInterval(poll, 4000);
    return () => { active = false; clearInterval(t); };
  }, [orderId]);

  const currentIndex = status === "PENDING" ? -1 : STEPS.indexOf(status as (typeof STEPS)[number]);
  const cancelled = status === "CANCELLED" || status === "REFUNDED";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <div className="max-w-md mx-auto px-5 py-10">
        <div className="card-base p-7 text-center">
          <span className="inline-flex w-14 h-14 items-center justify-center rounded-full mb-4" style={{ background: "var(--green-dim)", color: "var(--green)" }}>
            <Check size={26} />
          </span>
          <h1 className="font-display text-2xl font-bold mb-1" style={{ color: "var(--navy)" }}>Order placed</h1>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>Thanks for ordering from {restaurant.name}.</p>
          {total !== null && <p className="font-mono-price text-sm mb-6" style={{ color: "var(--navy)" }}>Total ${total.toFixed(2)}</p>}

          {cancelled ? (
            <p className="text-sm" style={{ color: "var(--red)" }}>This order was {status.toLowerCase()}.</p>
          ) : (
            <div className="flex flex-col gap-3 text-left mt-2">
              {STEPS.map((step, i) => {
                const done = i <= currentIndex;
                const active = i === currentIndex;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: done ? "var(--navy)" : "var(--cream)", border: `1.5px solid ${done ? "var(--navy)" : "var(--border)"}`, color: done ? "#fff" : "var(--text-dim)" }}>
                      {done ? <Check size={13} /> : <span className="text-xs">{i + 1}</span>}
                    </span>
                    <span className="text-sm" style={{ color: active ? "var(--navy)" : done ? "var(--text)" : "var(--text-dim)", fontWeight: active ? 700 : 400 }}>
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                );
              })}
              {currentIndex === -1 && (
                <p className="text-xs mt-2" style={{ color: "var(--text-dim)" }}>Waiting for the restaurant to confirm…</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
