import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

interface PurchaseData {
  transactionId: string;
  status: string;
  email: string;
  totalAmount: number;
  nfts: {
    tokenId: number | null;
    name: string;
    contractAddress: string;
    transactionHash: string | null;
    openSeaUrl: string | null;
  }[];
  mintedAt: number | null;
}

export default function Success() {
  const router = useRouter();
  const { id } = router.query;
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchPurchase(id as string);
    }
  }, [id]);

  // Poll for minting status
  useEffect(() => {
    if (purchase && purchase.status === 'processing' && pollCount < 30) {
      const timer = setTimeout(() => {
        fetchPurchase(id as string);
        setPollCount((c) => c + 1);
      }, 5000); // Poll every 5 seconds

      return () => clearTimeout(timer);
    }
  }, [purchase, pollCount, id]);

  async function fetchPurchase(purchaseId: string) {
    try {
      const res = await fetch(`/api/purchase/${purchaseId}`);
      if (!res.ok) throw new Error('Purchase not found');
      const data = await res.json();
      setPurchase(data);
    } catch (error) {
      console.error('Failed to fetch purchase:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your purchase...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!purchase) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Purchase Not Found</h1>
          <Link href="/" className="text-blue-400 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </Layout>
    );
  }

  const isMinted = purchase.status === 'minted';
  const isProcessing = purchase.status === 'processing';

  return (
    <Layout>
      <Head>
        <title>Purchase Successful - CosmoNFT</title>
      </Head>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="text-7xl mb-4">
            {isMinted ? '🎉' : isProcessing ? '⏳' : '✓'}
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {isMinted
              ? 'Your NFTs Are Ready!'
              : isProcessing
              ? 'Minting Your NFTs...'
              : 'Payment Successful!'}
          </h1>
          <p className="text-gray-400 text-lg">
            {isMinted
              ? 'Your celestial objects have been minted to the blockchain.'
              : isProcessing
              ? 'Your NFTs are being minted. This usually takes 1-2 minutes.'
              : 'Thank you for your purchase!'}
          </p>
        </div>

        {/* Minting Progress */}
        {isProcessing && (
          <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <div>
                <p className="text-blue-200 font-semibold">Minting in progress...</p>
                <p className="text-blue-300 text-sm">
                  Your NFTs are being created on the Polygon blockchain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Order Details</h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Order ID</span>
              <span className="font-mono text-sm">{purchase.transactionId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span>{purchase.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total</span>
              <span className="font-bold">${purchase.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status</span>
              <span
                className={`font-semibold ${
                  isMinted
                    ? 'text-green-400'
                    : isProcessing
                    ? 'text-yellow-400'
                    : 'text-blue-400'
                }`}
              >
                {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* NFT List */}
        <div className="bg-gray-900 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your NFTs</h2>

          <div className="space-y-4">
            {purchase.nfts.map((nft, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold">{nft.name}</h3>
                  {nft.tokenId && (
                    <p className="text-gray-400 text-sm">Token ID: #{nft.tokenId}</p>
                  )}
                </div>

                {nft.openSeaUrl ? (
                  <a
                    href={nft.openSeaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    View on OpenSea &rarr;
                  </a>
                ) : (
                  <span className="text-gray-500">Minting...</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Blockchain Details */}
        {isMinted && purchase.nfts[0]?.transactionHash && (
          <div className="bg-gray-900 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Blockchain Details</h2>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Transaction Hash</p>
                <a
                  href={`https://polygonscan.com/tx/${purchase.nfts[0].transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-400 hover:underline break-all"
                >
                  {purchase.nfts[0].transactionHash}
                </a>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Contract Address</p>
                <a
                  href={`https://polygonscan.com/address/${purchase.nfts[0].contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-blue-400 hover:underline break-all"
                >
                  {purchase.nfts[0].contractAddress}
                </a>
              </div>

              <div>
                <p className="text-gray-400 text-sm mb-1">Network</p>
                <p>Polygon PoS (Mainnet)</p>
              </div>
            </div>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-green-900/20 border border-green-600 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-green-300">What's Next?</h2>
          <ul className="space-y-2 text-green-200">
            <li>✓ Check your email for a detailed receipt</li>
            <li>✓ View your NFTs on OpenSea</li>
            <li>✓ Join our Discord community</li>
            <li>✓ 30% of your purchase funds space exploration!</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/" className="flex-1 btn-primary text-center">
            Continue Shopping
          </Link>
          <a
            href="https://opensea.io/collection/cosmonfts"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 btn-secondary text-center"
          >
            View on OpenSea
          </a>
        </div>
      </div>
    </Layout>
  );
}
