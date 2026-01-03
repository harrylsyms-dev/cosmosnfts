import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFT {
  id: number;
  tokenId: number;
  name: string;
  description?: string;
  objectType: string;
  totalScore: number;
  badgeTier: string;
  status: string;
  currentPrice: number;
  image: string | null;
}

interface NFTDetail {
  id: number;
  tokenId: number;
  name: string;
  description: string;
  objectType: string;
  status: string;
  totalScore: number;
  scores: {
    fameVisibility: number;
    scientificSignificance: number;
    rarity: number;
    discoveryRecency: number;
    culturalImpact: number;
  };
  discoveryYear: number | null;
  badgeTier: string;
  currentPrice: number;
  displayPrice: string;
  priceFormula: string;
  currentPhase: number;
  phaseMultiplier: string;
  image: string | null;
  imageIpfsHash: string | null;
  metadataIpfsHash: string | null;
  ownerAddress: string | null;
  transactionHash: string | null;
  createdAt: string;
  updatedAt: string;
  mintedAt: string | null;
  soldAt: string | null;
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
  const [selectedNft, setSelectedNft] = useState<NFTDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
      const token = localStorage.getItem('adminToken');
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
      });

      if (search) params.append('search', search);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterBadge !== 'all') params.append('badge', filterBadge);

      const res = await fetch(`${apiUrl}/api/admin/nfts?${params}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setNfts(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    }
  }

  async function handleViewNft(id: number) {
    setIsLoadingDetail(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/${id}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setSelectedNft(data.nft);
      }
    } catch (error) {
      console.error('Failed to fetch NFT details:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchNFTs();
  }

  function formatAddress(address: string | null): string {
    if (!address) return 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  async function handleGenerateImage(nftId: number) {
    setIsGeneratingImage(true);
    setGenerateMessage(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/admin/nfts/${nftId}/generate-image`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setGenerateMessage({ type: 'success', text: data.message || 'Image generation started!' });
        // Refresh NFT details after a short delay
        setTimeout(() => handleViewNft(nftId), 3000);
      } else {
        setGenerateMessage({ type: 'error', text: data.error || 'Failed to generate image' });
      }
    } catch (error) {
      setGenerateMessage({ type: 'error', text: 'Failed to generate image' });
    } finally {
      setIsGeneratingImage(false);
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
                <option value="MINTED">Minted</option>
                <option value="RESERVED">Reserved</option>
                <option value="AUCTION_RESERVED">Auction Reserved</option>
                <option value="AUCTIONED">Auctioned</option>
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
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {nfts.map((nft) => (
                    <tr
                      key={nft.id}
                      className="border-t border-gray-800 hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => handleViewNft(nft.id)}
                    >
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
                          nft.status === 'SOLD' || nft.status === 'MINTED' ? 'bg-blue-900 text-blue-300' :
                          nft.status === 'AUCTION_RESERVED' || nft.status === 'AUCTIONED' ? 'bg-purple-900 text-purple-300' :
                          'bg-yellow-900 text-yellow-300'
                        }`}>
                          {nft.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewNft(nft.id); }}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View Details
                        </button>
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

        {/* NFT Detail Modal */}
        {(selectedNft || isLoadingDetail) && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {isLoadingDetail ? (
                <div className="p-8 text-center">
                  <div className="text-white text-xl">Loading...</div>
                </div>
              ) : selectedNft && (
                <>
                  <div className="p-6 border-b border-gray-800 flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedNft.name}</h2>
                      <p className="text-gray-400">Token ID: #{selectedNft.tokenId}</p>
                    </div>
                    <button
                      onClick={() => setSelectedNft(null)}
                      className="text-gray-400 hover:text-white text-2xl"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    {/* Left Column - Image & Description */}
                    <div>
                      {selectedNft.image ? (
                        <img
                          src={selectedNft.image}
                          alt={selectedNft.name}
                          className="w-full rounded-lg mb-4"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-gray-800 rounded-lg flex items-center justify-center mb-4">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-2">Description</h3>
                        <p className="text-gray-400 text-sm">{selectedNft.description || 'No description'}</p>
                      </div>
                    </div>

                    {/* Right Column - Details */}
                    <div className="space-y-4">
                      {/* Status & Badge */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            selectedNft.status === 'AVAILABLE' ? 'bg-green-600 text-white' :
                            selectedNft.status === 'SOLD' || selectedNft.status === 'MINTED' ? 'bg-blue-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {selectedNft.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            selectedNft.badgeTier === 'ELITE' ? 'bg-yellow-600 text-white' :
                            selectedNft.badgeTier === 'PREMIUM' ? 'bg-blue-600 text-white' :
                            selectedNft.badgeTier === 'EXCEPTIONAL' ? 'bg-cyan-600 text-white' :
                            'bg-gray-600 text-white'
                          }`}>
                            {selectedNft.badgeTier}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400">
                          Type: {selectedNft.objectType}
                          {selectedNft.discoveryYear && ` | Discovered: ${selectedNft.discoveryYear}`}
                        </div>
                      </div>

                      {/* Score Breakdown */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Score Breakdown</h3>
                        <div className="text-3xl font-bold text-purple-400 mb-4">
                          {selectedNft.totalScore}/500
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Fame/Visibility</span>
                            <span className="text-white">{selectedNft.scores.fameVisibility}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Scientific Significance</span>
                            <span className="text-white">{selectedNft.scores.scientificSignificance}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rarity</span>
                            <span className="text-white">{selectedNft.scores.rarity}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Discovery Recency</span>
                            <span className="text-white">{selectedNft.scores.discoveryRecency}/100</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Cultural Impact</span>
                            <span className="text-white">{selectedNft.scores.culturalImpact}/100</span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Pricing</h3>
                        <div className="text-3xl font-bold text-green-400 mb-2">
                          {selectedNft.displayPrice}
                        </div>
                        <div className="text-sm text-gray-400">
                          <p>Formula: {selectedNft.priceFormula}</p>
                          <p>Phase: {selectedNft.currentPhase} | Multiplier: {selectedNft.phaseMultiplier}x</p>
                        </div>
                      </div>

                      {/* Ownership & Blockchain */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Ownership & Blockchain</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Owner</span>
                            <span className="text-white font-mono">
                              {formatAddress(selectedNft.ownerAddress)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">TX Hash</span>
                            <span className="text-white font-mono">
                              {selectedNft.transactionHash ? (
                                <a
                                  href={`https://polygonscan.com/tx/${selectedNft.transactionHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {formatAddress(selectedNft.transactionHash)}
                                </a>
                              ) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* IPFS */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">IPFS</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Image Hash</span>
                            <span className="text-white font-mono text-xs">
                              {selectedNft.imageIpfsHash ? (
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${selectedNft.imageIpfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {selectedNft.imageIpfsHash.slice(0, 12)}...
                                </a>
                              ) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Metadata Hash</span>
                            <span className="text-white font-mono text-xs">
                              {selectedNft.metadataIpfsHash ? (
                                <a
                                  href={`https://gateway.pinata.cloud/ipfs/${selectedNft.metadataIpfsHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  {selectedNft.metadataIpfsHash.slice(0, 12)}...
                                </a>
                              ) : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="bg-gray-800 rounded-lg p-4">
                        <h3 className="font-semibold text-white mb-3">Timestamps</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Created</span>
                            <span className="text-white">{new Date(selectedNft.createdAt).toLocaleString()}</span>
                          </div>
                          {selectedNft.mintedAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Minted</span>
                              <span className="text-white">{new Date(selectedNft.mintedAt).toLocaleString()}</span>
                            </div>
                          )}
                          {selectedNft.soldAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Sold</span>
                              <span className="text-white">{new Date(selectedNft.soldAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-6 border-t border-gray-800">
                    {generateMessage && (
                      <div className={`mb-4 p-3 rounded-lg ${
                        generateMessage.type === 'success'
                          ? 'bg-green-900/30 border border-green-600 text-green-400'
                          : 'bg-red-900/30 border border-red-600 text-red-400'
                      }`}>
                        {generateMessage.text}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleGenerateImage(selectedNft.id)}
                        disabled={isGeneratingImage}
                        className="flex-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
                      >
                        {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                      </button>
                      <Link
                        href={`/nft/${selectedNft.tokenId}`}
                        target="_blank"
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-center"
                      >
                        View Public Page
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedNft(null);
                          setGenerateMessage(null);
                        }}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-lg"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
