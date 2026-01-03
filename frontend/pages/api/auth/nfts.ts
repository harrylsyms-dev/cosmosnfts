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

    // Get NFTs owned by this wallet
    const nfts = await prisma.nFT.findMany({
      where: {
        ownerAddress: session.user.walletAddress,
      },
      select: {
        id: true,
        tokenId: true,
        name: true,
        description: true,
        image: true,
        imageIpfsHash: true,
        currentPrice: true,
        totalScore: true,
        cosmicScore: true,
        badgeTier: true,
        transactionHash: true,
        mintedAt: true,
      },
      orderBy: { mintedAt: 'desc' },
    });

    res.json({ nfts });
  } catch (error: any) {
    console.error('Failed to fetch NFTs:', error);
    res.status(500).json({ error: 'Failed to fetch NFTs' });
  }
}
