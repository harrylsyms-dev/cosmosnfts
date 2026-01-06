/**
 * HYG Database Import Script
 *
 * Downloads the HYG star database, parses it, scores all objects,
 * and saves the results to a JSON file.
 *
 * Usage:
 *   npx ts-node scripts/import-hyg-database.ts
 *   npx ts-node scripts/import-hyg-database.ts --limit 10000
 *   npx ts-node scripts/import-hyg-database.ts --output staging/custom-output.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);
import {
  parseHYGCSV,
  hygRowToAstronomicalObject,
  scoreAstronomicalObject,
  ScoredObject,
  getTierDistribution,
  getScoreStats,
} from '../lib/catalogImporter';

// ============================================
// CONSTANTS
// ============================================

// Official HYG database download URL (gzipped)
const HYG_DATABASE_URL = 'https://astronexus.com/downloads/catalogs/hygdata_v42.csv.gz';
const DEFAULT_OUTPUT_PATH = 'staging/hyg-scored.json';

// ============================================
// CLI ARGUMENT PARSING
// ============================================

interface CLIArgs {
  limit?: number;
  output: string;
  help: boolean;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    output: DEFAULT_OUTPUT_PATH,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
    } else if (arg === '--limit' || arg === '-l') {
      const value = args[++i];
      if (value && !isNaN(parseInt(value, 10))) {
        result.limit = parseInt(value, 10);
      } else {
        console.error('Error: --limit requires a numeric value');
        process.exit(1);
      }
    } else if (arg === '--output' || arg === '-o') {
      const value = args[++i];
      if (value) {
        result.output = value;
      } else {
        console.error('Error: --output requires a path value');
        process.exit(1);
      }
    } else if (arg.startsWith('--limit=')) {
      const value = arg.split('=')[1];
      if (value && !isNaN(parseInt(value, 10))) {
        result.limit = parseInt(value, 10);
      }
    } else if (arg.startsWith('--output=')) {
      const value = arg.split('=')[1];
      if (value) {
        result.output = value;
      }
    }
  }

  return result;
}

function printHelp(): void {
  console.log(`
HYG Database Import Script
==========================

Downloads and processes the HYG star database, scoring all objects
and saving results to a JSON file.

Usage:
  npx ts-node scripts/import-hyg-database.ts [options]

Options:
  --limit, -l <number>    Process only the first N rows
  --output, -o <path>     Custom output path (default: staging/hyg-scored.json)
  --help, -h              Show this help message

Examples:
  npx ts-node scripts/import-hyg-database.ts
  npx ts-node scripts/import-hyg-database.ts --limit 10000
  npx ts-node scripts/import-hyg-database.ts --limit 5000 --output staging/test-run.json
`);
}

// ============================================
// MAIN FUNCTIONS
// ============================================

async function downloadHYGDatabase(): Promise<string> {
  console.log('[1/4] Downloading HYG database...');
  console.log(`      URL: ${HYG_DATABASE_URL}`);

  const startTime = Date.now();

  const response = await fetch(HYG_DATABASE_URL);

  if (!response.ok) {
    throw new Error(`Failed to download HYG database: ${response.status} ${response.statusText}`);
  }

  // Get raw buffer (gzipped)
  const arrayBuffer = await response.arrayBuffer();
  const compressedBuffer = Buffer.from(arrayBuffer);
  const compressedSizeMB = (compressedBuffer.length / (1024 * 1024)).toFixed(2);

  console.log(`      Downloaded ${compressedSizeMB} MB (compressed)`);
  console.log('      Decompressing...');

  // Decompress gzip
  const decompressedBuffer = await gunzip(compressedBuffer);
  const csvData = decompressedBuffer.toString('utf-8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const sizeMB = (csvData.length / (1024 * 1024)).toFixed(2);

  console.log(`      Decompressed to ${sizeMB} MB in ${elapsed}s total`);

  return csvData;
}

function processCSVData(csvData: string, limit?: number): ScoredObject[] {
  console.log('[2/4] Parsing CSV data...');

  const startTime = Date.now();
  const rows = parseHYGCSV(csvData);
  const parseTime = Date.now() - startTime;

  console.log(`      Parsed ${rows.length.toLocaleString()} rows in ${parseTime}ms`);

  if (limit) {
    console.log(`      Limiting to first ${limit.toLocaleString()} rows`);
  }

  console.log('[3/4] Scoring objects...');

  const maxRows = limit ? Math.min(rows.length, limit) : rows.length;
  const scoredObjects: ScoredObject[] = [];
  const scoreStartTime = Date.now();

  // Progress tracking
  const progressInterval = Math.max(1, Math.floor(maxRows / 20)); // 5% increments
  let lastProgress = 0;

  for (let i = 0; i < maxRows; i++) {
    const row = rows[i];
    const obj = hygRowToAstronomicalObject(row);

    if (obj) {
      const scored = scoreAstronomicalObject(obj);
      scoredObjects.push(scored);
    }

    // Log progress
    const progress = Math.floor((i / maxRows) * 100);
    if (progress >= lastProgress + 5) {
      const elapsed = ((Date.now() - scoreStartTime) / 1000).toFixed(1);
      const rate = Math.round(i / (parseFloat(elapsed) || 1));
      console.log(`      Progress: ${progress}% (${i.toLocaleString()}/${maxRows.toLocaleString()}) - ${rate.toLocaleString()} objects/sec`);
      lastProgress = progress;
    }
  }

  const scoreTime = Date.now() - scoreStartTime;
  console.log(`      Scored ${scoredObjects.length.toLocaleString()} objects in ${(scoreTime / 1000).toFixed(1)}s`);

  return scoredObjects;
}

function saveResults(objects: ScoredObject[], outputPath: string): void {
  console.log('[4/4] Saving results...');

  // Resolve output path relative to script directory
  const scriptDir = path.dirname(__filename);
  const projectRoot = path.resolve(scriptDir, '..');
  const fullOutputPath = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(projectRoot, outputPath);

  // Ensure output directory exists
  const outputDir = path.dirname(fullOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`      Created directory: ${outputDir}`);
  }

  // Write JSON file
  const jsonData = JSON.stringify(objects, null, 2);
  fs.writeFileSync(fullOutputPath, jsonData, 'utf-8');

  const sizeMB = (jsonData.length / (1024 * 1024)).toFixed(2);
  console.log(`      Saved to: ${fullOutputPath}`);
  console.log(`      File size: ${sizeMB} MB`);
}

function printStatistics(objects: ScoredObject[]): void {
  console.log('\n========================================');
  console.log('RESULTS SUMMARY');
  console.log('========================================\n');

  // Tier distribution
  console.log('TIER DISTRIBUTION:');
  console.log('-'.repeat(40));

  const tierDist = getTierDistribution(objects);
  const totalObjects = objects.length;

  const tierOrder = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'] as const;

  for (const tier of tierOrder) {
    const count = tierDist[tier];
    const percent = ((count / totalObjects) * 100).toFixed(2);
    const bar = '#'.repeat(Math.round(parseFloat(percent) / 2));
    console.log(`  ${tier.padEnd(12)} ${count.toLocaleString().padStart(8)} (${percent.padStart(6)}%) ${bar}`);
  }

  console.log('-'.repeat(40));
  console.log(`  ${'TOTAL'.padEnd(12)} ${totalObjects.toLocaleString().padStart(8)}`);

  // Score statistics
  console.log('\nSCORE STATISTICS:');
  console.log('-'.repeat(40));

  const stats = getScoreStats(objects);

  console.log(`  Minimum:       ${stats.min}`);
  console.log(`  Maximum:       ${stats.max}`);
  console.log(`  Mean:          ${stats.mean}`);
  console.log(`  Median:        ${stats.median}`);
  console.log(`  Std Deviation: ${stats.stdDev}`);

  // Quality statistics
  console.log('\nQUALITY FLAGS:');
  console.log('-'.repeat(40));

  let hasProperName = 0;
  let hasSpectralType = 0;
  let hasDistanceData = 0;
  let hasLuminosityData = 0;
  let hasTemperatureData = 0;
  let lowConfidence = 0;

  for (const obj of objects) {
    if (obj.qualityFlags.hasProperName) hasProperName++;
    if (obj.qualityFlags.hasSpectralType) hasSpectralType++;
    if (obj.qualityFlags.hasDistanceData) hasDistanceData++;
    if (obj.qualityFlags.hasLuminosityData) hasLuminosityData++;
    if (obj.qualityFlags.hasTemperatureData) hasTemperatureData++;
    if (obj.lowConfidence) lowConfidence++;
  }

  const pct = (n: number) => ((n / totalObjects) * 100).toFixed(1);

  console.log(`  Has proper name:      ${hasProperName.toLocaleString().padStart(8)} (${pct(hasProperName).padStart(5)}%)`);
  console.log(`  Has spectral type:    ${hasSpectralType.toLocaleString().padStart(8)} (${pct(hasSpectralType).padStart(5)}%)`);
  console.log(`  Has distance data:    ${hasDistanceData.toLocaleString().padStart(8)} (${pct(hasDistanceData).padStart(5)}%)`);
  console.log(`  Has luminosity data:  ${hasLuminosityData.toLocaleString().padStart(8)} (${pct(hasLuminosityData).padStart(5)}%)`);
  console.log(`  Has temperature data: ${hasTemperatureData.toLocaleString().padStart(8)} (${pct(hasTemperatureData).padStart(5)}%)`);
  console.log(`  Low confidence:       ${lowConfidence.toLocaleString().padStart(8)} (${pct(lowConfidence).padStart(5)}%)`);

  // Top objects
  console.log('\nTOP 10 HIGHEST SCORING OBJECTS:');
  console.log('-'.repeat(60));

  const sortedByScore = [...objects].sort((a, b) => b.scores.multiplied - a.scores.multiplied);

  for (let i = 0; i < Math.min(10, sortedByScore.length); i++) {
    const obj = sortedByScore[i];
    const name = obj.name.length > 25 ? obj.name.substring(0, 22) + '...' : obj.name;
    console.log(
      `  ${(i + 1).toString().padStart(2)}. ${name.padEnd(25)} Score: ${obj.scores.multiplied.toString().padStart(3)} (${obj.badgeTier})`
    );
  }

  console.log('\n========================================');
  console.log('Import complete!');
  console.log('========================================\n');
}

// ============================================
// MAIN ENTRY POINT
// ============================================

async function main(): Promise<void> {
  const startTime = Date.now();

  console.log('\n========================================');
  console.log('HYG DATABASE IMPORT');
  console.log('========================================\n');

  // Parse CLI arguments
  const args = parseArgs();

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  console.log('Configuration:');
  console.log(`  Limit: ${args.limit ? args.limit.toLocaleString() : 'None (all rows)'}`);
  console.log(`  Output: ${args.output}`);
  console.log('');

  try {
    // Step 1: Download
    const csvData = await downloadHYGDatabase();

    // Step 2-3: Parse and score
    const scoredObjects = processCSVData(csvData, args.limit);

    // Step 4: Save
    saveResults(scoredObjects, args.output);

    // Print statistics
    printStatistics(scoredObjects);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Total execution time: ${totalTime}s\n`);
  } catch (error) {
    console.error('\nError:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the script
main();
