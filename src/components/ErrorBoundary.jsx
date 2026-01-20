import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to console for debugging
        console.error('Error Boundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });

        // Clear any cached state that might cause the error
        try {
            sessionStorage.clear();
        } catch (e) {
            console.warn('Failed to clear sessionStorage:', e);
        }

        // Reload the page
        window.location.href = '/gateway';
    };

    handleRefresh = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="bg-red-500/10 p-6 text-center border-b border-red-500/20">
                            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-red-400" />
                            </div>
                            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
                            <p className="text-slate-400 text-sm">
                                The application encountered an unexpected error.
                            </p>
                        </div>

                        {/* Error Details (Development Only) */}
                        {import.meta.env.DEV && this.state.error && (
                            <div className="p-4 bg-black/20">
                                <p className="text-red-400 text-xs font-mono mb-2">
                                    {this.state.error.toString()}
                                </p>
                                <pre className="text-slate-500 text-xs font-mono overflow-auto max-h-32 p-2 bg-black/30 rounded">
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="p-6 space-y-3">
                            <button
                                onClick={this.handleRefresh}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
                            >
                                <RefreshCw size={18} />
                                Refresh Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all"
                            >
                                <Home size={18} />
                                Return to Gateway
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="px-6 pb-6 text-center">
                            <p className="text-slate-500 text-xs">
                                If this problem persists, try clearing your browser cache or contact support.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
