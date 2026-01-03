import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../lib/adminAuth';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check database connection
    let database: 'online' | 'offline' | 'error' = 'offline';
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'online';
    } catch {
      database = 'error';
    }

    // Check Stripe (if configured)
    let stripe: 'online' | 'offline' | 'error' = 'offline';
    if (process.env.STRIPE_SECRET_KEY) {
      stripe = 'online';
    }

    // IPFS status (placeholder - can be enhanced)
    const ipfs: 'online' | 'offline' | 'error' = 'online';

    // Blockchain status (placeholder - can be enhanced)
    const blockchain: 'online' | 'offline' | 'error' = 'online';

    res.json({
      status: {
        database,
        stripe,
        ipfs,
        blockchain,
      },
    });
  } catch (error) {
    console.error('System status check failed:', error);
    res.status(500).json({ error: 'Failed to check system status' });
  }
}
