import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../../lib/adminAuth';
import { recalculateAllScores, recalculateNFTScore } from '../../../../lib/scoring';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { nftId, batchSize = 100 } = req.body;

    // If specific NFT ID provided, recalculate just that one
    if (nftId) {
      const id = parseInt(nftId);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid NFT ID' });
      }

      const scoreBreakdown = await recalculateNFTScore(id);
      return res.json({
        success: true,
        message: `Recalculated score for NFT #${id}`,
        scoreBreakdown,
      });
    }

    // Otherwise recalculate all NFTs
    console.log('Starting full score recalculation...');
    const result = await recalculateAllScores(batchSize);

    res.json({
      success: true,
      message: `Recalculated scores for ${result.processed} NFTs`,
      processed: result.processed,
      errors: result.errors,
    });
  } catch (error: any) {
    console.error('Failed to recalculate scores:', error);
    res.status(500).json({
      error: 'Failed to recalculate scores',
      message: error?.message || 'Unknown error',
    });
  }
}
