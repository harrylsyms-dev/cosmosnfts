import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

/**
 * Admin API: Manage Discount Codes
 *
 * GET - List all discount codes
 * POST - Create new discount code
 */
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
      const codes = await prisma.discountCode.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return res.json({
        codes: codes.map(code => ({
          id: code.id,
          code: code.code,
          description: code.description,
          discountType: code.discountType,
          discountValue: code.discountValue,
          minPurchaseCents: code.minPurchaseCents,
          maxDiscountCents: code.maxDiscountCents,
          maxUses: code.maxUses,
          usedCount: code.usedCount,
          startsAt: code.startsAt?.toISOString() || null,
          expiresAt: code.expiresAt?.toISOString() || null,
          isActive: code.isActive,
          createdAt: code.createdAt.toISOString(),
        })),
      });
    }

    if (req.method === 'POST') {
      const {
        code,
        description,
        discountType,
        discountValue,
        minPurchaseCents,
        maxDiscountCents,
        maxUses,
        startsAt,
        expiresAt,
        isActive,
      } = req.body || {};

      // Validate required fields
      if (!code || typeof code !== 'string' || code.trim() === '') {
        return res.status(400).json({ error: 'Discount code is required' });
      }

      if (typeof discountValue !== 'number' || discountValue < 0) {
        return res.status(400).json({ error: 'Valid discount value is required' });
      }

      // Validate discount type
      const type = discountType || 'PERCENT';
      if (!['PERCENT', 'FIXED'].includes(type)) {
        return res.status(400).json({ error: 'Invalid discount type' });
      }

      // Validate percentage
      if (type === 'PERCENT' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
      }

      // Check for duplicate code
      const existing = await prisma.discountCode.findUnique({
        where: { code: code.toUpperCase().trim() },
      });

      if (existing) {
        return res.status(400).json({ error: 'A discount code with this name already exists' });
      }

      // Create discount code
      const newCode = await prisma.discountCode.create({
        data: {
          code: code.toUpperCase().trim(),
          description: description || null,
          discountType: type,
          discountValue,
          minPurchaseCents: minPurchaseCents || null,
          maxDiscountCents: maxDiscountCents || null,
          maxUses: maxUses || null,
          startsAt: startsAt ? new Date(startsAt) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: isActive !== false,
          createdBy: admin.id,
        },
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'DISCOUNT_CODE_CREATE',
            details: JSON.stringify({
              code: newCode.code,
              discountType: newCode.discountType,
              discountValue: newCode.discountValue,
            }),
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log might not exist
      }

      return res.json({
        success: true,
        code: {
          id: newCode.id,
          code: newCode.code,
          description: newCode.description,
          discountType: newCode.discountType,
          discountValue: newCode.discountValue,
          isActive: newCode.isActive,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Discount code error:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
