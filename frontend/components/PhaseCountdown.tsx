import { useState, useEffect } from 'react';

interface PhaseCountdownProps {
  endDate: string | Date;
  variant?: 'full' | 'compact' | 'inline';
  onComplete?: () => void;
  showLabel?: boolean;
  urgencyThresholdDays?: number;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export default function PhaseCountdown({
  endDate,
  variant = 'full',
  onComplete,
  showLabel = true,
  urgencyThresholdDays = 3,
  className = '',
}: PhaseCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        onComplete?.();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total: diff });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [endDate, onComplete]);

  if (!timeRemaining) {
    return null;
  }

  const isUrgent = timeRemaining.days < urgencyThresholdDays && !isExpired;
  const urgencyClass = isUrgent ? 'text-red-400' : 'text-white';
  const urgencyBgClass = isUrgent ? 'bg-red-900/30 border-red-500' : 'bg-gray-800 border-gray-700';

  // Inline variant - simple text
  if (variant === 'inline') {
    return (
      <span className={`font-mono ${urgencyClass} ${className}`}>
        {isExpired ? (
          'Ended'
        ) : (
          <>
            {timeRemaining.days > 0 && `${timeRemaining.days}d `}
            {timeRemaining.hours}h {timeRemaining.minutes}m
            {timeRemaining.days === 0 && ` ${timeRemaining.seconds}s`}
          </>
        )}
      </span>
    );
  }

  // Compact variant - small badge
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${urgencyBgClass} border ${className}`}>
        {isUrgent && <span className="animate-pulse">⏰</span>}
        <span className={`font-mono text-sm ${urgencyClass}`}>
          {isExpired ? (
            'Phase Ended'
          ) : (
            <>
              {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
            </>
          )}
        </span>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`${urgencyBgClass} rounded-xl border overflow-hidden ${className}`}>
      {/* Header */}
      {showLabel && (
        <div className="px-4 py-2 border-b border-gray-700 bg-gray-800/50">
          <span className="text-gray-400 text-sm">
            {isExpired ? 'Phase has ended' : isUrgent ? '⏰ Hurry! Phase ending soon' : 'Phase ends in'}
          </span>
        </div>
      )}

      {/* Countdown Display */}
      <div className="p-4">
        {isExpired ? (
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-400">Phase Complete</span>
          </div>
        ) : (
          <div className="flex justify-center gap-3">
            <TimeUnit value={timeRemaining.days} label="Days" urgent={isUrgent} />
            <span className={`text-2xl font-bold ${urgencyClass} self-center`}>:</span>
            <TimeUnit value={timeRemaining.hours} label="Hours" urgent={isUrgent} />
            <span className={`text-2xl font-bold ${urgencyClass} self-center`}>:</span>
            <TimeUnit value={timeRemaining.minutes} label="Mins" urgent={isUrgent} />
            <span className={`text-2xl font-bold ${urgencyClass} self-center`}>:</span>
            <TimeUnit value={timeRemaining.seconds} label="Secs" urgent={isUrgent} />
          </div>
        )}
      </div>

      {/* Urgency Message */}
      {isUrgent && !isExpired && (
        <div className="px-4 py-2 bg-red-900/50 border-t border-red-500/30 text-center">
          <span className="text-red-300 text-sm">
            Lock in current phase pricing before time runs out!
          </span>
        </div>
      )}
    </div>
  );
}

function TimeUnit({
  value,
  label,
  urgent,
}: {
  value: number;
  label: string;
  urgent: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-14 h-14 flex items-center justify-center rounded-lg ${
          urgent ? 'bg-red-900/50' : 'bg-gray-700'
        }`}
      >
        <span
          className={`text-2xl font-mono font-bold ${
            urgent ? 'text-red-400' : 'text-white'
          }`}
        >
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-gray-500 text-xs mt-1">{label}</span>
    </div>
  );
}
