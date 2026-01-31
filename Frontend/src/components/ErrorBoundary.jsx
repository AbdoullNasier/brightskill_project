import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
                        <p className="text-gray-700 mb-4">The application encountered an error:</p>
                        <div className="bg-gray-100 p-4 rounded overflow-auto mb-4 border border-gray-300">
                            <code className="text-sm font-mono text-red-800">
                                {this.state.error && this.state.error.toString()}
                            </code>
                        </div>
                        <details className="whitespace-pre-wrap text-xs text-gray-500">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </details>
                        <button
                            onClick={() => window.location.href = '/'}
                            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Return Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
