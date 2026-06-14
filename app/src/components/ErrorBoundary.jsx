import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', marginTop: '20vh' }}>
          <h2 style={{ color: 'var(--error)' }}>Une erreur inattendue est survenue</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            L'application a rencontré un problème. Veuillez rafraîchir la page.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => window.location.reload()}
          >
            Rafraîchir
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
