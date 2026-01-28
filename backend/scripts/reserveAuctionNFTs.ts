import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Reserve the top 20 NFTs (by score) for premium auctions.
 * These are the MYTHIC tier items and will NOT be included in regular phase sales.
 *
 * The auction schedule spreads them across 40 weeks (one every 2 weeks).
 */

// Base starting bids based on tier rank
// Top items get higher starting bids
function getStartingBid(rank: number): number {
  if (rank <= 3) return 300000;   // $3,000 - Top 3
  if (rank <= 5) return 200000;   // $2,000 - Rank 4-5
  if (rank <= 10) return 150000;  // $1,500 - Rank 6-10
  if (rank <= 15) return 100000;  // $1,000 - Rank 11-15
  return 75000;                    // $750 - Rank 16-20
}

async function main() {
  console.log('🔒 Reserving top 20 NFTs (MYTHIC tier) for premium auctions...\n');

  // Get top 20 NFTs by score
  const topNFTs = await prisma.nFT.findMany({
    orderBy: { totalScore: 'desc' },
    take: 20,
    select: {
      id: true,
      tokenId: true,
      name: true,
      totalScore: true,
      badgeTier: true,
      objectType: true,
    },
  });

  if (topNFTs.length === 0) {
    console.log('❌ No NFTs found in database. Run the seed script first.');
    return;
  }

  console.log(`Found ${topNFTs.length} top-scoring NFTs:\n`);

  // Reserve each and create auction schedule
  const auctionSchedule: Array<{
    name: string;
    week: number;
    startingBidCents: number;
    score: number;
    id: number;
  }> = [];

  for (let i = 0; i < topNFTs.length; i++) {
    const nft = topNFTs[i];
    const rank = i + 1;
    const week = rank * 2; // One auction every 2 weeks
    const startingBidCents = getStartingBid(rank);

    // Update NFT to be auction reserved and MYTHIC tier
    await prisma.nFT.update({
      where: { id: nft.id },
      data: {
        status: 'AUCTION_RESERVED',
        nftStatus: 'AUCTION_ACTIVE',
        badgeTier: 'MYTHIC',
        tierMultiplier: 200,
        tierRank: rank,
        isAuctionItem: true,
      },
    });

    auctionSchedule.push({
      name: nft.name,
      week,
      startingBidCents,
      score: nft.totalScore,
      id: nft.id,
    });

    console.log(
      `✓ #${rank.toString().padStart(2)} ${nft.name.padEnd(30)} ` +
      `Score: ${nft.totalScore.toString().padStart(3)} | ` +
      `Week ${week.toString().padStart(2)} | ` +
      `$${(startingBidCents / 100).toLocaleString()}`
    );
  }

  // Clear auction reservations from any NFTs not in top 20
  const topIds = topNFTs.map(n => n.id);
  const clearedResult = await prisma.nFT.updateMany({
    where: {
      status: 'AUCTION_RESERVED',
      id: { notIn: topIds },
    },
    data: {
      status: 'AVAILABLE',
      nftStatus: 'AVAILABLE',
      isAuctionItem: false,
    },
  });

  console.log('\n════════════════════════════════════════════════════════');
  console.log(`Reserved: ${topNFTs.length} MYTHIC NFTs for auction`);
  if (clearedResult.count > 0) {
    console.log(`Cleared: ${clearedResult.count} old auction reservations`);
  }
  console.log('════════════════════════════════════════════════════════');

  // Show auction schedule summary
  console.log('\n📅 Auction Schedule (Top 20 by Score):');
  console.log('────────────────────────────────────────────────────────');
  for (const auction of auctionSchedule) {
    console.log(
      `   Week ${auction.week.toString().padStart(2)}: ` +
      `${auction.name.padEnd(30)} ` +
      `Score: ${auction.score.toString().padStart(3)} | ` +
      `$${(auction.startingBidCents / 100).toLocaleString()}`
    );
  }

  // Export schedule for use elsewhere
  console.log('\n📝 Auction schedule exported as AUCTION_SCHEDULE');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Export for use in other modules
export const getAuctionSchedule = async () => {
  const topNFTs = await prisma.nFT.findMany({
    where: { badgeTier: 'MYTHIC' },
    orderBy: { totalScore: 'desc' },
    select: {
      id: true,
      tokenId: true,
      name: true,
      totalScore: true,
    },
  });

  return topNFTs.map((nft, i) => ({
    name: nft.name,
    week: (i + 1) * 2,
    startingBidCents: getStartingBid(i + 1),
    tokenId: nft.tokenId,
    id: nft.id,
  }));
};
