import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 20 key celestial objects reserved for premium auctions
// These will NOT be included in regular phase sales
const AUCTION_RESERVED_OBJECTS = [
  'Earth',
  'Sun',
  'Moon',
  'Mars',
  'Venus',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Andromeda Galaxy',
  'Milky Way',
  'Orion Nebula',
  'Crab Nebula',
  'Ring Nebula',
  'Horsehead Nebula',
  'Eagle Nebula',
  'Helix Nebula',
  'Whirlpool Galaxy',
  'Sombrero Galaxy',
  'Triangulum Galaxy',
];

// Auction schedule with starting bids (in cents)
export const AUCTION_SCHEDULE = [
  { name: 'Earth', week: 2, startingBidCents: 100000 },      // $1,000
  { name: 'Sun', week: 4, startingBidCents: 200000 },        // $2,000
  { name: 'Moon', week: 6, startingBidCents: 150000 },       // $1,500
  { name: 'Mars', week: 8, startingBidCents: 50000 },        // $500
  { name: 'Jupiter', week: 10, startingBidCents: 75000 },    // $750
  { name: 'Venus', week: 12, startingBidCents: 40000 },      // $400
  { name: 'Saturn', week: 14, startingBidCents: 60000 },     // $600
  { name: 'Neptune', week: 16, startingBidCents: 35000 },    // $350
  { name: 'Uranus', week: 18, startingBidCents: 30000 },     // $300
  { name: 'Andromeda Galaxy', week: 20, startingBidCents: 250000 }, // $2,500
  { name: 'Milky Way', week: 22, startingBidCents: 300000 }, // $3,000
  { name: 'Orion Nebula', week: 24, startingBidCents: 100000 }, // $1,000
  { name: 'Crab Nebula', week: 26, startingBidCents: 80000 },   // $800
  { name: 'Ring Nebula', week: 28, startingBidCents: 70000 },   // $700
  { name: 'Horsehead Nebula', week: 30, startingBidCents: 120000 }, // $1,200
  { name: 'Eagle Nebula', week: 32, startingBidCents: 90000 },  // $900
  { name: 'Helix Nebula', week: 34, startingBidCents: 85000 },  // $850
  { name: 'Whirlpool Galaxy', week: 36, startingBidCents: 150000 }, // $1,500
  { name: 'Sombrero Galaxy', week: 38, startingBidCents: 180000 }, // $1,800
  { name: 'Triangulum Galaxy', week: 40, startingBidCents: 200000 }, // $2,000
];

async function main() {
  console.log('🔒 Reserving 20 celestial objects for premium auctions...\n');

  let reserved = 0;
  let notFound = 0;

  for (const objectName of AUCTION_RESERVED_OBJECTS) {
    // Try to find the NFT by name (case-insensitive partial match)
    const nft = await prisma.nFT.findFirst({
      where: {
        OR: [
          { name: { equals: objectName, mode: 'insensitive' } },
          { name: { contains: objectName, mode: 'insensitive' } },
        ],
      },
    });

    if (nft) {
      // Mark as AUCTION_RESERVED
      await prisma.nFT.update({
        where: { id: nft.id },
        data: { status: 'AUCTION_RESERVED' },
      });

      const schedule = AUCTION_SCHEDULE.find(s => s.name === objectName);
      const auctionInfo = schedule
        ? ` (Week ${schedule.week}, $${(schedule.startingBidCents / 100).toLocaleString()} starting bid)`
        : '';

      console.log(`✓ Reserved: ${nft.name} (ID: ${nft.id}, Score: ${nft.cosmicScore})${auctionInfo}`);
      reserved++;
    } else {
      console.log(`✗ Not found: ${objectName}`);
      notFound++;
    }
  }

  console.log('\n════════════════════════════════════════════');
  console.log(`Reserved: ${reserved} NFTs`);
  console.log(`Not found: ${notFound} objects`);
  console.log('════════════════════════════════════════════');

  if (notFound > 0) {
    console.log('\n⚠️  Some objects were not found in the database.');
    console.log('   Make sure to run the seed script first to populate NFTs.');
  }

  // Show auction schedule
  console.log('\n📅 Auction Schedule:');
  console.log('────────────────────────────────────────────');
  for (const auction of AUCTION_SCHEDULE) {
    console.log(`   Week ${auction.week.toString().padStart(2)}: ${auction.name.padEnd(20)} - $${(auction.startingBidCents / 100).toLocaleString()}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
