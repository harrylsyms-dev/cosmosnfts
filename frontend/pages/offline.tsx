import SEO from '../components/SEO';
import Layout from '../components/Layout';

export default function OfflinePage() {
  return (
    <Layout>
      <SEO
        title="You're Offline"
        description="Please check your internet connection"
        noIndex={true}
      />

      <main
        id="main-content"
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📡</div>
          <h1 className="text-2xl font-semibold mb-4 text-white">You're Offline</h1>
          <p className="text-gray-400 mb-8 max-w-md">
            Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </main>
    </Layout>
  );
}
