export default function TestPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#030712',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          CosmoNFT Test Page
        </h1>
        <p style={{ color: '#9ca3af' }}>
          If you can see this, the basic site is working.
        </p>
        <p style={{ color: '#6b7280', marginTop: '1rem', fontSize: '0.875rem' }}>
          Build time: {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
}
