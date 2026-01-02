import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Unlock() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        setError('Invalid password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>CosmoNFTs - Early Access</title>
        <meta name="description" content="CosmoNFTs - Coming Soon" />
      </Head>

      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        {/* Stars background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(100)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                opacity: Math.random() * 0.7 + 0.3,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-md w-full">
          {/* Logo/Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                CosmoNFTs
              </span>
            </h1>
            <p className="text-gray-400 text-lg">Own a Piece of the Universe</p>
          </div>

          {/* Password Form */}
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-800">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔐</div>
              <h2 className="text-xl font-semibold text-white">Early Access</h2>
              <p className="text-gray-400 text-sm mt-2">
                Enter the password to preview the site
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-4"
                autoFocus
              />

              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Checking...' : 'Enter Site'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-8">
            Coming Soon • Celestial NFTs • Scientifically Scored
          </p>
        </div>
      </div>
    </>
  );
}
