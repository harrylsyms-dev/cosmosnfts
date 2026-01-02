import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import NFTCard from '../components/NFTCard';
import { useCart } from '../hooks/useCart';

interface NFT {
  id: number;
  name: string;
  image: string;
  score: number;
  badge: string;
  displayPrice: string;
  currentPrice: number;
  objectType: string;
}

const OBJECT_TYPES = ['All', 'Star', 'Exoplanet', 'Galaxy', 'Nebula', 'Asteroid', 'Comet', 'Star Cluster', 'Black Hole', 'Pulsar'];
const BADGES = ['All', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'];
const SORT_OPTIONS = [
  { value: 'score-desc', label: 'Highest Score' },
  { value: 'score-asc', label: 'Lowest Score' },
  { value: 'price-desc', label: 'Highest Price' },
  { value: 'price-asc', label: 'Lowest Price' },
  { value: 'name-asc', label: 'Name A-Z' },
];

export default function Browse() {
  const { addToCart } = useCart();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    type: 'All',
    badge: 'All',
    sort: 'score-desc',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 24;

  useEffect(() => {
    fetchNfts();
  }, [filter, page]);

  async function fetchNfts() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
        sortBy: filter.sort.split('-')[0],
        order: filter.sort.split('-')[1],
      });

      if (filter.type !== 'All') {
        params.append('type', filter.type);
      }
      if (filter.badge !== 'All') {
        params.append('badge', filter.badge);
      }
      if (filter.search) {
        params.append('search', filter.search);
      }

      const res = await fetch(`/api/nfts/available?${params}`);
      const data = await res.json();
      setNfts(data.items || []);
      setTotalPages(Math.ceil((data.total || 0) / limit));
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(key: string, value: string) {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  return (
    <Layout>
      <Head>
        <title>Browse NFTs - CosmoNFT</title>
        <meta name="description" content="Browse our collection of celestial object NFTs" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Browse Collection</h1>

        {/* Filters */}
        <div className="bg-gray-900 rounded-lg p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search by name..."
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Object Type */}
            <select
              value={filter.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {OBJECT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All Types' : type}
                </option>
              ))}
            </select>

            {/* Badge */}
            <select
              value={filter.badge}
              onChange={(e) => handleFilterChange('badge', e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {BADGES.map((badge) => (
                <option key={badge} value={badge}>
                  {badge === 'All' ? 'All Badges' : badge}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={filter.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-lg h-96 loading-shimmer" />
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-xl">No NFTs found matching your filters</p>
            <button
              onClick={() => setFilter({ type: 'All', badge: 'All', sort: 'score-desc', search: '' })}
              className="mt-4 text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onAddToCart={() => addToCart(nft.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  Previous
                </button>
                <span className="text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
