import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Series {
  id: string;
  seriesNumber: number;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  multiplier: number;
  startDate: string | null;
  endDate: string | null;
  phases: Phase[];
}

interface Phase {
  id: string;
  phaseNumber: number;
  status: 'PENDING' | 'GENERATING' | 'PENDING_REVIEW' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  startDate: string | null;
  endDate: string | null;
  isPaused: boolean;
  pausedAt: string | null;
  totalPausedMs: number;
  totalNFTs: number;
  approvedCount: number;
  pendingReviewCount: number;
  rejectedCount: number;
}

interface PricingInfo {
  currentSeries: number;
  currentPhase: number;
  seriesMultiplier: number;
  isPaused: boolean;
  phaseEndDate: string | null;
  config: {
    nftsPerPhase: number;
    phaseDurationDays: number;
    nftsPerSeries?: number;
    totalSeries?: number;
  };
}

export default function SeriesManagement() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
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

      await Promise.all([fetchSeries(), fetchPricing()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSeries() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/series`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setSeries(data.series || []);
      }
    } catch (error) {
      console.error('Failed to fetch series:', error);
    }
  }

  async function fetchPricing() {
    try {
      const res = await fetch(`${apiUrl}/api/pricing`);
      if (res.ok) {
        const data = await res.json();
        setPricingInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  }

  async function handlePausePhase() {
    setActionLoading('pause');
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/series/pause`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Phase paused successfully' });
        fetchSeries();
        fetchPricing();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to pause phase' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to pause phase' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResumePhase() {
    setActionLoading('resume');
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/series/resume`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Phase resumed successfully' });
        fetchSeries();
        fetchPricing();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to resume phase' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to resume phase' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAdvancePhase() {
    if (!confirm('Are you sure you want to advance to the next phase? This cannot be undone.')) {
      return;
    }

    setActionLoading('advance');
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/series/advance`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Advanced to next phase successfully' });
        fetchSeries();
        fetchPricing();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to advance phase' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to advance phase' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleInitializeSeries() {
    setActionLoading('initialize');
    setMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/series/initialize`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Series initialized successfully' });
        fetchSeries();
        fetchPricing();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initialize series' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to initialize series' });
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleString();
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-600';
      case 'COMPLETED':
        return 'bg-blue-600';
      case 'GENERATING':
        return 'bg-blue-500';
      case 'PENDING_REVIEW':
        return 'bg-yellow-600';
      case 'PAUSED':
        return 'bg-orange-600';
      case 'PENDING':
      default:
        return 'bg-gray-600';
    }
  }

  function getPhaseReviewProgress(phase: Phase): number {
    if (!phase.totalNFTs) return 0;
    return Math.round((phase.approvedCount / phase.totalNFTs) * 100);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const activeSeries = series.find(s => s.status === 'ACTIVE');
  const activePhase = activeSeries?.phases.find(p => p.status === 'ACTIVE');

  return (
    <>
      <Head>
        <title>Series Management | CosmoNFT Admin</title>
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
                <h1 className="text-xl font-bold text-white">Series Management</h1>
              </div>
              <nav className="flex gap-4">
                <Link href="/admin/image-review" className="text-yellow-400 hover:text-yellow-300 font-semibold">Image Review</Link>
                <Link href="/admin/scoring" className="text-gray-400 hover:text-white">Scoring</Link>
                <Link href="/admin/nfts" className="text-gray-400 hover:text-white">NFTs</Link>
                <Link href="/admin/settings" className="text-gray-400 hover:text-white">Settings</Link>
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

          {/* Current Status Card */}
          <div className="bg-gradient-to-r from-orange-900/30 to-yellow-900/30 rounded-lg p-6 border border-orange-500/30 mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Current Status</h2>

            {pricingInfo ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-gray-400 text-sm">Current Series</div>
                  <div className="text-3xl font-bold text-orange-400">
                    Series {pricingInfo.currentSeries}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Current Phase</div>
                  <div className="text-3xl font-bold text-yellow-400">
                    Phase {pricingInfo.currentPhase}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Series Multiplier</div>
                  <div className="text-3xl font-bold text-white">
                    {pricingInfo.seriesMultiplier}x
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Status</div>
                  <div className={`text-xl font-bold ${pricingInfo.isPaused ? 'text-yellow-400' : 'text-green-400'}`}>
                    {pricingInfo.isPaused ? 'PAUSED' : 'ACTIVE'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                No series data available. Initialize a series to get started.
              </div>
            )}

            {pricingInfo?.phaseEndDate && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-gray-400 text-sm">Phase Ends</div>
                <div className="text-white">{formatDate(pricingInfo.phaseEndDate)}</div>
              </div>
            )}
          </div>

          {/* Image Review Banner */}
          {series.length > 0 && series.some(s => s.phases.some(p => ['PENDING', 'PENDING_REVIEW', 'GENERATING'].includes(p.status))) && (
            <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-6 border border-yellow-500/30 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Image Review Required</h3>
                  <p className="text-gray-400 text-sm">
                    Phases must have all images reviewed and approved before they can be activated.
                  </p>
                </div>
                <Link
                  href="/admin/image-review"
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Go to Image Review
                </Link>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-lg font-bold text-white mb-4">Actions</h2>
            <div className="flex flex-wrap gap-4">
              {series.length === 0 ? (
                <button
                  onClick={handleInitializeSeries}
                  disabled={actionLoading === 'initialize'}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  {actionLoading === 'initialize' ? 'Initializing...' : 'Initialize Series'}
                </button>
              ) : (
                <>
                  <Link
                    href="/admin/image-review"
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Image Review Dashboard
                  </Link>
                  {pricingInfo?.isPaused ? (
                    <button
                      onClick={handleResumePhase}
                      disabled={actionLoading === 'resume'}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      {actionLoading === 'resume' ? 'Resuming...' : 'Resume Phase'}
                    </button>
                  ) : (
                    <button
                      onClick={handlePausePhase}
                      disabled={actionLoading === 'pause'}
                      className="bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      {actionLoading === 'pause' ? 'Pausing...' : 'Pause Phase'}
                    </button>
                  )}
                  <button
                    onClick={handleAdvancePhase}
                    disabled={!!actionLoading}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    {actionLoading === 'advance' ? 'Advancing...' : 'Advance to Next Phase'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Series List */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-lg font-bold text-white mb-4">All Series</h2>

            {series.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No series have been created yet. Click "Initialize Series 1" to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {series.map((s) => (
                  <div
                    key={s.id}
                    className={`p-4 rounded-lg border ${
                      s.status === 'ACTIVE'
                        ? 'bg-orange-900/20 border-orange-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white">Series {s.seriesNumber}</h3>
                        <div className="text-gray-400 text-sm">
                          Multiplier: {s.multiplier}x
                        </div>
                      </div>
                      <span className={`${getStatusColor(s.status)} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                        {s.status}
                      </span>
                    </div>

                    {/* Phases */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {s.phases.map((phase) => {
                        const reviewProgress = getPhaseReviewProgress(phase);
                        const needsReview = ['PENDING', 'GENERATING', 'PENDING_REVIEW'].includes(phase.status);

                        return (
                          <div
                            key={phase.id}
                            className={`p-3 rounded border ${
                              phase.status === 'ACTIVE'
                                ? 'bg-green-900/30 border-green-500'
                                : phase.status === 'COMPLETED'
                                ? 'bg-blue-900/30 border-blue-500'
                                : phase.status === 'PENDING_REVIEW'
                                ? 'bg-yellow-900/30 border-yellow-500'
                                : phase.status === 'GENERATING'
                                ? 'bg-blue-900/20 border-blue-400'
                                : 'bg-gray-700/50 border-gray-600'
                            }`}
                          >
                            <div className="font-semibold text-white">Phase {phase.phaseNumber}</div>
                            <div className={`text-xs ${
                              phase.status === 'ACTIVE' ? 'text-green-400' :
                              phase.status === 'COMPLETED' ? 'text-blue-400' :
                              phase.status === 'PENDING_REVIEW' ? 'text-yellow-400' :
                              phase.status === 'GENERATING' ? 'text-blue-400' :
                              'text-gray-400'
                            }`}>
                              {phase.status.replace('_', ' ')}
                              {phase.isPaused && ' (Paused)'}
                            </div>

                            {/* Review Progress */}
                            {needsReview && phase.totalNFTs > 0 && (
                              <div className="mt-2">
                                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${reviewProgress}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {phase.approvedCount || 0}/{phase.totalNFTs} approved
                                </div>
                              </div>
                            )}

                            {phase.status === 'PENDING_REVIEW' && phase.pendingReviewCount > 0 && (
                              <Link
                                href={`/admin/image-review/${phase.id}`}
                                className="text-xs text-yellow-400 hover:text-yellow-300 mt-1 block"
                              >
                                Review {phase.pendingReviewCount} pending
                              </Link>
                            )}

                            {phase.startDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Started: {new Date(phase.startDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configuration Info */}
          {pricingInfo?.config && (
            <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h2 className="text-lg font-bold text-white mb-4">Configuration</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-gray-400 text-sm">NFTs per Phase</div>
                  <div className="text-xl font-bold text-white">{pricingInfo.config.nftsPerPhase?.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Phase Duration</div>
                  <div className="text-xl font-bold text-white">{pricingInfo.config.phaseDurationDays} days</div>
                </div>
                {pricingInfo.config.nftsPerSeries && (
                  <div>
                    <div className="text-gray-400 text-sm">NFTs per Series</div>
                    <div className="text-xl font-bold text-white">{pricingInfo.config.nftsPerSeries.toLocaleString()}</div>
                  </div>
                )}
                {pricingInfo.config.totalSeries && (
                  <div>
                    <div className="text-gray-400 text-sm">Total Series</div>
                    <div className="text-xl font-bold text-white">{pricingInfo.config.totalSeries}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
