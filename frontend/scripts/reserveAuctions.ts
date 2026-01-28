import { prisma } from '../lib/prisma';

/**
 * Reserve the top 20 NFTs (MYTHIC tier) for premium auctions.
 * These are the highest-scoring items and will NOT be included in regular phase sales.
 */

// Base starting bids based on tier rank
function getStartingBid(rank: number): number {
  if (rank <= 3) return 300000;   // $3,000 - Top 3
  if (rank <= 5) return 200000;   // $2,000 - Rank 4-5
  if (rank <= 10) return 150000;  // $1,500 - Rank 6-10
  if (rank <= 15) return 100000;  // $1,000 - Rank 11-15
  return 75000;                    // $750 - Rank 16-20
}

async function main() {
  console.log('Reserving top 20 NFTs (MYTHIC tier) for premium auctions...\n');

  // Get top 20 NFTs by score (should already be MYTHIC from tier assignment)
  const topNFTs = await prisma.nFT.findMany({
    where: { badgeTier: 'MYTHIC' },
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
    console.log('No MYTHIC NFTs found. Run tier assignment first.');
    return;
  }

  console.log(`Found ${topNFTs.length} MYTHIC NFTs:\n`);

  // Reserve each and set auction fields
  for (let i = 0; i < topNFTs.length; i++) {
    const nft = topNFTs[i];
    const rank = i + 1;
    const week = rank * 2; // One auction every 2 weeks
    const startingBidCents = getStartingBid(rank);

    // Update NFT to be auction reserved
    await prisma.nFT.update({
      where: { id: nft.id },
      data: {
        status: 'AUCTION_RESERVED',
        nftStatus: 'AUCTION_ACTIVE',
        isAuctionItem: true,
        tierRank: rank,
        tierMultiplier: 200,
      },
    });

    console.log(
      `  #${rank.toString().padStart(2)} ${nft.name.padEnd(35)} ` +
      `Score: ${nft.totalScore.toString().padStart(3)} | ` +
      `Week ${week.toString().padStart(2)} | ` +
      `$${(startingBidCents / 100).toLocaleString()}`
    );
  }

  // Clear auction reservations from any NFTs not in MYTHIC tier
  const mythicIds = topNFTs.map(n => n.id);
  const clearedResult = await prisma.nFT.updateMany({
    where: {
      status: 'AUCTION_RESERVED',
      id: { notIn: mythicIds },
    },
    data: {
      status: 'AVAILABLE',
      nftStatus: 'AVAILABLE',
      isAuctionItem: false,
    },
  });

  console.log('\n========================================');
  console.log(`Reserved: ${topNFTs.length} MYTHIC NFTs for auction`);
  if (clearedResult.count > 0) {
    console.log(`Cleared: ${clearedResult.count} old auction reservations`);
  }
  console.log('========================================');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
