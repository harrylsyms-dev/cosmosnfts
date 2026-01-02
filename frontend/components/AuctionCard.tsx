import Link from 'next/link';
import CountdownTimer from './CountdownTimer';

interface Auction {
  id: string;
  tokenId: number;
  nftName: string;
  image: string | null;
  currentBid: number;
  displayCurrentBid: string;
  bidCount: number;
  endTime: string;
  timeRemaining: number;
  status: string;
}

interface AuctionCardProps {
  auction: Auction;
}

export default function AuctionCard({ auction }: AuctionCardProps) {
  const endTime = new Date(auction.endTime).getTime();
  const isEndingSoon = auction.timeRemaining < 24 * 60 * 60 * 1000; // Less than 24 hours

  return (
    <Link href={`/auctions/${auction.id}`}>
      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer group">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          {auction.image ? (
            <img
              src={auction.image}
              alt={auction.nftName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
              <span className="text-6xl">🌟</span>
            </div>
          )}

          {/* Live badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2 bg-red-600 px-2 py-1 rounded text-sm font-bold">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>

          {/* Ending soon badge */}
          {isEndingSoon && (
            <div className="absolute top-3 right-3 bg-yellow-600 px-2 py-1 rounded text-sm font-bold">
              ENDING SOON
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold mb-2 truncate">{auction.nftName}</h3>

          {/* Current Bid */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">Current Bid</span>
            <span className="text-xl font-bold text-green-400">{auction.displayCurrentBid}</span>
          </div>

          {/* Bid Count */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-400 text-sm">Total Bids</span>
            <span className="text-white">{auction.bidCount}</span>
          </div>

          {/* Countdown */}
          <div className="border-t border-gray-800 pt-3">
            <p className="text-gray-400 text-sm mb-1">Ends in:</p>
            <CountdownTimer targetTime={endTime} />
          </div>

          {/* CTA */}
          <button className="w-full mt-4 btn-primary">
            Place Bid
          </button>
        </div>
      </div>
    </Link>
  );
}
