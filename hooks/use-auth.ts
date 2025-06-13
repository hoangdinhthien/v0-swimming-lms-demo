"use client";

import { useState, useEffect } from "react";
import { getAuthenticatedUser, getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user and authentication information when component mounts
    const fetchAuthInfo = () => {
      try {
        const userData = getAuthenticatedUser();
        const authToken = getAuthToken();
        let tenant = null;
        if (userData) {
          setUser(userData);
          // Extract tenant ID from user data if available
          tenant = userData.tenant_id || null;
        }
        // Fallback: get tenant from localStorage if not present on user
        if (!tenant) {
          tenant = getSelectedTenant();
        }
        setTenantId(tenant);
        if (authToken) {
          setToken(authToken);
        }
      } catch (error) {
        console.error("Error fetching authentication info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthInfo();

    // Optional: Listen for tenant changes in localStorage
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "selectedTenantId") {
        setTenantId(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return {
    user,
    token,
    tenantId,
    loading,
  };
}
