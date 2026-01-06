/**
 * Test Scoring Targets
 *
 * Verifies that key celestial objects meet their expected scoring targets.
 * Used to validate that the scoring system is working correctly after changes.
 *
 * Usage:
 *   npx tsx scripts/test-scoring-targets.ts
 *
 * Exit codes:
 *   0 - All objects within acceptable range (no more than 10 points below target)
 *   1 - One or more objects are more than 10 points below their target
 */

import { PrismaClient } from '@prisma/client';
import {
  ObjectScientificData,
  calculateTotalScore,
  ScoringResult,
  ANCIENT_OBJECTS,
  ACTIVE_MISSION_TARGETS,
  PLANNED_MISSION_TARGETS,
} from '../lib/scoring';

const prisma = new PrismaClient();

// ============================================================
// TARGET SCORES
// ============================================================

/**
 * Target scores for key celestial objects.
 * These are the minimum expected scores for each object based on their
 * scientific importance, cultural significance, and other metrics.
 */
const TARGET_SCORES: Record<string, number> = {
  Mars: 270,
  Earth: 280,
  Sun: 275,
  Moon: 265,
  Jupiter: 260,
};

/**
 * Acceptable deviation below target score.
 * Objects scoring more than this many points below target will cause test failure.
 */
const ACCEPTABLE_DEVIATION = 10;

// ============================================================
// TYPES
// ============================================================

interface NFTRecord {
  id: number;
  name: string;
  objectCategory: string;
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
  // Database stored scores for comparison
  totalScore: number;
  culturalSignificance: number;
  scientificImportance: number;
  historicalSignificance: number;
  visualImpact: number;
  uniqueness: number;
  accessibility: number;
  proximity: number;
  storyFactor: number;
  activeRelevance: number;
  futurePotential: number;
}

