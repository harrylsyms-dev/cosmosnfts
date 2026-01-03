import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const admin = await validateAdmin(req);

    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    res.json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}
