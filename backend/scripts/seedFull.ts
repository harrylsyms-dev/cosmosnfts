import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Comprehensive celestial object data generators
const starNames = [
  'Sirius', 'Canopus', 'Arcturus', 'Vega', 'Capella', 'Rigel', 'Procyon', 'Betelgeuse', 'Altair', 'Aldebaran',
  'Antares', 'Spica', 'Pollux', 'Fomalhaut', 'Deneb', 'Regulus', 'Adhara', 'Castor', 'Gacrux', 'Shaula',
  'Bellatrix', 'Elnath', 'Miaplacidus', 'Alnilam', 'Alnitak', 'Regor', 'Alnair', 'Alioth', 'Dubhe', 'Mirfak',
  'Wezen', 'Sargas', 'Kaus Australis', 'Avior', 'Alkaid', 'Menkalinan', 'Atria', 'Alhena', 'Peacock', 'Mirzam',
  'Alphard', 'Polaris', 'Hamal', 'Algieba', 'Diphda', 'Mizar', 'Nunki', 'Menkent', 'Mirach', 'Alpheratz',
  'Rasalhague', 'Kochab', 'Saiph', 'Denebola', 'Algol', 'Tiaki', 'Muhlifain', 'Aspidiske', 'Suhail', 'Alphecca',
  'Mintaka', 'Sadr', 'Eltanin', 'Schedar', 'Naos', 'Almach', 'Caph', 'Izar', 'Dschubba', '2.30', 'Larawag',
  'Merak', 'Ankaa', 'Girtab', 'Enif', 'Scheat', 'Sabik', 'Phecda', 'Aludra', 'Markeb', 'Navi', 'Markab',
  'Aljanah', 'Acrab', 'Alderamin', 'Alcyone', 'Thuban', 'Hadar', 'Achernar', 'Acrux', 'Mimosa'
];

const galaxyPrefixes = ['NGC', 'IC', 'UGC', 'PGC', 'Messier', 'Arp', 'MCG', 'ESO', 'CGCG', 'SDSS'];
const nebulaPrefixes = ['NGC', 'IC', 'Sh2-', 'LBN', 'RCW', 'Ced', 'vdB', 'LDN', 'Barnard'];
const exoplanetSuffixes = ['b', 'c', 'd', 'e', 'f', 'g', 'h'];
const starSystems = ['Kepler', 'TRAPPIST', 'TOI', 'HD', 'HIP', 'GJ', 'Ross', 'Wolf', 'Lalande', 'Lacaille', 'Luyten', 'Proxima', 'Barnard', 'Kapteyn', 'Groombridge', 'Struve', 'Gliese', 'LHS', 'WISE', 'K2'];

const objectTypes = ['Star', 'Exoplanet', 'Galaxy', 'Nebula', 'Star Cluster', 'Asteroid', 'Comet', 'Pulsar', 'Black Hole', 'Quasar', 'Magnetar', 'Neutron Star', 'Brown Dwarf', 'White Dwarf', 'Supernova Remnant'];

const constellations = [
  'Andromeda', 'Aquarius', 'Aquila', 'Aries', 'Auriga', 'Boötes', 'Cancer', 'Canis Major', 'Canis Minor',
  'Capricornus', 'Carina', 'Cassiopeia', 'Centaurus', 'Cepheus', 'Cetus', 'Columba', 'Coma Berenices',
  'Corona Borealis', 'Corvus', 'Crater', 'Crux', 'Cygnus', 'Delphinus', 'Dorado', 'Draco', 'Eridanus',
  'Fornax', 'Gemini', 'Grus', 'Hercules', 'Hydra', 'Leo', 'Lepus', 'Libra', 'Lupus', 'Lyra', 'Monoceros',
  'Ophiuchus', 'Orion', 'Pegasus', 'Perseus', 'Phoenix', 'Pisces', 'Puppis', 'Sagittarius', 'Scorpius',
  'Sculptor', 'Serpens', 'Taurus', 'Triangulum', 'Ursa Major', 'Ursa Minor', 'Vela', 'Virgo', 'Vulpecula'
];

