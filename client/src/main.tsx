import { StrictMode, Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1a',
          color: '#5a82b4',
          fontFamily: 'Orbitron, sans-serif',
          textAlign: 'center',
          padding: '2rem',
        }}>
          <h1 style={{ color: '#ff3366', fontSize: '1.5rem', marginBottom: '1rem' }}>
            SYSTEM MALFUNCTION
          </h1>
          <p style={{ marginBottom: '2rem', maxWidth: '400px' }}>
            An unexpected error occurred. Please reload the page to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 2rem',
              background: 'transparent',
              border: '1px solid #00d4ff',
              color: '#00d4ff',
              fontFamily: 'Orbitron, sans-serif',
              cursor: 'pointer',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              letterSpacing: '0.1em',
            }}
          >
            RELOAD
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
