import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.json({
    hasDbUrl: !!process.env.COSMO_PRISMA_DATABASE_URL,
    dbUrlStart: process.env.COSMO_PRISMA_DATABASE_URL?.substring(0, 20) || 'NOT SET',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50),
    },
  });
}
