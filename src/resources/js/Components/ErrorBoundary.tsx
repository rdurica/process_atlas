import { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-6 py-4">
                        <h2 className="text-lg font-semibold text-destructive">
                            Something went wrong
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            The workflow editor encountered an unexpected error. Please refresh the
                            page and try again.
                        </p>
                        {this.state.error && (
                            <pre className="mt-4 max-w-lg overflow-auto rounded bg-muted p-3 text-left text-xs text-muted-foreground">
                                {this.state.error.message}
                            </pre>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        Refresh Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
