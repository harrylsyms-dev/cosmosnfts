import cron from 'node-cron';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { auctionService } from '../services/auction.service';
import { emailService } from '../services/email.service';

// Auction schedule - deployed every 2 weeks
const AUCTION_SCHEDULE = [
  { name: 'Earth', week: 2, startingBidCents: 100000 },
  { name: 'Sun', week: 4, startingBidCents: 200000 },
  { name: 'Moon', week: 6, startingBidCents: 150000 },
  { name: 'Mars', week: 8, startingBidCents: 50000 },
  { name: 'Jupiter', week: 10, startingBidCents: 75000 },
  { name: 'Venus', week: 12, startingBidCents: 40000 },
  { name: 'Saturn', week: 14, startingBidCents: 60000 },
  { name: 'Neptune', week: 16, startingBidCents: 35000 },
  { name: 'Uranus', week: 18, startingBidCents: 30000 },
  { name: 'Andromeda Galaxy', week: 20, startingBidCents: 250000 },
  { name: 'Milky Way', week: 22, startingBidCents: 300000 },
  { name: 'Orion Nebula', week: 24, startingBidCents: 100000 },
  { name: 'Crab Nebula', week: 26, startingBidCents: 80000 },
  { name: 'Ring Nebula', week: 28, startingBidCents: 70000 },
  { name: 'Horsehead Nebula', week: 30, startingBidCents: 120000 },
  { name: 'Eagle Nebula', week: 32, startingBidCents: 90000 },
  { name: 'Helix Nebula', week: 34, startingBidCents: 85000 },
  { name: 'Whirlpool Galaxy', week: 36, startingBidCents: 150000 },
  { name: 'Sombrero Galaxy', week: 38, startingBidCents: 180000 },
  { name: 'Triangulum Galaxy', week: 40, startingBidCents: 200000 },
];

let isRunning = false;

/**
 * Get the current week number since launch
 */
async function getCurrentWeek(): Promise<number> {
  const phase1 = await prisma.tier.findFirst({
    where: { phase: 1 },
  });

  if (!phase1) return 0;

  const launchDate = phase1.startTime;
  const now = new Date();
  const diffMs = now.getTime() - launchDate.getTime();
  const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

  return diffWeeks + 1; // Week 1 is launch week
}

/**
 * Deploy scheduled auction for current week
 */
async function deployScheduledAuction(): Promise<void> {
  const currentWeek = await getCurrentWeek();

  if (currentWeek < 2) {
    logger.debug('Not yet time for first auction (Week 2)');
    return;
  }

  // Find auction scheduled for this week
  const scheduledAuction = AUCTION_SCHEDULE.find(a => a.week === currentWeek);

  if (!scheduledAuction) {
    logger.debug(`No auction scheduled for week ${currentWeek}`);
    return;
  }

  // Check if auction already exists for this object
  const existingAuction = await prisma.auction.findFirst({
    where: {
      nftName: { contains: scheduledAuction.name, mode: 'insensitive' },
      status: { in: ['PENDING', 'ACTIVE'] },
    },
  });

  if (existingAuction) {
    logger.debug(`Auction for ${scheduledAuction.name} already exists`);
    return;
  }

  // Find the NFT
  const nft = await prisma.nFT.findFirst({
    where: {
      OR: [
        { name: { equals: scheduledAuction.name, mode: 'insensitive' } },
        { name: { contains: scheduledAuction.name, mode: 'insensitive' } },
      ],
      status: 'AUCTION_RESERVED',
    },
  });

  if (!nft) {
    logger.warn(`Could not find AUCTION_RESERVED NFT: ${scheduledAuction.name}`);
    return;
  }

  try {
    // Create the auction - 7 day English auction
    const auction = await auctionService.createAuction({
      tokenId: nft.tokenId,
      nftName: nft.name,
      startingBidCents: scheduledAuction.startingBidCents,
      durationDays: 7,
    });

    logger.info(`🎉 Auto-deployed auction: ${nft.name} (Week ${currentWeek})`);
    logger.info(`   Starting bid: $${(scheduledAuction.startingBidCents / 100).toLocaleString()}`);
    logger.info(`   Auction ID: ${auction.id}`);

    // TODO: Send email notification about new auction
    // await emailService.sendNewAuctionNotification(auction);

  } catch (error) {
    logger.error(`Failed to deploy auction for ${scheduledAuction.name}:`, error);
  }
}

/**
 * Finalize any ended auctions
 */
async function finalizeEndedAuctions(): Promise<void> {
  try {
    const endedAuctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: { lt: new Date() },
      },
    });

    for (const auction of endedAuctions) {
      try {
        await auctionService.finalizeAuction(auction.id);
        logger.info(`Finalized auction: ${auction.nftName} (ID: ${auction.id})`);
      } catch (error) {
        logger.error(`Failed to finalize auction ${auction.id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error checking ended auctions:', error);
  }
}

/**
 * Extend auction if bid received in final hour
 */
async function checkAuctionExtensions(): Promise<void> {
  try {
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    // Find auctions ending within the hour that have recent bids
    const auctionsEndingSoon = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          gt: now,
          lt: oneHourFromNow,
        },
      },
      include: {
        bids: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    for (const auction of auctionsEndingSoon) {
      if (auction.bids.length > 0) {
        const lastBid = auction.bids[0];
        const timeSinceLastBid = now.getTime() - lastBid.timestamp.getTime();
        const fiveMinutes = 5 * 60 * 1000;

        // If bid was placed in last 5 minutes and auction ends within an hour
        if (timeSinceLastBid < fiveMinutes) {
          const newEndTime = new Date(auction.endTime.getTime() + 60 * 60 * 1000); // Extend 1 hour

          await prisma.auction.update({
            where: { id: auction.id },
            data: { endTime: newEndTime },
          });

          logger.info(`Extended auction ${auction.nftName} by 1 hour due to late bid`);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking auction extensions:', error);
  }
}

/**
 * Start the auction deployment job
 * Runs every hour to check if it's time to deploy a new auction
 */
export function startAuctionDeploymentJob() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    if (isRunning) {
      logger.debug('Auction deployment job already running, skipping');
      return;
    }

    isRunning = true;

    try {
      // Deploy any scheduled auctions
      await deployScheduledAuction();

      // Finalize ended auctions
      await finalizeEndedAuctions();

      // Check for auction extensions
      await checkAuctionExtensions();
    } catch (error) {
      logger.error('Auction deployment job failed:', error);
    } finally {
      isRunning = false;
    }
  });

  logger.info('Auction deployment job started (runs hourly)');
}

/**
 * Get upcoming auctions schedule
 */
export async function getUpcomingAuctionSchedule() {
  const currentWeek = await getCurrentWeek();

  return AUCTION_SCHEDULE
    .filter(a => a.week >= currentWeek)
    .map(a => ({
      ...a,
      weeksUntil: a.week - currentWeek,
      estimatedDate: getAuctionDate(a.week),
    }));
}

function getAuctionDate(week: number): Date | null {
  // This would calculate based on launch date
  return null; // Placeholder - would be calculated from tier 1 start time
}

export { AUCTION_SCHEDULE, getCurrentWeek };
