import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';

export default function Header() {
  const { address, isConnected, connect, chainId } = useMetaMask();
  const { cart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const isPolygon = chainId === 137;
  const cartCount = cart?.itemCount || 0;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        hamburgerRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
            {/* Hamburger Menu Button - Mobile Only */}
            <button
              ref={hamburgerRef}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Cart - Hidden on mobile, shown in mobile menu */}
            <Link
              href="/cart"
              className="hidden md:block relative p-2 text-gray-300 hover:text-white transition-colors"
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

            {/* Wallet & Auth - Hidden on mobile, shown in mobile menu */}
            <div className="hidden md:block">
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

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={closeMobileMenu}
        />

        {/* Mobile Menu Drawer */}
        <div
          ref={mobileMenuRef}
          className={`fixed top-0 right-0 h-full w-72 bg-gray-900 z-50 md:hidden transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <span className="text-lg font-semibold text-white">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              aria-label="Close menu"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="flex flex-col p-4">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className="py-3 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="/browse"
              onClick={closeMobileMenu}
              className="py-3 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/marketplace"
              onClick={closeMobileMenu}
              className="py-3 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Marketplace
            </Link>
            <Link
              href="/auctions"
              onClick={closeMobileMenu}
              className="py-3 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              Auctions
            </Link>
            <Link
              href="/cart"
              onClick={closeMobileMenu}
              className="py-3 px-4 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-between"
            >
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </nav>

          {/* Mobile Account Section */}
          <div className="p-4 border-t border-gray-800">
            {isAuthenticated ? (
              <Link
                href="/account"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 py-3 px-4 rounded-lg bg-green-900/50 hover:bg-green-900/70 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div className="flex flex-col">
                  <span className="text-white font-medium">Account</span>
                  <span className="text-green-300 text-sm">
                    {user?.walletAddress?.slice(0, 6)}...{user?.walletAddress?.slice(-4)}
                  </span>
                </div>
              </Link>
            ) : isConnected ? (
              <Link
                href="/account/login"
                onClick={closeMobileMenu}
                className="flex flex-col gap-1 py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <span className="text-white font-medium">Sign In</span>
                <span className="text-blue-200 text-sm">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </Link>
            ) : (
              <button
                onClick={() => {
                  connect();
                  closeMobileMenu();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors font-medium"
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
