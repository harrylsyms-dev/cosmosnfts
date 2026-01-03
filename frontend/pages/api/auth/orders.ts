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
      return res.status(401).json({ error: 'No token provided' });
    }

    // Find session
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session || new Date() > session.expiresAt) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Get purchases for this wallet
    const purchases = await prisma.purchase.findMany({
      where: {
        walletAddress: session.user.walletAddress,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get NFT details for each purchase
    const ordersWithNfts = await Promise.all(
      purchases.map(async (purchase: { id: string; nftIds: string; totalAmountCents: number; status: string; createdAt: Date; mintedAt: Date | null; transactionHash: string | null }) => {
        const nftIds = JSON.parse(purchase.nftIds || '[]');
        const nfts = await prisma.nFT.findMany({
          where: { id: { in: nftIds } },
          select: {
            id: true,
            tokenId: true,
            name: true,
            image: true,
            currentPrice: true,
            status: true,
            transactionHash: true,
          },
        });

        return {
          id: purchase.id,
          totalAmount: purchase.totalAmountCents / 100,
          status: purchase.status,
          createdAt: purchase.createdAt.toISOString(),
          mintedAt: purchase.mintedAt?.toISOString() || null,
          transactionHash: purchase.transactionHash,
          nfts,
        };
      })
    );

    res.json({ orders: ordersWithNfts });
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}
