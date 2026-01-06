import {
  TRAJECTORY_THRESHOLDS,
  calculateTrajectory,
  getTrajectoryColorClasses,
  TrajectoryThreshold,
} from '../lib/constants';

interface PriceTrajectoryProps {
  sellThroughRate: number;
  variant?: 'full' | 'bar' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export default function PriceTrajectory({
  sellThroughRate,
  variant = 'full',
  showLabels = true,
  className = '',
}: PriceTrajectoryProps) {
  const trajectory = calculateTrajectory(sellThroughRate);
  const trajectoryColors = getTrajectoryColorClasses(trajectory.color);
  const percentage = Math.round(sellThroughRate * 100);

  // Compact badge variant
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="text-lg">{trajectory.icon}</span>
        <span className={`text-sm font-medium ${trajectoryColors.text}`}>
          {trajectory.multiplier ? `${trajectory.multiplier}x` : 'TBD'}
        </span>
      </div>
    );
  }

  // Bar variant - horizontal visualization
  if (variant === 'bar') {
    return (
      <div className={className}>
        <div className="relative h-8 bg-gray-800 rounded-lg overflow-hidden">
          {/* Threshold segments */}
          <div className="absolute inset-0 flex">
            {TRAJECTORY_THRESHOLDS.map((threshold, i) => {
              const width = (threshold.max - threshold.min) * 100;
              const colors = getTrajectoryColorClasses(threshold.color);
              const isActive = sellThroughRate >= threshold.min && sellThroughRate < threshold.max;

              return (
                <div
                  key={threshold.label}
                  className={`relative h-full ${colors.bg} ${isActive ? 'opacity-100' : 'opacity-40'}
                    ${i > 0 ? 'border-l border-gray-700' : ''}`}
                  style={{ width: `${width}%` }}
                >
                  {showLabels && (
                    <div className={`absolute inset-0 flex items-center justify-center text-xs font-medium ${colors.text}`}>
                      {threshold.multiplier ? `${threshold.multiplier}x` : '—'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current position indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg shadow-white/50 z-10"
            style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}
          />
        </div>

        {/* Labels */}
        {showLabels && (
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        )}
      </div>
    );
  }

  // Full variant (default)
  // At 0-9% sold, show launch message instead of trajectory visualization
  if (!trajectory.showTrajectoryBar) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
        <div className={`p-6 ${trajectoryColors.bg} border ${trajectoryColors.border}`}>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{trajectory.icon}</span>
            <div>
              <p className={`font-bold text-2xl ${trajectoryColors.text}`}>{trajectory.message}</p>
              <p className="text-gray-300 mt-2">
                Be among the first collectors to secure launch pricing.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Series 2 pricing will be based on Series 1 demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <h3 className="text-lg font-bold text-white">Series 2 Price Trajectory</h3>
        <p className="text-gray-400 text-sm">
          Based on current sell-through rate: {percentage}%
        </p>
      </div>

      {/* Current Status */}
      <div className={`px-6 py-4 ${trajectoryColors.bg} border-b ${trajectoryColors.border}`}>
        <div className="flex items-center gap-4">
          <span className="text-4xl">{trajectory.icon}</span>
          <div>
            <div className={`text-2xl font-bold ${trajectoryColors.text}`}>
              {trajectory.multiplier
                ? `${trajectory.multiplier}x Price Increase`
                : 'Series 2 Pricing TBD'}
            </div>
            <div className="text-gray-300">{trajectory.message}</div>
          </div>
        </div>
      </div>

      {/* Trajectory Visualization */}
      <div className="p-6">
        <div className="space-y-3">
          {TRAJECTORY_THRESHOLDS.filter(t => t.showTrajectoryBar).map((threshold) => {
            const colors = getTrajectoryColorClasses(threshold.color);
            const isActive = sellThroughRate >= threshold.min && sellThroughRate < threshold.max;
            const isPassed = sellThroughRate >= threshold.max;

            return (
              <div
                key={threshold.label}
                className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                  isActive
                    ? `${colors.bg} ${colors.border} border-2`
                    : isPassed
                    ? 'bg-gray-800/50 opacity-60'
                    : 'bg-gray-800/30 opacity-40'
                }`}
              >
                <span className="text-2xl">{threshold.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isActive ? colors.text : 'text-gray-400'}`}>
                      {Math.round(threshold.min * 100)}% - {Math.round(threshold.max * 100)}%
                    </span>
                    <span className={`font-bold ${isActive ? colors.text : 'text-gray-500'}`}>
                      {threshold.multiplier ? `${threshold.multiplier}x` : 'TBD'}
                    </span>
                  </div>
                  {isActive && (
                    <div className="text-gray-400 text-sm mt-1">
                      {threshold.message}
                    </div>
                  )}
                </div>
                {isPassed && <span className="text-green-500">✓</span>}
                {isActive && (
                  <span className="px-2 py-1 bg-white/10 rounded text-xs text-white">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress to next tier */}
        {trajectory.nextThreshold && trajectory.nextThreshold.showTrajectoryBar && (
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">
                Progress to {trajectory.nextThreshold.multiplier ? `${trajectory.nextThreshold.multiplier}x` : 'next'} tier
              </span>
              <span className="text-white font-medium">
                {trajectory.percentToNextThreshold}% more needed
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{
                  width: `${100 - trajectory.percentToNextThreshold / (trajectory.nextThreshold.min - trajectory.currentThreshold.min) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Explanation Footer */}
      <div className="bg-gray-800/50 px-6 py-4 border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          Series 2 prices are determined by Series 1 sales performance. Higher demand means higher future prices.
          Buy now to lock in Series 1 pricing!
        </p>
      </div>
    </div>
  );
}
