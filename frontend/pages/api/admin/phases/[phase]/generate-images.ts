import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

/**
 * Admin API: Start image generation for a phase
 * POST /api/admin/phases/[phaseId]/generate-images
 *
 * This endpoint initiates the image generation process for all NFTs in a phase
 * that don't have images yet. It transitions the phase to GENERATING status.
 *
 * The actual generation is handled by a background process or cron job.
 * This endpoint just marks NFTs as needing generation and updates phase status.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
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

    const { phase: phaseId } = req.query;

    if (!phaseId || typeof phaseId !== 'string') {
      return res.status(400).json({ error: 'Phase ID is required' });
    }

    // Get phase
    const phaseData = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: {
        series: {
          select: { seriesNumber: true },
        },
      },
    });

    if (!phaseData) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Phase must be PENDING to start generation
    if (phaseData.status !== 'PENDING') {
      return res.status(400).json({
        error: 'Phase cannot start generation',
        currentStatus: phaseData.status,
        message: 'Only PENDING phases can start image generation',
      });
    }

    // Count NFTs that need images
    const nftsNeedingImages = await prisma.nFT.count({
      where: {
        phaseId,
        imageReviewStatus: 'PENDING_GENERATION',
      },
    });

    // Count NFTs that already have images (need review)
    const nftsWithImages = await prisma.nFT.count({
      where: {
        phaseId,
        image: { not: null },
        imageReviewStatus: 'PENDING_GENERATION',
      },
    });

    // For NFTs that already have images, mark them as pending review
    if (nftsWithImages > 0) {
      // Get all NFTs with existing images and assign queue positions
      const existingImageNFTs = await prisma.nFT.findMany({
        where: {
          phaseId,
          image: { not: null },
          imageReviewStatus: 'PENDING_GENERATION',
        },
        select: { id: true },
        orderBy: { totalScore: 'desc' }, // Review highest scoring first
      });

      // Update each NFT with a queue position
      for (let i = 0; i < existingImageNFTs.length; i++) {
        await prisma.nFT.update({
          where: { id: existingImageNFTs[i].id },
          data: {
            imageReviewStatus: 'PENDING_REVIEW',
            reviewQueuePosition: i + 1,
          },
        });
      }
    }

    // NFTs without images remain as PENDING_GENERATION for now
    // They will be processed by the image generation cron job

    // Update phase status
    const newStatus = nftsNeedingImages - nftsWithImages > 0 ? 'GENERATING' : 'PENDING_REVIEW';

    await prisma.phase.update({
      where: { id: phaseId },
      data: {
        status: newStatus,
        pendingReviewCount: nftsWithImages,
      },
    });

    // Log audit
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'PHASE_GENERATE_IMAGES',
          details: JSON.stringify({
            phaseId,
            phaseNumber: phaseData.phaseNumber,
            seriesNumber: phaseData.series.seriesNumber,
            nftsNeedingGeneration: nftsNeedingImages - nftsWithImages,
            nftsReadyForReview: nftsWithImages,
            newStatus,
          }),
        },
      });
    } catch {
      // Audit log might not exist
    }

    res.json({
      success: true,
      message: `Image generation initiated for Series ${phaseData.series.seriesNumber} Phase ${phaseData.phaseNumber}`,
      phaseId,
      phaseNumber: phaseData.phaseNumber,
      seriesNumber: phaseData.series.seriesNumber,
      status: newStatus,
      stats: {
        totalNFTs: phaseData.totalNFTs,
        needingGeneration: nftsNeedingImages - nftsWithImages,
        readyForReview: nftsWithImages,
      },
    });
  } catch (error: any) {
    console.error('Error starting image generation:', error);
    res.status(500).json({ error: 'Failed to start image generation', details: error?.message });
  }
}
