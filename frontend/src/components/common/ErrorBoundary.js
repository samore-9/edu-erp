// src/components/common/ErrorBoundary.js
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '60vh', padding: '40px 20px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>⚠️</div>
          <h4 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 8 }}>Something went wrong</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 400, marginBottom: 24 }}>
            An unexpected error occurred. Please refresh the page or contact support if the problem persists.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ textAlign: 'left', background: '#f8fafc', borderRadius: 10, padding: 16, fontSize: '0.78rem', fontFamily: 'IBM Plex Mono, monospace', maxWidth: 600, marginBottom: 24, border: '1px solid var(--border)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>Error Details (dev only)</summary>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--danger)' }}>{this.state.error?.toString()}</pre>
            </details>
          )}
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              background: 'var(--primary-light)', border: 'none', color: 'white',
              padding: '10px 24px', borderRadius: 8, fontFamily: 'Sora, sans-serif',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
