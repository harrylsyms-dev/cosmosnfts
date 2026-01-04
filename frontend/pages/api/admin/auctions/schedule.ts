import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

async function getCurrentWeek(): Promise<number> {
  try {
    const phase1 = await prisma.tier.findFirst({
      where: { phase: 1 },
    });

    if (!phase1) return 1;

    const launchDate = phase1.startTime;
    const now = new Date();
    const diffMs = now.getTime() - launchDate.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

    return Math.max(1, diffWeeks + 1);
  } catch {
    return 1;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    // GET - List all scheduled auctions
    if (req.method === 'GET') {
      const currentWeek = await getCurrentWeek();

      const scheduled = await prisma.scheduledAuction.findMany({
        include: {
          nft: {
            select: {
              id: true,
              tokenId: true,
              name: true,
              objectType: true,
              totalScore: true,
              badgeTier: true,
              image: true,
              description: true,
              fameVisibility: true,
              scientificSignificance: true,
              rarity: true,
              discoveryRecency: true,
              culturalImpact: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { week: 'asc' },
        ],
      });

      const schedule = scheduled.map((s: typeof scheduled[number]) => ({
        id: s.id,
        nftId: s.nftId,
        week: s.week,
        startingBidCents: s.startingBidCents,
        startingBidDisplay: `$${(s.startingBidCents / 100).toLocaleString()}`,
        priority: s.priority,
        status: s.status,
        weeksUntil: Math.max(0, s.week - currentWeek),
        nft: s.nft ? {
          id: s.nft.id,
          tokenId: s.nft.tokenId,
          name: s.nft.name,
          objectType: s.nft.objectType,
          totalScore: s.nft.totalScore,
          badgeTier: s.nft.badgeTier,
          image: s.nft.image,
          description: s.nft.description,
          scores: {
            distance: s.nft.fameVisibility || 0,
            mass: s.nft.scientificSignificance || 0,
            luminosity: s.nft.rarity || 0,
            temperature: s.nft.discoveryRecency || 0,
            discovery: s.nft.culturalImpact || 0,
          },
        } : null,
      }));

      return res.json({
        success: true,
        currentWeek,
        totalScheduled: schedule.length,
        schedule,
      });
    }

    // POST - Add NFT to auction schedule
    if (req.method === 'POST') {
      const { nftId, week, startingBidCents, priority = 0 } = req.body;

      if (!nftId || !week || !startingBidCents) {
        return res.status(400).json({ error: 'Missing required fields: nftId, week, startingBidCents' });
      }

      // Check if NFT exists and is available
      const nft = await prisma.nFT.findUnique({
        where: { id: nftId },
      });

      if (!nft) {
        return res.status(404).json({ error: 'NFT not found' });
      }

      if (nft.status !== 'AVAILABLE') {
        return res.status(400).json({ error: `NFT is not available (status: ${nft.status})` });
      }

      // Check if already scheduled
      const existing = await prisma.scheduledAuction.findUnique({
        where: { nftId },
      });

      if (existing) {
        return res.status(400).json({ error: 'NFT is already scheduled for auction' });
      }

      // Create scheduled auction
      const scheduled = await prisma.scheduledAuction.create({
        data: {
          nftId,
          week,
          startingBidCents,
          priority,
          status: 'SCHEDULED',
        },
        include: {
          nft: {
            select: {
              id: true,
              tokenId: true,
              name: true,
              objectType: true,
            },
          },
        },
      });

      // Update NFT status to AUCTION_RESERVED
      await prisma.nFT.update({
        where: { id: nftId },
        data: { status: 'AUCTION_RESERVED' },
      });

      console.log(`Admin ${admin.email} scheduled NFT #${nftId} for auction in week ${week}`);

      return res.json({
        success: true,
        message: `${nft.name} scheduled for auction in week ${week}`,
        scheduled,
      });
    }

    // PUT - Update scheduled auction
    if (req.method === 'PUT') {
      const { id, week, startingBidCents, priority } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing schedule ID' });
      }

      const updateData: any = {};
      if (week !== undefined) updateData.week = week;
      if (startingBidCents !== undefined) updateData.startingBidCents = startingBidCents;
      if (priority !== undefined) updateData.priority = priority;

      const updated = await prisma.scheduledAuction.update({
        where: { id },
        data: updateData,
        include: {
          nft: {
            select: { name: true },
          },
        },
      });

      return res.json({
        success: true,
        message: `Schedule updated for ${updated.nft?.name}`,
        scheduled: updated,
      });
    }

    // DELETE - Remove from auction schedule
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Missing schedule ID' });
      }

      const scheduled = await prisma.scheduledAuction.findUnique({
        where: { id: id as string },
        include: { nft: true },
      });

      if (!scheduled) {
        return res.status(404).json({ error: 'Scheduled auction not found' });
      }

      // Delete the schedule
      await prisma.scheduledAuction.delete({
        where: { id: id as string },
      });

      // Restore NFT status to AVAILABLE
      await prisma.nFT.update({
        where: { id: scheduled.nftId },
        data: { status: 'AVAILABLE' },
      });

      console.log(`Admin ${admin.email} removed NFT #${scheduled.nftId} from auction schedule`);

      return res.json({
        success: true,
        message: `${scheduled.nft?.name} removed from auction schedule`,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error managing auction schedule:', error);
    res.status(500).json({ error: 'Failed to manage auction schedule', details: error?.message });
  }
}
