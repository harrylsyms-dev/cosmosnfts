import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface Offer {
  id: string;
  tokenId: number;
  offererAddress: string;
  offerAmountCents: number;
  counterOfferCents: number | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export default function MyOffers() {
  const router = useRouter();
  const [sentOffers, setSentOffers] = useState<Offer[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counteringOfferId, setCounteringOfferId] = useState<string | null>(null);

  useEffect(() => {
    const wallet = localStorage.getItem('walletAddress');
    if (!wallet) {
      router.push('/account/login');
      return;
    }
    setWalletAddress(wallet);
    fetchOffers(wallet);
  }, []);

  async function fetchOffers(wallet: string) {
    setIsLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        fetch(`${apiUrl}/api/marketplace/my-offers?walletAddress=${wallet}`),
        fetch(`${apiUrl}/api/marketplace/offers-received?walletAddress=${wallet}`),
      ]);

      if (sentRes.ok) {
        const data = await sentRes.json();
        setSentOffers(data.offers || []);
      }

      if (receivedRes.ok) {
        const data = await receivedRes.json();
        setReceivedOffers(data.offers || []);
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAcceptOffer(offerId: string) {
    if (!confirm('Accept this offer? This will transfer the NFT.')) return;

    setActionLoading(`accept-${offerId}`);
    try {
      // TODO: Get transaction hash from smart contract
      const res = await fetch(`${apiUrl}/api/marketplace/offers/${offerId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerAddress: walletAddress,
          transactionHash: '0x' + '0'.repeat(64), // Placeholder
        }),
      });

      if (res.ok) {
        alert('Offer accepted!');
        fetchOffers(walletAddress!);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to accept offer');
      }
    } catch (error) {
      console.error('Failed to accept offer:', error);
      alert('Failed to accept offer');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectOffer(offerId: string) {
    if (!confirm('Reject this offer?')) return;

    setActionLoading(`reject-${offerId}`);
    try {
      const res = await fetch(`${apiUrl}/api/marketplace/offers/${offerId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerAddress: walletAddress }),
      });

      if (res.ok) {
        alert('Offer rejected');
        fetchOffers(walletAddress!);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reject offer');
      }
    } catch (error) {
      console.error('Failed to reject offer:', error);
      alert('Failed to reject offer');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCounterOffer(offerId: string) {
    if (!counterAmount || parseFloat(counterAmount) <= 0) {
      alert('Please enter a valid counter amount');
      return;
    }

    setActionLoading(`counter-${offerId}`);
    try {
      const res = await fetch(`${apiUrl}/api/marketplace/offers/${offerId}/counter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerAddress: walletAddress,
          counterAmountCents: Math.round(parseFloat(counterAmount) * 100),
        }),
      });

      if (res.ok) {
        alert('Counter offer sent!');
        setCounteringOfferId(null);
        setCounterAmount('');
        fetchOffers(walletAddress!);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send counter offer');
      }
    } catch (error) {
      console.error('Failed to counter offer:', error);
      alert('Failed to send counter offer');
    } finally {
      setActionLoading(null);
    }
  }

  function formatPrice(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-600/30 text-yellow-400';
      case 'ACCEPTED':
        return 'bg-green-600/30 text-green-400';
      case 'REJECTED':
        return 'bg-red-600/30 text-red-400';
      case 'COUNTERED':
        return 'bg-purple-600/30 text-purple-400';
      case 'EXPIRED':
        return 'bg-gray-600/30 text-gray-400';
      default:
        return 'bg-gray-600/30 text-gray-400';
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
        <title>My Offers | CosmoNFT Marketplace</title>
      </Head>

      <div className="min-h-screen bg-gray-950">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-white">CosmoNFT</Link>
            <nav className="flex gap-6">
              <Link href="/marketplace" className="text-gray-400 hover:text-white">Marketplace</Link>
              <Link href="/marketplace/my-listings" className="text-gray-400 hover:text-white">
                My Listings
              </Link>
              <Link href="/marketplace/my-offers" className="text-purple-400 font-semibold">
                My Offers
              </Link>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-white mb-6">My Offers</h1>

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'sent'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Sent Offers ({sentOffers.length})
            </button>
            <button
              onClick={() => setActiveTab('received')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'received'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Received Offers ({receivedOffers.length})
            </button>
          </div>

          {/* Sent Offers */}
          {activeTab === 'sent' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {sentOffers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">You haven&apos;t made any offers yet</p>
                  <Link
                    href="/marketplace"
                    className="text-purple-400 hover:text-purple-300 mt-2 inline-block"
                  >
                    Browse Marketplace
                  </Link>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Token ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Your Offer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Counter Offer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Expires
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {sentOffers.map((offer) => (
                      <tr key={offer.id}>
                        <td className="px-4 py-3">
                          <Link
                            href={`/marketplace/${offer.tokenId}`}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            #{offer.tokenId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-green-400 font-semibold">
                          {formatPrice(offer.offerAmountCents)}
                        </td>
                        <td className="px-4 py-3 text-yellow-400">
                          {offer.counterOfferCents
                            ? formatPrice(offer.counterOfferCents)
                            : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(offer.expiresAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Received Offers */}
          {activeTab === 'received' && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
              {receivedOffers.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-400">No offers received on your NFTs</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Token ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        From
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Offer
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Expires
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {receivedOffers.map((offer) => (
                      <tr key={offer.id}>
                        <td className="px-4 py-3">
                          <Link
                            href={`/nft/${offer.tokenId}`}
                            className="text-purple-400 hover:text-purple-300"
                          >
                            #{offer.tokenId}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-300 text-sm">
                          {formatAddress(offer.offererAddress)}
                        </td>
                        <td className="px-4 py-3 text-green-400 font-semibold">
                          {formatPrice(offer.offerAmountCents)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {new Date(offer.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {(offer.status === 'PENDING' || offer.status === 'COUNTERED') && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptOffer(offer.id)}
                                disabled={!!actionLoading}
                                className="text-green-400 hover:text-green-300 text-sm"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => setCounteringOfferId(offer.id)}
                                disabled={!!actionLoading}
                                className="text-yellow-400 hover:text-yellow-300 text-sm"
                              >
                                Counter
                              </button>
                              <button
                                onClick={() => handleRejectOffer(offer.id)}
                                disabled={!!actionLoading}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Counter Offer Modal */}
      {counteringOfferId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-800">
            <h3 className="text-xl font-bold text-white mb-4">Counter Offer</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Counter Amount (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={counterAmount}
                  onChange={(e) => setCounterAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => handleCounterOffer(counteringOfferId)}
                disabled={!!actionLoading}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Sending...' : 'Send Counter'}
              </button>
              <button
                onClick={() => {
                  setCounteringOfferId(null);
                  setCounterAmount('');
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
