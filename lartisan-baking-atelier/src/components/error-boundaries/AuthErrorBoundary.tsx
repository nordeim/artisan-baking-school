"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AuthErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleReturnToLogin = () => {
    window.location.href = "/login";
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-void flex items-center justify-center px-4"
        >
          <div className="w-full max-w-md">
            {/* Header with aurora glow */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-8"
            >
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 rounded-full bg-aurora-magenta/20 blur-xl" />
                <div className="relative w-full h-full rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-aurora-magenta" />
                </div>
              </div>
              <h1 className="text-3xl font-serif text-slate-100 mb-2">
                Authentication Error
              </h1>
              <p className="text-slate-400">
                Something went wrong during authentication
              </p>
            </motion.div>

            {/* Error card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6"
            >
              <p className="text-slate-300 mb-4">
                We encountered an issue while processing your authentication
                request. This could be due to:
              </p>
              <ul className="text-slate-400 text-sm space-y-2 mb-6 list-disc list-inside">
                <li>Session expiration</li>
                <li>Network connectivity issues</li>
                <li>Temporary system maintenance</li>
              </ul>

              {/* Development error details */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mt-4 p-3 bg-red-950/30 border border-red-900/50 rounded-lg">
                  <p className="text-red-400 font-mono text-xs mb-1">Error:</p>
                  <p className="text-red-300 font-mono text-xs">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Button
                variant="default"
                className="w-full gap-2"
                onClick={this.handleReturnToLogin}
              >
                <LogIn className="w-4 h-4" />
                Return to Login
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={this.handleGoBack}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            </motion.div>

            {/* Support link */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mt-6 text-sm text-slate-500"
            >
              Still having issues?{" "}
              <a
                href="mailto:support@lartisan.sg"
                className="text-champagne hover:underline"
              >
                Contact support
              </a>
            </motion.p>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
