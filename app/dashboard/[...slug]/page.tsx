"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardCatchAllPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const slug = params?.slug as string[];

    if (!slug || slug.length === 0) {
      // Default to manager dashboard
      router.replace("/dashboard/manager");
      return;
    }

    const [roleOrSection, section, id, subsection] = slug;

    // Handle role-based routing
    if (["manager", "instructor", "student", "admin"].includes(roleOrSection)) {
      const dashboardRole = roleOrSection;

      if (!section) {
        // All users go to manager dashboard for this version
        router.replace("/dashboard/manager");
      } else if (dashboardRole === "manager") {
        // Manager sections - redirect to actual routes
        let targetRoute = `/dashboard/manager/${section}`;
        if (id) targetRoute += `/${id}`;
        if (subsection) targetRoute += `/${subsection}`;
        router.replace(targetRoute);
      } else {
        // For other roles, redirect to manager dashboard
        router.replace("/dashboard/manager");
      }
    } else {
      // Legacy routing - treat first param as section for manager
      let targetRoute = `/dashboard/manager/${roleOrSection}`;
      if (slug[1]) targetRoute += `/${slug[1]}`;
      router.replace(targetRoute);
    }
  }, [params, router]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
    </div>
  );
}
