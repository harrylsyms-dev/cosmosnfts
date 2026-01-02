import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useCart } from '../hooks/useCart';
import { useMetaMask } from '../hooks/useMetaMask';

export default function Cart() {
  const router = useRouter();
  const { cart, removeFromCart, clearCart, isLoading } = useCart();
  const { address, isConnected, connect } = useMetaMask();
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleCheckout() {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!cart || cart.items.length === 0) return;

    setIsProcessing(true);

    try {
      // Navigate to checkout page with cart data
      router.push('/checkout');
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <Layout>
      <Head>
        <title>Cart - CosmoNFT</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        {isEmpty ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">
              Discover amazing celestial objects and add them to your cart.
            </p>
            <Link href="/" className="btn-primary">
              Browse NFTs
            </Link>
          </div>
        ) : (
          <>
            {/* Cart Timer */}
            {cart.expiresAt && (
              <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-4 mb-6">
                <p className="text-yellow-200">
                  ⏰ Cart expires in{' '}
                  {Math.max(0, Math.floor((cart.expiresAt * 1000 - Date.now()) / 60000))}{' '}
                  minutes. Complete checkout to secure your items.
                </p>
              </div>
            )}

            {/* Cart Items */}
            <div className="space-y-4 mb-8">
              {cart.items.map((item) => (
                <div
                  key={item.nftId}
                  className="bg-gray-900 rounded-lg p-4 flex items-center gap-4"
                >
                  <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={item.image || '/images/placeholder.jpg'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-400">Score: {item.score}/500</p>
                  </div>

                  <div className="text-right">
                    <div className="text-xl font-bold">${item.price.toFixed(2)}</div>
                    <button
                      onClick={() => removeFromCart(item.nftId)}
                      className="text-red-400 hover:text-red-300 text-sm mt-1"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">Subtotal ({cart.itemCount} items)</span>
                <span className="text-xl font-bold">${cart.totalPrice.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center mb-4 text-sm">
                <span className="text-gray-400">Processing fee (2.9% + $0.30)</span>
                <span className="text-gray-300">
                  ${(cart.totalPrice * 0.029 + 0.30).toFixed(2)}
                </span>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${(cart.totalPrice * 1.029 + 0.30).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Wallet Connection */}
            {!isConnected && (
              <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-4 mb-6">
                <p className="text-blue-200 mb-3">
                  Connect your wallet to receive your NFTs after purchase.
                </p>
                <button onClick={connect} className="btn-secondary">
                  Connect MetaMask
                </button>
              </div>
            )}

            {isConnected && (
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 mb-6">
                <p className="text-green-200">
                  ✓ NFTs will be minted to: {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleCheckout}
                disabled={isProcessing || !isConnected}
                className="flex-1 btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
              </button>

              <button
                onClick={clearCart}
                className="btn-secondary"
              >
                Clear Cart
              </button>
            </div>

            <p className="text-gray-400 text-sm text-center mt-4">
              By proceeding, you agree to our{' '}
              <Link href="/terms" className="text-blue-400 hover:underline">
                Terms of Service
              </Link>
            </p>
          </>
        )}
      </div>
    </Layout>
  );
}
