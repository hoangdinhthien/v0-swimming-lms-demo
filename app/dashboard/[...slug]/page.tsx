"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAuthenticatedUser } from "@/api/auth-utils";
import { getUserFrontendRole } from "@/api/role-utils";
import { Loader2 } from "lucide-react";

export default function DashboardCatchAllPage() {
  const params = useParams();
  const router = useRouter();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const loadComponent = async () => {
      try {
        if (!slug || slug.length === 0) {
          // Default dashboard based on role
          switch (role) {
            case "instructor":
              const InstructorDashboard = (await import("../instructor/page"))
                .default;
              setComponent(() => InstructorDashboard);
              break;
            case "student":
              const StudentDashboard = (await import("../student/page"))
                .default;
              setComponent(() => StudentDashboard);
              break;
            default:
              const ManagerDashboard = (await import("../manager/page"))
                .default;
              setComponent(() => ManagerDashboard);
              break;
          }
          setLoading(false);
          return;
        }

        const [roleOrSection, section, id, subsection] = slug;

        // Handle role-based routing
        if (["manager", "instructor", "student"].includes(roleOrSection)) {
          const dashboardRole = roleOrSection;

          if (!section) {
            // Dashboard home page
            switch (dashboardRole) {
              case "instructor":
                const InstructorDashboard = (await import("../instructor/page"))
                  .default;
                setComponent(() => InstructorDashboard);
                break;
              case "student":
                const StudentDashboard = (await import("../student/page"))
                  .default;
                setComponent(() => StudentDashboard);
                break;
              default:
                const ManagerDashboard = (await import("../manager/page"))
                  .default;
                setComponent(() => ManagerDashboard);
                break;
            }
          } else if (dashboardRole === "manager") {
            // Manager sections - use dynamic imports
            try {
              let ComponentModule;

              switch (section) {
                case "students":
                  if (id && !subsection) {
                    ComponentModule = await import(
                      "../manager/students/[id]/page"
                    );
                  } else {
                    ComponentModule = await import("../manager/students/page");
                  }
                  break;
                case "instructors":
                  if (id && !subsection) {
                    ComponentModule = await import(
                      "../manager/instructors/[id]/page"
                    );
                  } else {
                    ComponentModule = await import(
                      "../manager/instructors/page"
                    );
                  }
                  break;
                case "courses":
                  if (id && !subsection) {
                    ComponentModule = await import(
                      "../manager/courses/[id]/page"
                    );
                  } else {
                    ComponentModule = await import("../manager/courses/page");
                  }
                  break;
                case "applications":
                  if (id && !subsection) {
                    ComponentModule = await import(
                      "../manager/applications/[id]/page"
                    );
                  } else {
                    ComponentModule = await import(
                      "../manager/applications/page"
                    );
                  }
                  break;
                case "analytics":
                  ComponentModule = await import("../manager/analytics/page");
                  break;
                case "promotions":
                  ComponentModule = await import("../manager/promotions/page");
                  break;
                case "settings":
                  ComponentModule = await import("../manager/settings/page");
                  break;
                case "notifications":
                  if (id && !subsection) {
                    ComponentModule = await import(
                      "../manager/notifications/[id]/page"
                    );
                  } else {
                    ComponentModule = await import(
                      "../manager/notifications/page"
                    );
                  }
                  break;
                case "reports":
                  ComponentModule = await import("../manager/reports/page");
                  break;
                case "transactions":
                  ComponentModule = await import(
                    "../manager/transactions/page"
                  );
                  break;
                case "tenants":
                  ComponentModule = await import("../manager/tenants/page");
                  break;
                default:
                  ComponentModule = await import("../manager/page");
                  break;
              }

              setComponent(() => ComponentModule.default);
            } catch (importError) {
              console.error("Error importing component:", importError);
              // Fallback to manager dashboard
              const ManagerDashboard = (await import("../manager/page"))
                .default;
              setComponent(() => ManagerDashboard);
            }
          } else {
            // For instructor and student, default to their dashboard
            const Dashboard =
              dashboardRole === "instructor"
                ? (await import("../instructor/page")).default
                : (await import("../student/page")).default;
            setComponent(() => Dashboard);
          }
        } else {
          // Legacy routing - treat first param as section for manager
          const section = roleOrSection;
          const id = slug[1];

          try {
            let ComponentModule;

            switch (section) {
              case "students":
                if (id) {
                  ComponentModule = await import(
                    "../manager/students/[id]/page"
                  );
                } else {
                  ComponentModule = await import("../manager/students/page");
                }
                break;
              case "instructors":
                if (id) {
                  ComponentModule = await import(
                    "../manager/instructors/[id]/page"
                  );
                } else {
                  ComponentModule = await import("../manager/instructors/page");
                }
                break;
              case "courses":
                if (id) {
                  ComponentModule = await import(
                    "../manager/courses/[id]/page"
                  );
                } else {
                  ComponentModule = await import("../manager/courses/page");
                }
                break;
              default:
                ComponentModule = await import("../manager/page");
                break;
            }

            setComponent(() => ComponentModule.default);
          } catch (importError) {
            console.error("Error importing component:", importError);
            // Fallback to manager dashboard
            const ManagerDashboard = (await import("../manager/page")).default;
            setComponent(() => ManagerDashboard);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading component:", error);
        setError("Failed to load page");
        setLoading(false);
      }
    };

    loadComponent();
  }, [params, router, userRole]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
          <p className='text-sm text-muted-foreground'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-lg font-semibold text-red-600 mb-2'>Error</h2>
          <p className='text-sm text-muted-foreground'>{error}</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h2 className='text-lg font-semibold mb-2'>Page not found</h2>
          <p className='text-sm text-muted-foreground'>
            The requested page could not be found.
          </p>
        </div>
      </div>
    );
  }

  return <Component />;
}
