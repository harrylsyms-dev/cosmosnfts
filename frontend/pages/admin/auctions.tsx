import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Auction {
  id: string;
  tokenId: number;
  nftName: string;
  startingBid: number;
  currentBid: number;
  bidCount: number;
  status: string;
  startTime: string;
  endTime: string;
}

interface AuctionStats {
  active: number;
  ended: number;
  finalized: number;
  total: number;
  totalBids: number;
  totalRevenue: number;
}

interface ReservedNFT {
  id: number;
  tokenId: number;
  name: string;
  totalScore: number;
  badgeTier: string;
}

interface ScheduledAuction {
  name: string;
  week: number;
  startingBidCents: number;
  startingBidDisplay: string;
  weeksUntil: number;
  status: string;
  existingAuctionId: string | null;
  nft: {
    id: number;
    tokenId: number;
    name: string;
    cosmicScore: number;
    objectType: string;
    image: string | null;
    description: string;
    scores: {
      fame: number;
      significance: number;
      rarity: number;
      discoveryRecency: number;
      culturalImpact: number;
    };
  } | null;
}

export default function AdminAuctions() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<AuctionStats | null>(null);
  const [reservedNFTs, setReservedNFTs] = useState<ReservedNFT[]>([]);
  const [scheduledAuctions, setScheduledAuctions] = useState<ScheduledAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    tokenId: '',
    startingBid: '500',
    durationDays: '7',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [autoPopulatePhase, setAutoPopulatePhase] = useState('1');
  const [autoPopulateCount, setAutoPopulateCount] = useState('5');
  const [isAutoPopulating, setIsAutoPopulating] = useState(false);
  const [previewPhase, setPreviewPhase] = useState('1');
  const [selectedAuction, setSelectedAuction] = useState<ScheduledAuction | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);

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

      await Promise.all([fetchAuctions(), fetchStats(), fetchReservedNFTs('1'), fetchScheduledAuctions()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchScheduledAuctions() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/auctions/admin/scheduled`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setScheduledAuctions(data.schedule || []);
        setCurrentWeek(data.currentWeek || 0);
      }
    } catch (error) {
      console.error('Failed to fetch scheduled auctions:', error);
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-900 text-green-300';
      case 'ENDED':
        return 'bg-gray-700 text-gray-300';
      case 'FINALIZED':
        return 'bg-blue-900 text-blue-300';
      case 'READY':
        return 'bg-yellow-900 text-yellow-300';
      default:
        return 'bg-purple-900 text-purple-300';
    }
  }

  function getObjectTypeIcon(objectType: string) {
    switch (objectType?.toLowerCase()) {
      case 'star':
        return '⭐';
      case 'planet':
        return '🪐';
      case 'galaxy':
        return '🌌';
      case 'nebula':
        return '💫';
      case 'moon':
        return '🌙';
      default:
        return '✨';
    }
  }

  function handleEditPrice(auction: ScheduledAuction) {
    setEditingPrice(true);
    setNewPrice((auction.startingBidCents / 100).toString());
  }

  async function handleSavePrice() {
    if (!selectedAuction || !newPrice) return;

    setIsSavingPrice(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/auctions/admin/scheduled/price`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: selectedAuction.name,
          startingBidCents: Math.round(parseFloat(newPrice) * 100),
        }),
      });

      if (res.ok) {
        setSuccess('Starting bid updated successfully');
        setEditingPrice(false);
        await fetchScheduledAuctions();
        // Update selected auction with new price
        const updatedPrice = Math.round(parseFloat(newPrice) * 100);
        setSelectedAuction({
          ...selectedAuction,
          startingBidCents: updatedPrice,
          startingBidDisplay: `$${(updatedPrice / 100).toLocaleString()}`,
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update price');
      }
    } catch (error) {
      setError('Failed to update price');
    } finally {
      setIsSavingPrice(false);
    }
  }

  function handleCloseModal() {
    setSelectedAuction(null);
    setEditingPrice(false);
    setNewPrice('');
  }

  async function fetchAuctions() {
    try {
      const res = await fetch(`${apiUrl}/api/auctions/active`);

      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    }
  }

  async function fetchStats() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/auctions/admin/stats`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch auction stats:', error);
    }
  }

  async function fetchReservedNFTs(phase: string) {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/auctions/admin/reserved/${phase}?count=5`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setReservedNFTs(data.reserved || []);
      }
    } catch (error) {
      console.error('Failed to fetch reserved NFTs:', error);
    }
  }

  async function handleCreateAuction(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/auctions/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tokenId: parseInt(createForm.tokenId),
          nftName: `NFT #${createForm.tokenId}`,
          startingBidCents: parseInt(createForm.startingBid) * 100,
          durationDays: parseInt(createForm.durationDays),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        setCreateForm({ tokenId: '', startingBid: '500', durationDays: '7' });
        setSuccess('Auction created successfully');
        await Promise.all([fetchAuctions(), fetchStats()]);
      } else {
        setError(data.error || 'Failed to create auction');
      }
    } catch (error) {
      setError('Failed to create auction');
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAutoPopulate(e: React.FormEvent) {
    e.preventDefault();
    setIsAutoPopulating(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/auctions/admin/auto-populate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          phase: parseInt(autoPopulatePhase),
          count: parseInt(autoPopulateCount),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || `Created ${data.auctionsCreated} auctions`);
        await Promise.all([fetchAuctions(), fetchStats(), fetchReservedNFTs(autoPopulatePhase)]);
      } else {
        setError(data.error || 'Failed to auto-populate auctions');
      }
    } catch (error) {
      setError('Failed to auto-populate auctions');
    } finally {
      setIsAutoPopulating(false);
    }
  }

  function handlePreviewPhaseChange(phase: string) {
    setPreviewPhase(phase);
    fetchReservedNFTs(phase);
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
        <title>Auctions | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">Auctions</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-6 p-4 rounded bg-red-900/30 border border-red-600 text-red-400">
              {error}
              <button onClick={() => setError(null)} className="float-right hover:opacity-75">&times;</button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded bg-green-900/30 border border-green-600 text-green-400">
              {success}
              <button onClick={() => setSuccess(null)} className="float-right hover:opacity-75">&times;</button>
            </div>
          )}

          {/* Stats */}
          {stats && (
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-green-400">{stats.active}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">Ended</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.ended}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">Finalized</p>
                <p className="text-2xl font-bold text-blue-400">{stats.finalized}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
                <p className="text-gray-400 text-sm">Total Bids</p>
                <p className="text-2xl font-bold">{stats.totalBids}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4 border border-green-800">
                <p className="text-gray-400 text-sm">Revenue</p>
                <p className="text-2xl font-bold text-green-400">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Selected Auction Modal */}
          {selectedAuction && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 rounded-xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedAuction.name}</h2>
                      <p className="text-gray-400">
                        {getObjectTypeIcon(selectedAuction.nft?.objectType || '')} {selectedAuction.nft?.objectType || 'Celestial Object'}
                      </p>
                    </div>
                    <button
                      onClick={handleCloseModal}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      &times;
                    </button>
                  </div>

                  {selectedAuction.nft?.image && (
                    <div className="mb-6 bg-gray-800 rounded-lg p-4 flex justify-center">
                      <img
                        src={selectedAuction.nft.image}
                        alt={selectedAuction.name}
                        className="max-h-64 rounded-lg object-contain"
                      />
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-sm text-gray-400 mb-2">Auction Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Week</span>
                          <span className="font-medium">Week {selectedAuction.week}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Starting Bid</span>
                          {editingPrice ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400">$</span>
                              <input
                                type="number"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                className="w-24 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-right"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-green-400">{selectedAuction.startingBidDisplay}</span>
                              <button
                                onClick={() => handleEditPrice(selectedAuction)}
                                className="text-gray-400 hover:text-white text-sm"
                                title="Edit price"
                              >
                                ✏️
                              </button>
                            </div>
                          )}
                        </div>
                        {editingPrice && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={handleSavePrice}
                              disabled={isSavingPrice}
                              className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm px-3 py-1 rounded disabled:opacity-50"
                            >
                              {isSavingPrice ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingPrice(false)}
                              className="flex-1 bg-gray-600 hover:bg-gray-500 text-white text-sm px-3 py-1 rounded"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status</span>
                          <span className={`px-2 py-0.5 rounded text-sm ${getStatusColor(selectedAuction.status)}`}>
                            {selectedAuction.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Weeks Until</span>
                          <span className="font-medium">
                            {selectedAuction.weeksUntil === 0 ? 'Now' : `${selectedAuction.weeksUntil} weeks`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedAuction.nft && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="text-sm text-gray-400 mb-2">NFT Scores</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Cosmic Score</span>
                            <span className="font-bold text-xl text-purple-400">{selectedAuction.nft.cosmicScore}/500</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fame</span>
                            <span>{selectedAuction.nft.scores.fame}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Significance</span>
                            <span>{selectedAuction.nft.scores.significance}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rarity</span>
                            <span>{selectedAuction.nft.scores.rarity}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Discovery Recency</span>
                            <span>{selectedAuction.nft.scores.discoveryRecency}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Cultural Impact</span>
                            <span>{selectedAuction.nft.scores.culturalImpact}/100</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedAuction.nft?.description && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                      <h3 className="text-sm text-gray-400 mb-2">Description</h3>
                      <p className="text-gray-200">{selectedAuction.nft.description}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                    {selectedAuction.nft && (
                      <Link
                        href={`/nft/${selectedAuction.nft.tokenId}`}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-center font-medium px-4 py-2 rounded-lg"
                        target="_blank"
                      >
                        View NFT Page
                      </Link>
                    )}
                    {selectedAuction.nft && (
                      <Link
                        href={`/admin/nfts?search=${encodeURIComponent(selectedAuction.name)}`}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-center font-medium px-4 py-2 rounded-lg"
                      >
                        Manage NFT
                      </Link>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg"
                    >
                      Close
                    </button>
                  </div>

                  {selectedAuction.nft && (
                    <div className="text-sm text-gray-500 mt-4">
                      Token ID: #{selectedAuction.nft.tokenId}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Auctions Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Premium Auction Schedule</h2>
                <p className="text-gray-400 text-sm">
                  20 premium celestial objects scheduled for bi-weekly auctions
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Current Week</p>
                <p className="text-2xl font-bold text-purple-400">{currentWeek}</p>
              </div>
            </div>

            {scheduledAuctions.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {scheduledAuctions.map((auction) => (
                  <button
                    key={auction.name}
                    onClick={() => setSelectedAuction(auction)}
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-left transition-all border border-gray-700 hover:border-purple-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl">
                        {getObjectTypeIcon(auction.nft?.objectType || '')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(auction.status)}`}>
                        {auction.status}
                      </span>
                    </div>
                    <h3 className="font-medium truncate mb-1">{auction.name}</h3>
                    <p className="text-xs text-gray-400 mb-2">Week {auction.week}</p>
                    <p className="text-sm text-green-400 font-medium">{auction.startingBidDisplay}</p>
                    {auction.weeksUntil > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {auction.weeksUntil} week{auction.weeksUntil !== 1 ? 's' : ''} away
                      </p>
                    )}
                    {!auction.nft && (
                      <p className="text-xs text-red-400 mt-2">NFT not found</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Loading scheduled auctions...</p>
              </div>
            )}
          </div>

          {/* Auto-Populate Section */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
            <h2 className="text-xl font-bold mb-4">Auto-Populate Auctions</h2>
            <p className="text-gray-400 mb-4">
              Automatically create auctions for the top-scoring NFTs in a phase. Auctions run on odd-numbered phases (1, 3, 5, etc.).
            </p>

            <form onSubmit={handleAutoPopulate} className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Phase Number</label>
                <select
                  value={autoPopulatePhase}
                  onChange={(e) => setAutoPopulatePhase(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  {Array.from({ length: 41 }, (_, i) => i * 2 + 1).map((phase) => (
                    <option key={phase} value={phase.toString()}>
                      Phase {phase}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Number of Auctions</label>
                <select
                  value={autoPopulateCount}
                  onChange={(e) => setAutoPopulateCount(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="3">3 NFTs</option>
                  <option value="5">5 NFTs</option>
                  <option value="7">7 NFTs</option>
                  <option value="10">10 NFTs</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isAutoPopulating}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {isAutoPopulating ? 'Creating...' : 'Auto-Populate'}
                </button>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => handlePreviewPhaseChange(autoPopulatePhase)}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                >
                  Preview NFTs
                </button>
              </div>
            </form>

            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Reserved for Phase {previewPhase} Auctions</h3>
                <span className="text-sm text-gray-400">
                  {parseInt(previewPhase) % 2 === 1 ? 'Auction Phase' : 'Not an Auction Phase'}
                </span>
              </div>
              {reservedNFTs.length > 0 ? (
                <div className="grid md:grid-cols-5 gap-2">
                  {reservedNFTs.map((nft) => (
                    <div key={nft.tokenId} className="bg-gray-900 rounded p-3 text-sm">
                      <p className="font-medium truncate">{nft.name}</p>
                      <p className="text-gray-400">#{nft.tokenId}</p>
                      <p className="text-xs">
                        Score: <span className="text-green-400">{nft.totalScore}</span>
                        {' | '}
                        <span className={`${
                          nft.badgeTier === 'ELITE' ? 'text-purple-400' :
                          nft.badgeTier === 'PREMIUM' ? 'text-yellow-400' :
                          nft.badgeTier === 'EXCEPTIONAL' ? 'text-blue-400' :
                          'text-gray-400'
                        }`}>{nft.badgeTier}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No NFTs available for auction in this phase</p>
              )}
            </div>
          </div>

          {/* Manual Create */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Active Auctions</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
            >
              {showCreateForm ? 'Cancel' : 'Create Manual Auction'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
              <h2 className="text-lg font-bold mb-4">Create Manual Auction</h2>
              <form onSubmit={handleCreateAuction} className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">NFT Token ID</label>
                  <input
                    type="number"
                    value={createForm.tokenId}
                    onChange={(e) => setCreateForm({ ...createForm, tokenId: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    placeholder="e.g. 1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Starting Bid ($)</label>
                  <input
                    type="number"
                    value={createForm.startingBid}
                    onChange={(e) => setCreateForm({ ...createForm, startingBid: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Duration (days)</label>
                  <input
                    type="number"
                    value={createForm.durationDays}
                    onChange={(e) => setCreateForm({ ...createForm, durationDays: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-gray-900 rounded-lg overflow-hidden">
            {auctions.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-xl mb-2">No active auctions</p>
                <p>Use auto-populate or create a manual auction to get started</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">NFT</th>
                    <th className="px-4 py-3 text-left">Starting Bid</th>
                    <th className="px-4 py-3 text-left">Current Bid</th>
                    <th className="px-4 py-3 text-left">Bids</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">End Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.map((auction) => (
                    <tr key={auction.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <span className="font-medium">{auction.nftName}</span>
                        <span className="text-gray-500 ml-2">#{auction.tokenId}</span>
                      </td>
                      <td className="px-4 py-3">${(auction.startingBid / 100).toFixed(2)}</td>
                      <td className="px-4 py-3 text-green-400 font-bold">
                        ${(auction.currentBid / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">{auction.bidCount}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          auction.status === 'ACTIVE' ? 'bg-green-900 text-green-300' :
                          auction.status === 'ENDED' ? 'bg-gray-700 text-gray-300' :
                          auction.status === 'FINALIZED' ? 'bg-blue-900 text-blue-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {auction.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {new Date(auction.endTime).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-8">
            <Link href="/admin" className="text-gray-400 hover:text-white">
              &larr; Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
