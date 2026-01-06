import { useState, useEffect } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

interface TotalDonated {
  manual: {
    totalUsd: number;
    formatted: string;
  };
  crypto: {
    totalEth: number;
    currentUsd: number;
    formattedEth: string;
    formattedUsd: string;
  };
  grandTotal: {
    usd: number;
    formatted: string;
  };
  ethPrice: {
    current: number;
    formatted: string;
  };
  lastUpdated: string;
}

interface TotalDonatedBadgeProps {
  variant?: 'compact' | 'detailed' | 'footer';
  showBreakdown?: boolean;
  className?: string;
}

export default function TotalDonatedBadge({
  variant = 'compact',
  showBreakdown = false,
  className = '',
}: TotalDonatedBadgeProps) {
  const [data, setData] = useState<TotalDonated | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();

    // Auto-refresh every 30 seconds for live updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const res = await fetch(`${apiUrl}/api/benefactor/total-donated`);
      if (res.ok) {
        const result = await res.json();
        // Validate the response has the expected structure
        if (result?.grandTotal?.formatted && result?.manual?.formatted && result?.crypto?.formattedEth) {
          setData(result);
        }
      }
    } catch (error) {
      console.error('Failed to fetch total donated:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading || !data) {
    return null; // Don't show anything while loading
  }

  // Compact badge for footer
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-gray-400 text-sm">Supporting Space Exploration</span>
        <span className="text-white font-semibold">{data.grandTotal.formatted}</span>
        <span className="text-gray-500 text-xs">donated</span>
      </div>
    );
  }

  // Footer variant
  if (variant === 'footer') {
    return (
      <div className={`bg-gray-900/50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-sm">Supporting Space Exploration</div>
            <div className="text-xl font-bold text-white">{data.grandTotal.formatted}</div>
            <div className="text-gray-500 text-xs">Total donated to date</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">30% of auction proceeds</div>
            <div className="text-gray-500 text-xs">support space initiatives</div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-500 text-xs">Live</span>
            </div>
          </div>
        </div>
        {showBreakdown && (
          <div className="mt-3 pt-3 border-t border-gray-800 flex gap-4 text-sm">
            <div>
              <span className="text-gray-500">USD: </span>
              <span className="text-green-400">{data.manual.formatted}</span>
            </div>
            <div>
              <span className="text-gray-500">Crypto: </span>
              <span className="text-purple-400">{data.crypto.formattedEth}</span>
              <span className="text-gray-500"> = </span>
              <span className="text-yellow-400">{data.crypto.formattedUsd}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Detailed variant for "Our Impact" page
  return (
    <div className={`bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-purple-500/20 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Committed to Space Exploration</h2>
        <p className="text-gray-400">
          30% of all auction proceeds support space exploration initiatives
        </p>
      </div>

      <div className="text-center mb-8">
        <div className="text-5xl font-bold text-white mb-2">
          {data.grandTotal.formatted}
        </div>
        <div className="text-gray-400">Total Donated</div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-gray-500 text-sm">Updated in real-time</span>
        </div>
      </div>

      {showBreakdown && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm">USD Donations</div>
            <div className="text-xl font-bold text-green-400">{data.manual.formatted}</div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-4 text-center">
            <div className="text-gray-400 text-sm">Crypto Donations</div>
            <div className="text-xl font-bold text-purple-400">{data.crypto.formattedEth}</div>
            <div className="text-sm text-yellow-400">= {data.crypto.formattedUsd}</div>
            <div className="text-xs text-gray-500">1 ETH = {data.ethPrice.formatted}</div>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-gray-500 text-sm">
        Every purchase helps advance space exploration and discovery
      </div>
    </div>
  );
}
