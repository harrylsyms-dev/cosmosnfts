import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Listing {
  id: string;
  tokenId: number;
  sellerAddress: string;
  priceCents: number;
  status: string;
  createdAt: string;
  nft?: {
    name: string;
    cosmicScore: number;
  };
}

interface Auction {
  id: string;
  tokenId: number;
  startingPriceCents: number;
  currentBidCents: number;
  bidCount: number;
  status: string;
  startsAt: string;
  endsAt: string;
  nft?: {
    name: string;
    cosmicScore: number;
  };
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
  auctionsEnabled: boolean;
}

export default function AdminTrading() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [floorStats, setFloorStats] = useState<FloorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'auctions' | 'disputes'>('listings');
  const [marketplaceSettings, setMarketplaceSettings] = useState<MarketplaceSettings | null>(null);
  const [isTogglingMarketplace, setIsTogglingMarketplace] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

      await Promise.all([fetchListings(), fetchAuctions(), fetchFloorStats(), fetchMarketplaceSettings()]);
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

  async function handleToggleMarketplace() {
    if (!marketplaceSettings) return;

    setIsTogglingMarketplace(true);
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
          tradingEnabled: !marketplaceSettings.tradingEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMarketplaceSettings(data.settings);
        setSuccess(`Marketplace trading ${data.settings.tradingEnabled ? 'enabled' : 'disabled'}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to toggle marketplace');
      }
    } catch (error) {
      setError('Failed to toggle marketplace');
    } finally {
      setIsTogglingMarketplace(false);
    }
  }

  async function handleToggleListings() {
    if (!marketplaceSettings) return;

    setIsTogglingMarketplace(true);
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
          listingsEnabled: !marketplaceSettings.listingsEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMarketplaceSettings(data.settings);
        setSuccess(`Listings ${data.settings.listingsEnabled ? 'enabled' : 'disabled'}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to toggle listings');
      }
    } catch (error) {
      setError('Failed to toggle listings');
    } finally {
      setIsTogglingMarketplace(false);
    }
  }

  async function handleToggleOffers() {
    if (!marketplaceSettings) return;

    setIsTogglingMarketplace(true);
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
          offersEnabled: !marketplaceSettings.offersEnabled,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMarketplaceSettings(data.settings);
        setSuccess(`Offers ${data.settings.offersEnabled ? 'enabled' : 'disabled'}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to toggle offers');
      }
    } catch (error) {
      setError('Failed to toggle offers');
    } finally {
      setIsTogglingMarketplace(false);
    }
  }

  async function handleToggleAuctions() {
    if (!marketplaceSettings) return;

    setIsTogglingMarketplace(true);
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
      setIsTogglingMarketplace(false);
    }
  }

  async function fetchListings() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/marketplace/listings?limit=50`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const data = await res.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    }
  }

  async function fetchAuctions() {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${apiUrl}/api/auctions/active`, {
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

  async function fetchFloorStats() {
    try {
      const res = await fetch(`${apiUrl}/api/marketplace/floor-price`);
      if (res.ok) {
        const data = await res.json();
        setFloorStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch floor stats:', error);
    }
  }

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
        <title>Trading & Auctions | CosmoNFT Admin</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-xl font-bold text-white hover:text-gray-300">
                CosmoNFT Admin
              </Link>
              <span className="text-gray-500">/</span>
              <span className="text-gray-300">Trading & Auctions</span>
            </div>
            <nav className="flex gap-4">
              <Link href="/admin/phases" className="text-gray-400 hover:text-white">Phases</Link>
              <Link href="/admin/site" className="text-gray-400 hover:text-white">Site</Link>
              <Link href="/admin/auctions" className="text-gray-400 hover:text-white">Scheduled</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Master Marketplace Toggle */}
          <div className={`rounded-lg p-6 mb-6 border-2 ${
            marketplaceSettings?.tradingEnabled
              ? 'bg-green-900/20 border-green-600'
              : 'bg-red-900/20 border-red-600'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full ${
                  marketplaceSettings?.tradingEnabled ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Marketplace {marketplaceSettings?.tradingEnabled ? 'ENABLED' : 'DISABLED'}
                  </h1>
                  <p className="text-gray-400 text-sm mt-1">
                    {marketplaceSettings?.tradingEnabled
                      ? 'The marketplace is currently live. Users can buy, sell, and trade NFTs.'
                      : 'The marketplace is currently offline. All trading activity is paused.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleMarketplace}
                disabled={isTogglingMarketplace || !marketplaceSettings}
                className={`px-6 py-3 rounded-lg font-bold text-lg transition-all disabled:opacity-50 ${
                  marketplaceSettings?.tradingEnabled
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {isTogglingMarketplace
                  ? 'Updating...'
                  : marketplaceSettings?.tradingEnabled
                    ? 'Turn OFF'
                    : 'Turn ON'}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="mb-4 p-3 rounded bg-red-900/30 border border-red-600 text-red-400 text-sm">
              {error}
              <button onClick={() => setError(null)} className="float-right hover:opacity-75">&times;</button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded bg-green-900/30 border border-green-600 text-green-400 text-sm">
              {success}
              <button onClick={() => setSuccess(null)} className="float-right hover:opacity-75">&times;</button>
            </div>
          )}

          {/* Marketplace Controls */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Feature Controls</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Fine-tune individual marketplace features (requires marketplace to be enabled)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Listings Toggle */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Listings</div>
                    <div className="text-xs text-gray-400">Allow creating listings</div>
                  </div>
                  <button
                    onClick={handleToggleListings}
                    disabled={isTogglingMarketplace || !marketplaceSettings}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                      marketplaceSettings?.listingsEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        marketplaceSettings?.listingsEnabled ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Offers Toggle */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Offers</div>
                    <div className="text-xs text-gray-400">Allow making offers</div>
                  </div>
                  <button
                    onClick={handleToggleOffers}
                    disabled={isTogglingMarketplace || !marketplaceSettings}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                      marketplaceSettings?.offersEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        marketplaceSettings?.offersEnabled ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Auctions Toggle */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Auctions</div>
                    <div className="text-xs text-gray-400">Allow live auctions</div>
                  </div>
                  <button
                    onClick={handleToggleAuctions}
                    disabled={isTogglingMarketplace || !marketplaceSettings}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                      marketplaceSettings?.auctionsEnabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        marketplaceSettings?.auctionsEnabled ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <div className="text-gray-400 text-sm mb-1">Avg. Listing Price</div>
              <div className="text-3xl font-bold text-purple-400">
                {floorStats?.averagePrice || '$0.00'}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Active Auctions</div>
              <div className="text-3xl font-bold text-orange-400">
                {auctions.length}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'listings'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Marketplace Listings
            </button>
            <button
              onClick={() => setActiveTab('auctions')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'auctions'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Live Auctions
            </button>
            <button
              onClick={() => setActiveTab('disputes')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'disputes'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Disputes
            </button>
          </div>

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Active Marketplace Listings</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">NFT</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Token ID</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Seller</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Listed</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {listings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No active listings
                        </td>
                      </tr>
                    ) : (
                      listings.map((listing) => (
                        <tr key={listing.id}>
                          <td className="px-4 py-3 text-white">
                            {listing.nft?.name || `NFT #${listing.tokenId}`}
                          </td>
                          <td className="px-4 py-3 text-gray-300">#{listing.tokenId}</td>
                          <td className="px-4 py-3 font-mono text-sm text-gray-300">
                            {formatAddress(listing.sellerAddress)}
                          </td>
                          <td className="px-4 py-3 text-green-400 font-semibold">
                            {formatPrice(listing.priceCents)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                listing.status === 'ACTIVE'
                                  ? 'bg-green-600/30 text-green-400'
                                  : listing.status === 'SOLD'
                                  ? 'bg-blue-600/30 text-blue-400'
                                  : 'bg-gray-600/30 text-gray-400'
                              }`}
                            >
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/nft/${listing.tokenId}`}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View NFT
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Auctions Tab */}
          {activeTab === 'auctions' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Live Auctions</h2>
                <Link
                  href="/admin/auctions"
                  className="text-purple-400 hover:text-purple-300"
                >
                  Manage Scheduled Auctions
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">NFT</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Starting</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Current Bid</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Bids</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Ends</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {auctions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          No active auctions
                        </td>
                      </tr>
                    ) : (
                      auctions.map((auction) => (
                        <tr key={auction.id}>
                          <td className="px-4 py-3 text-white">
                            {auction.nft?.name || `NFT #${auction.tokenId}`}
                          </td>
                          <td className="px-4 py-3 text-gray-300">
                            {formatPrice(auction.startingPriceCents)}
                          </td>
                          <td className="px-4 py-3 text-green-400 font-semibold">
                            {formatPrice(auction.currentBidCents)}
                          </td>
                          <td className="px-4 py-3 text-purple-400">
                            {auction.bidCount}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                auction.status === 'ACTIVE'
                                  ? 'bg-green-600/30 text-green-400'
                                  : 'bg-gray-600/30 text-gray-400'
                              }`}
                            >
                              {auction.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {new Date(auction.endsAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/auctions/${auction.id}`}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disputes Tab */}
          {activeTab === 'disputes' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Trade Disputes</h2>
              <p className="text-gray-400 text-center py-8">
                No disputes to review at this time.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
