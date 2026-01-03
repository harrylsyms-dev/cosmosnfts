import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import { usePricing } from '../hooks/usePricing';

const phases = [
  { phase: 1, baseRate: 0.10, increase: '-', note: 'Launch phase' },
  { phase: 2, baseRate: 0.1075, increase: '7.5%', note: '' },
  { phase: 3, baseRate: 0.1156, increase: '7.5%', note: '' },
  { phase: 4, baseRate: 0.1243, increase: '7.5%', note: '' },
  { phase: 5, baseRate: 0.1336, increase: '7.5%', note: '' },
  { phase: 6, baseRate: 0.1436, increase: '7.5%', note: '' },
  { phase: 7, baseRate: 0.1544, increase: '7.5%', note: '' },
  { phase: 8, baseRate: 0.1660, increase: '7.5%', note: '' },
  { phase: 9, baseRate: 0.1784, increase: '7.5%', note: '' },
  { phase: 10, baseRate: 0.1918, increase: '7.5%', note: 'Final phase' },
];

const exampleNFTs = [
  { name: 'Alpha Centauri', score: 425, badge: 'ELITE' },
  { name: 'Kepler-442b', score: 400, badge: 'PREMIUM' },
  { name: 'NGC 6302', score: 380, badge: 'EXCEPTIONAL' },
  { name: 'Asteroid 2024 AB', score: 355, badge: 'STANDARD' },
];

export default function Pricing() {
  const { pricing, isLoading } = usePricing();

  return (
    <Layout>
      <Head>
        <title>Pricing - CosmoNFT</title>
        <meta name="description" content="Understand CosmoNFT's dynamic pricing system - Phase-based pricing, score-based calculations, and early buyer advantages." />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Dynamic Pricing System
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our unique pricing model rewards early buyers while ensuring fair value
            based on each celestial object's Cosmic Score.
          </p>
        </div>

        {/* Current Phase Status */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-8 border border-blue-500/30">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <p className="text-gray-400 mb-1">Current Phase</p>
                <h2 className="text-4xl font-bold text-blue-400">
                  {isLoading ? '...' : `Phase ${pricing?.tierIndex || 1}`}
                </h2>
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-1">Current Base Rate</p>
                <div className="text-4xl font-bold text-green-400">
                  ${isLoading ? '...' : pricing?.displayPrice || '0.10'}
                </div>
              </div>
              <div className="text-center">
                <p className="text-gray-400 mb-1">Status</p>
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  pricing?.isPaused
                    ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
                    : 'bg-green-900/50 text-green-300 border border-green-500/30'
                }`}>
                  {pricing?.isPaused ? 'Timer Paused' : 'Active'}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How Pricing Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Score-Based Calculation</h3>
              <p className="text-gray-300 mb-4">
                Each NFT's price is calculated by multiplying the current base rate by its Cosmic Score.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 font-mono text-center">
                <span className="text-blue-400">Price</span> = Base Rate × Cosmic Score
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-4xl mb-4">⏰</div>
              <h3 className="text-xl font-semibold mb-3">Phase-Based Increases</h3>
              <p className="text-gray-300 mb-4">
                The base rate increases by 7.5% with each phase. Early buyers lock in lower prices.
              </p>
              <div className="bg-gray-800 rounded-lg p-4 font-mono text-center">
                <span className="text-yellow-400">+7.5%</span> per phase
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Formula */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Pricing Examples</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-6 py-4 text-left">NFT Example</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4 text-center">Badge</th>
                    <th className="px-6 py-4 text-center">Phase 1 Price</th>
                    <th className="px-6 py-4 text-center">Phase 5 Price</th>
                    <th className="px-6 py-4 text-center">Phase 10 Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {exampleNFTs.map((nft) => (
                    <tr key={nft.name}>
                      <td className="px-6 py-4 font-medium">{nft.name}</td>
                      <td className="px-6 py-4 text-center text-blue-400">{nft.score}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          nft.badge === 'ELITE' ? 'badge-elite' :
                          nft.badge === 'PREMIUM' ? 'badge-premium' :
                          nft.badge === 'EXCEPTIONAL' ? 'badge-exceptional' :
                          'badge-standard'
                        }`}>
                          {nft.badge}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-green-400">
                        ${(0.10 * nft.score).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center text-yellow-400">
                        ${(0.1336 * nft.score).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center text-red-400">
                        ${(0.1918 * nft.score).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center">
            * Prices shown are base calculations. Actual prices may vary based on current phase.
          </p>
        </section>

        {/* Phase Schedule */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Phase Schedule</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-6 py-4 text-left">Phase</th>
                    <th className="px-6 py-4 text-center">Base Rate</th>
                    <th className="px-6 py-4 text-center">Increase</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {phases.map((phase) => {
                    const isCurrent = pricing?.tierIndex === phase.phase;
                    const isPast = pricing && pricing.tierIndex > phase.phase;
                    return (
                      <tr
                        key={phase.phase}
                        className={isCurrent ? 'bg-blue-900/30' : ''}
                      >
                        <td className="px-6 py-4">
                          <span className="font-semibold">Phase {phase.phase}</span>
                          {phase.note && (
                            <span className="ml-2 text-gray-500 text-sm">({phase.note})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center font-mono">
                          ${phase.baseRate.toFixed(4)}
                        </td>
                        <td className="px-6 py-4 text-center text-yellow-400">
                          {phase.increase}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isCurrent ? (
                            <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">Current</span>
                          ) : isPast ? (
                            <span className="text-gray-500">Completed</span>
                          ) : (
                            <span className="text-gray-400">Upcoming</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Early Bird Benefits */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-6 text-center">Early Bird Advantage</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-green-400 mb-2">92%</div>
                <p className="text-gray-300">Maximum savings from Phase 1 to Phase 10</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-blue-400 mb-2">10</div>
                <p className="text-gray-300">Total phases in the pricing cycle</p>
              </div>
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-400 mb-2">7.5%</div>
                <p className="text-gray-300">Price increase per phase</p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Fees */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Additional Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Processing Fees</h3>
              <p className="text-gray-300 mb-4">
                A small payment processing fee (2.9% + $0.30) is added at checkout to cover
                credit card processing costs via Stripe.
              </p>
              <p className="text-gray-400 text-sm">
                This is a standard industry fee and goes entirely to the payment processor.
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">No Hidden Fees</h3>
              <p className="text-gray-300 mb-4">
                What you see is what you pay. No gas fees, no hidden blockchain costs.
                We cover all minting costs on our end.
              </p>
              <p className="text-gray-400 text-sm">
                Unlike other NFT platforms, you never need to own cryptocurrency to purchase.
              </p>
            </div>
          </div>
        </section>

        {/* Charitable Donation */}
        <section className="mb-16">
          <div className="bg-purple-900/30 rounded-xl p-8 border border-purple-500/30">
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="text-4xl">💜</span>
              <h2 className="text-2xl font-bold">30% to Space Exploration</h2>
            </div>
            <p className="text-gray-300 text-center max-w-2xl mx-auto">
              From every purchase, 30% of net proceeds goes directly to verified space exploration
              and research charities. Your purchase helps fund humanity's journey to the stars.
            </p>
            <div className="text-center mt-6">
              <Link
                href="/impact"
                className="text-purple-400 hover:underline"
              >
                Learn more about our impact &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Collecting?</h2>
          <p className="text-gray-400 mb-6">
            Lock in current phase pricing before the next increase.
          </p>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Browse Collection
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </section>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link href="/" className="text-blue-400 hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
