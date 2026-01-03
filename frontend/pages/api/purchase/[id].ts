import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    const purchase = await prisma.purchase.findUnique({
      where: { id: id as string },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    // Fetch NFT details
    const nftIds = JSON.parse(purchase.nftIds) as number[];
    const nfts = await prisma.nFT.findMany({
      where: { id: { in: nftIds } },
    });

    res.json({
      transactionId: purchase.id,
      status: purchase.status.toLowerCase(),
      email: purchase.email,
      totalAmount: purchase.totalAmountCents / 100,
      nfts: nfts.map((nft: { tokenId: number; name: string; transactionHash: string | null }) => ({
        tokenId: nft.tokenId,
        name: nft.name,
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        transactionHash: nft.transactionHash,
      })),
      mintedAt: purchase.mintedAt?.getTime() || null,
      createdAt: purchase.createdAt.getTime(),
    });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ error: 'Failed to fetch purchase' });
  }
}
