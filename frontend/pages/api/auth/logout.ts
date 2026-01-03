import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { applyAuthSecurity, setCorsMethodsHeader, setCorsAllowedHeaders } from '../../../lib/authSecurity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply CORS and rate limiting security
  setCorsMethodsHeader(res, 'POST, OPTIONS');
  setCorsAllowedHeaders(res, 'Content-Type, Authorization');

  if (!applyAuthSecurity(req, res)) {
    return; // Request was handled (rate limited or CORS rejected)
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      // Delete the session
      await prisma.userSession.deleteMany({
        where: { token },
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Logout failed:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
}
