import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../../lib/adminAuth';
import { prisma } from '../../../../lib/prisma';

// Known scientific data for famous celestial objects
const KNOWN_OBJECTS: Record<string, {
  distanceLy?: number;
  massSolar?: number;
  ageYears?: number;
  luminosity?: number;
  sizeKm?: number;
  temperatureK?: number;
  discoveryYear?: number;
  paperCount?: number;
}> = {
  // Stars
  'Sun': { distanceLy: 0.0000158, massSolar: 1, ageYears: 4.6e9, luminosity: 1, sizeKm: 696340, temperatureK: 5778, discoveryYear: -3000, paperCount: 50000 },
  'Proxima Centauri': { distanceLy: 4.24, massSolar: 0.12, ageYears: 4.85e9, luminosity: 0.0017, sizeKm: 107280, temperatureK: 3042, discoveryYear: 1915, paperCount: 2500 },
  'Alpha Centauri A': { distanceLy: 4.37, massSolar: 1.1, ageYears: 5.3e9, luminosity: 1.519, sizeKm: 854600, temperatureK: 5790, discoveryYear: 1689, paperCount: 1800 },
  'Sirius': { distanceLy: 8.6, massSolar: 2.06, ageYears: 2.42e8, luminosity: 25.4, sizeKm: 1190000, temperatureK: 9940, discoveryYear: -3000, paperCount: 3200 },
  'Betelgeuse': { distanceLy: 700, massSolar: 11.6, ageYears: 8e6, luminosity: 126000, sizeKm: 617100000, temperatureK: 3600, discoveryYear: -3000, paperCount: 4500 },
  'Rigel': { distanceLy: 860, massSolar: 21, ageYears: 8e6, luminosity: 120000, sizeKm: 54250000, temperatureK: 12100, discoveryYear: -3000, paperCount: 2100 },
  'Vega': { distanceLy: 25, massSolar: 2.1, ageYears: 4.55e8, luminosity: 40, sizeKm: 1880000, temperatureK: 9602, discoveryYear: -3000, paperCount: 2800 },
  'Polaris': { distanceLy: 433, massSolar: 5.4, ageYears: 7e7, luminosity: 1260, sizeKm: 26000000, temperatureK: 6015, discoveryYear: -500, paperCount: 1500 },
  'Arcturus': { distanceLy: 36.7, massSolar: 1.08, ageYears: 7.1e9, luminosity: 170, sizeKm: 17600000, temperatureK: 4286, discoveryYear: -3000, paperCount: 1900 },

  // Planets
  'Earth': { distanceLy: 0.0000158, massSolar: 0.000003, ageYears: 4.54e9, sizeKm: 12742, temperatureK: 288, discoveryYear: -100000, paperCount: 100000 },
  'Mars': { distanceLy: 0.0000158, massSolar: 0.00000034, ageYears: 4.6e9, sizeKm: 6779, temperatureK: 210, discoveryYear: -3000, paperCount: 25000 },
  'Jupiter': { distanceLy: 0.0000158, massSolar: 0.00095, ageYears: 4.6e9, sizeKm: 139820, temperatureK: 165, discoveryYear: -3000, paperCount: 18000 },
  'Saturn': { distanceLy: 0.0000158, massSolar: 0.00029, ageYears: 4.6e9, sizeKm: 116460, temperatureK: 134, discoveryYear: -3000, paperCount: 12000 },
  'Venus': { distanceLy: 0.0000158, massSolar: 0.0000024, ageYears: 4.5e9, sizeKm: 12104, temperatureK: 737, discoveryYear: -3000, paperCount: 8500 },
  'Mercury': { distanceLy: 0.0000158, massSolar: 0.00000017, ageYears: 4.5e9, sizeKm: 4879, temperatureK: 440, discoveryYear: -3000, paperCount: 5000 },
  'Uranus': { distanceLy: 0.0000158, massSolar: 0.000044, ageYears: 4.5e9, sizeKm: 50724, temperatureK: 76, discoveryYear: 1781, paperCount: 4200 },
  'Neptune': { distanceLy: 0.0000158, massSolar: 0.000052, ageYears: 4.5e9, sizeKm: 49244, temperatureK: 72, discoveryYear: 1846, paperCount: 3800 },
  'Pluto': { distanceLy: 0.0000158, massSolar: 0.0000000066, ageYears: 4.5e9, sizeKm: 2377, temperatureK: 44, discoveryYear: 1930, paperCount: 3500 },

  // Moons
  'Moon': { distanceLy: 0.0000158, massSolar: 0.000000037, ageYears: 4.51e9, sizeKm: 3474, temperatureK: 250, discoveryYear: -100000, paperCount: 35000 },
  'Europa': { distanceLy: 0.0000158, massSolar: 0.0000000245, ageYears: 4.5e9, sizeKm: 3122, temperatureK: 102, discoveryYear: 1610, paperCount: 4500 },
  'Titan': { distanceLy: 0.0000158, massSolar: 0.0000000683, ageYears: 4.5e9, sizeKm: 5150, temperatureK: 94, discoveryYear: 1655, paperCount: 5200 },
  'Ganymede': { distanceLy: 0.0000158, massSolar: 0.0000000756, ageYears: 4.5e9, sizeKm: 5268, temperatureK: 110, discoveryYear: 1610, paperCount: 2800 },
  'Io': { distanceLy: 0.0000158, massSolar: 0.0000000455, ageYears: 4.5e9, sizeKm: 3643, temperatureK: 130, discoveryYear: 1610, paperCount: 3200 },
  'Enceladus': { distanceLy: 0.0000158, massSolar: 0.00000000055, ageYears: 4.5e9, sizeKm: 504, temperatureK: 75, discoveryYear: 1789, paperCount: 2100 },

  // Galaxies
  'Milky Way': { distanceLy: 0, massSolar: 1.5e12, ageYears: 13.6e9, sizeKm: 9.5e17, discoveryYear: -3000, paperCount: 75000 },
  'Andromeda Galaxy': { distanceLy: 2537000, massSolar: 1.5e12, ageYears: 10.1e9, sizeKm: 2.2e18, discoveryYear: 964, paperCount: 15000 },
  'Triangulum Galaxy': { distanceLy: 2730000, massSolar: 5e10, ageYears: 10e9, sizeKm: 5.5e17, discoveryYear: 1654, paperCount: 3500 },
  'Large Magellanic Cloud': { distanceLy: 160000, massSolar: 1e10, ageYears: 13e9, sizeKm: 1.4e17, discoveryYear: 1519, paperCount: 8500 },
  'Small Magellanic Cloud': { distanceLy: 200000, massSolar: 7e9, ageYears: 13e9, sizeKm: 7e16, discoveryYear: 1519, paperCount: 5200 },
  'Whirlpool Galaxy': { distanceLy: 23000000, massSolar: 1.6e11, ageYears: 4e8, sizeKm: 7.6e17, discoveryYear: 1773, paperCount: 2800 },
  'Sombrero Galaxy': { distanceLy: 31000000, massSolar: 8e11, ageYears: 13.3e9, sizeKm: 5e17, discoveryYear: 1781, paperCount: 2100 },

  // Black Holes
  'Sagittarius A*': { distanceLy: 26000, massSolar: 4e6, ageYears: 13.6e9, sizeKm: 23600000, discoveryYear: 1974, paperCount: 8500 },
  'M87*': { distanceLy: 53000000, massSolar: 6.5e9, ageYears: 13e9, sizeKm: 38000000000, discoveryYear: 2019, paperCount: 3200 },
  'TON 618': { distanceLy: 10400000000, massSolar: 6.6e10, ageYears: 10e9, sizeKm: 390000000000, discoveryYear: 1957, paperCount: 850 },
  'Cygnus X-1': { distanceLy: 6070, massSolar: 21.2, ageYears: 5e6, sizeKm: 62, discoveryYear: 1964, paperCount: 4500 },

  // Nebulae
  'Orion Nebula': { distanceLy: 1344, massSolar: 2000, ageYears: 2e6, sizeKm: 2.4e14, temperatureK: 10000, discoveryYear: 1610, paperCount: 12000 },
  'Crab Nebula': { distanceLy: 6500, massSolar: 4.6, ageYears: 970, sizeKm: 1.1e14, temperatureK: 11000, discoveryYear: 1731, paperCount: 8500 },
  'Pillars of Creation': { distanceLy: 7000, massSolar: 200, ageYears: 5.5e6, sizeKm: 4.7e13, temperatureK: 8000, discoveryYear: 1995, paperCount: 2500 },
  'Helix Nebula': { distanceLy: 655, massSolar: 0.4, ageYears: 10600, sizeKm: 1.76e13, temperatureK: 100000, discoveryYear: 1824, paperCount: 1800 },
  'Ring Nebula': { distanceLy: 2283, massSolar: 0.3, ageYears: 7000, sizeKm: 2.4e13, temperatureK: 120000, discoveryYear: 1779, paperCount: 1500 },
  'Eagle Nebula': { distanceLy: 7000, massSolar: 10000, ageYears: 5.5e6, sizeKm: 7e14, temperatureK: 8000, discoveryYear: 1745, paperCount: 3200 },

  // Exoplanets
  'Proxima Centauri b': { distanceLy: 4.24, massSolar: 0.0000039, ageYears: 4.85e9, sizeKm: 8500, temperatureK: 234, discoveryYear: 2016, paperCount: 850 },
  'TRAPPIST-1e': { distanceLy: 39.5, massSolar: 0.00000234, ageYears: 7.6e9, sizeKm: 5800, temperatureK: 251, discoveryYear: 2017, paperCount: 650 },
  'Kepler-452b': { distanceLy: 1402, massSolar: 0.000015, ageYears: 6e9, sizeKm: 10300, temperatureK: 265, discoveryYear: 2015, paperCount: 520 },
  'HD 189733 b': { distanceLy: 64.5, massSolar: 0.00108, ageYears: 6e9, sizeKm: 81400, temperatureK: 1200, discoveryYear: 2005, paperCount: 1200 },

  // Comets
  "Halley's Comet": { distanceLy: 0.0000158, massSolar: 1.1e-15, ageYears: 4.5e9, sizeKm: 11, temperatureK: 200, discoveryYear: -240, paperCount: 4500 },
  'Hale-Bopp': { distanceLy: 0.0000158, massSolar: 5e-14, ageYears: 4.5e9, sizeKm: 40, temperatureK: 180, discoveryYear: 1995, paperCount: 1200 },

  // Asteroids
  'Ceres': { distanceLy: 0.0000158, massSolar: 4.7e-10, ageYears: 4.5e9, sizeKm: 939, temperatureK: 168, discoveryYear: 1801, paperCount: 3800 },
  'Vesta': { distanceLy: 0.0000158, massSolar: 1.3e-10, ageYears: 4.5e9, sizeKm: 525, temperatureK: 180, discoveryYear: 1807, paperCount: 2500 },

  // Pulsars
  'Crab Pulsar': { distanceLy: 6500, massSolar: 1.4, ageYears: 970, sizeKm: 20, temperatureK: 1600000, discoveryYear: 1968, paperCount: 5500 },
  'Vela Pulsar': { distanceLy: 936, massSolar: 1.4, ageYears: 11000, sizeKm: 20, temperatureK: 1000000, discoveryYear: 1968, paperCount: 2800 },

  // Quasars
  '3C 273': { distanceLy: 2440000000, massSolar: 8.86e8, ageYears: 10e9, luminosity: 4e12, sizeKm: 2.6e9, discoveryYear: 1963, paperCount: 3500 },

  // Special objects
  'Voyager 1 Position': { distanceLy: 0.0000023, ageYears: 47, sizeKm: 0.00372, discoveryYear: 1977, paperCount: 8500 },
  'Cosmic Microwave Background': { distanceLy: 46100000000, ageYears: 13.8e9, temperatureK: 2.725, discoveryYear: 1965, paperCount: 25000 },
  'Hubble Deep Field': { distanceLy: 13000000000, ageYears: 13e9, discoveryYear: 1995, paperCount: 5500 },
  'GW150914': { distanceLy: 1300000000, massSolar: 62, ageYears: 1300000000, discoveryYear: 2015, paperCount: 2500 },
};

