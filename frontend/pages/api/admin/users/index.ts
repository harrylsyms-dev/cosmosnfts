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
      // Get all users with stats
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // Enrich with purchase stats
      const enrichedUsers = await Promise.all(
        users.map(async (user: any) => {
          const purchases = await prisma.purchase.findMany({
            where: { walletAddress: user.walletAddress, status: 'COMPLETED' },
          });

          const nftCount = await prisma.nFT.count({
            where: { ownerAddress: user.walletAddress },
          });

          const totalSpentCents = purchases.reduce((sum: number, p: { totalAmountCents: number }) => sum + p.totalAmountCents, 0);

          return {
            id: user.id,
            walletAddress: user.walletAddress,
            email: user.email,
            createdAt: user.createdAt,
            totalPurchases: purchases.length,
            totalSpentCents,
            totalSpent: totalSpentCents / 100,
            nftCount,
          };
        })
      );

      return res.json({ success: true, users: enrichedUsers });
    }

    if (req.method === 'POST') {
      // Manually add a user
      const { walletAddress, email } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ error: 'Wallet address is required' });
      }

      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return res.status(400).json({ error: 'Invalid wallet address format' });
      }

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (existing) {
        return res.status(400).json({ error: 'User with this wallet address already exists' });
      }

      const newUser = await prisma.user.create({
        data: {
          walletAddress,
          email: email || null,
        },
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'USER_CREATE',
            details: `Created user: ${walletAddress}${email ? ` (${email})` : ''}`,
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log table might not exist
      }

      console.log(`User created: ${walletAddress} by admin: ${admin.email}`);
      return res.json({
        success: true,
        user: {
          id: newUser.id,
          walletAddress: newUser.walletAddress,
          email: newUser.email,
          createdAt: newUser.createdAt,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in users endpoint:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
