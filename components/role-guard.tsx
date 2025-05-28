"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/api/auth-utils";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
}

/**
 * A component that guards content based on user roles
 * For this version of the application, it will always allow access
 * as long as the user is authenticated, since we're focusing on manager role
 *
 * @param children The content to display if the user has the required role
 * @param allowedRoles Array of roles that are allowed to view the content
 * @param fallbackUrl URL to redirect to if the user doesn't have the required role
 */
export default function RoleGuard({
  children,
  allowedRoles,
  fallbackUrl = "/",
}: RoleGuardProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Check if authenticated
      if (!isAuthenticated()) {
        router.push("/login");
        return;
      }

      // For this version, we're always granting access for manager role development
      setHasAccess(true);
      setIsLoading(false);
    };

    checkAccess();
  }, [router, fallbackUrl]);

  // Show loading state
  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-2'>Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (!hasAccess) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <p className='text-xl font-bold text-red-500'>
            Bạn không có quyền truy cập trang này
          </p>
          <p className='mt-2'>Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  // Show content if user has access
  return <>{children}</>;
}
