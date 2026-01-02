import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Famous celestial objects for Phase 1
const CELESTIAL_OBJECTS = [
  // Stars (Famous)
  { name: 'Sirius', type: 'Star', description: 'The brightest star in Earth\'s night sky, also known as the Dog Star. Located in the constellation Canis Major.', fame: 92, significance: 88, rarity: 78, discovery: 65, cultural: 95 },
  { name: 'Polaris', type: 'Star', description: 'The North Star, used for navigation for thousands of years. Located nearly at the north celestial pole.', fame: 90, significance: 85, rarity: 82, discovery: 55, cultural: 98 },
  { name: 'Betelgeuse', type: 'Star', description: 'A red supergiant star in Orion, one of the largest stars visible to the naked eye. May explode as a supernova within 100,000 years.', fame: 88, significance: 90, rarity: 85, discovery: 60, cultural: 88 },
  { name: 'Rigel', type: 'Star', description: 'The brightest star in Orion, a blue supergiant that outshines the Sun by 120,000 times.', fame: 85, significance: 82, rarity: 75, discovery: 58, cultural: 82 },
  { name: 'Vega', type: 'Star', description: 'One of the brightest stars in the northern sky, part of the Summer Triangle. Former pole star 12,000 years ago.', fame: 88, significance: 85, rarity: 72, discovery: 68, cultural: 87 },
  { name: 'Arcturus', type: 'Star', description: 'The brightest star in the northern celestial hemisphere, an orange giant 25 times larger than the Sun.', fame: 87, significance: 84, rarity: 76, discovery: 70, cultural: 90 },
  { name: 'Capella', type: 'Star', description: 'The sixth-brightest star in the night sky, actually a quadruple star system.', fame: 82, significance: 80, rarity: 78, discovery: 62, cultural: 78 },
  { name: 'Aldebaran', type: 'Star', description: 'The eye of Taurus the Bull, an orange giant star 44 times the Sun\'s diameter.', fame: 84, significance: 82, rarity: 74, discovery: 65, cultural: 85 },
  { name: 'Antares', type: 'Star', description: 'The heart of Scorpius, a red supergiant that would engulf Mars if placed at the Sun\'s position.', fame: 83, significance: 86, rarity: 80, discovery: 63, cultural: 84 },
  { name: 'Spica', type: 'Star', description: 'The brightest star in Virgo, a binary star system 260 light-years from Earth.', fame: 80, significance: 78, rarity: 72, discovery: 60, cultural: 80 },

  // Galaxies
  { name: 'Andromeda Galaxy', type: 'Galaxy', description: 'The nearest major galaxy to the Milky Way, containing approximately 1 trillion stars. Visible to the naked eye.', fame: 95, significance: 92, rarity: 90, discovery: 50, cultural: 92 },
  { name: 'Milky Way Center', type: 'Galaxy', description: 'The heart of our home galaxy, containing a supermassive black hole called Sagittarius A*.', fame: 90, significance: 95, rarity: 95, discovery: 75, cultural: 95 },
  { name: 'Triangulum Galaxy', type: 'Galaxy', description: 'The third-largest galaxy in the Local Group, about 3 million light-years from Earth.', fame: 75, significance: 82, rarity: 85, discovery: 55, cultural: 70 },
  { name: 'Whirlpool Galaxy', type: 'Galaxy', description: 'A grand-design spiral galaxy with a companion galaxy, famous for its clear spiral structure.', fame: 80, significance: 85, rarity: 82, discovery: 60, cultural: 78 },
  { name: 'Sombrero Galaxy', type: 'Galaxy', description: 'A spiral galaxy with a prominent dust lane and unusually large central bulge.', fame: 78, significance: 80, rarity: 80, discovery: 58, cultural: 75 },

  // Nebulae
  { name: 'Orion Nebula', type: 'Nebula', description: 'The brightest nebula visible to the naked eye, a stellar nursery where new stars are born.', fame: 92, significance: 90, rarity: 85, discovery: 55, cultural: 90 },
  { name: 'Crab Nebula', type: 'Nebula', description: 'The remnant of a supernova observed by Chinese astronomers in 1054 AD. Contains a pulsar.', fame: 88, significance: 92, rarity: 88, discovery: 70, cultural: 85 },
  { name: 'Eagle Nebula', type: 'Nebula', description: 'Home to the famous Pillars of Creation, towers of gas and dust where stars are forming.', fame: 85, significance: 88, rarity: 82, discovery: 65, cultural: 88 },
  { name: 'Ring Nebula', type: 'Nebula', description: 'A planetary nebula in Lyra, the colorful remnant of a dying star\'s outer layers.', fame: 80, significance: 82, rarity: 78, discovery: 60, cultural: 78 },
  { name: 'Horsehead Nebula', type: 'Nebula', description: 'An iconic dark nebula resembling a horse\'s head, silhouetted against a brighter emission nebula.', fame: 85, significance: 80, rarity: 80, discovery: 58, cultural: 90 },

  // Clusters
  { name: 'Pleiades', type: 'Star Cluster', description: 'The Seven Sisters, one of the most famous star clusters. Visible to the naked eye.', fame: 90, significance: 85, rarity: 75, discovery: 45, cultural: 95 },
  { name: 'Omega Centauri', type: 'Globular Cluster', description: 'The largest globular cluster in the Milky Way, containing 10 million stars.', fame: 78, significance: 88, rarity: 88, discovery: 60, cultural: 75 },
  { name: 'Hyades', type: 'Star Cluster', description: 'The nearest open cluster to the Sun, forming the head of Taurus the Bull.', fame: 82, significance: 80, rarity: 72, discovery: 50, cultural: 85 },

  // Other famous objects
  { name: 'Proxima Centauri', type: 'Star', description: 'The closest star to the Sun, a red dwarf only 4.24 light-years away. Has an Earth-like exoplanet.', fame: 85, significance: 90, rarity: 92, discovery: 80, cultural: 82 },
  { name: 'Alpha Centauri', type: 'Star System', description: 'The closest star system to Earth, a triple star system 4.37 light-years away.', fame: 88, significance: 88, rarity: 90, discovery: 70, cultural: 88 },
  { name: 'Barnard\'s Star', type: 'Star', description: 'The fourth-closest star to the Sun, a red dwarf with the fastest proper motion of any star.', fame: 75, significance: 82, rarity: 85, discovery: 75, cultural: 70 },
];

