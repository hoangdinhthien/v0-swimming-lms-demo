"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard-layout-v2";

// Import all your existing manager components
import StudentsPage from "../students/page";
import StudentDetailPage from "../students/[id]/page";
import InstructorsPage from "../instructors/page";
import InstructorDetailPage from "../instructors/[id]/page";
import CoursesPage from "../courses/page";
import CourseDetailPage from "../courses/[id]/page";
import MessagesPage from "../messages/page";
import ApplicationsPage from "../applications/page";
import ApplicationDetailPage from "../applications/[id]/page";
import TransactionsPage from "../transactions/page";
import AnalyticsPage from "../analytics/page";
import PromotionsPage from "../promotions/page";
import SettingsPage from "../settings/page";
import NotificationsPage from "../notifications/page";
import NotificationDetailPage from "../notifications/[id]/page";
import ReportsPage from "../reports/page";

// Import the main manager dashboard
import ManagerDashboard from "../page";

// Create wrapper components that don't require props
const StudentDetailWrapper = () => {
  return <StudentDetailPage />;
};

const InstructorDetailWrapper = () => {
  return <InstructorDetailPage />;
};

const CourseDetailWrapper = () => {
  const params = useParams();
  const id = params?.slug?.[1] as string;
  return <CourseDetailPage params={Promise.resolve({ id })} />;
};

const ApplicationDetailWrapper = () => {
  return <ApplicationDetailPage />;
};

const NotificationDetailWrapper = () => {
  return <NotificationDetailPage />;
};

export default function ManagerCatchAllPage() {
  const params = useParams();
  const [Component, setComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    const slug = params?.slug as string[];

    if (!slug || slug.length === 0) {
      setComponent(() => ManagerDashboard);
      return;
    }

    const [section, id, subsection] = slug; // Route mapping
    switch (section) {
      case "students":
        if (id && !subsection) {
          setComponent(() => StudentDetailWrapper);
        } else {
          setComponent(() => StudentsPage);
        }
        break;

      case "instructors":
        if (id && !subsection) {
          setComponent(() => InstructorDetailWrapper);
        } else {
          setComponent(() => InstructorsPage);
        }
        break;

      case "courses":
        if (id && !subsection) {
          setComponent(() => CourseDetailWrapper);
        } else {
          setComponent(() => CoursesPage);
        }
        break;

      case "messages":
        setComponent(() => MessagesPage);
        break;

      case "applications":
        if (id && !subsection) {
          setComponent(() => ApplicationDetailWrapper);
        } else {
          setComponent(() => ApplicationsPage);
        }
        break;

      case "transactions":
        setComponent(() => TransactionsPage);
        break;

      case "analytics":
        setComponent(() => AnalyticsPage);
        break;

      case "promotions":
        setComponent(() => PromotionsPage);
        break;

      case "settings":
        setComponent(() => SettingsPage);
        break;

      case "notifications":
        if (id && !subsection) {
          setComponent(() => NotificationDetailWrapper);
        } else {
          setComponent(() => NotificationsPage);
        }
        break;

      case "reports":
        setComponent(() => ReportsPage);
        break;

      default:
        setComponent(() => ManagerDashboard);
        break;
    }
  }, [params]);

  if (!Component) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout userRole='manager'>
      <Component />
    </DashboardLayout>
  );
}
