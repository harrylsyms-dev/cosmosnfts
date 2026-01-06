import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const objects = await prisma.nFT.findMany({
    where: { name: { in: ['Sun', 'Earth', 'Mars', 'Moon', 'Jupiter'] } },
    orderBy: { totalScore: 'desc' }
  });

  for (const o of objects) {
    console.log('='.repeat(50));
    console.log(o.name.toUpperCase(), '- Total Score:', o.totalScore);
    console.log('='.repeat(50));
    console.log('RAW DATA:');
    console.log('  wikipediaPageViews:', o.wikipediaPageViews);
    console.log('  totalPaperCount:', o.totalPaperCount);
    console.log('  wikidataSitelinks:', o.wikidataSitelinks);
    console.log('  namedByAncients:', o.namedByAncients);
    console.log('  isInSolarSystem:', o.isInSolarSystem);
    console.log('  hasActiveMission:', o.hasActiveMission);
    console.log('  plannedMission:', o.plannedMission);
    console.log('  isHabitable:', o.isHabitable);
    console.log('  hasImages:', o.hasImages);
    console.log('  distanceLy:', o.distanceLy);
    console.log('  apparentMagnitude:', o.apparentMagnitude);
    console.log('');
    console.log('SCORE BREAKDOWN:');
    console.log('  Cultural Significance:', o.culturalSignificance, '/ 60');
    console.log('  Scientific Importance:', o.scientificImportance, '/ 50');
    console.log('  Historical Significance:', o.historicalSignificance, '/ 40');
    console.log('  Visual Impact:', o.visualImpact, '/ 30');
    console.log('  Uniqueness:', o.uniqueness, '/ 30');
    console.log('  Accessibility:', o.accessibility, '/ 20');
    console.log('  Proximity:', o.proximity, '/ 20');
    console.log('  Story Factor:', o.storyFactor, '/ 20');
    console.log('  Active Relevance:', o.activeRelevance, '/ 15');
    console.log('  Future Potential:', o.futurePotential, '/ 15');
    console.log('');
  }
}

main().finally(() => prisma.$disconnect());
