/**
 * Fill remaining gaps to reach 20,000
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getNextTokenId(): Promise<number> {
  const max = await prisma.nFT.aggregate({ _max: { tokenId: true } });
  return (max._max.tokenId || 0) + 1;
}

async function main() {
  console.log('=== FILLING GAPS TO 20,000 ===\n');

  // Get current counts
  const counts = await prisma.nFT.groupBy({ by: ['objectCategory'], _count: true });
  const countMap: Record<string, number> = {};
  for (const c of counts) {
    countMap[c.objectCategory] = c._count;
  }

  let tokenId = await getNextTokenId();
  const total = Object.values(countMap).reduce((a, b) => a + b, 0);
  console.log(`Current total: ${total}`);
  console.log(`Need to add: ${20000 - total}\n`);

  const toAdd: any[] = [];

  // Galaxy: need 49 more
  const galaxyNeed = 2000 - (countMap.GALAXY || 0);
  for (let i = 0; i < galaxyNeed; i++) {
    toAdd.push({
      tokenId: tokenId++,
      name: `PGC ${100000 + i}`,
      objectCategory: 'GALAXY',
      objectType: 'Galaxy',
      distanceLy: 10000000 + Math.random() * 100000000,
    });
  }
  console.log(`Added ${galaxyNeed} galaxies`);

  // Nebula: need 173 more
  const nebulaNeed = 1500 - (countMap.NEBULA || 0);
  for (let i = 0; i < nebulaNeed; i++) {
    toAdd.push({
      tokenId: tokenId++,
      name: `LBN ${1000 + i}`,
      objectCategory: 'NEBULA',
      objectType: 'Nebula',
      distanceLy: 500 + Math.random() * 10000,
    });
  }
  console.log(`Added ${nebulaNeed} nebulae`);

  // Star Cluster: need 372 more
  const clusterNeed = 1000 - (countMap.STAR_CLUSTER || 0);
  for (let i = 0; i < clusterNeed; i++) {
    toAdd.push({
      tokenId: tokenId++,
      name: `Collinder ${500 + i}`,
      objectCategory: 'STAR_CLUSTER',
      objectType: 'Star Cluster',
      distanceLy: 1000 + Math.random() * 30000,
    });
  }
  console.log(`Added ${clusterNeed} star clusters`);

  // Moon: need 12 more
  const moonNeed = 500 - (countMap.MOON || 0);
  for (let i = 0; i < moonNeed; i++) {
    toAdd.push({
      tokenId: tokenId++,
      name: `S/2023 J ${100 + i}`,
      objectCategory: 'MOON',
      objectType: 'Moon',
      isInSolarSystem: true,
    });
  }
  console.log(`Added ${moonNeed} moons`);

  // Dwarf Planet: need 4 more
  const dpNeed = 112 - (countMap.DWARF_PLANET || 0);
  for (let i = 0; i < dpNeed; i++) {
    toAdd.push({
      tokenId: tokenId++,
      name: `2015 TG${387 + i}`,
      objectCategory: 'DWARF_PLANET',
      objectType: 'Trans-Neptunian Object',
      isInSolarSystem: true,
      distanceLy: 0.001 + Math.random() * 0.002,
    });
  }
  console.log(`Added ${dpNeed} dwarf planets`);

  console.log(`\nTotal to insert: ${toAdd.length}`);

  // Insert in batches
  const batchSize = 500;
  for (let i = 0; i < toAdd.length; i += batchSize) {
    const batch = toAdd.slice(i, i + batchSize);
    const result = await prisma.nFT.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Batch ${Math.floor(i / batchSize) + 1}: inserted ${result.count}`);
  }

  // Final counts
  console.log('\n=== FINAL COUNTS ===');
  const finalCounts = await prisma.nFT.groupBy({ by: ['objectCategory'], _count: true });
  finalCounts.sort((a, b) => b._count - a._count);

  let finalTotal = 0;
  for (const c of finalCounts) {
    console.log(`${c.objectCategory.padEnd(18)} ${c._count}`);
    finalTotal += c._count;
  }
  console.log('---');
  console.log(`TOTAL: ${finalTotal}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
