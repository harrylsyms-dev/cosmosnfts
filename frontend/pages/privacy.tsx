import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';

export default function Privacy() {
  return (
    <Layout>
      <Head>
        <title>Privacy Policy - CosmoNFT</title>
        <meta name="description" content="Privacy Policy for CosmoNFT - Learn how we collect, use, and protect your personal information." />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: January 2025</p>

        <div className="space-y-8 text-gray-300">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="mb-4">
              CosmoNFT ("we", "our", or "us") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our website and services.
            </p>
            <p>
              By using CosmoNFT, you consent to the data practices described in this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium text-white mb-3">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Wallet addresses when you connect your cryptocurrency wallet</li>
              <li>Email address if you subscribe to updates or contact support</li>
              <li>Payment information processed through Stripe (we do not store card details)</li>
              <li>Communications you send to us</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-3">2.2 Information Collected Automatically</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Device information (browser type, operating system)</li>
              <li>IP address and approximate location</li>
              <li>Usage data (pages visited, time spent, clicks)</li>
              <li>Transaction history on the platform</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Process transactions and mint NFTs to your wallet</li>
              <li>Provide customer support and respond to inquiries</li>
              <li>Send important updates about your purchases and account</li>
              <li>Improve our platform and user experience</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
              <li>Analyze usage patterns to enhance our services</li>
            </ul>
          </section>

          {/* Blockchain Data */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Blockchain Data</h2>
            <p className="mb-4">
              NFT transactions occur on the Polygon blockchain. Please be aware that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Blockchain transactions are public and permanent</li>
              <li>Your wallet address and transaction history are visible on the blockchain</li>
              <li>We cannot delete or modify blockchain records</li>
              <li>Anyone can view NFT ownership and transfer history</li>
            </ul>
          </section>

          {/* Sharing of Information */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Sharing of Information</h2>
            <p className="mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong className="text-white">Payment Processors:</strong> Stripe processes payments
                and receives necessary transaction information
              </li>
              <li>
                <strong className="text-white">Service Providers:</strong> Third parties that help us
                operate our platform (hosting, analytics, email)
              </li>
              <li>
                <strong className="text-white">Legal Requirements:</strong> When required by law or to
                protect our rights
              </li>
              <li>
                <strong className="text-white">Business Transfers:</strong> In connection with a merger,
                acquisition, or sale of assets
              </li>
            </ul>
            <p className="mt-4">
              We do not sell your personal information to third parties for marketing purposes.
            </p>
          </section>

          {/* Cookies and Tracking */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies and Tracking</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Remember your preferences and wallet connection</li>
              <li>Maintain your shopping cart</li>
              <li>Analyze site traffic and usage</li>
              <li>Improve site functionality</li>
            </ul>
            <p>
              You can control cookies through your browser settings. Disabling cookies may affect
              some features of the platform.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your
              information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>SSL/TLS encryption for data in transit</li>
              <li>Secure servers and databases</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the Internet is 100% secure. We cannot
              guarantee absolute security of your data.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our services and
              fulfill the purposes described in this policy. Transaction records are kept for
              accounting and legal compliance purposes. Blockchain data is permanent and cannot
              be deleted.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Your Rights</h2>
            <p className="mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access the personal information we hold about you</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information (subject to legal requirements)</li>
              <li>Object to certain processing of your data</li>
              <li>Request data portability</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, please contact us at{' '}
              <a href="mailto:privacy@cosmonft.com" className="text-blue-400 hover:underline">
                privacy@cosmonft.com
              </a>
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p>
              CosmoNFT is not intended for users under 18 years of age. We do not knowingly collect
              information from children. If we learn we have collected information from a child,
              we will take steps to delete it.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. International Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your
              own. We ensure appropriate safeguards are in place to protect your information in
              accordance with this Privacy Policy.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the "Last updated" date.
              Your continued use of the Service after changes constitutes acceptance of the updated
              policy.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
            <p className="mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us:
            </p>
            <div className="bg-gray-900 rounded-lg p-6">
              <p className="mb-2">
                <strong className="text-white">Email:</strong>{' '}
                <a href="mailto:privacy@cosmonft.com" className="text-blue-400 hover:underline">
                  privacy@cosmonft.com
                </a>
              </p>
              <p>
                <strong className="text-white">Data Protection Inquiries:</strong>{' '}
                <a href="mailto:dpo@cosmonft.com" className="text-blue-400 hover:underline">
                  dpo@cosmonft.com
                </a>
              </p>
            </div>
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
