import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface NFT {
  id: string;
  tokenId: number;
  name: string;
  description: string;
  cosmicScore: number;
  fameVisibility: number;
  scientificSignificance: number;
  rarity: number;
  discoveryRecency: number;
  culturalImpact: number;
  objectType: string;
  image: string;
  ownerAddress: string | null;
}

interface Listing {
  id: string;
  tokenId: number;
  sellerAddress: string;
  priceCents: number;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  nft: NFT;
  offers: Offer[];
}

interface Offer {
  id: string;
  offererAddress: string;
  offerAmountCents: number;
  status: string;
  expiresAt: string;
}

export default function ListingDetail() {
  const router = useRouter();
  const { tokenId } = router.query;
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerEmail, setOfferEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tokenId) {
      fetchListing();
    }
  }, [tokenId]);

  async function fetchListing() {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/marketplace/nft/${tokenId}`);
      if (res.ok) {
        const data = await res.json();
        setListing(data.listing);
      }
    } catch (error) {
      console.error('Failed to fetch listing:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMakeOffer() {
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      alert('Please enter a valid offer amount');
      return;
    }

    // Get wallet address from localStorage or prompt to connect
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiUrl}/api/marketplace/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenId: parseInt(tokenId as string),
          offererAddress: walletAddress,
          offererEmail: offerEmail || undefined,
          offerAmountCents: Math.round(parseFloat(offerAmount) * 100),
        }),
      });

      if (res.ok) {
        alert('Offer submitted successfully!');
        setShowOfferModal(false);
        setOfferAmount('');
        setOfferEmail('');
        fetchListing();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit offer');
      }
    } catch (error) {
      console.error('Failed to submit offer:', error);
      alert('Failed to submit offer');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleBuyNow() {
    const walletAddress = localStorage.getItem('walletAddress');
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!confirm(`Buy this NFT for ${formatPrice(listing!.priceCents)}?`)) {
      return;
    }

    // TODO: Integrate with smart contract for actual purchase
    alert('Purchase functionality coming soon! This will integrate with the smart contract.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">This NFT is not currently listed for sale</p>
          <Link href="/marketplace" className="text-purple-400 hover:text-purple-300 mt-4 inline-block">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const badge = getBadge(listing.nft.cosmicScore);

  return (
    <>
      <Head>
        <title>{listing.nft.name} | CosmoNFT Marketplace</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-white">CosmoNFT</Link>
            <nav className="flex gap-6">
              <Link href="/browse" className="text-gray-400 hover:text-white">Browse</Link>
              <Link href="/marketplace" className="text-purple-400 font-semibold">Marketplace</Link>
              <Link href="/auctions" className="text-gray-400 hover:text-white">Auctions</Link>
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/marketplace" className="text-gray-400 hover:text-white mb-4 inline-block">
            &larr; Back to Marketplace
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
            {/* Image */}
            <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
              <div className="aspect-square relative">
                {listing.nft.image ? (
                  <img
                    src={listing.nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
                    alt={listing.nft.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-2xl">
                    No Image
                  </div>
                )}
                <span className={`absolute top-4 right-4 px-3 py-1 ${badge.color} text-white text-sm font-semibold rounded`}>
                  {badge.label}
                </span>
              </div>
            </div>

            {/* Details */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{listing.nft.name}</h1>
              <p className="text-gray-400 mb-4">{listing.nft.objectType}</p>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
                <div className="text-gray-400 text-sm mb-1">Listing Price</div>
                <div className="text-4xl font-bold text-green-400 mb-2">
                  {formatPrice(listing.priceCents)}
                </div>

                <div className="text-gray-500 text-sm mb-4">
                  Original mint price: <span className="text-blue-400 font-mono">${(0.10 * listing.nft.cosmicScore).toFixed(2)}</span>
                  <span className="text-gray-600 ml-1">($0.10 × {listing.nft.cosmicScore})</span>
                </div>

                <div className="text-gray-400 text-sm">
                  Seller: <span className="font-mono">{formatAddress(listing.sellerAddress)}</span>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Make Offer
                  </button>
                </div>
              </div>

              {/* Scores */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">NFT Scores</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-400 text-sm">Cosmic Score</div>
                    <div className="text-xl font-bold text-purple-400">{listing.nft.cosmicScore}/500</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Fame</div>
                    <div className="text-lg text-white">{listing.nft.fameVisibility}/100</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Significance</div>
                    <div className="text-lg text-white">{listing.nft.scientificSignificance}/100</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Rarity</div>
                    <div className="text-lg text-white">{listing.nft.rarity}/100</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Discovery</div>
                    <div className="text-lg text-white">{listing.nft.discoveryRecency}/100</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Cultural Impact</div>
                    <div className="text-lg text-white">{listing.nft.culturalImpact}/100</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-400">{listing.nft.description}</p>
              </div>
            </div>
          </div>

          {/* Offers */}
          {listing.offers && listing.offers.length > 0 && (
            <div className="mt-8 bg-gray-900 rounded-lg p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Offers ({listing.offers.filter((o) => o.status === 'PENDING').length})
              </h3>
              <div className="space-y-2">
                {listing.offers
                  .filter((o) => o.status === 'PENDING')
                  .map((offer) => (
                    <div
                      key={offer.id}
                      className="flex justify-between items-center p-3 bg-gray-800 rounded-lg"
                    >
                      <span className="text-gray-400 font-mono">
                        {formatAddress(offer.offererAddress)}
                      </span>
                      <span className="text-green-400 font-semibold">
                        {formatPrice(offer.offerAmountCents)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Make Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Make an Offer</h3>
            <p className="text-gray-400 mb-4">
              Make an offer on {listing.nft.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Offer Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Email (optional)</label>
                <input
                  type="email"
                  value={offerEmail}
                  onChange={(e) => setOfferEmail(e.target.value)}
                  placeholder="For notifications"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleMakeOffer}
                disabled={isSubmitting}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Offer'}
              </button>
              <button
                onClick={() => setShowOfferModal(false)}
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
