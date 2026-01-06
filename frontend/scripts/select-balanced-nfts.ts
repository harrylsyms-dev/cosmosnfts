/**
 * Select Balanced NFTs Script
 *
 * Selects a balanced set of astronomical objects for NFT generation
 * based on tier quotas and type diversity.
 *
 * Usage:
 *   npx ts-node scripts/select-balanced-nfts.ts [options]
 *
 * Options:
 *   --target 5000    Target number of NFTs to select (default: 20000)
 *   --input <path>   Input file path (default: staging/hyg-scored.json)
 *   --output <path>  Output file path (default: staging/selected-nfts.json)
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ScoredObject,
  TIER_TARGETS,
  TIER_TYPE_QUOTAS,
  getTierDistribution,
  getScoreStats,
  scoreAstronomicalObject,
} from '../lib/catalogImporter';
import { getAllAstronomicalObjects } from '../lib/astronomicalData';

// ============================================
// CLI ARGUMENT PARSING
// ============================================

interface CLIOptions {
  target: number;
  inputPath: string;
  outputPath: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    target: 20000,
    inputPath: 'staging/hyg-scored.json',
    outputPath: 'staging/selected-nfts.json',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--target':
        options.target = parseInt(args[++i], 10);
        break;
      case '--input':
        options.inputPath = args[++i];
        break;
      case '--output':
        options.outputPath = args[++i];
        break;
    }
  }

  return options;
}

// ============================================
// TYPE DEFINITIONS
// ============================================

type TierName = 'LEGENDARY' | 'ELITE' | 'PREMIUM' | 'EXCEPTIONAL' | 'STANDARD';

interface TierTypeGroup {
  tier: TierName;
  type: string;
  objects: ScoredObject[];
}

interface SelectionResult {
  selected: ScoredObject[];
  tierCounts: Record<TierName, number>;
  typeCounts: Record<string, number>;
  tierTypeCounts: Record<TierName, Record<string, number>>;
}

// ============================================
// PERCENTILE-BASED TIER ASSIGNMENT
// ============================================

/**
 * Reassign tiers based on percentile ranking within the dataset.
 * This fixes the "score clustering" problem where all objects
 * have similar scores and fall into STANDARD tier.
 *
 * Distribution:
 *   Top 1%: LEGENDARY
 *   1-4%: ELITE
 *   4-10%: PREMIUM
 *   10-25%: EXCEPTIONAL
 *   Bottom 75%: STANDARD
 */
