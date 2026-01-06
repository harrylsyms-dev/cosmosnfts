/**
 * CosmoNFT Tier Assignment System
 * Assigns tiers based on score rank (not thresholds)
 *
 * Distribution (20,000 total):
 * - MYTHIC: 20 (0.10%) - Top 20 by score
 * - LEGENDARY: 100 (0.50%) - Next 100
 * - ELITE: 400 (2.00%) - Next 400
 * - PREMIUM: 1,000 (5.00%) - Next 1,000
 * - EXCEPTIONAL: 2,000 (10.00%) - Next 2,000
 * - STANDARD: 16,480 (82.40%) - Remaining
 */

import { PrismaClient, BadgeTier } from '@prisma/client';

// Tier distribution configuration
export const TIER_DISTRIBUTION = {
  MYTHIC: 20,
  LEGENDARY: 100,
  ELITE: 400,
  PREMIUM: 1000,
  EXCEPTIONAL: 2000,
  STANDARD: 16480,
} as const;

// Tier multipliers for pricing
export const TIER_MULTIPLIERS: Record<BadgeTier, number> = {
  MYTHIC: 200,
  LEGENDARY: 100,
  ELITE: 50,
  PREMIUM: 20,
  EXCEPTIONAL: 5,
  STANDARD: 1,
};

// Tier order (highest to lowest)
export const TIER_ORDER: BadgeTier[] = [
  'MYTHIC',
  'LEGENDARY',
  'ELITE',
  'PREMIUM',
  'EXCEPTIONAL',
  'STANDARD',
];

export interface TierAssignmentResult {
  id: number;
  name: string;
  totalScore: number;
  badgeTier: BadgeTier;
  tierMultiplier: number;
  tierRank: number; // Rank within tier (1 = highest in that tier)
}

export interface TierStats {
  tier: BadgeTier;
  count: number;
  targetCount: number;
  minScore: number;
  maxScore: number;
  avgScore: number;
}

/**
 * Assign tiers to all NFTs based on score ranking
 * @param prisma - Prisma client instance
 * @param dryRun - If true, returns assignments without updating database
 */
export async function assignTiers(
  prisma: PrismaClient,
  dryRun: boolean = false
): Promise<{
  assignments: TierAssignmentResult[];
  stats: TierStats[];
}> {
  console.log('Starting tier assignment...');

  // Get all NFTs sorted by totalScore descending
  const nfts = await prisma.nFT.findMany({
    select: {
      id: true,
      name: true,
      totalScore: true,
    },
    orderBy: {
      totalScore: 'desc',
    },
  });

  console.log(`Found ${nfts.length} NFTs to assign tiers`);

  if (nfts.length === 0) {
    return { assignments: [], stats: [] };
  }

  // Calculate cumulative tier boundaries
  const tierBoundaries: { tier: BadgeTier; startIndex: number; endIndex: number }[] = [];
  let currentIndex = 0;

  for (const tier of TIER_ORDER) {
    const count = TIER_DISTRIBUTION[tier];
    tierBoundaries.push({
      tier,
      startIndex: currentIndex,
      endIndex: currentIndex + count - 1,
    });
    currentIndex += count;
  }

  // Assign tiers based on rank
  const assignments: TierAssignmentResult[] = [];
  const tierCounts: Record<BadgeTier, number> = {
    MYTHIC: 0,
    LEGENDARY: 0,
    ELITE: 0,
    PREMIUM: 0,
    EXCEPTIONAL: 0,
    STANDARD: 0,
  };
  const tierScores: Record<BadgeTier, number[]> = {
    MYTHIC: [],
    LEGENDARY: [],
    ELITE: [],
    PREMIUM: [],
    EXCEPTIONAL: [],
    STANDARD: [],
  };

  for (let i = 0; i < nfts.length; i++) {
    const nft = nfts[i];

    // Find the tier for this rank
    let assignedTier: BadgeTier = 'STANDARD';
    for (const boundary of tierBoundaries) {
      if (i >= boundary.startIndex && i <= boundary.endIndex) {
        assignedTier = boundary.tier;
        break;
      }
    }

    // If index exceeds all boundaries, assign STANDARD
    if (i >= currentIndex) {
      assignedTier = 'STANDARD';
    }

    tierCounts[assignedTier]++;
    tierScores[assignedTier].push(nft.totalScore);

    // Calculate rank within tier
    const tierRank = tierCounts[assignedTier];

    assignments.push({
      id: nft.id,
      name: nft.name,
      totalScore: nft.totalScore,
      badgeTier: assignedTier,
      tierMultiplier: TIER_MULTIPLIERS[assignedTier],
      tierRank,
    });
  }

  // Calculate stats
  const stats: TierStats[] = TIER_ORDER.map(tier => {
    const scores = tierScores[tier];
    return {
      tier,
      count: tierCounts[tier],
      targetCount: TIER_DISTRIBUTION[tier],
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      avgScore: scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0,
    };
  });

  // Log stats
  console.log('\nTier Distribution:');
  console.log('-------------------------------------------');
  for (const stat of stats) {
    console.log(
      `${stat.tier.padEnd(12)} | ${String(stat.count).padStart(6)} / ${String(stat.targetCount).padStart(6)} | ` +
      `Scores: ${stat.minScore}-${stat.maxScore} (avg: ${stat.avgScore})`
    );
  }
  console.log('-------------------------------------------');

  // Update database if not dry run
  if (!dryRun) {
    console.log('\nUpdating database...');

    // Batch updates for performance
    const BATCH_SIZE = 500;
    let updated = 0;

    for (let i = 0; i < assignments.length; i += BATCH_SIZE) {
      const batch = assignments.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(assignment =>
          prisma.nFT.update({
            where: { id: assignment.id },
            data: {
              badgeTier: assignment.badgeTier,
              tierMultiplier: assignment.tierMultiplier,
              tierRank: assignment.tierRank,
            },
          })
        )
      );

      updated += batch.length;
      process.stdout.write(`\rUpdated ${updated} / ${assignments.length} NFTs`);
    }

    console.log('\nDatabase update complete!');
  } else {
    console.log('\nDry run - no database changes made');
  }

  return { assignments, stats };
}

