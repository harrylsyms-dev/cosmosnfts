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

    const { page = '1', limit = '20', status } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {
      offererAddress: session.user.walletAddress.toLowerCase(),
    };

    // Filter by status if provided
    if (status && typeof status === 'string') {
      whereClause.status = status.toUpperCase();
    }

    // Get user's offers with NFT data
    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where: whereClause,
        include: {
          listing: {
            include: {
              nft: {
                select: {
                  id: true,
                  tokenId: true,
                  name: true,
                  image: true,
                  imageIpfsHash: true,
                  totalScore: true,
                  objectType: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.offer.count({ where: whereClause }),
    ]);

    // For offers without a listing, fetch the NFT directly
    const offersWithNft = await Promise.all(
      offers.map(async (offer: any) => {
        let nft = offer.listing?.nft || null;

        // If no listing, fetch NFT directly
        if (!nft) {
          const fetchedNft = await prisma.nFT.findUnique({
            where: { tokenId: offer.tokenId },
            select: {
              id: true,
              tokenId: true,
              name: true,
              image: true,
              imageIpfsHash: true,
              totalScore: true,
              objectType: true,
            },
          });
          nft = fetchedNft;
        }

        return {
          id: offer.id,
          tokenId: offer.tokenId,
          offerAmountCents: offer.offerAmountCents,
          offerDisplay: `$${(offer.offerAmountCents / 100).toFixed(2)}`,
          status: offer.status,
          counterOfferCents: offer.counterOfferCents,
          counterOfferDisplay: offer.counterOfferCents
            ? `$${(offer.counterOfferCents / 100).toFixed(2)}`
            : null,
          expiresAt: offer.expiresAt.toISOString(),
          createdAt: offer.createdAt.toISOString(),
          respondedAt: offer.respondedAt?.toISOString() || null,
          listingId: offer.listingId,
          listingPrice: offer.listing?.priceCents
            ? `$${(offer.listing.priceCents / 100).toFixed(2)}`
            : null,
          nft: nft ? {
            id: nft.id,
            tokenId: nft.tokenId,
            name: nft.name,
            image: nft.image || (nft.imageIpfsHash
              ? `https://gateway.pinata.cloud/ipfs/${nft.imageIpfsHash}`
              : null),
            totalScore: nft.totalScore,
            objectType: nft.objectType,
          } : null,
        };
      })
    );

    res.json({
      offers: offersWithNft,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total,
    });
  } catch (error: any) {
    console.error('Failed to fetch offers:', error);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
}
