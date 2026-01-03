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
    });

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Verify ownership
    if (listing.sellerAddress.toLowerCase() !== session.user.walletAddress.toLowerCase()) {
      return res.status(403).json({ error: 'You can only cancel your own listings' });
    }

    if (listing.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Listing cannot be cancelled' });
    }

    // Cancel the listing
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: 'Listing cancelled successfully',
    });
  } catch (error: any) {
    console.error('Failed to cancel listing:', error);
    res.status(500).json({ error: 'Failed to cancel listing' });
  }
}
