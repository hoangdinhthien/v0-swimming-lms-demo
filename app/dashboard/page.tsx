"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { getUserFrontendRole } from "@/api/role-utils";
import { LoadingScreen } from "@/components/loading-screen";

export default function DashboardRedirect() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      const userRole = getUserFrontendRole();

      // Redirect based on user role
      if (userRole === "staff") {
        router.replace("/dashboard/staff");
      } else if (userRole === "manager" || userRole === "admin") {
        router.replace("/dashboard/manager");
      } else {
        // Default fallback
        router.replace("/dashboard/manager");
      }
    }
  }, [loading, router]);

  return <LoadingScreen />;
}
