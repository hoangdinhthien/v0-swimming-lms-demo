"use client";

import DashboardLayout from "@/components/dashboard-layout-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function StaffCalendarPage() {
  return (
    <DashboardLayout userRole='staff'>
      <div className='space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Lịch Học</h1>
          <p className='text-muted-foreground'>
            Xem lịch học và lịch làm việc (Chức năng dành cho nhân viên)
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Calendar className='h-5 w-5' />
              Lịch Trình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-center py-12'>
              <Calendar className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
              <h3 className='text-lg font-semibold mb-2'>Đang Phát Triển</h3>
              <p className='text-muted-foreground'>
                Chức năng lịch làm việc cho nhân viên đang được phát triển.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
