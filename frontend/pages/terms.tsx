import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Terms() {
  return (
    <Layout>
      <Head>
        <title>Terms of Service - CosmoNFT</title>
        <meta name="description" content="Terms of Service for CosmoNFT - Read our terms and conditions for using our celestial NFT marketplace." />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to CosmoNFT. These Terms of Service ("Terms") govern your access to and use of
              the CosmoNFT website, platform, and services (collectively, the "Service"). By accessing
              or using the Service, you agree to be bound by these Terms.
            </p>
            <p>
              CosmoNFT is a platform for purchasing, collecting, and trading non-fungible tokens (NFTs)
              representing celestial objects. Our NFTs are minted on the Polygon blockchain.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Eligibility</h2>
            <p className="mb-4">
              You must be at least 18 years old to use the Service. By using the Service, you represent
              and warrant that you meet this age requirement and have the legal capacity to enter into
              these Terms.
            </p>
            <p>
              You are responsible for ensuring that your use of the Service complies with all laws,
              rules, and regulations applicable to you in your jurisdiction.
            </p>
          </section>

          {/* Account and Wallet */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account and Wallet</h2>
            <p className="mb-4">
              To purchase NFTs on CosmoNFT, you must connect a compatible cryptocurrency wallet
              (such as MetaMask). You are solely responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the security of your wallet and private keys</li>
              <li>All activities that occur through your wallet connection</li>
              <li>Ensuring the accuracy of your wallet address when making purchases</li>
              <li>Any fees associated with your wallet or blockchain transactions</li>
            </ul>
          </section>

          {/* Purchases and Payments */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Purchases and Payments</h2>
            <p className="mb-4">
              NFT purchases on CosmoNFT are processed via credit card through our payment processor,
              Stripe. By making a purchase, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Provide accurate and complete payment information</li>
              <li>Pay all charges at the prices in effect at the time of purchase</li>
              <li>Pay any applicable taxes and processing fees</li>
            </ul>
            <p className="mb-4">
              <strong className="text-white">All sales are final.</strong> Due to the nature of NFTs
              and blockchain transactions, we cannot offer refunds once an NFT has been minted to
              your wallet.
            </p>
            <p>
              Prices are subject to change based on our dynamic pricing system. The price displayed
              at checkout is the final price you will pay.
            </p>
          </section>

          {/* NFT Ownership */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. NFT Ownership</h2>
            <p className="mb-4">
              When you purchase an NFT on CosmoNFT, you receive ownership of the NFT token itself,
              which represents a unique digital collectible. This ownership includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>The right to hold, transfer, or sell the NFT</li>
              <li>The right to display the associated artwork for personal, non-commercial use</li>
              <li>Access to any holder benefits we may offer</li>
            </ul>
            <p>
              NFT ownership does not grant you any rights to the underlying celestial object,
              intellectual property rights beyond personal use, or any claims to real astronomical bodies.
            </p>
          </section>

          {/* Marketplace */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Marketplace</h2>
            <p className="mb-4">
              CosmoNFT provides a secondary marketplace where users can list and trade NFTs.
              When using the marketplace:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>A platform fee may be deducted from secondary sales</li>
              <li>You are responsible for setting fair and accurate prices</li>
              <li>We reserve the right to remove listings that violate these Terms</li>
              <li>Trades are executed on the blockchain and are irreversible</li>
            </ul>
          </section>

          {/* Charitable Contributions */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Charitable Contributions</h2>
            <p>
              CosmoNFT donates 30% of net proceeds from primary sales to verified space exploration
              and research charities. This commitment is part of our mission but does not create
              any direct charitable relationship between you and the beneficiary organizations.
              For more information, visit our{' '}
              <Link href="/impact" className="text-blue-400 hover:underline">
                Impact page
              </Link>.
            </p>
          </section>

          {/* Prohibited Activities */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Prohibited Activities</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to circumvent our pricing system or exploit technical vulnerabilities</li>
              <li>Use bots, scripts, or automated tools to interact with the Service</li>
              <li>Engage in market manipulation or fraudulent trading activities</li>
              <li>Impersonate others or provide false information</li>
              <li>Infringe upon intellectual property rights</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Disclaimers</h2>
            <p className="mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>The future value of any NFT</li>
              <li>Uninterrupted access to the Service</li>
              <li>The security of blockchain networks</li>
              <li>The accuracy of third-party data sources</li>
            </ul>
            <p>
              NFTs are speculative digital assets. You should not purchase NFTs expecting financial
              returns. Never invest more than you can afford to lose.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CosmoNFT shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of profits,
              data, or other intangible losses, resulting from your use of the Service.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Modifications</h2>
            <p>
              We reserve the right to modify these Terms at any time. Changes will be effective
              immediately upon posting to the website. Your continued use of the Service after
              changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@cosmonft.com" className="text-blue-400 hover:underline">
                legal@cosmonft.com
              </a>
            </p>
          </section>
        </div>

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
