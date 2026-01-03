import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminToken } from '../../../../../lib/adminAuth';

// Auction schedule names for validation
const AUCTION_SCHEDULE_NAMES = [
  'Earth', 'Sun', 'Moon', 'Mars', 'Jupiter', 'Venus', 'Saturn', 'Neptune',
  'Uranus', 'Andromeda Galaxy', 'Milky Way', 'Orion Nebula', 'Crab Nebula',
  'Ring Nebula', 'Horsehead Nebula', 'Eagle Nebula', 'Helix Nebula',
  'Whirlpool Galaxy', 'Sombrero Galaxy', 'Triangulum Galaxy',
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
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

    const { name, startingBidCents } = req.body;

    if (!name || typeof startingBidCents !== 'number') {
      return res.status(400).json({ error: 'Name and startingBidCents are required' });
    }

    if (startingBidCents < 100) {
      return res.status(400).json({ error: 'Starting bid must be at least $1.00' });
    }

    // Check if the name is in our schedule
    const scheduledItem = AUCTION_SCHEDULE_NAMES.find(
      (n) => n.toLowerCase() === name.toLowerCase()
    );

    if (!scheduledItem) {
      return res.status(404).json({ error: 'Auction not found in schedule' });
    }

    // Upsert the override
    const override = await prisma.auctionScheduleOverride.upsert({
      where: { name: name },
      update: { startingBidCents },
      create: { name, startingBidCents },
    });

    console.log(`Updated auction starting bid: ${name} -> $${(startingBidCents / 100).toFixed(2)}`);

    res.json({
      success: true,
      override: {
        name: override.name,
        startingBidCents: override.startingBidCents,
        startingBidDisplay: `$${(override.startingBidCents / 100).toLocaleString()}`,
      },
    });
  } catch (error: any) {
    console.error('Error updating auction price:', error);
    res.status(500).json({ error: 'Failed to update auction price', details: error?.message });
  }
}
