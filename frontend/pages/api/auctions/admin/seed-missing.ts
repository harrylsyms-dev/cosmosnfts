import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// All 20 auction NFTs with their details
const AUCTION_NFTS = [
  {
    name: 'Earth',
    objectType: 'Exoplanet',
    description: 'Our home world, the third planet from the Sun. A unique oasis of life in the vast cosmic desert, with its perfect balance of land, water, and atmosphere.',
    totalScore: 500,
    fameVisibility: 100,
    scientificSignificance: 100,
    rarity: 100,
    discoveryRecency: 100,
    culturalImpact: 100,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Sun',
    objectType: 'Star',
    description: 'Our star, a G-type main-sequence star at the heart of our solar system. The source of all life on Earth, its nuclear fusion powers the entire system.',
    totalScore: 430,
    fameVisibility: 100,
    scientificSignificance: 100,
    rarity: 100,
    discoveryRecency: 30,
    culturalImpact: 100,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Moon',
    objectType: 'Exoplanet',
    description: 'Earth\'s only natural satellite, a steadfast companion through the ages. Its gravitational pull shapes our tides and stabilizes our planet\'s axial tilt.',
    totalScore: 420,
    fameVisibility: 100,
    scientificSignificance: 90,
    rarity: 80,
    discoveryRecency: 50,
    culturalImpact: 100,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Mars',
    objectType: 'Exoplanet',
    description: 'The Red Planet, named after the Roman god of war. A frozen desert world that may have once harbored liquid water and possibly life.',
    totalScore: 380,
    fameVisibility: 95,
    scientificSignificance: 90,
    rarity: 60,
    discoveryRecency: 35,
    culturalImpact: 100,
    badgeTier: 'ELITE',
  },
  {
    name: 'Jupiter',
    objectType: 'Exoplanet',
    description: 'The largest planet in our solar system, a gas giant with a mass of over 300 Earths. Its Great Red Spot is a storm that has raged for centuries.',
    totalScore: 400,
    fameVisibility: 100,
    scientificSignificance: 85,
    rarity: 75,
    discoveryRecency: 40,
    culturalImpact: 100,
    badgeTier: 'ELITE',
  },
  {
    name: 'Venus',
    objectType: 'Exoplanet',
    description: 'Earth\'s scorching twin, shrouded in thick clouds of sulfuric acid. Despite its hellish surface, it was once thought to be a tropical paradise.',
    totalScore: 350,
    fameVisibility: 90,
    scientificSignificance: 75,
    rarity: 55,
    discoveryRecency: 30,
    culturalImpact: 100,
    badgeTier: 'ELITE',
  },
  {
    name: 'Saturn',
    objectType: 'Exoplanet',
    description: 'The ringed wonder of the solar system. Its spectacular rings, made of ice and rock, make it one of the most recognizable objects in astronomy.',
    totalScore: 390,
    fameVisibility: 100,
    scientificSignificance: 80,
    rarity: 70,
    discoveryRecency: 40,
    culturalImpact: 100,
    badgeTier: 'ELITE',
  },
  {
    name: 'Neptune',
    objectType: 'Exoplanet',
    description: 'The distant ice giant, a world of extreme winds and frigid temperatures. Its deep blue color comes from methane in its atmosphere.',
    totalScore: 320,
    fameVisibility: 70,
    scientificSignificance: 70,
    rarity: 60,
    discoveryRecency: 60,
    culturalImpact: 60,
    badgeTier: 'PREMIUM',
  },
  {
    name: 'Uranus',
    objectType: 'Exoplanet',
    description: 'The sideways planet, tilted on its axis at an extreme angle. This ice giant holds mysteries that we are only beginning to understand.',
    totalScore: 310,
    fameVisibility: 65,
    scientificSignificance: 65,
    rarity: 60,
    discoveryRecency: 60,
    culturalImpact: 60,
    badgeTier: 'PREMIUM',
  },
  {
    name: 'Andromeda Galaxy',
    objectType: 'Galaxy',
    description: 'The nearest major galaxy to the Milky Way, on a collision course with us. In 4 billion years, these two galaxies will merge into one.',
    totalScore: 480,
    fameVisibility: 100,
    scientificSignificance: 100,
    rarity: 100,
    discoveryRecency: 80,
    culturalImpact: 100,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Milky Way',
    objectType: 'Galaxy',
    description: 'Our home galaxy, a barred spiral containing over 100 billion stars. We see it as a luminous band across the night sky.',
    totalScore: 490,
    fameVisibility: 100,
    scientificSignificance: 100,
    rarity: 100,
    discoveryRecency: 90,
    culturalImpact: 100,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Orion Nebula',
    objectType: 'Nebula',
    description: 'A stellar nursery visible to the naked eye, where new stars are being born. One of the most photographed objects in the night sky.',
    totalScore: 440,
    fameVisibility: 100,
    scientificSignificance: 95,
    rarity: 85,
    discoveryRecency: 60,
    culturalImpact: 100,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Crab Nebula',
    objectType: 'Nebula',
    description: 'The remnant of a supernova witnessed by ancient astronomers in 1054 AD. At its heart lies a rapidly spinning neutron star.',
    totalScore: 420,
    fameVisibility: 95,
    scientificSignificance: 100,
    rarity: 80,
    discoveryRecency: 55,
    culturalImpact: 90,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Ring Nebula',
    objectType: 'Nebula',
    description: 'A planetary nebula in the constellation Lyra, showing what our Sun may look like at the end of its life.',
    totalScore: 380,
    fameVisibility: 85,
    scientificSignificance: 80,
    rarity: 75,
    discoveryRecency: 50,
    culturalImpact: 90,
    badgeTier: 'ELITE',
  },
  {
    name: 'Horsehead Nebula',
    objectType: 'Nebula',
    description: 'One of the most identifiable nebulae due to its distinctive shape resembling a horse\'s head. A dark cloud of dust silhouetted against glowing gas.',
    totalScore: 400,
    fameVisibility: 100,
    scientificSignificance: 75,
    rarity: 80,
    discoveryRecency: 55,
    culturalImpact: 90,
    badgeTier: 'ELITE',
  },
  {
    name: 'Eagle Nebula',
    objectType: 'Nebula',
    description: 'Home to the famous Pillars of Creation, towering columns of gas and dust where new stars are forming.',
    totalScore: 410,
    fameVisibility: 95,
    scientificSignificance: 85,
    rarity: 80,
    discoveryRecency: 60,
    culturalImpact: 90,
    badgeTier: 'ELITE',
  },
  {
    name: 'Helix Nebula',
    objectType: 'Nebula',
    description: 'Also known as the Eye of God, this planetary nebula is one of the closest to Earth. A preview of our own Sun\'s distant future.',
    totalScore: 390,
    fameVisibility: 90,
    scientificSignificance: 80,
    rarity: 75,
    discoveryRecency: 55,
    culturalImpact: 90,
    badgeTier: 'ELITE',
  },
  {
    name: 'Whirlpool Galaxy',
    objectType: 'Galaxy',
    description: 'A stunning face-on spiral galaxy, interacting with its smaller companion. Its spiral arms are clearly visible from Earth.',
    totalScore: 430,
    fameVisibility: 90,
    scientificSignificance: 90,
    rarity: 85,
    discoveryRecency: 70,
    culturalImpact: 95,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Sombrero Galaxy',
    objectType: 'Galaxy',
    description: 'Named for its resemblance to a Mexican hat, this galaxy features a brilliant white core and a prominent dust lane.',
    totalScore: 420,
    fameVisibility: 90,
    scientificSignificance: 85,
    rarity: 80,
    discoveryRecency: 65,
    culturalImpact: 100,
    badgeTier: 'LEGENDARY',
  },
  {
    name: 'Triangulum Galaxy',
    objectType: 'Galaxy',
    description: 'The third-largest member of our Local Group, after Andromeda and the Milky Way. A spiral galaxy with active star formation.',
    totalScore: 400,
    fameVisibility: 80,
    scientificSignificance: 85,
    rarity: 80,
    discoveryRecency: 70,
    culturalImpact: 85,
    badgeTier: 'ELITE',
  },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Only SUPER_ADMIN can seed NFTs
    if (admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Get highest token ID
    const maxToken = await prisma.nFT.findFirst({
      orderBy: { tokenId: 'desc' },
      select: { tokenId: true },
    });
    let nextTokenId = (maxToken?.tokenId || 0) + 1;

    const created: string[] = [];
    const skipped: string[] = [];

    for (const nftData of AUCTION_NFTS) {
      // Check if NFT already exists
      const existing = await prisma.nFT.findFirst({
        where: {
          OR: [
            { name: nftData.name },
            { name: { contains: nftData.name } },
          ],
        },
      });

      if (existing) {
        skipped.push(nftData.name);
        continue;
      }

      // Create the NFT
      await prisma.nFT.create({
        data: {
          tokenId: nextTokenId++,
          name: nftData.name,
          objectType: nftData.objectType,
          description: nftData.description,
          totalScore: nftData.totalScore,
          fameVisibility: nftData.fameVisibility,
          scientificSignificance: nftData.scientificSignificance,
          rarity: nftData.rarity,
          discoveryRecency: nftData.discoveryRecency,
          culturalImpact: nftData.culturalImpact,
          badgeTier: nftData.badgeTier,
          status: 'AUCTION_RESERVED',
        },
      });

      created.push(nftData.name);
    }

    console.log(`Seeded ${created.length} auction NFTs, skipped ${skipped.length} existing`);

    res.json({
      success: true,
      message: `Created ${created.length} NFTs, skipped ${skipped.length} existing`,
      created,
      skipped,
    });
  } catch (error: any) {
    console.error('Error seeding auction NFTs:', error);
    res.status(500).json({ error: 'Failed to seed auction NFTs', details: error?.message });
  }
}
