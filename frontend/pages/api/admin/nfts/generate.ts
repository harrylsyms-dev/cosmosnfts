import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

const MAX_NFTS = 20000;

// Seeded random for reproducibility
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Object type weights for generation
const OBJECT_TYPE_WEIGHTS: { type: string; weight: number }[] = [
  { type: 'Star', weight: 25 },
  { type: 'Exoplanet', weight: 20 },
  { type: 'Galaxy', weight: 18 },
  { type: 'Nebula', weight: 12 },
  { type: 'Star Cluster', weight: 8 },
  { type: 'Asteroid', weight: 5 },
  { type: 'White Dwarf', weight: 3 },
  { type: 'Brown Dwarf', weight: 2 },
  { type: 'Pulsar', weight: 2 },
  { type: 'Supernova Remnant', weight: 2 },
  { type: 'Neutron Star', weight: 1 },
  { type: 'Black Hole', weight: 1 },
  { type: 'Comet', weight: 0.5 },
  { type: 'Quasar', weight: 0.3 },
  { type: 'Magnetar', weight: 0.2 },
];

// Constellation names for star generation
const CONSTELLATIONS = [
  'Andromeda', 'Aquarius', 'Aquila', 'Aries', 'Auriga', 'Bootes', 'Cancer',
  'Canis Major', 'Canis Minor', 'Capricornus', 'Cassiopeia', 'Centaurus',
  'Cepheus', 'Cetus', 'Columba', 'Corona Borealis', 'Corvus', 'Crater',
  'Cygnus', 'Draco', 'Eridanus', 'Gemini', 'Hercules', 'Hydra', 'Leo',
  'Libra', 'Lupus', 'Lyra', 'Ophiuchus', 'Orion', 'Pegasus', 'Perseus',
  'Pisces', 'Sagittarius', 'Scorpius', 'Taurus', 'Ursa Major', 'Ursa Minor',
  'Virgo', 'Vulpecula', 'Phoenix', 'Tucana', 'Pavo', 'Grus', 'Sculptor'
];

// Greek letters for star naming
const GREEK_LETTERS = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi', 'Rho',
  'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
];

// Description templates by object type
const DESCRIPTION_TEMPLATES: Record<string, string[]> = {
  'Star': [
    'A {adjective} star in the constellation {constellation}, burning with {color} light.',
    'Located in {constellation}, this {adjective} star has been studied for its unique properties.',
    'A {color} giant in {constellation}, one of many cataloged stellar objects.',
  ],
  'Exoplanet': [
    'An exoplanet orbiting a distant star, potentially hosting {feature}.',
    'A {size} world in a distant solar system, discovered through transit observations.',
    'An alien world with {feature}, located light-years from Earth.',
  ],
  'Galaxy': [
    'A {type} galaxy containing billions of stars.',
    'A distant {type} galaxy, part of the cosmic web.',
    'A {adjective} {type} galaxy with active star formation.',
  ],
  'Nebula': [
    'A {color} nebula, a stellar nursery where new stars are born.',
    'An emission nebula glowing with {color} light from ionized gases.',
    'A {adjective} cloud of gas and dust in deep space.',
  ],
  'Star Cluster': [
    'A {type} cluster containing hundreds of gravitationally bound stars.',
    'An ancient stellar congregation, formed billions of years ago.',
    'A {adjective} grouping of stars sharing a common origin.',
  ],
  'Asteroid': [
    'A rocky body orbiting in the asteroid belt.',
    'A primitive remnant from the formation of the solar system.',
    'A {size} asteroid with an irregular shape.',
  ],
  'White Dwarf': [
    'The dense remnant of a Sun-like star that has exhausted its fuel.',
    'A cooling stellar corpse, slowly fading over billions of years.',
    'A compact stellar remnant with intense surface gravity.',
  ],
  'Brown Dwarf': [
    'A failed star, too small to sustain hydrogen fusion.',
    'A substellar object bridging the gap between planets and stars.',
    'A cool, dim object glowing with residual heat.',
  ],
  'Pulsar': [
    'A rapidly rotating neutron star emitting beams of radiation.',
    'A cosmic lighthouse spinning {rate} times per second.',
    'A magnetized neutron star with precise timing.',
  ],
  'Neutron Star': [
    'An incredibly dense stellar remnant, just kilometers across.',
    'The collapsed core of a massive star, with extreme density.',
    'A compact object where matter is compressed to nuclear density.',
  ],
  'Black Hole': [
    'A stellar-mass black hole, warping spacetime around it.',
    'A cosmic abyss from which nothing can escape.',
    'A gravitational singularity hidden behind an event horizon.',
  ],
  'Comet': [
    'A frozen wanderer from the outer solar system.',
    'An icy body that develops a tail when approaching the Sun.',
    'A primordial snowball carrying ancient materials.',
  ],
  'Quasar': [
    'An extremely luminous active galactic nucleus.',
    'A distant beacon powered by a supermassive black hole.',
    'One of the most energetic objects in the universe.',
  ],
  'Magnetar': [
    'A neutron star with an extraordinarily powerful magnetic field.',
    'One of the most magnetic objects known to exist.',
    'A source of intense gamma-ray bursts.',
  ],
  'Supernova Remnant': [
    'The expanding shell of gas from a stellar explosion.',
    'The glowing debris of a star that died in a supernova.',
    'A cosmic aftermath spreading elements across space.',
  ],
};

