import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

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

async function getCurrentWeek(): Promise<number> {
  try {
    const phase1 = await prisma.tier.findFirst({
      where: { phase: 1 },
    });

    if (!phase1) return 1;

    const launchDate = phase1.startTime;
    const now = new Date();
    const diffMs = now.getTime() - launchDate.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

    return Math.max(1, diffWeeks + 1);
  } catch {
    return 1;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
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

    const currentWeek = await getCurrentWeek();

    // Get all NFTs that might be auction reserved
    // Use contains search to match names with catalog designations like "Horsehead Nebula (B33)"
    const reservedNFTs = await prisma.nFT.findMany({
      where: {
        OR: [
          { status: 'AUCTION_RESERVED' },
          ...AUCTION_SCHEDULE.map(a => ({ name: { contains: a.name, mode: 'insensitive' as const } })),
        ],
      },
      select: {
        id: true,
        tokenId: true,
        name: true,
        totalScore: true,
        objectType: true,
        image: true,
        imageIpfsHash: true,
        description: true,
        fameVisibility: true,
        scientificSignificance: true,
        rarity: true,
        discoveryRecency: true,
        culturalImpact: true,
      },
    });

    // Get existing auctions
    const existingAuctions = await prisma.auction.findMany({
      select: {
        nftName: true,
        status: true,
        id: true,
        startTime: true,
        endTime: true,
        currentBidCents: true,
      },
    });

    // Get price overrides
    let priceOverrides: { name: string; startingBidCents: number }[] = [];
    try {
      priceOverrides = await prisma.auctionScheduleOverride.findMany();
    } catch {
      // Table might not exist
    }
    const overrideMap = new Map(priceOverrides.map(o => [o.name.toLowerCase(), o.startingBidCents]));

    // Map auction schedule with NFT details
    const schedule = AUCTION_SCHEDULE.map((item) => {
      const nft = reservedNFTs.find(
        (n: { name: string }) =>
          n.name.toLowerCase() === item.name.toLowerCase() ||
          n.name.toLowerCase().includes(item.name.toLowerCase())
      );

      const existingAuction = existingAuctions.find(
        (a: { nftName: string }) =>
          a.nftName.toLowerCase() === item.name.toLowerCase() ||
          a.nftName.toLowerCase().includes(item.name.toLowerCase())
      );

      const effectivePrice = overrideMap.get(item.name.toLowerCase()) ?? item.startingBidCents;

      return {
        name: item.name,
        week: item.week,
        startingBidCents: effectivePrice,
        startingBidDisplay: `$${(effectivePrice / 100).toLocaleString()}`,
        weeksUntil: Math.max(0, item.week - currentWeek),
        status: existingAuction
          ? existingAuction.status
          : item.week <= currentWeek
          ? 'READY'
          : 'SCHEDULED',
        existingAuctionId: existingAuction?.id || null,
        finalPriceCents: existingAuction?.status === 'FINALIZED' ? existingAuction.currentBidCents : null,
        nft: nft
          ? {
              id: nft.id,
              tokenId: nft.tokenId,
              name: nft.name,
              cosmicScore: nft.totalScore,
              objectType: nft.objectType,
              image: nft.image || (nft.imageIpfsHash
                ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}`
                : null),
              description: nft.description,
              scores: {
                fame: nft.fameVisibility || 0,
                significance: nft.scientificSignificance || 0,
                rarity: nft.rarity || 0,
                discoveryRecency: nft.discoveryRecency || 0,
                culturalImpact: nft.culturalImpact || 0,
              },
            }
          : null,
      };
    });

    res.json({
      success: true,
      currentWeek,
      totalScheduled: AUCTION_SCHEDULE.length,
      schedule,
    });
  } catch (error: any) {
    console.error('Error fetching scheduled auctions:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled auctions', details: error?.message });
  }
}
