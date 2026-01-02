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

export default function AdminAuctions() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [stats, setStats] = useState<AuctionStats | null>(null);
  const [reservedNFTs, setReservedNFTs] = useState<ReservedNFT[]>([]);
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

      await Promise.all([fetchAuctions(), fetchStats(), fetchReservedNFTs('1')]);
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
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
