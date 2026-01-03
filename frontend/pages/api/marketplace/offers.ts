import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user token
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

    // Check marketplace settings
    const settings = await prisma.marketplaceSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings?.offersEnabled) {
      return res.status(400).json({ error: 'Offers are currently disabled' });
    }

    const { listingId, tokenId, offerAmountCents, expiresInDays = 7 } = req.body;

    // Validate required fields
    if (!offerAmountCents || offerAmountCents < 100) {
      return res.status(400).json({ error: 'Offer amount must be at least $1.00' });
    }

    // Must have either listingId or tokenId
    if (!listingId && !tokenId) {
      return res.status(400).json({ error: 'Listing ID or Token ID required' });
    }

    // Calculate expiration date
    const maxExpireDays = settings.maxOfferExpireDays || 30;
    const actualExpireDays = Math.min(expiresInDays, maxExpireDays);
    const expiresAt = new Date(Date.now() + actualExpireDays * 24 * 60 * 60 * 1000);

    let listing = null;
    let nftTokenId = tokenId;

    // If listingId provided, verify it exists and is active
    if (listingId) {
      listing = await prisma.listing.findUnique({
        where: { id: listingId },
        include: { nft: true },
      });

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      if (listing.status !== 'ACTIVE') {
        return res.status(400).json({ error: 'Listing is no longer active' });
      }

      nftTokenId = listing.tokenId;

      // Cannot make offer on own listing
      if (listing.sellerAddress.toLowerCase() === session.user.walletAddress.toLowerCase()) {
        return res.status(400).json({ error: 'Cannot make offer on your own listing' });
      }
    } else {
      // If tokenId provided, verify the NFT exists
      const nft = await prisma.nFT.findUnique({
        where: { tokenId },
      });

      if (!nft) {
        return res.status(404).json({ error: 'NFT not found' });
      }

      // Cannot make offer on own NFT
      if (nft.ownerAddress?.toLowerCase() === session.user.walletAddress.toLowerCase()) {
        return res.status(400).json({ error: 'Cannot make offer on your own NFT' });
      }

      // Check if there's an active listing for this token
      listing = await prisma.listing.findFirst({
        where: {
          tokenId,
          status: 'ACTIVE',
        },
      });
    }

    // Check for existing pending offer from this user
    const existingOffer = await prisma.offer.findFirst({
      where: {
        tokenId: nftTokenId,
        offererAddress: session.user.walletAddress.toLowerCase(),
        status: { in: ['PENDING', 'COUNTERED'] },
      },
    });

    if (existingOffer) {
      return res.status(400).json({
        error: 'You already have a pending offer on this NFT. Cancel it first to make a new offer.',
        existingOfferId: existingOffer.id,
      });
    }

    // Create the offer
    const offer = await prisma.offer.create({
      data: {
        listingId: listing?.id || null,
        tokenId: nftTokenId,
        offererAddress: session.user.walletAddress.toLowerCase(),
        offererEmail: session.user.email,
        offerAmountCents,
        status: 'PENDING',
        expiresAt,
      },
    });

    res.json({
      success: true,
      offer: {
        id: offer.id,
        tokenId: offer.tokenId,
        offerAmountCents: offer.offerAmountCents,
        offerDisplay: `$${(offer.offerAmountCents / 100).toFixed(2)}`,
        status: offer.status,
        expiresAt: offer.expiresAt.toISOString(),
        createdAt: offer.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Failed to create offer:', error);
    res.status(500).json({ error: 'Failed to create offer' });
  }
}
