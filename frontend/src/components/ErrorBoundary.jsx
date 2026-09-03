import React from 'react';
import Icon from './Icons';

/**
 * Top-Level Application & Component-Level Error Boundary
 * Catches any uncaught React rendering exceptions, logs diagnostics,
 * and displays a sleek DisasterChain recovery screen rather than letting the app crash to a blank page.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[DisasterChain Recovery Engine] Uncaught UI Component Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      return (
        <div
          style={{
            minHeight: this.props.inline ? '240px' : '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'radial-gradient(circle at center, #1c110d 0%, #0c0705 100%)',
            color: '#ffffff',
            fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
          }}
        >
          <div
            className="spatial-panel"
            style={{
              maxWidth: '520px',
              width: '100%',
              background: 'rgba(24, 15, 11, 0.95)',
              border: '1px solid var(--border-medium, rgba(255, 107, 44, 0.25))',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '2rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(255, 107, 44, 0.15)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(229, 57, 53, 0.15)',
                border: '1px solid rgba(229, 57, 53, 0.4)',
                color: '#E53935',
                marginBottom: '1.25rem',
              }}
            >
              <Icon name="alert-triangle" size={28} color="#E53935" />
            </div>

            <h2
              style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#ffffff',
                marginBottom: '0.5rem',
              }}
            >
              Interface Recovery Mode
            </h2>

            <p
              style={{
                color: 'var(--text-secondary, #a89f91)',
                fontSize: '0.88rem',
                lineHeight: 1.5,
                marginBottom: '1.5rem',
              }}
            >
              A localized component encountered an unexpected rendering condition. DisasterChain emergency telemetry and network operations remain secure.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn btn-primary"
                style={{
                  background: 'var(--orange-primary, #FF6B2C)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                ↻ RETRY INTERFACE
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.href = '/';
                }}
                className="btn btn-secondary"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-primary, #ffffff)',
                  border: '1px solid var(--border-medium, rgba(255, 107, 44, 0.3))',
                  padding: '0.65rem 1.25rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                RETURN HOME
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
