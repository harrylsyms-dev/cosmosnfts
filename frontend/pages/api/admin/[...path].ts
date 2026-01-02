import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path || '';

  const url = `${BACKEND_URL}/api/admin/${pathString}`;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward cookies
    if (req.headers.cookie) {
      headers['Cookie'] = req.headers.cookie;
    }

    // Forward authorization header
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();

    // Forward set-cookie headers
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      res.setHeader('Set-Cookie', setCookie);
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin API proxy error:', error);
    res.status(500).json({ error: 'Failed to connect to server' });
  }
}
