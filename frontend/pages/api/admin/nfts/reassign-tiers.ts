import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';
import { assignTiers, TIER_DISTRIBUTION, TIER_MULTIPLIERS } from '../../../../lib/tierAssignment';

/**
 * Admin API: Reassign tiers based on score ranking
 * POST /api/admin/nfts/reassign-tiers
 *
 * This endpoint:
 * 1. Assigns tiers to ALL NFTs based on score ranking (top 20 = MYTHIC, etc.)
 * 2. Marks all MYTHIC tier NFTs as auction reserved
 * 3. Clears any previous auction reservations that are no longer MYTHIC
 *
 * Query params:
 * - dryRun=true: Preview changes without updating database
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

    const dryRun = req.query.dryRun === 'true';

    console.log(`Starting tier reassignment (dryRun: ${dryRun})...`);

    // Step 1: Run tier assignment
    const { assignments, stats } = await assignTiers(prisma, dryRun);

    // Step 2: Get the MYTHIC tier NFTs (top 20 by score)
    const mythicNFTs = assignments.filter(a => a.badgeTier === 'MYTHIC');

    console.log(`\nMYTHIC tier NFTs (${mythicNFTs.length}):`);
    mythicNFTs.forEach((nft, i) => {
      console.log(`  ${i + 1}. ${nft.name} (ID: ${nft.id}, Score: ${nft.totalScore})`);
    });

    if (!dryRun) {
      // Step 3: Clear old auction reservations (NFTs that were reserved but aren't MYTHIC anymore)
      const mythicIds = mythicNFTs.map(n => n.id);

      // Reset any NFTs that were AUCTION_RESERVED but aren't in the new MYTHIC list
      const clearedCount = await prisma.nFT.updateMany({
        where: {
          status: 'AUCTION_RESERVED',
          id: { notIn: mythicIds },
        },
        data: {
          status: 'AVAILABLE',
        },
      });

      console.log(`\nCleared ${clearedCount.count} old auction reservations`);

      // Step 4: Mark all MYTHIC NFTs as auction reserved
      const reservedCount = await prisma.nFT.updateMany({
        where: {
          id: { in: mythicIds },
        },
        data: {
          status: 'AUCTION_RESERVED',
          nftStatus: 'AUCTION_ACTIVE',
          isAuctionItem: true,
        },
      });

      console.log(`Reserved ${reservedCount.count} MYTHIC NFTs for auction`);

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'TIERS_REASSIGNED',
            details: JSON.stringify({
              totalNFTs: assignments.length,
              mythicCount: mythicNFTs.length,
              mythicNames: mythicNFTs.map(n => n.name),
              clearedOldReservations: clearedCount.count,
              stats: stats.map(s => ({ tier: s.tier, count: s.count })),
            }),
          },
        });
      } catch {
        // Audit log might not exist
      }
    }

    // Format response
    res.json({
      success: true,
      dryRun,
      message: dryRun
        ? 'Dry run complete - no changes made'
        : 'Tiers reassigned and MYTHIC items marked for auction',
      stats: stats.map(s => ({
        tier: s.tier,
        count: s.count,
        targetCount: s.targetCount,
        minScore: s.minScore,
        maxScore: s.maxScore,
        avgScore: s.avgScore,
      })),
      mythicItems: mythicNFTs.map((nft, i) => ({
        rank: i + 1,
        id: nft.id,
        name: nft.name,
        totalScore: nft.totalScore,
        tierMultiplier: nft.tierMultiplier,
      })),
      totalAssigned: assignments.length,
    });
  } catch (error: any) {
    console.error('Error reassigning tiers:', error);
    res.status(500).json({ error: 'Failed to reassign tiers', details: error?.message });
  }
}
