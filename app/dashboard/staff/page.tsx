"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Users,
  Waves,
  BarChart2,
  Plus,
  ArrowRight,
  Percent,
  Bell,
  Loader2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";

export default function StaffDashboard() {
  const router = useRouter();
  const { hasPermission, loading } = useStaffPermissions();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Staff Dashboard</h2>
        <div className='flex items-center space-x-2'>
          <Badge variant='secondary'>Staff Portal</Badge>
        </div>
      </div>

      <Tabs
        defaultValue='overview'
        className='space-y-4'
      >
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          {hasPermission("course", "read") && (
            <TabsTrigger value='courses'>Courses</TabsTrigger>
          )}
          {hasPermission("class", "read") && (
            <TabsTrigger value='classes'>Classes</TabsTrigger>
          )}
          {hasPermission("order", "read") && (
            <TabsTrigger value='orders'>Orders</TabsTrigger>
          )}
        </TabsList>

        <TabsContent
          value='overview'
          className='space-y-4'
        >
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {hasPermission("course", "read") && (
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    My Courses
                  </CardTitle>
                  <Waves className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>12</div>
                  <p className='text-xs text-muted-foreground'>
                    Active courses assigned
                  </p>
                </CardContent>
              </Card>
            )}

            {hasPermission("class", "read") && (
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Today's Classes
                  </CardTitle>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>8</div>
                  <p className='text-xs text-muted-foreground'>
                    Classes scheduled today
                  </p>
                </CardContent>
              </Card>
            )}

            {hasPermission("user", "read") && (
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    My Students
                  </CardTitle>
                  <Users className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>45</div>
                  <p className='text-xs text-muted-foreground'>
                    Students in my classes
                  </p>
                </CardContent>
              </Card>
            )}

            {hasPermission("order", "read") && (
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Pending Orders
                  </CardTitle>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>6</div>
                  <p className='text-xs text-muted-foreground'>
                    Orders requiring attention
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions */}
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {hasPermission("class", "create") && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <Button
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Schedule New Class
                  </Button>
                  <Button
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <FileText className='mr-2 h-4 w-4' />
                    Mark Attendance
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasPermission("course", "read") && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>My Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>10:00 AM - Beginner Swimming</span>
                      <Badge variant='secondary'>Pool A</Badge>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>2:00 PM - Advanced Techniques</span>
                      <Badge variant='secondary'>Pool B</Badge>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>4:00 PM - Kids Class</span>
                      <Badge variant='secondary'>Pool A</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {hasPermission("news", "read") && (
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Announcements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='text-sm'>
                      <div className='font-medium'>Pool Maintenance</div>
                      <div className='text-muted-foreground'>
                        Pool B closed tomorrow
                      </div>
                    </div>
                    <div className='text-sm'>
                      <div className='font-medium'>New Equipment</div>
                      <div className='text-muted-foreground'>
                        Kickboards arrived
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {hasPermission("course", "read") && (
          <TabsContent
            value='courses'
            className='space-y-4'
          >
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Course management interface will be implemented here based on
                  your permissions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission("class", "read") && (
          <TabsContent
            value='classes'
            className='space-y-4'
          >
            <Card>
              <CardHeader>
                <CardTitle>Class Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Class management interface will be implemented here based on
                  your permissions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {hasPermission("order", "read") && (
          <TabsContent
            value='orders'
            className='space-y-4'
          >
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-muted-foreground'>
                  Order management interface will be implemented here based on
                  your permissions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
