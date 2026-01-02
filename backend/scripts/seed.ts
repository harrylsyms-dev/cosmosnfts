import { PrismaClient } from '@prisma/client';
import { generateAllCelestialObjects } from './celestialData';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding CosmoNFT database for Phase 1 launch...\n');

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

  // Wednesday launch date (next Wednesday)
  const launchDate = getNextWednesday();
  console.log(`📅 Launch date set to: ${launchDate.toDateString()}\n`);

  // Phase 1: 4 weeks, 1000 NFTs
  tiers.push({
    phase: 1,
    price: basePrice,
    quantityAvailable: 1000,
    quantitySold: 0,
    startTime: launchDate,
    duration: 28 * 24 * 60 * 60, // 28 days in seconds
    active: true,
  });

  // Phases 2-81: 1 week each, 250 NFTs, 7.5% increase
  for (let i = 2; i <= 81; i++) {
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
      duration: 7 * 24 * 60 * 60, // 7 days in seconds
      active: false,
    });
  }

  await prisma.tier.createMany({ data: tiers });
  console.log(`✓ Created ${tiers.length} pricing tiers`);

  // Show price progression
  console.log('\nPrice progression:');
  console.log(`  Phase 1:  $${tiers[0].price.toFixed(2)}`);
  console.log(`  Phase 10: $${tiers[9].price.toFixed(2)}`);
  console.log(`  Phase 30: $${tiers[29].price.toFixed(2)}`);
  console.log(`  Phase 50: $${tiers[49].price.toFixed(2)}`);
  console.log(`  Phase 81: $${tiers[80].price.toFixed(2)}\n`);

  // Generate 1000 celestial objects
  console.log('Generating 1000 celestial objects for Phase 1...');
  const celestialObjects = generateAllCelestialObjects();

  const nftsToCreate = celestialObjects.map((obj, index) => {
    const cosmicScore =
      obj.fameVisibility +
      obj.scientificSignificance +
      obj.rarity +
      obj.discoveryRecency +
      obj.culturalImpact;

    // Generate placeholder IPFS hash (will be updated with real images)
    const ipfsHash = `Qm${Buffer.from(obj.name).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 44)}`;

    return {
      name: obj.name,
      description: obj.description,
      image: `ipfs://${ipfsHash}`,
      fameVisibility: obj.fameVisibility,
      scientificSignificance: obj.scientificSignificance,
      rarity: obj.rarity,
      discoveryRecency: obj.discoveryRecency,
      culturalImpact: obj.culturalImpact,
      cosmicScore,
      currentPrice: cosmicScore, // Base price = cosmic score in dollars
      status: 'AVAILABLE',
      discoveryYear: obj.discoveryYear,
      objectType: obj.objectType,
    };
  });

  // Batch insert in chunks for performance
  const chunkSize = 100;
  for (let i = 0; i < nftsToCreate.length; i += chunkSize) {
    const chunk = nftsToCreate.slice(i, i + chunkSize);
    await prisma.nFT.createMany({ data: chunk });
    process.stdout.write(`\r  Creating NFTs: ${Math.min(i + chunkSize, nftsToCreate.length)}/${nftsToCreate.length}`);
  }
  console.log('\n✓ Created 1000 NFTs\n');

  // Generate statistics
  const stats = await prisma.nFT.aggregate({
    _count: true,
    _avg: { cosmicScore: true },
    _min: { cosmicScore: true },
    _max: { cosmicScore: true },
  });

  // Badge distribution
  const eliteCount = await prisma.nFT.count({ where: { cosmicScore: { gte: 425 } } });
  const premiumCount = await prisma.nFT.count({ where: { cosmicScore: { gte: 400, lt: 425 } } });
  const exceptionalCount = await prisma.nFT.count({ where: { cosmicScore: { gte: 375, lt: 400 } } });
  const standardCount = await prisma.nFT.count({ where: { cosmicScore: { lt: 375 } } });

  // Object type distribution
  const objectTypes = await prisma.nFT.groupBy({
    by: ['objectType'],
    _count: true,
    orderBy: { _count: { objectType: 'desc' } },
  });

  console.log('═══════════════════════════════════════════════');
  console.log('              PHASE 1 LAUNCH READY              ');
  console.log('═══════════════════════════════════════════════\n');

  console.log('📊 NFT Statistics:');
  console.log(`   Total NFTs:     ${stats._count}`);
  console.log(`   Average Score:  ${Math.round(stats._avg.cosmicScore || 0)}/500`);
  console.log(`   Min Score:      ${stats._min.cosmicScore}/500`);
  console.log(`   Max Score:      ${stats._max.cosmicScore}/500\n`);

  console.log('🏆 Badge Distribution:');
  console.log(`   ⭐ ELITE (425+):       ${eliteCount} NFTs`);
  console.log(`   💫 PREMIUM (400-424):  ${premiumCount} NFTs`);
  console.log(`   🌟 EXCEPTIONAL (375-399): ${exceptionalCount} NFTs`);
  console.log(`   🔷 STANDARD (<375):    ${standardCount} NFTs\n`);

  console.log('🌌 Object Types:');
  for (const type of objectTypes) {
    console.log(`   ${type.objectType}: ${type._count}`);
  }

  console.log('\n═══════════════════════════════════════════════');
  console.log('✅ Database seeding complete!');
  console.log(`📅 Launch: ${launchDate.toDateString()}`);
  console.log(`💰 Starting Price: $${basePrice}`);
  console.log(`🎯 Phase 1 NFTs: 1000`);
  console.log('═══════════════════════════════════════════════\n');
}

function getNextWednesday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilWednesday = (3 - dayOfWeek + 7) % 7 || 7; // 3 = Wednesday
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
