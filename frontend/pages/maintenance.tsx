import Head from 'next/head';

export default function Maintenance() {
  return (
    <>
      <Head>
        <title>CosmoNFT - Under Maintenance</title>
        <meta name="description" content="CosmoNFT is currently under maintenance. We'll be back shortly." />
      </Head>

      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-gray-950 to-gray-950" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              CosmoNFT
            </h1>
          </div>

          {/* Maintenance icon */}
          <div className="text-8xl mb-8">
            <span role="img" aria-label="tools">🔧</span>
          </div>

          {/* Main message */}
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Under Maintenance
          </h2>
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            We're performing scheduled maintenance to improve your experience.
            <br />
            We'll be back shortly. Thank you for your patience!
          </p>

          {/* Status box */}
          <div className="bg-orange-900/30 border border-orange-600 rounded-lg p-6 max-w-md mx-auto">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-orange-400 font-medium">Maintenance in Progress</span>
            </div>
            <p className="text-gray-400 text-sm">
              Our team is working hard to bring you an even better cosmic experience.
            </p>
          </div>

          {/* Contact info */}
          <div className="mt-8 text-gray-500 text-sm">
            <p>Need urgent assistance?</p>
            <a href="mailto:support@cosmonft.io" className="text-orange-400 hover:text-orange-300">
              support@cosmonft.io
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} CosmoNFT. All rights reserved.
        </div>
      </div>
    </>
  );
}
