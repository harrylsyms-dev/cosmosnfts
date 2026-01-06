import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get total count
  const total = await prisma.nFT.count();
  console.log('Total NFTs:', total);

  // Top 15 by score
  console.log('\nTOP 15 BY SCORE:');
  const top = await prisma.nFT.findMany({
    orderBy: { totalScore: 'desc' },
    take: 15,
    select: { name: true, totalScore: true, badgeTier: true, objectCategory: true }
  });
  for (const t of top) {
    console.log(`  ${t.name}: ${t.totalScore} (${t.badgeTier}, ${t.objectCategory})`);
  }

  // Count by tier manually
  console.log('\nTIER DISTRIBUTION:');
  const tierNames = ['MYTHIC', 'LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'] as const;
  for (const tier of tierNames) {
    const count = await prisma.nFT.count({ where: { badgeTier: tier } });
    console.log(`  ${tier}: ${count}`);
  }

  // Check for OTHER category
  console.log('\nOTHER CATEGORY COUNT:');
  try {
    const other = await prisma.nFT.count({ where: { objectCategory: 'OTHER' as any } });
    console.log(`  OTHER: ${other}`);
  } catch {
    console.log('  OTHER enum value no longer exists (good!)');
  }
}

main().finally(() => prisma.$disconnect());
