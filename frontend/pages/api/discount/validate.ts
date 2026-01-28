import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

/**
 * Public API: Validate Discount Code
 *
 * Checks if a discount code is valid and returns discount details.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, subtotalCents } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Discount code is required' });
    }

    const discountCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!discountCode) {
      return res.status(404).json({ error: 'Invalid discount code', valid: false });
    }

    // Check if active
    if (!discountCode.isActive) {
      return res.status(400).json({ error: 'This discount code is no longer active', valid: false });
    }

    // Check date validity
    const now = new Date();
    if (discountCode.startsAt && now < discountCode.startsAt) {
      return res.status(400).json({ error: 'This discount code is not yet active', valid: false });
    }
    if (discountCode.expiresAt && now > discountCode.expiresAt) {
      return res.status(400).json({ error: 'This discount code has expired', valid: false });
    }

    // Check usage limit
    if (discountCode.maxUses !== null && discountCode.usedCount >= discountCode.maxUses) {
      return res.status(400).json({ error: 'This discount code has reached its usage limit', valid: false });
    }

    // Check minimum purchase
    if (discountCode.minPurchaseCents && subtotalCents && subtotalCents < discountCode.minPurchaseCents) {
      const minDollars = (discountCode.minPurchaseCents / 100).toFixed(2);
      return res.status(400).json({
        error: `Minimum purchase of $${minDollars} required for this code`,
        valid: false,
      });
    }

    // Calculate discount amount
    let discountCents = 0;
    if (subtotalCents) {
      if (discountCode.discountType === 'PERCENT') {
        discountCents = Math.round((subtotalCents * discountCode.discountValue) / 100);
      } else {
        discountCents = discountCode.discountValue;
      }

      // Apply max discount cap
      if (discountCode.maxDiscountCents && discountCents > discountCode.maxDiscountCents) {
        discountCents = discountCode.maxDiscountCents;
      }

      // Don't allow discount greater than subtotal
      if (discountCents > subtotalCents) {
        discountCents = subtotalCents;
      }
    }

    res.json({
      valid: true,
      code: discountCode.code,
      discountType: discountCode.discountType,
      discountValue: discountCode.discountValue,
      discountCents,
      discountDollars: discountCents / 100,
      description: discountCode.description,
    });
  } catch (error: any) {
    console.error('Discount validation error:', error);
    res.status(500).json({ error: 'Failed to validate discount code', valid: false });
  }
}
