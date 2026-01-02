import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.BACKEND_URL || 'NOT_SET';

  let backendStatus = 'unknown';
  try {
    const response = await fetch(`${backendUrl}/health`);
    backendStatus = response.ok ? 'OK' : `Error: ${response.status}`;
  } catch (error: any) {
    backendStatus = `Failed: ${error.message}`;
  }

  res.json({
    backendUrl: backendUrl.substring(0, 30) + '...',
    backendStatus,
    nodeEnv: process.env.NODE_ENV,
  });
}
