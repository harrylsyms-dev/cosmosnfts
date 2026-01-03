import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get user's listings
    const listings = await prisma.listing.findMany({
      where: {
        sellerAddress: session.user.walletAddress.toLowerCase(),
      },
      include: {
        nft: {
          select: {
            id: true,
            tokenId: true,
            name: true,
            image: true,
            imageIpfsHash: true,
            totalScore: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedListings = listings.map((listing: any) => ({
      id: listing.id,
      tokenId: listing.tokenId,
      priceCents: listing.priceCents,
      priceDisplay: `$${(listing.priceCents / 100).toFixed(2)}`,
      status: listing.status,
      createdAt: listing.createdAt.toISOString(),
      nft: {
        id: listing.nft.id,
        name: listing.nft.name,
        image: listing.nft.image || (listing.nft.imageIpfsHash
          ? `https://gateway.pinata.cloud/ipfs/${listing.nft.imageIpfsHash}`
          : null),
        totalScore: listing.nft.totalScore,
      },
    }));

    res.json({ listings: formattedListings });
  } catch (error: any) {
    console.error('Failed to fetch listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
}
