/**
 * Optimized Dashboard Layout with Lazy Loading and Performance Improvements
 */

"use client";

import React, { Suspense, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  LazyWrapper,
  TableSkeleton,
  CardSkeleton,
  StatCardSkeleton,
  FormSkeleton,
} from "@/components/ui/lazy-loading";
import {
  performanceMonitor,
  usePerformanceTracking,
} from "@/utils/performance-monitor";
import { PerformanceDebugger } from "@/utils/performance-monitor";

// Lazy load heavy dashboard components
const LazyInstructorsPage = React.lazy(
  () => import("@/app/dashboard/manager/instructors/page")
);
const LazyStudentsPage = React.lazy(
  () => import("@/app/dashboard/manager/students/page")
);
const LazyCoursesPage = React.lazy(
  () => import("@/app/dashboard/manager/courses/page")
);
const LazyClassesPage = React.lazy(
  () => import("@/app/dashboard/manager/classes/page")
);
const LazyCalendarPage = React.lazy(
  () => import("@/app/dashboard/manager/calendar/page")
);
const LazyCreateClassPage = React.lazy(
  () => import("@/components/optimized/OptimizedCreateClassPage")
);

interface OptimizedDashboardLayoutProps {
  children?: React.ReactNode;
}

export default function OptimizedDashboardLayout({
  children,
}: OptimizedDashboardLayoutProps) {
  const pathname = usePathname();

  // Track performance for this layout
  usePerformanceTracking("OptimizedDashboardLayout");

  // Determine appropriate skeleton based on route
  const getSkeleton = useMemo(() => {
    if (pathname?.includes("/instructors") || pathname?.includes("/students")) {
      return <TableSkeleton />;
    }
    if (pathname?.includes("/courses") || pathname?.includes("/classes")) {
      return <CardSkeleton />;
    }
    if (pathname?.includes("/create")) {
      return <FormSkeleton />;
    }
    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }, [pathname]);

  // Render appropriate component based on route
  const renderRouteComponent = () => {
    if (!pathname) return children;

    // Performance: Only load components when needed
    if (pathname.includes("/instructors") && !pathname.includes("/create")) {
      return (
        <LazyWrapper fallback={<TableSkeleton />}>
          <LazyInstructorsPage />
        </LazyWrapper>
      );
    }

    if (pathname.includes("/students") && !pathname.includes("/create")) {
      return (
        <LazyWrapper fallback={<TableSkeleton />}>
          <LazyStudentsPage />
        </LazyWrapper>
      );
    }

    if (pathname.includes("/courses") && !pathname.includes("/create")) {
      return (
        <LazyWrapper fallback={<CardSkeleton />}>
          <LazyCoursesPage />
        </LazyWrapper>
      );
    }

    if (pathname.includes("/classes/create")) {
      return (
        <LazyWrapper fallback={<FormSkeleton />}>
          <LazyCreateClassPage />
        </LazyWrapper>
      );
    }

    if (pathname.includes("/classes") && !pathname.includes("/create")) {
      return (
        <LazyWrapper fallback={<TableSkeleton />}>
          <LazyClassesPage />
        </LazyWrapper>
      );
    }

    if (pathname.includes("/calendar")) {
      return (
        <LazyWrapper
          fallback={<div className='h-96 bg-gray-100 rounded animate-pulse' />}
        >
          <LazyCalendarPage />
        </LazyWrapper>
      );
    }

    // Default fallback to children
    return children;
  };

  return (
    <>
      {/* Performance debugging in development */}
      {process.env.NODE_ENV === "development" && <PerformanceDebugger />}

      <div className='optimized-dashboard-layout'>
        <Suspense fallback={getSkeleton}>{renderRouteComponent()}</Suspense>
      </div>
    </>
  );
}

// Memoized component to prevent unnecessary re-renders
export const MemoizedOptimizedDashboardLayout = React.memo(
  OptimizedDashboardLayout
);