function generateDescription(name: string, type: string): string {
  const descriptions: Record<string, string[]> = {
    'Star': [
      `A luminous celestial body in the constellation, contributing to the cosmic tapestry of our galaxy.`,
      `A stellar object with unique spectral characteristics, studied extensively by astronomers worldwide.`,
      `A remarkable star system that has captivated observers for generations with its brilliance.`,
      `An important reference point in the night sky, used for navigation and scientific calibration.`,
    ],
    'Exoplanet': [
      `An extrasolar planet orbiting a distant star, potentially harboring conditions for life.`,
      `A world beyond our solar system, discovered through advanced detection techniques.`,
      `An alien planet with unique atmospheric and geological characteristics.`,
      `A candidate for habitability studies in the search for life beyond Earth.`,
    ],
    'Galaxy': [
      `A vast cosmic island containing billions of stars, planets, and mysterious dark matter.`,
      `A spiral structure of stars and gas, showcasing the elegant dynamics of gravitational forces.`,
      `An ancient stellar metropolis, home to countless solar systems and potential civilizations.`,
      `A gravitationally bound system of stars representing a snapshot of cosmic evolution.`,
    ],
    'Nebula': [
      `A cosmic cloud of gas and dust, serving as a stellar nursery for new star formation.`,
      `An interstellar medium illuminated by nearby stars, creating breathtaking cosmic art.`,
      `The remnant of stellar processes, either birth or death, painted across the cosmos.`,
      `A diffuse astronomical object composed of ionized gases and cosmic particles.`,
    ],
    'Star Cluster': [
      `A gravitationally bound group of stars sharing a common origin and motion through space.`,
      `A stellar association containing hundreds to millions of stars born from the same molecular cloud.`,
      `An ancient gathering of stars, providing insights into stellar evolution and galactic dynamics.`,
      `A compact collection of stars that formed together and remain loosely bound by gravity.`,
    ],
    'Asteroid': [
      `A rocky remnant from the early solar system, orbiting between Mars and Jupiter.`,
      `A minor planet with potential scientific and resource value for future exploration.`,
      `A primitive body preserving the building blocks of our solar system's formation.`,
      `A near-Earth object being tracked for both scientific interest and planetary defense.`,
    ],
    'Comet': [
      `An icy wanderer from the outer solar system, developing a spectacular tail when approaching the Sun.`,
      `A primordial time capsule containing pristine material from the solar system's birth.`,
      `A periodic visitor to the inner solar system, creating meteor showers as debris trails.`,
      `A small body of ice and dust that sublimes dramatically when heated by solar radiation.`,
    ],
    'Pulsar': [
      `A rapidly rotating neutron star emitting beams of electromagnetic radiation like a cosmic lighthouse.`,
      `The collapsed core of a massive star, spinning at incredible speeds with precise regularity.`,
      `A natural clock in space, used by scientists for gravitational wave detection and navigation.`,
      `An extreme stellar remnant with magnetic fields trillions of times stronger than Earth's.`,
    ],
    'Black Hole': [
      `A region of spacetime where gravity is so intense that nothing can escape, not even light.`,
      `The ultimate fate of massive stars, warping space and time to extreme degrees.`,
      `A cosmic vacuum cleaner, growing by consuming matter from its surrounding environment.`,
      `An object predicted by Einstein's general relativity, now confirmed by gravitational wave observations.`,
    ],
    'Quasar': [
      `An extremely luminous active galactic nucleus powered by a supermassive black hole.`,
      `One of the most energetic objects in the universe, visible across billions of light-years.`,
      `A beacon from the early universe, providing insights into cosmic evolution.`,
      `An active galaxy emitting jets of particles at nearly the speed of light.`,
    ],
    'Magnetar': [
      `A neutron star with an extraordinarily powerful magnetic field, capable of violent outbursts.`,
      `One of the most extreme objects known, with magnetic fields a quadrillion times Earth's.`,
      `A rare stellar remnant that can release more energy in a millisecond than the Sun does in years.`,
      `A cosmic dynamo representing the most intense magnetic phenomena in the universe.`,
    ],
    'Neutron Star': [
      `The ultra-dense collapsed core of a massive star, composed almost entirely of neutrons.`,
      `A stellar remnant so dense that a teaspoon would weigh billions of tons on Earth.`,
      `An object representing the ultimate compression of matter before becoming a black hole.`,
      `A cosmic laboratory for studying physics under extreme conditions impossible on Earth.`,
    ],
    'Brown Dwarf': [
      `A substellar object too small to sustain hydrogen fusion, bridging stars and planets.`,
      `A failed star that glows dimly from residual heat of its formation.`,
      `An object in the mass range between the largest planets and smallest stars.`,
      `A cool stellar object often detected through infrared observations.`,
    ],
    'White Dwarf': [
      `The dense remnant core of a Sun-like star, slowly cooling over billions of years.`,
      `The final evolutionary state of stars not massive enough to become neutron stars.`,
      `A stellar corpse about the size of Earth but with the mass of the Sun.`,
      `The future fate of our own Sun, representing stellar death in slow motion.`,
    ],
    'Supernova Remnant': [
      `The expanding shell of gas and dust left behind after a massive star explodes.`,
      `A cosmic debris field enriching the universe with heavy elements forged in stellar death.`,
      `The aftermath of one of the most violent events in the cosmos.`,
      `A source of cosmic rays and a driver of galactic chemical evolution.`,
    ],
  };

  const typeDescriptions = descriptions[type] || descriptions['Star'];
  return typeDescriptions[Math.floor(Math.random() * typeDescriptions.length)];
}

