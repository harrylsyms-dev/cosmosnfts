import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Use Vercel Postgres direct connection (with built-in pooling)
  // Falls back to other database URL env vars for flexibility
  const databaseUrl =
    process.env.STORAGE_PRISMA_DATABASE_URL ||
    process.env.STORAGE_DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('No database URL configured!');
    throw new Error('Database URL not configured');
  }

  return new PrismaClient({
    datasourceUrl: databaseUrl,
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
