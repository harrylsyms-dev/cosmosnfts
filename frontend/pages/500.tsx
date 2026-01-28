import SEO from '../components/SEO';
import Layout from '../components/Layout';

export default function Custom500() {
  return (
    <Layout>
      <SEO
        title="Server Error"
        description="Something went wrong on our end. Please try again later."
        noIndex={true}
      />

      <main
        id="main-content"
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="text-center">
          <h1 className="text-6xl font-bold text-red-500 mb-4">500</h1>
          <h2 className="text-2xl font-semibold mb-4 text-white">Server Error</h2>
          <p className="text-gray-400 mb-8 max-w-md">
            Something went wrong on our end. We've been notified and are working
            on a fix.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    </Layout>
  );
}
