import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret for security
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow in development or if no secret set
    if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Check if phase is paused
    const siteSettings = await prisma.siteSettings.findUnique({
      where: { id: 'main' },
    });

    if (siteSettings?.phasePaused) {
      return res.json({ message: 'Phase timer is paused, skipping advancement' });
    }

    // Get current active tier from database
    const activeTier = await prisma.tier.findFirst({
      where: { active: true },
    });

    if (!activeTier) {
      // No active tier, activate phase 1
      const phase1 = await prisma.tier.findFirst({
        where: { phase: 1 },
      });

      if (phase1) {
        await prisma.tier.update({
          where: { id: phase1.id },
          data: { active: true },
        });
        return res.json({ message: 'Activated Phase 1' });
      }
      return res.json({ message: 'No tiers configured' });
    }

    // Check if tier has expired (accounting for pause duration)
    const pauseDuration = siteSettings?.pauseDurationMs || 0;
    const tierEndTime = new Date(activeTier.startTime.getTime() + activeTier.duration * 1000 + pauseDuration);
    const now = new Date();

    if (now >= tierEndTime) {
      // Time to advance to next tier
      const nextTier = await prisma.tier.findFirst({
        where: { phase: activeTier.phase + 1 },
      });

      if (nextTier) {
        // Deactivate current tier and activate next
        await prisma.$transaction([
          prisma.tier.update({
            where: { id: activeTier.id },
            data: { active: false },
          }),
          prisma.tier.update({
            where: { id: nextTier.id },
            data: {
              active: true,
              startTime: now,
            },
          }),
          // Reset pause duration when advancing
          prisma.siteSettings.update({
            where: { id: 'main' },
            data: { pauseDurationMs: 0 },
          }),
        ]);

        // Update all NFT prices with new multiplier
        const increasePercent = siteSettings?.phaseIncreasePercent || 7.5;
        const multiplier = Math.pow(1 + (increasePercent / 100), nextTier.phase - 1);

        // Update prices in batches
        const nfts = await prisma.nFT.findMany({
          where: { status: 'AVAILABLE' },
          select: { id: true, totalScore: true, cosmicScore: true },
        });

        for (let i = 0; i < nfts.length; i += 500) {
          const batch = nfts.slice(i, i + 500);
          await Promise.all(
            batch.map((nft: { id: number; totalScore: number | null; cosmicScore: number | null }) => {
              const score = nft.totalScore || nft.cosmicScore || 0;
              const newPrice = 0.10 * score * multiplier;
              return prisma.nFT.update({
                where: { id: nft.id },
                data: { currentPrice: newPrice },
              });
            })
          );
        }

        return res.json({
          message: `Advanced to Phase ${nextTier.phase}`,
          newPrice: nextTier.price,
          multiplier: multiplier.toFixed(4),
        });
      } else {
        return res.json({ message: 'Already at final tier' });
      }
    }

    res.json({ message: 'No advancement needed', currentPhase: activeTier.phase });
  } catch (error) {
    console.error('Tier advancement job failed:', error);
    res.status(500).json({ error: 'Tier advancement failed' });
  }
}
