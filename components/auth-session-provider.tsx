"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  isAuthenticated,
  checkSessionOnPageLoad,
  logout,
} from "@/api/auth-utils";

interface AuthContextType {
  isAuthenticated: boolean;
  checkAuth: () => boolean;
  forceLogout: () => void;
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/signup"];
  const isPublicRoute = publicRoutes.includes(pathname);

  const checkAuth = () => {
    if (!isHydrated) return false;
    const authStatus = isAuthenticated();
    setIsAuth(authStatus);
    return authStatus;
  };

  const forceLogout = () => {
    logout();
  };

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Initial auth check - only after hydration
    const authStatus = checkAuth();
    setIsLoading(false);

    // Handle root path redirect logic (middleware will handle server-side, but we need client-side too)
    if (pathname === "/") {
      if (!authStatus) {
        router.push("/login");
      } else {
        router.push("/dashboard/manager");
      }
      return;
    }

    // If not on a public route and not authenticated, redirect to login
    if (!isPublicRoute && !authStatus) {
      router.push("/login");
      return;
    }

    // If authenticated, start session monitoring
    if (authStatus) {
      checkSessionOnPageLoad();
    }

    // Set up periodic auth checks for dashboard routes
    let authCheckInterval: NodeJS.Timeout | null = null;

    if (pathname.startsWith("/dashboard")) {
      authCheckInterval = setInterval(() => {
        const currentAuthStatus = isAuthenticated();
        if (!currentAuthStatus) {
          // Session expired, will be handled by logout() in isAuthenticated()
          setIsAuth(false);
        }
      }, 10000); // Check every 10 seconds on dashboard pages
    }

    return () => {
      if (authCheckInterval) {
        clearInterval(authCheckInterval);
      }
    };
  }, [isHydrated, pathname, router, isPublicRoute]);

  // Show loading spinner while checking authentication (but not for public routes)
  if (!isHydrated || (isLoading && !isPublicRoute && pathname !== "/")) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: isAuth, checkAuth, forceLogout, isHydrated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