// Default ranges for generating data by object type
const TYPE_DEFAULTS: Record<string, {
  distanceLy: [number, number];
  massSolar: [number, number];
  ageYears: [number, number];
  luminosity?: [number, number];
  sizeKm: [number, number];
  temperatureK?: [number, number];
  discoveryYear: [number, number];
  paperCount: [number, number];
}> = {
  'Star': {
    distanceLy: [10, 50000],
    massSolar: [0.1, 50],
    ageYears: [1e6, 13e9],
    luminosity: [0.001, 100000],
    sizeKm: [100000, 500000000],
    temperatureK: [2500, 40000],
    discoveryYear: [1600, 2020],
    paperCount: [50, 5000],
  },
  'Planet': {
    distanceLy: [0.0000001, 0.001],
    massSolar: [0.00000001, 0.01],
    ageYears: [1e9, 10e9],
    sizeKm: [1000, 150000],
    temperatureK: [50, 800],
    discoveryYear: [-3000, 2020],
    paperCount: [100, 20000],
  },
  'Exoplanet': {
    distanceLy: [4, 30000],
    massSolar: [0.000001, 0.03],
    ageYears: [1e8, 12e9],
    sizeKm: [3000, 200000],
    temperatureK: [50, 3000],
    discoveryYear: [1992, 2024],
    paperCount: [10, 1500],
  },
  'Moon': {
    distanceLy: [0.0000001, 0.00001],
    massSolar: [0.0000000001, 0.0000001],
    ageYears: [1e9, 5e9],
    sizeKm: [10, 6000],
    temperatureK: [40, 400],
    discoveryYear: [1610, 2020],
    paperCount: [50, 5000],
  },
  'Galaxy': {
    distanceLy: [50000, 13000000000],
    massSolar: [1e7, 1e13],
    ageYears: [1e9, 13.5e9],
    sizeKm: [1e15, 1e19],
    discoveryYear: [1700, 2020],
    paperCount: [100, 20000],
  },
  'Black Hole': {
    distanceLy: [1000, 10000000000],
    massSolar: [3, 70000000000],
    ageYears: [1e6, 13e9],
    sizeKm: [10, 400000000000],
    discoveryYear: [1960, 2024],
    paperCount: [50, 10000],
  },
  'Nebula': {
    distanceLy: [100, 100000],
    massSolar: [0.1, 100000],
    ageYears: [1000, 10000000],
    sizeKm: [1e12, 1e16],
    temperatureK: [5000, 20000],
    discoveryYear: [1600, 2020],
    paperCount: [100, 15000],
  },
  'Pulsar': {
    distanceLy: [100, 50000],
    massSolar: [1.2, 2.2],
    ageYears: [100, 1000000000],
    sizeKm: [10, 30],
    temperatureK: [100000, 10000000],
    discoveryYear: [1967, 2024],
    paperCount: [50, 6000],
  },
  'Quasar': {
    distanceLy: [100000000, 13000000000],
    massSolar: [1e6, 1e11],
    ageYears: [1e9, 13e9],
    luminosity: [1e10, 1e14],
    sizeKm: [1e8, 1e12],
    discoveryYear: [1960, 2020],
    paperCount: [50, 4000],
  },
  'Comet': {
    distanceLy: [0.0000001, 0.001],
    massSolar: [1e-18, 1e-12],
    ageYears: [4e9, 4.6e9],
    sizeKm: [1, 100],
    temperatureK: [100, 400],
    discoveryYear: [-500, 2024],
    paperCount: [10, 5000],
  },
  'Asteroid': {
    distanceLy: [0.0000001, 0.0001],
    massSolar: [1e-18, 1e-9],
    ageYears: [4e9, 4.6e9],
    sizeKm: [0.1, 1000],
    temperatureK: [100, 300],
    discoveryYear: [1801, 2024],
    paperCount: [5, 4000],
  },
  'Star Cluster': {
    distanceLy: [100, 100000],
    massSolar: [100, 1000000],
    ageYears: [1e6, 13e9],
    sizeKm: [1e12, 1e15],
    discoveryYear: [1600, 2020],
    paperCount: [50, 3000],
  },
};

