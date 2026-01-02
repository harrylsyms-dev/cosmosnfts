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

export default function AdminAuctions() {
  const router = useRouter();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    tokenId: '',
    startingBid: '500',
    durationDays: '7',
  });
  const [isCreating, setIsCreating] = useState(false);

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

      await fetchAuctions();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchAuctions() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/auctions`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setAuctions(data.auctions || []);
      }
    } catch (error) {
      console.error('Failed to fetch auctions:', error);
    }
  }

  async function handleCreateAuction(e: React.FormEvent) {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/auctions/create`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          tokenId: parseInt(createForm.tokenId),
          startingBidCents: parseInt(createForm.startingBid) * 100,
          durationDays: parseInt(createForm.durationDays),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowCreateForm(false);
        setCreateForm({ tokenId: '', startingBid: '500', durationDays: '7' });
        await fetchAuctions();
      } else {
        setError(data.error || 'Failed to create auction');
      }
    } catch (error) {
      setError('Failed to create auction');
    } finally {
      setIsCreating(false);
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
          {error && (
            <div className="mb-6 p-4 rounded bg-red-900/30 border border-red-600 text-red-400">
              {error}
              <button onClick={() => setError(null)} className="float-right hover:opacity-75">&times;</button>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage Auctions</h1>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
            >
              {showCreateForm ? 'Cancel' : 'Create Auction'}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-8">
              <h2 className="text-xl font-bold mb-4">Create New Auction</h2>
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
                <p className="text-xl mb-2">No auctions yet</p>
                <p>Create your first auction to get started</p>
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
                          auction.status === 'active' ? 'bg-green-900 text-green-300' :
                          auction.status === 'ended' ? 'bg-gray-700 text-gray-300' :
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
