import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.nFT.deleteMany({});
  console.log(`Deleted ${result.count} NFTs from database`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
