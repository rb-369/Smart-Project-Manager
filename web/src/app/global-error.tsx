'use client';

/**
 * Last-resort boundary. Replaces the whole document, so it cannot rely on
 * the app layout or any shared component.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0038FF',
          color: '#FFFFFF',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            DevCommand hit an error
          </h1>
          <p style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
            The application failed to load entirely. Your data is safe on the server — reload
            to try again.
          </p>
          {error.digest && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              borderRadius: '9999px',
              border: '1px solid rgba(0,0,0,0.1)',
              backgroundColor: '#C6FF20',
              color: '#000000',
              padding: '0.7rem 1.5rem',
              fontWeight: 800,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Reload DevCommand
          </button>
        </div>
      </body>
    </html>
  );
}
