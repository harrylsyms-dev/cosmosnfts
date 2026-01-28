import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { verifyAdminToken } from '../../../lib/adminAuth';

interface WalletRecipient {
  id?: string;
  name: string;
  walletAddress: string;
  sharePercent: number;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Admin API: Get/Update Wallet Recipients
 *
 * Manages multiple wallet recipients with flexible percentage splits.
 * Total percentages must equal 100%.
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
      // Fetch all wallet recipients
      const recipients = await prisma.walletRecipient.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      // Calculate total percentage
      const totalPercent = recipients
        .filter(r => r.isActive)
        .reduce((sum, r) => sum + r.sharePercent, 0);

      return res.json({
        recipients: recipients.map(r => ({
          id: r.id,
          name: r.name,
          walletAddress: r.walletAddress,
          sharePercent: r.sharePercent,
          isActive: r.isActive,
          sortOrder: r.sortOrder,
        })),
        totalPercent,
        isValid: totalPercent === 100 || recipients.length === 0,
      });
    }

    if (req.method === 'PUT') {
      const { recipients } = req.body || {};

      if (!Array.isArray(recipients)) {
        return res.status(400).json({ error: 'Recipients array is required' });
      }

      // Validate all recipients
      for (const recipient of recipients as WalletRecipient[]) {
        if (!recipient.name || recipient.name.trim() === '') {
          return res.status(400).json({ error: 'All recipients must have a name' });
        }
        if (!recipient.walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(recipient.walletAddress)) {
          return res.status(400).json({ error: `Invalid wallet address for "${recipient.name}"` });
        }
        if (typeof recipient.sharePercent !== 'number' || recipient.sharePercent < 0 || recipient.sharePercent > 100) {
          return res.status(400).json({ error: `Invalid share percentage for "${recipient.name}"` });
        }
      }

      // Calculate total percentage (only active recipients)
      const activeRecipients = (recipients as WalletRecipient[]).filter(r => r.isActive !== false);
      const totalPercent = activeRecipients.reduce((sum, r) => sum + r.sharePercent, 0);

      if (activeRecipients.length > 0 && totalPercent !== 100) {
        return res.status(400).json({
          error: `Total percentage must equal 100%. Currently: ${totalPercent}%`,
          totalPercent,
        });
      }

      // Get existing recipients to determine updates vs creates
      const existingRecipients = await prisma.walletRecipient.findMany();
      const existingIds = existingRecipients.map(r => r.id);

      // Process each recipient
      const operations = [];
      const newIds: string[] = [];

      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i] as WalletRecipient;

        if (recipient.id && existingIds.includes(recipient.id)) {
          // Update existing
          operations.push(
            prisma.walletRecipient.update({
              where: { id: recipient.id },
              data: {
                name: recipient.name.trim(),
                walletAddress: recipient.walletAddress,
                sharePercent: recipient.sharePercent,
                isActive: recipient.isActive !== false,
                sortOrder: i,
              },
            })
          );
          newIds.push(recipient.id);
        } else {
          // Create new
          operations.push(
            prisma.walletRecipient.create({
              data: {
                name: recipient.name.trim(),
                walletAddress: recipient.walletAddress,
                sharePercent: recipient.sharePercent,
                isActive: recipient.isActive !== false,
                sortOrder: i,
              },
            })
          );
        }
      }

      // Delete removed recipients
      const idsToDelete = existingIds.filter(id => !newIds.includes(id));
      if (idsToDelete.length > 0) {
        operations.push(
          prisma.walletRecipient.deleteMany({
            where: { id: { in: idsToDelete } },
          })
        );
      }

      // Execute all operations
      await prisma.$transaction(operations);

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'WALLET_RECIPIENTS_UPDATE',
            details: JSON.stringify({
              recipientCount: recipients.length,
              totalPercent,
              recipients: (recipients as WalletRecipient[]).map(r => ({
                name: r.name,
                address: `${r.walletAddress.slice(0, 6)}...${r.walletAddress.slice(-4)}`,
                percent: r.sharePercent,
              })),
            }),
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log might not exist
      }

      // Fetch updated recipients
      const updatedRecipients = await prisma.walletRecipient.findMany({
        orderBy: { sortOrder: 'asc' },
      });

      return res.json({
        success: true,
        message: 'Wallet recipients updated successfully',
        recipients: updatedRecipients.map(r => ({
          id: r.id,
          name: r.name,
          walletAddress: r.walletAddress,
          sharePercent: r.sharePercent,
          isActive: r.isActive,
          sortOrder: r.sortOrder,
        })),
        totalPercent,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Wallet config error:', error);
    res.status(500).json({ error: 'Failed to process wallet config', details: error?.message });
  }
}
