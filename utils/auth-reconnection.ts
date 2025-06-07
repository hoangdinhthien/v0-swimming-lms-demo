"use client";

import { getAuthToken } from "@/api/auth-utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Hook to handle authentication status
 * Will monitor the auth token and redirect to login if it becomes invalid
 */
export const useAuthStatus = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      setIsAuthenticated(!!token);
      setIsCheckingAuth(false);

      // If no token is found, schedule a redirect
      if (!token) {
        setTimeout(() => {
          router.push(
            "/login?redirect=" + encodeURIComponent(window.location.pathname)
          );
        }, 2000); // Delay to allow the user to see what happened
      }
    };

    // Check auth on mount
    checkAuth();

    // Set up periodic checking
    const interval = setInterval(checkAuth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [router]);

  return { isAuthenticated, isCheckingAuth };
};
