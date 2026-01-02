import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFT {
  id: string;
  tokenId: number;
  name: string;
  cosmicScore: number;
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

export default function MyListings() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [myNFTs, setMyNFTs] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [listPrice, setListPrice] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const wallet = localStorage.getItem('walletAddress');
    if (!wallet) {
      router.push('/account/login');
      return;
    }
    setWalletAddress(wallet);
    fetchData(wallet);
  }, []);

  async function fetchData(wallet: string) {
    setIsLoading(true);
    try {
      // Fetch user's listings
      const listingsRes = await fetch(
        `${apiUrl}/api/marketplace/my-listings?walletAddress=${wallet}`
      );
      if (listingsRes.ok) {
        const data = await listingsRes.json();
        setListings(data.listings || []);
      }

      // Fetch user's owned NFTs
      const nftsRes = await fetch(`${apiUrl}/api/nfts?ownerAddress=${wallet}`);
      if (nftsRes.ok) {
        const data = await nftsRes.json();
        setMyNFTs(data.nfts || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateListing() {
    if (!selectedNFT || !listPrice || parseFloat(listPrice) <= 0) {
      alert('Please select an NFT and enter a valid price');
      return;
    }

    setActionLoading('create');
    try {
      const res = await fetch(`${apiUrl}/api/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: selectedNFT.tokenId,
          sellerAddress: walletAddress,
          priceCents: Math.round(parseFloat(listPrice) * 100),
        }),
      });

      if (res.ok) {
        alert('Listing created successfully!');
        setShowListModal(false);
        setSelectedNFT(null);
        setListPrice('');
        fetchData(walletAddress!);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to create listing');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelListing(listingId: string) {
    if (!confirm('Cancel this listing?')) return;

    setActionLoading(`cancel-${listingId}`);
    try {
      const res = await fetch(`${apiUrl}/api/marketplace/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerAddress: walletAddress }),
      });

      if (res.ok) {
        alert('Listing cancelled');
        fetchData(walletAddress!);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to cancel listing');
      }
    } catch (error) {
      console.error('Failed to cancel listing:', error);
      alert('Failed to cancel listing');
    } finally {
      setActionLoading(null);
    }
  }

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  // NFTs available to list (not already listed)
  const listedTokenIds = new Set(
    listings.filter((l) => l.status === 'ACTIVE').map((l) => l.tokenId)
  );
  const availableToList = myNFTs.filter((nft) => !listedTokenIds.has(nft.tokenId));

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
        <title>My Listings | CosmoNFT Marketplace</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-white">CosmoNFT</Link>
            <nav className="flex gap-6">
              <Link href="/marketplace" className="text-gray-400 hover:text-white">Marketplace</Link>
              <Link href="/marketplace/my-listings" className="text-purple-400 font-semibold">
                My Listings
              </Link>
              <Link href="/marketplace/my-offers" className="text-gray-400 hover:text-white">
                My Offers
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">My Listings</h1>
            <button
              onClick={() => setShowListModal(true)}
              disabled={availableToList.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              List an NFT
            </button>
          </div>

          {/* Active Listings */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Active Listings ({listings.filter((l) => l.status === 'ACTIVE').length})
            </h2>

            {listings.filter((l) => l.status === 'ACTIVE').length === 0 ? (
              <div className="bg-gray-900 rounded-lg p-8 border border-gray-800 text-center">
                <p className="text-gray-400">You don&apos;t have any active listings</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings
                  .filter((l) => l.status === 'ACTIVE')
                  .map((listing) => (
                    <div
                      key={listing.id}
                      className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden"
                    >
                      <div className="aspect-video bg-gray-800">
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
                      </div>
                      <div className="p-4">
                        <h3 className="text-white font-semibold">{listing.nft.name}</h3>
                        <p className="text-gray-400 text-sm">Score: {listing.nft.cosmicScore}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className="text-green-400 font-bold">
                            {formatPrice(listing.priceCents)}
                          </span>
                          <button
                            onClick={() => handleCancelListing(listing.id)}
                            disabled={!!actionLoading}
                            className="text-red-400 hover:text-red-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Past Listings */}
          {listings.filter((l) => l.status !== 'ACTIVE').length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Past Listings</h2>
              <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">NFT</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {listings
                      .filter((l) => l.status !== 'ACTIVE')
                      .map((listing) => (
                        <tr key={listing.id}>
                          <td className="px-4 py-3 text-white">{listing.nft.name}</td>
                          <td className="px-4 py-3 text-green-400">
                            {formatPrice(listing.priceCents)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                listing.status === 'SOLD'
                                  ? 'bg-green-600/30 text-green-400'
                                  : 'bg-gray-600/30 text-gray-400'
                              }`}
                            >
                              {listing.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Create Listing Modal */}
      {showListModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">List an NFT for Sale</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Select NFT</label>
                <select
                  value={selectedNFT?.tokenId || ''}
                  onChange={(e) => {
                    const nft = availableToList.find(
                      (n) => n.tokenId === parseInt(e.target.value)
                    );
                    setSelectedNFT(nft || null);
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select an NFT</option>
                  {availableToList.map((nft) => (
                    <option key={nft.tokenId} value={nft.tokenId}>
                      {nft.name} (Score: {nft.cosmicScore})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="text-gray-400 text-sm">
                <p>20% of the sale goes to the creator as royalty</p>
                <p>You will receive 80% of the sale price</p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateListing}
                disabled={!selectedNFT || !listPrice || !!actionLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading === 'create' ? 'Creating...' : 'Create Listing'}
              </button>
              <button
                onClick={() => {
                  setShowListModal(false);
                  setSelectedNFT(null);
                  setListPrice('');
                }}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
