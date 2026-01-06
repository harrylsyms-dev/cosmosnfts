import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Query 1: Check if Wikipedia data was populated
  console.log('=== Wikipedia Data Check ===');
  const dataCheck = await prisma.nFT.findMany({
    where: {
      name: { in: ['Earth', 'Mars', 'Moon', 'Sun', 'Jupiter', 'Andromeda Galaxy', 'Betelgeuse'] }
    },
    select: {
      name: true,
      wikipediaPageViews: true,
      totalPaperCount: true,
      wikidataCulturalRefs: true,
      totalScore: true
    },
    orderBy: { totalScore: 'desc' }
  });
  console.table(dataCheck);

  // Query 2: Score breakdown for Earth
  console.log('\n=== Earth Score Breakdown ===');
  const earth = await prisma.nFT.findFirst({
    where: { name: 'Earth' },
    select: {
      name: true,
      culturalSignificance: true,
      scientificImportance: true,
      historicalSignificance: true,
      visualImpact: true,
      uniqueness: true,
      accessibility: true,
      proximity: true,
      storyFactor: true,
      activeRelevance: true,
      futurePotential: true,
      totalScore: true,
      wikipediaPageViews: true,
      totalPaperCount: true,
      isHabitable: true,
      namedByAncients: true,
      hasActiveMission: true
    }
  });
  console.log(earth);

  // Query 3: Score breakdown for Mars
  console.log('\n=== Mars Score Breakdown ===');
  const mars = await prisma.nFT.findFirst({
    where: { name: 'Mars' },
    select: {
      name: true,
      culturalSignificance: true,
      scientificImportance: true,
      historicalSignificance: true,
      visualImpact: true,
      uniqueness: true,
      accessibility: true,
      proximity: true,
      storyFactor: true,
      activeRelevance: true,
      futurePotential: true,
      totalScore: true,
      wikipediaPageViews: true,
      totalPaperCount: true,
      isHabitable: true,
      namedByAncients: true,
      hasActiveMission: true
    }
  });
  console.log(mars);

  // Query 4: Where is the Sun?
  console.log('\n=== Sun Search ===');
  const sunSearch = await prisma.nFT.findMany({
    where: {
      OR: [
        { name: { contains: 'Sun' } },
        { name: { contains: 'Sol' } }
      ]
    },
    select: {
      name: true,
      totalScore: true,
      badgeTier: true,
      objectCategory: true
    },
    orderBy: { totalScore: 'desc' },
    take: 10
  });
  console.table(sunSearch);

  // Query 5: Top 30
  console.log('\n=== Top 30 ===');
  const top30 = await prisma.nFT.findMany({
    select: { name: true, objectCategory: true, totalScore: true, badgeTier: true },
    orderBy: { totalScore: 'desc' },
    take: 30
  });
  for (let i = 0; i < top30.length; i++) {
    const n = top30[i];
    console.log(`${(i+1).toString().padStart(2)}. ${n.totalScore.toString().padStart(3)} | ${(n.badgeTier || 'NONE').padEnd(11)} | ${n.objectCategory.padEnd(15)} | ${n.name}`);
  }

  // Query 6: Count objects with Wikipedia data
  console.log('\n=== Data Coverage ===');
  const withWiki = await prisma.nFT.count({ where: { NOT: { wikipediaPageViews: null } } });
  const withPapers = await prisma.nFT.count({ where: { NOT: { totalPaperCount: null } } });
  const withWikidata = await prisma.nFT.count({ where: { NOT: { wikidataCulturalRefs: null } } });
  const total = await prisma.nFT.count();

  console.log(`Total NFTs: ${total}`);
  console.log(`With Wikipedia views: ${withWiki} (${(withWiki/total*100).toFixed(1)}%)`);
  console.log(`With paper counts: ${withPapers} (${(withPapers/total*100).toFixed(1)}%)`);
  console.log(`With Wikidata refs: ${withWikidata} (${(withWikidata/total*100).toFixed(1)}%)`);
}

main().finally(() => prisma.$disconnect());
