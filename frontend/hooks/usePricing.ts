import useSWR from 'swr';

interface PricingData {
  currentPrice: string;
  displayPrice: string;
  timeUntilNextTier: number;
  quantityAvailable: number;
  tierIndex: number;
  phaseName: string;
  phaseIncreasePercent: number;
  tier: {
    price: string;
    quantityAvailable: number;
    quantitySold: number;
    startTime: number;
    duration: number;
    active: boolean;
  };
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
