import Link from 'next/link';

interface NFTCardProps {
  nft: {
    id: number;
    name: string;
    image: string;
    score: number;
    badge: string;
    displayPrice: string;
    currentPrice: number;
  };
  onAddToCart?: () => void;
}

function getBadgeStyle(badge: string) {
  switch (badge) {
    case 'ELITE':
      return 'badge-elite';
    case 'PREMIUM':
      return 'badge-premium';
    case 'EXCEPTIONAL':
      return 'badge-exceptional';
    default:
      return 'badge-standard';
  }
}

function getBadgeIcon(badge: string) {
  switch (badge) {
    case 'ELITE':
      return '⭐';
    case 'PREMIUM':
      return '💫';
    case 'EXCEPTIONAL':
      return '🌟';
    default:
      return '🔷';
  }
}

export default function NFTCard({ nft, onAddToCart }: NFTCardProps) {
  return (
    <div className="nft-card bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-600 transition-all">
      {/* Image */}
      <Link href={`/nft/${nft.id}`}>
        <div className="relative aspect-square bg-gray-800 overflow-hidden">
          <img
            src={nft.image || '/images/placeholder.jpg'}
            alt={nft.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />

          {/* Badge */}
          <div
            className={`absolute top-3 right-3 px-3 py-1 rounded-lg font-bold text-sm ${getBadgeStyle(
              nft.badge
            )}`}
          >
            {getBadgeIcon(nft.badge)} {nft.badge}
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

        <div className="flex items-center justify-between mt-2">
          <div className="text-gray-400 text-sm">
            Score: <span className="text-white">{nft.score}/500</span>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <div className="text-gray-400 text-xs">Current Price</div>
            <div className="text-xl font-bold text-white">{nft.displayPrice}</div>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
