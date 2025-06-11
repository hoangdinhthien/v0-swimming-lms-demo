"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LoadingScreen } from "./loading-screen";

export function NavigationLoading({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // When path or search params change, mark as navigating
    setIsNavigating(true);

    // Reset navigating after everything has loaded
    const timeout = setTimeout(() => {
      setIsNavigating(false);
    }, 300); // Small delay to prevent flickering for fast loads

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  // Effect to handle the loading state with a small delay to prevent flicker
  useEffect(() => {
    if (isNavigating) {
      // Small delay before showing the loading indicator
      const delay = setTimeout(() => {
        setLoading(true);
      }, 150);

      return () => clearTimeout(delay);
    } else {
      setLoading(false);
    }
  }, [isNavigating]);

  // Only show loading screen if we've been loading for more than a moment
  return (
    <>
      {loading && <LoadingScreen message='Đang tải...' />}
      {children}
    </>
  );
}
