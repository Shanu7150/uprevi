"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingBag,
  BarChart2,
  Star,
  Users,
  Tag,
  LogOut,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Zap,
  MessageSquare,
  Clock,
  ChevronRight,
  DollarSign,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { restaurants, orders, reviews, customers, promotions, auth, clearTokens } from "@/lib/api";
import type {
  RestaurantDashboardData,
  Order,
  Review,
  Customer,
  Promotion,
  OrderStatus,
} from "@/lib/types";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "customers", label: "Customers", icon: Users },
  { id: "promotions", label: "Promotions", icon: Tag },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Stat block ────────────────────────────────────────────────────────────────
function StatBlock({
  label,
  value,
  change,
  prefix = "",
  suffix = "",
  color = "var(--text)",
}: {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
}) {
  const positive = (change ?? 0) >= 0;
  return (
    <div className="card-base p-5 flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--text-dim)" }}>
        {label}
      </p>
      <p className="font-display text-3xl font-bold" style={{ color }}>
        {prefix}{value}{suffix}
      </p>
      {change !== undefined && (
        <div
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: positive ? "var(--green)" : "var(--red)" }}
        >
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {positive ? "+" : ""}{change}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Order status badge ────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const map: Record<OrderStatus, { bg: string; color: string; label: string }> = {
    PENDING: { bg: "var(--gold-dim)", color: "var(--gold)", label: "Pending" },
    CONFIRMED: { bg: "var(--blue-dim)", color: "var(--blue)", label: "Confirmed" },
    PREPARING: { bg: "var(--accent-dim)", color: "var(--accent)", label: "Preparing" },
    READY: { bg: "var(--green-dim)", color: "var(--green)", label: "Ready" },
    OUT_FOR_DELIVERY: { bg: "var(--blue-dim)", color: "var(--blue)", label: "Out for Delivery" },
    DELIVERED: { bg: "var(--green-dim)", color: "var(--green)", label: "Delivered" },
    CANCELLED: { bg: "var(--red-dim)", color: "var(--red)", label: "Cancelled" },
    REFUNDED: { bg: "var(--red-dim)", color: "var(--red)", label: "Refunded" },
  };
  const s = map[status];
  return (
    <span className="badge" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Order next action ─────────────────────────────────────────────────────────
const STATUS_NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};
const STATUS_NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  PENDING: "Confirm",
  CONFIRMED: "Start Preparing",
  PREPARING: "Mark Ready",
  READY: "Out for Delivery",
  OUT_FOR_DELIVERY: "Mark Delivered",
};

