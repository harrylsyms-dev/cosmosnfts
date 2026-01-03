import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

declare global {
  var prisma: ReturnType<typeof createPrismaClient> | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.COSMO_PRISMA_DATABASE_URL,
      },
    },
  }).$extends(withAccelerate());
}

// Lazy initialization to ensure env vars are loaded
function getPrismaClient() {
  if (!globalThis.prisma) {
    globalThis.prisma = createPrismaClient();
  }
  return globalThis.prisma;
}

export const prisma = new Proxy({} as ReturnType<typeof createPrismaClient>, {
  get(target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  },
});
