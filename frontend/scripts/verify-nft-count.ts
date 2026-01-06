import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.nFT.count();

  const byTier = await prisma.nFT.groupBy({
    by: ['badgeTier'],
    _count: true,
  });

  const byType = await prisma.nFT.groupBy({
    by: ['objectType'],
    _count: true,
    orderBy: { _count: { objectType: 'desc' } },
    take: 10,
  });

  console.log('=== NFT Database Summary ===\n');
  console.log('Total NFTs:', total);

  console.log('\nBy Tier:');
  const tierOrder = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];
  for (const tier of tierOrder) {
    const entry = byTier.find(t => t.badgeTier === tier);
    const count = entry?._count || 0;
    const pct = ((count / total) * 100).toFixed(2);
    console.log(`  ${tier.padEnd(12)} ${count.toString().padStart(6)} (${pct}%)`);
  }

  console.log('\nTop 10 Object Types:');
  for (const type of byType) {
    const pct = ((type._count / total) * 100).toFixed(2);
    console.log(`  ${type.objectType.padEnd(20)} ${type._count.toString().padStart(6)} (${pct}%)`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
