import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#1a1a2e" />

        {/* PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="CosmoNFTs" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CosmoNFTs" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#1a1a2e" />
      </Head>
      <body>
        <Main />
        <NextScript />

        {/* Noscript fallback for accessibility */}
        <noscript>
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>CosmoNFTs</h1>
            <p>Please enable JavaScript to use this application.</p>
            <p>Visit our <a href="/faq">FAQ</a> or contact support for assistance.</p>
          </div>
        </noscript>
      </body>
    </Html>
  );
}
