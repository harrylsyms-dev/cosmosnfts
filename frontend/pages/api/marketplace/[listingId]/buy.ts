import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';

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

    const { listingId } = req.query;

    // Get the listing
    const listing = await prisma.listing.findUnique({
      where: { id: listingId as string },
      include: { nft: true },
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Listing is no longer active' });
    }

    // Can't buy your own listing
    if (listing.sellerAddress.toLowerCase() === session.user.walletAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot buy your own listing' });
    }

    // Check marketplace settings
    const settings = await prisma.marketplaceSettings.findUnique({
      where: { id: 'main' },
    });

    if (!settings?.tradingEnabled) {
      return res.status(400).json({ error: 'Trading is currently disabled' });
    }

    // Create trade record
    const trade = await prisma.trade.create({
      data: {
        listingId: listing.id,
        tokenId: listing.tokenId,
        nftId: listing.nftId,
        sellerAddress: listing.sellerAddress,
        buyerAddress: session.user.walletAddress.toLowerCase(),
        priceCents: listing.priceCents,
        status: 'PENDING_PAYMENT',
      },
    });

    // Update listing status
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: 'PENDING' },
    });

    res.json({
      success: true,
      trade: {
        id: trade.id,
        priceCents: trade.priceCents,
        status: trade.status,
      },
      message: 'Trade initiated. Complete payment to finalize.',
    });
  } catch (error: any) {
    console.error('Failed to buy listing:', error);
    res.status(500).json({ error: 'Failed to process purchase' });
  }
}