function reassignTiersByPercentile(objects: ScoredObject[]): ScoredObject[] {
  // Sort by score descending
  const sorted = [...objects].sort((a, b) => b.scores.multiplied - a.scores.multiplied);

  const total = sorted.length;
  const legendaryThreshold = Math.floor(total * 0.01);     // Top 1%
  const eliteThreshold = Math.floor(total * 0.04);         // Top 4%
  const premiumThreshold = Math.floor(total * 0.10);       // Top 10%
  const exceptionalThreshold = Math.floor(total * 0.25);   // Top 25%

  console.log(`\n  Percentile thresholds for ${total} objects:`);
  console.log(`    LEGENDARY: top ${legendaryThreshold} (1%)`);
  console.log(`    ELITE: ${legendaryThreshold + 1} - ${eliteThreshold} (3%)`);
  console.log(`    PREMIUM: ${eliteThreshold + 1} - ${premiumThreshold} (6%)`);
  console.log(`    EXCEPTIONAL: ${premiumThreshold + 1} - ${exceptionalThreshold} (15%)`);
  console.log(`    STANDARD: ${exceptionalThreshold + 1}+ (75%)`);

  // Reassign tiers
  for (let i = 0; i < sorted.length; i++) {
    if (i < legendaryThreshold) {
      sorted[i].badgeTier = 'LEGENDARY';
    } else if (i < eliteThreshold) {
      sorted[i].badgeTier = 'ELITE';
    } else if (i < premiumThreshold) {
      sorted[i].badgeTier = 'PREMIUM';
    } else if (i < exceptionalThreshold) {
      sorted[i].badgeTier = 'EXCEPTIONAL';
    } else {
      sorted[i].badgeTier = 'STANDARD';
    }
  }

  // Log score ranges for each tier
  const tierRanges: Record<TierName, { min: number; max: number }> = {
    LEGENDARY: { min: Infinity, max: -Infinity },
    ELITE: { min: Infinity, max: -Infinity },
    PREMIUM: { min: Infinity, max: -Infinity },
    EXCEPTIONAL: { min: Infinity, max: -Infinity },
    STANDARD: { min: Infinity, max: -Infinity },
  };

  for (const obj of sorted) {
    const range = tierRanges[obj.badgeTier];
    range.min = Math.min(range.min, obj.scores.multiplied);
    range.max = Math.max(range.max, obj.scores.multiplied);
  }

  console.log(`\n  Score ranges after percentile assignment:`);
  for (const tier of ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'] as TierName[]) {
    const range = tierRanges[tier];
    if (range.min <= range.max) {
      console.log(`    ${tier.padEnd(12)}: ${range.min} - ${range.max}`);
    }
  }

  return sorted;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate tier quotas based on target count
 */
function calculateTierQuotas(target: number): Record<TierName, number> {
  return {
    LEGENDARY: Math.round(target * 0.01),   // 1%
    ELITE: Math.round(target * 0.03),       // 3%
    PREMIUM: Math.round(target * 0.06),     // 6%
    EXCEPTIONAL: Math.round(target * 0.15), // 15%
    STANDARD: Math.round(target * 0.75),    // 75%
  };
}

/**
 * Calculate type quotas for a tier based on scaled target
 */
function calculateTypeQuotas(tier: TierName, tierTarget: number): Record<string, number> {
  const baseQuotas = TIER_TYPE_QUOTAS[tier];
  const baseTotal = Object.values(baseQuotas).reduce((a, b) => a + b, 0);
  const scale = tierTarget / baseTotal;

  const quotas: Record<string, number> = {};
  for (const [type, count] of Object.entries(baseQuotas)) {
    quotas[type] = Math.round(count * scale);
  }

  return quotas;
}

/**
 * Group objects by tier and type
 */
function groupByTierAndType(objects: ScoredObject[]): Map<string, TierTypeGroup> {
  const groups = new Map<string, TierTypeGroup>();

  for (const obj of objects) {
    const key = `${obj.badgeTier}:${obj.objectType}`;

    if (!groups.has(key)) {
      groups.set(key, {
        tier: obj.badgeTier,
        type: obj.objectType,
        objects: [],
      });
    }

    groups.get(key)!.objects.push(obj);
  }

  // Sort each group by score (descending)
  for (const group of groups.values()) {
    group.objects.sort((a, b) => b.scores.multiplied - a.scores.multiplied);
  }

  return groups;
}

/**
 * Get type category for quota matching (maps exotic types to 'other')
 */
function getTypeCategory(objectType: string, tierQuotas: Record<string, number>): string {
  if (tierQuotas.hasOwnProperty(objectType)) {
    return objectType;
  }
  return 'other';
}

// ============================================
// MAIN SELECTION ALGORITHM
// ============================================

function selectBalancedNFTs(
  scoredObjects: ScoredObject[],
  curatedObjects: ScoredObject[],
  targetCount: number
): SelectionResult {
  const selected: ScoredObject[] = [];
  const usedNames = new Set<string>();

  // Track counts
  const tierCounts: Record<TierName, number> = {
    LEGENDARY: 0,
    ELITE: 0,
    PREMIUM: 0,
    EXCEPTIONAL: 0,
    STANDARD: 0,
  };
  const typeCounts: Record<string, number> = {};
  const tierTypeCounts: Record<TierName, Record<string, number>> = {
    LEGENDARY: {},
    ELITE: {},
    PREMIUM: {},
    EXCEPTIONAL: {},
    STANDARD: {},
  };

  // Calculate quotas
  const tierQuotas = calculateTierQuotas(targetCount);
  const tierTypeQuotas: Record<TierName, Record<string, number>> = {
    LEGENDARY: calculateTypeQuotas('LEGENDARY', tierQuotas.LEGENDARY),
    ELITE: calculateTypeQuotas('ELITE', tierQuotas.ELITE),
    PREMIUM: calculateTypeQuotas('PREMIUM', tierQuotas.PREMIUM),
    EXCEPTIONAL: calculateTypeQuotas('EXCEPTIONAL', tierQuotas.EXCEPTIONAL),
    STANDARD: calculateTypeQuotas('STANDARD', tierQuotas.STANDARD),
  };

  // Track remaining quotas
  const remainingTierQuotas = { ...tierQuotas };
  const remainingTypeQuotas: Record<TierName, Record<string, number>> = {
    LEGENDARY: { ...tierTypeQuotas.LEGENDARY },
    ELITE: { ...tierTypeQuotas.ELITE },
    PREMIUM: { ...tierTypeQuotas.PREMIUM },
    EXCEPTIONAL: { ...tierTypeQuotas.EXCEPTIONAL },
    STANDARD: { ...tierTypeQuotas.STANDARD },
  };

  // Helper to add an object
  function addObject(obj: ScoredObject): boolean {
    const nameLower = obj.name.toLowerCase();
    if (usedNames.has(nameLower)) {
      return false;
    }

    const tier = obj.badgeTier;
    const type = obj.objectType;
    const typeCategory = getTypeCategory(type, tierTypeQuotas[tier]);

    // Check quotas
    if (remainingTierQuotas[tier] <= 0) {
      return false;
    }
    if (remainingTypeQuotas[tier][typeCategory] !== undefined && remainingTypeQuotas[tier][typeCategory] <= 0) {
      return false;
    }

    // Add object
    selected.push(obj);
    usedNames.add(nameLower);

    // Update counts
    tierCounts[tier]++;
    typeCounts[type] = (typeCounts[type] || 0) + 1;
    tierTypeCounts[tier][type] = (tierTypeCounts[tier][type] || 0) + 1;

    // Update remaining quotas
    remainingTierQuotas[tier]--;
    if (remainingTypeQuotas[tier][typeCategory] !== undefined) {
      remainingTypeQuotas[tier][typeCategory]--;
    }

    return true;
  }

  console.log('\n=== STEP 1: Adding curated objects (priority) ===');

  // First pass: Add all curated objects (they take priority)
  let curatedAdded = 0;
  for (const obj of curatedObjects) {
    if (addObject(obj)) {
      curatedAdded++;
    }
  }
  console.log(`Added ${curatedAdded} curated objects`);

  console.log('\n=== STEP 2: Filling tier quotas with scored objects ===');

  // Group scored objects by tier and type
  const groups = groupByTierAndType(scoredObjects);

  // Process tiers from highest to lowest
  const tierOrder: TierName[] = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];

  for (const tier of tierOrder) {
    const typeQuotas = remainingTypeQuotas[tier];
    console.log(`\n  Processing ${tier} tier (target: ${tierQuotas[tier]}, remaining: ${remainingTierQuotas[tier]})`);

    // Get all types with quotas for this tier
    const typesWithQuotas = Object.keys(typeQuotas);

    // Process each type
    for (const typeCategory of typesWithQuotas) {
      const quota = typeQuotas[typeCategory];
      if (quota <= 0) continue;

      // Find matching groups
      const matchingGroups: TierTypeGroup[] = [];
      for (const [key, group] of groups) {
        if (group.tier !== tier) continue;

        const groupCategory = getTypeCategory(group.type, tierTypeQuotas[tier]);
        if (groupCategory === typeCategory) {
          matchingGroups.push(group);
        }
      }

      // Sort groups by size (descending) to prioritize variety
      matchingGroups.sort((a, b) => b.objects.length - a.objects.length);

      // Add objects from groups
      let addedForType = 0;
      let groupIndex = 0;

      while (addedForType < quota && matchingGroups.length > 0) {
        const group = matchingGroups[groupIndex % matchingGroups.length];

        // Find next available object in group
        let foundInGroup = false;
        for (const obj of group.objects) {
          if (!usedNames.has(obj.name.toLowerCase())) {
            if (addObject(obj)) {
              addedForType++;
              foundInGroup = true;
              break;
            }
          }
        }

        // Remove empty groups
        if (!foundInGroup) {
          const idx = matchingGroups.indexOf(group);
          if (idx !== -1) {
            matchingGroups.splice(idx, 1);
          }
        } else {
          groupIndex++;
        }
      }

      if (addedForType > 0) {
        console.log(`    Added ${addedForType} ${typeCategory} objects`);
      }
    }
  }

  console.log('\n=== STEP 3: Filling remaining slots with highest-scoring objects ===');

  // If we still have room, add more objects by score
  const allRemaining = scoredObjects
    .filter(obj => !usedNames.has(obj.name.toLowerCase()))
    .sort((a, b) => b.scores.multiplied - a.scores.multiplied);

  let extraAdded = 0;
  for (const obj of allRemaining) {
    if (selected.length >= targetCount) break;

    // Can still add if tier has room (ignoring type quotas)
    if (remainingTierQuotas[obj.badgeTier] > 0) {
      if (addObject(obj)) {
        extraAdded++;
      }
    }
  }
  console.log(`Added ${extraAdded} additional objects by score`);

  return {
    selected,
    tierCounts,
    typeCounts,
    tierTypeCounts,
  };
}

