// PRODUCTION-SAFE: Error Boundary to catch React rendering errors
// This prevents the entire app from crashing on production errors
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging (production-safe logging)
    console.error('[ErrorBoundary] Caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Optional: Send error to analytics/logging service
    // This should be non-blocking
    try {
      if (typeof window !== 'undefined' && window.fetch) {
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'react_error',
            eventData: {
              message: error.message,
              componentStack: errorInfo.componentStack?.substring(0, 500), // Limit size
            },
          }),
        }).catch(() => {
          // Silently fail - analytics should not block error handling
        });
      }
    } catch (analyticsError) {
      // Analytics logging failed - ignore
      console.warn('[ErrorBoundary] Could not log error to analytics:', analyticsError);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#fff',
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            padding: '24px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px',
            border: '1px solid #333',
          }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#ef4444',
            }}>
              Something went wrong
            </h1>
            <p style={{
              marginBottom: '16px',
              color: '#a3a3a3',
              lineHeight: '1.5',
            }}>
              We're sorry, but something unexpected happened. This error has been logged.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: '#000',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  marginBottom: '8px',
                  color: '#a3a3a3',
                }}>
                  Error Details (Development Only)
                </summary>
                <div style={{ color: '#ef4444' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: '#a3a3a3',
                    }}>
                      {this.state.error.stack}
                    </pre>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div style={{ marginTop: '8px' }}>
                      <strong>Component Stack:</strong>
                      <pre style={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        color: '#a3a3a3',
                        marginTop: '4px',
                      }}>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#3b82f6';
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#1f1f1f',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#2a2a2a';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f1f1f';
                }}
              >
                Reload Page
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




