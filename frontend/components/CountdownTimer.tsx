import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTime: number;
  onComplete?: () => void;
  large?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function CountdownTimer({ targetTime, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const difference = targetTime - now;

      if (difference <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onComplete]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-3">
      {/* Days */}
      <div className="text-center">
        <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <div className="text-2xl font-bold countdown-number">
            {formatNumber(timeLeft.days)}
          </div>
        </div>
        <div className="text-gray-500 text-xs mt-1">Days</div>
      </div>

      <div className="text-2xl text-gray-600">:</div>

      {/* Hours */}
      <div className="text-center">
        <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <div className="text-2xl font-bold countdown-number">
            {formatNumber(timeLeft.hours)}
          </div>
        </div>
        <div className="text-gray-500 text-xs mt-1">Hours</div>
      </div>

      <div className="text-2xl text-gray-600">:</div>

      {/* Minutes */}
      <div className="text-center">
        <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <div className="text-2xl font-bold countdown-number">
            {formatNumber(timeLeft.minutes)}
          </div>
        </div>
        <div className="text-gray-500 text-xs mt-1">Mins</div>
      </div>

      <div className="text-2xl text-gray-600">:</div>

      {/* Seconds */}
      <div className="text-center">
        <div className="bg-gray-800 rounded-lg px-4 py-3 min-w-[60px]">
          <div className="text-2xl font-bold countdown-number text-blue-400">
            {formatNumber(timeLeft.seconds)}
          </div>
        </div>
        <div className="text-gray-500 text-xs mt-1">Secs</div>
      </div>
    </div>
  );
}
