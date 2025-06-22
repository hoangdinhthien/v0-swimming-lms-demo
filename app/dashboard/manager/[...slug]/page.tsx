"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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
import CalendarPage from "../calendar/page";
import PromotionsPage from "../promotions/page";
import SettingsPage from "../settings/page";
import NotificationsPage from "../notifications/page";
import NotificationDetailPage from "../notifications/[id]/page";
import ReportsPage from "../reports/page";
import ManagerNotFound from "@/components/manager/not-found";

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

    const [section, id, subsection] = slug;

    // Define valid routes
    const validRoutes = [
      "students",
      "instructors",
      "courses",
      "messages",
      "applications",
      "transactions",
      "calendar",
      "promotions",
      "settings",
      "notifications",
      "reports",
    ];

    // Check if the section is valid
    if (!validRoutes.includes(section)) {
      setComponent(() => ManagerNotFound);
      return;
    }

    // Route mapping
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

      case "calendar":
        setComponent(() => CalendarPage);
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
        // This should never be reached due to the validRoutes check above
        setComponent(() => ManagerNotFound);
        break;
    }
  }, [params]);
  if (!Component) {
    return <div>Loading...</div>;
  }

  return <Component />;
}