/**
 * Get expected MYTHIC objects (top 20 by score)
 */
export async function getExpectedMythic(prisma: PrismaClient): Promise<Array<{
  id: number;
  name: string;
  totalScore: number;
  objectType: string | null;
}>> {
  return prisma.nFT.findMany({
    select: {
      id: true,
      name: true,
      totalScore: true,
      objectType: true,
    },
    orderBy: {
      totalScore: 'desc',
    },
    take: 20,
  });
}

/**
 * Validate tier distribution
 */
export function validateDistribution(stats: TierStats[]): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  for (const stat of stats) {
    if (stat.count !== stat.targetCount) {
      issues.push(
        `${stat.tier}: Expected ${stat.targetCount}, got ${stat.count}`
      );
    }
  }

  // Check total
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  if (total !== 20000) {
    issues.push(`Total NFTs: Expected 20000, got ${total}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Get tier by rank
 */
export function getTierByRank(rank: number): BadgeTier {
  let cumulative = 0;

  for (const tier of TIER_ORDER) {
    cumulative += TIER_DISTRIBUTION[tier];
    if (rank <= cumulative) {
      return tier;
    }
  }

  return 'STANDARD';
}

/**
 * Get tier cutoff scores (what's the minimum score for each tier)
 */
export async function getTierCutoffs(prisma: PrismaClient): Promise<Record<BadgeTier, number>> {
  const nfts = await prisma.nFT.findMany({
    select: { totalScore: true },
    orderBy: { totalScore: 'desc' },
  });

  const cutoffs: Record<BadgeTier, number> = {
    MYTHIC: 0,
    LEGENDARY: 0,
    ELITE: 0,
    PREMIUM: 0,
    EXCEPTIONAL: 0,
    STANDARD: 0,
  };

  let index = 0;
  for (const tier of TIER_ORDER) {
    const endIndex = index + TIER_DISTRIBUTION[tier] - 1;
    if (endIndex < nfts.length) {
      cutoffs[tier] = nfts[endIndex].totalScore;
    }
    index += TIER_DISTRIBUTION[tier];
  }

  return cutoffs;
}

// CLI execution
if (require.main === module) {
  const prisma = new PrismaClient();

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  assignTiers(prisma, dryRun)
    .then(({ stats }) => {
      const validation = validateDistribution(stats);
      if (!validation.valid) {
        console.log('\n⚠️ Distribution issues:');
        validation.issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('\n✅ Distribution valid!');
      }
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
