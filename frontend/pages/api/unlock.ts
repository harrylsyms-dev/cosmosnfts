import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SITE_PASSWORD = process.env.SITE_PASSWORD;

  // If no password is configured, site protection is disabled
  if (!SITE_PASSWORD) {
    return res.status(400).json({ error: 'Site password not configured' });
  }

  const { password } = req.body;

  if (password === SITE_PASSWORD) {
    // Set a cookie that lasts 7 days
    res.setHeader(
      'Set-Cookie',
      serialize('site_access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    );
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: 'Invalid password' });
}
