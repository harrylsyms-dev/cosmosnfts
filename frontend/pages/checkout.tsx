import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Layout from '../components/Layout';
import { useCart } from '../hooks/useCart';
import { useMetaMask } from '../hooks/useMetaMask';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

export default function Checkout() {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const { cart, clearCart } = useCart();
  const { address, isConnected } = useMetaMask();

  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    discountCents: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  useEffect(() => {
    if (!cart || cart.items.length === 0) {
      router.push('/cart');
    }
  }, [cart, router]);

  // Recalculate discount when cart changes
  useEffect(() => {
    if (appliedDiscount && cart) {
      validateDiscount(appliedDiscount.code);
    }
  }, [cart?.totalPrice]);

  async function validateDiscount(code: string) {
    if (!code.trim() || !cart) return;

    setDiscountLoading(true);
    setDiscountError(null);

    try {
      const subtotalCents = Math.round(cart.totalPrice * 100);
      const res = await fetch(`${apiUrl}/api/discount/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotalCents }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedDiscount({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountCents: data.discountCents,
        });
        setDiscountError(null);
      } else {
        setAppliedDiscount(null);
        setDiscountError(data.error || 'Invalid discount code');
      }
    } catch (err) {
      setAppliedDiscount(null);
      setDiscountError('Failed to validate discount code');
    } finally {
      setDiscountLoading(false);
    }
  }

  function handleApplyDiscount() {
    validateDiscount(discountCode);
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null);
    setDiscountCode('');
    setDiscountError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!cart) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch(`${apiUrl}/api/purchase/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: cart.items.map((item) => item.nftId),
          email,
          walletAddress: address,
          discountCode: appliedDiscount?.code || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Checkout failed');
      }

      // Handle free orders (100% discount)
      if (data.freeOrder || data.amount === 0) {
        clearCart();
        router.push(`/success?id=${data.purchaseId}`);
        return;
      }

      // Handle test mode
      if (data.testMode) {
        clearCart();
        router.push(`/success?id=${data.purchaseId}`);
        return;
      }

      // Confirm payment with Stripe
      if (!stripe || !elements) {
        throw new Error('Stripe not loaded');
      }

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
        clearCart();
        router.push(`/success?id=${data.purchaseId}`);
      } else if (paymentIntent?.status === 'requires_action') {
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

  // Calculate totals
  const subtotal = cart.totalPrice;
  const subtotalCents = Math.round(subtotal * 100);
  const discountCents = appliedDiscount?.discountCents || 0;
  const discountedSubtotalCents = subtotalCents - discountCents;

  // Processing fee on discounted amount (skip if $0)
  const processingFeeCents = discountedSubtotalCents > 0
    ? Math.round(discountedSubtotalCents * 0.029 + 30)
    : 0;

  const totalCents = discountedSubtotalCents + processingFeeCents;
  const processingFee = processingFeeCents / 100;
  const total = totalCents / 100;
  const discount = discountCents / 100;

  const isFreeOrder = totalCents === 0;

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

              {appliedDiscount && (
                <div className="flex justify-between text-green-400">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              {!isFreeOrder && (
                <div className="flex justify-between text-gray-400">
                  <span>Processing fee</span>
                  <span>${processingFee.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-xl font-bold pt-2">
                <span>Total</span>
                <span className={isFreeOrder ? 'text-green-400' : 'text-green-400'}>
                  {isFreeOrder ? 'FREE' : `$${total.toFixed(2)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Discount Code */}
          <div className="bg-gray-900 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Discount Code</h2>

            {appliedDiscount ? (
              <div className="flex items-center justify-between bg-green-900/30 border border-green-600 rounded-lg p-4">
                <div>
                  <span className="text-green-400 font-semibold">{appliedDiscount.code}</span>
                  <span className="text-green-300 ml-2">
                    ({appliedDiscount.discountType === 'PERCENT'
                      ? `${appliedDiscount.discountValue}% off`
                      : `$${appliedDiscount.discountValue} off`})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveDiscount}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={discountLoading || !discountCode.trim()}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {discountLoading ? 'Checking...' : 'Apply'}
                </button>
              </div>
            )}

            {discountError && (
              <p className="text-red-400 text-sm mt-2">{discountError}</p>
            )}
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

          {/* Payment - Only show if not free */}
          {!isFreeOrder && (
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
          )}

          {/* Free Order Notice */}
          {isFreeOrder && (
            <div className="bg-green-900/30 border border-green-600 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-green-400 mb-2">Free Order!</h2>
              <p className="text-green-200">
                Your discount covers the entire order. No payment required.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={(!stripe && !isFreeOrder) || isProcessing || !email || !isConnected}
            className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : isFreeOrder ? (
              'Complete Free Order'
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
