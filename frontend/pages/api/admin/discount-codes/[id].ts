import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

/**
 * Admin API: Manage Individual Discount Code
 *
 * PUT - Update discount code
 * DELETE - Delete discount code
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
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

    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Discount code ID is required' });
    }

    // Check if code exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!existingCode) {
      return res.status(404).json({ error: 'Discount code not found' });
    }

    if (req.method === 'PUT') {
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

      // If code is being changed, check for duplicates
      if (code && code.toUpperCase().trim() !== existingCode.code) {
        const duplicate = await prisma.discountCode.findUnique({
          where: { code: code.toUpperCase().trim() },
        });
        if (duplicate) {
          return res.status(400).json({ error: 'A discount code with this name already exists' });
        }
      }

      // Build update data
      const updateData: any = {};

      if (code !== undefined) updateData.code = code.toUpperCase().trim();
      if (description !== undefined) updateData.description = description || null;
      if (discountType !== undefined) updateData.discountType = discountType;
      if (discountValue !== undefined) updateData.discountValue = discountValue;
      if (minPurchaseCents !== undefined) updateData.minPurchaseCents = minPurchaseCents || null;
      if (maxDiscountCents !== undefined) updateData.maxDiscountCents = maxDiscountCents || null;
      if (maxUses !== undefined) updateData.maxUses = maxUses || null;
      if (startsAt !== undefined) updateData.startsAt = startsAt ? new Date(startsAt) : null;
      if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedCode = await prisma.discountCode.update({
        where: { id },
        data: updateData,
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'DISCOUNT_CODE_UPDATE',
            details: JSON.stringify({
              codeId: id,
              code: updatedCode.code,
              changes: updateData,
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
          id: updatedCode.id,
          code: updatedCode.code,
          description: updatedCode.description,
          discountType: updatedCode.discountType,
          discountValue: updatedCode.discountValue,
          minPurchaseCents: updatedCode.minPurchaseCents,
          maxDiscountCents: updatedCode.maxDiscountCents,
          maxUses: updatedCode.maxUses,
          usedCount: updatedCode.usedCount,
          startsAt: updatedCode.startsAt?.toISOString() || null,
          expiresAt: updatedCode.expiresAt?.toISOString() || null,
          isActive: updatedCode.isActive,
        },
      });
    }

    if (req.method === 'DELETE') {
      await prisma.discountCode.delete({
        where: { id },
      });

      // Log audit
      try {
        await prisma.adminAuditLog.create({
          data: {
            adminId: admin.id,
            adminEmail: admin.email,
            action: 'DISCOUNT_CODE_DELETE',
            details: JSON.stringify({
              codeId: id,
              code: existingCode.code,
            }),
            ipAddress: req.headers['x-forwarded-for'] as string || 'unknown',
          },
        });
      } catch {
        // Audit log might not exist
      }

      return res.json({
        success: true,
        message: 'Discount code deleted',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Discount code error:', error);
    res.status(500).json({ error: 'Failed to process request', details: error?.message });
  }
}
