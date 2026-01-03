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

    const { tokenId, priceCents } = req.body;

    if (!tokenId || !priceCents) {
      return res.status(400).json({ error: 'Token ID and price are required' });
    }

    if (priceCents < 100) {
      return res.status(400).json({ error: 'Minimum price is $1.00' });
    }

    // Check marketplace settings
    const settings = await prisma.marketplaceSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings?.listingsEnabled) {
      return res.status(400).json({ error: 'Listings are currently disabled' });
    }

    // Get the NFT
    const nft = await prisma.nFT.findUnique({
      where: { tokenId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Verify ownership
    if (nft.ownerAddress?.toLowerCase() !== session.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'You do not own this NFT' });
    }

    // Check if already listed
    const existingListing = await prisma.listing.findFirst({
      where: {
        tokenId,
        status: 'ACTIVE',
      },
    });

    if (existingListing) {
      return res.status(400).json({ error: 'NFT is already listed' });
    }

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        tokenId,
        nftId: nft.id,
        sellerAddress: session.user.walletAddress.toLowerCase(),
        priceCents,
        status: 'ACTIVE',
      },
    });

    res.json({
      success: true,
      listing: {
        id: listing.id,
        tokenId: listing.tokenId,
        priceCents: listing.priceCents,
        status: listing.status,
      },
    });
  } catch (error: any) {
    console.error('Failed to create listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  }
}
