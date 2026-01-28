import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Phase {
  id: string;
  phaseNumber: number;
  status: string;
  totalNFTs: number;
  approvedCount: number;
  pendingReviewCount: number;
  rejectedCount: number;
}

interface Series {
  id: string;
  seriesNumber: number;
  status: string;
  phases: Phase[];
}

interface ReviewStats {
  totalPhases: number;
  phasesWithPendingReview: number;
  totalPendingReview: number;
  totalApproved: number;
  totalRejected: number;
}

export default function ImageReviewDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
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

      await fetchData();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchData() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/series`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSeries(data.series || []);

        // Calculate stats
        let totalPendingReview = 0;
        let totalApproved = 0;
        let totalRejected = 0;
        let phasesWithPendingReview = 0;

        (data.series || []).forEach((s: Series) => {
          s.phases.forEach((p: Phase) => {
            totalPendingReview += p.pendingReviewCount || 0;
            totalApproved += p.approvedCount || 0;
            totalRejected += p.rejectedCount || 0;
            if ((p.pendingReviewCount || 0) > 0) {
              phasesWithPendingReview++;
            }
          });
        });

        setStats({
          totalPhases: (data.series || []).reduce((sum: number, s: Series) => sum + s.phases.length, 0),
          phasesWithPendingReview,
          totalPendingReview,
          totalApproved,
          totalRejected,
        });
      }
    } catch (error) {
      console.error('Failed to fetch series:', error);
    }
  }

  async function handleGenerateImages(phaseId: string) {
    setActionLoading(phaseId);
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/generate-images`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Image generation started' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to start generation' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to start image generation' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleActivatePhase(phaseId: string) {
    if (!confirm('Are you sure you want to activate this phase? All approved NFTs will become visible to customers.')) {
      return;
    }

    setActionLoading(phaseId);
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/activate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Phase activated!' });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to activate phase' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to activate phase' });
    } finally {
      setActionLoading(null);
    }
  }

  function getPhaseStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-600';
      case 'PENDING_REVIEW':
        return 'bg-yellow-600';
      case 'GENERATING':
        return 'bg-blue-600';
      case 'COMPLETED':
        return 'bg-gray-600';
      case 'PENDING':
      default:
        return 'bg-gray-700';
    }
  }

  function getProgressPercentage(phase: Phase): number {
    const total = phase.totalNFTs || 0;
    if (total === 0) return 0;
    return Math.round(((phase.approvedCount || 0) / total) * 100);
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
        <title>Image Review | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Link href="/admin" className="text-gray-400 hover:text-white">
                  &larr; Back to Admin
                </Link>
                <h1 className="text-xl font-bold text-white">Image Review Dashboard</h1>
              </div>
              <nav className="flex gap-4">
                <Link href="/admin/series" className="text-gray-400 hover:text-white">Series</Link>
                <Link href="/admin/nfts" className="text-gray-400 hover:text-white">NFTs</Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Message Alert */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-900/30 border-green-500 text-green-300'
                : 'bg-red-900/30 border-red-500 text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Overall Stats */}
          {stats && (
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-lg p-6 border border-purple-500/30 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Review Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                <div>
                  <div className="text-gray-400 text-sm">Total Phases</div>
                  <div className="text-3xl font-bold text-white">{stats.totalPhases}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Pending Review</div>
                  <div className="text-3xl font-bold text-yellow-400">{stats.totalPendingReview.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Approved</div>
                  <div className="text-3xl font-bold text-green-400">{stats.totalApproved.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Rejected</div>
                  <div className="text-3xl font-bold text-red-400">{stats.totalRejected.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Phases Needing Review</div>
                  <div className="text-3xl font-bold text-orange-400">{stats.phasesWithPendingReview}</div>
                </div>
              </div>
            </div>
          )}

          {/* Series List */}
          <div className="space-y-8">
            {series.map((s) => (
              <div key={s.id} className="bg-gray-900 rounded-lg border border-gray-800">
                <div className="p-4 border-b border-gray-800">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">
                      Series {s.seriesNumber}
                      <span className={`ml-3 px-2 py-1 text-xs rounded ${
                        s.status === 'ACTIVE' ? 'bg-green-600' : 'bg-gray-600'
                      }`}>
                        {s.status}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid gap-4">
                    {s.phases.map((phase) => {
                      const progress = getProgressPercentage(phase);
                      const canStartReview = phase.status === 'PENDING_REVIEW' && (phase.pendingReviewCount || 0) > 0;
                      const canActivate = phase.status === 'PENDING_REVIEW' && progress === 100;
                      const needsGeneration = phase.status === 'PENDING';

                      return (
                        <div
                          key={phase.id}
                          className={`p-4 rounded-lg border ${
                            phase.status === 'ACTIVE'
                              ? 'bg-green-900/20 border-green-500'
                              : phase.status === 'PENDING_REVIEW'
                              ? 'bg-yellow-900/20 border-yellow-500'
                              : phase.status === 'GENERATING'
                              ? 'bg-blue-900/20 border-blue-500'
                              : 'bg-gray-800 border-gray-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-white">
                                Phase {phase.phaseNumber}
                                <span className={`ml-2 px-2 py-0.5 text-xs rounded ${getPhaseStatusColor(phase.status)}`}>
                                  {phase.status}
                                </span>
                              </h4>
                              <div className="text-sm text-gray-400 mt-1">
                                {phase.totalNFTs?.toLocaleString() || 0} NFTs
                              </div>
                            </div>

                            <div className="flex gap-2">
                              {needsGeneration && (
                                <button
                                  onClick={() => handleGenerateImages(phase.id)}
                                  disabled={actionLoading === phase.id}
                                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-semibold"
                                >
                                  {actionLoading === phase.id ? 'Starting...' : 'Generate Images'}
                                </button>
                              )}

                              {canStartReview && (
                                <Link
                                  href={`/admin/image-review/${phase.id}`}
                                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded text-sm font-semibold"
                                >
                                  Start Review ({phase.pendingReviewCount})
                                </Link>
                              )}

                              {canActivate && (
                                <button
                                  onClick={() => handleActivatePhase(phase.id)}
                                  disabled={actionLoading === phase.id}
                                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-semibold"
                                >
                                  {actionLoading === phase.id ? 'Activating...' : 'Activate Phase'}
                                </button>
                              )}

                              {phase.status === 'ACTIVE' && (
                                <span className="text-green-400 px-4 py-2 text-sm">
                                  Live
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-2">
                            <div className="flex justify-between text-sm text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{progress}% approved</span>
                            </div>
                            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Approved:</span>
                              <span className="ml-2 text-green-400 font-semibold">
                                {(phase.approvedCount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Pending:</span>
                              <span className="ml-2 text-yellow-400 font-semibold">
                                {(phase.pendingReviewCount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Rejected:</span>
                              <span className="ml-2 text-red-400 font-semibold">
                                {(phase.rejectedCount || 0).toLocaleString()}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="ml-2 text-white font-semibold">
                                {(phase.totalNFTs || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {series.length === 0 && (
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
                <div className="text-gray-400 mb-4">
                  No series have been initialized yet.
                </div>
                <Link
                  href="/admin/series"
                  className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Go to Series Management
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