// Adjectives and features for descriptions
const ADJECTIVES = ['brilliant', 'ancient', 'mysterious', 'distant', 'remarkable', 'luminous', 'massive', 'compact'];
const COLORS = ['blue', 'red', 'yellow', 'white', 'orange', 'violet'];
const GALAXY_TYPES = ['spiral', 'elliptical', 'irregular', 'lenticular', 'barred spiral'];
const CLUSTER_TYPES = ['open', 'globular'];
const EXOPLANET_FEATURES = ['liquid water', 'a thick atmosphere', 'volcanic activity', 'multiple moons', 'extreme temperatures'];
const SIZES = ['small', 'medium-sized', 'large', 'massive'];

function pickRandom<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seededRandom(seed) * arr.length)];
}

function generateDescription(objectType: string, name: string, seed: number): string {
  const templates = DESCRIPTION_TEMPLATES[objectType] || DESCRIPTION_TEMPLATES['Star'];
  let template = pickRandom(templates, seed);

  template = template.replace('{adjective}', pickRandom(ADJECTIVES, seed + 1));
  template = template.replace('{color}', pickRandom(COLORS, seed + 2));
  template = template.replace('{constellation}', pickRandom(CONSTELLATIONS, seed + 3));
  template = template.replace('{type}', objectType === 'Galaxy' ? pickRandom(GALAXY_TYPES, seed + 4) : pickRandom(CLUSTER_TYPES, seed + 4));
  template = template.replace('{feature}', pickRandom(EXOPLANET_FEATURES, seed + 5));
  template = template.replace('{size}', pickRandom(SIZES, seed + 6));
  template = template.replace('{rate}', String(Math.floor(seededRandom(seed + 7) * 700) + 1));

  return template;
}

