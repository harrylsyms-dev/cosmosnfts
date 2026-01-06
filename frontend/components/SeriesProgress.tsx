import { useState, useEffect } from 'react';
import {
  SERIES_CONFIG,
  calculateTrajectory,
  getTrajectoryColorClasses,
} from '../lib/constants';

interface SeriesData {
  currentSeries: number;
  currentPhase: number;
  soldCount: number;
  totalForSeries: number;
  phaseEndDate: string;
  phaseSoldCount: number;
  phaseTotal: number;
}

interface SeriesProgressProps {
  variant?: 'full' | 'compact' | 'mini';
  showTrajectory?: boolean;
  showCountdown?: boolean;
  className?: string;
}

export default function SeriesProgress({
  variant = 'full',
  showTrajectory = true,
  showCountdown = true,
  className = '',
}: SeriesProgressProps) {
  const [seriesData, setSeriesData] = useState<SeriesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    fetchSeriesData();
  }, []);

  useEffect(() => {
    if (!seriesData?.phaseEndDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const endTime = new Date(seriesData.phaseEndDate).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [seriesData?.phaseEndDate]);

  async function fetchSeriesData() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/series/current`);
      if (res.ok) {
        const data = await res.json();
        setSeriesData(data);
      } else {
        // Use fallback data for demo
        setSeriesData({
          currentSeries: 1,
          currentPhase: 1,
          soldCount: 0,
          totalForSeries: SERIES_CONFIG.nftsPerSeries,
          phaseEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          phaseSoldCount: 0,
          phaseTotal: SERIES_CONFIG.nftsPerPhase,
        });
      }
    } catch (error) {
      // Fallback for demo
      setSeriesData({
        currentSeries: 1,
        currentPhase: 1,
        soldCount: 0,
        totalForSeries: SERIES_CONFIG.nftsPerSeries,
        phaseEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        phaseSoldCount: 0,
        phaseTotal: SERIES_CONFIG.nftsPerPhase,
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className={`bg-gray-900 rounded-xl p-6 border border-gray-800 animate-pulse ${className}`}>
        <div className="h-6 bg-gray-800 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-800 rounded w-2/3 mb-4" />
        <div className="h-3 bg-gray-800 rounded-full w-full" />
      </div>
    );
  }

  if (!seriesData) return null;

  const sellThroughRate = seriesData.soldCount / seriesData.totalForSeries;
  const seriesPercentage = Math.round(sellThroughRate * 100);
  const phasePercentage = Math.round((seriesData.phaseSoldCount / seriesData.phaseTotal) * 100);
  const trajectory = calculateTrajectory(sellThroughRate);
  const trajectoryColors = getTrajectoryColorClasses(trajectory.color);

  // Mini variant for navbar/header
  if (variant === 'mini') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <span className="text-gray-400 text-sm">S{seriesData.currentSeries}</span>
        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${seriesPercentage}%` }}
          />
        </div>
        <span className="text-white text-sm font-medium">{seriesPercentage}%</span>
      </div>
    );
  }

  // Compact variant for sidebar/cards
  if (variant === 'compact') {
    return (
      <div className={`bg-gray-900 rounded-lg p-4 border border-gray-800 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">Series {seriesData.currentSeries}</span>
          <span className="text-white font-medium">{seriesPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
            style={{ width: `${seriesPercentage}%` }}
          />
        </div>
        <div className="text-gray-500 text-xs">
          {seriesData.soldCount.toLocaleString()} / {seriesData.totalForSeries.toLocaleString()} sold
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              SERIES {seriesData.currentSeries} • PHASE {seriesData.currentPhase} of {SERIES_CONFIG.phasesPerSeries}
            </h3>
            <p className="text-gray-400 text-sm">
              {seriesData.soldCount.toLocaleString()} / {seriesData.totalForSeries.toLocaleString()} sold ({seriesPercentage}%)
            </p>
          </div>
          {showCountdown && timeRemaining && (
            <div className="text-right">
              <div className="text-gray-400 text-xs mb-1">Phase ends in</div>
              <div className="text-white font-mono font-bold">
                {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="p-6">
        {/* Series Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Series Progress</span>
            <span className="text-white font-medium">{seriesPercentage}%</span>
          </div>
          <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${seriesPercentage}%` }}
            />
          </div>
          {/* Phase markers */}
          <div className="flex justify-between mt-1">
            {[...Array(SERIES_CONFIG.phasesPerSeries)].map((_, i) => (
              <div
                key={i}
                className={`text-xs ${
                  i + 1 <= seriesData.currentPhase ? 'text-blue-400' : 'text-gray-600'
                }`}
              >
                P{i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Current Phase Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Phase {seriesData.currentPhase} Progress</span>
            <span className="text-white font-medium">
              {seriesData.phaseSoldCount.toLocaleString()} / {seriesData.phaseTotal.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${phasePercentage}%` }}
            />
          </div>
        </div>

        {/* Trajectory Indicator */}
        {showTrajectory && (
          <>
            {!trajectory.showTrajectoryBar ? (
              // Just Launched - show positive messaging without trajectory bar
              <div className={`rounded-lg p-4 ${trajectoryColors.bg} border ${trajectoryColors.border}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{trajectory.icon}</span>
                  <div>
                    <p className={`font-bold text-lg ${trajectoryColors.text}`}>{trajectory.message}</p>
                    <p className="text-gray-400 text-sm">
                      Be among the first collectors to secure launch pricing.
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Series 2 pricing will be based on Series 1 demand.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Show trajectory bar with thresholds
              <div className={`rounded-lg p-4 ${trajectoryColors.bg} border ${trajectoryColors.border}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{trajectory.icon}</span>
                  <div className="flex-1">
                    <div className={`font-semibold ${trajectoryColors.text}`}>
                      {trajectory.multiplier
                        ? `Series 2: ${trajectory.multiplier}x Prices`
                        : 'Series 2 pricing TBD'}
                    </div>
                    <div className="text-gray-400 text-sm">{trajectory.message}</div>
                  </div>
                  {trajectory.nextThreshold && (
                    <div className="text-right">
                      <div className="text-gray-500 text-xs">Next tier at</div>
                      <div className="text-white font-medium">
                        {Math.round(trajectory.nextThreshold.min * 100)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      <div className="bg-gray-800/50 px-6 py-3 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {SERIES_CONFIG.nftsPerPhase.toLocaleString()} NFTs per phase • {SERIES_CONFIG.phaseDurationDays} days per phase
          </span>
          <span className="text-gray-400">
            {seriesData.totalForSeries - seriesData.soldCount} remaining
          </span>
        </div>
      </div>
    </div>
  );
}
