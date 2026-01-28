import { useState, useEffect, useCallback } from 'react';
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

interface ReviewNFT {
  id: number;
  tokenId: number;
  name: string;
  description: string;
  objectType: string;
  objectCategory?: string;
  badgeTier: string;
  totalScore: number;
  image: string | null;
  imageIpfsHash: string | null;
  rejectionCount: number;
  rejectionReason: string | null;
  distanceLy?: number;
  constellation?: string;
  discoveryYear?: number;
}

interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'generating' | 'complete' | 'error';
}

const REJECTION_REASONS = [
  'Poor image quality',
  'Incorrect object representation',
  'Missing key features',
  'Wrong color scheme',
  'Artifacts or distortions',
  'Does not match description',
  'Other',
];

export default function SeriesManagement() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [series, setSeries] = useState<Series[]>([]);
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewPhaseId, setReviewPhaseId] = useState<string | null>(null);
  const [reviewPhaseInfo, setReviewPhaseInfo] = useState<{ seriesNumber: number; phaseNumber: number } | null>(null);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [currentNFT, setCurrentNFT] = useState<ReviewNFT | null>(null);
  const [reviewStats, setReviewStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  // Keyboard shortcuts for review
  useEffect(() => {
    if (!reviewModalOpen || !currentNFT || generationProgress?.status === 'generating') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showRejectionModal) return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleApprove();
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setShowRejectionModal(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reviewModalOpen, currentNFT, generationProgress, showRejectionModal]);

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
        await fetchSeries();
        await fetchPricing();

        // Get the first phase of series 1 to start generation and review
        const updatedSeries = await fetch(`${apiUrl}/api/admin/series`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then(r => r.json());

        const series1 = updatedSeries.series?.find((s: Series) => s.seriesNumber === 1);
        const phase1 = series1?.phases?.find((p: Phase) => p.phaseNumber === 1);

        if (phase1) {
          // Open review modal and start generation
          startPhaseReview(phase1.id, 1, 1);
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to initialize series' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to initialize series' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetPhase(phaseId: string) {
    if (!confirm('Are you sure you want to reset this phase? This will clear all review progress and set all NFTs back to pending generation.')) {
      return;
    }

    setActionLoading(`reset-${phaseId}`);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/reset`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Phase reset successfully' });
        await fetchSeries();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reset phase' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reset phase' });
    } finally {
      setActionLoading(null);
    }
  }

  async function startPhaseReview(phaseId: string, seriesNumber: number, phaseNumber: number) {
    setReviewPhaseId(phaseId);
    setReviewPhaseInfo({ seriesNumber, phaseNumber });
    setReviewModalOpen(true);
    setGenerationProgress({ total: 0, completed: 0, failed: 0, status: 'generating' });

    // Start image generation
    await generateImagesForPhase(phaseId);
  }

  async function generateImagesForPhase(phaseId: string) {
    const token = localStorage.getItem('adminToken');

    try {
      // First call generate-images to initialize the phase status
      const initRes = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/generate-images`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const initData = await initRes.json();

      if (!initRes.ok) {
        setGenerationProgress(prev => prev ? { ...prev, status: 'error' } : null);
        setMessage({ type: 'error', text: initData.error || 'Failed to start image generation' });
        return;
      }

      // Check if all NFTs already have images (ready for review)
      if (initData.stats?.needingGeneration === 0 && initData.stats?.readyForReview > 0) {
        setGenerationProgress({ total: initData.stats.totalNFTs, completed: initData.stats.readyForReview, failed: 0, status: 'complete' });
        loadNextNFT(phaseId);
        return;
      }

      // Start the generation loop - call generate-next repeatedly
      startGenerationLoop(phaseId);
    } catch (error) {
      setGenerationProgress(prev => prev ? { ...prev, status: 'error' } : null);
      setMessage({ type: 'error', text: 'Failed to start image generation' });
    }
  }

  async function startGenerationLoop(phaseId: string) {
    const token = localStorage.getItem('adminToken');

    const generateNext = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/generate-next`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await res.json();

        if (data.stats) {
          const stats = data.stats;
          const total = stats.total || 0;
          const completed = (stats.pendingReview || 0) + (stats.approved || 0);

          setGenerationProgress({
            total,
            completed,
            failed: 0,
            status: stats.pendingGeneration === 0 ? 'complete' : 'generating',
          });

          setReviewStats({
            total,
            approved: stats.approved || 0,
            pending: stats.pendingReview || 0,
            rejected: stats.rejected || 0,
          });

          // If first NFT is ready and we don't have one to review yet, load it
          if (stats.pendingReview > 0 && !currentNFT) {
            loadNextNFT(phaseId);
          }
        }

        if (!res.ok) {
          console.error('Generation error:', data.error || data.message);
          // Continue trying with next NFT
          if (!data.done) {
            setTimeout(generateNext, 2000);
          }
          return;
        }

        if (data.done) {
          // All generation complete
          setGenerationProgress(prev => prev ? { ...prev, status: 'complete' } : null);

          // Load first NFT for review if available
          loadNextNFT(phaseId);
        } else {
          // Continue generating next NFT
          // Small delay to not overwhelm the API
          setTimeout(generateNext, 1000);
        }
      } catch (error) {
        console.error('Generation loop error:', error);
        // Retry after delay
        setTimeout(generateNext, 5000);
      }
    };

    generateNext();
  }


  async function loadNextNFT(phaseId: string) {
    const token = localStorage.getItem('adminToken');
    setReviewLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/review-queue?limit=1`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();

        setReviewStats({
          total: data.stats.total,
          approved: data.stats.approved,
          pending: data.stats.pendingReview,
          rejected: data.stats.rejected,
        });

        if (data.queue.items.length > 0) {
          setCurrentNFT(data.queue.items[0]);
        } else if (data.stats.approved === data.stats.total) {
          // All approved
          await activatePhase(phaseId);
        } else {
          setCurrentNFT(null);
        }
      }
    } catch (error) {
      console.error('Failed to load NFT:', error);
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleApprove() {
    if (!currentNFT || !reviewPhaseId) return;

    const token = localStorage.getItem('adminToken');
    setReviewLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/nfts/${currentNFT.id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'APPROVE' }),
      });

      if (res.ok) {
        // Load next NFT
        await loadNextNFT(reviewPhaseId);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to approve NFT' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve NFT' });
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleReject() {
    if (!currentNFT || !reviewPhaseId) return;

    const reason = rejectionReason === 'Other' ? customReason : rejectionReason;
    if (!reason) {
      setMessage({ type: 'error', text: 'Please select a rejection reason' });
      return;
    }

    const token = localStorage.getItem('adminToken');
    setReviewLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/nfts/${currentNFT.id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'REJECT', reason }),
      });

      if (res.ok) {
        setShowRejectionModal(false);
        setRejectionReason('');
        setCustomReason('');

        // Trigger regeneration
        await fetch(`${apiUrl}/api/admin/nfts/${currentNFT.id}/regenerate`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        // Load next NFT
        await loadNextNFT(reviewPhaseId);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to reject NFT' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject NFT' });
    } finally {
      setReviewLoading(false);
    }
  }

  async function activatePhase(phaseId: string) {
    const token = localStorage.getItem('adminToken');

    try {
      const res = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/activate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Phase activated successfully! NFTs are now available for purchase.' });
        setReviewModalOpen(false);
        fetchSeries();
        fetchPricing();
      }
    } catch (error) {
      console.error('Failed to activate phase:', error);
    }
  }

  function handleCloseReview() {
    if (generationProgress?.status === 'generating') {
      if (!confirm('Image generation is in progress. Are you sure you want to close? You can resume later.')) {
        return;
      }
    }
    setReviewModalOpen(false);
    setCurrentNFT(null);
    setGenerationProgress(null);
    setReviewPhaseId(null);
    setReviewPhaseInfo(null);
    fetchSeries();
  }

  function handleReviewPhase(phase: Phase, seriesNumber: number) {
    startPhaseReview(phase.id, seriesNumber, phase.phaseNumber);
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

  function getTierColor(tier: string): string {
    switch (tier) {
      case 'MYTHIC': return 'text-pink-400';
      case 'LEGENDARY': return 'text-yellow-400';
      case 'ELITE': return 'text-purple-400';
      case 'PREMIUM': return 'text-blue-400';
      case 'EXCEPTIONAL': return 'text-green-400';
      default: return 'text-gray-400';
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
                No series have been created yet. Click "Initialize Series" to get started.
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
                        const canReview = phase.status === 'PENDING' || phase.status === 'PENDING_REVIEW';

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

                            <div className="flex items-center gap-2 mt-2">
                              {canReview && (
                                <button
                                  onClick={() => handleReviewPhase(phase, s.seriesNumber)}
                                  className="text-xs text-yellow-400 hover:text-yellow-300 font-semibold"
                                >
                                  {phase.status === 'PENDING' ? 'Generate & Review' : 'Continue Review'}
                                </button>
                              )}
                              {phase.status !== 'ACTIVE' && phase.status !== 'COMPLETED' && (
                                <button
                                  onClick={() => handleResetPhase(phase.id)}
                                  disabled={actionLoading === `reset-${phase.id}`}
                                  className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                                  title="Reset phase to start fresh"
                                >
                                  {actionLoading === `reset-${phase.id}` ? 'Resetting...' : 'Reset'}
                                </button>
                              )}
                            </div>

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

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
          <div className="w-full max-w-4xl mx-4">
            {/* Modal Header */}
            <div className="bg-gray-900 rounded-t-xl p-4 border-b border-gray-700 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Series {reviewPhaseInfo?.seriesNumber} Phase {reviewPhaseInfo?.phaseNumber} Review
                </h2>
                <p className="text-gray-400 text-sm">
                  {reviewStats.approved}/{reviewStats.total} approved
                  {reviewStats.pending > 0 && ` | ${reviewStats.pending} pending`}
                  {reviewStats.rejected > 0 && ` | ${reviewStats.rejected} rejected`}
                </p>
              </div>
              <button
                onClick={handleCloseReview}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="bg-gray-800 p-6 rounded-b-xl">
              {/* Generation Progress */}
              {generationProgress?.status === 'generating' && (
                <div className="text-center py-12">
                  <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
                  <h3 className="text-xl font-bold text-white mb-2">Generating Images...</h3>
                  <p className="text-gray-400 mb-4">
                    {generationProgress.completed} / {generationProgress.total || '...'} complete
                  </p>
                  <div className="w-64 mx-auto h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-500"
                      style={{ width: generationProgress.total ? `${(generationProgress.completed / generationProgress.total) * 100}%` : '0%' }}
                    />
                  </div>
                  <p className="text-gray-500 text-sm mt-4">
                    This may take a while. You can close this modal and come back later.
                  </p>
                </div>
              )}

              {/* NFT Review */}
              {generationProgress?.status === 'complete' && currentNFT && (
                <div>
                  {/* NFT Image */}
                  <div className="aspect-square max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden mb-6">
                    {currentNFT.image ? (
                      <img
                        src={currentNFT.image}
                        alt={currentNFT.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        No image available
                      </div>
                    )}
                  </div>

                  {/* NFT Info */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-white mb-1">{currentNFT.name}</h3>
                    <div className="flex items-center justify-center gap-3 text-sm">
                      <span className="text-gray-400">{currentNFT.objectType}</span>
                      <span className="text-gray-600">|</span>
                      <span className={getTierColor(currentNFT.badgeTier)}>{currentNFT.badgeTier}</span>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-400">Score: {currentNFT.totalScore}</span>
                    </div>
                    {currentNFT.rejectionCount > 0 && (
                      <div className="mt-2 text-orange-400 text-sm">
                        Previously rejected {currentNFT.rejectionCount} time(s)
                        {currentNFT.rejectionReason && `: ${currentNFT.rejectionReason}`}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-6">
                    <button
                      onClick={() => setShowRejectionModal(true)}
                      disabled={reviewLoading}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white px-12 py-4 rounded-lg font-bold text-lg"
                    >
                      Decline (D)
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={reviewLoading}
                      className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white px-12 py-4 rounded-lg font-bold text-lg"
                    >
                      Accept (A)
                    </button>
                  </div>

                  <p className="text-center text-gray-500 text-sm mt-4">
                    Press A to accept, D to decline, Esc to close
                  </p>
                </div>
              )}

              {/* All Complete */}
              {generationProgress?.status === 'complete' && !currentNFT && reviewStats.approved === reviewStats.total && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">&#10003;</div>
                  <h3 className="text-2xl font-bold text-green-400 mb-2">All Images Approved!</h3>
                  <p className="text-gray-400 mb-6">
                    Phase is now being activated...
                  </p>
                </div>
              )}

              {/* No NFTs to review */}
              {generationProgress?.status === 'complete' && !currentNFT && reviewStats.pending === 0 && reviewStats.approved < reviewStats.total && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-bold text-yellow-400 mb-2">Waiting for Regeneration</h3>
                  <p className="text-gray-400 mb-4">
                    {reviewStats.rejected} NFT(s) are being regenerated. Please wait...
                  </p>
                  <button
                    onClick={() => loadNextNFT(reviewPhaseId!)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Rejection Reason</h3>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                    rejectionReason === reason
                      ? 'border-red-500 bg-red-900/30'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejection"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="hidden"
                  />
                  <span className="text-white">{reason}</span>
                </label>
              ))}
            </div>

            {rejectionReason === 'Other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason..."
                className="w-full bg-gray-700 text-white rounded-lg p-3 mb-4 border border-gray-600 focus:border-red-500 outline-none"
                rows={3}
              />
            )}

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                  setCustomReason('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason || (rejectionReason === 'Other' && !customReason)}
                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
