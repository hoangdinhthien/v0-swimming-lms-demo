import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getUserFrontendRole } from "@/api/role-utils";
import {
  fetchStaffPermissions,
  StaffPermission,
  hasPermission,
  getAllowedNavigationItems,
} from "@/api/staff/staff-permissions-api";

export interface UseStaffPermissionsReturn {
  staffPermissions: StaffPermission | null;
  loading: boolean;
  error: string | null;
  hasPermission: (module: string, action: string) => boolean;
  allowedNavigationItems: string[];
  isManager: boolean;
  isStaff: boolean;
  refetch: () => void;
}

/**
 * Hook to manage staff permissions for the current user
 * If the user is a manager, returns full permissions
 * If the user is staff, fetches and returns their specific permissions
 */
export function useStaffPermissions(): UseStaffPermissionsReturn {
  const { token, tenantId } = useAuth();
  const [staffPermissions, setStaffPermissions] =
    useState<StaffPermission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userRole = getUserFrontendRole();
  const isManager = userRole === "manager" || userRole === "admin";
  const isStaff = userRole === "staff";

  const fetchPermissions = async () => {
    if (!token || !tenantId || !isStaff) return;

    setLoading(true);
    setError(null);

    try {
      const permissions = await fetchStaffPermissions({ tenantId, token });
      setStaffPermissions(permissions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching staff permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions when component mounts and user is staff
  useEffect(() => {
    console.log("[useStaffPermissions] useEffect triggered", {
      isStaff,
      isManager,
      token: !!token,
      tenantId: !!tenantId,
    });
    if (isStaff) {
      fetchPermissions();
    } else if (isManager) {
      // Managers have full permissions, no need to fetch
      console.log(
        "[useStaffPermissions] Manager detected, setting full permissions"
      );
      setStaffPermissions(null);
      setLoading(false);
      setError(null);
    }
  }, [token, tenantId, isStaff, isManager]);

  // Permission checker function
  const checkPermission = (module: string, action: string): boolean => {
    console.log("[useStaffPermissions] checkPermission called", {
      module,
      action,
      isManager,
      isStaff,
      hasStaffPermissions: !!staffPermissions,
    });
    if (isManager) {
      // Managers have all permissions
      console.log(
        "[useStaffPermissions] Manager has permission for",
        module,
        action
      );
      return true;
    }

    if (isStaff) {
      const result = hasPermission(staffPermissions, module, action);
      console.log("[useStaffPermissions] Staff permission result", {
        module,
        action,
        result,
        staffPermissions,
      });
      return result;
    }

    // Other roles default to no permissions
    console.log("[useStaffPermissions] No permission for other roles");
    return false;
  };

  // Get allowed navigation items
  const allowedNavigationItems = isManager
    ? [
        "courses",
        "classes",
        "applications",
        "application-types",
        "students",
        "instructors",
        "staff",
        "transactions",
        "news",
        "calendar",
        "promotions",
        "settings",
        "reports",
      ] // Managers see everything
    : getAllowedNavigationItems(staffPermissions);

  return {
    staffPermissions,
    loading,
    error,
    hasPermission: checkPermission,
    allowedNavigationItems,
    isManager,
    isStaff,
    refetch: fetchPermissions,
  };
}
