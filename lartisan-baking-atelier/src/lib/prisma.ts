import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 *
 * Prevents multiple Prisma Client instances in development
 * due to Next.js hot reloading.
 *
 * In production, always creates a new instance.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Type export for Prisma models
 */
export type {
  User,
  Course,
  Order,
  Cart,
  Progress,
  Review,
} from "@prisma/client";
