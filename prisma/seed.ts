/**
 * Seed data for UPREVI Phase 1.
 *
 * Run with `npm run db:seed` (or automatically after `prisma migrate dev`).
 * Idempotent: users/restaurants/subscriptions are upserted; Bella Cucina's
 * menu/orders/reviews/customers/promotions are cleared and rebuilt each run.
 *
 * tsx does not resolve the `@/*` tsconfig alias, so we import the generated
 * client by relative path and build a dedicated adapter-backed client here.
 */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to .env.local before seeding.");
}

const db = new PrismaClient({ adapter: new PrismaPg(connectionString) });

// Shared dev password for every seeded account (documented in README).
const DEV_PASSWORD = "uprevi-demo-2026";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  // ── Users ──────────────────────────────────────────────────────────────────
  const owner = await db.user.upsert({
    where: { email: "owner@uprevi.com" },
    update: { name: "Robbie Owner", role: "OWNER", passwordHash },
    create: {
      email: "owner@uprevi.com",
      name: "Robbie Owner",
      role: "OWNER",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const admin = await db.user.upsert({
    where: { email: "admin@uprevi.com" },
    update: { name: "UPREVI Admin", role: "ADMIN", passwordHash },
    create: {
      email: "admin@uprevi.com",
      name: "UPREVI Admin",
      role: "ADMIN",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const staff = await db.user.upsert({
    where: { email: "staff@uprevi.com" },
    update: { name: "Sam Staff", role: "STAFF", passwordHash },
    create: {
      email: "staff@uprevi.com",
      name: "Sam Staff",
      role: "STAFF",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  const customer = await db.user.upsert({
    where: { email: "customer@uprevi.com" },
    update: { name: "Casey Customer", role: "CUSTOMER", passwordHash },
    create: {
      email: "customer@uprevi.com",
      name: "Casey Customer",
      role: "CUSTOMER",
      passwordHash,
      emailVerified: new Date(),
    },
  });

  // ── Restaurants ──────────────────────────────────────────────────────────────
  const bella = await db.restaurant.upsert({
    where: { slug: "bella-cucina" },
    update: {},
    create: {
      slug: "bella-cucina",
      name: "Bella Cucina",
      description: "Family-run Italian kitchen — handmade pasta, wood-fired pizza.",
      phone: "(312) 555-0142",
      email: "hello@bellacucina.com",
      address: "812 W Randolph St",
      city: "Chicago",
      state: "IL",
      zip: "60607",
      cuisineType: "Italian",
      onDoorDash: true,
      onUberEats: true,
      deliveryFee: 3.99,
      minimumOrder: 15,
      estimatedDeliveryMin: 25,
      estimatedDeliveryMax: 45,
    },
  });

  const sakura = await db.restaurant.upsert({
    where: { slug: "sakura-ramen" },
    update: {},
    create: {
      slug: "sakura-ramen",
      name: "Sakura Ramen",
      description: "Tonkotsu, shoyu, and spicy miso ramen made from scratch daily.",
      phone: "(312) 555-0188",
      email: "hello@sakuraramen.com",
      address: "2143 N Damen Ave",
      city: "Chicago",
      state: "IL",
      zip: "60647",
      cuisineType: "Japanese",
      onDoorDash: true,
      onUberEats: false,
      deliveryFee: 4.49,
      minimumOrder: 18,
      estimatedDeliveryMin: 20,
      estimatedDeliveryMax: 40,
    },
  });

  // ── Memberships ──────────────────────────────────────────────────────────────
  // Owner has both restaurants (multi-location switcher); staff has Bella Cucina.
  await db.restaurantMembership.upsert({
    where: { userId_restaurantId: { userId: owner.id, restaurantId: bella.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, restaurantId: bella.id, role: "OWNER" },
  });
  await db.restaurantMembership.upsert({
    where: { userId_restaurantId: { userId: owner.id, restaurantId: sakura.id } },
    update: { role: "OWNER" },
    create: { userId: owner.id, restaurantId: sakura.id, role: "OWNER" },
  });
  await db.restaurantMembership.upsert({
    where: { userId_restaurantId: { userId: staff.id, restaurantId: bella.id } },
    update: { role: "STAFF" },
    create: { userId: staff.id, restaurantId: bella.id, role: "STAFF" },
  });

  // ── Subscriptions (drive the entitlements/gate demo) ──────────────────────────
  // Bella Cucina = SPRINT (gated features locked); Sakura Ramen = ACCELERATOR (unlocked).
  await db.subscription.upsert({
    where: { restaurantId: bella.id },
    update: { tier: "SPRINT", status: "ACTIVE" },
    create: { restaurantId: bella.id, tier: "SPRINT", status: "ACTIVE" },
  });
  await db.subscription.upsert({
    where: { restaurantId: sakura.id },
    update: { tier: "ACCELERATOR", status: "ACTIVE" },
    create: { restaurantId: sakura.id, tier: "ACCELERATOR", status: "ACTIVE" },
  });

  // ── Bella Cucina content (cleared + rebuilt each run) ─────────────────────────
  await db.order.deleteMany({ where: { restaurantId: bella.id } });
  await db.review.deleteMany({ where: { restaurantId: bella.id } });
  await db.promotion.deleteMany({ where: { restaurantId: bella.id } });
  await db.customer.deleteMany({ where: { restaurantId: bella.id } });
  await db.menuCategory.deleteMany({ where: { restaurantId: bella.id } });

  // Menu — categories with items and a couple of modifier groups.
  const antipasti = await db.menuCategory.create({
    data: {
      restaurantId: bella.id,
      name: "Antipasti",
      description: "Small plates to start",
      sortOrder: 1,
      items: {
        create: [
          {
            restaurantId: bella.id,
            name: "Bruschetta Classica",
            description: "Grilled bread, vine tomatoes, basil, garlic, EVOO.",
            price: 9.5,
            isPopular: true,
            popularityScore: 78,
            tags: ["vegetarian", "shareable"],
          },
          {
            restaurantId: bella.id,
            name: "Burrata & Prosciutto",
            description: "Creamy burrata, San Daniele prosciutto, arugula.",
            price: 14,
            isSignature: true,
            popularityScore: 64,
            tags: ["signature"],
          },
        ],
      },
    },
  });

  const pasta = await db.menuCategory.create({
    data: {
      restaurantId: bella.id,
      name: "Pasta",
      description: "Made fresh daily",
      sortOrder: 2,
      items: {
        create: [
          {
            restaurantId: bella.id,
            name: "Tagliatelle Bolognese",
            description: "Slow-braised beef and pork ragù, parmigiano.",
            price: 19,
            isSignature: true,
            isPopular: true,
            popularityScore: 95,
            tags: ["signature", "bestseller"],
            modifierGroups: {
              create: [
                {
                  name: "Add protein",
                  required: false,
                  minSelections: 0,
                  maxSelections: 2,
                  modifiers: {
                    create: [
                      { name: "Grilled chicken", price: 5 },
                      { name: "Italian sausage", price: 4.5 },
                      { name: "Extra parmigiano", price: 2 },
                    ],
                  },
                },
              ],
            },
          },
          {
            restaurantId: bella.id,
            name: "Cacio e Pepe",
            description: "Tonnarelli, pecorino romano, cracked black pepper.",
            price: 17,
            isPopular: true,
            popularityScore: 81,
            tags: ["vegetarian"],
          },
        ],
      },
    },
  });

  const pizza = await db.menuCategory.create({
    data: {
      restaurantId: bella.id,
      name: "Pizza",
      description: "Wood-fired, 12 inch",
      sortOrder: 3,
      items: {
        create: [
          {
            restaurantId: bella.id,
            name: "Margherita DOP",
            description: "San Marzano, fior di latte, basil.",
            price: 16,
            isPopular: true,
            popularityScore: 88,
            tags: ["vegetarian", "classic"],
            modifierGroups: {
              create: [
                {
                  name: "Size",
                  required: true,
                  minSelections: 1,
                  maxSelections: 1,
                  modifiers: {
                    create: [
                      { name: '12" personal', price: 0, isDefault: true },
                      { name: '16" large', price: 6 },
                    ],
                  },
                },
              ],
            },
          },
          {
            restaurantId: bella.id,
            name: "Diavola",
            description: "Spicy soppressata, chili, mozzarella.",
            price: 18,
            tags: ["spicy"],
          },
        ],
      },
    },
  });

  await db.menuCategory.create({
    data: {
      restaurantId: bella.id,
      name: "Dolci",
      description: "Desserts",
      sortOrder: 4,
      items: {
        create: [
          {
            restaurantId: bella.id,
            name: "Tiramisù",
            description: "Mascarpone, espresso-soaked ladyfingers, cocoa.",
            price: 8,
            isSignature: true,
            popularityScore: 72,
            tags: ["signature"],
          },
        ],
      },
    },
  });

  // Fetch a couple of items to attach to orders.
  const bolognese = await db.menuItem.findFirstOrThrow({
    where: { restaurantId: bella.id, name: "Tagliatelle Bolognese" },
  });
  const margherita = await db.menuItem.findFirstOrThrow({
    where: { restaurantId: bella.id, name: "Margherita DOP" },
  });

  // Customers across segments.
  const [vip] = await Promise.all([
    db.customer.create({
      data: {
        restaurantId: bella.id,
        name: "Marco Esposito",
        email: "marco@example.com",
        phone: "(312) 555-1001",
        segment: "VIP",
        loyaltyTier: "Gold",
        loyaltyPoints: 1240,
        totalOrders: 38,
        clv: 1820.5,
        avgOrderValue: 47.9,
        lastOrderAt: new Date(),
      },
    }),
    db.customer.create({
      data: {
        restaurantId: bella.id,
        name: "Priya Sharma",
        email: "priya@example.com",
        segment: "LOYAL",
        loyaltyTier: "Silver",
        loyaltyPoints: 540,
        totalOrders: 14,
        clv: 612.25,
        avgOrderValue: 43.7,
        lastOrderAt: new Date(Date.now() - 6 * 86400000),
      },
    }),
    db.customer.create({
      data: {
        restaurantId: bella.id,
        name: "James Okafor",
        segment: "AT_RISK",
        loyaltyTier: "Bronze",
        loyaltyPoints: 80,
        totalOrders: 3,
        clv: 121.0,
        avgOrderValue: 40.3,
        lastOrderAt: new Date(Date.now() - 41 * 86400000),
      },
    }),
    db.customer.create({
      data: {
        restaurantId: bella.id,
        name: "Dana Lee",
        segment: "NEW",
        loyaltyTier: "Bronze",
        loyaltyPoints: 10,
        totalOrders: 1,
        clv: 32.0,
        avgOrderValue: 32.0,
        lastOrderAt: new Date(Date.now() - 2 * 86400000),
      },
    }),
  ]);

  // Orders with items + modifiers across channels/statuses.
  await db.order.create({
    data: {
      restaurantId: bella.id,
      customerId: vip.id,
      channel: "DOORDASH",
      customerName: "Marco Esposito",
      customerEmail: "marco@example.com",
      orderType: "DELIVERY",
      status: "DELIVERED",
      paymentStatus: "PAID",
      subtotal: 38,
      deliveryFee: 3.99,
      tax: 3.33,
      tip: 7,
      discount: 0,
      total: 52.32,
      items: {
        create: [
          {
            menuItemId: bolognese.id,
            name: "Tagliatelle Bolognese",
            price: 19,
            quantity: 2,
            subtotal: 38,
            modifiers: {
              create: [{ name: "Extra parmigiano", price: 2 }],
            },
          },
        ],
      },
    },
  });

  await db.order.create({
    data: {
      restaurantId: bella.id,
      channel: "UBEREATS",
      customerName: "Priya Sharma",
      orderType: "DELIVERY",
      status: "OUT_FOR_DELIVERY",
      paymentStatus: "PAID",
      subtotal: 32,
      deliveryFee: 3.99,
      tax: 2.8,
      tip: 5,
      discount: 0,
      total: 43.79,
      items: {
        create: [
          {
            menuItemId: margherita.id,
            name: "Margherita DOP",
            price: 16,
            quantity: 2,
            subtotal: 32,
            modifiers: { create: [{ name: '16" large', price: 6 }] },
          },
        ],
      },
    },
  });

  await db.order.create({
    data: {
      restaurantId: bella.id,
      channel: "DIRECT",
      customerName: "Dana Lee",
      orderType: "PICKUP",
      status: "PREPARING",
      paymentStatus: "PAID",
      subtotal: 25,
      deliveryFee: 0,
      tax: 2.19,
      tip: 3,
      discount: 0,
      total: 30.19,
      items: {
        create: [
          {
            menuItemId: margherita.id,
            name: "Margherita DOP",
            price: 16,
            quantity: 1,
            subtotal: 16,
          },
          {
            name: "Tiramisù",
            price: 8,
            quantity: 1,
            subtotal: 8,
          },
        ],
      },
    },
  });

  // Reviews across platforms.
  await db.review.createMany({
    data: [
      {
        restaurantId: bella.id,
        platform: "DOORDASH",
        rating: 5,
        reviewerName: "Marco E.",
        body: "Best bolognese in the city. Always hot, always on time.",
        sentiment: "POSITIVE",
        sentimentScore: 0.96,
        topThemes: ["food quality", "delivery speed"],
        platformCreatedAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        restaurantId: bella.id,
        platform: "UBEREATS",
        rating: 4,
        reviewerName: "Priya S.",
        body: "Great pizza, but the order was missing the dipping sauce.",
        sentiment: "NEUTRAL",
        sentimentScore: 0.2,
        topThemes: ["missing item", "pizza"],
        platformCreatedAt: new Date(Date.now() - 8 * 86400000),
      },
      {
        restaurantId: bella.id,
        platform: "GOOGLE",
        rating: 2,
        reviewerName: "Anon",
        body: "Waited 70 minutes for delivery and the food was cold.",
        sentiment: "NEGATIVE",
        sentimentScore: -0.7,
        topThemes: ["delivery speed", "cold food"],
        platformCreatedAt: new Date(Date.now() - 12 * 86400000),
      },
    ],
  });

  // One promotion.
  await db.promotion.create({
    data: {
      restaurantId: bella.id,
      name: "$5 off $30+",
      description: "Weekday dinner boost on DoorDash.",
      type: "FIXED_DISCOUNT",
      value: 5,
      code: "BELLA5",
      isActive: true,
      startDate: new Date(),
      usageCount: 64,
      usageLimit: 500,
      revenueGenerated: 2890.5,
      conversionRate: 0.18,
      aiGenerated: true,
    },
  });

  // ── Phase 3 demo data ────────────────────────────────────────────────────────
  // Clear Phase 3 + Sakura content so the seed stays idempotent.
  await db.task.deleteMany({ where: { restaurantId: { in: [bella.id, sakura.id] } } });
  await db.channelRevenue.deleteMany({ where: { restaurantId: { in: [bella.id, sakura.id] } } });
  await db.loyaltyReward.deleteMany({ where: { restaurantId: { in: [bella.id, sakura.id] } } });
  await db.loyaltyConfig.deleteMany({ where: { restaurantId: { in: [bella.id, sakura.id] } } });
  await db.order.deleteMany({ where: { restaurantId: sakura.id } });
  await db.review.deleteMany({ where: { restaurantId: sakura.id } });
  await db.customer.deleteMany({ where: { restaurantId: sakura.id } });
  await db.menuCategory.deleteMany({ where: { restaurantId: sakura.id } });

  // Tasks (all tiers) — the partnership made visible, for Bella Cucina.
  await db.task.createMany({
    data: [
      { restaurantId: bella.id, owner: "UPREVI", type: "MILESTONE", status: "DONE", title: "Kickoff & baseline audit", description: "Documented 30-day delivery baseline.", dueDate: new Date(Date.now() - 40 * 86400000) },
      { restaurantId: bella.id, owner: "UPREVI", type: "MILESTONE", status: "DONE", title: "Menu engineering live", description: "Repriced and restructured top categories.", dueDate: new Date(Date.now() - 20 * 86400000) },
      { restaurantId: bella.id, owner: "UPREVI", type: "MILESTONE", status: "IN_PROGRESS", title: "Promotion campaign", description: "Weekend DoorDash boost running.", dueDate: new Date(Date.now() + 10 * 86400000) },
      { restaurantId: bella.id, owner: "UPREVI", type: "APPROVAL", status: "AWAITING_CLIENT", title: "Approve new menu photos", description: "12 reshot hero images ready for your sign-off." },
      { restaurantId: bella.id, owner: "UPREVI", type: "TODO", status: "IN_PROGRESS", title: "Reviewing UberEats listing copy", description: "Optimizing descriptions for search." },
      { restaurantId: sakura.id, owner: "UPREVI", type: "APPROVAL", status: "AWAITING_CLIENT", title: "Approve spicy miso promo", description: "Game-day promo drafted for approval." },
    ],
  });

  // Sakura Ramen (ACCELERATOR) — full data so unlocked features are demoable.
  const sakuraMenu = await db.menuCategory.create({
    data: {
      restaurantId: sakura.id,
      name: "Ramen",
      description: "From-scratch broth, daily",
      sortOrder: 1,
      items: {
        create: [
          { restaurantId: sakura.id, name: "Tonkotsu Ramen", description: "18-hour pork bone broth, chashu, egg.", price: 16, isSignature: true, isPopular: true, popularityScore: 96, tags: ["signature"] },
          { restaurantId: sakura.id, name: "Spicy Miso Ramen", description: "Miso-chili broth, ground pork, corn.", price: 15, isPopular: true, popularityScore: 88, tags: ["spicy"] },
          { restaurantId: sakura.id, name: "Shoyu Ramen", description: "Soy-based clear broth, bamboo, scallion.", price: 14, popularityScore: 71, tags: [] },
        ],
      },
    },
  });

  await db.customer.createMany({
    data: [
      { restaurantId: sakura.id, name: "Yuki Tanaka", email: "yuki@example.com", segment: "VIP", loyaltyTier: "Gold", loyaltyPoints: 980, totalOrders: 26, clv: 1240.0, avgOrderValue: 47.7, lastOrderAt: new Date() },
      { restaurantId: sakura.id, name: "Chris Bell", email: "chris@example.com", segment: "LOYAL", loyaltyTier: "Silver", loyaltyPoints: 410, totalOrders: 9, clv: 388.0, avgOrderValue: 43.1, lastOrderAt: new Date(Date.now() - 9 * 86400000) },
      { restaurantId: sakura.id, name: "Mei Lin", email: "mei@example.com", segment: "LAPSED", loyaltyTier: "Bronze", loyaltyPoints: 60, totalOrders: 2, clv: 78.0, avgOrderValue: 39.0, lastOrderAt: new Date(Date.now() - 75 * 86400000) },
    ],
  });

  await db.review.createMany({
    data: [
      { restaurantId: sakura.id, platform: "DOORDASH", rating: 5, reviewerName: "Yuki T.", body: "The tonkotsu is unreal. Best ramen delivery in the city.", sentiment: "POSITIVE", sentimentScore: 0.97, topThemes: ["food quality", "broth"], platformCreatedAt: new Date(Date.now() - 2 * 86400000) },
      { restaurantId: sakura.id, platform: "UBEREATS", rating: 3, reviewerName: "Chris B.", body: "Great flavor but the broth arrived lukewarm.", sentiment: "NEUTRAL", sentimentScore: 0.1, topThemes: ["temperature", "delivery"], platformCreatedAt: new Date(Date.now() - 6 * 86400000) },
      { restaurantId: sakura.id, platform: "GOOGLE", rating: 5, reviewerName: "Mei L.", body: "Spicy miso is my weekly ritual now. So good.", sentiment: "POSITIVE", sentimentScore: 0.9, topThemes: ["spicy miso", "repeat"], platformCreatedAt: new Date(Date.now() - 11 * 86400000) },
    ],
  });

  // Channel revenue for Sakura — last 10 days across DoorDash / UberEats / Direct.
  const channelRows: { restaurantId: string; date: Date; channel: "DOORDASH" | "UBEREATS" | "DIRECT"; revenue: number; orders: number }[] = [];
  for (let d = 10; d >= 1; d--) {
    const date = new Date(Date.now() - d * 86400000);
    date.setUTCHours(0, 0, 0, 0);
    const wobble = (d % 3) * 40;
    channelRows.push({ restaurantId: sakura.id, date, channel: "DOORDASH", revenue: 620 + wobble, orders: 24 + (d % 3) });
    channelRows.push({ restaurantId: sakura.id, date, channel: "UBEREATS", revenue: 410 + wobble, orders: 16 + (d % 2) });
    channelRows.push({ restaurantId: sakura.id, date, channel: "DIRECT", revenue: 280 + wobble, orders: 11 + (d % 2) });
  }
  await db.channelRevenue.createMany({ data: channelRows });

  // Loyalty for Sakura.
  await db.loyaltyConfig.create({ data: { restaurantId: sakura.id, enabled: true, pointsPerDollar: 2 } });
  await db.loyaltyReward.createMany({
    data: [
      { restaurantId: sakura.id, name: "Free gyoza", pointsCost: 500 },
      { restaurantId: sakura.id, name: "Free ramen", pointsCost: 1500 },
    ],
  });

  // A live direct order for Sakura so its dashboard/orders aren't empty.
  const tonkotsu = await db.menuItem.findFirstOrThrow({ where: { restaurantId: sakura.id, name: "Tonkotsu Ramen" } });
  void sakuraMenu;
  await db.order.create({
    data: {
      restaurantId: sakura.id, channel: "DIRECT", customerName: "Yuki Tanaka", orderType: "PICKUP",
      status: "PREPARING", paymentStatus: "PAID",
      subtotal: 32, deliveryFee: 0, tax: 2.8, tip: 5, discount: 0, total: 39.8,
      items: { create: [{ menuItemId: tonkotsu.id, name: "Tonkotsu Ramen", price: 16, quantity: 2, subtotal: 32 }] },
    },
  });

  // ── Phase 4 demo data (Sakura ACCELERATOR — the Owner.com-killers) ────────────
  await db.upsellRule.deleteMany({ where: { restaurantId: { in: [bella.id, sakura.id] } } });
  await db.revenuePrediction.deleteMany({ where: { restaurantId: { in: [bella.id, sakura.id] } } });
  await db.promotion.deleteMany({ where: { restaurantId: sakura.id } });

  // Sides for Sakura, so upsell rules have complements.
  await db.menuCategory.create({
    data: {
      restaurantId: sakura.id,
      name: "Sides",
      sortOrder: 2,
      items: {
        create: [
          { restaurantId: sakura.id, name: "Pork Gyoza", description: "Pan-fried dumplings (6).", price: 7, popularityScore: 60, tags: [] },
          { restaurantId: sakura.id, name: "Edamame", description: "Sea salt.", price: 5, popularityScore: 40, tags: [] },
        ],
      },
    },
  });

  const sakuraItems = await db.menuItem.findMany({ where: { restaurantId: sakura.id }, select: { id: true, name: true } });
  const byName = Object.fromEntries(sakuraItems.map((i) => [i.name, i.id])) as Record<string, string>;

  await db.upsellRule.createMany({
    data: [
      { restaurantId: sakura.id, triggerItemId: byName["Tonkotsu Ramen"], suggestedItemId: byName["Pork Gyoza"], timesShown: 120, timesConverted: 38, conversionRate: 38 / 120 },
      { restaurantId: sakura.id, triggerItemId: byName["Spicy Miso Ramen"], suggestedItemId: byName["Edamame"], timesShown: 90, timesConverted: 21, conversionRate: 21 / 90 },
      { restaurantId: sakura.id, triggerItemId: byName["Shoyu Ramen"], suggestedItemId: byName["Pork Gyoza"], timesShown: 60, timesConverted: 12, conversionRate: 12 / 60 },
    ],
  });

  // 7-day forecast with showcase drivers (game day + rain) — gated predictive_dashboard.
  const WK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const baseByDow = [900, 760, 780, 820, 1150, 1500, 1400];
  const OVERALL = 1070;
  const t0 = new Date();
  t0.setUTCHours(0, 0, 0, 0);
  for (let n = 1; n <= 7; n++) {
    const date = new Date(t0.getTime() + n * 86_400_000);
    const dow = date.getUTCDay();
    const base = baseByDow[dow];
    let predicted = base;
    let drivers: { kind: string; label: string; impactPct: number }[] = [];
    let headline = "";

    if (n === 2) {
      drivers = [{ kind: "GAMEDAY", label: "Ravens vs Steelers, 8pm", impactPct: 40 }];
      predicted = Math.round(base * 1.4);
      headline = `${WK[dow]} looks strong: Ravens vs Steelers, 8pm. Expect ~40% above a normal ${WK[dow]}.`;
    } else if (n === 4) {
      drivers = [{ kind: "WEATHER", label: "Heavy rain forecast", impactPct: 25 }];
      predicted = Math.round(base * 1.25);
      headline = `${WK[dow]} looks strong: heavy rain forecast (delivery historically +35%). Expect ~25% above a normal day.`;
    } else {
      const dowLift = Math.round(((base - OVERALL) / OVERALL) * 100);
      if (Math.abs(dowLift) >= 12) {
        drivers = [{ kind: "DOW", label: `${WK[dow]} day-of-week pattern`, impactPct: dowLift }];
        headline = dowLift > 0
          ? `${WK[dow]} typically runs ~${dowLift}% above your weekly average. Staff up and stock your top sellers.`
          : `${WK[dow]} is usually quiet (~${Math.abs(dowLift)}% below average). A slow-day promo could fill it.`;
      } else {
        headline = `${WK[dow]} should track close to your weekly average.`;
      }
    }
    const liftPct = Math.round(((predicted - OVERALL) / OVERALL) * 100);
    await db.revenuePrediction.create({
      data: { restaurantId: sakura.id, date, predictedRevenue: predicted, baselineRevenue: base, liftPct, drivers, headline },
    });
  }

  // Smart promos: one awaiting approval, one already active.
  await db.promotion.create({
    data: { restaurantId: sakura.id, name: "Game Day Bundle", description: "15% off orders $40+ during the game. (gameday)", type: "PERCENTAGE_DISCOUNT", triggerType: "GAMEDAY", status: "DRAFT", value: 15, code: "SAKURAGAME", isActive: false, aiGenerated: true },
  });
  await db.promotion.create({
    data: { restaurantId: sakura.id, name: "Rainy Day Delivery", description: "Free delivery when the weather turns.", type: "FREE_DELIVERY", triggerType: "WEATHER", status: "ACTIVE", value: 0, code: "SAKURARAIN", isActive: true, startDate: new Date(), usageCount: 22, revenueGenerated: 540, conversionRate: 0.14, aiGenerated: true },
  });

  console.log("Seed complete:");
  console.log(`  Users: ${owner.email}, ${admin.email}, ${staff.email}, ${customer.email}`);
  console.log(`  Restaurants: ${bella.name} (SPRINT), ${sakura.name} (ACCELERATOR)`);
  console.log(`  Dev password for all accounts: ${DEV_PASSWORD}`);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