function generateScores(objectType: string, seed: number): { fame: number; significance: number; rarity: number; discovery: number; cultural: number } {
  // Base scores vary by object type rarity
  const rarityMultiplier: Record<string, number> = {
    'Black Hole': 1.3,
    'Quasar': 1.3,
    'Magnetar': 1.25,
    'Pulsar': 1.15,
    'Neutron Star': 1.15,
    'Supernova Remnant': 1.1,
    'Nebula': 1.05,
    'Galaxy': 1.0,
    'Exoplanet': 0.95,
    'Star Cluster': 0.9,
    'White Dwarf': 0.9,
    'Brown Dwarf': 0.85,
    'Comet': 0.85,
    'Asteroid': 0.8,
    'Star': 0.75,
  };

  const mult = rarityMultiplier[objectType] || 1.0;

  return {
    fame: Math.min(100, Math.floor(seededRandom(seed) * 40 + 20) * mult),
    significance: Math.min(100, Math.floor(seededRandom(seed + 1) * 50 + 25) * mult),
    rarity: Math.min(100, Math.floor(seededRandom(seed + 2) * 45 + 30) * mult),
    discovery: Math.min(100, Math.floor(seededRandom(seed + 3) * 60 + 10)),
    cultural: Math.min(100, Math.floor(seededRandom(seed + 4) * 30 + 10) * mult),
  };
}

