import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface AuctionStats {
  active: number;
  ended: number;
  finalized: number;
  total: number;
  totalBids: number;
  totalRevenue: number;
}

interface ScheduledAuction {
  name: string;
  week: number;
  startingBidCents: number;
  startingBidDisplay: string;
  weeksUntil: number;
  status: string;
  finalPriceCents?: number;
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

interface MarketplaceSettings {
  auctionsEnabled: boolean;
  tradingEnabled: boolean;
  listingsEnabled: boolean;
  offersEnabled: boolean;
}

export default function AdminAuctions() {
  const router = useRouter();
  const [stats, setStats] = useState<AuctionStats | null>(null);
  const [scheduledAuctions, setScheduledAuctions] = useState<ScheduledAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedAuction, setSelectedAuction] = useState<ScheduledAuction | null>(null);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [isSavingPrice, setIsSavingPrice] = useState(false);
  const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettings | null>(null);
  const [isTogglingAuctions, setIsTogglingAuctions] = useState(false);

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

      await Promise.all([fetchStats(), fetchScheduledAuctions(), fetchMarketplaceSettings()]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchMarketplaceSettings() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/marketplace/admin/settings`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setMarketplaceSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace settings:', error);
    }
  }

  async function handleToggleAuctions() {
    if (!marketplaceSettings) return;

    setIsTogglingAuctions(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/marketplace/admin/settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          auctionsEnabled: !marketplaceSettings.auctionsEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMarketplaceSettings(data.settings);
        setSuccess(`Auctions ${data.settings.auctionsEnabled ? 'enabled' : 'disabled'}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to toggle auctions');
      }
    } catch (error) {
      setError('Failed to toggle auctions');
    } finally {
      setIsTogglingAuctions(false);
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
          {/* Auctions Toggle */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Auctions System</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Enable or disable the auction system for the marketplace
                </p>
              </div>
              <button
                onClick={handleToggleAuctions}
                disabled={isTogglingAuctions || !marketplaceSettings}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 ${
                  marketplaceSettings?.auctionsEnabled
                    ? 'bg-green-600'
                    : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    marketplaceSettings?.auctionsEnabled ? 'translate-x-9' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {marketplaceSettings && (
              <div className="mt-4 flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    marketplaceSettings.auctionsEnabled
                      ? 'bg-green-900/50 text-green-400 border border-green-700'
                      : 'bg-red-900/50 text-red-400 border border-red-700'
                  }`}
                >
                  {marketplaceSettings.auctionsEnabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <span className="text-gray-500 text-sm">
                  {marketplaceSettings.auctionsEnabled
                    ? 'Users can participate in auctions'
                    : 'Auctions are currently hidden from users'}
                </span>
              </div>
            )}
          </div>

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
                    className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 text-left transition-all border border-gray-700 hover:border-purple-500 relative overflow-hidden"
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
                    {auction.status === 'FINALIZED' && auction.finalPriceCents ? (
                      <div>
                        <p className="text-xs text-gray-500 line-through">{auction.startingBidDisplay}</p>
                        <p className="text-sm text-green-400 font-medium">
                          Sold: ${(auction.finalPriceCents / 100).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-green-400 font-medium">{auction.startingBidDisplay}</p>
                    )}
                    {auction.weeksUntil > 0 && auction.status !== 'FINALIZED' && (
                      <p className="text-xs text-gray-500 mt-1">
                        {auction.weeksUntil} week{auction.weeksUntil !== 1 ? 's' : ''} away
                      </p>
                    )}
                    {!auction.nft && (
                      <p className="text-xs text-red-400 mt-2">NFT not found</p>
                    )}
                    {/* Image thumbnail in bottom right */}
                    {auction.nft?.image && (
                      <div className="absolute bottom-2 right-2 w-12 h-12 rounded-lg overflow-hidden border border-gray-600 shadow-lg">
                        <img
                          src={auction.nft.image}
                          alt={auction.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
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
