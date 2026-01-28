import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFT {
  id: number;
  tokenId: number;
  name: string;
  description: string | null;
  objectType: string | null;
  objectCategory: string;
  badgeTier: string;
  totalScore: number;
  image: string | null;
  rejectionCount: number;
  rejectionReason: string | null;
  distanceLy: number | null;
  constellation: string | null;
  discoveryYear: number | null;
}

interface PhaseInfo {
  id: string;
  phaseNumber: number;
  seriesNumber: number;
  status: string;
}

interface Stats {
  total: number;
  pendingGeneration: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  regenerating: number;
  approvalRate: number;
  reviewedCount: number;
}

interface QueueInfo {
  items: NFT[];
  total: number;
  currentPosition: number;
  hasMore: boolean;
}

const REJECTION_REASONS = [
  'Image quality is poor',
  'Does not match description',
  'Incorrect object type',
  'Artifacts or distortions',
  'Wrong colors or lighting',
  'Text or watermarks visible',
  'Not scientifically accurate',
  'Other (custom reason)',
];

export default function ImageReviewInterface() {
  const router = useRouter();
  const { phaseId } = router.query;

  const [isLoading, setIsLoading] = useState(true);
  const [phase, setPhase] = useState<PhaseInfo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [queue, setQueue] = useState<QueueInfo | null>(null);
  const [currentNFT, setCurrentNFT] = useState<NFT | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // Keyboard shortcuts help
  const [showHelp, setShowHelp] = useState(false);

  const fetchReviewQueue = useCallback(async () => {
    if (!phaseId) return;

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/phases/${phaseId}/review-queue?limit=1`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch review queue');
      }

      const data = await res.json();
      setPhase(data.phase);
      setStats(data.stats);
      setQueue(data.queue);
      setCurrentNFT(data.queue.items[0] || null);
    } catch (error) {
      console.error('Error fetching review queue:', error);
      setMessage({ type: 'error', text: 'Failed to load review queue' });
    } finally {
      setIsLoading(false);
    }
  }, [phaseId, router]);

  useEffect(() => {
    if (phaseId) {
      fetchReviewQueue();
    }
  }, [phaseId, fetchReviewQueue]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger when modal is open
      if (showRejectModal) {
        if (e.key === 'Escape') {
          setShowRejectModal(false);
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          handleApprove();
          break;
        case 'd':
          setShowRejectModal(true);
          break;
        case '?':
          setShowHelp(prev => !prev);
          break;
        case 'escape':
          router.push('/admin/image-review');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentNFT, showRejectModal, router]);

  async function handleApprove() {
    if (!currentNFT || actionLoading) return;

    setActionLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/${currentNFT.id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Approved: ${currentNFT.name}` });
        // Fetch next NFT
        await fetchReviewQueue();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to approve' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve NFT' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    if (!currentNFT || actionLoading) return;

    const reason = selectedReason === 'Other (custom reason)' ? customReason : selectedReason;
    if (!reason) {
      setMessage({ type: 'error', text: 'Please select or enter a rejection reason' });
      return;
    }

    setActionLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/${currentNFT.id}/review`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'reject', reason }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Rejected: ${currentNFT.name}` });
        setShowRejectModal(false);
        setSelectedReason('');
        setCustomReason('');

        // Trigger regeneration
        await handleRegenerate(currentNFT.id);

        // Fetch next NFT
        await fetchReviewQueue();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to reject' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject NFT' });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRegenerate(nftId: number) {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${apiUrl}/api/admin/nfts/${nftId}/regenerate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      // Don't wait for regeneration to complete
    } catch (error) {
      console.error('Failed to trigger regeneration:', error);
    }
  }

  function getTierColor(tier: string): string {
    switch (tier) {
      case 'MYTHIC':
        return 'text-purple-400 bg-purple-900/30';
      case 'LEGENDARY':
        return 'text-orange-400 bg-orange-900/30';
      case 'ELITE':
        return 'text-blue-400 bg-blue-900/30';
      case 'PREMIUM':
        return 'text-green-400 bg-green-900/30';
      case 'EXCEPTIONAL':
        return 'text-yellow-400 bg-yellow-900/30';
      default:
        return 'text-gray-400 bg-gray-700';
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading review queue...</div>
      </div>
    );
  }

  const progress = stats ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <>
      <Head>
        <title>Review: Series {phase?.seriesNumber} Phase {phase?.phaseNumber} | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin/image-review" className="text-gray-400 hover:text-white text-xl">
                &times;
              </Link>
              <h1 className="text-lg font-bold text-white">
                Series {phase?.seriesNumber} Phase {phase?.phaseNumber} Review
              </h1>
              <span className="text-gray-400">
                [{queue?.currentPosition || 0}/{queue?.total || 0}]
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHelp(prev => !prev)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Keyboard shortcuts (?)
              </button>
            </div>
          </div>
        </header>

        {/* Message */}
        {message && (
          <div className={`px-4 py-2 text-center text-sm ${
            message.type === 'success' ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 flex">
          {currentNFT ? (
            <div className="flex-1 flex flex-col lg:flex-row">
              {/* Image Panel */}
              <div className="lg:flex-1 flex items-center justify-center p-8 bg-black">
                {currentNFT.image ? (
                  <img
                    src={currentNFT.image}
                    alt={currentNFT.name}
                    className="max-w-full max-h-[60vh] lg:max-h-[80vh] object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-96 h-96 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">No image available</span>
                  </div>
                )}
              </div>

              {/* Info Panel */}
              <div className="lg:w-96 bg-gray-900 p-6 border-l border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-2">{currentNFT.name}</h2>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getTierColor(currentNFT.badgeTier)}`}>
                    {currentNFT.badgeTier}
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-700 text-gray-300">
                    {currentNFT.objectType || currentNFT.objectCategory}
                  </span>
                </div>

                {currentNFT.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-4">
                    {currentNFT.description}
                  </p>
                )}

                <div className="space-y-2 text-sm mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Token ID:</span>
                    <span className="text-white">#{currentNFT.tokenId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cosmic Score:</span>
                    <span className="text-white">{currentNFT.totalScore}</span>
                  </div>
                  {currentNFT.constellation && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Constellation:</span>
                      <span className="text-white">{currentNFT.constellation}</span>
                    </div>
                  )}
                  {currentNFT.distanceLy && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Distance:</span>
                      <span className="text-white">{currentNFT.distanceLy.toLocaleString()} ly</span>
                    </div>
                  )}
                </div>

                {currentNFT.rejectionCount > 0 && (
                  <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-6">
                    <div className="text-red-400 text-sm font-semibold mb-1">
                      Previously rejected {currentNFT.rejectionCount} time(s)
                    </div>
                    {currentNFT.rejectionReason && (
                      <div className="text-red-300 text-sm">
                        Last reason: {currentNFT.rejectionReason}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold text-lg transition-colors"
                  >
                    {actionLoading ? '...' : 'Decline (D)'}
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-3 rounded-lg font-semibold text-lg transition-colors"
                  >
                    {actionLoading ? '...' : 'Accept (A)'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
                <p className="text-gray-400 mb-6">
                  No more images pending review in this phase.
                </p>
                {stats && stats.approved === stats.total && (
                  <Link
                    href="/admin/image-review"
                    className="inline-block bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Return to activate phase
                  </Link>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Progress Bar */}
        <footer className="bg-gray-900 border-t border-gray-800 px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">Progress:</span>
            <div className="flex-1 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-600 to-green-400 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-white font-semibold">{progress}% approved</span>
            <span className="text-gray-400 text-sm">
              ({stats?.approved || 0}/{stats?.total || 0})
            </span>
          </div>
        </footer>

        {/* Keyboard Shortcuts Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
            <div className="bg-gray-900 rounded-lg p-6 max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-white mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Accept image</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-white">A</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Decline image</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-white">D</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Show/hide help</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-white">?</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Exit review</span>
                  <kbd className="bg-gray-700 px-2 py-1 rounded text-white">Esc</kbd>
                </div>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-white mb-4">Reject Image</h3>
              <p className="text-gray-400 text-sm mb-4">
                Select a reason for rejecting "{currentNFT?.name}". The image will be automatically regenerated.
              </p>

              <div className="space-y-2 mb-4">
                {REJECTION_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className={`block p-3 rounded-lg cursor-pointer border transition-colors ${
                      selectedReason === reason
                        ? 'border-red-500 bg-red-900/30'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="rejection-reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-white text-sm">{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'Other (custom reason)' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Enter custom rejection reason..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm mb-4 resize-none"
                  rows={3}
                />
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setSelectedReason('');
                    setCustomReason('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || !selectedReason || (selectedReason === 'Other (custom reason)' && !customReason)}
                  className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject & Regenerate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