function generateUniqueName(index: number, type: string, usedNames: Set<string>): string {
  let name: string;
  let attempts = 0;

  do {
    switch (type) {
      case 'Star':
        if (index < starNames.length) {
          name = starNames[index];
        } else {
          const constellation = constellations[Math.floor(Math.random() * constellations.length)];
          const greekLetter = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa'][Math.floor(Math.random() * 10)];
          name = `${greekLetter} ${constellation} ${Math.floor(Math.random() * 999) + 1}`;
        }
        break;
      case 'Exoplanet':
        const system = starSystems[Math.floor(Math.random() * starSystems.length)];
        const number = Math.floor(Math.random() * 9999) + 1;
        const suffix = exoplanetSuffixes[Math.floor(Math.random() * exoplanetSuffixes.length)];
        name = `${system}-${number}${suffix}`;
        break;
      case 'Galaxy':
        const gPrefix = galaxyPrefixes[Math.floor(Math.random() * galaxyPrefixes.length)];
        const gNum = Math.floor(Math.random() * 9999) + 1;
        name = `${gPrefix} ${gNum}`;
        break;
      case 'Nebula':
        const nPrefix = nebulaPrefixes[Math.floor(Math.random() * nebulaPrefixes.length)];
        const nNum = Math.floor(Math.random() * 999) + 1;
        name = `${nPrefix} ${nNum}`;
        break;
      case 'Star Cluster':
        const clusterType = Math.random() > 0.5 ? 'NGC' : 'Messier';
        const cNum = Math.floor(Math.random() * 999) + 1;
        name = `${clusterType} ${cNum} Cluster`;
        break;
      case 'Asteroid':
        const aNum = Math.floor(Math.random() * 99999) + 1000;
        const aNames = ['Eros', 'Ida', 'Gaspra', 'Mathilde', 'Vesta', 'Ceres', 'Pallas', 'Hygiea', 'Psyche', 'Bennu'];
        name = Math.random() > 0.7 ? aNames[Math.floor(Math.random() * aNames.length)] + ` ${aNum}` : `${aNum} Asteroid`;
        break;
      case 'Comet':
        const year = Math.floor(Math.random() * 50) + 1970;
        const cLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const discoverers = ['Halley', 'Encke', 'Hale-Bopp', 'Hyakutake', 'NEOWISE', 'Lovejoy', 'ISON', 'Shoemaker-Levy'];
        name = Math.random() > 0.5 ? `Comet ${discoverers[Math.floor(Math.random() * discoverers.length)]}` : `C/${year} ${cLetter}${Math.floor(Math.random() * 9) + 1}`;
        break;
      default:
        name = `COSMO-${type.substring(0, 3).toUpperCase()}-${index.toString().padStart(5, '0')}`;
    }
    attempts++;
  } while (usedNames.has(name) && attempts < 100);

  usedNames.add(name);
  return name;
}

