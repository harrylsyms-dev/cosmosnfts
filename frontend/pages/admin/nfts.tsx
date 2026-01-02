import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFT {
  id: number;
  name: string;
  objectType: string;
  totalScore: number;
  badgeTier: string;
  status: string;
  currentPrice: number;
  image: string | null;
}

export default function AdminNFTs() {
  const router = useRouter();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBadge, setFilterBadge] = useState('all');
  const limit = 50;

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      fetchNFTs();
    }
  }, [page, filterStatus, filterBadge]);

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

      await fetchNFTs();
    } catch (error) {
      router.push('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchNFTs() {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBadge !== 'all') params.append('badge', filterBadge);

      const res = await fetch(`${apiUrl}/api/nfts/available?${params}`);
      const data = await res.json();
      setNfts(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchNFTs();
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
        <title>NFTs | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-400">NFTs</span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6">Browse NFTs</h1>

          {/* Filters */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              />
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="SOLD">Sold</option>
                <option value="RESERVED">Reserved</option>
              </select>
              <select
                value={filterBadge}
                onChange={(e) => { setFilterBadge(e.target.value); setPage(1); }}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="all">All Badges</option>
                <option value="ELITE">Elite</option>
                <option value="PREMIUM">Premium</option>
                <option value="EXCEPTIONAL">Exceptional</option>
                <option value="STANDARD">Standard</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
              >
                Search
              </button>
            </form>
          </div>

          <div className="mb-4 text-gray-400">
            Showing {nfts.length} of {total.toLocaleString()} NFTs
          </div>

          {/* NFT Table */}
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Score</th>
                    <th className="px-4 py-3 text-left">Badge</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {nfts.map((nft) => (
                    <tr key={nft.id} className="border-t border-gray-800 hover:bg-gray-800/50">
                      <td className="px-4 py-3">#{nft.id}</td>
                      <td className="px-4 py-3 font-medium">{nft.name}</td>
                      <td className="px-4 py-3 text-gray-400">{nft.objectType}</td>
                      <td className="px-4 py-3">{nft.totalScore}/500</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          nft.badgeTier === 'ELITE' ? 'bg-yellow-900 text-yellow-300' :
                          nft.badgeTier === 'PREMIUM' ? 'bg-blue-900 text-blue-300' :
                          nft.badgeTier === 'EXCEPTIONAL' ? 'bg-cyan-900 text-cyan-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {nft.badgeTier}
                        </span>
                      </td>
                      <td className="px-4 py-3">${nft.currentPrice?.toFixed(2) || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-sm ${
                          nft.status === 'AVAILABLE' ? 'bg-green-900 text-green-300' :
                          nft.status === 'SOLD' ? 'bg-blue-900 text-blue-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {nft.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {nft.image ? (
                          <span className="text-green-400">Yes</span>
                        ) : (
                          <span className="text-gray-500">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 hover:bg-gray-700"
            >
              Next
            </button>
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
