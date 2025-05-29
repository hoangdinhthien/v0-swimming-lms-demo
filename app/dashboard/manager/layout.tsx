"use client";

import DashboardLayout from "@/components/dashboard-layout-v2";

export default function ManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout userRole='manager'>{children}</DashboardLayout>;
}
