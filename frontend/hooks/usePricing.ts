import useSWR from 'swr';
import { BadgeTier } from '@prisma/client';

interface PricingData {
  basePrice: number;
  displayPrice: string;
  seriesMultiplier: number;
  tierMultipliers: Record<BadgeTier, number>;
  currentSeries: number;
  currentPhase: number;
  seriesName?: string;
  phaseName?: string;
  isPaused: boolean;
  pausedAt: string | null;
  phaseEndDate: string | null;
  quantityAvailable: number;
  quantitySold: number;
  config: {
    nftsPerPhase: number;
    phaseDurationDays: number;
    nftsPerSeries?: number;
    totalSeries?: number;
  };
  // Legacy fields for backwards compatibility
  tierIndex?: number;
  timeUntilNextTier?: number;
}

interface UsePricingReturn {
  pricing: PricingData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePricing(): UsePricingReturn {
  const { data, error, isLoading, mutate } = useSWR<PricingData>(
    `${apiUrl}/api/pricing`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  return {
    pricing: data || null,
    isLoading,
    error: error || null,
    refresh: () => mutate(),
  };
}

export default usePricing;
