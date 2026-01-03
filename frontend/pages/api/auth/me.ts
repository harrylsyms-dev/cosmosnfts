import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { applyAuthSecurity, setCorsMethodsHeader, setCorsAllowedHeaders } from '../../../lib/authSecurity';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply CORS and rate limiting security
  setCorsMethodsHeader(res, 'GET, OPTIONS');
  setCorsAllowedHeaders(res, 'Content-Type, Authorization');

  if (!applyAuthSecurity(req, res)) {
    return; // Request was handled (rate limited or CORS rejected)
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Find session
    const session = await prisma.userSession.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    if (new Date() > session.expiresAt) {
      // Clean up expired session
      await prisma.userSession.delete({ where: { id: session.id } });
      return res.status(401).json({ error: 'Session expired' });
    }

    res.json({
      user: {
        id: session.user.id,
        walletAddress: session.user.walletAddress,
        email: session.user.email,
      },
    });
  } catch (error: any) {
    console.error('Auth check failed:', error);
    res.status(500).json({ error: 'Failed to check authentication' });
  }
}
