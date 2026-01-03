import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

    if (req.method === 'GET') {
      const addresses = await prisma.bannedAddress.findMany({
        orderBy: { bannedAt: 'desc' },
      });

      return res.json({
        success: true,
        addresses: addresses.map((a: any) => ({
          id: a.id,
          walletAddress: a.walletAddress,
          reason: a.reason,
          bannedAt: a.bannedAt,
          bannedBy: a.bannedBy,
        })),
      });
    }

    if (req.method === 'POST') {
      const { walletAddress, reason } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address required' });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
      }

      // Check if already banned
      const existing = await prisma.bannedAddress.findUnique({
        where: { walletAddress },
      });

      if (existing) {
        return res.status(400).json({ error: 'Address is already banned' });
      }

      const banned = await prisma.bannedAddress.create({
        data: {
          walletAddress,
          reason: reason || null,
          bannedBy: admin.email,
        },
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'ADDRESS_BAN',
            details: `${walletAddress} - ${reason || 'No reason'}`,
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log table might not exist
      }

      return res.json({
        success: true,
        banned: {
          id: banned.id,
          walletAddress: banned.walletAddress,
          reason: banned.reason,
          bannedAt: banned.bannedAt,
          bannedBy: banned.bannedBy,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in banned-addresses endpoint:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
