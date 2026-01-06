/**
 * Phase 1: Rebalancing
 * 1. Delete COSMIC_FEATURE objects
 * 2. Reduce STAR from 19,892 to 10,000 (keep highest scoring)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Stars to ALWAYS keep regardless of score
const PRIORITY_STARS = new Set([
  'Sun',
  'Sirius', 'Sirius A', 'Sirius B',
  'Betelgeuse',
  'Polaris',
  'Proxima Centauri',
  'Alpha Centauri A', 'Alpha Centauri B', 'Alpha Centauri',
  'Vega',
  'Rigel',
  'Arcturus',
  'Canopus',
  'Aldebaran',
  'Antares',
  'Capella',
  'Procyon',
  'Altair',
  'Spica',
  'Pollux',
  'Fomalhaut',
  'Deneb',
  'Regulus',
  'Achernar',
  'Hadar',
  'Acrux',
  'Mimosa',
  'Shaula',
  'Bellatrix',
  'Castor',
  'Gacrux',
  'Alnilam',
  'Alnitak',
  'Mintaka',
]);

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('=== PHASE 1: REBALANCING ===');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}\n`);

  // Step 1: Delete COSMIC_FEATURE objects
  console.log('--- Step 1: Delete COSMIC_FEATURE ---');
  const cosmicFeatures = await prisma.nFT.findMany({
    where: { objectCategory: 'COSMIC_FEATURE' as any },
    select: { id: true, name: true }
  });

  console.log(`Found ${cosmicFeatures.length} COSMIC_FEATURE objects:`);
  for (const cf of cosmicFeatures) {
    console.log(`  - ${cf.name}`);
  }

  if (!dryRun && cosmicFeatures.length > 0) {
    const deleteResult = await prisma.nFT.deleteMany({
      where: { objectCategory: 'COSMIC_FEATURE' as any }
    });
    console.log(`Deleted ${deleteResult.count} COSMIC_FEATURE objects\n`);
  } else {
    console.log(`Would delete ${cosmicFeatures.length} objects\n`);
  }

  // Step 2: Reduce STAR category to 10,000
  console.log('--- Step 2: Reduce STAR to 10,000 ---');

  const starCount = await prisma.nFT.count({
    where: { objectCategory: 'STAR' }
  });
  console.log(`Current STAR count: ${starCount}`);

  if (starCount <= 10000) {
    console.log('Already at or below 10,000 stars. Skipping reduction.\n');
  } else {
    const toDelete = starCount - 10000;
    console.log(`Need to delete: ${toDelete} stars`);

    // Get priority stars (always keep)
    const priorityStars = await prisma.nFT.findMany({
      where: {
        objectCategory: 'STAR',
        name: { in: Array.from(PRIORITY_STARS) }
      },
      select: { id: true, name: true }
    });
    console.log(`Priority stars to keep: ${priorityStars.length}`);

    const priorityIds = new Set(priorityStars.map(s => s.id));

    // Get all stars ordered by score DESC
    const allStars = await prisma.nFT.findMany({
      where: { objectCategory: 'STAR' },
      orderBy: { totalScore: 'desc' },
      select: { id: true, name: true, totalScore: true }
    });

    // Keep top 10,000 by score, ensuring priority stars are included
    const starsToKeep = new Set<string>();

    // First add all priority stars
    for (const id of priorityIds) {
      starsToKeep.add(id);
    }

    // Then add highest scoring stars until we reach 10,000
    for (const star of allStars) {
      if (starsToKeep.size >= 10000) break;
      starsToKeep.add(star.id);
    }

    // Stars to delete = all stars NOT in starsToKeep
    const starsToDelete = allStars.filter(s => !starsToKeep.has(s.id));

    console.log(`Stars to keep: ${starsToKeep.size}`);
    console.log(`Stars to delete: ${starsToDelete.length}`);

    // Show some stats about what we're deleting
    const deleteScores = starsToDelete.map(s => s.totalScore);
    const minDelete = Math.min(...deleteScores);
    const maxDelete = Math.max(...deleteScores);
    console.log(`Deleting stars with scores: ${minDelete} - ${maxDelete}`);

    // Show cutoff score
    const keptStars = allStars.filter(s => starsToKeep.has(s.id));
    const lowestKept = Math.min(...keptStars.map(s => s.totalScore));
    console.log(`Lowest score kept: ${lowestKept}`);

    if (!dryRun) {
      // Delete in batches to avoid timeout
      const batchSize = 1000;
      const deleteIds = starsToDelete.map(s => s.id);

      let totalDeleted = 0;
      for (let i = 0; i < deleteIds.length; i += batchSize) {
        const batch = deleteIds.slice(i, i + batchSize);
        const result = await prisma.nFT.deleteMany({
          where: { id: { in: batch } }
        });
        totalDeleted += result.count;
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}: ${result.count} stars (total: ${totalDeleted})`);
      }
      console.log(`\nTotal deleted: ${totalDeleted} stars`);
    } else {
      console.log(`Would delete ${starsToDelete.length} stars`);
    }
  }

  // Final counts
  console.log('\n--- Final Category Distribution ---');
  const finalCounts = await prisma.nFT.groupBy({
    by: ['objectCategory'],
    _count: true
  });
  finalCounts.sort((a, b) => b._count - a._count);

  let total = 0;
  for (const c of finalCounts) {
    const pct = ((c._count / 20000) * 100).toFixed(2);
    console.log(`${c.objectCategory.padEnd(18)} ${String(c._count).padStart(6)} (${pct}%)`);
    total += c._count;
  }
  console.log('---');
  console.log(`TOTAL: ${total}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
