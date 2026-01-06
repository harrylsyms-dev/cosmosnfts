import Link from 'next/link';
import { BadgeTier, TIER_CONFIG, MAX_TOTAL_SCORE, getCategoryLabel } from '../lib/constants';

interface NFTCardProps {
  nft: {
    id: number;
    name: string;
    image: string;
    score: number;
    badge: string;
    displayPrice: string;
    currentPrice: number;
    priceFormula?: string;
    objectType?: string;
    tierRank?: number;
    tierTotal?: number;
  };
  onAddToCart?: () => void;
}

function getTierStyle(tier: string): { bg: string; border: string; text: string } {
  const config = TIER_CONFIG[tier as BadgeTier];
  if (!config) {
    return { bg: 'bg-gray-600', border: 'border-gray-500', text: 'text-gray-300' };
  }

  // Special gradient backgrounds for top tiers
  if (tier === 'MYTHIC') {
    return {
      bg: 'bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500',
      border: 'border-yellow-400',
      text: 'text-yellow-900',
    };
  }
  if (tier === 'LEGENDARY') {
    return {
      bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500',
      border: 'border-purple-400',
      text: 'text-white',
    };
  }

  return {
    bg: config.bgColor,
    border: config.borderColor,
    text: 'text-white',
  };
}

function getTierIcon(tier: string): string {
  const config = TIER_CONFIG[tier as BadgeTier];
  return config?.icon || '○';
}

export default function NFTCard({ nft, onAddToCart }: NFTCardProps) {
  const tierStyle = getTierStyle(nft.badge);
  const scorePercentage = Math.round((nft.score / MAX_TOTAL_SCORE) * 100);
  const category = nft.objectType ? getCategoryLabel(nft.objectType) : '';

  return (
    <div className="nft-card bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
      {/* Image */}
      <Link href={`/nft/${nft.id}`}>
        <div className="relative aspect-square bg-gray-800 overflow-hidden">
          <img
            src={nft.image || '/images/placeholder.svg'}
            alt={nft.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />

          {/* Tier Badge */}
          <div
            className={`absolute top-3 right-3 px-3 py-1.5 rounded-lg font-bold text-sm ${tierStyle.bg} ${tierStyle.border} border ${tierStyle.text} shadow-lg`}
          >
            {getTierIcon(nft.badge)} {nft.badge}
          </div>
        </div>
      </Link>

      {/* Details */}
      <div className="p-4">
        <Link href={`/nft/${nft.id}`}>
          <h3 className="text-lg font-bold text-white hover:text-blue-400 transition-colors truncate">
            {nft.name}
          </h3>
        </Link>

        {/* Category */}
        {category && (
          <div className="text-gray-400 text-sm mt-1">
            {category}
          </div>
        )}

        {/* Score */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-400">Score</span>
            <span className="text-white font-semibold">{nft.score}/{MAX_TOTAL_SCORE}</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
        </div>

        {/* Price & CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold text-white">{nft.displayPrice}</div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
