import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: 'Getting Started',
    icon: '🚀',
    items: [
      {
        question: 'What is CosmoNFT?',
        answer: 'CosmoNFT is a platform where you can purchase unique NFTs representing real celestial objects - stars, exoplanets, galaxies, nebulae, and more. Each NFT is scientifically scored and dynamically priced. 30% of all proceeds go to space exploration charities.',
      },
      {
        question: 'What do I need to get started?',
        answer: 'You need a cryptocurrency wallet (we recommend MetaMask) and a credit card for payment. The wallet receives your NFT after purchase, while payment is processed via traditional credit card through Stripe.',
      },
      {
        question: 'Do I need cryptocurrency to buy NFTs?',
        answer: 'No! Unlike most NFT platforms, CosmoNFT lets you purchase with a regular credit card. You just need a wallet address to receive the NFT. We handle all the blockchain complexity for you.',
      },
    ],
  },
  {
    title: 'Wallets',
    icon: '👛',
    items: [
      {
        question: 'What is a crypto wallet?',
        answer: 'A crypto wallet is a digital tool that stores your blockchain assets, including NFTs. It has a public address (like an email address) where you receive NFTs, and a private key (like a password) that proves ownership. Never share your private key with anyone.',
      },
      {
        question: 'Which wallets does CosmoNFT support?',
        answer: 'We currently support MetaMask, which is available as a browser extension and mobile app. We plan to add support for more wallets including Coinbase Wallet and WalletConnect in the future.',
      },
      {
        question: 'How do I set up MetaMask?',
        answer: 'Visit metamask.io and download the browser extension or mobile app. Create a new wallet, securely save your recovery phrase (write it down and store it safely offline), and set a strong password. Your wallet is now ready to connect to CosmoNFT.',
      },
      {
        question: 'What if I lose access to my wallet?',
        answer: 'If you have your recovery phrase (seed phrase), you can restore your wallet on any device. If you lose both your wallet access and recovery phrase, your NFTs cannot be recovered. Always store your recovery phrase securely.',
      },
    ],
  },
  {
    title: 'NFTs & Ownership',
    icon: '🌟',
    items: [
      {
        question: 'What is an NFT?',
        answer: 'NFT stands for Non-Fungible Token. It is a unique digital asset stored on a blockchain that proves ownership of a specific item. Unlike cryptocurrencies, each NFT is unique and cannot be exchanged 1:1 with another.',
      },
      {
        question: 'What do I actually own when I buy a CosmoNFT?',
        answer: 'You own a unique digital token representing a celestial object, along with the associated artwork and metadata. You can hold, display, or trade your NFT. Note that you do not own the actual celestial object itself - no one can own a star or planet!',
      },
      {
        question: 'Which blockchain are CosmoNFTs on?',
        answer: 'CosmoNFTs are minted on the Polygon blockchain, which offers fast transactions and low gas fees while maintaining security through Ethereum.',
      },
      {
        question: 'Can I sell or trade my NFT?',
        answer: 'Yes! Once minted to your wallet, you can list your NFT on our marketplace or transfer it to another wallet. You can also trade on external platforms that support Polygon NFTs.',
      },
    ],
  },
  {
    title: 'Purchasing',
    icon: '💳',
    items: [
      {
        question: 'How do I purchase an NFT?',
        answer: 'Browse our collection, add NFTs to your cart, connect your wallet, and proceed to checkout. You will pay with a credit card via Stripe, and your NFT will be minted directly to your connected wallet.',
      },
      {
        question: 'What payment methods are accepted?',
        answer: 'We accept all major credit and debit cards through Stripe, including Visa, Mastercard, American Express, and Discover. Cryptocurrency payments may be added in the future.',
      },
      {
        question: 'How long does minting take?',
        answer: 'After successful payment, your NFT is typically minted within 1-5 minutes. You will receive an email confirmation and can view your NFT in your wallet once complete.',
      },
      {
        question: 'Can I get a refund?',
        answer: 'Due to the nature of blockchain transactions, all sales are final. Once an NFT is minted, we cannot reverse the transaction. Please ensure you want to purchase before completing checkout.',
      },
      {
        question: 'Why does the price change?',
        answer: 'CosmoNFT uses dynamic pricing based on phases. As each phase progresses, the base price increases. Early buyers get better prices! Check our Pricing page for more details.',
      },
    ],
  },
  {
    title: 'Cosmic Scoring',
    icon: '📊',
    items: [
      {
        question: 'What is the Cosmic Score?',
        answer: 'The Cosmic Score is a unique rating system (0-500 points) that evaluates each celestial object across five categories: Fame & Visibility, Scientific Significance, Rarity, Discovery Recency, and Cultural Impact.',
      },
      {
        question: 'How does the score affect price?',
        answer: 'Price is calculated as: Base Rate x Cosmic Score. Higher scored objects cost more because they are more significant, rarer, or more culturally important. A 450-score NFT costs 4.5x more than a 100-score NFT.',
      },
      {
        question: 'What are the badge tiers?',
        answer: 'Based on Cosmic Score: ELITE (425+) represents the top-tier objects, PREMIUM (400-424) is the popular sweet spot, EXCEPTIONAL (375-399) offers solid quality, and STANDARD (350-374) is great for starting collectors.',
      },
    ],
  },
  {
    title: 'Marketplace',
    icon: '🏪',
    items: [
      {
        question: 'How does the secondary marketplace work?',
        answer: 'NFT owners can list their NFTs for sale at a price they choose. When someone buys, the NFT transfers to the buyer and the seller receives payment minus platform fees.',
      },
      {
        question: 'What are the marketplace fees?',
        answer: 'A small platform fee is deducted from secondary sales to support platform operations and continued charitable donations. The exact fee percentage is displayed when you list an item.',
      },
      {
        question: 'Can I make offers on NFTs?',
        answer: 'Yes! You can make offers on listed NFTs. Sellers can accept, reject, or counter your offer. Offers remain valid until accepted, rejected, or you cancel them.',
      },
    ],
  },
  {
    title: 'Impact & Charity',
    icon: '🌍',
    items: [
      {
        question: 'How much goes to charity?',
        answer: '30% of net proceeds from primary sales go directly to verified space exploration and research charities. This is a core part of our mission.',
      },
      {
        question: 'Which charities do you support?',
        answer: 'We are currently selecting verified 501(c)(3) space exploration and education charities to partner with. Our beneficiary partners will be announced before the first donation is made. Visit our Impact page for updates.',
      },
      {
        question: 'Can I see proof of donations?',
        answer: 'Yes! We publish donation receipts and updates on our Impact page. We are committed to transparency and regularly share how funds are being used.',
      },
    ],
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-900/50 transition-colors"
      >
        <span className="font-medium text-white">{item.question}</span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 pb-4 text-gray-300">
          <p>{item.answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <Layout>
      <Head>
        <title>FAQ - CosmoNFT</title>
        <meta name="description" content="Frequently asked questions about CosmoNFT - Learn about NFTs, wallets, purchasing, and more." />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-400 text-lg">
            Find answers to common questions about CosmoNFT, NFTs, wallets, and more.
          </p>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-900 rounded-lg p-6 mb-12">
          <h2 className="text-lg font-semibold mb-4">Jump to a topic:</h2>
          <div className="flex flex-wrap gap-2">
            {faqData.map((category) => (
              <a
                key={category.title}
                href={`#${category.title.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                {category.icon} {category.title}
              </a>
            ))}
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqData.map((category) => (
            <section
              key={category.title}
              id={category.title.toLowerCase().replace(/\s+/g, '-')}
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{category.icon}</span>
                <h2 className="text-2xl font-bold">{category.title}</h2>
              </div>
              <div className="space-y-3">
                {category.items.map((item, index) => (
                  <FAQAccordion key={index} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-gray-300 mb-6">
            Cannot find what you are looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@cosmonft.com"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Contact Support
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        {/* Related Pages */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Related Pages</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/pricing" className="text-blue-400 hover:underline">
              Pricing System
            </Link>
            <Link href="/scoring" className="text-blue-400 hover:underline">
              Cosmic Scoring
            </Link>
            <Link href="/impact" className="text-blue-400 hover:underline">
              Our Impact
            </Link>
            <Link href="/terms" className="text-blue-400 hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
