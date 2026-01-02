import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFT {
  id: string;
  tokenId: number;
  name: string;
  cosmicScore: number;
  objectType: string;
  image: string;
}

interface Listing {
  id: string;
  tokenId: number;
  sellerAddress: string;
  priceCents: number;
  status: string;
  createdAt: string;
  nft: NFT;
}

interface FloorStats {
  floorPrice: string;
  activeListingsCount: number;
  averagePrice: string;
}

interface MarketplaceSettings {
  tradingEnabled: boolean;
  listingsEnabled: boolean;
  offersEnabled: boolean;
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [floorStats, setFloorStats] = useState<FloorStats | null>(null);
  const [settings, setSettings] = useState<MarketplaceSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'score_desc'>('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchData();
  }, [sortBy, page]);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [listingsRes, floorRes, settingsRes] = await Promise.all([
        fetch(`${apiUrl}/api/marketplace/listings?page=${page}&limit=20&sortBy=${sortBy}`),
        fetch(`${apiUrl}/api/marketplace/floor-price`),
        fetch(`${apiUrl}/api/marketplace/settings`),
      ]);

      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.listings || []);
        setTotalPages(data.totalPages || 1);
      }

      if (floorRes.ok) {
        const data = await floorRes.json();
        setFloorStats(data);
      }

      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getBadge(score: number): { label: string; color: string } {
    if (score >= 425) return { label: 'ELITE', color: 'bg-yellow-500' };
    if (score >= 400) return { label: 'PREMIUM', color: 'bg-purple-500' };
    if (score >= 375) return { label: 'EXCEPTIONAL', color: 'bg-blue-500' };
    return { label: 'STANDARD', color: 'bg-gray-500' };
  }

  return (
    <>
      <Head>
        <title>Marketplace | CosmoNFT</title>
        <meta name="description" content="Browse and buy cosmic NFTs on the marketplace" />
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-white">CosmoNFT</Link>
            <nav className="flex gap-6">
              <Link href="/browse" className="text-gray-400 hover:text-white">Browse</Link>
              <Link href="/marketplace" className="text-purple-400 font-semibold">Marketplace</Link>
              <Link href="/auctions" className="text-gray-400 hover:text-white">Auctions</Link>
              <Link href="/account" className="text-gray-400 hover:text-white">My Account</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Marketplace Status Banner */}
          {settings && !settings.tradingEnabled && (
            <div className="bg-yellow-600/20 border border-yellow-600 rounded-lg p-4 mb-8">
              <p className="text-yellow-400 text-center">
                Marketplace trading is currently disabled. Check back soon!
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Floor Price</div>
              <div className="text-3xl font-bold text-green-400">
                {floorStats?.floorPrice || '$0.00'}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Active Listings</div>
              <div className="text-3xl font-bold text-blue-400">
                {floorStats?.activeListingsCount || 0}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Average Price</div>
              <div className="text-3xl font-bold text-purple-400">
                {floorStats?.averagePrice || '$0.00'}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-white">Marketplace</h1>
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="score_desc">Score: High to Low</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="text-white text-xl">Loading...</div>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No listings available</p>
              <p className="text-gray-500 mt-2">Be the first to list an NFT!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => {
                const badge = getBadge(listing.nft.cosmicScore);
                return (
                  <Link
                    key={listing.id}
                    href={`/marketplace/${listing.tokenId}`}
                    className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden hover:border-purple-500 transition-colors"
                  >
                    <div className="aspect-square bg-gray-800 relative">
                      {listing.nft.image ? (
                        <img
                          src={listing.nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                          alt={listing.nft.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          No Image
                        </div>
                      )}
                      <span className={`absolute top-2 right-2 px-2 py-1 ${badge.color} text-white text-xs font-semibold rounded`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="text-white font-semibold truncate">{listing.nft.name}</h3>
                      <p className="text-gray-400 text-sm">Score: {listing.nft.cosmicScore}</p>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-green-400 font-bold text-lg">
                          {formatPrice(listing.priceCents)}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {formatAddress(listing.sellerAddress)}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
