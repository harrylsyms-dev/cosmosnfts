import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useMetaMask } from '../../hooks/useMetaMask';
import { useAuth } from '../../hooks/useAuth';

export default function AccountLogin() {
  const router = useRouter();
  const { address, isConnected, connect, error: walletError } = useMetaMask();
  const { login, isAuthenticated, isLoading, error: authError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/account');
    }
  }, [isAuthenticated, isLoading, router]);

  async function handleSignIn() {
    if (!address) return;

    setIsSigningIn(true);
    const success = await login(address);
    setIsSigningIn(false);

    if (success) {
      router.push('/account');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Sign In | CosmoNFT</title>
      </Head>

      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🌟</span>
              <span className="text-xl font-bold gradient-text">CosmoNFT</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Sign In to Your Account</h1>
              <p className="text-gray-400">
                Connect your wallet and sign a message to access your orders and NFTs.
              </p>
            </div>

            {/* Error Messages */}
            {(walletError || authError) && (
              <div className="bg-red-900/30 border border-red-600 text-red-400 rounded-lg p-4 mb-6">
                {walletError || authError}
              </div>
            )}

            {/* Step 1: Connect Wallet */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isConnected ? 'bg-green-600' : 'bg-blue-600'
                }`}>
                  {isConnected ? '✓' : '1'}
                </div>
                <span className="font-semibold">Connect Wallet</span>
              </div>

              {!isConnected ? (
                <button
                  onClick={connect}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.85.38-1.78.64-2.75.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.58-2.11-9.96-5.02-.42.72-.66 1.56-.66 2.46 0 1.68.85 3.16 2.14 4.02-.79-.02-1.53-.24-2.18-.6v.06c0 2.35 1.67 4.31 3.88 4.76-.4.1-.83.16-1.27.16-.31 0-.62-.03-.92-.08.63 1.96 2.45 3.39 4.61 3.43-1.69 1.32-3.83 2.1-6.15 2.1-.4 0-.8-.02-1.19-.07 2.19 1.4 4.78 2.22 7.57 2.22 9.07 0 14.02-7.52 14.02-14.02 0-.21 0-.43-.01-.64.96-.7 1.79-1.56 2.45-2.55z"/>
                  </svg>
                  Connect MetaMask
                </button>
              ) : (
                <div className="bg-green-900/30 border border-green-600 rounded-lg p-4 text-center">
                  <p className="text-green-400 text-sm mb-1">Connected</p>
                  <p className="font-mono text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Sign Message */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  isConnected ? 'bg-blue-600' : 'bg-gray-600'
                }`}>
                  2
                </div>
                <span className={`font-semibold ${!isConnected ? 'text-gray-500' : ''}`}>
                  Sign Message
                </span>
              </div>

              <button
                onClick={handleSignIn}
                disabled={!isConnected || isSigningIn}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSigningIn ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Waiting for Signature...
                  </span>
                ) : (
                  'Sign In with Wallet'
                )}
              </button>
            </div>

            {/* Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400">
              <p className="mb-2">
                <strong className="text-white">Why sign a message?</strong>
              </p>
              <p>
                Signing a message proves you own this wallet without sharing your private key.
                No transaction is made and no gas fees are required.
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-400 hover:text-white text-sm">
                &larr; Back to Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