interface TestResult {
  name: string;
  targetScore: number;
  actualScore: number;
  calculatedScore: number;
  difference: number;
  passed: boolean;
  metricsNeedingImprovement: string[];
  breakdown: ScoringResult;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function nftToScoringData(nft: NFTRecord): ObjectScientificData {
  return {
    name: nft.name,
    category: nft.objectCategory as any,
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

/**
 * Identify which metrics are below their maximum potential
 */
function identifyImprovementAreas(result: ScoringResult): string[] {
  const improvements: string[] = [];

  // Define max scores and acceptable thresholds
  const metrics: Array<{ name: string; value: number; max: number; threshold: number }> = [
    { name: 'Cultural Significance', value: result.culturalSignificance, max: 60, threshold: 45 },
    { name: 'Scientific Importance', value: result.scientificImportance, max: 50, threshold: 35 },
    { name: 'Historical Significance', value: result.historicalSignificance, max: 40, threshold: 35 },
    { name: 'Visual Impact', value: result.visualImpact, max: 30, threshold: 25 },
    { name: 'Uniqueness', value: result.uniqueness, max: 30, threshold: 25 },
    { name: 'Accessibility', value: result.accessibility, max: 20, threshold: 18 },
    { name: 'Proximity', value: result.proximity, max: 20, threshold: 15 },
    { name: 'Story Factor', value: result.storyFactor, max: 20, threshold: 15 },
    { name: 'Active Relevance', value: result.activeRelevance, max: 15, threshold: 12 },
    { name: 'Future Potential', value: result.futurePotential, max: 15, threshold: 10 },
  ];

  for (const metric of metrics) {
    if (metric.value < metric.threshold) {
      const deficit = metric.max - metric.value;
      improvements.push(`${metric.name}: ${metric.value}/${metric.max} (potential +${deficit})`);
    }
  }

  return improvements;
}

// ============================================================
// MAIN TEST FUNCTION
// ============================================================

async function testScoringTargets(): Promise<void> {
  console.log('='.repeat(60));
  console.log('  SCORING TARGETS TEST');
  console.log('='.repeat(60));
  console.log();
  console.log('Target Scores:');
  for (const [name, target] of Object.entries(TARGET_SCORES)) {
    console.log(`  ${name}: ${target}`);
  }
  console.log();
  console.log(`Acceptable deviation: ${ACCEPTABLE_DEVIATION} points below target`);
  console.log();

  // Fetch target objects from database
  const objectNames = Object.keys(TARGET_SCORES);

  const nfts = await prisma.nFT.findMany({
    where: {
      name: { in: objectNames }
    },
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
      totalScore: true,
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
    }
  });

  // Check for missing objects
  const foundNames = new Set(nfts.map(n => n.name));
  const missingObjects = objectNames.filter(name => !foundNames.has(name));

  if (missingObjects.length > 0) {
    console.log('WARNING: The following target objects were not found in the database:');
    for (const name of missingObjects) {
      console.log(`  - ${name}`);
    }
    console.log();
  }

  // Run scoring calculations and compare
  const results: TestResult[] = [];

  for (const nft of nfts) {
    const targetScore = TARGET_SCORES[nft.name];
    const scoringData = nftToScoringData(nft as NFTRecord);
    const calculatedResult = calculateTotalScore(scoringData);

    const difference = calculatedResult.totalScore - targetScore;
    const passed = difference >= -ACCEPTABLE_DEVIATION;
    const metricsNeedingImprovement = identifyImprovementAreas(calculatedResult);

    results.push({
      name: nft.name,
      targetScore,
      actualScore: nft.totalScore,
      calculatedScore: calculatedResult.totalScore,
      difference,
      passed,
      metricsNeedingImprovement,
      breakdown: calculatedResult,
    });
  }

  // Sort by difference (worst first)
  results.sort((a, b) => a.difference - b.difference);

  // Print results
  console.log('-'.repeat(60));
  console.log('  RESULTS');
  console.log('-'.repeat(60));
  console.log();

  let passCount = 0;
  let failCount = 0;

  for (const result of results) {
    const status = result.passed ? 'PASS' : 'FAIL';
    const statusIcon = result.passed ? '[OK]' : '[!!]';
    const diffStr = result.difference >= 0 ? `+${result.difference}` : `${result.difference}`;

    console.log(`${statusIcon} ${result.name}`);
    console.log(`    Target: ${result.targetScore} | Calculated: ${result.calculatedScore} | DB Stored: ${result.actualScore}`);
    console.log(`    Difference from target: ${diffStr} points`);
    console.log();

    // Print score breakdown
    console.log('    Score Breakdown:');
    console.log(`      Cultural Significance:   ${result.breakdown.culturalSignificance.toString().padStart(2)}/60`);
    console.log(`      Scientific Importance:   ${result.breakdown.scientificImportance.toString().padStart(2)}/50`);
    console.log(`      Historical Significance: ${result.breakdown.historicalSignificance.toString().padStart(2)}/40`);
    console.log(`      Visual Impact:           ${result.breakdown.visualImpact.toString().padStart(2)}/30`);
    console.log(`      Uniqueness:              ${result.breakdown.uniqueness.toString().padStart(2)}/30`);
    console.log(`      Accessibility:           ${result.breakdown.accessibility.toString().padStart(2)}/20`);
    console.log(`      Proximity:               ${result.breakdown.proximity.toString().padStart(2)}/20`);
    console.log(`      Story Factor:            ${result.breakdown.storyFactor.toString().padStart(2)}/20`);
    console.log(`      Active Relevance:        ${result.breakdown.activeRelevance.toString().padStart(2)}/15`);
    console.log(`      Future Potential:        ${result.breakdown.futurePotential.toString().padStart(2)}/15`);
    console.log(`      -----------------------------------`);
    console.log(`      TOTAL:                  ${result.breakdown.totalScore.toString().padStart(3)}/300`);
    console.log();

    // Print improvement areas for failing tests
    if (!result.passed && result.metricsNeedingImprovement.length > 0) {
      console.log('    Metrics needing improvement:');
      for (const metric of result.metricsNeedingImprovement) {
        console.log(`      - ${metric}`);
      }
      console.log();
    }

    if (result.passed) {
      passCount++;
    } else {
      failCount++;
    }
  }

  // Add missing objects as failures
  for (const name of missingObjects) {
    failCount++;
    console.log(`[!!] ${name}`);
    console.log(`    NOT FOUND IN DATABASE`);
    console.log();
  }

  // Print summary
  console.log('='.repeat(60));
  console.log('  SUMMARY');
  console.log('='.repeat(60));
  console.log();
  console.log(`  Total objects tested: ${results.length + missingObjects.length}`);
  console.log(`  Passed: ${passCount}`);
  console.log(`  Failed: ${failCount + missingObjects.length}`);
  console.log();

  if (failCount > 0 || missingObjects.length > 0) {
    console.log('  RESULT: FAILED');
    console.log();
    console.log('  The following objects need attention:');
    for (const result of results.filter(r => !r.passed)) {
      const diff = result.difference;
      console.log(`    - ${result.name}: ${diff} points from target (needs +${Math.abs(diff) - ACCEPTABLE_DEVIATION} more)`);
    }
    for (const name of missingObjects) {
      console.log(`    - ${name}: Not found in database`);
    }
    console.log();
    console.log('  To fix these issues:');
    console.log('    1. Ensure scientific data is collected for these objects');
    console.log('    2. Run: npx tsx scripts/collect-scientific-data.ts');
    console.log('    3. Run: npx tsx scripts/recalculate-scores.ts');
    console.log('    4. Re-run this test to verify fixes');
  } else {
    console.log('  RESULT: PASSED');
    console.log();
    console.log('  All target objects are within acceptable range of their targets.');
  }

  console.log();
  console.log('='.repeat(60));

  // Exit with appropriate code
  if (failCount > 0 || missingObjects.length > 0) {
    process.exit(1);
  }
}

// ============================================================
// ENTRY POINT
// ============================================================

testScoringTargets()
  .catch((error) => {
    console.error('Error running scoring targets test:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
