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
