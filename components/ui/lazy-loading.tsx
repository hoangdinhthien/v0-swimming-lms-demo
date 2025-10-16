/**
 * Lazy Loading Wrapper and Skeleton Components for Performance
 */

import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Skeleton components for better UX
export const TableSkeleton = () => (
  <div className='space-y-3'>
    {[...Array(5)].map((_, i) => (
      <div
        key={i}
        className='flex items-center space-x-4 p-4 border rounded'
      >
        <div className='w-10 h-10 bg-gray-200 rounded-full animate-pulse' />
        <div className='flex-1 space-y-2'>
          <div className='h-4 bg-gray-200 rounded animate-pulse w-1/4' />
          <div className='h-3 bg-gray-200 rounded animate-pulse w-1/2' />
        </div>
        <div className='w-20 h-6 bg-gray-200 rounded animate-pulse' />
      </div>
    ))}
  </div>
);

export const CardSkeleton = () => (
  <div className='border rounded-lg p-6 animate-pulse'>
    <div className='flex items-center space-x-4'>
      <div className='w-12 h-12 bg-gray-200 rounded-full' />
      <div className='flex-1 space-y-2'>
        <div className='h-4 bg-gray-200 rounded w-3/4' />
        <div className='h-3 bg-gray-200 rounded w-1/2' />
      </div>
    </div>
    <div className='mt-4 space-y-2'>
      <div className='h-3 bg-gray-200 rounded' />
      <div className='h-3 bg-gray-200 rounded w-5/6' />
    </div>
  </div>
);

export const StatCardSkeleton = () => (
  <div className='border rounded-lg p-6 animate-pulse'>
    <div className='flex items-center justify-between mb-2'>
      <div className='w-6 h-6 bg-gray-200 rounded' />
      <div className='w-8 h-4 bg-gray-200 rounded' />
    </div>
    <div className='h-8 bg-gray-200 rounded w-16 mb-1' />
    <div className='h-3 bg-gray-200 rounded w-20' />
  </div>
);

export const FormSkeleton = () => (
  <div className='space-y-6'>
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className='space-y-2'
      >
        <div className='h-4 bg-gray-200 rounded w-24 animate-pulse' />
        <div className='h-10 bg-gray-200 rounded animate-pulse' />
      </div>
    ))}
    <div className='flex gap-4'>
      <div className='h-10 bg-gray-200 rounded w-20 animate-pulse' />
      <div className='h-10 bg-gray-200 rounded w-32 animate-pulse' />
    </div>
  </div>
);

// Loading component
export const LoadingSpinner = ({ text = "Đang tải..." }: { text?: string }) => (
  <div className='flex flex-col items-center justify-center py-12'>
    <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
    <p className='text-muted-foreground'>{text}</p>
  </div>
);

// Lazy loading wrapper
export const LazyWrapper = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => <Suspense fallback={fallback || <LoadingSpinner />}>{children}</Suspense>;

// Lazy load heavy components
export const LazyInstructorsPage = lazy(() =>
  import("@/app/dashboard/manager/instructors/page").then((module) => ({
    default: module.default,
  }))
);

export const LazyStudentsPage = lazy(() =>
  import("@/app/dashboard/manager/students/page").then((module) => ({
    default: module.default,
  }))
);

export const LazyCoursesPage = lazy(() =>
  import("@/app/dashboard/manager/courses/page").then((module) => ({
    default: module.default,
  }))
);

export const LazyCreateClassPage = lazy(() =>
  import("@/components/optimized/OptimizedCreateClassPage").then((module) => ({
    default: module.default,
  }))
);

export const LazyCalendarPage = lazy(() =>
  import("@/app/dashboard/manager/calendar/page").then((module) => ({
    default: module.default,
  }))
);
