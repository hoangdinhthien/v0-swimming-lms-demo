"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Droplets,
  Wrench,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function PoolDetailPage({ params }: { params: { id: string } }) {
  // Mock pool data
  const pool = {
    id: Number(params.id),
    name: "Main Pool",
    status: "Operational",
    temperature: "78°F",
    lastMaintenance: "April 30, 2023",
    nextMaintenance: "May 15, 2023",
    lanes: 6,
    currentClasses: 2,
    dimensions: "25m x 15m",
    depth: "1.2m - 2.5m",
    capacity: "30 swimmers",
    waterType: "Chlorinated",
    maintenanceHistory: [
      {
        id: 1,
        date: "April 30, 2023",
        type: "Regular Cleaning",
        description: "Weekly cleaning and chemical balance check",
        technician: "John Smith",
      },
      {
        id: 2,
        date: "April 15, 2023",
        type: "Filter Replacement",
        description: "Replaced pool filters and performed deep cleaning",
        technician: "Mike Johnson",
      },
      {
        id: 3,
        date: "March 30, 2023",
        type: "Regular Cleaning",
        description: "Weekly cleaning and chemical balance check",
        technician: "John Smith",
      },
    ],
    schedule: [
      {
        id: 1,
        title: "Beginner Swimming - Group A",
        instructor: "Sarah Johnson",
        time: "4:00 PM - 4:45 PM",
        days: "Monday, Wednesday",
        lanes: "1-2",
      },
      {
        id: 2,
        title: "Intermediate Techniques",
        instructor: "Michael Chen",
        time: "5:00 PM - 6:00 PM",
        days: "Tuesday, Thursday",
        lanes: "3-4",
      },
      {
        id: 3,
        title: "Open Swim",
        instructor: "N/A",
        time: "10:00 AM - 3:00 PM",
        days: "Monday - Friday",
        lanes: "5-6",
      },
    ],
    issues: [
      {
        id: 1,
        title: "Temperature Fluctuation",
        description:
          "Pool temperature varies by 2-3 degrees throughout the day",
        status: "Under Investigation",
        reportedDate: "May 2, 2023",
      },
    ],
  };

  return (
    <DashboardLayout userRole='admin'>
      <div className='mb-6'>
        <Link
          href='/dashboard/admin/pools'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Pools
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='flex items-center gap-3'>
          <div className='h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center'>
            <Droplets className='h-5 w-5 text-sky-600' />
          </div>
          <div>
            <h1 className='text-3xl font-bold'>{pool.name}</h1>
            <div className='flex items-center gap-2'>
              <Badge
                variant='outline'
                className={
                  pool.status === "Operational"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }
              >
                {pool.status}
              </Badge>
              <p className='text-muted-foreground'>
                Temperature: {pool.temperature}
              </p>
            </div>
          </div>
        </div>
        <div className='flex gap-2'>
          <Link href={`/dashboard/admin/pools/${pool.id}/schedule`}>
            <Button variant='outline'>
              <Calendar className='mr-2 h-4 w-4' />
              Manage Schedule
            </Button>
          </Link>
          <Link href={`/dashboard/admin/pools/${pool.id}/maintenance`}>
            <Button>
              <Wrench className='mr-2 h-4 w-4' />
              Schedule Maintenance
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        defaultValue='details'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-4'>
          {" "}
          <TabsTrigger value='details'>Chi Tiết</TabsTrigger>
          <TabsTrigger value='schedule'>Lịch Trình</TabsTrigger>
          <TabsTrigger value='maintenance'>Bảo Trì</TabsTrigger>
          <TabsTrigger value='issues'>Vấn Đề</TabsTrigger>
        </TabsList>
        <TabsContent
          value='details'
          className='space-y-6 mt-6'
        >
          <Card>
            <CardHeader>
              {" "}
              <CardTitle>Thông Tin Hồ Bơi</CardTitle>
              <CardDescription>
                Thông số chi tiết của {pool.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Dimensions</p>
                  <p className='text-sm text-muted-foreground'>
                    {pool.dimensions}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Depth</p>
                  <p className='text-sm text-muted-foreground'>{pool.depth}</p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Lanes</p>
                  <p className='text-sm text-muted-foreground'>
                    {pool.lanes} lanes
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Capacity</p>
                  <p className='text-sm text-muted-foreground'>
                    {pool.capacity}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Water Type</p>
                  <p className='text-sm text-muted-foreground'>
                    {pool.waterType}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Current Classes</p>
                  <p className='text-sm text-muted-foreground'>
                    {pool.currentClasses} active classes
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Last Maintenance</p>
                  <p className='text-sm text-muted-foreground'>
                    {pool.lastMaintenance}
                  </p>
                </div>
                <div className='space-y-1'>
                  <p className='text-sm font-medium'>Next Maintenance</p>
                  <p className='text-sm text-muted-foreground'>
                    {pool.nextMaintenance}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant='outline'>Edit Details</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent
          value='schedule'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Pool Schedule</h2>
            <Button>
              <Calendar className='mr-2 h-4 w-4' />
              Add Class
            </Button>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Class
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Instructor
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Time
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Days
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Lanes
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pool.schedule.map((item) => (
                      <tr
                        key={item.id}
                        className='border-b'
                      >
                        <td className='py-3 px-4 font-medium'>{item.title}</td>
                        <td className='py-3 px-4'>{item.instructor}</td>
                        <td className='py-3 px-4'>{item.time}</td>
                        <td className='py-3 px-4'>{item.days}</td>
                        <td className='py-3 px-4'>{item.lanes}</td>
                        <td className='py-3 px-4'>
                          <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                            >
                              Edit
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                            >
                              Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value='maintenance'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Maintenance History</h2>
            <Button>
              <Wrench className='mr-2 h-4 w-4' />
              Log Maintenance
            </Button>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Date
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Type
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Description
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Technician
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pool.maintenanceHistory.map((item) => (
                      <tr
                        key={item.id}
                        className='border-b'
                      >
                        <td className='py-3 px-4'>{item.date}</td>
                        <td className='py-3 px-4'>{item.type}</td>
                        <td className='py-3 px-4'>{item.description}</td>
                        <td className='py-3 px-4'>{item.technician}</td>
                        <td className='py-3 px-4'>
                          <Button
                            variant='outline'
                            size='sm'
                          >
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Maintenance</CardTitle>
              <CardDescription>
                Scheduled maintenance for {pool.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-4 p-4 border rounded-md'>
                <div className='h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center'>
                  <Calendar className='h-5 w-5 text-amber-600' />
                </div>
                <div className='flex-1'>
                  <p className='font-medium'>Regular Maintenance</p>
                  <p className='text-sm text-muted-foreground'>
                    Scheduled for {pool.nextMaintenance}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                  >
                    Reschedule
                  </Button>
                  <Button size='sm'>Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent
          value='issues'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Reported Issues</h2>
            <Button>
              <AlertTriangle className='mr-2 h-4 w-4' />
              Report Issue
            </Button>
          </div>
          {pool.issues.length > 0 ? (
            <div className='space-y-4'>
              {pool.issues.map((issue) => (
                <Card key={issue.id}>
                  <CardHeader>
                    <div className='flex justify-between items-center'>
                      <CardTitle className='flex items-center gap-2'>
                        <AlertTriangle className='h-5 w-5 text-amber-500' />
                        {issue.title}
                      </CardTitle>
                      <Badge
                        variant='outline'
                        className='bg-amber-50 text-amber-700 border-amber-200'
                      >
                        {issue.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      Reported on {issue.reportedDate}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>{issue.description}</p>
                  </CardContent>
                  <CardFooter className='flex gap-2'>
                    <Button variant='outline'>Mark as Resolved</Button>
                    <Button>Assign Technician</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-10'>
                <CheckCircle className='h-12 w-12 text-green-500 mb-4' />
                <p className='text-lg font-medium'>No Issues Reported</p>
                <p className='text-muted-foreground'>
                  This pool currently has no reported issues
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
