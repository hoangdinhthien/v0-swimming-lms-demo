/**
 * Optimized API Hooks with Caching and Performance Improvements
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  performanceCache,
  withCache,
  apiBatcher,
} from "@/utils/performance-cache";
import { fetchInstructors } from "@/api/manager/instructors-api";
import {
  fetchStudents,
  fetchStudentsByCourseOrder,
} from "@/api/manager/students-api";
import { fetchCourses } from "@/api/manager/courses-api";
import { getMediaDetails } from "@/api/media-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

interface UseOptimizedAPIOptions {
  enabled?: boolean;
  dependencies?: any[];
  cacheTTL?: number;
}

interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Optimized hook for fetching instructors with caching
 */
export function useOptimizedInstructors(
  options: UseOptimizedAPIOptions = {}
): APIState<any[]> {
  const {
    enabled = true,
    dependencies = [],
    cacheTTL = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [state, setState] = useState<Omit<APIState<any[]>, "refetch">>({
    data: null,
    loading: true,
    error: null,
  });

  // Create cached fetch function
  const cachedFetchInstructors = useMemo(
    () => withCache(fetchInstructors, { ttl: cacheTTL }),
    [cacheTTL]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const tenantId = getSelectedTenant();
    const token = getAuthToken();

    if (!tenantId || !token) {
      setState({
        data: null,
        loading: false,
        error: "Missing tenant or token",
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const instructors = await cachedFetchInstructors({
        tenantId,
        token,
        role: "instructor",
      });

      setState({ data: instructors || [], loading: false, error: null });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || "Failed to fetch instructors",
      });
    }
  }, [enabled, cachedFetchInstructors, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Optimized hook for fetching students with caching
 */
export function useOptimizedStudents(
  options: UseOptimizedAPIOptions = {}
): APIState<any[]> {
  const {
    enabled = true,
    dependencies = [],
    cacheTTL = 5 * 60 * 1000,
  } = options;

  const [state, setState] = useState<Omit<APIState<any[]>, "refetch">>({
    data: null,
    loading: true,
    error: null,
  });

  const cachedFetchStudents = useMemo(
    () => withCache(fetchStudents, { ttl: cacheTTL }),
    [cacheTTL]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const tenantId = getSelectedTenant();
    const token = getAuthToken();

    if (!tenantId || !token) {
      setState({
        data: null,
        loading: false,
        error: "Missing tenant or token",
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const students = await cachedFetchStudents({ tenantId, token });

      setState({ data: students || [], loading: false, error: null });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || "Failed to fetch students",
      });
    }
  }, [enabled, cachedFetchStudents, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Optimized hook for fetching courses with caching
 */
export function useOptimizedCourses(
  options: UseOptimizedAPIOptions = {}
): APIState<any[]> {
  const {
    enabled = true,
    dependencies = [],
    cacheTTL = 10 * 60 * 1000, // 10 minutes for courses (change less frequently)
  } = options;

  const [state, setState] = useState<Omit<APIState<any[]>, "refetch">>({
    data: null,
    loading: true,
    error: null,
  });

  const cachedFetchCourses = useMemo(
    () => withCache(fetchCourses, { ttl: cacheTTL }),
    [cacheTTL]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    const tenantId = getSelectedTenant();
    const token = getAuthToken();

    if (!tenantId || !token) {
      setState({
        data: null,
        loading: false,
        error: "Missing tenant or token",
      });
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const result = await cachedFetchCourses({
        tenantId,
        token,
        limit: 100,
      });

      setState({ data: result.data || [], loading: false, error: null });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || "Failed to fetch courses",
      });
    }
  }, [enabled, cachedFetchCourses, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

/**
 * Optimized avatar loading with batching
 */
export function useOptimizedAvatars(items: any[]): { [key: string]: string } {
  const [avatars, setAvatars] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!items || items.length === 0) return;

    const loadAvatars = async () => {
      const avatarPromises = items.map(async (item) => {
        const key = item._id || item.id;
        if (!key) return { key: "unknown", url: "/placeholder.svg" };

        // Check cache first
        const cacheKey = `avatar-${key}`;
        const cached = performanceCache.get<string>(cacheKey);
        if (cached) {
          return { key, url: cached };
        }

        // Extract avatar URL
        const featuredImage = item.featured_image || item.user?.featured_image;
        let avatarUrl = "/placeholder.svg";

        if (featuredImage) {
          try {
            // Handle empty array
            if (Array.isArray(featuredImage) && featuredImage.length === 0) {
              avatarUrl = "/placeholder.svg";
            }
            // Handle Array format: [{ path: ["url"] }] or [{ path: "url" }]
            else if (Array.isArray(featuredImage) && featuredImage.length > 0) {
              const firstImage = featuredImage[0];
              if (firstImage?.path) {
                if (Array.isArray(firstImage.path)) {
                  avatarUrl = firstImage.path[0] || "/placeholder.svg";
                } else if (typeof firstImage.path === "string") {
                  avatarUrl = firstImage.path;
                }
              }
            }
            // Handle Object format: { path: "url" } or { path: ["url"] }
            else if (typeof featuredImage === "object" && featuredImage.path) {
              if (
                Array.isArray(featuredImage.path) &&
                featuredImage.path.length > 0
              ) {
                avatarUrl = featuredImage.path[0];
              } else if (typeof featuredImage.path === "string") {
                avatarUrl = featuredImage.path;
              }
            }
            // Handle String format (legacy media ID)
            else if (typeof featuredImage === "string") {
              if (featuredImage.startsWith("http")) {
                avatarUrl = featuredImage;
              } else {
                // Batch media details requests
                const mediaUrl = await apiBatcher.batch(
                  "media-details",
                  async (mediaIds: string[]) => {
                    return Promise.all(
                      mediaIds.map((id) => getMediaDetails(id))
                    );
                  },
                  featuredImage
                );
                avatarUrl = mediaUrl || "/placeholder.svg";
              }
            }
          } catch (error) {
            console.error("Error loading avatar:", error);
          }
        }

        // Cache the result
        performanceCache.set(cacheKey, avatarUrl, 30 * 60 * 1000); // 30 minutes

        return { key, url: avatarUrl };
      });

      try {
        const results = await Promise.all(avatarPromises);
        const avatarMap = results.reduce((acc, { key, url }) => {
          acc[key] = url;
          return acc;
        }, {} as { [key: string]: string });

        setAvatars(avatarMap);
      } catch (error) {
        console.error("Error loading avatars:", error);
      }
    };

    loadAvatars();
  }, [items]);

  return avatars;
}

/**
 * Combined hook for common data loading patterns
 */
export function useCommonData(
  options: {
    loadInstructors?: boolean;
    loadStudents?: boolean;
    loadCourses?: boolean;
  } = {}
) {
  const {
    loadInstructors = false,
    loadStudents = false,
    loadCourses = false,
  } = options;

  const instructors = useOptimizedInstructors({ enabled: loadInstructors });
  const students = useOptimizedStudents({ enabled: loadStudents });
  const courses = useOptimizedCourses({ enabled: loadCourses });

  const loading = instructors.loading || students.loading || courses.loading;
  const error = instructors.error || students.error || courses.error;

  return {
    instructors: instructors.data || [],
    students: students.data || [],
    courses: courses.data || [],
    loading,
    error,
    refetch: async () => {
      await Promise.all(
        [
          loadInstructors && instructors.refetch(),
          loadStudents && students.refetch(),
          loadCourses && courses.refetch(),
        ].filter(Boolean)
      );
    },
  };
}
