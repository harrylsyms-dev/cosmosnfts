import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// Auction schedule for looking up starting bids
const AUCTION_SCHEDULE: Record<string, number> = {
  'earth': 100000,
  'sun': 200000,
  'moon': 150000,
  'mars': 50000,
  'jupiter': 75000,
  'venus': 40000,
  'saturn': 60000,
  'neptune': 35000,
  'uranus': 30000,
  'andromeda galaxy': 250000,
  'milky way': 300000,
  'orion nebula': 100000,
  'crab nebula': 80000,
  'ring nebula': 70000,
  'horsehead nebula': 120000,
  'eagle nebula': 90000,
  'helix nebula': 85000,
  'whirlpool galaxy': 150000,
  'sombrero galaxy': 180000,
  'triangulum galaxy': 200000,
};

// Get current phase and multiplier
async function getPricingInfo() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
    });

    if (!activeTier) {
      return { currentPhase: 1, currentMultiplier: 1.0, increasePercent: 7.5 };
    }

    const increasePercent = settings?.phaseIncreasePercent || 7.5;
    // Calculate multiplier based on phase and increase percent
    const currentMultiplier = Math.pow(1 + (increasePercent / 100), activeTier.phase - 1);

    return {
      currentPhase: activeTier.phase,
      currentMultiplier,
      increasePercent
    };
  } catch {
    return { currentPhase: 1, currentMultiplier: 1.0, increasePercent: 7.5 };
  }
}

// Get auction starting bid for an NFT name
async function getAuctionStartingBid(nftName: string): Promise<number | null> {
  // Check for price override first
  try {
    const override = await prisma.auctionScheduleOverride.findFirst({
      where: { name: { contains: nftName.split('(')[0].trim(), mode: 'insensitive' } },
    });
    if (override) {
      return override.startingBidCents;
    }
  } catch {
    // Table might not exist
  }

  // Check default schedule
  const baseName = nftName.split('(')[0].trim().toLowerCase();
  for (const [scheduleName, bidCents] of Object.entries(AUCTION_SCHEDULE)) {
    if (baseName.includes(scheduleName) || scheduleName.includes(baseName)) {
      return bidCents;
    }
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { id } = req.query;
    const nftId = parseInt(id as string);

    if (isNaN(nftId)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      // Check if NFT exists
      const existingNft = await prisma.nFT.findUnique({
        where: { id: nftId },
      });

      if (!existingNft) {
        return res.status(404).json({ error: 'NFT not found' });
      }

      // Don't allow deleting sold NFTs
      if (existingNft.status === 'SOLD') {
        return res.status(400).json({ error: 'Cannot delete sold NFTs' });
      }

      // Delete the NFT
      await prisma.nFT.delete({
        where: { id: nftId },
      });

      console.log(`NFT #${nftId} (${existingNft.name}) deleted by admin ${admin.email}`);

      return res.json({
        success: true,
        message: `NFT #${nftId} (${existingNft.name}) has been deleted`,
        deletedNft: {
          id: existingNft.id,
          name: existingNft.name,
          objectType: existingNft.objectType,
        },
      });
    }

    // Get NFT details (GET request)
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Get pricing info
    const { currentPhase, currentMultiplier } = await getPricingInfo();
    const basePrice = 0.10; // $0.10 per score point
    const calculatedPrice = nft.totalScore * basePrice * currentMultiplier;

    // Get auction starting bid if this is an auction-reserved NFT
    let auctionStartingBid: number | null = null;
    let auctionStartingBidDisplay: string | null = null;
    if (nft.status === 'AUCTION_RESERVED' || nft.status === 'AUCTIONED') {
      auctionStartingBid = await getAuctionStartingBid(nft.name);
      if (auctionStartingBid) {
        auctionStartingBidDisplay = `$${(auctionStartingBid / 100).toLocaleString()}`;
      }
    }

    // For auction-reserved NFTs, use auction starting bid as the display price
    const isAuctionNft = nft.status === 'AUCTION_RESERVED' || nft.status === 'AUCTIONED';
    const displayPrice = isAuctionNft && auctionStartingBid
      ? `$${(auctionStartingBid / 100).toLocaleString()}`
      : `$${calculatedPrice.toFixed(2)}`;
    const displayPriceValue = isAuctionNft && auctionStartingBid
      ? auctionStartingBid / 100
      : calculatedPrice;

    // Format response
    const nftDetail = {
      id: nft.id,
      tokenId: nft.tokenId,
      name: nft.name,
      description: nft.description,
      objectType: nft.objectType,
      status: nft.status,
      totalScore: nft.totalScore,
      scores: {
        fameVisibility: nft.fameVisibility || nft.fameScore || 0,
        scientificSignificance: nft.scientificSignificance || nft.significanceScore || 0,
        rarity: nft.rarity || nft.rarityScore || 0,
        discoveryRecency: nft.discoveryRecency || nft.discoveryRecencyScore || 0,
        culturalImpact: nft.culturalImpact || nft.culturalImpactScore || 0,
      },
      discoveryYear: nft.discoveryYear,
      badgeTier: nft.badgeTier,
      currentPrice: displayPriceValue,
      displayPrice,
      priceFormula: isAuctionNft
        ? `Auction Starting Bid`
        : `$0.10 × ${nft.totalScore} Score × ${currentMultiplier.toFixed(2)}x`,
      currentPhase,
      phaseMultiplier: currentMultiplier.toFixed(2),
      // Include both prices for auction NFTs
      auctionStartingBid,
      auctionStartingBidDisplay,
      marketplacePrice: calculatedPrice,
      marketplacePriceDisplay: `$${calculatedPrice.toFixed(2)}`,
      image: nft.image,
      imageIpfsHash: nft.imageIpfsHash,
      metadataIpfsHash: nft.metadataIpfsHash,
      ownerAddress: nft.ownerAddress,
      transactionHash: nft.transactionHash,
      createdAt: nft.createdAt.toISOString(),
      updatedAt: nft.updatedAt.toISOString(),
      mintedAt: nft.mintedAt?.toISOString() || null,
      soldAt: nft.soldAt?.toISOString() || null,
    };

    res.json({ success: true, nft: nftDetail });
  } catch (error: any) {
    console.error('Failed to fetch NFT:', error);
    res.status(500).json({ error: 'Failed to fetch NFT', details: error?.message });
  }
}
