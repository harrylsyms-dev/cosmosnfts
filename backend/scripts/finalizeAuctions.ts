import { PrismaClient } from '@prisma/client';
import { auctionService } from '../src/services/auction.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking for ended auctions to finalize...');

  try {
    // Find all ended but not finalized auctions
    const endedAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          lt: new Date(),
        },
      },
    });

    if (endedAuctions.length === 0) {
      console.log('No auctions to finalize');
      process.exit(0);
    }

    console.log(`Found ${endedAuctions.length} auctions to finalize`);

    let finalized = 0;
    let failed = 0;

    for (const auction of endedAuctions) {
      try {
        console.log(`Finalizing auction: ${auction.nftName}`);
        const result = await auctionService.finalizeAuction(auction.id);

        if (result) {
          console.log(`  Winner: ${result.winner}`);
          console.log(`  Final Price: $${(result.finalPrice / 100).toFixed(2)}`);
          console.log(`  TX Hash: ${result.txHash}`);
        } else {
          console.log(`  No bids - auction ended without winner`);
        }

        finalized++;
      } catch (error) {
        console.error(`  Failed to finalize:`, error);
        failed++;
      }
    }

    console.log(`\nFinalization complete: ${finalized} succeeded, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Auction finalization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
