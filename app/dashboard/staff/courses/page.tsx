"use client";

import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function StaffCoursesPage() {
  const { hasPermission, loading } = useStaffPermissions();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!hasPermission("course", "read")) {
    return (
      <Alert>
        <AlertDescription>
          You don't have permission to view courses. Please contact your
          manager.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>My Courses</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Your assigned courses will be displayed here. This feature is
            currently under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
