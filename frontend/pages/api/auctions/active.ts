import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers
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
    const now = new Date();

    // Get active auctions (ACTIVE status and within time range)
    const auctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        startTime: { lte: now },
        endTime: { gt: now },
      },
      include: {
        nft: {
          select: {
            id: true,
            tokenId: true,
            name: true,
            description: true,
            image: true,
            imageIpfsHash: true,
            objectType: true,
            constellation: true,
            totalScore: true,
            cosmicScore: true,
            badgeTier: true,
            fameVisibility: true,
            scientificSignificance: true,
            rarity: true,
            discoveryRecency: true,
            culturalImpact: true,
          },
        },
        bids: {
          orderBy: { timestamp: 'desc' },
          take: 5,
          select: {
            id: true,
            bidAmountCents: true,
            bidderAddress: true,
            timestamp: true,
          },
        },
      },
      orderBy: { endTime: 'asc' },
    });

    // Format the response
    const formattedAuctions = auctions.map((auction: any) => ({
      id: auction.id,
      tokenId: auction.tokenId,
      nftName: auction.nftName,
      startingBidCents: auction.startingBidCents,
      currentBidCents: auction.currentBidCents,
      highestBidderAddress: auction.highestBidderAddress,
      status: auction.status,
      startTime: auction.startTime.toISOString(),
      endTime: auction.endTime.toISOString(),
      timeRemaining: Math.max(0, auction.endTime.getTime() - now.getTime()),
      bidCount: auction.bids.length,
      nft: auction.nft
        ? {
            id: auction.nft.id,
            tokenId: auction.nft.tokenId,
            name: auction.nft.name,
            description: auction.nft.description,
            image:
              auction.nft.image ||
              (auction.nft.imageIpfsHash
                ? `https://gateway.pinata.cloud/ipfs/${auction.nft.imageIpfsHash}`
                : null),
            objectType: auction.nft.objectType,
            constellation: auction.nft.constellation,
            cosmicScore: auction.nft.cosmicScore || auction.nft.totalScore,
            badgeTier: auction.nft.badgeTier,
            scores: {
              fame: auction.nft.fameVisibility || 0,
              significance: auction.nft.scientificSignificance || 0,
              rarity: auction.nft.rarity || 0,
              discoveryRecency: auction.nft.discoveryRecency || 0,
              culturalImpact: auction.nft.culturalImpact || 0,
            },
          }
        : null,
      recentBids: auction.bids.map((bid: any) => ({
        id: bid.id,
        amountCents: bid.bidAmountCents,
        bidderAddress: bid.bidderAddress
          ? `${bid.bidderAddress.slice(0, 6)}...${bid.bidderAddress.slice(-4)}`
          : null,
        timestamp: bid.timestamp.toISOString(),
      })),
    }));

    res.json({
      success: true,
      count: formattedAuctions.length,
      auctions: formattedAuctions,
    });
  } catch (error: any) {
    console.error('Error fetching active auctions:', error);
    res.status(500).json({
      error: 'Failed to fetch active auctions',
      details: error?.message,
    });
  }
}
