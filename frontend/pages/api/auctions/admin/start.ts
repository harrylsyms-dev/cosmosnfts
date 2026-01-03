import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

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
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const admin = await verifyAdminToken(token);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { nftName, startTime, endTime, startingBidCents } = req.body;

    if (!nftName) {
      return res.status(400).json({ error: 'NFT name required' });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Start time and end time required' });
    }

    if (!startingBidCents || startingBidCents <= 0) {
      return res.status(400).json({ error: 'Valid starting bid required' });
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Find the NFT
    const nft = await prisma.nFT.findFirst({
      where: {
        OR: [
          { name: nftName },
          { name: { contains: nftName, mode: 'insensitive' } },
        ],
      },
    });

    if (!nft) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Check for existing active auction for this NFT
    const existingAuction = await prisma.auction.findFirst({
      where: {
        tokenId: nft.tokenId,
        status: { in: ['PENDING', 'ACTIVE'] },
      },
    });

    if (existingAuction) {
      return res.status(400).json({ error: 'An auction already exists for this NFT' });
    }

    // Determine initial status based on start time
    const now = new Date();
    const status = startDate <= now ? 'ACTIVE' : 'PENDING';

    // Create the auction
    const auction = await prisma.auction.create({
      data: {
        tokenId: nft.tokenId,
        nftName: nft.name,
        startingBidCents,
        currentBidCents: startingBidCents,
        startTime: startDate,
        endTime: endDate,
        status,
      },
    });

    // Update NFT status to AUCTIONED
    await prisma.nFT.update({
      where: { id: nft.id },
      data: { status: 'AUCTIONED' },
    });

    // Log the action
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId: admin.id,
          adminEmail: admin.email,
          action: 'AUCTION_STARTED',
          details: JSON.stringify({
            nftName: nft.name,
            tokenId: nft.tokenId,
            startingBidCents,
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          }),
        },
      });
    } catch {
      // Audit log is optional
    }

    res.json({
      success: true,
      auction: {
        id: auction.id,
        nftName: auction.nftName,
        startingBidCents: auction.startingBidCents,
        startTime: auction.startTime.toISOString(),
        endTime: auction.endTime.toISOString(),
        status: auction.status,
      },
    });
  } catch (error: any) {
    console.error('Failed to start auction:', error);
    res.status(500).json({ error: 'Failed to start auction', details: error?.message });
  }
}
