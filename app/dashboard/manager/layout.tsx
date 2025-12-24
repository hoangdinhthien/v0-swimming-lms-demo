"use client";

import DashboardLayout from "@/components/dashboard-layout-v2";
import RoleGuard from "@/components/role-guard";

export default function ManagerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["manager", "staff"]}>
      <DashboardLayout>{children}</DashboardLayout>
    </RoleGuard>
  );
}
