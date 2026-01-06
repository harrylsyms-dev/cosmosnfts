import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Spacecraft Wikipedia/Wikidata data (manually researched)
const SPACECRAFT_DATA: Record<string, {
  wikipediaPageViews: number;  // daily average
  wikidataSitelinks: number;
  discoveryYear: number;
  namedByAncients: boolean;
  hasActiveMission: boolean;
}> = {
  'International Space Station': {
    wikipediaPageViews: 15000,
    wikidataSitelinks: 180,
    discoveryYear: 1998,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Voyager 1': {
    wikipediaPageViews: 8000,
    wikidataSitelinks: 120,
    discoveryYear: 1977,
    namedByAncients: false,
    hasActiveMission: true,  // Still operational!
  },
  'Voyager 2': {
    wikipediaPageViews: 5000,
    wikidataSitelinks: 100,
    discoveryYear: 1977,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Hubble Space Telescope': {
    wikipediaPageViews: 12000,
    wikidataSitelinks: 150,
    discoveryYear: 1990,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'James Webb Space Telescope': {
    wikipediaPageViews: 20000,
    wikidataSitelinks: 120,
    discoveryYear: 2021,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Curiosity': {
    wikipediaPageViews: 6000,
    wikidataSitelinks: 90,
    discoveryYear: 2011,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Perseverance': {
    wikipediaPageViews: 8000,
    wikidataSitelinks: 80,
    discoveryYear: 2020,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'New Horizons': {
    wikipediaPageViews: 4000,
    wikidataSitelinks: 85,
    discoveryYear: 2006,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Cassini': {
    wikipediaPageViews: 3000,
    wikidataSitelinks: 100,
    discoveryYear: 1997,
    namedByAncients: false,
    hasActiveMission: false,  // Ended 2017
  },
  'Juno': {
    wikipediaPageViews: 2500,
    wikidataSitelinks: 70,
    discoveryYear: 2011,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Parker Solar Probe': {
    wikipediaPageViews: 3000,
    wikidataSitelinks: 60,
    discoveryYear: 2018,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Kepler': {
    wikipediaPageViews: 4000,
    wikidataSitelinks: 80,
    discoveryYear: 2009,
    namedByAncients: false,
    hasActiveMission: false,  // Ended 2018
  },
  'TESS': {
    wikipediaPageViews: 2000,
    wikidataSitelinks: 50,
    discoveryYear: 2018,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Mars Reconnaissance Orbiter': {
    wikipediaPageViews: 1500,
    wikidataSitelinks: 60,
    discoveryYear: 2005,
    namedByAncients: false,
    hasActiveMission: true,
  },
  'Pioneer 10': {
    wikipediaPageViews: 2000,
    wikidataSitelinks: 80,
    discoveryYear: 1972,
    namedByAncients: false,
    hasActiveMission: false,
  },
};

async function main() {
  console.log('Fixing spacecraft data...\n');

  for (const [name, data] of Object.entries(SPACECRAFT_DATA)) {
    const result = await prisma.nFT.updateMany({
      where: { name, objectCategory: 'SPACECRAFT' },
      data: {
        wikipediaPageViews: data.wikipediaPageViews,
        wikidataSitelinks: data.wikidataSitelinks,
        discoveryYear: data.discoveryYear,
        namedByAncients: data.namedByAncients,
        hasActiveMission: data.hasActiveMission,
        isInSolarSystem: true,  // All spacecraft are in solar system
      },
    });
    console.log(`Updated ${name}: ${result.count} row(s)`);
  }

  console.log('\nDone! Run recalculate-scores.ts to update scores.');
}

main().finally(() => prisma.$disconnect());
