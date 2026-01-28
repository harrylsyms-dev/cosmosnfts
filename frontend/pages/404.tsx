import Link from 'next/link';
import SEO from '../components/SEO';
import Layout from '../components/Layout';

export default function Custom404() {
  return (
    <Layout>
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        noIndex={true}
      />

      <main
        id="main-content"
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="text-center">
          <h1 className="text-6xl font-bold text-purple-500 mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4 text-white">Page Not Found</h2>
          <p className="text-gray-400 mb-8 max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-x-4">
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go Home
            </Link>
            <Link
              href="/browse"
              className="inline-block px-6 py-3 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-900/30 transition-colors"
            >
              Browse NFTs
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
