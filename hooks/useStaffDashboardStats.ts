import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import {
  fetchDashboardStat,
  fetchRecentItems,
} from "@/api/staff-data/dashboard-stats-api";

interface DashboardStats {
  students: number | null;
  courses: number | null;
  classes: number | null;
  applications: number | null;
  instructors: number | null;
  news: number | null;
}

interface DashboardPreviewData {
  recentCourses: any[];
  recentNews: any[];
  recentStudents: any[];
}

export function useStaffDashboardStats() {
  const { token, tenantId } = useAuth();
  const { allowedNavigationItems, loading: permissionsLoading } =
    useStaffPermissions();

  const [stats, setStats] = useState<DashboardStats>({
    students: null,
    courses: null,
    classes: null,
    applications: null,
    instructors: null,
    news: null,
  });

  const [previewData, setPreviewData] = useState<DashboardPreviewData>({
    recentCourses: [],
    recentNews: [],
    recentStudents: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!token || !tenantId || permissionsLoading) return;

    setLoading(true);
    setError(null);

    try {
      const promises = [];
      const keys: (keyof DashboardStats)[] = [];

      // --- Stats Fetching ---

      // Students
      if (allowedNavigationItems.includes("students")) {
        promises.push(
          fetchDashboardStat({
            endpoint: "users",
            module: "User",
            tenantId,
            token,
            queryParams: { role: "member" },
          })
        );
        keys.push("students");
      }

      // Courses
      if (allowedNavigationItems.includes("courses")) {
        promises.push(
          fetchDashboardStat({
            endpoint: "courses",
            module: "Course",
            tenantId,
            token,
          })
        );
        keys.push("courses");
      }

      // Classes
      if (allowedNavigationItems.includes("classes")) {
        promises.push(
          fetchDashboardStat({
            endpoint: "classes",
            module: "Class",
            tenantId,
            token,
          })
        );
        keys.push("classes");
      }

      // Applications
      if (allowedNavigationItems.includes("applications")) {
        promises.push(
          fetchDashboardStat({
            endpoint: "applications",
            module: "Application",
            tenantId,
            token,
          })
        );
        keys.push("applications");
      }

      // Instructors
      if (allowedNavigationItems.includes("instructors")) {
        promises.push(
          fetchDashboardStat({
            endpoint: "users",
            module: "User",
            tenantId,
            token,
            queryParams: { role: "instructor" },
          })
        );
        keys.push("instructors");
      }

      // News
      if (allowedNavigationItems.includes("news")) {
        promises.push(
          fetchDashboardStat({
            endpoint: "news",
            module: "News",
            tenantId,
            token,
          })
        );
        keys.push("news");
      }

      const results = await Promise.all(promises);

      const newStats = { ...stats };
      keys.forEach((key, index) => {
        // @ts-ignore
        newStats[key] = results[index];
      });

      setStats(newStats);

      // --- Preview Data Fetching ---
      let recentCourses: any[] = [];
      let recentNews: any[] = [];
      let recentStudents: any[] = [];

      if (allowedNavigationItems.includes("courses")) {
        recentCourses = await fetchRecentItems({
          endpoint: "courses",
          module: "Course",
          tenantId,
          token,
          limit: 4,
        });
      }

      if (allowedNavigationItems.includes("news")) {
        recentNews = await fetchRecentItems({
          endpoint: "news",
          module: "News",
          tenantId,
          token,
          limit: 3,
        });
      }

      if (allowedNavigationItems.includes("students")) {
        recentStudents = await fetchRecentItems({
          endpoint: "users",
          module: "User",
          tenantId,
          token,
          limit: 5,
          queryParams: {
            role: "member",
            sort: "-created_at",
          },
        });
      }

      setPreviewData({
        recentCourses,
        recentNews,
        recentStudents,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to fetch dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading && token && tenantId) {
      fetchStats();
    }
  }, [permissionsLoading, token, tenantId, allowedNavigationItems.join(",")]);

  return { stats, previewData, loading, error, refetch: fetchStats };
}
