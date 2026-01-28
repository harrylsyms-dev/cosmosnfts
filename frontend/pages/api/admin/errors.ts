import type { NextApiRequest, NextApiResponse } from 'next';
import { validateAdmin } from '../../../lib/adminAuth';

/**
 * Admin API: Fetch errors from Sentry
 *
 * GET /api/admin/errors - List recent issues
 * GET /api/admin/errors?issueId=123 - Get issue details
 */

const SENTRY_API_BASE = 'https://sentry.io/api/0';

interface SentryIssue {
  id: string;
  shortId: string;
  title: string;
  culprit: string;
  level: string;
  status: string;
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  project: {
    id: string;
    name: string;
    slug: string;
  };
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
}

interface SentryEvent {
  eventID: string;
  context?: Record<string, any>;
  contexts?: Record<string, any>;
  dateCreated: string;
  entries: Array<{
    type: string;
    data: any;
  }>;
  message?: string;
  tags: Array<{ key: string; value: string }>;
  user?: {
    id?: string;
    email?: string;
    ip_address?: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify admin authentication
  const admin = await validateAdmin(req);
  if (!admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
  const sentryOrg = process.env.SENTRY_ORG || 'cosmo-nfts';
  const sentryProject = process.env.SENTRY_PROJECT || 'javascript-nextjs';

  if (!sentryAuthToken) {
    return res.status(500).json({
      error: 'Sentry not configured',
      message: 'SENTRY_AUTH_TOKEN environment variable is not set'
    });
  }

  const { issueId, cursor, query } = req.query;

  try {
    if (issueId) {
      // Get specific issue details with latest event
      const [issueRes, eventsRes] = await Promise.all([
        fetch(`${SENTRY_API_BASE}/issues/${issueId}/`, {
          headers: { Authorization: `Bearer ${sentryAuthToken}` },
        }),
        fetch(`${SENTRY_API_BASE}/issues/${issueId}/events/?limit=5`, {
          headers: { Authorization: `Bearer ${sentryAuthToken}` },
        }),
      ]);

      if (!issueRes.ok) {
        const error = await issueRes.text();
        return res.status(issueRes.status).json({ error: 'Failed to fetch issue', details: error });
      }

      const issue = await issueRes.json();
      const events = eventsRes.ok ? await eventsRes.json() : [];

      return res.status(200).json({ issue, events });
    }

    // List issues
    const searchQuery = query ? `&query=${encodeURIComponent(query as string)}` : '';
    const cursorParam = cursor ? `&cursor=${cursor}` : '';

    const issuesRes = await fetch(
      `${SENTRY_API_BASE}/projects/${sentryOrg}/${sentryProject}/issues/?limit=25${searchQuery}${cursorParam}`,
      {
        headers: { Authorization: `Bearer ${sentryAuthToken}` },
      }
    );

    if (!issuesRes.ok) {
      const error = await issuesRes.text();
      return res.status(issuesRes.status).json({ error: 'Failed to fetch issues', details: error });
    }

    const issues: SentryIssue[] = await issuesRes.json();

    // Get pagination cursor from Link header
    const linkHeader = issuesRes.headers.get('Link');
    let nextCursor = null;
    if (linkHeader) {
      const nextMatch = linkHeader.match(/cursor="([^"]+)"[^,]*rel="next"/);
      if (nextMatch) {
        nextCursor = nextMatch[1];
      }
    }

    // Get project stats
    const statsRes = await fetch(
      `${SENTRY_API_BASE}/projects/${sentryOrg}/${sentryProject}/stats/?stat=received&resolution=1d&since=${Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60}`,
      {
        headers: { Authorization: `Bearer ${sentryAuthToken}` },
      }
    );

    let stats = null;
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      const totalErrors = statsData.reduce((sum: number, [_, count]: [number, number]) => sum + count, 0);
      stats = {
        total30Days: totalErrors,
        daily: statsData.slice(-7), // Last 7 days
      };
    }

    return res.status(200).json({
      issues,
      nextCursor,
      stats,
      projectUrl: `https://${sentryOrg}.sentry.io/issues/?project=${sentryProject}`,
    });

  } catch (error) {
    console.error('Sentry API error:', error);
    return res.status(500).json({
      error: 'Failed to fetch from Sentry',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
