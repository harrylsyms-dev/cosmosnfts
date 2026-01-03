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
            <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors">
              Marketplace
            </Link>
            <Link href="/auctions" className="text-gray-300 hover:text-white transition-colors">
              Auctions
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
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

            {/* Wallet & Auth */}
            {isAuthenticated ? (
              // Authenticated: Show account link with wallet address
              <Link
                href="/account"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/50 hover:bg-green-900/70 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-green-300 text-sm">
                  {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
                </span>
              </Link>
            ) : isConnected ? (
              // Connected but not signed in: Show sign in button with wallet info
              <Link
                href="/account/login"
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <span className="text-white font-medium">Sign In</span>
                <span className="text-blue-200 text-sm border-l border-blue-400 pl-3">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </Link>
            ) : (
              // Not connected: Show connect button
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
