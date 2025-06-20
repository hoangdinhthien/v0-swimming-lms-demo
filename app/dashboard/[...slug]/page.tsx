"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUser } from "@/api/auth-utils";
import { getUserFrontendRole } from "@/api/role-utils";

// Import manager dashboard components (these exist)
import ManagerDashboard from "../manager/page";
import ManagerStudentsPage from "../manager/students/page";
import ManagerStudentDetailPage from "../manager/students/[id]/page";
import ManagerInstructorsPage from "../manager/instructors/page";
import ManagerInstructorDetailPage from "../manager/instructors/[id]/page";
import ManagerCoursesPage from "../manager/courses/page";
import ManagerApplicationsPage from "../manager/applications/page";
import ManagerApplicationDetailPage from "../manager/applications/[id]/page";
import ManagerAnalyticsPage from "../manager/analytics/page";
import ManagerPromotionsPage from "../manager/promotions/page";
import ManagerSettingsPage from "../manager/settings/page";
import ManagerNotificationsPage from "../manager/notifications/page";
import ManagerNotificationDetailPage from "../manager/notifications/[id]/page";
import ManagerReportsPage from "../manager/reports/page";

export default function DashboardCatchAllPage() {
  const params = useParams();
  const router = useRouter();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user role
    const user = getAuthenticatedUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const role = getUserFrontendRole();
    setUserRole(role || "manager"); // Default to manager for this version

    // Parse route parameters
    const slug = params?.slug as string[];

    if (!slug || slug.length === 0) {
      // All users go to manager dashboard
      setComponent(() => ManagerDashboard);
      setLoading(false);
      return;
    }

    const [roleOrSection, section, id, subsection] = slug;

    // Handle role-based routing
    if (["manager", "instructor", "student"].includes(roleOrSection)) {
      const dashboardRole = roleOrSection;

      if (!section) {
        // All users go to manager dashboard
        setComponent(() => ManagerDashboard);
      } else if (dashboardRole === "manager") {
        // Manager sections
        switch (section) {
          case "students":
            if (id && !subsection) {
              setComponent(() => ManagerStudentDetailPage);
            } else {
              setComponent(() => ManagerStudentsPage);
            }
            break;
          case "instructors":
            if (id && !subsection) {
              setComponent(() => ManagerInstructorDetailPage);
            } else {
              setComponent(() => ManagerInstructorsPage);
            }
            break;
          case "courses":
            setComponent(() => ManagerCoursesPage);
            break;
          case "applications":
            if (id && !subsection) {
              setComponent(() => ManagerApplicationDetailPage);
            } else {
              setComponent(() => ManagerApplicationsPage);
            }
            break;
          case "analytics":
            setComponent(() => ManagerAnalyticsPage);
            break;
          case "promotions":
            setComponent(() => ManagerPromotionsPage);
            break;
          case "settings":
            setComponent(() => ManagerSettingsPage);
            break;
          case "notifications":
            if (id && !subsection) {
              setComponent(() => ManagerNotificationDetailPage);
            } else {
              setComponent(() => ManagerNotificationsPage);
            }
            break;
          case "reports":
            setComponent(() => ManagerReportsPage);
            break;
          default:
            setComponent(() => ManagerDashboard);
            break;
        }
      } else {
        // For instructor and student, redirect to manager dashboard
        setComponent(() => ManagerDashboard);
      }
    } else {
      // Legacy routing - treat first param as section for manager
      const section = roleOrSection;
      const id = slug[1];

      switch (section) {
        case "students":
          if (id) {
            setComponent(() => ManagerStudentDetailPage);
          } else {
            setComponent(() => ManagerStudentsPage);
          }
          break;
        case "instructors":
          if (id) {
            setComponent(() => ManagerInstructorDetailPage);
          } else {
            setComponent(() => ManagerInstructorsPage);
          }
          break;
        default:
          setComponent(() => ManagerDashboard);
          break;
      }
    }

    setLoading(false);
  }, [params, router]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div>Page not found</div>
      </div>
    );
  }

  return <Component />;
}
