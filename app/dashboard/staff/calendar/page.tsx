"use client";

import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function StaffCalendarPage() {
  const { loading } = useStaffPermissions();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Schedule Calendar</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Calendar interface will be displayed here. This feature is currently
            under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
