import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma client singleton (lazy).
 *
 * Prisma 7 removed the bundled query engine: the client connects through a
 * driver adapter (`@prisma/adapter-pg`, backed by node-postgres) using
 * DATABASE_URL.
 *
 * The client is created lazily on first use via a Proxy. This keeps mere
 * `import { db }` cheap and side-effect-free, so `next build` can collect page
 * data without a live database, and the DATABASE_URL check only fires when the
 * app actually touches the DB at runtime.
 *
 * In development the instance is cached on `globalThis` so hot reloads don't
 * open a new pg pool on every change.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local before using the database.",
    );
  }
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
