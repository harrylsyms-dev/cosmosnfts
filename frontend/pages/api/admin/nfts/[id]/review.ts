import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

/**
 * Admin API: Submit review decision for an NFT
 * POST /api/admin/nfts/[id]/review
 *
 * Body:
 * - action: 'approve' | 'reject'
 * - reason?: string (required for rejection)
 *
 * On rejection:
 * - Updates NFT status to REJECTED
 * - Increments rejection count
 * - Stores rejection reason
 * - Triggers regeneration automatically
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

    const { id } = req.query;
    const nftId = parseInt(id as string);

    if (isNaN(nftId)) {
      return res.status(400).json({ error: 'Invalid NFT ID' });
    }

    const { action, reason } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "approve" or "reject"' });
    }

    if (action === 'reject' && !reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get NFT with phase info
    const nft = await prisma.nFT.findUnique({
      where: { id: nftId },
      include: {
        phase: true,
      },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    if (nft.imageReviewStatus !== 'PENDING_REVIEW') {
      return res.status(400).json({
        error: 'NFT is not pending review',
        currentStatus: nft.imageReviewStatus,
      });
    }

    if (action === 'approve') {
      // Approve the NFT
      await prisma.nFT.update({
        where: { id: nftId },
        data: {
          imageReviewStatus: 'APPROVED',
          reviewedAt: new Date(),
          reviewedBy: admin.email,
          reviewQueuePosition: null, // Remove from queue
        },
      });

      // Update phase approved count
      if (nft.phaseId) {
        await prisma.phase.update({
          where: { id: nft.phaseId },
          data: {
            approvedCount: { increment: 1 },
            pendingReviewCount: { decrement: 1 },
          },
        });

        // Check if all NFTs are approved
        const pendingCount = await prisma.nFT.count({
          where: {
            phaseId: nft.phaseId,
            imageReviewStatus: { not: 'APPROVED' },
          },
        });

        // If all approved, we could auto-transition phase status
        // But we leave that to the activate endpoint for explicit control
      }

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'NFT_REVIEW_APPROVE',
            details: JSON.stringify({
              nftId,
              nftName: nft.name,
              phaseId: nft.phaseId,
            }),
          },
        });
      } catch {
        // Audit log might not exist
      }

      res.json({
        success: true,
        action: 'approved',
        nftId,
        nftName: nft.name,
      });
    } else {
      // Reject the NFT
      // Get max queue position for this phase to add to end of queue
      const maxPosition = await prisma.nFT.aggregate({
        where: { phaseId: nft.phaseId },
        _max: { reviewQueuePosition: true },
      });
      const newQueuePosition = (maxPosition._max.reviewQueuePosition || 0) + 1;

      await prisma.nFT.update({
        where: { id: nftId },
        data: {
          imageReviewStatus: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: admin.email,
          rejectionCount: { increment: 1 },
          rejectionReason: reason,
          reviewQueuePosition: newQueuePosition, // Will be set when regeneration completes
        },
      });

      // Update phase rejected count
      if (nft.phaseId) {
        await prisma.phase.update({
          where: { id: nft.phaseId },
          data: {
            rejectedCount: { increment: 1 },
            pendingReviewCount: { decrement: 1 },
          },
        });
      }

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'NFT_REVIEW_REJECT',
            details: JSON.stringify({
              nftId,
              nftName: nft.name,
              phaseId: nft.phaseId,
              reason,
              rejectionCount: (nft.rejectionCount || 0) + 1,
            }),
          },
        });
      } catch {
        // Audit log might not exist
      }

      res.json({
        success: true,
        action: 'rejected',
        nftId,
        nftName: nft.name,
        reason,
        rejectionCount: (nft.rejectionCount || 0) + 1,
        message: 'NFT rejected. Use the regenerate endpoint to create a new image.',
      });
    }
  } catch (error: any) {
    console.error('Error reviewing NFT:', error);
    res.status(500).json({ error: 'Failed to review NFT', details: error?.message });
  }
}
