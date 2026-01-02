import CountdownTimer from './CountdownTimer';

interface PricingDisplayProps {
  pricing: {
    displayPrice: string;
    timeUntilNextTier: number;
    quantityAvailable: number;
    phaseName: string;
  } | null;
  isLoading: boolean;
}

export default function PricingDisplay({ pricing, isLoading }: PricingDisplayProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
        <div className="h-12 bg-gray-800 rounded loading-shimmer mb-4" />
        <div className="h-6 bg-gray-800 rounded loading-shimmer w-3/4 mx-auto mb-4" />
        <div className="h-8 bg-gray-800 rounded loading-shimmer w-1/2 mx-auto" />
      </div>
    );
  }

  if (!pricing) {
    return (
      <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
        <div className="text-5xl font-bold text-white mb-2">$350</div>
        <div className="text-gray-400">Starting price</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
      {/* Current Price */}
      <div className="mb-6">
        <div className="text-gray-400 text-sm mb-1">{pricing.phaseName} Price</div>
        <div className="text-5xl font-bold text-white">${pricing.displayPrice}</div>
      </div>

      {/* Countdown */}
      <div className="mb-6">
        <div className="text-gray-400 text-sm mb-2">Price increases in:</div>
        <CountdownTimer
          targetTime={Date.now() + pricing.timeUntilNextTier * 1000}
          onComplete={() => window.location.reload()}
        />
      </div>

      {/* Availability */}
      <div className="flex items-center justify-center gap-2 text-yellow-400">
        <span className="animate-pulse">🔥</span>
        <span>{(pricing.quantityAvailable || 0).toLocaleString()} NFTs left at this price</span>
      </div>

      {/* Next Price Preview */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
        Next phase: ${(parseFloat(pricing.displayPrice) * 1.075).toFixed(2)} (+7.5%)
      </div>
    </div>
  );
}