function generateRandomInRange(min: number, max: number, logScale = true): number {
  if (logScale && min > 0 && max > 0) {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    return Math.pow(10, logMin + Math.random() * (logMax - logMin));
  }
  return min + Math.random() * (max - min);
}

function generateDataForType(objectType: string, seed: number): typeof KNOWN_OBJECTS[string] {
  // Use a seeded random for consistency
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const defaults = TYPE_DEFAULTS[objectType] || TYPE_DEFAULTS['Star'];

  const logRandom = (min: number, max: number) => {
    if (min > 0 && max > 0) {
      const logMin = Math.log10(min);
      const logMax = Math.log10(max);
      return Math.pow(10, logMin + random() * (logMax - logMin));
    }
    return min + random() * (max - min);
  };

  return {
    distanceLy: logRandom(defaults.distanceLy[0], defaults.distanceLy[1]),
    massSolar: logRandom(defaults.massSolar[0], defaults.massSolar[1]),
    ageYears: logRandom(defaults.ageYears[0], defaults.ageYears[1]),
    luminosity: defaults.luminosity ? logRandom(defaults.luminosity[0], defaults.luminosity[1]) : undefined,
    sizeKm: logRandom(defaults.sizeKm[0], defaults.sizeKm[1]),
    temperatureK: defaults.temperatureK ? logRandom(defaults.temperatureK[0], defaults.temperatureK[1]) : undefined,
    discoveryYear: Math.floor(defaults.discoveryYear[0] + random() * (defaults.discoveryYear[1] - defaults.discoveryYear[0])),
    paperCount: Math.floor(logRandom(defaults.paperCount[0], defaults.paperCount[1])),
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { batchSize = 100, startId = 1 } = req.body;

    // Get NFTs that need data populated
    const nfts = await prisma.nFT.findMany({
      where: {
        id: { gte: startId },
        distanceLy: null, // Only get ones without data
      },
      take: batchSize,
      orderBy: { id: 'asc' },
      select: { id: true, name: true, objectType: true },
    });

    if (nfts.length === 0) {
      return res.json({ success: true, message: 'No NFTs need data population', updated: 0 });
    }

    let updated = 0;
    let lastId = startId;

    for (const nft of nfts) {
      // Check if we have known data for this object
      let data = KNOWN_OBJECTS[nft.name];

      // If not, generate based on object type
      if (!data) {
        data = generateDataForType(nft.objectType || 'Star', nft.id);
      }

      await prisma.nFT.update({
        where: { id: nft.id },
        data: {
          distanceLy: data.distanceLy,
          massSolar: data.massSolar,
          ageYears: data.ageYears,
          luminosity: data.luminosity,
          sizeKm: data.sizeKm,
          temperatureK: data.temperatureK,
          discoveryYear: data.discoveryYear,
          paperCount: data.paperCount,
        },
      });

      updated++;
      lastId = nft.id;
    }

    // Check how many more need processing
    const remaining = await prisma.nFT.count({
      where: {
        id: { gt: lastId },
        distanceLy: null,
      },
    });

    res.json({
      success: true,
      message: `Populated data for ${updated} NFTs`,
      updated,
      lastId,
      remaining,
      nextStartId: lastId + 1,
    });
  } catch (error: any) {
    console.error('Failed to populate data:', error);
    res.status(500).json({
      error: 'Failed to populate data',
      message: error?.message || 'Unknown error',
    });
  }
}
