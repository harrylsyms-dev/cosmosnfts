import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Use Neon Postgres database
  const databaseUrl = process.env.DATABASE_URL;

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
