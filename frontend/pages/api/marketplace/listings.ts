import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

interface ListingWithNft {
  id: string;
  tokenId: number;
  sellerAddress: string;
  priceCents: number;
  status: string;
  createdAt: Date;
  nft: {
    id: number;
    tokenId: number;
    name: string;
    cosmicScore: number;
    totalScore: number;
    objectType: string | null;
    image: string | null;
    imageIpfsHash: string | null;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { page = '1', limit = '20', sortBy = 'newest' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price_asc':
        orderBy = { priceCents: 'asc' };
        break;
      case 'price_desc':
        orderBy = { priceCents: 'desc' };
        break;
      case 'score_desc':
        orderBy = { nft: { totalScore: 'desc' } };
        break;
    }

    // Get active listings with NFT data
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: { status: 'ACTIVE' },
        include: {
          nft: {
            select: {
              id: true,
              tokenId: true,
              name: true,
              cosmicScore: true,
              totalScore: true,
              objectType: true,
              image: true,
              imageIpfsHash: true,
            },
          },
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.listing.count({ where: { status: 'ACTIVE' } }),
    ]);

    const formattedListings = (listings as ListingWithNft[]).map((listing) => ({
      id: listing.id,
      tokenId: listing.tokenId,
      sellerAddress: listing.sellerAddress,
      priceCents: listing.priceCents,
      status: listing.status,
      createdAt: listing.createdAt.toISOString(),
      nft: {
        id: listing.nft.id.toString(),
        tokenId: listing.nft.tokenId,
        name: listing.nft.name,
        cosmicScore: listing.nft.cosmicScore || listing.nft.totalScore,
        objectType: listing.nft.objectType,
        image: listing.nft.image || (listing.nft.imageIpfsHash
          ? `https://gateway.pinata.cloud/ipfs/${listing.nft.imageIpfsHash}`
          : null),
      },
    }));

    res.json({
      listings: formattedListings,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error: any) {
    console.error('Failed to fetch listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
}
