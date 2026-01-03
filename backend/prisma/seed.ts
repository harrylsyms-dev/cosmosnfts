import { PrismaClient } from '@prisma/client';
import { generateAllCelestialObjects, CelestialObject } from '../scripts/celestialData';

const prisma = new PrismaClient();

// Number of NFTs reserved for auctions (first 20 objects in celestialData)
const AUCTION_RESERVED_COUNT = 20;

// Get badge tier based on total score
function getBadgeTier(totalScore: number): string {
  if (totalScore >= 450) return 'LEGENDARY';
  if (totalScore >= 425) return 'ELITE';
  if (totalScore >= 400) return 'PREMIUM';
  if (totalScore >= 375) return 'EXCEPTIONAL';
  return 'STANDARD';
}

// Get rarity tier label
function getRarityLabel(rarityTier?: string): string {
  switch (rarityTier) {
    case 'legendary': return 'LEGENDARY';
    case 'ultra_rare': return 'ULTRA RARE';
    case 'very_rare': return 'VERY RARE';
    case 'rare': return 'RARE';
    case 'uncommon': return 'UNCOMMON';
    default: return 'COMMON';
  }
}

async function main() {
  console.log('Seeding CosmoNFT database with REAL astronomical data...');
  console.log('Generating 20,000 celestial objects...\n');

  // Generate all celestial objects (with real names and data)
  const allCelestialObjects = generateAllCelestialObjects();
  console.log(`Generated ${allCelestialObjects.length} celestial objects`);
  console.log(`First 20 objects are reserved for AUCTIONS\n`);

  // Show the 20 auction-reserved objects
  console.log('=== AUCTION-RESERVED OBJECTS (First 20) ===');
  for (let i = 0; i < AUCTION_RESERVED_COUNT; i++) {
    console.log(`  ${i + 1}. ${allCelestialObjects[i].name} (${allCelestialObjects[i].objectType})`);
  }
  console.log('');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.auctionBid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.nFT.deleteMany();
  await prisma.tier.deleteMany();
  console.log('Cleared existing data\n');

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

  // Phases 2-77: 250 NFTs each, 1 week, 7.5% increase (76 * 250 = 19,000 + 1000 = 20,000 total)
  let currentTierPrice = basePrice;
  for (let i = 2; i <= 77; i++) {
    currentTierPrice = Math.round(currentTierPrice * 1.075 * 100) / 100;
    const startTime = new Date();
    startTime.setDate(startTime.getDate() + 28 + (i - 2) * 7);

    tiers.push({
      phase: i,
      price: currentTierPrice,
      quantityAvailable: 250,
      startTime,
      duration: 7 * 24 * 60 * 60, // 7 days in seconds
      active: false,
    });
  }

  await prisma.tier.createMany({ data: tiers });
  console.log(`Created ${tiers.length} pricing tiers`);

  // Create NFTs in batches
  const BATCH_SIZE = 500;
  let createdCount = 0;
  let auctionReservedCount = 0;

  // Calculate which object goes to which phase
  // Phase 1: indices 0-999 (1000 objects)
  // Phase 2-77: indices 1000-19999 (250 each per phase)

  for (let batchStart = 0; batchStart < allCelestialObjects.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, allCelestialObjects.length);
    const batch = allCelestialObjects.slice(batchStart, batchEnd);

    const nfts = batch.map((obj, batchIndex) => {
      const globalIndex = batchStart + batchIndex;

      // Determine phase based on index
      let phase: number;
      if (globalIndex < 1000) {
        phase = 1;
      } else {
        phase = Math.floor((globalIndex - 1000) / 250) + 2;
      }

      // Calculate phase price
      const phasePrice = basePrice * Math.pow(1.075, phase - 1);

      // Calculate scores
      const totalScore = obj.fameVisibility + obj.scientificSignificance +
                        obj.rarity + obj.discoveryRecency + obj.culturalImpact;

      // Price multiplier based on score (higher score = higher price)
      const priceMultiplier = totalScore / 350;
      const basePriceCents = Math.round(basePrice * priceMultiplier * 100);
      const nftPrice = Math.round(phasePrice * priceMultiplier * 100) / 100;

      // Is this NFT reserved for auction?
      const isAuctionReserved = globalIndex < AUCTION_RESERVED_COUNT;
      if (isAuctionReserved) auctionReservedCount++;

      // Determine badge tier based on rarity tier or score
      let badgeTier: string;
      if (obj.rarityTier === 'legendary') {
        badgeTier = 'LEGENDARY';
      } else if (obj.rarityTier === 'ultra_rare') {
        badgeTier = 'ELITE';
      } else if (obj.rarityTier === 'very_rare') {
        badgeTier = 'PREMIUM';
      } else if (obj.rarityTier === 'rare') {
        badgeTier = 'EXCEPTIONAL';
      } else {
        badgeTier = getBadgeTier(totalScore);
      }

      return {
        tokenId: globalIndex + 1,
        name: obj.name,
        description: obj.description,
        objectType: obj.objectType,
        // Score fields
        fameScore: obj.fameVisibility,
        significanceScore: obj.scientificSignificance,
        rarityScore: obj.rarity,
        discoveryRecencyScore: obj.discoveryRecency,
        culturalImpactScore: obj.culturalImpact,
        // Alternative score fields (for API compatibility)
        fameVisibility: obj.fameVisibility,
        scientificSignificance: obj.scientificSignificance,
        rarity: obj.rarity,
        discoveryRecency: obj.discoveryRecency,
        culturalImpact: obj.culturalImpact,
        // Calculated fields
        totalScore,
        cosmicScore: totalScore,
        basePriceCents,
        currentPrice: nftPrice,
        badgeTier,
        currentTier: phase,
        // Auction-reserved NFTs are marked but still available until auction starts
        status: isAuctionReserved ? 'AUCTION_RESERVED' : 'AVAILABLE',
        // Store constellation and distance if available
        constellation: obj.constellation || null,
        distance: obj.distance || null,
      };
    });

    await prisma.nFT.createMany({ data: nfts });
    createdCount += nfts.length;

    // Progress update
    const progress = Math.round((createdCount / allCelestialObjects.length) * 100);
    process.stdout.write(`\rCreating NFTs: ${createdCount}/${allCelestialObjects.length} (${progress}%)`);
  }

  console.log('\n');

  // Stats
  const totalNFTs = await prisma.nFT.count();
  const legendaryCount = await prisma.nFT.count({ where: { badgeTier: 'LEGENDARY' } });
  const eliteCount = await prisma.nFT.count({ where: { badgeTier: 'ELITE' } });
  const premiumCount = await prisma.nFT.count({ where: { badgeTier: 'PREMIUM' } });
  const exceptionalCount = await prisma.nFT.count({ where: { badgeTier: 'EXCEPTIONAL' } });
  const standardCount = await prisma.nFT.count({ where: { badgeTier: 'STANDARD' } });
  const auctionCount = await prisma.nFT.count({ where: { status: 'AUCTION_RESERVED' } });

  // Object type breakdown
  const objectTypes = await prisma.nFT.groupBy({
    by: ['objectType'],
    _count: true,
  });

  console.log('=== SEEDING COMPLETE ===\n');
  console.log('NFT Counts:');
  console.log(`  Total NFTs: ${totalNFTs.toLocaleString()}`);
  console.log(`  Auction Reserved: ${auctionCount}`);
  console.log('');
  console.log('Badge Tiers:');
  console.log(`  LEGENDARY: ${legendaryCount}`);
  console.log(`  ELITE: ${eliteCount}`);
  console.log(`  PREMIUM: ${premiumCount}`);
  console.log(`  EXCEPTIONAL: ${exceptionalCount}`);
  console.log(`  STANDARD: ${standardCount}`);
  console.log('');
  console.log('Object Types:');
  objectTypes.sort((a, b) => b._count - a._count).forEach((t) => {
    console.log(`  ${t.objectType}: ${t._count.toLocaleString()}`);
  });
  console.log('');
  console.log(`Pricing Tiers: ${tiers.length}`);
  console.log(`Phase 1 Price: $${basePrice}`);
  console.log(`Phase 77 Price: $${Math.round(basePrice * Math.pow(1.075, 76) * 100) / 100}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
