import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
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

    const { id } = req.query;
    const nftId = parseInt(id as string);

    if (isNaN(nftId)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }

    // Get NFT to check status
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Only allow deletion of unowned NFTs
    const ownedStatuses = ['SOLD', 'MINTED', 'RESERVED', 'AUCTION_RESERVED', 'AUCTIONED'];
    if (ownedStatuses.includes(nft.status)) {
      return res.status(400).json({
        error: 'Cannot delete owned NFT',
        message: `This NFT has status "${nft.status}" and cannot be deleted. Only AVAILABLE NFTs can be deleted.`
      });
    }

    // Check if NFT has an owner address
    if (nft.ownerAddress) {
      return res.status(400).json({
        error: 'Cannot delete owned NFT',
        message: 'This NFT has an owner address assigned and cannot be deleted.'
      });
    }

    // Delete the NFT
    await prisma.nFT.delete({
      where: { id: nftId },
    });

    // Log the deletion
    console.log(`NFT #${nftId} (${nft.name}) deleted by admin ${admin.email}`);

    res.json({
      success: true,
      message: `NFT "${nft.name}" has been deleted.`,
      deletedNft: {
        id: nft.id,
        tokenId: nft.tokenId,
        name: nft.name,
        objectType: nft.objectType,
      }
    });
  } catch (error: any) {
    console.error('Failed to delete NFT:', error);
    res.status(500).json({ error: 'Failed to delete NFT', details: error?.message });
  }
}
