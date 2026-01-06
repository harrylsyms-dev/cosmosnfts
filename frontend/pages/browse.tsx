import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import NFTCard from '../components/NFTCard';
import { useCart } from '../hooks/useCart';
import {
  TIER_ORDER,
  TIER_CONFIG,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
  BadgeTier,
  ObjectCategory,
} from '../lib/constants';

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

// Build category options from constants
const CATEGORY_OPTIONS = [
  { value: 'All', label: 'All Categories' },
  ...CATEGORY_ORDER.map((cat) => ({
    value: cat,
    label: `${CATEGORY_CONFIG[cat].icon} ${CATEGORY_CONFIG[cat].label}`,
  })),
];

// Build tier options from constants
const TIER_OPTIONS = [
  { value: 'All', label: 'All Tiers' },
  ...TIER_ORDER.map((tier) => ({
    value: tier,
    label: `${TIER_CONFIG[tier].icon} ${tier}`,
  })),
];

const SORT_OPTIONS = [
  { value: 'score-desc', label: 'Score (High to Low)' },
  { value: 'score-asc', label: 'Score (Low to High)' },
  { value: 'price-desc', label: 'Price (High to Low)' },
  { value: 'price-asc', label: 'Price (Low to High)' },
  { value: 'name-asc', label: 'Name (A-Z)' },
];

const PRICE_RANGES = [
  { value: 'All', label: 'All Prices' },
  { value: '0-10', label: 'Under $10' },
  { value: '10-50', label: '$10 - $50' },
  { value: '50-200', label: '$50 - $200' },
  { value: '200-1000', label: '$200 - $1,000' },
  { value: '1000-5000', label: '$1,000 - $5,000' },
  { value: '5000+', label: 'Over $5,000' },
];

export default function Browse() {
  const { addToCart } = useCart();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    category: 'All',
    tier: 'All',
    priceRange: 'All',
    sort: 'score-desc',
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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

      if (filter.category !== 'All') {
        params.append('type', filter.category);
      }
      if (filter.tier !== 'All') {
        params.append('badge', filter.tier);
      }
      if (filter.search) {
        params.append('search', filter.search);
      }
      if (filter.priceRange !== 'All') {
        const [min, max] = filter.priceRange.split('-');
        if (min) params.append('minPrice', (parseFloat(min) * 100).toString());
        if (max && max !== '+') params.append('maxPrice', (parseFloat(max) * 100).toString());
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/nfts/available?${params}`);
      const data = await res.json();
      setNfts(data.items || []);
      setTotalCount(data.total || 0);
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

  function clearFilters() {
    setFilter({
      category: 'All',
      tier: 'All',
      priceRange: 'All',
      sort: 'score-desc',
      search: '',
    });
    setPage(1);
  }

  const hasActiveFilters =
    filter.category !== 'All' ||
    filter.tier !== 'All' ||
    filter.priceRange !== 'All' ||
    filter.search !== '';

  return (
    <Layout>
      <Head>
        <title>Browse NFTs - CosmoNFT</title>
        <meta
          name="description"
          content="Browse our collection of 20,000 celestial object NFTs - stars, galaxies, nebulae, and more."
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Collection</h1>
          <p className="text-gray-400">
            Explore 20,000 unique celestial objects across 19 categories
          </p>
        </div>

        {/* Filters */}
        <div className="bg-gray-900 rounded-xl p-4 mb-8 border border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search by name..."
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Category</label>
              <select
                value={filter.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tier */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tier</label>
              <select
                value={filter.tier}
                onChange={(e) => handleFilterChange('tier', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              >
                {TIER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Price</label>
              <select
                value={filter.priceRange}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              >
                {PRICE_RANGES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sort By</label>
              <select
                value={filter.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filters & clear */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {totalCount.toLocaleString()} results found
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : nfts.length === 0 ? (
          <div className="text-center py-16 bg-gray-900 rounded-xl">
            <div className="text-6xl mb-4">🔭</div>
            <p className="text-gray-400 text-xl mb-2">No NFTs found</p>
            <p className="text-gray-500 mb-4">Try adjusting your filters</p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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
                  className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {page > 2 && (
                    <>
                      <button
                        onClick={() => setPage(1)}
                        className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                      >
                        1
                      </button>
                      {page > 3 && <span className="text-gray-500">...</span>}
                    </>
                  )}
                  {page > 1 && (
                    <button
                      onClick={() => setPage(page - 1)}
                      className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                    >
                      {page - 1}
                    </button>
                  )}
                  <span className="px-3 py-1 bg-blue-600 rounded font-bold">{page}</span>
                  {page < totalPages && (
                    <button
                      onClick={() => setPage(page + 1)}
                      className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                    >
                      {page + 1}
                    </button>
                  )}
                  {page < totalPages - 1 && (
                    <>
                      {page < totalPages - 2 && <span className="text-gray-500">...</span>}
                      <button
                        onClick={() => setPage(totalPages)}
                        className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
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
