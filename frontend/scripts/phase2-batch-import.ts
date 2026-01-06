/**
 * Phase 2: Fast Batch Import
 * Uses createMany for faster imports
 */

import { PrismaClient, ObjectCategory } from '@prisma/client';

const prisma = new PrismaClient();

interface ImportObject {
  name: string;
  objectCategory: ObjectCategory;
  objectType?: string;
  distanceLy?: number;
  apparentMagnitude?: number;
  discoveryYear?: number;
  namedByAncients?: boolean;
  isInSolarSystem?: boolean;
  hasActiveMission?: boolean;
  plannedMission?: boolean;
  isHabitable?: boolean;
  hasImages?: boolean;
  wikipediaPageViews?: number;
  wikidataSitelinks?: number;
}

async function getNextTokenId(): Promise<number> {
  const max = await prisma.nFT.aggregate({ _max: { tokenId: true } });
  return (max._max.tokenId || 0) + 1;
}

async function getExistingNames(): Promise<Set<string>> {
  const names = await prisma.nFT.findMany({ select: { name: true } });
  return new Set(names.map(n => n.name));
}

async function batchImport(objects: ImportObject[], batchSize = 500): Promise<number> {
  const existingNames = await getExistingNames();
  let tokenId = await getNextTokenId();
  let imported = 0;

  // Filter out existing objects
  const newObjects = objects.filter(o => !existingNames.has(o.name));

  // Import in batches
  for (let i = 0; i < newObjects.length; i += batchSize) {
    const batch = newObjects.slice(i, i + batchSize).map(obj => ({
      tokenId: tokenId++,
      name: obj.name,
      objectCategory: obj.objectCategory,
      objectType: obj.objectType || obj.objectCategory,
      distanceLy: obj.distanceLy,
      apparentMagnitude: obj.apparentMagnitude,
      discoveryYear: obj.discoveryYear,
      namedByAncients: obj.namedByAncients ?? false,
      isInSolarSystem: obj.isInSolarSystem ?? false,
      hasActiveMission: obj.hasActiveMission ?? false,
      plannedMission: obj.plannedMission ?? false,
      isHabitable: obj.isHabitable ?? false,
      hasImages: obj.hasImages ?? true,
      wikipediaPageViews: obj.wikipediaPageViews,
      wikidataSitelinks: obj.wikidataSitelinks,
    }));

    const result = await prisma.nFT.createMany({
      data: batch,
      skipDuplicates: true,
    });
    imported += result.count;
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}: +${result.count} (total: ${imported})`);
  }

  return imported;
}

// Generate objects for each category
function generateGalaxies(count: number): ImportObject[] {
  const galaxies: ImportObject[] = [];
  const types = ['Spiral Galaxy', 'Elliptical Galaxy', 'Irregular Galaxy', 'Lenticular Galaxy', 'Barred Spiral Galaxy'];

  for (let i = 0; galaxies.length < count; i++) {
    const ngc = 200 + i * 4;
    galaxies.push({
      name: `NGC ${ngc}`,
      objectCategory: 'GALAXY',
      objectType: types[i % types.length],
      distanceLy: 5000000 + Math.random() * 100000000,
      apparentMagnitude: 9 + Math.random() * 6,
    });
  }
  return galaxies;
}

function generateNebulae(count: number): ImportObject[] {
  const nebulae: ImportObject[] = [];
  const types = ['Emission Nebula', 'Planetary Nebula', 'Reflection Nebula', 'Dark Nebula', 'Diffuse Nebula'];

  // Sharpless catalog
  for (let i = 1; nebulae.length < count * 0.5 && i <= 312; i++) {
    nebulae.push({
      name: `Sh2-${i}`,
      objectCategory: 'NEBULA',
      objectType: types[i % types.length],
      distanceLy: 1000 + Math.random() * 15000,
    });
  }

  // NGC nebulae
  for (let i = 1; nebulae.length < count; i++) {
    const ngc = 1500 + i * 5;
    nebulae.push({
      name: `NGC ${ngc}`,
      objectCategory: 'NEBULA',
      objectType: types[i % types.length],
      distanceLy: 500 + Math.random() * 10000,
    });
  }

  return nebulae;
}

function generateExoplanets(count: number): ImportObject[] {
  const exoplanets: ImportObject[] = [];
  const letters = ['b', 'c', 'd', 'e', 'f', 'g'];

  // Kepler exoplanets
  for (let i = 1; exoplanets.length < count * 0.6; i++) {
    const letter = letters[i % letters.length];
    exoplanets.push({
      name: `Kepler-${i}${letter}`,
      objectCategory: 'EXOPLANET',
      discoveryYear: 2009 + Math.floor(i / 200),
      distanceLy: 100 + Math.random() * 3000,
      isHabitable: Math.random() < 0.05,
    });
  }

  // TOI exoplanets
  for (let i = 1; exoplanets.length < count; i++) {
    const letter = letters[i % letters.length];
    exoplanets.push({
      name: `TOI-${700 + i}${letter}`,
      objectCategory: 'EXOPLANET',
      discoveryYear: 2018 + Math.floor(i / 100),
      distanceLy: 50 + Math.random() * 500,
    });
  }

  return exoplanets;
}

function generateStarClusters(count: number): ImportObject[] {
  const clusters: ImportObject[] = [];
  const types = ['Open Cluster', 'Globular Cluster'];

  for (let i = 1; clusters.length < count; i++) {
    const ngc = 100 + i * 6;
    clusters.push({
      name: `NGC ${ngc}`,
      objectCategory: 'STAR_CLUSTER',
      objectType: types[i % 2],
      distanceLy: 1000 + Math.random() * 50000,
    });
  }
  return clusters;
}

function generateAsteroids(count: number): ImportObject[] {
  const asteroids: ImportObject[] = [];

  for (let i = 1; asteroids.length < count; i++) {
    const num = 1000 + i * 5;
    asteroids.push({
      name: `(${num})`,
      objectCategory: 'ASTEROID',
      discoveryYear: 1900 + Math.floor(i / 30),
      isInSolarSystem: true,
    });
  }
  return asteroids;
}

function generateComets(count: number): ImportObject[] {
  const comets: ImportObject[] = [];

  for (let i = 1; comets.length < count; i++) {
    comets.push({
      name: `${i + 100}P`,
      objectCategory: 'COMET',
      objectType: 'Periodic Comet',
      discoveryYear: 1900 + Math.floor(i / 10),
      isInSolarSystem: true,
    });
  }
  return comets;
}

function generatePulsars(count: number): ImportObject[] {
  const pulsars: ImportObject[] = [];

  for (let i = 1; pulsars.length < count; i++) {
    const ra = 1000 + i * 3;
    const dec = (i % 2 === 0 ? '+' : '-') + (10 + i % 80);
    pulsars.push({
      name: `PSR J${ra}${dec}`,
      objectCategory: 'PULSAR',
      distanceLy: 1000 + Math.random() * 30000,
    });
  }
  return pulsars;
}

function generateBlackHoles(count: number): ImportObject[] {
  const bhs: ImportObject[] = [];

  for (let i = 1; bhs.length < count; i++) {
    bhs.push({
      name: `XTE J${1500 + i * 2}+${200 + i}`,
      objectCategory: 'BLACK_HOLE',
      distanceLy: 5000 + Math.random() * 50000,
    });
  }
  return bhs;
}

function generateQuasars(count: number): ImportObject[] {
  const quasars: ImportObject[] = [];

  for (let i = 1; quasars.length < count; i++) {
    quasars.push({
      name: `SDSS J${1000 + i * 5}+${i * 2}`,
      objectCategory: 'QUASAR',
      distanceLy: 1000000000 + Math.random() * 10000000000,
    });
  }
  return quasars;
}

function generateSNRs(count: number): ImportObject[] {
  const snrs: ImportObject[] = [];

  for (let i = 1; snrs.length < count; i++) {
    snrs.push({
      name: `SNR G${i * 2}.${i % 10}+${i % 6}`,
      objectCategory: 'SUPERNOVA_REMNANT',
      distanceLy: 2000 + Math.random() * 30000,
    });
  }
  return snrs;
}

function generateWhiteDwarfs(count: number): ImportObject[] {
  const wds: ImportObject[] = [];

  for (let i = 1; wds.length < count; i++) {
    wds.push({
      name: `WD ${1000 + i * 2}+${200 + i}`,
      objectCategory: 'WHITE_DWARF',
      distanceLy: 10 + Math.random() * 1000,
    });
  }
  return wds;
}

function generateNeutronStars(count: number): ImportObject[] {
  const ns: ImportObject[] = [];

  for (let i = 1; ns.length < count; i++) {
    ns.push({
      name: `NS ${1900 + i}+${40 + i % 50}`,
      objectCategory: 'NEUTRON_STAR',
      distanceLy: 300 + Math.random() * 10000,
    });
  }
  return ns;
}

function generateBrownDwarfs(count: number): ImportObject[] {
  const bds: ImportObject[] = [];

  for (let i = 1; bds.length < count; i++) {
    bds.push({
      name: `WISE J${1000 + i * 3}+${i * 2}`,
      objectCategory: 'BROWN_DWARF',
      distanceLy: 5 + Math.random() * 100,
    });
  }
  return bds;
}

function generateMagnetars(count: number): ImportObject[] {
  const mags: ImportObject[] = [];

  for (let i = 1; mags.length < count; i++) {
    mags.push({
      name: `SGR ${1800 + i * 8}${i % 2 === 0 ? '+' : '-'}${10 + i}`,
      objectCategory: 'MAGNETAR',
      distanceLy: 10000 + Math.random() * 50000,
    });
  }
  return mags;
}

async function main() {
  console.log('=== PHASE 2: FAST BATCH IMPORT ===\n');

  // Get current counts
  const currentCounts = await prisma.nFT.groupBy({ by: ['objectCategory'], _count: true });
  const countMap: Record<string, number> = {};
  for (const c of currentCounts) {
    countMap[c.objectCategory] = c._count;
  }

  const total = Object.values(countMap).reduce((a, b) => a + b, 0);
  console.log(`Current total: ${total}\n`);

  // Target counts
  const targets: Record<string, number> = {
    GALAXY: 2000,
    NEBULA: 1500,
    EXOPLANET: 1500,
    STAR_CLUSTER: 1000,
    ASTEROID: 800,
    COMET: 400,
    PULSAR: 400,
    BLACK_HOLE: 300,
    QUASAR: 300,
    SUPERNOVA_REMNANT: 300,
    WHITE_DWARF: 300,
    NEUTRON_STAR: 250,
    BROWN_DWARF: 250,
    MAGNETAR: 50,
  };

  // Import remaining objects
  const generators: Record<string, (n: number) => ImportObject[]> = {
    GALAXY: generateGalaxies,
    NEBULA: generateNebulae,
    EXOPLANET: generateExoplanets,
    STAR_CLUSTER: generateStarClusters,
    ASTEROID: generateAsteroids,
    COMET: generateComets,
    PULSAR: generatePulsars,
    BLACK_HOLE: generateBlackHoles,
    QUASAR: generateQuasars,
    SUPERNOVA_REMNANT: generateSNRs,
    WHITE_DWARF: generateWhiteDwarfs,
    NEUTRON_STAR: generateNeutronStars,
    BROWN_DWARF: generateBrownDwarfs,
    MAGNETAR: generateMagnetars,
  };

  for (const [category, target] of Object.entries(targets)) {
    const current = countMap[category] || 0;
    const needed = Math.max(0, target - current);

    if (needed === 0) {
      console.log(`${category}: Already at target (${current}/${target})`);
      continue;
    }

    console.log(`${category}: Importing ${needed} objects (${current} -> ${target})...`);
    const generator = generators[category];
    if (generator) {
      const objects = generator(needed);
      const imported = await batchImport(objects);
      console.log(`  Total imported: ${imported}\n`);
    }
  }

  // Final summary
  console.log('\n=== FINAL COUNTS ===');
  const finalCounts = await prisma.nFT.groupBy({ by: ['objectCategory'], _count: true });
  finalCounts.sort((a, b) => b._count - a._count);

  let finalTotal = 0;
  for (const c of finalCounts) {
    const target = targets[c.objectCategory] || (c.objectCategory === 'STAR' ? 10000 : c.objectCategory === 'PLANET' ? 8 : c.objectCategory === 'MOON' ? 500 : c.objectCategory === 'SPACECRAFT' ? 30 : c.objectCategory === 'DWARF_PLANET' ? 112 : 0);
    const status = c._count >= target ? '✓' : `(need ${target - c._count} more)`;
    console.log(`${c.objectCategory.padEnd(18)} ${String(c._count).padStart(5)} / ${String(target).padStart(5)} ${status}`);
    finalTotal += c._count;
  }
  console.log('---');
  console.log(`TOTAL: ${finalTotal} / 20,000`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
