"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { Loader2 } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  module: string;
  action: string;
  redirectTo?: string; // Optional redirect URL if no permission
  showLoading?: boolean; // Whether to show loading state, default true
}

/**
 * Component that guards content based on staff permissions for specific modules and actions
 * Managers always have access, staff need specific permissions
 * If no permission, redirects to specified URL or renders nothing
 */
export default function PermissionGuard({
  children,
  module,
  action,
  redirectTo,
  showLoading = true,
}: PermissionGuardProps) {
  const { hasPermission, isManager, isStaff, loading } = useStaffPermissions();
  const router = useRouter();

  // Check if user has permission
  const hasAccess = hasPermission(module, action);

  // Redirect if no access and redirectTo is specified
  useEffect(() => {
    if (!hasAccess && redirectTo) {
      router.push(redirectTo);
    }
  }, [hasAccess, redirectTo, router]);

  // Show loading state while checking permissions
  if (loading && showLoading) {
    return (
      <div className='flex items-center justify-center py-2'>
        <Loader2 className='h-4 w-4 animate-spin' />
        <span className='ml-2 text-sm'>Đang kiểm tra quyền hạn...</span>
      </div>
    );
  }

  // If no access, don't render anything (redirect will happen via useEffect)
  if (!hasAccess) {
    return null;
  }

  // User has access, render children
  return <>{children}</>;
}
