import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
      select: {
        id: true,
        name: true,
        objectType: true,
        totalScore: true,
        imagePrompt: true,
        imageNegativePrompt: true,
        promptGeneratedAt: true,
      },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Return the stored prompts (generated at NFT creation time)
    if (!nft.imagePrompt) {
      return res.status(404).json({
        error: 'No prompt found',
        message: 'This NFT does not have a pre-generated prompt. It may have been created before the prompt system was implemented.',
      });
    }

    res.json({
      success: true,
      nftId: nft.id,
      nftName: nft.name,
      objectType: nft.objectType,
      totalScore: nft.totalScore,
      prompt: nft.imagePrompt,
      negativePrompt: nft.imageNegativePrompt || '',
      promptGeneratedAt: nft.promptGeneratedAt,
    });
  } catch (error: any) {
    console.error('Failed to get prompt:', error);
    res.status(500).json({ error: 'Failed to get prompt', details: error?.message });
  }
}