function generateScores(type: string, phaseNum: number): { fameVisibility: number; scientificSignificance: number; rarity: number; discoveryRecency: number; culturalImpact: number } {
  // Higher phases should have lower average scores (rarer NFTs sold earlier)
  // Phase 1 gets the best, later phases get more common ones
  const phaseModifier = Math.max(0, 20 - Math.floor(phaseNum / 5));

  const baseScores: Record<string, { min: number; max: number }> = {
    'Star': { min: 55, max: 95 },
    'Exoplanet': { min: 60, max: 98 },
    'Galaxy': { min: 58, max: 92 },
    'Nebula': { min: 55, max: 90 },
    'Star Cluster': { min: 52, max: 88 },
    'Asteroid': { min: 45, max: 85 },
    'Comet': { min: 50, max: 90 },
    'Pulsar': { min: 65, max: 98 },
    'Black Hole': { min: 70, max: 99 },
    'Quasar': { min: 68, max: 98 },
    'Magnetar': { min: 70, max: 99 },
    'Neutron Star': { min: 65, max: 95 },
    'Brown Dwarf': { min: 50, max: 85 },
    'White Dwarf': { min: 55, max: 88 },
    'Supernova Remnant': { min: 60, max: 95 },
  };

  const range = baseScores[type] || { min: 50, max: 90 };

  const randomInRange = (min: number, max: number) => {
    const adjusted = Math.floor(Math.random() * (max - min + 1)) + min + phaseModifier;
    return Math.min(100, Math.max(50, adjusted));
  };

  return {
    fameVisibility: randomInRange(range.min, range.max),
    scientificSignificance: randomInRange(range.min, range.max),
    rarity: randomInRange(range.min, range.max),
    discoveryRecency: randomInRange(range.min - 10, range.max - 5),
    culturalImpact: randomInRange(range.min - 5, range.max),
  };
}