// ── Tooltip custom ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg p-3 text-xs shadow-xl">
      <p className="font-medium mb-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono-price font-semibold">${p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────
function OverviewTab({ dashData }: { dashData: RestaurantDashboardData | null }) {
  const s = dashData?.stats;
  const revenueData = dashData?.revenueByChannel ?? [];
  const recentOrders = dashData?.recentOrders ?? [];
  const insights = dashData?.aiInsights ?? [];

  return (
    <div className="space-y-6">
      {/* Stat blocks */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock
          label="Today's revenue"
          value={s ? `$${s.todayRevenue.toLocaleString()}` : "—"}
          change={s?.revenueGrowthPct}
          color="var(--accent)"
        />
        <StatBlock
          label="Today's orders"
          value={s?.todayOrders ?? "—"}
          change={s?.ordersGrowthPct}
        />
        <StatBlock
          label="Avg order value"
          value={s ? `$${s.avgOrderValue.toFixed(2)}` : "—"}
          change={s?.avgOrderGrowthPct}
          color="var(--gold)"
        />
        <StatBlock
          label="Monthly revenue"
          value={s ? `$${s.monthRevenue.toLocaleString()}` : "—"}
          color="var(--green)"
        />
      </div>

      {/* Revenue chart */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold">Revenue by channel</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-dim)" }}>Last 30 days</p>
          </div>
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--text-dim)" }}>
            {[
              { key: "doordash", label: "DoorDash", color: "#e8722a" },
              { key: "ubereats", label: "UberEats", color: "#34d399" },
              { key: "direct", label: "Direct", color: "#d4a652" },
            ].map(({ key, label, color }) => (
              <span key={key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gDD" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e8722a" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#e8722a" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gUE" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gDR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d4a652" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#d4a652" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-dim)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-dim)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="doordash" name="DoorDash" stroke="#e8722a" fill="url(#gDD)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="ubereats" name="UberEats" stroke="#34d399" fill="url(#gUE)" strokeWidth={2} dot={false} />
            <Area type="monotone" dataKey="direct" name="Direct" stroke="#d4a652" fill="url(#gDR)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live orders */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "var(--green)" }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--green)" }} />
              </span>
              Live orders
            </h3>
            <span className="text-xs" style={{ color: "var(--text-dim)" }}>
              {recentOrders.length} active
            </span>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-dim)" }}>
              No active orders right now
            </p>
          ) : (
            <div className="space-y-2">
              {recentOrders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 rounded-lg text-sm"
                  style={{ background: "var(--card-hover)" }}
                >
                  <div>
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""} · ${o.total.toFixed(2)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI insights */}
        <div className="card-base p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap size={15} style={{ color: "var(--gold)" }} />
            AI insights
          </h3>
          {insights.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: "var(--text-dim)" }}>
              Insights loading…
            </p>
          ) : (
            <div className="space-y-3">
              {insights.map((ins) => (
                <div
                  key={ins.id}
                  className="p-3 rounded-lg text-sm"
                  style={{
                    background:
                      ins.type === "opportunity"
                        ? "var(--accent-dim)"
                        : ins.type === "warning"
                        ? "var(--red-dim)"
                        : "var(--card-hover)",
                    border: `1px solid ${
                      ins.type === "opportunity"
                        ? "rgba(232,114,42,0.2)"
                        : ins.type === "warning"
                        ? "rgba(248,113,113,0.2)"
                        : "var(--border)"
                    }`,
                  }}
                >
                  <p className="font-semibold mb-0.5">{ins.title}</p>
                  <p style={{ color: "var(--text-muted)" }}>{ins.body}</p>
                  {ins.action && (
                    <button
                      className="mt-2 text-xs font-semibold flex items-center gap-1"
                      style={{ color: "var(--accent)" }}
                    >
                      {ins.action}
                      <ChevronRight size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Orders tab ────────────────────────────────────────────────────────────────
function OrdersTab({
  restaurantId,
  orderList,
  onRefresh,
}: {
  restaurantId: string;
  orderList: Order[];
  onRefresh: () => void;
}) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filterOptions = ["all", "PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"];

  const filtered = filter === "all" ? orderList : orderList.filter((o) => o.status === filter);

  const advance = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdating(orderId);
    await orders.updateStatus(orderId, nextStatus);
    onRefresh();
    setUpdating(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Orders</h2>
        <button onClick={onRefresh} className="btn-ghost px-3 py-2 text-xs">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filterOptions.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === f ? "var(--accent)" : "var(--card-hover)",
              color: filter === f ? "white" : "var(--text-muted)",
              border: `1px solid ${filter === f ? "var(--accent)" : "var(--border)"}`,
            }}
          >
            {f === "all" ? "All" : f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Orders table */}
      <div className="card-base overflow-hidden">
        <div
          className="grid grid-cols-5 px-4 py-3 text-xs font-semibold uppercase tracking-widest"
          style={{ background: "var(--card-hover)", borderBottom: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          <span>Order</span>
          <span>Customer</span>
          <span>Items / Total</span>
          <span>Status</span>
          <span>Action</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-dim)" }}>
            No orders found
          </p>
        ) : (
          filtered.map((order) => {
            const next = STATUS_NEXT[order.status];
            const nextLabel = STATUS_NEXT_LABEL[order.status];
            return (
              <div
                key={order.id}
                className="grid grid-cols-5 px-4 py-3.5 text-sm items-center border-b"
                style={{ borderColor: "var(--border)" }}
              >
                <span
                  className="font-mono-price text-xs"
                  style={{ color: "var(--text-dim)" }}
                >
                  #{order.id.slice(-6).toUpperCase()}
                </span>
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                    <Clock size={10} className="inline mr-1" />
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div>
                  <p>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                  <p className="font-mono-price text-xs" style={{ color: "var(--accent)" }}>
                    ${order.total.toFixed(2)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
                <div>
                  {next && nextLabel ? (
                    <button
                      onClick={() => advance(order.id, next)}
                      disabled={updating === order.id}
                      className="btn-accent px-3 py-1.5 text-xs disabled:opacity-60"
                    >
                      {updating === order.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : null}
                      {nextLabel}
                    </button>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                      —
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Analytics tab ─────────────────────────────────────────────────────────────
function AnalyticsTab({ restaurantId }: { restaurantId: string }) {
  const mockTrend = Array.from({ length: 30 }, (_, i) => ({
    date: `${i + 1}`,
    revenue: Math.round(800 + Math.random() * 1200),
    orders: Math.round(15 + Math.random() * 30),
  }));

  const platformData = [
    { name: "DoorDash", revenue: 12400, pct: 54 },
    { name: "UberEats", revenue: 7200, pct: 31 },
    { name: "Direct", revenue: 3400, pct: 15 },
  ];

  const PIE_COLORS = ["#e8722a", "#34d399", "#d4a652"];

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Analytics</h2>

      {/* Revenue trend */}
      <div className="card-base p-6">
        <h3 className="font-semibold mb-1">30-day revenue trend</h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>Daily revenue across all channels</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={mockTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#e8722a" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#e8722a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-dim)" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#e8722a" fill="url(#gRev)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Platform breakdown */}
        <div className="card-base p-6">
          <h3 className="font-semibold mb-4">Platform breakdown</h3>
          <div className="flex items-center gap-6">
            <PieChart width={140} height={140}>
              <Pie data={platformData} cx={65} cy={65} innerRadius={45} outerRadius={65} dataKey="revenue" strokeWidth={0}>
                {platformData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
            <div className="flex flex-col gap-3 flex-1">
              {platformData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    {p.name}
                  </span>
                  <div className="text-right">
                    <p className="font-mono-price font-semibold">${p.revenue.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: "var(--text-dim)" }}>{p.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Direct vs 3rd party fee savings */}
        <div className="card-base p-6">
          <h3 className="font-semibold mb-1">Direct ordering savings</h3>
          <p className="text-xs mb-4" style={{ color: "var(--text-dim)" }}>
            Fees avoided by converting third-party to direct
          </p>
          <div className="space-y-4">
            <div
              className="p-4 rounded-xl"
              style={{ background: "var(--green-dim)", border: "1px solid rgba(52,211,153,0.2)" }}
            >
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--green)" }}>
                Fee savings this month
              </p>
              <p className="font-display text-3xl font-bold" style={{ color: "var(--green)" }}>
                $714
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>
                Based on $3,400 direct orders × ~21% avg platform fee
              </p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Direct orders</span>
                <span className="font-mono-price">$3,400</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Avoided DoorDash fees (30%)</span>
                <span className="font-mono-price" style={{ color: "var(--green)" }}>
                  +$1,020
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }}>Avoided UberEats fees (27%)</span>
                <span className="font-mono-price" style={{ color: "var(--green)" }}>
                  +$918
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order volume bar chart */}
      <div className="card-base p-6">
        <h3 className="font-semibold mb-4">Daily order volume</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={mockTrend.slice(-14)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-dim)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--text-dim)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="orders" name="Orders" fill="#e8722a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Reviews tab ───────────────────────────────────────────────────────────────
function ReviewsTab({
  reviewList,
  onRefresh,
}: {
  reviewList: Review[];
  onRefresh: () => void;
}) {
  const [generating, setGenerating] = useState<string | null>(null);

  const generateResponse = async (reviewId: string) => {
    setGenerating(reviewId);
    await reviews.aiRespond(reviewId);
    onRefresh();
    setGenerating(null);
  };

  const avgRating =
    reviewList.length > 0
      ? (reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length).toFixed(1)
      : "—";

  const sentimentBreakdown = {
    positive: reviewList.filter((r) => r.sentiment === "POSITIVE").length,
    neutral: reviewList.filter((r) => r.sentiment === "NEUTRAL").length,
    negative: reviewList.filter((r) => r.sentiment === "NEGATIVE").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Reviews</h2>
        <button onClick={onRefresh} className="btn-ghost px-3 py-2 text-xs">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBlock label="Average rating" value={avgRating} suffix="/5" color="var(--gold)" />
        <StatBlock label="Total reviews" value={reviewList.length} />
        <StatBlock label="Positive" value={sentimentBreakdown.positive} color="var(--green)" />
        <StatBlock label="Needs response" value={reviewList.filter((r) => !r.respondedAt).length} color="var(--accent)" />
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {reviewList.length === 0 ? (
          <div className="card-base py-12 text-center">
            <p style={{ color: "var(--text-dim)" }}>No reviews synced yet</p>
          </div>
        ) : (
          reviewList.map((r) => (
            <div key={r.id} className="card-base p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{r.reviewerName}</span>
                    <span
                      className="badge text-xs"
                      style={{
                        background:
                          r.platform === "GOOGLE"
                            ? "var(--blue-dim)"
                            : r.platform === "DOORDASH"
                            ? "var(--accent-dim)"
                            : "var(--green-dim)",
                        color:
                          r.platform === "GOOGLE"
                            ? "var(--blue)"
                            : r.platform === "DOORDASH"
                            ? "var(--accent)"
                            : "var(--green)",
                      }}
                    >
                      {r.platform}
                    </span>
                    {r.sentiment && (
                      <span
                        className="badge text-xs"
                        style={{
                          background:
                            r.sentiment === "POSITIVE"
                              ? "var(--green-dim)"
                              : r.sentiment === "NEGATIVE"
                              ? "var(--red-dim)"
                              : "var(--card-hover)",
                          color:
                            r.sentiment === "POSITIVE"
                              ? "var(--green)"
                              : r.sentiment === "NEGATIVE"
                              ? "var(--red)"
                              : "var(--text-muted)",
                        }}
                      >
                        {r.sentiment}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < r.rating ? "var(--gold)" : "transparent"}
                        stroke={i < r.rating ? "var(--gold)" : "var(--border)"}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs shrink-0" style={{ color: "var(--text-dim)" }}>
                  {new Date(r.platformCreatedAt).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                {r.body}
              </p>

              {r.aiResponseDraft && (
                <div
                  className="p-4 rounded-lg mb-3 text-sm"
                  style={{ background: "var(--accent-dim)", border: "1px solid rgba(232,114,42,0.2)" }}
                >
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
                    <Zap size={11} />
                    AI draft response
                  </p>
                  <p style={{ color: "var(--text-muted)" }}>{r.aiResponseDraft}</p>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-accent px-3 py-1.5 text-xs">
                      <Check size={11} />
                      Approve & post
                    </button>
                    <button className="btn-ghost px-3 py-1.5 text-xs">
                      Edit
                    </button>
                    <button
                      onClick={() => generateResponse(r.id)}
                      disabled={generating === r.id}
                      className="btn-ghost px-3 py-1.5 text-xs"
                    >
                      {generating === r.id ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                      Regenerate
                    </button>
                  </div>
                </div>
              )}

              {!r.aiResponseDraft && !r.respondedAt && (
                <button
                  onClick={() => generateResponse(r.id)}
                  disabled={generating === r.id}
                  className="btn-ghost px-3 py-1.5 text-xs"
                >
                  {generating === r.id ? (
                    <>
                      <Loader2 size={11} className="animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Zap size={11} />
                      Generate AI response
                    </>
                  )}
                </button>
              )}

              {r.respondedAt && (
                <p className="text-xs" style={{ color: "var(--green)" }}>
                  <Check size={11} className="inline mr-1" />
                  Responded {new Date(r.respondedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Customers tab ─────────────────────────────────────────────────────────────
function CustomersTab({ customerList }: { customerList: Customer[] }) {
  const segmentColors: Record<string, string> = {
    VIP: "var(--gold)",
    LOYAL: "var(--green)",
    NEW: "var(--blue)",
    AT_RISK: "var(--red)",
    LAPSED: "var(--text-dim)",
  };

  const segments = ["VIP", "LOYAL", "NEW", "AT_RISK", "LAPSED"];
  const segmentCounts = segments.map((s) => ({
    name: s,
    count: customerList.filter((c) => c.segment === s).length,
  }));

  return (
    <div className="space-y-6">
      <h2 className="font-semibold text-lg">Customers</h2>

      {/* Segment summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {segmentCounts.map(({ name, count }) => (
          <div key={name} className="card-base p-4 text-center">
            <p className="font-display text-2xl font-bold" style={{ color: segmentColors[name] }}>
              {count}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-dim)" }}>{name}</p>
          </div>
        ))}
      </div>

      {/* Customer table */}
      <div className="card-base overflow-hidden">
        <div
          className="grid grid-cols-5 px-4 py-3 text-xs font-semibold uppercase tracking-widest"
          style={{ background: "var(--card-hover)", borderBottom: "1px solid var(--border)", color: "var(--text-dim)" }}
        >
          <span>Customer</span>
          <span>Segment</span>
          <span>Orders</span>
          <span>Lifetime value</span>
          <span>Last order</span>
        </div>
        {customerList.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: "var(--text-dim)" }}>
            No customers yet
          </p>
        ) : (
          customerList.slice(0, 20).map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-5 px-4 py-3 text-sm border-b items-center"
              style={{ borderColor: "var(--border)" }}
            >
              <div>
                <p className="font-medium">{c.name}</p>
                {c.email && (
                  <p className="text-xs" style={{ color: "var(--text-dim)" }}>{c.email}</p>
                )}
              </div>
              <span
                className="badge"
                style={{
                  background: segmentColors[c.segment] + "20",
                  color: segmentColors[c.segment],
                  width: "fit-content",
                }}
              >
                {c.segment}
              </span>
              <span>{c.totalOrders}</span>
              <span className="font-mono-price" style={{ color: "var(--gold)" }}>
                ${c.clv.toFixed(0)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-dim)" }}>
                {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString() : "—"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Promotions tab ────────────────────────────────────────────────────────────
function PromotionsTab({ promoList }: { promoList: Promotion[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Promotions</h2>
        <button className="btn-accent px-4 py-2 text-sm">
          <Tag size={13} />
          New promotion
        </button>
      </div>

      {promoList.length === 0 ? (
        <div className="card-base py-16 text-center">
          <Tag size={32} className="mx-auto mb-3" style={{ color: "var(--text-dim)" }} />
          <p className="font-semibold mb-1">No promotions yet</p>
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            Create your first promotion to drive more orders
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {promoList.map((p) => (
            <div key={p.id} className="card-base p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{p.name}</span>
                    {p.aiGenerated && (
                      <span
                        className="badge text-xs"
                        style={{ background: "var(--gold-dim)", color: "var(--gold)" }}
                      >
                        <Zap size={10} />
                        AI
                      </span>
                    )}
                    <span
                      className="badge text-xs"
                      style={{
                        background: p.isActive ? "var(--green-dim)" : "var(--card-hover)",
                        color: p.isActive ? "var(--green)" : "var(--text-dim)",
                      }}
                    >
                      {p.isActive ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {p.description}
                  </p>
                  <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--text-dim)" }}>
                    <span>
                      {p.type === "PERCENTAGE_DISCOUNT"
                        ? `${p.value}% off`
                        : p.type === "FIXED_DISCOUNT"
                        ? `$${p.value} off`
                        : p.type === "FREE_DELIVERY"
                        ? "Free delivery"
                        : p.type}
                    </span>
                    <span>{p.usageCount} uses</span>
                    <span className="font-mono-price" style={{ color: "var(--green)" }}>
                      ${p.revenueGenerated.toLocaleString()} revenue
                    </span>
                    <span>{(p.conversionRate * 100).toFixed(1)}% conversion</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn-ghost px-3 py-1.5 text-xs">Edit</button>
                  <button
                    className="px-3 py-1.5 text-xs rounded-lg transition-all"
                    style={{
                      background: p.isActive ? "var(--red-dim)" : "var(--green-dim)",
                      color: p.isActive ? "var(--red)" : "var(--green)",
                      border: `1px solid ${p.isActive ? "rgba(248,113,113,0.2)" : "rgba(52,211,153,0.2)"}`,
                    }}
                  >
                    {p.isActive ? "Pause" : "Activate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Dashboard shell ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState<RestaurantDashboardData | null>(null);
  const [orderList, setOrderList] = useState<Order[]>([]);
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [promoList, setPromoList] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");

  const loadData = useCallback(async (rid: string) => {
    const [dashRes, ordersRes, reviewsRes, customersRes, promosRes] =
      await Promise.all([
        restaurants.dashboard(rid),
        orders.list(rid, { limit: 50 }),
        reviews.list(rid),
        customers.list(rid),
        promotions.list(rid),
      ]);

    if (dashRes.success && dashRes.data) {
      setDashData(dashRes.data);
      setRestaurantName(dashRes.data.restaurant.name);
    }
    if (ordersRes.success && ordersRes.data) setOrderList(ordersRes.data.orders);
    if (reviewsRes.success && reviewsRes.data) setReviewList(reviewsRes.data.reviews);
    if (customersRes.success && customersRes.data) setCustomerList(customersRes.data.customers);
    if (promosRes.success && promosRes.data) setPromoList(promosRes.data);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const meRes = await auth.me();
      if (!meRes.success || !meRes.data) {
        router.push("/login");
        return;
      }
      const rid = meRes.data.restaurantId;
      if (!rid) {
        router.push("/login");
        return;
      }
      setRestaurantId(rid);
      await loadData(rid);
      setLoading(false);
    };
    bootstrap();
  }, [router, loadData]);

  const refresh = () => {
    if (restaurantId) loadData(restaurantId);
  };

  const logout = () => {
    auth.logout();
    clearTokens();
    router.push("/");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg)" }}
      >
        <div className="text-center">
          <Loader2
            size={32}
            className="animate-spin mx-auto mb-3"
            style={{ color: "var(--accent)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-dim)" }}>
            Loading your dashboard…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Sidebar ── */}
      <aside
        className={`fixed lg:relative inset-y-0 left-0 z-40 w-60 flex flex-col shrink-0 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "var(--card)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div
          className="h-16 px-5 flex items-center shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="font-display text-xl font-bold tracking-wider"
            style={{ color: "var(--accent)" }}
          >
            UPREVI
          </span>
        </div>

        {/* Restaurant name */}
        <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--text-dim)" }}>
            Restaurant
          </p>
          <p className="font-semibold text-sm truncate">{restaurantName}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
              style={{
                background: activeTab === id ? "var(--accent-dim)" : "transparent",
                color:
                  activeTab === id ? "var(--accent)" : "var(--text-muted)",
                border: `1px solid ${activeTab === id ? "rgba(232,114,42,0.25)" : "transparent"}`,
              }}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{ color: "var(--text-dim)" }}
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header
          className="h-16 px-6 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: "var(--text-muted)" }}
            >
              <LayoutDashboard size={18} />
            </button>
            <div>
              <h1 className="font-semibold capitalize">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h1>
              <p className="text-xs" style={{ color: "var(--text-dim)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={refresh} className="btn-ghost p-2 text-xs">
              <RefreshCw size={14} />
            </button>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: "var(--green-dim)", color: "var(--green)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />
              Live
            </div>
          </div>
        </header>

        {/* Tab content */}
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {activeTab === "overview" && <OverviewTab dashData={dashData} />}
              {activeTab === "orders" && restaurantId && (
                <OrdersTab
                  restaurantId={restaurantId}
                  orderList={orderList}
                  onRefresh={refresh}
                />
              )}
              {activeTab === "analytics" && restaurantId && (
                <AnalyticsTab restaurantId={restaurantId} />
              )}
              {activeTab === "reviews" && (
                <ReviewsTab reviewList={reviewList} onRefresh={refresh} />
              )}
              {activeTab === "customers" && (
                <CustomersTab customerList={customerList} />
              )}
              {activeTab === "promotions" && (
                <PromotionsTab promoList={promoList} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
