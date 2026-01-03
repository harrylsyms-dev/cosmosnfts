import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createClient> | undefined;
};

function createClient() {
  // Explicitly pass the database URL to avoid schema.prisma env var issues
  const databaseUrl = process.env.COSMO_PRISMA_DATABASE_URL;

  if (!databaseUrl) {
    console.error('COSMO_PRISMA_DATABASE_URL is not set!');
    throw new Error('Database URL not configured');
  }

  return new PrismaClient({
    datasourceUrl: databaseUrl,
  }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
