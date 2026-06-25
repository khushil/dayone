import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Inline styles so the fallback renders even if the stylesheet failed to load.
const wrap: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '24px',
  fontFamily: 'system-ui, sans-serif',
  color: '#e6edf3',
  background: '#0d1117',
  textAlign: 'center',
};

/** Renders a visible fallback (never a blank screen) when the UI throws. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('SectorScope UI error:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: '20px', margin: 0 }}>
          SectorScope hit an error
        </h1>
        <pre
          style={{
            maxWidth: '640px',
            whiteSpace: 'pre-wrap',
            color: '#e0604a',
            fontSize: '13px',
          }}
        >
          {error.message}
        </pre>
        <p style={{ color: '#8a93a0', fontSize: '13px' }}>
          Press F12 to open DevTools for the full stack trace.
        </p>
      </div>
    );
  }
}
