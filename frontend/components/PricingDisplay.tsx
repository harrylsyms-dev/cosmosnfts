import CountdownTimer from './CountdownTimer';
import { TIER_CONFIG, SERIES_CONFIG, calculateTrajectory, BadgeTier } from '../lib/constants';

interface PricingDisplayProps {
  pricing: {
    displayPrice: string;
    timeUntilNextPhase?: number;
    quantityAvailable: number;
    currentSeries: number;
    currentPhase: number;
    seriesMultiplier: number;
    sellThroughRate?: number;
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
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 border border-purple-500/30">
        {/* Series Badge */}
        <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-1 mb-4">
          <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
          <span className="text-purple-300 text-sm font-medium">Series 1, Phase 1</span>
        </div>

        <div className="text-gray-400 text-sm mb-2">Pricing Formula</div>
        <div className="text-2xl font-bold text-white mb-1">
          $0.10 <span className="text-lg text-gray-400">x Score x Tier Multiplier</span>
        </div>
        <div className="text-gray-500 text-sm mt-2">
          Example: MYTHIC (200x) Score 250 = <span className="text-green-400 font-semibold">$5,000</span>
        </div>

        {/* Tier Multipliers Preview */}
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="text-gray-400 text-sm mb-3">Tier Multipliers</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['MYTHIC', 'LEGENDARY', 'ELITE', 'PREMIUM', 'EXCEPTIONAL', 'STANDARD'] as BadgeTier[]).map((tier) => (
              <div key={tier} className="flex items-center justify-between bg-gray-800 rounded px-2 py-1">
                <span className={TIER_CONFIG[tier].textColor}>{tier}</span>
                <span className="text-white font-medium">{TIER_CONFIG[tier].multiplier}x</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get trajectory info based on sell-through rate
  const trajectoryInfo = pricing.sellThroughRate !== undefined
    ? calculateTrajectory(pricing.sellThroughRate)
    : null;

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 border border-purple-500/30">
      {/* Series & Phase Badge */}
      <div className="inline-flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 rounded-full px-4 py-1 mb-4">
        <span className={`w-2 h-2 rounded-full ${pricing.isPaused ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'}`} />
        <span className="text-purple-300 text-sm font-medium">
          Series {pricing.currentSeries}, Phase {pricing.currentPhase}
        </span>
      </div>

      {/* Current Pricing Formula */}
      <div className="mb-6">
        <div className="text-gray-400 text-sm mb-2">Pricing Formula</div>
        <div className="text-2xl font-bold text-white">
          $0.10 <span className="text-lg text-gray-400">x Score x Tier x Series</span>
        </div>
        {pricing.seriesMultiplier > 1.0 && (
          <div className="text-yellow-400 text-sm mt-1">
            Series {pricing.currentSeries} Multiplier: {pricing.seriesMultiplier}x
          </div>
        )}
        <div className="text-gray-500 text-sm mt-2">
          Example: LEGENDARY (100x) Score 250 = <span className="text-green-400 font-semibold">
            ${(0.10 * 250 * 100 * pricing.seriesMultiplier).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="mb-6">
        {pricing.isPaused ? (
          <>
            <div className="text-yellow-400 text-sm mb-2">Phase Timer Paused</div>
            <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg px-4 py-2 text-yellow-400 text-center">
              Timer paused - phase will not advance until resumed
            </div>
          </>
        ) : pricing.timeUntilNextPhase ? (
          <>
            <div className="text-gray-400 text-sm mb-2">Time until Phase {pricing.currentPhase + 1}:</div>
            <CountdownTimer
              targetTime={Date.now() + pricing.timeUntilNextPhase * 1000}
              onComplete={() => window.location.reload()}
            />
          </>
        ) : null}
      </div>

      {/* Availability */}
      <div className="flex items-center justify-center gap-2 text-yellow-400">
        <span className="animate-pulse">*</span>
        <span>{(pricing.quantityAvailable || 0).toLocaleString()} NFTs left in this phase</span>
      </div>

      {/* Series Structure Info */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-sm text-gray-400">
          <div className="flex justify-between mb-1">
            <span>Structure:</span>
            <span className="text-white">{SERIES_CONFIG.totalSeries} Series x {SERIES_CONFIG.phasesPerSeries} Phases</span>
          </div>
          <div className="flex justify-between">
            <span>NFTs per Phase:</span>
            <span className="text-white">{SERIES_CONFIG.nftsPerPhase.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Trajectory Info (if sell-through data available) */}
      {trajectoryInfo && trajectoryInfo.showTrajectoryBar && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center gap-2 text-sm">
            <span>{trajectoryInfo.icon}</span>
            <span className={`text-${trajectoryInfo.color}-400`}>{trajectoryInfo.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
