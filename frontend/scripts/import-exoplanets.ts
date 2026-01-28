/**
 * Import Exoplanets from NASA Exoplanet Archive
 *
 * Downloads confirmed exoplanets from NASA's Exoplanet Archive TAP service,
 * scores them, and adds them to the database while removing excess stars.
 *
 * Usage:
 *   npx tsx scripts/import-exoplanets.ts
 *   npx tsx scripts/import-exoplanets.ts --limit 5000
 *   npx tsx scripts/import-exoplanets.ts --dry-run
 */

import { PrismaClient, BadgeTier } from '@prisma/client';

const prisma = new PrismaClient();

// NASA Exoplanet Archive TAP endpoint
const NASA_EXOPLANET_URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

interface ExoplanetData {
  pl_name: string;           // Planet name
  hostname: string;          // Host star name
  discoverymethod: string;   // Discovery method
  disc_year: number;         // Discovery year
  pl_orbper: number;         // Orbital period (days)
  pl_rade: number;           // Planet radius (Earth radii)
  pl_bmasse: number;         // Planet mass (Earth masses)
  pl_eqt: number;            // Equilibrium temperature (K)
  st_dist: number;           // Distance (parsecs)
  st_teff: number;           // Star temperature (K)
  st_rad: number;            // Star radius (solar)
  pl_insol: number;          // Insolation flux (Earth flux)
  sy_snum: number;           // Number of stars in system
  sy_pnum: number;           // Number of planets in system
  disc_facility: string;     // Discovery facility
  pl_controv_flag: number;   // Controversial flag
}

// Target tier distribution (same as original catalog)
const TIER_DISTRIBUTION = {
  LEGENDARY: 0.01,    // 1%
  ELITE: 0.03,        // 3%
  PREMIUM: 0.06,      // 6%
  EXCEPTIONAL: 0.15,  // 15%
  STANDARD: 0.75,     // 75%
};

const TARGET_TOTAL_NFTS = 20000;

interface CLIOptions {
  exoplanetCount: number;
  dryRun: boolean;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    exoplanetCount: 6000,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '--count' || arg === '--exoplanets') && args[i + 1]) {
      options.exoplanetCount = parseInt(args[++i], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--help') {
      console.log(`
Import Exoplanets from NASA Exoplanet Archive

Usage:
  npx tsx scripts/import-exoplanets.ts [options]

Options:
  --count <n>           Number of exoplanets to import (default: 6000)
  --dry-run             Preview without making changes
  --help                Show this help

Note: Total NFTs will remain at ${TARGET_TOTAL_NFTS}. Stars will be removed to make room.
Tier distribution follows: 1% LEGENDARY, 3% ELITE, 6% PREMIUM, 15% EXCEPTIONAL, 75% STANDARD
      `);
      process.exit(0);
    }
  }

  return options;
}

