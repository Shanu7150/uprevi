"use client";

import { useState, useEffect, useRef, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  ChevronLeft,
  Check,
  Loader2,
  Star,
  Flame,
  Award,
  MapPin,
  Clock,
  Truck,
} from "lucide-react";
import { restaurants, orders } from "@/lib/api";
import type { MenuCategory, MenuItem, CartItem, ModifierGroup } from "@/lib/types";

const ORDER_STATUS_STEPS = [
  { key: "CONFIRMED", label: "Order confirmed" },
  { key: "PREPARING", label: "Being prepared" },
  { key: "READY", label: "Ready for pickup" },
  { key: "OUT_FOR_DELIVERY", label: "On the way" },
  { key: "DELIVERED", label: "Delivered!" },
];

// ── Cart helpers ──────────────────────────────────────────────────────────────
function cartTotal(cart: CartItem[]) {
  return cart.reduce((sum, item) => {
    const modsTotal = item.selectedModifiers.reduce((s, m) => s + m.price, 0);
    return sum + (item.price + modsTotal) * item.quantity;
  }, 0);
}

function cartCount(cart: CartItem[]) {
  return cart.reduce((s, i) => s + i.quantity, 0);
}

// ── Item detail modal ─────────────────────────────────────────────────────────
function ItemModal({
  item,
  onClose,
  onAdd,
}: {
  item: MenuItem;
  onClose: () => void;
  onAdd: (cartItem: CartItem) => void;
}) {
  const [qty, setQty] = useState(1);
  const [selectedMods, setSelectedMods] = useState<CartItem["selectedModifiers"]>([]);

  const toggleMod = (group: ModifierGroup, modId: string, modName: string, modPrice: number) => {
    const existing = selectedMods.find(
      (m) => m.groupId === group.id && m.modifierId === modId
    );
    if (existing) {
      setSelectedMods(selectedMods.filter((m) => !(m.groupId === group.id && m.modifierId === modId)));
    } else {
      if (group.maxSelections === 1) {
        const filtered = selectedMods.filter((m) => m.groupId !== group.id);
        setSelectedMods([...filtered, { groupId: group.id, groupName: group.name, modifierId: modId, modifierName: modName, price: modPrice }]);
      } else {
        const groupSels = selectedMods.filter((m) => m.groupId === group.id);
        if (groupSels.length < group.maxSelections) {
          setSelectedMods([...selectedMods, { groupId: group.id, groupName: group.name, modifierId: modId, modifierName: modName, price: modPrice }]);
        }
      }
    }
  };

  const modTotal = selectedMods.reduce((s, m) => s + m.price, 0);
  const total = (item.price + modTotal) * qty;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div
          className="w-full h-48 flex items-center justify-center text-6xl relative"
          style={{ background: "var(--card-hover)" }}
        >
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span>🍽️</span>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}
          >
            <X size={14} color="white" />
          </button>
          {item.isSignature && (
            <div
              className="absolute top-3 left-3 badge"
              style={{ background: "var(--gold)", color: "var(--bg)" }}
            >
              <Award size={10} />
              Signature
            </div>
          )}
        </div>

        <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 192px)" }}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="font-display text-xl font-bold">{item.name}</h2>
            <span className="font-mono-price text-lg font-semibold" style={{ color: "var(--accent)", flexShrink: 0 }}>
              ${item.price.toFixed(2)}
            </span>
          </div>
          {item.description && (
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {item.description}
            </p>
          )}
          {item.calories && (
            <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
              {item.calories} cal
            </p>
          )}

          {/* Modifier groups */}
          {(item.modifierGroups ?? []).map((group) => (
            <div key={group.id} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-sm">{group.name}</p>
                <span
                  className="text-xs badge"
                  style={{
                    background: group.required ? "var(--accent-dim)" : "var(--card-hover)",
                    color: group.required ? "var(--accent)" : "var(--text-dim)",
                  }}
                >
                  {group.required ? "Required" : "Optional"}
                </span>
              </div>
              <div className="space-y-2">
                {group.modifiers.map((mod) => {
                  const sel = selectedMods.some(
                    (m) => m.groupId === group.id && m.modifierId === mod.id
                  );
                  return (
                    <button
                      key={mod.id}
                      onClick={() => toggleMod(group, mod.id, mod.name, mod.price)}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-sm transition-all"
                      style={{
                        background: sel ? "var(--accent-dim)" : "var(--card-hover)",
                        border: `1px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                          style={{
                            background: sel ? "var(--accent)" : "transparent",
                            border: `1.5px solid ${sel ? "var(--accent)" : "var(--border-light)"}`,
                          }}
                        >
                          {sel && <Check size={10} color="white" />}
                        </div>
                        {mod.name}
                      </div>
                      {mod.price > 0 && (
                        <span className="font-mono-price" style={{ color: "var(--text-muted)" }}>
                          +${mod.price.toFixed(2)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quantity + Add */}
          <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div
              className="flex items-center gap-3 rounded-xl"
              style={{ background: "var(--card-hover)", border: "1px solid var(--border)" }}
            >
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center rounded-xl"
              >
                <Minus size={14} />
              </button>
              <span className="font-semibold w-6 text-center">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl"
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => {
                onAdd({
                  menuItemId: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: qty,
                  imageUrl: item.imageUrl,
                  selectedModifiers: selectedMods,
                });
                onClose();
              }}
              className="btn-accent px-6 py-3 text-sm flex-1 ml-4"
            >
              Add to cart · ${total.toFixed(2)}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Cart drawer ───────────────────────────────────────────────────────────────
function CartDrawer({
  cart,
  onClose,
  onUpdateQty,
  onCheckout,
  restaurantName,
}: {
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (idx: number, qty: number) => void;
  onCheckout: () => void;
  restaurantName: string;
}) {
  const subtotal = cartTotal(cart);
  const deliveryFee = 2.99;
  const tax = subtotal * 0.0875;
  const tip = subtotal * 0.15;
  const total = subtotal + deliveryFee + tax + tip;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="w-full max-w-sm h-full flex flex-col"
        style={{ background: "var(--card)", borderLeft: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between p-5 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="font-semibold text-lg">Your cart</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ color: "var(--text-dim)" }}>
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.map((item, idx) => (
            <div
              key={idx}
              className="flex gap-3"
              style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}
            >
              <div
                className="w-14 h-14 rounded-lg shrink-0 flex items-center justify-center text-2xl"
                style={{ background: "var(--card-hover)" }}
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  "🍽️"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                {item.selectedModifiers.length > 0 && (
                  <p className="text-xs truncate" style={{ color: "var(--text-dim)" }}>
                    {item.selectedModifiers.map((m) => m.modifierName).join(", ")}
                  </p>
                )}
                <p className="font-mono-price text-sm mt-1" style={{ color: "var(--accent)" }}>
                  ${((item.price + item.selectedModifiers.reduce((s, m) => s + m.price, 0)) * item.quantity).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onUpdateQty(idx, Math.max(0, item.quantity - 1))}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "var(--card-hover)", border: "1px solid var(--border)" }}
                >
                  <Minus size={11} />
                </button>
                <span className="font-semibold text-sm w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQty(idx, item.quantity + 1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: "var(--card-hover)", border: "1px solid var(--border)" }}
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-5 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between" style={{ color: "var(--text-muted)" }}>
              <span>Subtotal</span>
              <span className="font-mono-price">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between" style={{ color: "var(--text-muted)" }}>
              <span>Delivery fee</span>
              <span className="font-mono-price">${deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between" style={{ color: "var(--text-muted)" }}>
              <span>Tax (8.75%)</span>
              <span className="font-mono-price">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between" style={{ color: "var(--text-muted)" }}>
              <span>Tip (15%)</span>
              <span className="font-mono-price">${tip.toFixed(2)}</span>
            </div>
            <div
              className="flex justify-between font-semibold pt-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span>Total</span>
              <span className="font-mono-price" style={{ color: "var(--accent)" }}>
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
          <button onClick={onCheckout} className="btn-accent w-full py-3.5 text-sm">
            Place order · ${total.toFixed(2)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Order tracker ─────────────────────────────────────────────────────────────
function OrderTracker({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((s) => {
        if (s < ORDER_STATUS_STEPS.length - 1) return s + 1;
        clearInterval(interval);
        return s;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        {/* Animated delivery icon */}
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "var(--accent-dim)", border: "2px solid var(--accent)" }}
          >
            <motion.div
              animate={{
                scale: currentStep === ORDER_STATUS_STEPS.length - 1 ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              {currentStep === ORDER_STATUS_STEPS.length - 1 ? (
                <Check size={32} style={{ color: "var(--accent)" }} />
              ) : (
                <Truck size={32} style={{ color: "var(--accent)" }} />
              )}
            </motion.div>
          </div>
          <h2 className="font-display text-2xl font-bold mb-1">
            {ORDER_STATUS_STEPS[currentStep].label}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            Order #{orderId.slice(-6).toUpperCase()}
          </p>
        </div>

        {/* Progress steps */}
        <div className="relative">
          {ORDER_STATUS_STEPS.map((step, i) => (
            <div key={step.key} className="flex gap-4 pb-6 relative">
              {i < ORDER_STATUS_STEPS.length - 1 && (
                <div
                  className="absolute left-[15px] top-8 bottom-0 w-px transition-all duration-1000"
                  style={{
                    background: i < currentStep ? "var(--accent)" : "var(--border)",
                  }}
                />
              )}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500"
                style={{
                  background:
                    i < currentStep
                      ? "var(--accent)"
                      : i === currentStep
                      ? "var(--accent-dim)"
                      : "var(--card-hover)",
                  border: `2px solid ${
                    i <= currentStep ? "var(--accent)" : "var(--border)"
                  }`,
                }}
              >
                {i < currentStep ? (
                  <Check size={12} color="white" />
                ) : i === currentStep ? (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: "var(--accent)" }}
                  />
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--border-light)" }} />
                )}
              </div>
              <div className="pt-1">
                <p
                  className="font-medium text-sm"
                  style={{
                    color: i <= currentStep ? "var(--text)" : "var(--text-dim)",
                  }}
                >
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {currentStep === ORDER_STATUS_STEPS.length - 1 && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onDone}
            className="btn-accent w-full py-3.5 text-sm mt-4"
          >
            Done
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}

// ── Main ordering page ────────────────────────────────────────────────────────
export default function OrderPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = use(params);
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [restaurant, setRestaurant] = useState<{ name: string; deliveryFee: number; estimatedDeliveryMin: number; estimatedDeliveryMax: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const [dashRes, menuRes] = await Promise.all([
        restaurants.dashboard(restaurantId),
        restaurants.getMenu(restaurantId),
      ]);
      if (dashRes.success && dashRes.data) {
        const r = dashRes.data.restaurant;
        setRestaurant({
          name: r.name,
          deliveryFee: r.deliveryFee,
          estimatedDeliveryMin: r.estimatedDeliveryMin,
          estimatedDeliveryMax: r.estimatedDeliveryMax,
        });
      }
      if (menuRes.success && menuRes.data) {
        setMenu(menuRes.data);
        if (menuRes.data.length > 0) setActiveCategory(menuRes.data[0].id);
      }
      setLoading(false);
    };
    load();
  }, [restaurantId]);

  const allItems = menu.flatMap((c) => c.items);
  const filtered = search
    ? allItems.filter(
        (i) =>
          i.name.toLowerCase().includes(search.toLowerCase()) ||
          i.description?.toLowerCase().includes(search.toLowerCase())
      )
    : null;

  const addToCart = (item: CartItem) => {
    const existing = cart.findIndex(
      (c) =>
        c.menuItemId === item.menuItemId &&
        JSON.stringify(c.selectedModifiers) === JSON.stringify(item.selectedModifiers)
    );
    if (existing >= 0) {
      const updated = [...cart];
      updated[existing].quantity += item.quantity;
      setCart(updated);
    } else {
      setCart([...cart, item]);
    }
  };

  const updateQty = (idx: number, qty: number) => {
    if (qty === 0) {
      setCart(cart.filter((_, i) => i !== idx));
    } else {
      const updated = [...cart];
      updated[idx].quantity = qty;
      setCart(updated);
    }
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    setCheckingOut(true);
    setCartOpen(false);
    const res = await orders.create({
      restaurantId,
      items: cart.map((c) => ({
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        selectedModifierIds: c.selectedModifiers.map((m) => m.modifierId),
      })),
      orderType: "DELIVERY",
      customerName: "Guest",
      tip: cartTotal(cart) * 0.15,
    });
    if (res.success && res.data) {
      setOrderId(res.data.order.id);
      setCart([]);
    }
    setCheckingOut(false);
  };

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    categoryRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (orderId) {
    return (
      <OrderTracker
        orderId={orderId}
        onDone={() => setOrderId(null)}
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", maxWidth: 480, margin: "0 auto" }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{ background: "rgba(10,9,8,0.95)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-bold">
              {restaurant?.name ?? "Menu"}
            </h1>
            <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>
              <span className="flex items-center gap-1">
                <Clock size={10} />
                {restaurant?.estimatedDeliveryMin}–{restaurant?.estimatedDeliveryMax} min
              </span>
              <span className="flex items-center gap-1">
                <Truck size={10} />
                ${restaurant?.deliveryFee?.toFixed(2)} delivery
              </span>
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2.5 rounded-xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <ShoppingBag size={18} style={{ color: "var(--text)" }} />
            {cartCount(cart) > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center"
                style={{ background: "var(--accent)", color: "white" }}
              >
                {cartCount(cart)}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-dim)" }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu…"
            className="input-base pl-9 pr-4 py-2.5 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-dim)" }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category pills */}
        {!search && (
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-none pb-1">
            {menu.map((cat) => (
              <button
                key={cat.id}
                onClick={() => scrollToCategory(cat.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
                style={{
                  background: activeCategory === cat.id ? "var(--accent)" : "var(--card)",
                  color: activeCategory === cat.id ? "white" : "var(--text-muted)",
                  border: `1px solid ${activeCategory === cat.id ? "var(--accent)" : "var(--border)"}`,
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Menu content */}
      <div ref={containerRef} className="px-4 pb-32">
        {search && filtered ? (
          <div className="pt-4">
            <p className="text-xs mb-3" style={{ color: "var(--text-dim)" }}>
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </p>
            <div className="space-y-3">
              {filtered.map((item) => (
                <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
              ))}
            </div>
          </div>
        ) : (
          menu.map((category) => (
            <div
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="pt-6"
            >
              <h2 className="font-display text-xl font-bold mb-4">{category.name}</h2>
              {category.description && (
                <p className="text-sm mb-3 -mt-2" style={{ color: "var(--text-muted)" }}>
                  {category.description}
                </p>
              )}
              <div className="space-y-3">
                {category.items
                  .sort((a, b) => b.popularityScore - a.popularityScore)
                  .map((item) => (
                    <MenuItemCard key={item.id} item={item} onSelect={setSelectedItem} />
                  ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating cart button */}
      <AnimatePresence>
        {cartCount(cart) > 0 && !cartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4"
            style={{ maxWidth: 480 - 32, margin: "0 auto" }}
          >
            <button
              onClick={() => setCartOpen(true)}
              className="btn-accent w-full py-4 text-sm"
            >
              <ShoppingBag size={16} />
              View cart · {cartCount(cart)} item{cartCount(cart) !== 1 ? "s" : ""} · $
              {cartTotal(cart).toFixed(2)}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checking out overlay */}
      <AnimatePresence>
        {checkingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(10,9,8,0.9)" }}
          >
            <div className="text-center">
              <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: "var(--accent)" }} />
              <p className="font-semibold">Placing your order…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item detail modal */}
      <AnimatePresence>
        {selectedItem && (
          <ItemModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAdd={addToCart}
          />
        )}
      </AnimatePresence>

      {/* Cart drawer */}
      <AnimatePresence>
        {cartOpen && (
          <CartDrawer
            cart={cart}
            onClose={() => setCartOpen(false)}
            onUpdateQty={updateQty}
            onCheckout={checkout}
            restaurantName={restaurant?.name ?? ""}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Menu item card ────────────────────────────────────────────────────────────
function MenuItemCard({
  item,
  onSelect,
}: {
  item: MenuItem;
  onSelect: (item: MenuItem) => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(item)}
      className="w-full flex gap-3 p-3 rounded-xl text-left transition-all"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-20 h-20 rounded-lg shrink-0 flex items-center justify-center text-3xl overflow-hidden"
        style={{ background: "var(--card-hover)" }}
      >
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          "🍽️"
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start gap-1.5 mb-1">
          <p className="font-semibold text-sm leading-snug">{item.name}</p>
          {item.isSignature && (
            <span className="badge shrink-0 mt-0.5" style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
              <Award size={9} />
            </span>
          )}
          {item.isPopular && !item.isSignature && (
            <span className="badge shrink-0 mt-0.5" style={{ background: "var(--red-dim)", color: "var(--red)" }}>
              <Flame size={9} />
            </span>
          )}
        </div>
        {item.description && (
          <p
            className="text-xs leading-relaxed mb-2 line-clamp-2"
            style={{ color: "var(--text-muted)" }}
          >
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span
            className="font-mono-price text-sm font-semibold"
            style={{ color: "var(--accent)" }}
          >
            ${item.price.toFixed(2)}
          </span>
          {item.calories && (
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              {item.calories} cal
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
