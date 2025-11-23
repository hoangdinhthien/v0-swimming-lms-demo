import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import {
  fetchStaffCourses,
  fetchStaffClasses,
  fetchStaffOrders,
  fetchStaffUsers,
  fetchStaffNews,
  fetchStaffBlogs,
  fetchStaffApplications,
  hasStaffPermission,
  StaffDataResponse,
} from "@/api/staff-data/staff-data-api";

interface UseStaffDataOptions {
  page?: number;
  limit?: number;
  role?: "member" | "instructor" | "staff" | "manager";
  autoFetch?: boolean; // Whether to automatically fetch data on mount
}

interface UseStaffDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  hasPermission: boolean;
}

/**
 * Hook for fetching staff courses data
 */
export function useStaffCourses(
  options: UseStaffDataOptions = {}
): UseStaffDataReturn<any> {
  const { page = 1, limit = 10, autoFetch = true } = options;
  const { token, tenantId } = useAuth();
  const { staffPermissions, isStaff } = useStaffPermissions();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = isStaff
    ? hasStaffPermission(staffPermissions, "Course", "GET")
    : true; // Managers have all permissions

  const fetchData = async () => {
    if (!token || !tenantId || !hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      const additionalParams: Record<string, string | number> = {
        page,
        limit,
      };
      const response = await fetchStaffCourses(
        additionalParams,
        tenantId,
        token
      );
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && hasPermission) {
      fetchData();
    }
  }, [token, tenantId, page, limit, hasPermission, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
  };
}

/**
 * Hook for fetching staff classes data
 */
export function useStaffClasses(
  options: UseStaffDataOptions = {}
): UseStaffDataReturn<any> {
  const { page = 1, limit = 10, autoFetch = true } = options;
  const { token, tenantId } = useAuth();
  const { staffPermissions, isStaff } = useStaffPermissions();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = isStaff
    ? hasStaffPermission(staffPermissions, "Class", "GET")
    : true; // Managers have all permissions

  const fetchData = async () => {
    if (!token || !tenantId || !hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      const additionalParams: Record<string, string | number> = {
        page,
        limit,
      };
      const response = await fetchStaffClasses(
        additionalParams,
        tenantId,
        token
      );
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && hasPermission) {
      fetchData();
    }
  }, [token, tenantId, page, limit, hasPermission, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
  };
}

/**
 * Hook for fetching staff orders data
 */
export function useStaffOrders(
  options: UseStaffDataOptions = {}
): UseStaffDataReturn<any> {
  const { page = 1, limit = 10, autoFetch = true } = options;
  const { token, tenantId } = useAuth();
  const { staffPermissions, isStaff } = useStaffPermissions();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = isStaff
    ? hasStaffPermission(staffPermissions, "Order", "GET")
    : true; // Managers have all permissions

  const fetchData = async () => {
    if (!token || !tenantId || !hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      const additionalParams: Record<string, string | number> = {
        page,
        limit,
      };
      const response = await fetchStaffOrders(
        additionalParams,
        tenantId,
        token
      );
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && hasPermission) {
      fetchData();
    }
  }, [token, tenantId, page, limit, hasPermission, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
  };
}

/**
 * Hook for fetching staff users data (students, instructors)
 */
export function useStaffUsers(
  options: UseStaffDataOptions = {}
): UseStaffDataReturn<any> {
  const { page = 1, limit = 10, role, autoFetch = true } = options;
  const { token, tenantId } = useAuth();
  const { staffPermissions, isStaff } = useStaffPermissions();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = isStaff
    ? hasStaffPermission(staffPermissions, "User", "GET")
    : true; // Managers have all permissions

  const fetchData = async () => {
    if (!token || !tenantId || !hasPermission) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const additionalParams: Record<string, string | number> = {
        page,
        limit,
      };
      if (role) additionalParams.role = role;
      const response = await fetchStaffUsers(additionalParams, tenantId, token);
      setData(response);
    } catch (err) {
      console.error("[useStaffUsers] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && hasPermission) {
      fetchData();
    }
  }, [token, tenantId, page, limit, role, hasPermission, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
  };
}

/**
 * Hook for fetching staff students data (members)
 */
export function useStaffStudents(
  options: Omit<UseStaffDataOptions, "role"> = {}
): UseStaffDataReturn<any> {
  return useStaffUsers({ ...options, role: "member" });
}

/**
 * Hook for fetching staff instructors data
 */
export function useStaffInstructors(
  options: Omit<UseStaffDataOptions, "role"> = {}
): UseStaffDataReturn<any> {
  return useStaffUsers({ ...options, role: "instructor" });
}

/**
 * Hook for fetching staff news data
 */
export function useStaffNews(
  options: UseStaffDataOptions = {}
): UseStaffDataReturn<any> {
  const { page = 1, limit = 10, autoFetch = true } = options;
  const { token, tenantId } = useAuth();
  const { staffPermissions, isStaff } = useStaffPermissions();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = isStaff
    ? hasStaffPermission(staffPermissions, "News", "GET")
    : true; // Managers have all permissions

  const fetchData = async () => {
    if (!token || !tenantId || !hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      const additionalParams: Record<string, string | number> = {
        page,
        limit,
      };
      const response = await fetchStaffNews(additionalParams, tenantId, token);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && hasPermission) {
      fetchData();
    }
  }, [token, tenantId, page, limit, hasPermission, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
  };
}

/**
 * Hook for fetching staff applications data
 */
export function useStaffApplications(
  options: UseStaffDataOptions = {}
): UseStaffDataReturn<any> {
  const { page = 1, limit = 10, autoFetch = true } = options;
  const { token, tenantId } = useAuth();
  const { staffPermissions, isStaff } = useStaffPermissions();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPermission = isStaff
    ? hasStaffPermission(staffPermissions, "Application", "GET")
    : true; // Managers have all permissions

  const fetchData = async () => {
    if (!token || !tenantId || !hasPermission) return;

    setLoading(true);
    setError(null);

    try {
      const additionalParams: Record<string, string | number> = {
        page,
        limit,
      };
      const response = await fetchStaffApplications(
        additionalParams,
        tenantId,
        token
      );
      setData(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch applications"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch && hasPermission) {
      fetchData();
    }
  }, [token, tenantId, page, limit, hasPermission, autoFetch]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    hasPermission,
  };
}