async function fetchExoplanets(limit: number): Promise<ExoplanetData[]> {
  console.log(`\nFetching up to ${limit} exoplanets from NASA Exoplanet Archive...`);

  // Use the Planetary Systems Composite table with correct column names
  const columns = [
    'pl_name', 'hostname', 'discoverymethod', 'disc_year', 'pl_orbper',
    'pl_rade', 'pl_bmasse', 'pl_eqt', 'sy_dist', 'st_teff', 'st_rad',
    'pl_insol', 'sy_snum', 'sy_pnum', 'disc_facility'
  ].join(',');

  // Query the pscomppars table (Planetary Systems Composite Parameters)
  const url = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+${columns}+from+pscomppars&format=json`;

  console.log('  Querying NASA API...');
  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    console.error('API Response:', text.substring(0, 500));
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`  Fetched ${data.length} total exoplanets`);

  // Map sy_dist to st_dist for compatibility
  const mapped = data.map((p: any) => ({
    ...p,
    st_dist: p.sy_dist,
  }));

  return mapped.slice(0, limit);
}

function classifyPlanetType(planet: ExoplanetData): string {
  const radius = planet.pl_rade;
  const mass = planet.pl_bmasse;
  const temp = planet.pl_eqt;
  const insol = planet.pl_insol;

  // Hot Jupiter
  if (radius > 6 && temp > 1000) {
    return 'Hot Jupiter';
  }

  // Gas Giant
  if (radius > 6 || mass > 50) {
    return 'Gas Giant';
  }

  // Mini-Neptune / Sub-Neptune
  if (radius > 2 && radius <= 6) {
    return 'Mini-Neptune';
  }

  // Super-Earth
  if (radius > 1.25 && radius <= 2) {
    return 'Super-Earth';
  }

  // Lava world (very hot rocky)
  if (radius <= 2 && temp > 1500) {
    return 'Lava World';
  }

  // Ice giant
  if (radius > 3 && radius <= 6 && temp < 200) {
    return 'Ice Giant';
  }

  // Rocky
  return 'Rocky';
}

function isInHabitableZone(planet: ExoplanetData): boolean {
  const insol = planet.pl_insol;
  // Habitable zone roughly 0.25 to 2.0 Earth insolation
  return insol >= 0.25 && insol <= 2.0;
}

function generateDescription(planet: ExoplanetData): string {
  const type = classifyPlanetType(planet);
  const distance = planet.st_dist ? Math.round(planet.st_dist * 3.262) : null; // parsecs to ly
  const habitable = isInHabitableZone(planet);
  const year = planet.disc_year;
  const method = planet.discoverymethod;
  const numPlanets = planet.sy_pnum;

  let desc = '';

  if (type === 'Hot Jupiter') {
    desc = `A scorching gas giant orbiting extremely close to its star. `;
  } else if (type === 'Gas Giant') {
    desc = `A massive gas giant world. `;
  } else if (type === 'Mini-Neptune') {
    desc = `A sub-Neptune world with a thick atmosphere. `;
  } else if (type === 'Super-Earth') {
    desc = `A rocky super-Earth larger than our planet. `;
  } else if (type === 'Lava World') {
    desc = `A hellish lava world with molten rock surface. `;
  } else if (type === 'Ice Giant') {
    desc = `A cold ice giant in the outer reaches of its system. `;
  } else {
    desc = `A rocky exoplanet. `;
  }

  if (habitable) {
    desc += `Located in the habitable zone where liquid water could exist. `;
  }

  if (distance) {
    desc += `Located ${distance.toLocaleString()} light-years away. `;
  }

  if (numPlanets > 1) {
    desc += `Part of a ${numPlanets}-planet system. `;
  }

  desc += `Discovered in ${year} via ${method.toLowerCase()}.`;

  return desc.trim();
}

function generateVisualFeatures(planet: ExoplanetData): string[] {
  const type = classifyPlanetType(planet);
  const features: string[] = [];

  // Base features by type
  if (type === 'Hot Jupiter') {
    features.push('Swirling storm bands', 'Glowing atmosphere', 'Tidally locked face');
  } else if (type === 'Gas Giant') {
    features.push('Banded cloud layers', 'Giant storm systems', 'Multiple moons possible');
  } else if (type === 'Mini-Neptune') {
    features.push('Thick hazy atmosphere', 'Blue-green coloration', 'Deep cloud layers');
  } else if (type === 'Super-Earth') {
    features.push('Rocky terrain', 'Possible plate tectonics', 'Thick atmosphere possible');
  } else if (type === 'Lava World') {
    features.push('Molten lava oceans', 'Glowing surface', 'Volcanic activity');
  } else if (type === 'Ice Giant') {
    features.push('Icy blue atmosphere', 'Extreme cold', 'Methane clouds');
  } else {
    features.push('Rocky surface', 'Possible craters', 'Barren landscape');
  }

  // Add features based on star type
  if (planet.st_teff < 4000) {
    features.push('Red dwarf illumination', 'Dim red sky');
  } else if (planet.st_teff > 6500) {
    features.push('Bright white-blue starlight', 'Intense radiation');
  }

  // Habitable zone features
  if (isInHabitableZone(planet)) {
    features.push('Temperate conditions', 'Possible liquid water');
  }

  // Multi-planet system
  if (planet.sy_pnum > 1) {
    features.push('Sibling planets visible in sky');
  }

  // Binary star system
  if (planet.sy_snum > 1) {
    features.push('Multiple suns in sky', 'Complex day/night cycle');
  }

  return features;
}

function scoreExoplanet(planet: ExoplanetData): number {
  let score = 0;

  // Distance score (closer = better, max 30)
  const distLy = planet.st_dist ? planet.st_dist * 3.262 : 10000;
  if (distLy < 20) score += 30;
  else if (distLy < 50) score += 25;
  else if (distLy < 100) score += 20;
  else if (distLy < 500) score += 15;
  else if (distLy < 1000) score += 10;
  else score += 5;

  // Habitability score (max 40)
  if (isInHabitableZone(planet)) {
    score += 40;
  } else {
    const insol = planet.pl_insol || 1;
    if (insol >= 0.1 && insol <= 5) score += 20;
    else score += 5;
  }

  // Size/type score (Earth-like = better, max 30)
  const type = classifyPlanetType(planet);
  if (type === 'Super-Earth' || type === 'Rocky') score += 30;
  else if (type === 'Mini-Neptune') score += 20;
  else if (type === 'Gas Giant') score += 15;
  else if (type === 'Hot Jupiter') score += 10;
  else score += 10;

  // Discovery recency (newer = more interesting, max 20)
  const age = 2024 - (planet.disc_year || 2000);
  if (age <= 2) score += 20;
  else if (age <= 5) score += 15;
  else if (age <= 10) score += 10;
  else score += 5;

  // Multi-planet system bonus (max 15)
  if (planet.sy_pnum >= 7) score += 15;
  else if (planet.sy_pnum >= 5) score += 12;
  else if (planet.sy_pnum >= 3) score += 8;
  else if (planet.sy_pnum >= 2) score += 5;

  // Famous discovery method bonus (max 10)
  if (planet.disc_facility?.includes('JWST')) score += 10;
  else if (planet.disc_facility?.includes('TESS')) score += 8;
  else if (planet.disc_facility?.includes('Kepler')) score += 7;

  // Binary/multiple star bonus (max 10)
  if (planet.sy_snum > 1) score += 10;

  return Math.min(score, 155); // Cap at reasonable max
}

// Assign tiers based on percentile ranking within the exoplanet set
function assignTiersByPercentile(planets: Array<{ planet: ExoplanetData; score: number }>): Array<{ planet: ExoplanetData; score: number; tier: BadgeTier }> {
  // Sort by score descending
  const sorted = [...planets].sort((a, b) => b.score - a.score);
  const total = sorted.length;

  // Calculate tier boundaries
  const legendaryCount = Math.round(total * TIER_DISTRIBUTION.LEGENDARY);
  const eliteCount = Math.round(total * TIER_DISTRIBUTION.ELITE);
  const premiumCount = Math.round(total * TIER_DISTRIBUTION.PREMIUM);
  const exceptionalCount = Math.round(total * TIER_DISTRIBUTION.EXCEPTIONAL);

  return sorted.map((item, index) => {
    let tier: BadgeTier;
    if (index < legendaryCount) {
      tier = 'LEGENDARY';
    } else if (index < legendaryCount + eliteCount) {
      tier = 'ELITE';
    } else if (index < legendaryCount + eliteCount + premiumCount) {
      tier = 'PREMIUM';
    } else if (index < legendaryCount + eliteCount + premiumCount + exceptionalCount) {
      tier = 'EXCEPTIONAL';
    } else {
      tier = 'STANDARD';
    }
    return { ...item, tier };
  });
}

function generateImagePrompt(planet: ExoplanetData): string {
  const type = classifyPlanetType(planet);
  const features = generateVisualFeatures(planet);
  const habitable = isInHabitableZone(planet);

  let prompt = `Photorealistic space art of exoplanet ${planet.pl_name}, `;

  // Type-specific base
  if (type === 'Hot Jupiter') {
    prompt += 'a scorching gas giant with swirling orange and red storm bands, glowing atmosphere heated by nearby star, ';
  } else if (type === 'Gas Giant') {
    prompt += 'a massive gas giant with banded clouds in browns and tans, giant storm systems, ';
  } else if (type === 'Mini-Neptune') {
    prompt += 'a blue-green sub-Neptune world with thick hazy atmosphere, wispy clouds, ';
  } else if (type === 'Super-Earth') {
    prompt += 'a rocky super-Earth with rugged terrain, possible oceans and clouds, ';
  } else if (type === 'Lava World') {
    prompt += 'a hellish lava world with glowing magma oceans, volcanic eruptions, red-hot surface, ';
  } else if (type === 'Ice Giant') {
    prompt += 'an icy blue giant planet with methane atmosphere, cold distant world, ';
  } else {
    prompt += 'a rocky alien world with cratered surface, ';
  }

  // Star type lighting
  if (planet.st_teff < 4000) {
    prompt += 'illuminated by dim red dwarf star casting crimson light, ';
  } else if (planet.st_teff > 7000) {
    prompt += 'bathed in brilliant blue-white starlight, ';
  } else {
    prompt += 'lit by Sun-like yellow star, ';
  }

  // Habitable zone
  if (habitable) {
    prompt += 'temperate world in habitable zone, possible liquid water, ';
  }

  // Multi-star
  if (planet.sy_snum > 1) {
    prompt += `${planet.sy_snum} suns visible in alien sky, `;
  }

  prompt += 'deep space background with stars, NASA scientific visualization style, highly detailed, cinematic lighting';

  return prompt;
}

async function main() {
  const options = parseArgs();

  console.log('='.repeat(60));
  console.log('     EXOPLANET IMPORT FROM NASA ARCHIVE');
  console.log('='.repeat(60));
  console.log(`\nTarget: ${TARGET_TOTAL_NFTS} total NFTs`);
  console.log(`Exoplanets to add: ${options.exoplanetCount}`);
  console.log(`Dry run: ${options.dryRun}`);
  console.log(`\nTier distribution: 1% LEGENDARY, 3% ELITE, 6% PREMIUM, 15% EXCEPTIONAL, 75% STANDARD`);

  try {
    // Step 1: Get current database stats
    const currentStats = await prisma.nFT.groupBy({
      by: ['objectType'],
      _count: true,
    });

    console.log('\nCurrent database by type:');
    let totalCurrent = 0;
    for (const stat of currentStats.sort((a, b) => b._count - a._count)) {
      console.log(`  ${(stat.objectType || 'Unknown').padEnd(20)} ${stat._count}`);
      totalCurrent += stat._count;
    }
    console.log(`  ${'TOTAL'.padEnd(20)} ${totalCurrent}`);

    const currentStars = currentStats.find(s => s.objectType === 'Star')?._count || 0;
    const currentExoplanets = currentStats.find(s => s.objectType === 'Exoplanet')?._count || 0;
    const otherObjects = totalCurrent - currentStars - currentExoplanets;

    // Calculate how many stars to keep
    const starsToKeep = TARGET_TOTAL_NFTS - options.exoplanetCount - otherObjects;
    const starsToDelete = currentStars - starsToKeep;

    console.log(`\nPlan:`);
    console.log(`  Current stars: ${currentStars}`);
    console.log(`  Stars to keep: ${starsToKeep}`);
    console.log(`  Stars to delete: ${starsToDelete}`);
    console.log(`  Current exoplanets: ${currentExoplanets}`);
    console.log(`  Exoplanets to delete: ${currentExoplanets} (replacing all)`);
    console.log(`  New exoplanets to add: ${options.exoplanetCount}`);
    console.log(`  Other objects (unchanged): ${otherObjects}`);
    console.log(`  Final total: ${starsToKeep + options.exoplanetCount + otherObjects}`);

    if (starsToKeep < 0) {
      console.error(`\nError: Cannot add ${options.exoplanetCount} exoplanets. Max allowed: ${TARGET_TOTAL_NFTS - otherObjects}`);
      process.exit(1);
    }

    // Step 2: Fetch exoplanets from NASA
    const exoplanets = await fetchExoplanets(options.exoplanetCount);
    console.log(`\nFetched ${exoplanets.length} exoplanets from NASA`);

    // Step 3: Score all exoplanets
    console.log('Scoring exoplanets...');
    const scoredPlanets = exoplanets.map(planet => ({
      planet,
      score: scoreExoplanet(planet),
    }));

    // Step 4: Assign tiers by percentile
    const tieredPlanets = assignTiersByPercentile(scoredPlanets);

    // Count tiers
    const tierCounts: Record<string, number> = {
      LEGENDARY: 0, ELITE: 0, PREMIUM: 0, EXCEPTIONAL: 0, STANDARD: 0
    };
    for (const p of tieredPlanets) {
      tierCounts[p.tier]++;
    }

    console.log('\nExoplanet tier distribution (percentile-based):');
    for (const [tier, count] of Object.entries(tierCounts)) {
      const pct = ((count / tieredPlanets.length) * 100).toFixed(1);
      console.log(`  ${tier.padEnd(12)} ${count.toString().padStart(5)} (${pct}%)`);
    }

    // Show top exoplanets
    console.log('\nTop 10 exoplanets (LEGENDARY tier):');
    for (const p of tieredPlanets.filter(t => t.tier === 'LEGENDARY').slice(0, 10)) {
      const habitable = isInHabitableZone(p.planet) ? ' [HABITABLE ZONE]' : '';
      const dist = p.planet.st_dist ? `${Math.round(p.planet.st_dist * 3.262)} ly` : 'unknown';
      console.log(`  ${p.planet.pl_name.padEnd(25)} Score: ${p.score.toString().padStart(3)} - ${dist}${habitable}`);
    }

    if (options.dryRun) {
      console.log('\n*** DRY RUN - No changes made ***');
      return;
    }

    // Step 5: Delete old exoplanets
    if (currentExoplanets > 0) {
      console.log(`\nDeleting ${currentExoplanets} existing exoplanets...`);
      await prisma.nFT.deleteMany({
        where: { objectType: 'Exoplanet' },
      });
    }

    // Step 6: Delete excess stars (lowest scoring first)
    if (starsToDelete > 0) {
      console.log(`Deleting ${starsToDelete} lowest-scoring stars...`);

      const starsToRemove = await prisma.nFT.findMany({
        where: { objectType: 'Star' },
        orderBy: { totalScore: 'asc' },
        take: starsToDelete,
        select: { id: true },
      });

      await prisma.nFT.deleteMany({
        where: { id: { in: starsToRemove.map(s => s.id) } },
      });

      console.log(`  Deleted ${starsToRemove.length} stars`);
    }

    // Step 7: Get next token ID
    const lastNFT = await prisma.nFT.findFirst({
      orderBy: { tokenId: 'desc' },
      select: { tokenId: true },
    });
    let nextTokenId = (lastNFT?.tokenId || 0) + 1;

    // Step 8: Create exoplanet NFTs in batches
    console.log(`\nCreating ${tieredPlanets.length} exoplanet NFTs...`);

    const batchSize = 100;
    let created = 0;

    for (let i = 0; i < tieredPlanets.length; i += batchSize) {
      const batch = tieredPlanets.slice(i, i + batchSize);

      const nftData = batch.map(({ planet, score, tier }) => {
        const distLy = planet.st_dist ? Math.round(planet.st_dist * 3.262) : null;

        return {
          tokenId: nextTokenId++,
          name: planet.pl_name,
          description: generateDescription(planet),
          objectType: 'Exoplanet',
          totalScore: score,
          badgeTier: tier,
          distanceLy: distLy,
          temperatureK: planet.pl_eqt || null,
          discoveryYear: planet.disc_year || null,
          constellation: null,
          imagePrompt: generateImagePrompt(planet),
          imageNegativePrompt: 'cartoon, anime, drawing, sketch, blurry, low quality, text, watermark',
          status: 'AVAILABLE',
        };
      });

      await prisma.nFT.createMany({
        data: nftData,
        skipDuplicates: true,
      });

      created += batch.length;
      const pct = Math.round((created / tieredPlanets.length) * 100);
      process.stdout.write(`\r  Progress: ${created}/${tieredPlanets.length} (${pct}%)`);
    }

    console.log('\n');

    // Step 9: Print results
    console.log('='.repeat(60));
    console.log('IMPORT COMPLETE');
    console.log('='.repeat(60));

    // Final stats
    const finalStats = await prisma.nFT.groupBy({
      by: ['objectType'],
      _count: true,
    });

    console.log('\nFinal database by type:');
    let finalTotal = 0;
    for (const stat of finalStats.sort((a, b) => b._count - a._count)) {
      console.log(`  ${(stat.objectType || 'Unknown').padEnd(20)} ${stat._count}`);
      finalTotal += stat._count;
    }
    console.log(`  ${'TOTAL'.padEnd(20)} ${finalTotal}`);

    // Final tier distribution
    const finalTiers = await prisma.nFT.groupBy({
      by: ['badgeTier'],
      _count: true,
    });

    console.log('\nFinal tier distribution:');
    for (const tier of finalTiers.sort((a, b) => {
      const order = ['LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];
      return order.indexOf(a.badgeTier) - order.indexOf(b.badgeTier);
    })) {
      const pct = ((tier._count / finalTotal) * 100).toFixed(1);
      console.log(`  ${tier.badgeTier.padEnd(12)} ${tier._count.toString().padStart(5)} (${pct}%)`);
    }

  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
