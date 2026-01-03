import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
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
      const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });

      return res.json({
        success: true,
        settings: {
          benefactorName: settings?.benefactorName || 'Benefactor',
          benefactorWalletAddress: settings?.benefactorWalletAddress,
          benefactorSharePercent: settings?.benefactorSharePercent || 30,
          ownerSharePercent: settings?.ownerSharePercent || 70,
          ownerWalletAddress: settings?.ownerWalletAddress,
        },
      });
    }

    if (req.method === 'PUT') {
      const { benefactorName, benefactorWalletAddress, benefactorSharePercent, ownerWalletAddress } = req.body;

      // Validate percentages
      if (benefactorSharePercent !== undefined) {
        if (benefactorSharePercent < 0 || benefactorSharePercent > 100) {
          return res.status(400).json({ error: 'Benefactor share must be between 0 and 100' });
        }
      }

      // Validate wallet addresses
      if (benefactorWalletAddress && !/^0x[a-fA-F0-9]{40}$/.test(benefactorWalletAddress)) {
        return res.status(400).json({ error: 'Invalid benefactor wallet address' });
      }
      if (ownerWalletAddress && !/^0x[a-fA-F0-9]{40}$/.test(ownerWalletAddress)) {
        return res.status(400).json({ error: 'Invalid owner wallet address' });
      }

      const updates: any = {};
      if (benefactorName !== undefined) updates.benefactorName = benefactorName;
      if (benefactorWalletAddress !== undefined) updates.benefactorWalletAddress = benefactorWalletAddress;
      if (benefactorSharePercent !== undefined) {
        updates.benefactorSharePercent = benefactorSharePercent;
        updates.ownerSharePercent = 100 - benefactorSharePercent;
      }
      if (ownerWalletAddress !== undefined) updates.ownerWalletAddress = ownerWalletAddress;

      const settings = await prisma.siteSettings.update({
        where: { id: 'main' },
        data: updates,
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'BENEFACTOR_SETTINGS_UPDATE',
            details: JSON.stringify(updates),
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log table might not exist
      }

      return res.json({
        success: true,
        settings: {
          benefactorName: settings.benefactorName,
          benefactorWalletAddress: settings.benefactorWalletAddress,
          benefactorSharePercent: settings.benefactorSharePercent,
          ownerSharePercent: settings.ownerSharePercent,
          ownerWalletAddress: settings.ownerWalletAddress,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Error in benefactor settings:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
