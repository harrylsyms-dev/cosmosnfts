import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/adminAuth';

/**
 * Admin API: Get/Update Wallet Configuration
 *
 * Manages owner and benefactor wallet addresses and revenue split settings.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

    if (req.method === 'GET') {
      // Fetch current wallet config from site settings
      const settings = await prisma.siteSettings.findUnique({
        where: { id: 'main' },
        select: {
          ownerWalletAddress: true,
          benefactorWalletAddress: true,
          benefactorName: true,
          ownerSharePercent: true,
          benefactorSharePercent: true,
        },
      });

      return res.json({
        config: {
          ownerWalletAddress: settings?.ownerWalletAddress || null,
          benefactorWalletAddress: settings?.benefactorWalletAddress || null,
          benefactorName: settings?.benefactorName || 'Space Exploration Fund',
          ownerSharePercent: settings?.ownerSharePercent ?? 70,
          benefactorSharePercent: settings?.benefactorSharePercent ?? 30,
        },
      });
    }

    if (req.method === 'PUT') {
      const {
        ownerWalletAddress,
        benefactorWalletAddress,
        benefactorName,
        ownerSharePercent,
        benefactorSharePercent,
      } = req.body || {};

      // Validate wallet addresses (basic check)
      if (ownerWalletAddress && !/^0x[a-fA-F0-9]{40}$/.test(ownerWalletAddress)) {
        return res.status(400).json({ error: 'Invalid owner wallet address format' });
      }
      if (benefactorWalletAddress && !/^0x[a-fA-F0-9]{40}$/.test(benefactorWalletAddress)) {
        return res.status(400).json({ error: 'Invalid benefactor wallet address format' });
      }

      // Validate percentages
      const ownerPct = typeof ownerSharePercent === 'number' ? ownerSharePercent : 70;
      const benefactorPct = typeof benefactorSharePercent === 'number' ? benefactorSharePercent : 30;

      if (ownerPct + benefactorPct !== 100) {
        return res.status(400).json({ error: 'Owner and benefactor percentages must sum to 100' });
      }

      // Upsert site settings
      await prisma.siteSettings.upsert({
        where: { id: 'main' },
        update: {
          ownerWalletAddress: ownerWalletAddress || null,
          benefactorWalletAddress: benefactorWalletAddress || null,
          benefactorName: benefactorName || 'Space Exploration Fund',
          ownerSharePercent: ownerPct,
          benefactorSharePercent: benefactorPct,
        },
        create: {
          id: 'main',
          ownerWalletAddress: ownerWalletAddress || null,
          benefactorWalletAddress: benefactorWalletAddress || null,
          benefactorName: benefactorName || 'Space Exploration Fund',
          ownerSharePercent: ownerPct,
          benefactorSharePercent: benefactorPct,
        },
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'WALLET_CONFIG_UPDATE',
            details: JSON.stringify({
              ownerWalletAddress: ownerWalletAddress ? `${ownerWalletAddress.slice(0, 6)}...${ownerWalletAddress.slice(-4)}` : null,
              benefactorWalletAddress: benefactorWalletAddress ? `${benefactorWalletAddress.slice(0, 6)}...${benefactorWalletAddress.slice(-4)}` : null,
              ownerSharePercent: ownerPct,
              benefactorSharePercent: benefactorPct,
            }),
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log might not exist
      }

      return res.json({
        success: true,
        message: 'Wallet configuration updated successfully',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Wallet config error:', error);
    res.status(500).json({ error: 'Failed to process wallet config', details: error?.message });
  }
}
