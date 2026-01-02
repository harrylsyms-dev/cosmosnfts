import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '../components/Layout';
import { useCart } from '../hooks/useCart';
import { useMetaMask } from '../hooks/useMetaMask';

export default function Checkout() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { cart, clearCart } = useCart();
  const { address, isConnected } = useMetaMask();

  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements || !cart) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/api/purchase/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart.items.map((item) => item.nftId),
          email,
          walletAddress: address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: { email },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        // Clear cart and redirect to success page
        clearCart();
        router.push(`/success?id=${data.purchaseId}`);
      } else if (paymentIntent?.status === 'requires_action') {
        // 3D Secure required - Stripe handles this automatically
        setError('Additional verification required. Please complete the verification.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  const subtotal = cart.totalPrice;
  const processingFee = subtotal * 0.029 + 0.30;
  const total = subtotal + processingFee;

  return (
    <Layout>
      <Head>
        <title>Checkout - CosmoNFT</title>
      </Head>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <form onSubmit={handleSubmit}>
          {/* Order Summary */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div key={item.nftId} className="flex justify-between">
                  <span className="text-gray-300">{item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-2">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Processing fee</span>
                <span>${processingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total</span>
                <span className="text-green-400">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address (Wallet) */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Delivery Wallet</h2>
            {isConnected && address ? (
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-4">
                <p className="text-green-200 text-sm mb-1">NFTs will be minted to:</p>
                <p className="font-mono text-green-100 break-all">{address}</p>
              </div>
            ) : (
              <p className="text-yellow-400">
                Please connect your wallet on the cart page.
              </p>
            )}
          </div>

          {/* Email */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
            <label className="block">
              <span className="text-gray-400 text-sm">Email Address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full mt-2 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </label>
            <p className="text-gray-500 text-sm mt-2">
              We'll send your receipt and NFT confirmation here.
            </p>
          </div>

          {/* Payment */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#ffffff',
                      '::placeholder': { color: '#6b7280' },
                    },
                    invalid: { color: '#ef4444' },
                  },
                }}
              />
            </div>

            <div className="flex items-center gap-2 mt-4 text-gray-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secured by Stripe. Your card details are encrypted.
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || isProcessing || !email || !isConnected}
            className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              `Pay $${total.toFixed(2)}`
            )}
          </button>

          <p className="text-gray-500 text-sm text-center mt-4">
            By completing this purchase, you agree to our Terms of Service.
            All sales are final. NFTs are non-refundable.
          </p>
        </form>
      </div>
    </Layout>
  );
}
