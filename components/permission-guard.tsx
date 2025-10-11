"use client";

import { ReactNode } from "react";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

interface PermissionGuardProps {
  children: ReactNode;
  module: string;
  action: string;
  fallback?: ReactNode;
}

/**
 * Component that guards content based on staff permissions for specific modules and actions
 * Managers always have access, staff need specific permissions
 */
export default function PermissionGuard({
  children,
  module,
  action,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission, isManager, isStaff, loading } = useStaffPermissions();

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className='flex items-center justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
        <span className='ml-2'>Đang kiểm tra quyền hạn...</span>
      </div>
    );
  }

  // Check if user has permission
  const hasAccess = hasPermission(module, action);

  // If no access, show fallback or default message
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Card className='border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-amber-800 dark:text-amber-200'>
            <Shield className='h-5 w-5' />
            Không có quyền truy cập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-amber-700 dark:text-amber-300'>
            Bạn không có quyền để {getActionDisplayName(action)}{" "}
            {getModuleDisplayName(module)}. Vui lòng liên hệ quản lý để được cấp
            quyền.
          </p>
        </CardContent>
      </Card>
    );
  }

  // User has access, render children
  return <>{children}</>;
}

// Helper functions for display names
function getModuleDisplayName(module: string): string {
  const moduleNames: Record<string, string> = {
    Course: "khóa học",
    Order: "giao dịch",
    Class: "lớp học",
    User: "người dùng",
    News: "tin tức",
    Blog: "blog",
    Application: "đơn đăng ký",
  };
  return moduleNames[module] || module.toLowerCase();
}

function getActionDisplayName(action: string): string {
  const actionNames: Record<string, string> = {
    GET: "xem",
    POST: "tạo mới",
    PUT: "chỉnh sửa",
    DELETE: "xóa",
  };
  return actionNames[action] || action.toLowerCase();
}
