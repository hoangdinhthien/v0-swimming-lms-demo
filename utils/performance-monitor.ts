/**
 * Performance Monitor - Tracks and optimizes app performance
 */

"use client";

import React, { useEffect } from "react";
import { performanceCache } from "@/utils/performance-cache";

interface PerformanceMetrics {
  pageLoadTime: number;
  apiCallsCount: number;
  cacheHitRate: number;
  renderTime: number;
  bundleSize?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiCallsCount: 0,
    cacheHitRate: 0,
    renderTime: 0,
  };

  private startTime = Date.now();
  private apiCalls = 0;
  private cacheHits = 0;
  private isInitialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeMetrics();
    }
  }

  initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    // Performance Monitor initialized

    // Initialize Web Vitals tracking
    if (typeof window !== "undefined") {
      this.setupWebVitals();
    }
  }

  private setupWebVitals() {
    // Track performance navigation timing
    if ("performance" in window && "getEntriesByType" in performance) {
      const navigationEntries = performance.getEntriesByType(
        "navigation"
      ) as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const navigation = navigationEntries[0];
        this.metrics.pageLoadTime =
          navigation.loadEventEnd - navigation.loadEventStart;
      }
    }
  }

  measureCustomMetric(name: string, value: number) {
    // Store custom metrics for later analysis
    if (name === "page_load_time") {
      this.metrics.pageLoadTime = value;
    } else if (name === "render_time") {
      this.metrics.renderTime = value;
    }
  }

  reportError(error: Error, context?: any) {
    console.error(
      "Performance Monitor - Error reported:",
      error.message,
      context
    );
    // Track errors for performance analysis
  }

  private initializeMetrics() {
    // Track page load time
    window.addEventListener("load", () => {
      this.metrics.pageLoadTime = Date.now() - this.startTime;
      this.logMetrics();
    });

    // Track Core Web Vitals
    if ("web-vital" in window) {
      // @ts-ignore
      import("web-vitals").then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS(this.logWebVital);
        onFID(this.logWebVital);
        onFCP(this.logWebVital);
        onLCP(this.logWebVital);
        onTTFB(this.logWebVital);
      });
    }
  }

  private logWebVital = (metric: any) => {
    // Web Vital - ${metric.name}: ${metric.value}
  };

  trackAPICall() {
    this.apiCalls++;
    this.metrics.apiCallsCount = this.apiCalls;
  }

  trackCacheHit() {
    this.cacheHits++;
    this.updateCacheHitRate();
  }

  trackRenderTime(componentName: string, startTime: number) {
    const renderTime = Date.now() - startTime;
    // Render time for ${componentName}: ${renderTime}ms
    this.metrics.renderTime = renderTime;
  }

  private updateCacheHitRate() {
    if (this.apiCalls > 0) {
      this.metrics.cacheHitRate = (this.cacheHits / this.apiCalls) * 100;
    }
  }

  logMetrics() {
    // Performance metrics collected and sent to analytics
    this.sendToAnalytics();
  }

  private sendToAnalytics() {
    // Integration with analytics service
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "performance_metrics", {
        page_load_time: this.metrics.pageLoadTime,
        api_calls_count: this.metrics.apiCallsCount,
        cache_hit_rate: this.metrics.cacheHitRate,
      });
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Monitor memory usage
  getMemoryUsage() {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      };
    }
    return null;
  }

  // Check for performance issues
  checkPerformanceIssues(): string[] {
    const issues: string[] = [];
    const memory = this.getMemoryUsage();

    if (this.metrics.pageLoadTime > 3000) {
      issues.push("Page load time is too slow (>3s)");
    }

    if (this.metrics.cacheHitRate < 50) {
      issues.push("Low cache hit rate (<50%)");
    }

    if (memory && memory.used > 100) {
      issues.push("High memory usage (>100MB)");
    }

    if (this.metrics.apiCallsCount > 20) {
      issues.push("Too many API calls on single page (>20)");
    }

    return issues;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook for components to track render performance
export function usePerformanceTracking(componentName: string) {
  useEffect(() => {
    const startTime = Date.now();

    return () => {
      performanceMonitor.trackRenderTime(componentName, startTime);
    };
  }, [componentName]);
}

// HOC for performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    usePerformanceTracking(componentName);
    return React.createElement(Component, props);
  };
}

// Performance debugging component
export function PerformanceDebugger() {
  useEffect(() => {
    const interval = setInterval(() => {
      const metrics = performanceMonitor.getMetrics();
      // Performance checks running in background
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return null;
}
