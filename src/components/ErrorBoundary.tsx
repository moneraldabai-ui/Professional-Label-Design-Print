import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    console.error('Label Studio Pro crashed:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleClearAndReload = () => {
    // Remove all label-studio keys from localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('label-studio')) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f9fafb',
            fontFamily: "'Inter', system-ui, sans-serif",
            padding: '2rem',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              padding: '2.5rem',
              textAlign: 'center',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '24px',
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                margin: '0 0 0.5rem',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '0.875rem',
                color: '#6b7280',
                margin: '0 0 1.5rem',
                lineHeight: 1.5,
              }}
            >
              Label Studio Pro encountered an unexpected error.
              You can try reloading the app, or clear saved data if the problem persists.
            </p>

            {/* Error details */}
            {error && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  textAlign: 'left',
                }}
              >
                <p
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#991b1b',
                    margin: '0 0 0.25rem',
                  }}
                >
                  Error Details
                </p>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#b91c1c',
                    margin: 0,
                    fontFamily: 'monospace',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.message}
                </p>
                {errorInfo?.componentStack && (
                  <details style={{ marginTop: '0.5rem' }}>
                    <summary
                      style={{
                        fontSize: '0.7rem',
                        color: '#991b1b',
                        cursor: 'pointer',
                      }}
                    >
                      Component stack
                    </summary>
                    <pre
                      style={{
                        fontSize: '0.65rem',
                        color: '#b91c1c',
                        margin: '0.25rem 0 0',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '120px',
                        overflow: 'auto',
                      }}
                    >
                      {errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#ffffff',
                  backgroundColor: '#2563eb',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Reload App
              </button>

              <button
                onClick={this.handleClearAndReload}
                style={{
                  flex: 1,
                  padding: '0.625rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#dc2626',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Clear Data & Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
