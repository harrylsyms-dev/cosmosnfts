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
    // Parse query parameters for pagination
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    // Get completed auctions (ENDED or FINALIZED status)
    const [auctions, totalCount] = await Promise.all([
      prisma.auction.findMany({
        where: {
          status: { in: ['ENDED', 'FINALIZED'] },
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
            },
          },
          bids: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            select: {
              bidderAddress: true,
              bidderEmail: true,
            },
          },
        },
        orderBy: { endTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auction.count({
        where: {
          status: { in: ['ENDED', 'FINALIZED'] },
        },
      }),
    ]);

    // Also get auction history records for additional context
    let auctionHistoryRecords: any[] = [];
    try {
      auctionHistoryRecords = await prisma.auctionHistory.findMany({
        orderBy: { auctionDate: 'desc' },
        take: 100,
      });
    } catch {
      // AuctionHistory table might not have data
    }

    // Create a map for quick lookup
    const historyMap = new Map(
      auctionHistoryRecords.map((h: any) => [h.tokenId, h])
    );

    // Format the response
    const formattedAuctions = auctions.map((auction: any) => {
      const historyRecord = historyMap.get(auction.tokenId);
      const winningBid = auction.bids[0];

      return {
        id: auction.id,
        tokenId: auction.tokenId,
        nftName: auction.nftName,
        startingBidCents: auction.startingBidCents,
        finalBidCents: auction.currentBidCents,
        winnerAddress: auction.highestBidderAddress
          ? `${auction.highestBidderAddress.slice(0, 6)}...${auction.highestBidderAddress.slice(-4)}`
          : null,
        status: auction.status,
        startTime: auction.startTime.toISOString(),
        endTime: auction.endTime.toISOString(),
        blockchainHash: historyRecord?.blockchainHash || null,
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
            }
          : null,
      };
    });

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      count: formattedAuctions.length,
      total: totalCount,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      auctions: formattedAuctions,
    });
  } catch (error: any) {
    console.error('Error fetching auction history:', error);
    res.status(500).json({
      error: 'Failed to fetch auction history',
      details: error?.message,
    });
  }
}
