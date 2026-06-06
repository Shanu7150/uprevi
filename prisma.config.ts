import { defineConfig } from "prisma/config";
import { loadEnvConfig } from "@next/env";

// Prisma 7 no longer auto-loads .env, and the Prisma CLI does not read
// Next.js's .env.local by default. Mirror Next's env loading so `prisma migrate`,
// `prisma studio`, and seeding all see DATABASE_URL from .env.local.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
