import { Component } from 'react'

// ── Error Boundary ─────────────────────────────────────────────────────────
// Catches any unhandled JS errors in the component tree and renders a
// graceful fallback instead of an empty / crashed screen.

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // In production you'd send to Sentry / Datadog here
    console.error('[NEXUS] Uncaught error:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
        padding: '40px 24px',
        background: '#fafafa',
        textAlign: 'center',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: '#fef2f2', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>
          ⚠️
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: 28, fontWeight: 600, color: '#0a0a0a', marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 15, color: '#555', maxWidth: 420, lineHeight: 1.6 }}>
            An unexpected error occurred. This has been logged and we'll look into it.
            You can try refreshing the page or returning home.
          </p>
        </div>
        {import.meta.env.DEV && this.state.error && (
          <pre style={{
            background: '#1e1e1e', color: '#f87171', padding: '16px 20px',
            borderRadius: 8, fontSize: 12, maxWidth: '100%', overflowX: 'auto',
            textAlign: 'left', maxHeight: 200, overflow: 'auto',
          }}>
            {this.state.error.message}
          </pre>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '10px 24px', borderRadius: 999, border: '1.5px solid #0a0a0a',
              background: 'transparent', fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: '10px 24px', borderRadius: 999, background: '#0a0a0a',
              color: '#fff', fontSize: 14, fontWeight: 500, textDecoration: 'none',
            }}
          >
            Go home
          </a>
        </div>
      </div>
    )
  }
}
