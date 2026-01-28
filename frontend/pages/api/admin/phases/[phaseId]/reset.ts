import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phaseId } = req.query;

  if (!phaseId || typeof phaseId !== 'string') {
    return res.status(400).json({ error: 'Phase ID is required' });
  }

  try {
    // Verify phase exists
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        series: { select: { seriesNumber: true } },
      },
    });

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Reset all NFTs in this phase to PENDING_GENERATION
    // Clear any images that may have been generated
    const resetResult = await prisma.nFT.updateMany({
      where: { phaseId },
      data: {
        imageReviewStatus: 'PENDING_GENERATION',
        reviewedAt: null,
        reviewedBy: null,
        rejectionCount: 0,
        rejectionReason: null,
        reviewQueuePosition: null,
        // Optionally clear images too - uncomment if you want full reset
        // image: null,
        // imageIpfsHash: null,
      },
    });

    // Reset phase status to PENDING
    await prisma.phase.update({
      where: { id: phaseId },
      data: {
        status: 'PENDING',
        approvedCount: 0,
        pendingReviewCount: 0,
        rejectedCount: 0,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Reset ${resetResult.count} NFTs to PENDING_GENERATION`,
      phase: {
        id: phaseId,
        seriesNumber: phase.series.seriesNumber,
        phaseNumber: phase.phaseNumber,
        status: 'PENDING',
      },
    });
  } catch (error) {
    console.error('Error resetting phase:', error);
    return res.status(500).json({ error: 'Failed to reset phase' });
  }
}
