import Link from 'next/link';
import { useMetaMask } from '../hooks/useMetaMask';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { address, isConnected, connect, chainId } = useMetaMask();
  const { cart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const isPolygon = chainId === 137;
  const cartCount = cart?.itemCount || 0;

  return (
    <header className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🌟</span>
            <span className="text-xl font-bold gradient-text">CosmoNFT</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/browse" className="text-gray-300 hover:text-white transition-colors">
              Browse
            </Link>
            <Link href="/auctions" className="text-gray-300 hover:text-white transition-colors">
              Auctions
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
              About
            </Link>
            <a
              href="https://planetarysociety.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
            >
              TPS Partner
            </a>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {/* Account */}
            <Link
              href={isAuthenticated ? '/account' : '/account/login'}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isAuthenticated ? 'My Account' : 'Sign In'}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center gap-2">
                {!isPolygon && (
                  <span className="text-yellow-400 text-sm">Wrong Network</span>
                )}
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    isPolygon ? 'bg-green-900/50' : 'bg-yellow-900/50'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isPolygon ? 'bg-green-400' : 'bg-yellow-400'
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      isPolygon ? 'text-green-300' : 'text-yellow-300'
                    }`}
                  >
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={connect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