async function main() {
  console.log('🚀 Seeding FULL CosmoNFT database (20,000 NFTs)...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.nFT.deleteMany();
  await prisma.tier.deleteMany();
  console.log('✓ Cleared existing data\n');

  // Create pricing tiers (81 phases)
  console.log('Creating 81 pricing tiers...');
  const basePrice = 350;
  const tiers = [];

  const launchDate = getNextWednesday();
  console.log(`📅 Launch date: ${launchDate.toDateString()}\n`);

  // Phase 1: 4 weeks, 1000 NFTs
  tiers.push({
    phase: 1,
    price: basePrice,
    quantityAvailable: 1000,
    quantitySold: 0,
    startTime: launchDate,
    duration: 28 * 24 * 60 * 60,
    active: true,
  });

  // Phases 2-77: 1 week each, 250 NFTs, 7.5% increase (total: 20,000 NFTs)
  for (let i = 2; i <= 77; i++) {
    const multiplier = Math.pow(1.075, i - 1);
    const price = basePrice * multiplier;
    const startTime = new Date(launchDate);
    startTime.setDate(startTime.getDate() + 28 + (i - 2) * 7);

    tiers.push({
      phase: i,
      price: Math.round(price * 100) / 100,
      quantityAvailable: 250,
      quantitySold: 0,
      startTime,
      duration: 7 * 24 * 60 * 60,
      active: false,
    });
  }

  await prisma.tier.createMany({ data: tiers });
  console.log(`✓ Created ${tiers.length} pricing tiers\n`);

  // Generate all 21,000 NFTs
  console.log('Generating 21,000 celestial objects...');

  const usedNames = new Set<string>();
  let totalCreated = 0;

  // Distribution of object types (weighted)
  const typeWeights = [
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

  const totalWeight = typeWeights.reduce((sum, t) => sum + t.weight, 0);

  function getRandomType(): string {
    let random = Math.random() * totalWeight;
    for (const tw of typeWeights) {
      random -= tw.weight;
      if (random <= 0) return tw.type;
    }
    return 'Star';
  }

  // Generate NFTs for each phase (77 phases total)
  for (let phase = 1; phase <= 77; phase++) {
    const nftsInPhase = phase === 1 ? 1000 : 250;
    const nftsToCreate = [];

    for (let i = 0; i < nftsInPhase; i++) {
      const type = getRandomType();
      const name = generateUniqueName(totalCreated + i, type, usedNames);
      const scores = generateScores(type, phase);

      const cosmicScore =
        scores.fameVisibility +
        scores.scientificSignificance +
        scores.rarity +
        scores.discoveryRecency +
        scores.culturalImpact;

      const ipfsHash = `Qm${Buffer.from(name + totalCreated).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 44)}`;

      nftsToCreate.push({
        name,
        description: generateDescription(name, type),
        image: `ipfs://${ipfsHash}`,
        fameVisibility: scores.fameVisibility,
        scientificSignificance: scores.scientificSignificance,
        rarity: scores.rarity,
        discoveryRecency: scores.discoveryRecency,
        culturalImpact: scores.culturalImpact,
        cosmicScore,
        currentPrice: cosmicScore,
        status: 'AVAILABLE',
        discoveryYear: Math.floor(Math.random() * 300) + 1700,
        objectType: type,
      });
    }

    // Batch insert
    await prisma.nFT.createMany({ data: nftsToCreate });
    totalCreated += nftsInPhase;

    process.stdout.write(`\r  Phase ${phase}/77: ${totalCreated.toLocaleString()} NFTs created`);
  }

  console.log('\n✓ Created 20,000 NFTs\n');

  // Generate statistics
  const stats = await prisma.nFT.aggregate({
    _count: true,
    _avg: { cosmicScore: true },
    _min: { cosmicScore: true },
    _max: { cosmicScore: true },
  });

  const eliteCount = await prisma.nFT.count({ where: { cosmicScore: { gte: 425 } } });
  const premiumCount = await prisma.nFT.count({ where: { cosmicScore: { gte: 400, lt: 425 } } });
  const exceptionalCount = await prisma.nFT.count({ where: { cosmicScore: { gte: 375, lt: 400 } } });
  const standardCount = await prisma.nFT.count({ where: { cosmicScore: { lt: 375 } } });

  const objectTypes = await prisma.nFT.groupBy({
    by: ['objectType'],
    _count: true,
    orderBy: { _count: { objectType: 'desc' } },
  });

  console.log('═══════════════════════════════════════════════');
  console.log('           FULL DATABASE SEEDED                 ');
  console.log('═══════════════════════════════════════════════\n');

  console.log('📊 NFT Statistics:');
  console.log(`   Total NFTs:     ${stats._count.toLocaleString()}`);
  console.log(`   Average Score:  ${Math.round(stats._avg.cosmicScore || 0)}/500`);
  console.log(`   Min Score:      ${stats._min.cosmicScore}/500`);
  console.log(`   Max Score:      ${stats._max.cosmicScore}/500\n`);

  console.log('🏆 Badge Distribution:');
  console.log(`   ⭐ ELITE (425+):       ${eliteCount.toLocaleString()} NFTs`);
  console.log(`   💫 PREMIUM (400-424):  ${premiumCount.toLocaleString()} NFTs`);
  console.log(`   🌟 EXCEPTIONAL (375-399): ${exceptionalCount.toLocaleString()} NFTs`);
  console.log(`   🔷 STANDARD (<375):    ${standardCount.toLocaleString()} NFTs\n`);

  console.log('🌌 Object Types:');
  for (const type of objectTypes) {
    console.log(`   ${type.objectType}: ${type._count.toLocaleString()}`);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Full database seeding complete!');
  console.log(`📅 Launch: ${launchDate.toDateString()}`);
  console.log(`💰 Phase 1 Price: $${basePrice}`);
  console.log(`🎯 Total NFTs: 20,000`);
  console.log(`📊 Total Phases: 77`);
  console.log('═══════════════════════════════════════════════\n');
}

function getNextWednesday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7;
  const nextWednesday = new Date(today);
  nextWednesday.setDate(today.getDate() + daysUntilWednesday);
  nextWednesday.setHours(0, 0, 0, 0);
  return nextWednesday;
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