function getBadgeTier(totalScore: number): string {
  if (totalScore >= 450) return 'LEGENDARY';
  if (totalScore >= 425) return 'ELITE';
  if (totalScore >= 400) return 'PREMIUM';
  if (totalScore >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

// Generate unique name based on type
async function generateUniqueName(objectType: string, existingNames: Set<string>, seed: number): Promise<string> {
  let name = '';
  let attempts = 0;
  const maxAttempts = 1000;

  while (attempts < maxAttempts) {
    const localSeed = seed + attempts;

    switch (objectType) {
      case 'Star':
        // Try Greek letter + constellation first
        if (attempts < 100) {
          const letter = pickRandom(GREEK_LETTERS, localSeed);
          const constellation = pickRandom(CONSTELLATIONS, localSeed + 1);
          name = `${letter} ${constellation}`;
        } else if (attempts < 300) {
          // HD catalog
          const hdNum = Math.floor(seededRandom(localSeed) * 300000) + 1000;
          name = `HD ${hdNum}`;
        } else if (attempts < 600) {
          // HIP catalog
          const hipNum = Math.floor(seededRandom(localSeed) * 115000) + 1000;
          name = `HIP ${hipNum}`;
        } else {
          // Gaia DR3
          const gaiaNum = Math.floor(seededRandom(localSeed) * 1000000000) + 1000000;
          name = `Gaia DR3 ${gaiaNum}`;
        }
        break;

      case 'Exoplanet':
        const starName = pickRandom(['Kepler', 'TOI', 'K2', 'WASP', 'HAT-P', 'GJ', 'HD', 'TrES', 'CoRoT'], localSeed);
        const num = Math.floor(seededRandom(localSeed + 1) * 9000) + 100;
        const letter2 = pickRandom(['b', 'c', 'd', 'e', 'f', 'g'], localSeed + 2);
        name = `${starName}-${num} ${letter2}`;
        break;

      case 'Galaxy':
        if (attempts < 200) {
          const ngcNum = Math.floor(seededRandom(localSeed) * 7800) + 1;
          name = `NGC ${ngcNum}`;
        } else if (attempts < 400) {
          const icNum = Math.floor(seededRandom(localSeed) * 5300) + 1;
          name = `IC ${icNum}`;
        } else {
          const pgcNum = Math.floor(seededRandom(localSeed) * 100000) + 1;
          name = `PGC ${pgcNum}`;
        }
        break;

      case 'Nebula':
        if (attempts < 150) {
          const ngcNum = Math.floor(seededRandom(localSeed) * 7800) + 1;
          name = `NGC ${ngcNum}`;
        } else {
          const shNum = Math.floor(seededRandom(localSeed) * 300) + 1;
          const shRegion = Math.floor(seededRandom(localSeed + 1) * 2) + 1;
          name = `Sh2-${shNum}`;
        }
        break;

      case 'Star Cluster':
        if (attempts < 100) {
          const ngcNum = Math.floor(seededRandom(localSeed) * 7800) + 1;
          name = `NGC ${ngcNum}`;
        } else {
          const melNum = Math.floor(seededRandom(localSeed) * 250) + 1;
          name = `Melotte ${melNum}`;
        }
        break;

      case 'Asteroid':
        const asteroidNum = Math.floor(seededRandom(localSeed) * 500000) + 1000;
        name = `(${asteroidNum}) ${pickRandom(['Unnamed', ''], localSeed)}`.trim() || `Asteroid ${asteroidNum}`;
        break;

      case 'Comet':
        const cometYear = Math.floor(seededRandom(localSeed) * 50) + 1970;
        const cometLetter = pickRandom(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y'], localSeed + 1);
        const cometNum = Math.floor(seededRandom(localSeed + 2) * 50) + 1;
        name = `C/${cometYear} ${cometLetter}${cometNum}`;
        break;

      case 'Pulsar':
      case 'Magnetar':
      case 'Neutron Star':
        const ra = (seededRandom(localSeed) * 24).toFixed(2).padStart(5, '0').replace('.', '');
        const dec = ((seededRandom(localSeed + 1) * 180) - 90).toFixed(0);
        const sign = parseInt(dec) >= 0 ? '+' : '';
        name = `PSR J${ra}${sign}${dec}`;
        break;

      case 'Black Hole':
        if (attempts < 50) {
          const bhName = pickRandom(['Cygnus', 'Sagittarius', 'M87', 'NGC', 'IC'], localSeed);
          const bhNum = bhName === 'NGC' || bhName === 'IC' ? ` ${Math.floor(seededRandom(localSeed + 1) * 5000) + 1}` : '';
          name = `${bhName}${bhNum} Black Hole`;
        } else {
          const xrayNum = Math.floor(seededRandom(localSeed) * 20) + 1;
          name = `XTE J${(seededRandom(localSeed + 1) * 24).toFixed(2).replace('.', '')}-${Math.floor(seededRandom(localSeed + 2) * 90)}`;
        }
        break;

      case 'Quasar':
        const qraH = Math.floor(seededRandom(localSeed) * 24);
        const qraM = Math.floor(seededRandom(localSeed + 1) * 60);
        const qdec = Math.floor(seededRandom(localSeed + 2) * 180) - 90;
        const qsign = qdec >= 0 ? '+' : '';
        name = `QSO J${qraH.toString().padStart(2, '0')}${qraM.toString().padStart(2, '0')}${qsign}${qdec}`;
        break;

      case 'White Dwarf':
        const wdNum = Math.floor(seededRandom(localSeed) * 2000) + 1;
        name = `WD ${(seededRandom(localSeed + 1) * 24).toFixed(2).replace('.', '')}-${Math.floor(seededRandom(localSeed + 2) * 90).toString().padStart(2, '0')}`;
        break;

      case 'Brown Dwarf':
        name = `WISE J${(seededRandom(localSeed) * 24).toFixed(2).replace('.', '')}${seededRandom(localSeed + 1) >= 0.5 ? '+' : '-'}${Math.floor(seededRandom(localSeed + 2) * 90).toString().padStart(2, '0')}`;
        break;

      case 'Supernova Remnant':
        name = `SNR G${(seededRandom(localSeed) * 360).toFixed(1)}${seededRandom(localSeed + 1) >= 0.5 ? '+' : '-'}${(seededRandom(localSeed + 2) * 90).toFixed(1)}`;
        break;

      default:
        name = `Object-${Math.floor(seededRandom(localSeed) * 1000000)}`;
    }

    if (!existingNames.has(name.toLowerCase())) {
      return name;
    }

    attempts++;
  }

  // Fallback: use timestamp-based unique name
  return `${objectType}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function selectObjectType(seed: number): string {
  const totalWeight = OBJECT_TYPE_WEIGHTS.reduce((sum, item) => sum + item.weight, 0);
  let random = seededRandom(seed) * totalWeight;

  for (const item of OBJECT_TYPE_WEIGHTS) {
    random -= item.weight;
    if (random <= 0) {
      return item.type;
    }
  }

  return 'Star';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // GET: Return stats about NFT generation capacity
    if (req.method === 'GET') {
      const totalCount = await prisma.nFT.count();
      const remainingSlots = MAX_NFTS - totalCount;

      return res.json({
        success: true,
        total: totalCount,
        maxCapacity: MAX_NFTS,
        remainingSlots,
        canGenerate: remainingSlots > 0,
      });
    }

    // POST: Generate new NFT(s)
    if (req.method === 'POST') {
      const { count = 1, objectType: requestedType } = req.body;
      const generateCount = Math.min(Math.max(1, count), 100); // Max 100 at a time

      // Check capacity
      const totalCount = await prisma.nFT.count();
      const remainingSlots = MAX_NFTS - totalCount;

      if (remainingSlots <= 0) {
        return res.status(400).json({
          error: 'Maximum NFT capacity reached',
          message: `Cannot generate more NFTs. Maximum capacity of ${MAX_NFTS.toLocaleString()} has been reached.`,
          total: totalCount,
          maxCapacity: MAX_NFTS,
        });
      }

      const actualCount = Math.min(generateCount, remainingSlots);

      // Get existing names to avoid duplicates
      const existingNfts = await prisma.nFT.findMany({
        select: { name: true },
      });
      const existingNames = new Set<string>(existingNfts.map((n: { name: string }) => n.name.toLowerCase()));

      // Get max token ID
      const maxToken = await prisma.nFT.aggregate({
        _max: { tokenId: true },
      });
      let nextTokenId = (maxToken._max.tokenId || 0) + 1;

      // Generate NFTs
      const generatedNfts = [];
      const baseSeed = Date.now();

      for (let i = 0; i < actualCount; i++) {
        const seed = baseSeed + i * 1000;
        const objectType = requestedType || selectObjectType(seed);
        const name = await generateUniqueName(objectType, existingNames, seed);

        // Mark as used
        existingNames.add(name.toLowerCase());

        const description = generateDescription(objectType, name, seed);
        const scores = generateScores(objectType, seed);
        const totalScore = Math.round(scores.fame + scores.significance + scores.rarity + scores.discovery + scores.cultural);
        const badgeTier = getBadgeTier(totalScore);

        // Discovery year (random between 1600 and current year)
        const currentYear = new Date().getFullYear();
        const discoveryYear = Math.floor(seededRandom(seed + 100) * (currentYear - 1600)) + 1600;

        const nft = await prisma.nFT.create({
          data: {
            tokenId: nextTokenId++,
            name,
            description,
            objectType,
            status: 'AVAILABLE',
            fameVisibility: Math.round(scores.fame),
            scientificSignificance: Math.round(scores.significance),
            rarity: Math.round(scores.rarity),
            discoveryRecency: Math.round(scores.discovery),
            culturalImpact: Math.round(scores.cultural),
            totalScore,
            badgeTier,
            discoveryYear,
            constellation: objectType === 'Star' ? pickRandom(CONSTELLATIONS, seed + 200) : null,
          },
        });

        generatedNfts.push({
          id: nft.id,
          tokenId: nft.tokenId,
          name: nft.name,
          objectType: nft.objectType,
          totalScore: nft.totalScore,
          badgeTier: nft.badgeTier,
        });
      }

      console.log(`Admin ${admin.email} generated ${generatedNfts.length} new NFT(s)`);

      const newTotal = await prisma.nFT.count();

      return res.json({
        success: true,
        message: `Generated ${generatedNfts.length} new NFT(s)`,
        generated: generatedNfts,
        total: newTotal,
        maxCapacity: MAX_NFTS,
        remainingSlots: MAX_NFTS - newTotal,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Failed to generate NFT:', error);
    res.status(500).json({ error: 'Failed to generate NFT', details: error?.message });
  }
}
