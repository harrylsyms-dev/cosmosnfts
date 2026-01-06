/**
 * Recalculate All NFT Scores
 *
 * Uses the pure data-driven scoring system from lib/scoring.ts
 * Every object is scored by the same algorithm - no exceptions.
 *
 * Optimized for performance:
 * - Fetches in batches of 1000
 * - Calculates all scores in memory first
 * - Writes to database in batched transactions
 *
 * Usage:
 *   npx tsx scripts/recalculate-scores.ts [--dry-run] [--limit N] [--assign-tiers]
 */

import { PrismaClient, ObjectCategory, BadgeTier } from '@prisma/client';
import {
  ObjectScientificData,
  calculateTotalScore,
  ScoringResult,
  ANCIENT_OBJECTS,
  ACTIVE_MISSION_TARGETS,
  PLANNED_MISSION_TARGETS,
} from '../lib/scoring';
import { TIER_DISTRIBUTION, TIER_ORDER, TIER_MULTIPLIERS } from '../lib/tierAssignment';

const prisma = new PrismaClient();

// ============================================================
// NFT TO SCORING DATA CONVERSION
// ============================================================

interface NFTRecord {
  id: number;
  name: string;
  objectCategory: ObjectCategory;
  wikipediaPageViews: number | null;
  totalPaperCount: number | null;
  recentPaperCount: number | null;
  wikidataSitelinks: number | null;
  wikidataCulturalRefs: number | null;
  distanceLy: number | null;
  apparentMagnitude: number | null;
  discoveryYear: number | null;
  hasImages: boolean;
  namedByAncients: boolean;
  hasActiveMission: boolean;
  plannedMission: boolean;
  isHabitable: boolean;
  isInSolarSystem: boolean;
}

function nftToScoringData(nft: NFTRecord): ObjectScientificData {
  return {
    name: nft.name,
    category: nft.objectCategory,
    wikipediaPageViews: nft.wikipediaPageViews ?? undefined,
    totalPaperCount: nft.totalPaperCount ?? undefined,
    recentPaperCount: nft.recentPaperCount ?? undefined,
    wikidataSitelinks: nft.wikidataSitelinks ?? undefined,
    wikidataCulturalRefs: nft.wikidataCulturalRefs ?? undefined,
    distanceLy: nft.distanceLy ?? undefined,
    apparentMagnitude: nft.apparentMagnitude ?? undefined,
    discoveryYear: nft.discoveryYear ?? undefined,
    hasImages: nft.hasImages,
    namedByAncients: nft.namedByAncients || ANCIENT_OBJECTS.has(nft.name),
    hasActiveMission: nft.hasActiveMission || ACTIVE_MISSION_TARGETS.has(nft.name),
    plannedMission: nft.plannedMission || PLANNED_MISSION_TARGETS.has(nft.name),
    isHabitable: nft.isHabitable,
    isInSolarSystem: nft.isInSolarSystem,
  };
}

// ============================================================
// SCORE RECALCULATION (OPTIMIZED)
// ============================================================