// ============================================
// REPORTING
// ============================================

function printDetailedReport(result: SelectionResult, targetCount: number): void {
  const { selected, tierCounts, typeCounts, tierTypeCounts } = result;

  console.log('\n');
  console.log('='.repeat(80));
  console.log('                        SELECTION REPORT');
  console.log('='.repeat(80));

  // Overall stats
  const stats = getScoreStats(selected);
  console.log('\n--- OVERALL STATISTICS ---');
  console.log(`Total Selected: ${selected.length} / ${targetCount} target (${((selected.length / targetCount) * 100).toFixed(1)}%)`);
  console.log(`Score Range: ${stats.min} - ${stats.max}`);
  console.log(`Score Mean: ${stats.mean}`);
  console.log(`Score Median: ${stats.median}`);
  console.log(`Score Std Dev: ${stats.stdDev}`);

  // Tier distribution
  console.log('\n--- TIER DISTRIBUTION ---');
  console.log(`${'Tier'.padEnd(15)} ${'Count'.padStart(8)} ${'Percent'.padStart(10)} ${'Target %'.padStart(10)}`);
  console.log('-'.repeat(45));

  const tierOrder: TierName[] = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];
  const tierTargetPercents: Record<TierName, number> = {
    LEGENDARY: 1,
    ELITE: 3,
    PREMIUM: 6,
    EXCEPTIONAL: 15,
    STANDARD: 75,
  };

  for (const tier of tierOrder) {
    const count = tierCounts[tier];
    const percent = (count / selected.length * 100).toFixed(2);
    const target = tierTargetPercents[tier].toFixed(2);
    console.log(`${tier.padEnd(15)} ${count.toString().padStart(8)} ${(percent + '%').padStart(10)} ${(target + '%').padStart(10)}`);
  }

  // Type distribution
  console.log('\n--- TYPE DISTRIBUTION ---');
  console.log(`${'Type'.padEnd(20)} ${'Count'.padStart(8)} ${'Percent'.padStart(10)}`);
  console.log('-'.repeat(40));

  const sortedTypes = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1]);

  for (const [type, count] of sortedTypes) {
    const percent = (count / selected.length * 100).toFixed(2);
    console.log(`${type.padEnd(20)} ${count.toString().padStart(8)} ${(percent + '%').padStart(10)}`);
  }

  // Tier x Type breakdown
  console.log('\n--- TIER x TYPE BREAKDOWN ---');

  for (const tier of tierOrder) {
    const tierTotal = tierCounts[tier];
    if (tierTotal === 0) continue;

    console.log(`\n${tier} (${tierTotal} total):`);

    const tierTypes = Object.entries(tierTypeCounts[tier])
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    for (const [type, count] of tierTypes) {
      const percent = (count / tierTotal * 100).toFixed(1);
      const bar = '#'.repeat(Math.round(count / tierTotal * 30));
      console.log(`  ${type.padEnd(18)} ${count.toString().padStart(6)} (${percent.padStart(5)}%) ${bar}`);
    }
  }

  // Top 10 highest scoring objects
  console.log('\n--- TOP 10 HIGHEST SCORING OBJECTS ---');
  const top10 = [...selected]
    .sort((a, b) => b.scores.multiplied - a.scores.multiplied)
    .slice(0, 10);

  for (let i = 0; i < top10.length; i++) {
    const obj = top10[i];
    console.log(`${(i + 1).toString().padStart(2)}. ${obj.name.padEnd(25)} ${obj.objectType.padEnd(15)} ${obj.badgeTier.padEnd(12)} Score: ${obj.scores.multiplied}`);
  }

  console.log('\n' + '='.repeat(80));
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main(): Promise<void> {
  const options = parseArgs();

  console.log('='.repeat(80));
  console.log('          CosmoNFTs - Balanced NFT Selection Script');
  console.log('='.repeat(80));
  console.log(`\nConfiguration:`);
  console.log(`  Target count: ${options.target}`);
  console.log(`  Input file: ${options.inputPath}`);
  console.log(`  Output file: ${options.outputPath}`);

  // Resolve paths
  const scriptDir = __dirname;
  const frontendDir = path.dirname(scriptDir);
  const inputPath = path.resolve(frontendDir, options.inputPath);
  const outputPath = path.resolve(frontendDir, options.outputPath);

  // Step 1: Load scored objects from HYG
  console.log(`\n--- Loading scored objects from ${inputPath} ---`);

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    console.error('Please run the scoring script first to generate the scored objects.');
    process.exit(1);
  }

  const hygData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  let hygObjects: ScoredObject[] = Array.isArray(hygData) ? hygData : hygData.objects || [];
  console.log(`Loaded ${hygObjects.length} scored objects from HYG database`);

  // Step 2: Load and score curated objects FIRST (before percentile ranking)
  console.log('\n--- Loading curated objects from astronomicalData.ts ---');

  const curatedRaw = getAllAstronomicalObjects();
  console.log(`Found ${curatedRaw.length} curated objects`);

  // Score the curated objects with significant boost for quality
  const curatedScored: ScoredObject[] = curatedRaw.map(obj => {
    const scored = scoreAstronomicalObject(obj);
    scored.catalogSource = 'Curated';
    scored.qualityFlags.hasCuratedFeatures = true;

    // Significant boost for curated objects (they have hand-tuned visual features)
    // This ensures they rank in higher percentiles
    scored.scores.multiplied = Math.min(500, scored.scores.multiplied + 100);

    return scored;
  });

  console.log('Curated objects scored with +100 boost');

  // Step 1b: Combine ALL objects and reassign tiers based on percentile ranking
  console.log('\n--- Combining objects and reassigning tiers by percentile ---');
  const allObjects = [...curatedScored, ...hygObjects];
  console.log(`Total objects for percentile ranking: ${allObjects.length}`);

  const rankedObjects = reassignTiersByPercentile(allObjects);

  // Separate back into curated and HYG for selection (curated get priority)
  const curatedNames = new Set(curatedScored.map(o => o.name.toLowerCase()));
  hygObjects = rankedObjects.filter(o => !curatedNames.has(o.name.toLowerCase()));
  const curatedRanked = rankedObjects.filter(o => curatedNames.has(o.name.toLowerCase()));

  console.log(`After percentile ranking:`);
  console.log(`  Curated: ${curatedRanked.length} objects`);
  console.log(`  HYG: ${hygObjects.length} objects`);

  // Step 3: Run selection algorithm
  console.log('\n--- Running balanced selection algorithm ---');

  const result = selectBalancedNFTs(hygObjects, curatedRanked, options.target);

  // Step 4: Print detailed report
  printDetailedReport(result, options.target);

  // Step 5: Save selected objects
  console.log(`\n--- Saving ${result.selected.length} selected objects to ${outputPath} ---`);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const output = {
    metadata: {
      generatedAt: new Date().toISOString(),
      targetCount: options.target,
      actualCount: result.selected.length,
      inputFile: options.inputPath,
      tierDistribution: result.tierCounts,
      typeDistribution: result.typeCounts,
    },
    objects: result.selected,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log('Selection complete!');

  // Summary
  console.log('\n--- SUMMARY ---');
  console.log(`Selected ${result.selected.length} objects for NFT generation`);
  console.log(`Output saved to: ${outputPath}`);
}

// Run main function
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
