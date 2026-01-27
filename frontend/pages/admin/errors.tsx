import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

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
  metadata: {
    type?: string;
    value?: string;
    filename?: string;
    function?: string;
  };
}

interface SentryEvent {
  eventID: string;
  dateCreated: string;
  message?: string;
  tags: Array<{ key: string; value: string }>;
  user?: {
    id?: string;
    email?: string;
    ip_address?: string;
  };
  contexts?: {
    browser?: { name?: string; version?: string };
    os?: { name?: string; version?: string };
  };
}

interface Stats {
  total30Days: number;
  daily: Array<[number, number]>;
}

export default function ErrorsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [issues, setIssues] = useState<SentryIssue[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projectUrl, setProjectUrl] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<SentryIssue | null>(null);
  const [issueEvents, setIssueEvents] = useState<SentryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  async function checkAuthAndFetch() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/me`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        router.push('/admin/login');
        return;
      }

      await fetchIssues();
    } catch (err) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchIssues(cursor?: string, query?: string) {
    try {
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);
      if (query) params.set('query', query);

      const res = await fetch(`${apiUrl}/api/admin/errors?${params.toString()}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to fetch errors');
      }

      const data = await res.json();

      if (cursor) {
        setIssues((prev) => [...prev, ...data.issues]);
      } else {
        setIssues(data.issues);
      }

      setStats(data.stats);
      setProjectUrl(data.projectUrl);
      setNextCursor(data.nextCursor);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch errors');
    }
  }

  async function fetchIssueDetails(issue: SentryIssue) {
    setSelectedIssue(issue);
    setLoadingDetails(true);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/errors?issueId=${issue.id}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setIssueEvents(data.events || []);
      }
    } catch (err) {
      console.error('Failed to fetch issue details:', err);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    await fetchIssues(undefined, searchQuery);
    setIsLoading(false);
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await fetchIssues(nextCursor, searchQuery);
    setLoadingMore(false);
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function getLevelColor(level: string): string {
    switch (level) {
      case 'fatal':
        return 'bg-red-900 text-red-300';
      case 'error':
        return 'bg-red-900/60 text-red-400';
      case 'warning':
        return 'bg-yellow-900 text-yellow-300';
      case 'info':
        return 'bg-blue-900 text-blue-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'resolved':
        return 'bg-green-900 text-green-300';
      case 'ignored':
        return 'bg-gray-700 text-gray-400';
      default:
        return 'bg-purple-900 text-purple-300';
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Error Monitoring | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/admin')}
                  className="text-gray-400 hover:text-white"
                >
                  ← Back
                </button>
                <h1 className="text-2xl font-bold text-white">Error Monitoring</h1>
              </div>
              {projectUrl && (
                <a
                  href={projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-sm"
                >
                  Open in Sentry →
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Total Issues</div>
                <div className="text-2xl font-bold text-white">{issues.length}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Errors (30 days)</div>
                <div className="text-2xl font-bold text-white">{stats.total30Days.toLocaleString()}</div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Unresolved</div>
                <div className="text-2xl font-bold text-red-400">
                  {issues.filter((i) => i.status === 'unresolved').length}
                </div>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <div className="text-gray-400 text-sm">Users Affected</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {issues.reduce((sum, i) => sum + (i.userCount || 0), 0)}
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search errors (e.g., is:unresolved, user.email:...)"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-6 py-2 rounded-lg"
              >
                Search
              </button>
            </div>
          </form>

          {/* Issues List */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Recent Issues</h2>
            </div>

            {issues.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {error ? 'Failed to load errors' : 'No errors found. Great job!'}
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => fetchIssueDetails(issue)}
                    className="px-4 py-4 hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLevelColor(issue.level)}`}>
                            {issue.level}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                          <span className="text-gray-500 text-xs">{issue.shortId}</span>
                        </div>
                        <h3 className="text-white font-medium truncate">{issue.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{issue.culprit}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-white font-bold">{parseInt(issue.count).toLocaleString()}</div>
                        <div className="text-gray-500 text-xs">events</div>
                        <div className="text-gray-400 text-xs mt-1">{formatDate(issue.lastSeen)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {nextCursor && (
              <div className="px-4 py-3 border-t border-gray-800">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Issue Detail Modal */}
        {selectedIssue && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLevelColor(selectedIssue.level)}`}>
                      {selectedIssue.level}
                    </span>
                    <span className="text-gray-500 text-sm">{selectedIssue.shortId}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{selectedIssue.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                {/* Issue Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <div className="text-gray-500 text-xs">Events</div>
                    <div className="text-white font-bold">{parseInt(selectedIssue.count).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Users</div>
                    <div className="text-white font-bold">{selectedIssue.userCount}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">First Seen</div>
                    <div className="text-white">{formatDate(selectedIssue.firstSeen)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">Last Seen</div>
                    <div className="text-white">{formatDate(selectedIssue.lastSeen)}</div>
                  </div>
                </div>

                {/* Culprit */}
                <div className="mb-6">
                  <div className="text-gray-500 text-xs mb-1">Location</div>
                  <code className="text-purple-400 text-sm bg-gray-800 px-2 py-1 rounded block overflow-x-auto">
                    {selectedIssue.culprit}
                  </code>
                </div>

                {/* Error Details */}
                {selectedIssue.metadata && (selectedIssue.metadata.type || selectedIssue.metadata.value) && (
                  <div className="mb-6">
                    <div className="text-gray-500 text-xs mb-1">Error</div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      {selectedIssue.metadata.type && (
                        <div className="text-red-400 font-mono text-sm">{selectedIssue.metadata.type}</div>
                      )}
                      {selectedIssue.metadata.value && (
                        <div className="text-gray-300 text-sm mt-1">{selectedIssue.metadata.value}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Events */}
                <div>
                  <div className="text-gray-500 text-xs mb-2">Recent Events</div>
                  {loadingDetails ? (
                    <div className="text-gray-400 text-center py-4">Loading events...</div>
                  ) : issueEvents.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">No event details available</div>
                  ) : (
                    <div className="space-y-2">
                      {issueEvents.map((event) => (
                        <div key={event.eventID} className="bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-xs">{formatDate(event.dateCreated)}</span>
                            <span className="text-gray-500 text-xs font-mono">{event.eventID.slice(0, 8)}</span>
                          </div>
                          {event.user && (
                            <div className="text-sm">
                              <span className="text-gray-500">User: </span>
                              <span className="text-white">
                                {event.user.email || event.user.ip_address || 'Anonymous'}
                              </span>
                            </div>
                          )}
                          {event.contexts?.browser && (
                            <div className="text-sm">
                              <span className="text-gray-500">Browser: </span>
                              <span className="text-gray-300">
                                {event.contexts.browser.name} {event.contexts.browser.version}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-800 border-t border-gray-700 flex justify-between">
                <a
                  href={`https://cosmo-nfts.sentry.io/issues/${selectedIssue.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-purple-600 hover:bg-purple-500 text-white font-medium px-4 py-2 rounded-lg text-sm"
                >
                  View Full Details in Sentry →
                </a>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
