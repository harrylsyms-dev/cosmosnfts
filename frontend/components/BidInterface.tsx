import { useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface BidInterfaceProps {
  auctionId: string;
  minimumBid: number;
  displayMinimumBid: string;
  currentBid: number;
  isConnected: boolean;
  walletAddress: string | null;
  onConnect: () => void;
  onBidPlaced: () => void;
}

export default function BidInterface({
  auctionId,
  minimumBid,
  displayMinimumBid,
  currentBid,
  isConnected,
  walletAddress,
  onConnect,
  onBidPlaced,
}: BidInterfaceProps) {
  const [bidAmount, setBidAmount] = useState<string>((minimumBid / 100).toFixed(2));
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const bidAmountCents = Math.round(parseFloat(bidAmount || '0') * 100);
  const isValidBid = bidAmountCents >= minimumBid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!isConnected || !walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!isValidBid) {
      setError(`Minimum bid is ${displayMinimumBid}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidderAddress: walletAddress,
          bidderEmail: email || undefined,
          bidAmountCents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place bid');
      }

      setSuccess(true);
      setBidAmount(((bidAmountCents + Math.max(bidAmountCents * 0.05, 2500)) / 100).toFixed(2));
      onBidPlaced();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to place bid');
    } finally {
      setIsSubmitting(false);
    }
  }

  const quickBidAmounts = [
    { label: 'Min', amount: minimumBid },
    { label: '+$50', amount: currentBid + 5000 },
    { label: '+$100', amount: currentBid + 10000 },
    { label: '+$250', amount: currentBid + 25000 },
  ].filter((b) => b.amount >= minimumBid);

  return (
    <div className="space-y-4">
      {/* Connect Wallet */}
      {!isConnected ? (
        <div className="text-center py-4">
          <p className="text-gray-400 mb-4">Connect your wallet to place a bid</p>
          <button onClick={onConnect} className="btn-primary w-full">
            Connect MetaMask
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Connected Address */}
          <div className="flex items-center gap-2 bg-green-900/30 px-3 py-2 rounded">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="text-green-300 text-sm font-mono">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </span>
          </div>

          {/* Quick Bid Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {quickBidAmounts.map(({ label, amount }) => (
              <button
                key={label}
                type="button"
                onClick={() => setBidAmount((amount / 100).toFixed(2))}
                className={`py-2 px-3 rounded text-sm font-medium transition-colors ${
                  bidAmountCents === amount
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Bid Amount Input */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">Your Bid</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                $
              </span>
              <input
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                step="0.01"
                min={(minimumBid / 100).toFixed(2)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-4 py-3 text-2xl font-bold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Minimum: {displayMinimumBid}
            </p>
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-gray-400 text-sm mb-2">
              Email (optional - for outbid notifications)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="your@email.com"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-2 rounded">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-900/30 border border-green-600 text-green-400 px-4 py-2 rounded">
              Bid placed successfully!
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValidBid || isSubmitting}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              isValidBid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Placing Bid...
              </span>
            ) : (
              `Place Bid - $${bidAmount}`
            )}
          </button>

          {/* Terms */}
          <p className="text-gray-500 text-xs text-center">
            By placing a bid, you agree to pay the full amount if you win.
            Bids are final and cannot be withdrawn.
          </p>
        </form>
      )}
    </div>
  );
}
