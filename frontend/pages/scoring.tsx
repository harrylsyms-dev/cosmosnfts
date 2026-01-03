import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

const scoreCategories = [
  {
    name: 'Fame & Visibility',
    icon: '✨',
    color: 'blue',
    maxScore: 100,
    description: 'How well-known is this celestial object to the general public?',
    factors: [
      'Named in popular astronomy texts and media',
      'Visibility from Earth (naked eye vs. telescope)',
      'Frequency of mentions in scientific publications',
      'Featured in documentaries or news coverage',
    ],
    examples: [
      { name: 'Polaris (North Star)', score: 95 },
      { name: 'Sirius', score: 90 },
      { name: 'Random distant galaxy', score: 15 },
    ],
  },
  {
    name: 'Scientific Significance',
    icon: '🔬',
    color: 'purple',
    maxScore: 100,
    description: 'How important is this object to scientific research and understanding?',
    factors: [
      'Role in major scientific discoveries',
      'Contribution to understanding cosmic phenomena',
      'Active research focus by space agencies',
      'Potential for future discoveries',
    ],
    examples: [
      { name: 'Sagittarius A* (black hole)', score: 98 },
      { name: 'TRAPPIST-1 system', score: 92 },
      { name: 'Common main-sequence star', score: 25 },
    ],
  },
  {
    name: 'Rarity',
    icon: '💎',
    color: 'yellow',
    maxScore: 100,
    description: 'How uncommon or unique is this type of celestial object?',
    factors: [
      'Frequency of this object type in the universe',
      'Unique properties or characteristics',
      'One-of-a-kind phenomena',
      'Limited number in observable universe',
    ],
    examples: [
      { name: 'Known black hole merger', score: 97 },
      { name: 'Magnetar', score: 88 },
      { name: 'Common red dwarf star', score: 10 },
    ],
  },
  {
    name: 'Discovery Recency',
    icon: '📅',
    color: 'green',
    maxScore: 100,
    description: 'When was this object discovered? Older discoveries are often more historically significant.',
    factors: [
      'Historical significance of early discoveries',
      'Ancient observations recorded in history',
      'Modern discoveries with advanced technology',
      'Balance between historical value and cutting-edge science',
    ],
    examples: [
      { name: 'Orion Nebula (ancient)', score: 95 },
      { name: 'Pluto (1930)', score: 75 },
      { name: 'Exoplanet discovered 2024', score: 40 },
    ],
  },
  {
    name: 'Cultural Impact',
    icon: '🎭',
    color: 'pink',
    maxScore: 100,
    description: 'How much has this object influenced human culture, art, and mythology?',
    factors: [
      'Appearances in mythology and ancient cultures',
      'Referenced in literature, film, and art',
      'Influence on human navigation and timekeeping',
      'Symbolic or spiritual significance',
    ],
    examples: [
      { name: 'The Moon', score: 100 },
      { name: 'Pleiades star cluster', score: 88 },
      { name: 'Recently discovered asteroid', score: 5 },
    ],
  },
];

const badgeTiers = [
  {
    name: 'ELITE',
    range: '425-500',
    color: 'yellow',
    borderColor: 'border-yellow-500',
    bgColor: 'bg-yellow-900/30',
    description: 'The most exceptional celestial objects. Extremely rare, historically significant, and culturally iconic.',
    percentage: '~5%',
  },
  {
    name: 'PREMIUM',
    range: '400-424',
    color: 'blue',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-900/30',
    description: 'High-quality objects with strong scores across multiple categories. The sweet spot for collectors.',
    percentage: '~15%',
  },
  {
    name: 'EXCEPTIONAL',
    range: '375-399',
    color: 'cyan',
    borderColor: 'border-cyan-500',
    bgColor: 'bg-cyan-900/30',
    description: 'Solid, respectable objects with notable characteristics. Great for building a diverse collection.',
    percentage: '~30%',
  },
  {
    name: 'STANDARD',
    range: '350-374',
    color: 'gray',
    borderColor: 'border-gray-500',
    bgColor: 'bg-gray-800',
    description: 'Entry-level celestial objects. Perfect for new collectors or completing a comprehensive collection.',
    percentage: '~50%',
  },
];

