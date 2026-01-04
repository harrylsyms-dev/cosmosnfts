import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
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

    const { confirmation, includeOwned = false } = req.body;

    // Require explicit confirmation
    if (confirmation !== 'DELETE_ALL_NFTS') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Send { confirmation: "DELETE_ALL_NFTS" } to confirm deletion',
      });
    }

    // Count NFTs before deletion
    const countBefore = await prisma.nFT.count();
    const ownedCount = await prisma.nFT.count({
      where: {
        OR: [
          { status: { in: ['SOLD', 'MINTED', 'RESERVED', 'AUCTION_RESERVED', 'AUCTIONED'] } },
          { ownerAddress: { not: null } },
        ],
      },
    });

    let deletedCount = 0;

    if (includeOwned) {
      // Warning: This deletes everything including owned NFTs
      // First delete related records in order of dependencies
      await prisma.cartItem.deleteMany({});
      await prisma.auctionBid.deleteMany({});
      await prisma.auctionHistory.deleteMany({});
      await prisma.auction.deleteMany({});
      await prisma.offer.deleteMany({});
      await prisma.trade.deleteMany({});
      await prisma.listing.deleteMany({});
      await prisma.purchase.deleteMany({});

      // Then delete all NFTs
      const result = await prisma.nFT.deleteMany({});
      deletedCount = result.count;
    } else {
      // Only delete unowned NFTs (safe mode)
      // First remove any cart items referencing these NFTs
      const unownedNFTs = await prisma.nFT.findMany({
        where: {
          status: 'AVAILABLE',
          ownerAddress: null,
        },
        select: { id: true },
      });

      const unownedIds = unownedNFTs.map((n: { id: number }) => n.id);

      await prisma.cartItem.deleteMany({
        where: { nftId: { in: unownedIds } },
      });

      const result = await prisma.nFT.deleteMany({
        where: {
          status: 'AVAILABLE',
          ownerAddress: null,
        },
      });
      deletedCount = result.count;
    }

    // Log the action
    console.log(`Admin ${admin.email} cleared NFTs: ${deletedCount} deleted (includeOwned: ${includeOwned})`);

    res.json({
      success: true,
      message: `Deleted ${deletedCount} NFTs`,
      countBefore,
      countDeleted: deletedCount,
      ownedPreserved: includeOwned ? 0 : ownedCount,
      countAfter: countBefore - deletedCount,
    });
  } catch (error: any) {
    console.error('Failed to clear NFTs:', error);
    res.status(500).json({ error: 'Failed to clear NFTs', details: error?.message });
  }
}
