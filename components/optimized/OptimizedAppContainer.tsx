/**
 * Main App Container with Performance Optimizations
 * This component wraps the entire application with performance monitoring and optimizations
 */

"use client";

import React, { Suspense, useEffect } from "react";
import { performanceCache } from "@/utils/performance-cache";
import { performanceMonitor } from "@/utils/performance-monitor";
import { LoadingScreen } from "@/components/loading-screen";

interface OptimizedAppContainerProps {
  children: React.ReactNode;
}

export default function OptimizedAppContainer({
  children,
}: OptimizedAppContainerProps) {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.initialize();

    // Preload critical data for better UX
    const preloadCriticalData = async () => {
      try {
        // Start background caching of common data
        performanceCache.preloadCommonData();

        // Report app initialization
        performanceMonitor.measureCustomMetric(
          "app_initialization",
          performance.now()
        );
      } catch (error) {
        console.error("Failed to preload critical data:", error);
      }
    };

    preloadCriticalData();

    // Cleanup on unmount
    return () => {
      performanceCache.cleanup();
    };
  }, []);

  // Handle global error boundary for performance issues
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    performanceMonitor.reportError(error, {
      ...errorInfo,
      context: "OptimizedAppContainer",
    });
  };

  return (
    <div className='optimized-app-container'>
      {/* Global loading fallback */}
      <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
    </div>
  );
}

// Error Boundary Component for Performance Issues
class PerformanceErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log performance-related errors
    console.error(
      "Performance Error Boundary caught an error:",
      error,
      errorInfo
    );

    // Report to performance monitor
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='error-fallback p-8 text-center'>
          <h2 className='text-xl font-bold text-red-600 mb-4'>
            Có lỗi hiệu suất xảy ra
          </h2>
          <p className='text-gray-600 mb-4'>
            Vui lòng tải lại trang để tiếp tục.
          </p>
          <button
            className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component with error boundary
export function OptimizedAppContainerWithErrorBoundary({
  children,
}: OptimizedAppContainerProps) {
  return (
    <PerformanceErrorBoundary
      onError={(error, errorInfo) => {
        performanceMonitor.reportError(error, {
          ...errorInfo,
          context: "PerformanceErrorBoundary",
        });
      }}
    >
      <OptimizedAppContainer>{children}</OptimizedAppContainer>
    </PerformanceErrorBoundary>
  );
}
