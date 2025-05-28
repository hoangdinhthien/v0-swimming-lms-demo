"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Calendar,
  ChevronDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("monthly");
  const [yearFilter, setYearFilter] = useState("2025");

  // Mock analytics data
  const revenueData = [
    { period: "Jan", value: 12500 },
    { period: "Feb", value: 11200 },
    { period: "Mar", value: 13800 },
    { period: "Apr", value: 14500 },
    { period: "May", value: 15240 },
    { period: "Jun", value: 0 },
    { period: "Jul", value: 0 },
    { period: "Aug", value: 0 },
    { period: "Sep", value: 0 },
    { period: "Oct", value: 0 },
    { period: "Nov", value: 0 },
    { period: "Dec", value: 0 },
  ];

  const enrollmentData = [
    { period: "Jan", value: 124 },
    { period: "Feb", value: 98 },
    { period: "Mar", value: 132 },
    { period: "Apr", value: 145 },
    { period: "May", value: 156 },
    { period: "Jun", value: 0 },
    { period: "Jul", value: 0 },
    { period: "Aug", value: 0 },
    { period: "Sep", value: 0 },
    { period: "Oct", value: 0 },
    { period: "Nov", value: 0 },
    { period: "Dec", value: 0 },
  ];

  const coursePopularityData = [
    { name: "Beginner Swimming", students: 42, revenue: 5040 },
    { name: "Intermediate Techniques", students: 28, revenue: 4200 },
    { name: "Advanced Performance", students: 15, revenue: 3000 },
    { name: "Water Safety", students: 35, revenue: 2800 },
    { name: "Parent & Child Swimming", students: 18, revenue: 2160 },
  ];

  const instructorPerformanceData = [
    { name: "Sarah Johnson", students: 32, rating: 4.9, revenue: 3840 },
    { name: "Michael Chen", students: 18, rating: 4.8, revenue: 3600 },
    { name: "Emma Rodriguez", students: 25, rating: 4.7, revenue: 3000 },
    { name: "David Wilson", students: 20, rating: 4.6, revenue: 2400 },
    { name: "Lisa Thompson", students: 22, rating: 4.5, revenue: 2640 },
  ];

  const poolUtilizationData = [
    { pool: "Main Pool", utilization: 78, hours: 42, revenue: 6720 },
    { pool: "Training Pool", utilization: 65, hours: 38, revenue: 5320 },
    { pool: "Kids Pool", utilization: 82, hours: 36, revenue: 3240 },
  ];

  // Calculate year-to-date totals
  const ytdRevenue = revenueData.reduce((sum, item) => sum + item.value, 0);
  const ytdEnrollments = enrollmentData.reduce(
    (sum, item) => sum + item.value,
    0
  );
  const averageCourseSize = Math.round(
    ytdEnrollments / coursePopularityData.length
  );

  // Find top performing course and instructor
  const topCourse = [...coursePopularityData].sort(
    (a, b) => b.revenue - a.revenue
  )[0];
  const topInstructor = [...instructorPerformanceData].sort(
    (a, b) => b.rating - a.rating
  )[0];
  return (
    <DashboardLayout userRole='manager'>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Analytics & Reports</h1>
          <p className='text-muted-foreground'>
            Track performance metrics and generate reports
          </p>
        </div>
        <div className='flex gap-2'>
          <Select
            value={timeframe}
            onValueChange={setTimeframe}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Time Period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='daily'>Daily View</SelectItem>
              <SelectItem value='weekly'>Weekly View</SelectItem>
              <SelectItem value='monthly'>Monthly View</SelectItem>
              <SelectItem value='quarterly'>Quarterly View</SelectItem>
              <SelectItem value='yearly'>Yearly View</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={yearFilter}
            onValueChange={setYearFilter}
          >
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='Year' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='2025'>2025</SelectItem>
              <SelectItem value='2024'>2024</SelectItem>
              <SelectItem value='2023'>2023</SelectItem>
            </SelectContent>
          </Select>

          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Revenue (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ${ytdRevenue.toLocaleString()}
            </div>
            <p className='text-xs text-green-600 mt-1'>+15% from last year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Enrollments (YTD)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{ytdEnrollments}</div>
            <p className='text-xs text-green-600 mt-1'>+23% from last year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg. Course Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {averageCourseSize} students
            </div>
            <p className='text-xs text-green-600 mt-1'>+5% from last year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg. Pool Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round(
                poolUtilizationData.reduce(
                  (sum, pool) => sum + pool.utilization,
                  0
                ) / poolUtilizationData.length
              )}
              %
            </div>
            <p className='text-xs text-green-600 mt-1'>+8% from last year</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue='revenue'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='revenue'>Revenue</TabsTrigger>
          <TabsTrigger value='enrollments'>Enrollments</TabsTrigger>
          <TabsTrigger value='courses'>Courses</TabsTrigger>
          <TabsTrigger value='instructors'>Instructors</TabsTrigger>
          <TabsTrigger value='pools'>Pool Usage</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent
          value='revenue'
          className='space-y-6 mt-6'
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview ({yearFilter})</CardTitle>
              <CardDescription>Monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent className='h-80 flex items-center justify-center'>
              <div className='w-full'>
                <div className='flex h-60 items-end gap-2'>
                  {revenueData.map((item, index) => (
                    <div
                      key={index}
                      className='relative flex-1 bg-blue-600 rounded-t hover:bg-blue-500 transition-colors'
                      style={{
                        height: `${
                          (item.value /
                            Math.max(...revenueData.map((d) => d.value))) *
                          100
                        }%`,
                        minHeight: item.value > 0 ? "20px" : "5px",
                      }}
                    >
                      <div className='absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-medium'>
                        ${(item.value / 1000).toFixed(1)}k
                      </div>
                    </div>
                  ))}
                </div>
                <div className='flex gap-2 mt-2'>
                  {revenueData.map((item, index) => (
                    <div
                      key={index}
                      className='flex-1 text-center text-xs'
                    >
                      {item.period}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Course Type</CardTitle>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <div className='text-center'>
                    <p className='text-sm'>
                      Course type revenue breakdown chart
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Payment Method</CardTitle>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <div className='text-center'>
                    <p className='text-sm'>Payment method breakdown chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enrollments Tab */}
        <TabsContent
          value='enrollments'
          className='space-y-6 mt-6'
        >
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Overview ({yearFilter})</CardTitle>
              <CardDescription>Monthly enrollment numbers</CardDescription>
            </CardHeader>
            <CardContent className='h-80 flex items-center justify-center'>
              <div className='w-full'>
                <div className='flex h-60 items-end gap-2'>
                  {enrollmentData.map((item, index) => (
                    <div
                      key={index}
                      className='relative flex-1 bg-green-600 rounded-t hover:bg-green-500 transition-colors'
                      style={{
                        height: `${
                          (item.value /
                            Math.max(...enrollmentData.map((d) => d.value))) *
                          100
                        }%`,
                        minHeight: item.value > 0 ? "20px" : "5px",
                      }}
                    >
                      <div className='absolute -top-7 left-1/2 -translate-x-1/2 text-xs font-medium'>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className='flex gap-2 mt-2'>
                  {enrollmentData.map((item, index) => (
                    <div
                      key={index}
                      className='flex-1 text-center text-xs'
                    >
                      {item.period}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Student Age Distribution</CardTitle>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <div className='text-center'>
                    <p className='text-sm'>Age distribution chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New vs Returning Students</CardTitle>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <div className='text-center'>
                    <p className='text-sm'>
                      New vs returning student breakdown
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent
          value='courses'
          className='space-y-6 mt-6'
        >
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Course Popularity</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      <Filter className='h-4 w-4 mr-1' />
                      Sort By
                      <ChevronDown className='h-4 w-4 ml-1' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem>Students (High to Low)</DropdownMenuItem>
                    <DropdownMenuItem>Students (Low to High)</DropdownMenuItem>
                    <DropdownMenuItem>Revenue (High to Low)</DropdownMenuItem>
                    <DropdownMenuItem>Revenue (Low to High)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {coursePopularityData.map((course, index) => (
                  <div
                    key={index}
                    className='space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>{course.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {course.students} students enrolled
                        </p>
                      </div>
                      <p className='font-medium'>${course.revenue}</p>
                    </div>
                    <div className='h-2 rounded-full bg-slate-100 overflow-hidden'>
                      <div
                        className='h-full bg-blue-600 rounded-full'
                        style={{
                          width: `${
                            (course.students /
                              Math.max(
                                ...coursePopularityData.map((c) => c.students)
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-6 md:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Course</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-2xl font-bold'>{topCourse.name}</p>
                    <p className='text-muted-foreground mt-1'>
                      {topCourse.students} students enrolled
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold'>${topCourse.revenue}</p>
                    <p className='text-green-600 text-sm'>Top Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Fill Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-4'>
                  <p className='text-4xl font-bold'>86%</p>
                  <p className='text-muted-foreground mt-1'>
                    Course capacity utilization
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-4'>
                  <p className='text-4xl font-bold'>92%</p>
                  <p className='text-muted-foreground mt-1'>
                    Students completing courses
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent
          value='instructors'
          className='space-y-6 mt-6'
        >
          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Instructor Performance</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      <Filter className='h-4 w-4 mr-1' />
                      Sort By
                      <ChevronDown className='h-4 w-4 ml-1' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem>Rating (High to Low)</DropdownMenuItem>
                    <DropdownMenuItem>Students (High to Low)</DropdownMenuItem>
                    <DropdownMenuItem>Revenue (High to Low)</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {instructorPerformanceData.map((instructor, index) => (
                  <div
                    key={index}
                    className='space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>{instructor.name}</p>
                        <div className='flex items-center gap-2'>
                          <div className='text-xs text-amber-500'>
                            ★ {instructor.rating}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {instructor.students} students
                          </div>
                        </div>
                      </div>
                      <p className='font-medium'>${instructor.revenue}</p>
                    </div>
                    <div className='h-2 rounded-full bg-slate-100 overflow-hidden'>
                      <div
                        className='h-full bg-amber-500 rounded-full'
                        style={{
                          width: `${(instructor.rating / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-6 md:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle>Top Rated Instructor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-2xl font-bold'>{topInstructor.name}</p>
                    <p className='text-amber-500 font-medium mt-1'>
                      ★ {topInstructor.rating}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold'>
                      {topInstructor.students}
                    </p>
                    <p className='text-muted-foreground text-sm'>Students</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructor Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-4'>
                  <p className='text-4xl font-bold'>4.7</p>
                  <p className='text-muted-foreground mt-1'>
                    Average rating across all instructors
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructor Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center py-4'>
                  <p className='text-4xl font-bold'>94%</p>
                  <p className='text-muted-foreground mt-1'>
                    Year-over-year retention rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pools Tab */}
        <TabsContent
          value='pools'
          className='space-y-6 mt-6'
        >
          <Card>
            <CardHeader>
              <CardTitle>Pool Utilization</CardTitle>
              <CardDescription>Utilization rates by pool</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {poolUtilizationData.map((pool, index) => (
                  <div
                    key={index}
                    className='space-y-2'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>{pool.pool}</p>
                        <div className='flex items-center gap-2'>
                          <div className='text-xs text-muted-foreground'>
                            {pool.hours} hours/week
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            ${pool.revenue} revenue
                          </div>
                        </div>
                      </div>
                      <p className='font-medium'>{pool.utilization}%</p>
                    </div>
                    <div className='h-2 rounded-full bg-slate-100 overflow-hidden'>
                      <div
                        className='h-full bg-cyan-500 rounded-full'
                        style={{
                          width: `${pool.utilization}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Pool Availability</CardTitle>
                <CardDescription>
                  Hours available vs hours booked
                </CardDescription>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <div className='text-center'>
                    <p className='text-sm'>Pool availability chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Impact</CardTitle>
                <CardDescription>
                  Revenue loss due to maintenance closures
                </CardDescription>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <div className='text-center'>
                    <p className='text-sm'>Maintenance impact chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
