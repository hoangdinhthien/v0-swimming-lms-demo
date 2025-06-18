"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout-v2";

// Import instructor components (you'll need to create these or import existing ones)
import InstructorDashboard from "../page";
// Add other instructor-specific pages as needed

export default function InstructorCatchAllPage() {
  const params = useParams();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const slug = params?.slug as string[];

    if (!slug || slug.length === 0) {
      setComponent(() => InstructorDashboard);
      return;
    }

    const [section, id, subsection] = slug;

    // Route mapping for instructor sections
    switch (section) {
      case "classes":
        setComponent(() => InstructorDashboard); // Placeholder
        break;

      case "students":
        setComponent(() => InstructorDashboard); // Placeholder
        break;

      case "attendance":
        setComponent(() => InstructorDashboard); // Placeholder
        break;

      case "schedule":
        setComponent(() => InstructorDashboard); // Placeholder
        break;

      default:
        setComponent(() => InstructorDashboard);
        break;
    }
  }, [params]);

  if (!Component) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout userRole='instructor'>
      <Component />
    </DashboardLayout>
  );
}
