"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isAuthenticated } from "@/api/auth-utils";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboardPath = pathname.startsWith("/dashboard");

  useEffect(() => {
    // Check authentication on initial mount and when path changes
    if (isDashboardPath) {
      // Verify token is valid for protected routes
      const authValid = isAuthenticated();

      // Token checking is handled by isAuthenticated(), which
      // will automatically redirect if token is invalid
      console.log(
        "Auth check complete:",
        authValid ? "Valid session" : "Invalid session"
      );
    }

    // Create an interval to periodically check token validity (every 30 minutes)
    const tokenCheckInterval = setInterval(() => {
      if (isDashboardPath) {
        isAuthenticated();
      }
    }, 30 * 60 * 1000); // ✅ Increased to 30 minutes to reduce API calls

    return () => clearInterval(tokenCheckInterval);
  }, [pathname, isDashboardPath]);

  return <>{children}</>;
}