// Generate random scores within a range
function randomScore(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate additional celestial objects for variety
function generateAdditionalObjects(count: number): typeof CELESTIAL_OBJECTS {
  const types = ['Star', 'Galaxy', 'Nebula', 'Asteroid', 'Comet', 'Pulsar', 'Quasar', 'Brown Dwarf', 'White Dwarf', 'Black Hole'];
  const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'];
  const suffixes = ['Major', 'Minor', 'Prime', 'Proxima', 'Ultima', 'Nova', 'X', 'Centauri', 'Orionis', 'Tauri'];

  const objects: typeof CELESTIAL_OBJECTS = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const catalog = `${Math.floor(Math.random() * 999) + 1}`;

    const name = Math.random() > 0.5
      ? `${prefix} ${suffix}`
      : `NGC ${catalog}`;

    const descriptions: Record<string, string[]> = {
      Star: [
        `A ${['red', 'blue', 'yellow', 'orange', 'white'][Math.floor(Math.random() * 5)]} ${['giant', 'supergiant', 'dwarf', 'main sequence'][Math.floor(Math.random() * 4)]} star discovered in the ${['18th', '19th', '20th', '21st'][Math.floor(Math.random() * 4)]} century.`,
      ],
      Galaxy: [
        `A ${['spiral', 'elliptical', 'irregular', 'lenticular'][Math.floor(Math.random() * 4)]} galaxy located ${randomScore(10, 500)} million light-years from Earth.`,
      ],
      Nebula: [
        `A ${['emission', 'reflection', 'dark', 'planetary'][Math.floor(Math.random() * 4)]} nebula in the constellation ${['Orion', 'Cygnus', 'Sagittarius', 'Andromeda'][Math.floor(Math.random() * 4)]}.`,
      ],
      Asteroid: [
        `A rocky body in the asteroid belt, measuring approximately ${randomScore(1, 500)} kilometers in diameter.`,
      ],
      Comet: [
        `A periodic comet with an orbital period of ${randomScore(5, 200)} years, known for its distinctive tail.`,
      ],
      Pulsar: [
        `A rapidly rotating neutron star emitting beams of electromagnetic radiation.`,
      ],
      Quasar: [
        `An extremely luminous active galactic nucleus powered by a supermassive black hole.`,
      ],
      'Brown Dwarf': [
        `A substellar object too small to sustain hydrogen fusion, bridging stars and planets.`,
      ],
      'White Dwarf': [
        `The remnant core of a dead star, incredibly dense and slowly cooling over billions of years.`,
      ],
      'Black Hole': [
        `A region of spacetime where gravity is so strong that nothing can escape, not even light.`,
      ],
    };

    objects.push({
      name,
      type,
      description: descriptions[type]?.[0] || `A celestial object of type ${type}.`,
      fame: randomScore(50, 85),
      significance: randomScore(55, 88),
      rarity: randomScore(60, 90),
      discovery: randomScore(50, 85),
      cultural: randomScore(45, 80),
    });
  }

  return objects;
}

