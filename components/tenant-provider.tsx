"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getSelectedTenant,
  setSelectedTenant as saveTenant,
  clearSelectedTenant,
} from "@/utils/tenant-utils";

interface TenantContextType {
  selectedTenantId: string | null;
  setSelectedTenant: (tenantId: string) => void;
  clearTenant: () => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load tenant from localStorage on mount
    const tenantId = getSelectedTenant();
    setSelectedTenantIdState(tenantId);
    setIsLoading(false);
  }, []);

  const setSelectedTenant = (tenantId: string) => {
    setSelectedTenantIdState(tenantId);
    saveTenant(tenantId);
  };

  const clearTenant = () => {
    setSelectedTenantIdState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedTenantId");
    }
  };

  return (
    <TenantContext.Provider
      value={{
        selectedTenantId,
        setSelectedTenant,
        clearTenant,
        isLoading,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

// HOC to protect dashboard routes that require tenant selection
export function withTenantGuard<P extends object>(
  Component: React.ComponentType<P>
) {
  return function TenantGuardedComponent(props: P) {
    const { selectedTenantId, isLoading } = useTenant();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !selectedTenantId) {
        router.push("/tenant-selection");
      }
    }, [selectedTenantId, isLoading, router]);

    if (isLoading) {
      return (
        <div className='flex items-center justify-center min-h-screen'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500'></div>
        </div>
      );
    }

    if (!selectedTenantId) {
      return null; // Router will redirect
    }

    return <Component {...props} />;
  };
}