async function recalculateAllScores(
  dryRun: boolean,
  limit?: number
): Promise<{
  processed: number;
  errors: number;
  scoreDistribution: Map<number, number>;
}> {
  const startTime = Date.now();
  console.log('Phase 1: Fetching NFTs from database...');

  const totalCount = limit || await prisma.nFT.count();
  console.log(`  Total NFTs to process: ${totalCount.toLocaleString()}`);

  // Fetch in batches of 1000
  const FETCH_BATCH = 1000;
  const nfts: NFTRecord[] = [];

  for (let skip = 0; skip < totalCount; skip += FETCH_BATCH) {
    const take = limit ? Math.min(FETCH_BATCH, limit - skip) : FETCH_BATCH;
    if (take <= 0) break;

    const pct = Math.round((skip / totalCount) * 100);
    process.stdout.write(`\r  Fetching: ${skip.toLocaleString()}/${totalCount.toLocaleString()} (${pct}%)`);

    const batch = await prisma.nFT.findMany({
      select: {
        id: true,
        name: true,
        objectCategory: true,
        wikipediaPageViews: true,
        totalPaperCount: true,
        recentPaperCount: true,
        wikidataSitelinks: true,
        wikidataCulturalRefs: true,
        distanceLy: true,
        apparentMagnitude: true,
        discoveryYear: true,
        hasImages: true,
        namedByAncients: true,
        hasActiveMission: true,
        plannedMission: true,
        isHabitable: true,
        isInSolarSystem: true,
      },
      skip,
      take,
      orderBy: { id: 'asc' },
    });

    nfts.push(...batch);
    if (batch.length < take) break;
  }

  const fetchTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Loaded ${nfts.length.toLocaleString()} NFTs in ${fetchTime}s`);

  // Phase 2: Calculate all scores in memory
  console.log('\nPhase 2: Calculating scores...');
  const calcStart = Date.now();

  let errors = 0;
  const scoreDistribution = new Map<number, number>();
  const scoredNfts: Array<{ id: number; result: ScoringResult }> = [];

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];

    if (i % 5000 === 0 || i === nfts.length - 1) {
      const pct = Math.round((i / nfts.length) * 100);
      process.stdout.write(`\r  Scoring: ${i.toLocaleString()}/${nfts.length.toLocaleString()} (${pct}%)`);
    }

    try {
      const scoringData = nftToScoringData(nft);
      const result = calculateTotalScore(scoringData);
      scoredNfts.push({ id: nft.id, result });

      // Track score distribution (bucket by 10s)
      const bucket = Math.floor(result.totalScore / 10) * 10;
      scoreDistribution.set(bucket, (scoreDistribution.get(bucket) || 0) + 1);
    } catch (error) {
      console.error(`\n  Error scoring NFT ${nft.id} (${nft.name}):`, error);
      errors++;
    }
  }

  const calcTime = ((Date.now() - calcStart) / 1000).toFixed(1);
  console.log(`\n  Calculated ${scoredNfts.length.toLocaleString()} scores in ${calcTime}s`);

  // Phase 3: Write to database in batched transactions
  if (!dryRun) {
    console.log('\nPhase 3: Writing scores to database...');
    const writeStart = Date.now();
    const WRITE_BATCH = 1000;
    let written = 0;

    for (let i = 0; i < scoredNfts.length; i += WRITE_BATCH) {
      const batch = scoredNfts.slice(i, i + WRITE_BATCH);

      const pct = Math.round((i / scoredNfts.length) * 100);
      process.stdout.write(`\r  Writing: ${i.toLocaleString()}/${scoredNfts.length.toLocaleString()} (${pct}%)`);

      // Use transaction for batch update
      await prisma.$transaction(
        batch.map(({ id, result }) =>
          prisma.nFT.update({
            where: { id },
            data: {
              culturalSignificance: result.culturalSignificance,
              scientificImportance: result.scientificImportance,
              historicalSignificance: result.historicalSignificance,
              visualImpact: result.visualImpact,
              uniqueness: result.uniqueness,
              accessibility: result.accessibility,
              proximity: result.proximity,
              storyFactor: result.storyFactor,
              activeRelevance: result.activeRelevance,
              futurePotential: result.futurePotential,
              totalScore: result.totalScore,
              cosmicScore: result.totalScore,
              dataCompleteness: result.dataCompleteness,
              lowConfidence: result.lowConfidence,
            },
          })
        )
      );

      written += batch.length;
    }

    const writeTime = ((Date.now() - writeStart) / 1000).toFixed(1);
    console.log(`\n  Wrote ${written.toLocaleString()} records in ${writeTime}s`);
  } else {
    console.log('\nPhase 3: [DRY RUN] Skipping database writes');
  }

  return { processed: scoredNfts.length, errors, scoreDistribution };
}

// ============================================================
// TIER ASSIGNMENT (RANK-BASED, OPTIMIZED)
// ============================================================

async function assignTiersBasedOnRank(dryRun: boolean): Promise<void> {
  console.log('\nPhase 4: Assigning tiers based on rank...');
  const startTime = Date.now();

  // Fetch only id and totalScore, sorted by score
  console.log('  Fetching scores...');
  const FETCH_BATCH = 1000;
  const nfts: Array<{ id: number; totalScore: number }> = [];

  let skip = 0;
  while (true) {
    const batch = await prisma.nFT.findMany({
      select: { id: true, totalScore: true },
      orderBy: { totalScore: 'desc' },
      skip,
      take: FETCH_BATCH,
    });

    if (batch.length === 0) break;
    nfts.push(...batch);
    skip += batch.length;

    process.stdout.write(`\r  Fetched ${nfts.length.toLocaleString()} records...`);
  }

  console.log(`\n  Sorting ${nfts.length.toLocaleString()} NFTs by score...`);

  // Calculate tier boundaries
  let currentIndex = 0;
  const tierBoundaries: { tier: BadgeTier; startIndex: number; endIndex: number }[] = [];

  for (const tier of TIER_ORDER) {
    const count = TIER_DISTRIBUTION[tier];
    tierBoundaries.push({
      tier,
      startIndex: currentIndex,
      endIndex: currentIndex + count - 1,
    });
    currentIndex += count;
  }

  // Prepare tier assignments
  console.log('  Calculating tier assignments...');
  const tierCounts: Record<BadgeTier, number> = {
    MYTHIC: 0,
    LEGENDARY: 0,
    ELITE: 0,
    PREMIUM: 0,
    EXCEPTIONAL: 0,
    STANDARD: 0,
  };

  const tierAssignments: Array<{
    id: number;
    tier: BadgeTier;
    multiplier: number;
    rank: number;
  }> = [];

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];

    // Find tier for this rank
    let assignedTier: BadgeTier = 'STANDARD';
    for (const boundary of tierBoundaries) {
      if (i >= boundary.startIndex && i <= boundary.endIndex) {
        assignedTier = boundary.tier;
        break;
      }
    }

    tierCounts[assignedTier]++;
    tierAssignments.push({
      id: nft.id,
      tier: assignedTier,
      multiplier: TIER_MULTIPLIERS[assignedTier],
      rank: tierCounts[assignedTier],
    });
  }

  // Write tier assignments in batched transactions
  if (!dryRun) {
    console.log('  Writing tier assignments...');
    const WRITE_BATCH = 1000;
    let written = 0;

    for (let i = 0; i < tierAssignments.length; i += WRITE_BATCH) {
      const batch = tierAssignments.slice(i, i + WRITE_BATCH);

      const pct = Math.round((i / tierAssignments.length) * 100);
      process.stdout.write(`\r  Writing: ${i.toLocaleString()}/${tierAssignments.length.toLocaleString()} (${pct}%)`);

      await prisma.$transaction(
        batch.map(({ id, tier, multiplier, rank }) =>
          prisma.nFT.update({
            where: { id },
            data: {
              badgeTier: tier,
              tierMultiplier: multiplier,
              tierRank: rank,
            },
          })
        )
      );

      written += batch.length;
    }

    console.log(`\n  Wrote ${written.toLocaleString()} tier assignments`);
  } else {
    console.log('  [DRY RUN] Skipping tier writes');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n  Tier assignment completed in ${elapsed}s`);

  // Print tier distribution
  console.log('\n  Tier Distribution:');
  console.log('  -------------------------------------------');
  for (const tier of TIER_ORDER) {
    const count = tierCounts[tier];
    const target = TIER_DISTRIBUTION[tier];
    const status = count === target ? '✓' : count > 0 ? '~' : '⚠';
    console.log(`  ${status} ${tier.padEnd(12)} | ${count.toString().padStart(6)} / ${target.toString().padStart(6)}`);
  }
  console.log('  -------------------------------------------');
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const assignTiers = args.includes('--assign-tiers');
  const limitArg = args.find((a) => a.startsWith('--limit'));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  console.log('╔════════════════════════════════════════════╗');
  console.log('║       NFT Score Recalculation              ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`  Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`  Assign Tiers: ${assignTiers ? 'YES' : 'NO'}`);
  if (limit) console.log(`  Limit: ${limit.toLocaleString()} NFTs`);
  console.log('');

  const startTime = Date.now();

  // Step 1: Recalculate scores
  const { processed, errors, scoreDistribution } = await recalculateAllScores(dryRun, limit);

  // Step 2: Assign tiers (after all scores are calculated)
  if (assignTiers && !limit) {
    await assignTiersBasedOnRank(dryRun);
  } else if (assignTiers && limit) {
    console.log('\n⚠️  Skipping tier assignment when using --limit (need all NFTs for ranking)');
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║                 SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`  Processed: ${processed.toLocaleString()}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total Time: ${totalElapsed}s`);
  console.log(`  Rate: ${(processed / parseFloat(totalElapsed)).toFixed(0)} NFTs/sec`);

  // Print score distribution
  console.log('\n  Score Distribution:');
  const sortedBuckets = [...scoreDistribution.entries()].sort((a, b) => b[0] - a[0]);

  for (const [bucket, count] of sortedBuckets) {
    const bar = '█'.repeat(Math.min(40, Math.ceil(count / (processed / 40))));
    console.log(`  ${bucket.toString().padStart(3)}-${(bucket + 9).toString().padStart(3)}: ${count.toString().padStart(5)} ${bar}`);
  }

  // Show top 10 and bottom 10
  console.log('\n  Top 10 Scores:');
  const topNfts = await prisma.nFT.findMany({
    select: { name: true, totalScore: true, objectCategory: true, badgeTier: true },
    orderBy: { totalScore: 'desc' },
    take: 10,
  });
  for (const nft of topNfts) {
    const tier = nft.badgeTier?.substring(0, 4) || '----';
    console.log(`  ${nft.totalScore.toString().padStart(3)} | ${tier} | ${nft.objectCategory.padEnd(12)} | ${nft.name}`);
  }

  console.log('\n  Bottom 10 Scores:');
  const bottomNfts = await prisma.nFT.findMany({
    select: { name: true, totalScore: true, objectCategory: true, badgeTier: true },
    orderBy: { totalScore: 'asc' },
    take: 10,
  });
  for (const nft of bottomNfts) {
    const tier = nft.badgeTier?.substring(0, 4) || '----';
    console.log(`  ${nft.totalScore.toString().padStart(3)} | ${tier} | ${nft.objectCategory.padEnd(12)} | ${nft.name}`);
  }

  console.log('\n✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
