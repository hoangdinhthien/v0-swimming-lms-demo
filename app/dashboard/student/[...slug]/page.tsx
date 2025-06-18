"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout-v2";

// Import student components
import StudentDashboard from "../page";
// Add other student-specific pages as needed

export default function StudentCatchAllPage() {
  const params = useParams();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const slug = params?.slug as string[];

    if (!slug || slug.length === 0) {
      setComponent(() => StudentDashboard);
      return;
    }

    const [section, id, subsection] = slug;

    // Route mapping for student sections
    switch (section) {
      case "courses":
        setComponent(() => StudentDashboard); // Placeholder
        break;

      case "schedule":
        setComponent(() => StudentDashboard); // Placeholder
        break;

      case "progress":
        setComponent(() => StudentDashboard); // Placeholder
        break;

      case "profile":
        setComponent(() => StudentDashboard); // Placeholder
        break;

      default:
        setComponent(() => StudentDashboard);
        break;
    }
  }, [params]);

  if (!Component) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout userRole='student'>
      <Component />
    </DashboardLayout>
  );
}