// Get badge tier based on total score
function getBadgeTier(totalScore: number): string {
  if (totalScore >= 425) return 'ELITE';
  if (totalScore >= 400) return 'PREMIUM';
  if (totalScore >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

async function main() {
  console.log('Seeding CosmoNFT database...');

  // Clear existing data
  await prisma.auctionBid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.nFT.deleteMany();
  await prisma.tier.deleteMany();

  console.log('Cleared existing data');

  // Create tiers
  const basePrice = 350;
  const tiers = [];

  // Phase 1: 1,000 NFTs, 4 weeks
  tiers.push({
    phase: 1,
    price: basePrice,
    quantityAvailable: 1000,
    startTime: new Date(),
    duration: 28 * 24 * 60 * 60, // 28 days in seconds
    active: true,
  });

  // Phases 2-81: 250 NFTs each, 1 week, 7.5% increase
  let currentPrice = basePrice;
  for (let i = 2; i <= 81; i++) {
    currentPrice = Math.round(currentPrice * 1.075 * 100) / 100;
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 28 + (i - 2) * 7);

    tiers.push({
      phase: i,
      price: currentPrice,
      quantityAvailable: 250,
      startTime,
      duration: 7 * 24 * 60 * 60, // 7 days in seconds
      active: false,
    });
  }

  await prisma.tier.createMany({ data: tiers });
  console.log(`Created ${tiers.length} pricing tiers`);

  // Generate NFTs for Phase 1
  const allObjects = [
    ...CELESTIAL_OBJECTS,
    ...generateAdditionalObjects(1000 - CELESTIAL_OBJECTS.length),
  ].slice(0, 1000);

  const nfts = allObjects.map((obj, index) => {
    const totalScore = obj.fame + obj.significance + obj.rarity + obj.discovery + obj.cultural;
    const priceMultiplier = totalScore / 350; // Score 350 = base price
    const basePriceCents = Math.round(basePrice * priceMultiplier * 100);

    return {
      tokenId: index + 1,
      name: obj.name,
      description: obj.description,
      objectType: obj.type,
      fameScore: obj.fame,
      significanceScore: obj.significance,
      rarityScore: obj.rarity,
      discoveryRecencyScore: obj.discovery,
      culturalImpactScore: obj.cultural,
      totalScore,
      basePriceCents,
      badgeTier: getBadgeTier(totalScore),
      currentTier: 1,
      status: 'AVAILABLE',
    };
  });

  await prisma.nFT.createMany({ data: nfts });
  console.log(`Created ${nfts.length} Phase 1 NFTs`);

  // Generate NFTs for Phases 2-81 (250 each = 20,000 total)
  let tokenId = 1001;
  for (let phase = 2; phase <= 81; phase++) {
    const phaseNFTs = generateAdditionalObjects(250).map((obj) => {
      const totalScore = obj.fame + obj.significance + obj.rarity + obj.discovery + obj.cultural;
      const priceMultiplier = totalScore / 350;
      const basePriceCents = Math.round(basePrice * priceMultiplier * 100);

      return {
        tokenId: tokenId++,
        name: obj.name,
        description: obj.description,
        objectType: obj.type,
        fameScore: obj.fame,
        significanceScore: obj.significance,
        rarityScore: obj.rarity,
        discoveryRecencyScore: obj.discovery,
        culturalImpactScore: obj.cultural,
        totalScore,
        basePriceCents,
        badgeTier: getBadgeTier(totalScore),
        currentTier: phase,
        status: 'AVAILABLE',
      };
    });

    await prisma.nFT.createMany({ data: phaseNFTs });
    console.log(`Created ${phaseNFTs.length} Phase ${phase} NFTs`);
  }

  // Stats
  const totalNFTs = await prisma.nFT.count();
  const eliteCount = await prisma.nFT.count({ where: { badgeTier: 'ELITE' } });
  const premiumCount = await prisma.nFT.count({ where: { badgeTier: 'PREMIUM' } });
  const exceptionalCount = await prisma.nFT.count({ where: { badgeTier: 'EXCEPTIONAL' } });
  const standardCount = await prisma.nFT.count({ where: { badgeTier: 'STANDARD' } });

  console.log('\n--- Seeding Complete ---');
  console.log(`Total NFTs: ${totalNFTs}`);
  console.log(`ELITE: ${eliteCount}`);
  console.log(`PREMIUM: ${premiumCount}`);
  console.log(`EXCEPTIONAL: ${exceptionalCount}`);
  console.log(`STANDARD: ${standardCount}`);
  console.log(`Pricing Tiers: ${tiers.length}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