export default function Scoring() {
  return (
    <Layout>
      <Head>
        <title>Cosmic Scoring - CosmoNFT</title>
        <meta name="description" content="Learn how CosmoNFT's Cosmic Scoring system works - Five categories that determine each celestial object's value and rarity." />
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            The Cosmic Scoring System
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every celestial object is evaluated across five scientific and cultural
            categories, resulting in a total Cosmic Score from 0 to 500.
          </p>
        </div>

        {/* Score Overview */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-pink-900/30 rounded-xl p-8">
            <div className="grid md:grid-cols-5 gap-4 mb-8">
              {scoreCategories.map((category) => (
                <div key={category.name} className="text-center">
                  <div className="text-4xl mb-2">{category.icon}</div>
                  <div className="text-sm text-gray-300">{category.name}</div>
                  <div className={`text-xl font-bold text-${category.color}-400`}>
                    0-100
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-4 bg-gray-900/50 rounded-lg px-6 py-4">
                <span className="text-gray-400">Total Cosmic Score:</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  0 - 500
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Categories */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">The Five Categories</h2>
          <div className="space-y-8">
            {scoreCategories.map((category, index) => (
              <div
                key={category.name}
                className={`bg-gray-900 rounded-xl p-6 border-l-4 border-${category.color}-500`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{category.icon}</div>
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold">{category.name}</h3>
                      <span className={`text-${category.color}-400 font-semibold`}>
                        {category.maxScore} points max
                      </span>
                    </div>
                    <p className="text-gray-300 mb-4">{category.description}</p>

                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Factors */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                          Scoring Factors
                        </h4>
                        <ul className="space-y-2">
                          {category.factors.map((factor, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300">
                              <svg
                                className={`w-5 h-5 text-${category.color}-400 flex-shrink-0 mt-0.5`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Examples */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                          Example Scores
                        </h4>
                        <div className="space-y-2">
                          {category.examples.map((example, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2"
                            >
                              <span className="text-gray-300">{example.name}</span>
                              <span className={`font-bold text-${category.color}-400`}>
                                {example.score}/100
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Badge Tiers */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Badge Tiers</h2>
          <p className="text-gray-400 text-center mb-8 max-w-2xl mx-auto">
            Based on total Cosmic Score, each NFT receives a badge tier that indicates
            its overall quality and rarity.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {badgeTiers.map((tier) => (
              <div
                key={tier.name}
                className={`${tier.bgColor} rounded-xl p-6 border ${tier.borderColor}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`badge-${tier.name.toLowerCase()} px-3 py-1 rounded font-bold text-lg`}>
                    {tier.name}
                  </span>
                  <span className="text-gray-400">{tier.percentage} of collection</span>
                </div>
                <div className={`text-2xl font-bold text-${tier.color}-400 mb-2`}>
                  Score: {tier.range}
                </div>
                <p className="text-gray-300">{tier.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Score to Price */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Score Affects Price</h2>
          <div className="bg-gray-900 rounded-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-block bg-gray-800 rounded-lg px-8 py-4 font-mono text-xl">
                <span className="text-gray-400">Price = </span>
                <span className="text-blue-400">Base Rate</span>
                <span className="text-gray-400"> × </span>
                <span className="text-purple-400">Cosmic Score</span>
              </div>
            </div>
            <p className="text-gray-300 text-center mb-6">
              Higher scored objects are more valuable and cost more. This ensures that
              truly exceptional celestial objects are priced to reflect their significance.
            </p>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Score 350</div>
                <div className="text-xl font-bold text-green-400">$35.00</div>
                <div className="text-gray-500 text-xs">at $0.10 base</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Score 400</div>
                <div className="text-xl font-bold text-green-400">$40.00</div>
                <div className="text-gray-500 text-xs">at $0.10 base</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Score 450</div>
                <div className="text-xl font-bold text-green-400">$45.00</div>
                <div className="text-gray-500 text-xs">at $0.10 base</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-gray-400 text-sm mb-1">Score 500</div>
                <div className="text-xl font-bold text-green-400">$50.00</div>
                <div className="text-gray-500 text-xs">at $0.10 base</div>
              </div>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Data Sources</h2>
          <div className="bg-gray-900 rounded-xl p-8">
            <p className="text-gray-300 text-center mb-6">
              Cosmic Scores are calculated using data from reputable astronomical sources:
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-2">🔭</div>
                <h4 className="font-semibold mb-1">NASA Databases</h4>
                <p className="text-gray-400 text-sm">
                  Exoplanet Archive, HEASARC, and official NASA catalogs
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">📚</div>
                <h4 className="font-semibold mb-1">Scientific Literature</h4>
                <p className="text-gray-400 text-sm">
                  Peer-reviewed publications and astronomical journals
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🌐</div>
                <h4 className="font-semibold mb-1">IAU Records</h4>
                <p className="text-gray-400 text-sm">
                  International Astronomical Union naming and classification
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold mb-4">Explore Scored NFTs</h2>
          <p className="text-gray-400 mb-6">
            Browse our collection and see Cosmic Scores in action.
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
