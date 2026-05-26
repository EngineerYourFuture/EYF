import { Component, type ReactNode, type ErrorInfo } from 'react';
import { EYFMark } from './EYFLogo';

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

function ErrorFallback({ error, onReset }: { readonly error?: Error; readonly onReset: () => void }) {
  return (
    <div
      style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', color: 'var(--t1)',
        padding: '32px 24px', textAlign: 'center',
      }}
    >
      {/* Top accent */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #E82127 30%, #E82127 70%, transparent)' }} />

      {/* Logo */}
      <div style={{ marginBottom: 32, filter: 'drop-shadow(0 0 12px rgba(232,25,44,0.4))' }}>
        <EYFMark size={32} />
      </div>

      {/* Error code */}
      <div style={{
        fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 'clamp(4rem, 12vw, 8rem)',
        letterSpacing: '-0.05em', lineHeight: 1, color: '#E82127',
        textShadow: '0 0 40px rgba(232,25,44,0.3)', marginBottom: 16,
      }}>
        500
      </div>

      <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', letterSpacing: '-0.02em', marginBottom: 12 }}>
        Something went wrong
      </h1>
      <p style={{ fontSize: 14, color: 'var(--t3)', maxWidth: 420, lineHeight: 1.7, marginBottom: 32 }}>
        An unexpected error occurred. Your progress is safe — try refreshing the page or return home.
      </p>

      {/* Error details (dev) */}
      {error && import.meta.env.DEV && (
        <pre style={{
          maxWidth: 520, overflow: 'auto', textAlign: 'left',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          padding: '12px 16px', fontSize: 11, color: '#FDA4AF',
          fontFamily: 'JetBrains Mono, monospace', marginBottom: 32,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {error.message}
        </pre>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '10px 24px', background: '#E82127', color: '#000',
            fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(232,25,44,0.35)',
          }}
        >
          Try again
        </button>
        <a
          href="/app/dashboard"
          style={{
            padding: '10px 24px', background: 'transparent', color: 'var(--t2)',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            border: '1px solid var(--border)', cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          Go home
        </a>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[EYF] Unhandled render error:', error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }
    return this.props.children;
  }
}
