import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import {
  TIER_CONFIG,
  TIER_ORDER,
  SERIES_CONFIG,
  PRICING,
  calculatePrice,
  calculateTrajectory,
  BadgeTier,
} from '../lib/constants';

// Example NFTs showing different tiers
const exampleNFTs = [
  { name: 'Sagittarius A*', score: 280, tier: 'MYTHIC' as BadgeTier },
  { name: 'Andromeda Galaxy', score: 260, tier: 'LEGENDARY' as BadgeTier },
  { name: 'Crab Nebula', score: 240, tier: 'ELITE' as BadgeTier },
  { name: 'Kepler-442b', score: 220, tier: 'PREMIUM' as BadgeTier },
  { name: 'Comet Hale-Bopp', score: 180, tier: 'EXCEPTIONAL' as BadgeTier },
  { name: 'Asteroid Bennu', score: 150, tier: 'STANDARD' as BadgeTier },
];

export default function Pricing() {
  return (
    <Layout>
      <Head>
        <title>Pricing - CosmoNFT</title>
        <meta name="description" content="Understand CosmoNFT's pricing system - Tier-based multipliers, Score-based calculations, and Series progression." />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Transparent Pricing System
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Our pricing model rewards collectors based on NFT rarity and score.
            No hidden fees, no per-phase price increases.
          </p>
        </div>

        {/* Pricing Formula */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-8 border border-blue-500/30">
            <h2 className="text-2xl font-bold text-center mb-6">The Pricing Formula</h2>
            <div className="bg-gray-800 rounded-lg p-6 font-mono text-center text-xl">
              <span className="text-blue-400">Price</span> = $0.10 x <span className="text-green-400">Score</span> x <span className="text-purple-400">Tier Multiplier</span> x <span className="text-yellow-400">Series Multiplier</span>
            </div>
            <p className="text-gray-400 text-center mt-4">
              Base rate: <span className="text-white font-bold">${PRICING.baseRatePerPoint}</span> per score point
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">How Pricing Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-4xl mb-4">1</div>
              <h3 className="text-xl font-semibold mb-3 text-green-400">Score (1-300)</h3>
              <p className="text-gray-300">
                Each NFT has a Cosmic Score based on 10 metrics including cultural significance,
                scientific importance, and uniqueness. Higher scores = higher prices.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-4xl mb-4">2</div>
              <h3 className="text-xl font-semibold mb-3 text-purple-400">Tier Multiplier</h3>
              <p className="text-gray-300">
                Rarer tiers have higher multipliers. A MYTHIC NFT (200x) costs 200 times more
                than a STANDARD NFT (1x) with the same score.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <div className="text-4xl mb-4">3</div>
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">Series Multiplier</h3>
              <p className="text-gray-300">
                Series 1 has a 1.0x multiplier. Future series may have higher multipliers (1.5x-3.0x)
                based on demand and sell-through rates.
              </p>
            </div>
          </div>
        </section>

        {/* Tier Multipliers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Tier Multipliers</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-6 py-4 text-left">Tier</th>
                    <th className="px-6 py-4 text-center">Multiplier</th>
                    <th className="px-6 py-4 text-center">Count</th>
                    <th className="px-6 py-4 text-center">Rarity</th>
                    <th className="px-6 py-4 text-left">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {TIER_ORDER.map((tier) => {
                    const config = TIER_CONFIG[tier];
                    return (
                      <tr key={tier} className="hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${config.bgColor} ${config.textColor}`}>
                            {config.icon} {tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-2xl font-bold text-white">
                          {config.multiplier}x
                        </td>
                        <td className="px-6 py-4 text-center text-gray-300">
                          {config.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-400">
                          {config.rarity}
                        </td>
                        <td className="px-6 py-4 text-gray-400">
                          {config.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Pricing Examples */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Pricing Examples</h2>
          <div className="bg-gray-900 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="px-6 py-4 text-left">NFT Example</th>
                    <th className="px-6 py-4 text-center">Score</th>
                    <th className="px-6 py-4 text-center">Tier</th>
                    <th className="px-6 py-4 text-center">Multiplier</th>
                    <th className="px-6 py-4 text-center">Series 1 Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {exampleNFTs.map((nft) => {
                    const config = TIER_CONFIG[nft.tier];
                    const price = calculatePrice(nft.score, nft.tier, 1.0);
                    return (
                      <tr key={nft.name}>
                        <td className="px-6 py-4 font-medium">{nft.name}</td>
                        <td className="px-6 py-4 text-center text-blue-400 font-bold">{nft.score}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${config.bgColor}`}>
                            {nft.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-purple-400">
                          {config.multiplier}x
                        </td>
                        <td className="px-6 py-4 text-center text-green-400 font-bold text-lg">
                          ${price.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center">
            Formula: $0.10 x Score x Tier Multiplier x Series Multiplier (1.0 for Series 1)
          </p>
        </section>

        {/* Series Structure */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Series Structure</h2>
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-8 border border-purple-500/30">
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-5xl font-bold text-purple-400 mb-2">{SERIES_CONFIG.totalSeries}</div>
                <p className="text-gray-300">Total Series</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-blue-400 mb-2">{SERIES_CONFIG.phasesPerSeries}</div>
                <p className="text-gray-300">Phases per Series</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-green-400 mb-2">{SERIES_CONFIG.nftsPerPhase.toLocaleString()}</div>
                <p className="text-gray-300">NFTs per Phase</p>
              </div>
              <div>
                <div className="text-5xl font-bold text-yellow-400 mb-2">{SERIES_CONFIG.nftsPerSeries.toLocaleString()}</div>
                <p className="text-gray-300">NFTs per Series</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-xl font-semibold mb-4 text-center">Series Multiplier Progression</h3>
              <p className="text-gray-400 text-center mb-4">
                Series multipliers are determined by sell-through rates. Higher demand = higher multipliers for future series.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-green-400 font-bold mb-1">Series 1</div>
                  <div className="text-2xl font-bold text-white">1.0x</div>
                  <div className="text-gray-500 text-sm">Base pricing</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-yellow-400 font-bold mb-1">Series 2+</div>
                  <div className="text-2xl font-bold text-white">1.5x - 3.0x</div>
                  <div className="text-gray-500 text-sm">Based on demand</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 md:col-span-2 lg:col-span-1">
                  <div className="text-blue-400 font-bold mb-1">Key Point</div>
                  <div className="text-sm text-gray-300">No per-phase price increases within a series</div>
                </div>
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
              <span className="text-4xl">*</span>
              <h2 className="text-2xl font-bold">{PRICING.donationPercentage}% to Space Exploration</h2>
            </div>
            <p className="text-gray-300 text-center max-w-2xl mx-auto">
              From every purchase, {PRICING.donationPercentage}% of net proceeds goes directly to verified space exploration
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
            Browse our collection of {(SERIES_CONFIG.totalSeries * SERIES_CONFIG.nftsPerSeries).toLocaleString()} unique cosmic NFTs.
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
