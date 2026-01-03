import CountdownTimer from './CountdownTimer';

interface PricingDisplayProps {
  pricing: {
    displayPrice: string;
    timeUntilNextTier: number;
    quantityAvailable: number;
    phaseName: string;
    phaseIncreasePercent?: number;
    isPaused?: boolean;
    pausedAt?: string | null;
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

  // Calculate example prices for different scores
  const basePrice = parseFloat(pricing.displayPrice);
  const exampleScore = 400;
  const examplePrice = basePrice * exampleScore;

  return (
    <div className="bg-gray-900 rounded-xl p-8 border border-gray-800">
      {/* Current Phase Pricing Formula */}
      <div className="mb-6">
        <div className="text-gray-400 text-sm mb-1">{pricing.phaseName} Base Rate</div>
        <div className="text-4xl font-bold text-white">
          ${pricing.displayPrice} <span className="text-xl text-gray-400">× Score</span>
        </div>
        <div className="text-gray-500 text-sm mt-2">
          Example: Score {exampleScore} = <span className="text-green-400 font-semibold">${examplePrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Countdown */}
      <div className="mb-6">
        {pricing.isPaused ? (
          <>
            <div className="text-yellow-400 text-sm mb-2">Phase Timer Paused</div>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg px-4 py-2 text-yellow-400 text-center">
              Timer paused - price will not increase until resumed
            </div>
          </>
        ) : (
          <>
            <div className="text-gray-400 text-sm mb-2">Price increases in:</div>
            <CountdownTimer
              targetTime={Date.now() + pricing.timeUntilNextTier * 1000}
              onComplete={() => window.location.reload()}
            />
          </>
        )}
      </div>

      {/* Availability */}
      <div className="flex items-center justify-center gap-2 text-yellow-400">
        <span className="animate-pulse">🔥</span>
        <span>{(pricing.quantityAvailable || 0).toLocaleString()} NFTs left at this price</span>
      </div>

      {/* Next Price Preview */}
      <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
        Next phase: ${(basePrice * (1 + (pricing.phaseIncreasePercent || 7.5) / 100)).toFixed(2)} × Score (+{pricing.phaseIncreasePercent || 7.5}%)
      </div>
    </div>
  );
}
