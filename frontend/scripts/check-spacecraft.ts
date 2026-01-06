import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Spacecraft scores
  console.log('=== SPACECRAFT SCORES ===');
  const craft = await prisma.nFT.findMany({
    where: { objectCategory: 'SPACECRAFT' },
    orderBy: { totalScore: 'desc' },
    select: {
      name: true,
      totalScore: true,
      culturalSignificance: true,
      scientificImportance: true,
      historicalSignificance: true,
      storyFactor: true,
      activeRelevance: true,
      badgeTier: true
    }
  });
  console.log('Count: ' + craft.length);
  console.log('');
  console.log('Score | Tier | Name (cultural/scientific/historical/story/active)');
  console.log('------|------|---------------------------------------------------');
  for (const c of craft) {
    const details = `${c.culturalSignificance}/${c.scientificImportance}/${c.historicalSignificance}/${c.storyFactor}/${c.activeRelevance}`;
    console.log(`${c.totalScore} | ${c.badgeTier?.substring(0, 4)} | ${c.name} (${details})`);
  }

  // Current category distribution
  console.log('\n=== CURRENT CATEGORY DISTRIBUTION ===');
  const cats = await prisma.nFT.groupBy({
    by: ['objectCategory'],
    _count: true
  });
  cats.sort((a, b) => b._count - a._count);
  let total = 0;
  for (const c of cats) {
    const pct = ((c._count / 20088) * 100).toFixed(2);
    console.log(`${c.objectCategory.padEnd(18)} ${String(c._count).padStart(6)} (${pct}%)`);
    total += c._count;
  }
  console.log('---');
  console.log(`TOTAL: ${total}`);

  // Check for COSMIC_FEATURE
  const cosmicFeature = await prisma.nFT.findMany({
    where: { objectCategory: 'COSMIC_FEATURE' as any },
    select: { name: true }
  });
  if (cosmicFeature.length > 0) {
    console.log('\n=== COSMIC_FEATURE OBJECTS ===');
    for (const cf of cosmicFeature) {
      console.log('  ' + cf.name);
    }
  }
}

main().finally(() => prisma.$disconnect());
