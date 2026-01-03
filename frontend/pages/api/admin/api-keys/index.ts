import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminToken } from '../../../../lib/adminAuth';

// Mask an API key to show only first/last few characters
function maskApiKey(key: string): string {
  if (key.length <= 8) {
    return '****' + key.slice(-2);
  }
  return key.slice(0, 4) + '****' + key.slice(-4);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

    // Only super admins can view API keys
    if (admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin access required' });
    }

    // Fetch all API keys from database
    const keys = await prisma.apiKey.findMany({
      select: {
        service: true,
        encryptedKey: true,
        description: true,
        lastRotated: true,
      },
    });

    // Check if encryption is configured
    const encryptionConfigured = !!process.env.ENCRYPTION_KEY;

    // Format response with masked keys
    const apiKeys = keys.map((key: { service: string; encryptedKey: string | null; description: string | null; lastRotated: Date | null }) => ({
      service: key.service,
      maskedKey: key.encryptedKey ? maskApiKey(key.encryptedKey) : null,
      description: key.description || '',
      lastRotated: key.lastRotated?.toISOString() || null,
    }));

    res.json({
      apiKeys,
      encryptionConfigured,
    });
  } catch (error: any) {
    console.error('Failed to fetch API keys:', error);
    res.status(500).json({ error: 'Failed to fetch API keys', details: error?.message });
  }
}
