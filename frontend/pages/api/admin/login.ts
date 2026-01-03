import type { NextApiRequest, NextApiResponse } from 'next';
import { loginAdmin } from '../../../lib/adminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log request details for debugging
  console.log('Login request:', {
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers),
    hasBody: !!req.body,
  });

  // Set CORS and cache headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', method: req.method });
  }

  try {
    const { email, password } = req.body || {};

    console.log('Login attempt:', { email, hasPassword: !!password, body: req.body });

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required', received: { email: !!email, password: !!password } });
    }

    const result = await loginAdmin(email, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    res.json({
      success: true,
      token: result.token,
      admin: result.admin,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error?.message || 'Unknown error' });
  }
}
