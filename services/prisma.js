import { PrismaClient } from "@prisma/client";

/**
 * Prisma v5 Client Instance for HBday
 * Provides type-safe database queries across PostgreSQL / Supabase / Prisma Postgres.
 */

let prismaInstance = null;

export const getPrismaClient = () => {
  if (!prismaInstance) {
    const isDev = process.env.NODE_ENV !== "production" && !process.env.TEST;
    prismaInstance = new PrismaClient({
      log: isDev ? ["warn", "error"] : ["error"],
      errorFormat: "minimal"
    });
  }
  return prismaInstance;
};

export const prisma = getPrismaClient();

export default prisma;
