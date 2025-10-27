"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/api/auth-utils";

// Root redirector: if user is authenticated (token present) -> dashboard
// otherwise -> login. This replaces the previous marketing/home page.
export default function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const token = getAuthToken();
      if (token) {
        // If authenticated, send to the manager dashboard (staff also share this UI)
        router.replace("/dashboard/manager");
      } else {
        // If not authenticated, send to login
        router.replace("/login");
      }
    } catch (err) {
      // Fallback: redirect to login on error
      router.replace("/login");
    }
  }, [router]);

  return null;
}
