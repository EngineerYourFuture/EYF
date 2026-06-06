import { PrismaClient } from "./generated/client";

declare global {
  // eslint-disable-next-line no-var
  var __eyf_prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__eyf_prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__eyf_prisma = prisma;
}

export * from "./generated/client";
