"use client";

import { useState } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function ManagerDashboardPage() {
  // Mock manager data
  const manager = {
    name: "Manager User",
    email: "manager@example.com",
    role: "Manager",
    centerStats: {
      totalStudents: 156,
      activeInstructors: 8,
      activeCourses: 12,
      totalRevenue: "$15,240",
      poolUtilization: "78%",
      weeklyNewRegistrations: 24,
    },
    courses: [
      {
        id: 1,
        title: "Beginner Swimming",
        students: 42,
        instructors: 3,
        revenue: "$5,040",
        status: "Active",
      },
      {
        id: 2,
        title: "Intermediate Techniques",
        students: 28,
        instructors: 2,
        revenue: "$4,200",
        status: "Active",
      },
      {
        id: 3,
        title: "Advanced Performance",
        students: 15,
        instructors: 1,
        revenue: "$3,000",
        status: "Active",
      },
      {
        id: 4,
        title: "Water Safety",
        students: 35,
        instructors: 2,
        revenue: "$2,800",
        status: "Active",
      },
    ],
    instructors: [
      {
        id: 1,
        name: "Sarah Johnson",
        specialty: "Beginners, Water Safety",
        students: 32,
        classes: 3,
        rating: 4.9,
        avatar: "/placeholder.svg?height=40&width=40&text=SJ",
      },
      {
        id: 2,
        name: "Michael Chen",
        specialty: "Competition Swimming, Advanced Techniques",
        students: 18,
        classes: 2,
        rating: 4.8,
        avatar: "/placeholder.svg?height=40&width=40&text=MC",
      },
      {
        id: 3,
        name: "Emma Rodriguez",
        specialty: "Children's Swimming, Technique Development",
        students: 25,
        classes: 2,
        rating: 4.7,
        avatar: "/placeholder.svg?height=40&width=40&text=ER",
      },
    ],
    recentTransactions: [
      {
        id: 1,
        student: "Alex Johnson",
        course: "Beginner Swimming",
        amount: "$120.00",
        date: "May 22, 2025",
        status: "Completed",
      },
      {
        id: 2,
        student: "Emma Wilson",
        course: "Intermediate Techniques",
        amount: "$150.00",
        date: "May 21, 2025",
        status: "Completed",
      },
      {
        id: 3,
        student: "Michael Brown",
        course: "Water Safety",
        amount: "$80.00",
        date: "May 20, 2025",
        status: "Completed",
      },
      {
        id: 4,
        student: "Sophia Lee",
        course: "Advanced Performance",
        amount: "$200.00",
        date: "May 19, 2025",
        status: "Pending",
      },
      {
        id: 5,
        student: "Oliver Garcia",
        course: "Beginner Swimming",
        amount: "$120.00",
        date: "May 18, 2025",
        status: "Completed",
      },
    ],
    activePromotions: [
      {
        id: 1,
        code: "SUMMER2025",
        title: "Summer Special",
        discount: "20% off",
        endDate: "Aug 31, 2025",
        usageCount: "45/100",
      },
      {
        id: 2,
        code: "WELCOME10",
        title: "New Student Discount",
        discount: "10% off",
        endDate: "Dec 31, 2025",
        usageCount: "210/500",
      },
    ],
  };
  return (
    <DashboardLayout userRole='manager'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Manager Dashboard</h1>
          <p className='text-muted-foreground'>Welcome back, {manager.name}!</p>
        </div>
        <div className='flex gap-2'>
          <Link href='/dashboard/manager/reports'>
            <Button variant='outline'>
              <FileText className='mr-2 h-4 w-4' />
              Reports
            </Button>
          </Link>
          <Link href='/dashboard/manager/settings'>
            <Button variant='outline'>
              <Settings className='mr-2 h-4 w-4' />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-6 mt-8 md:grid-cols-3 lg:grid-cols-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Students
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {manager.centerStats.totalStudents}
            </div>
            <p className='text-xs text-muted-foreground'>Registered students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Instructors
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {manager.centerStats.activeInstructors}
            </div>
            <p className='text-xs text-muted-foreground'>Teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Courses
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {manager.centerStats.activeCourses}
            </div>
            <p className='text-xs text-muted-foreground'>Running courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {manager.centerStats.totalRevenue}
            </div>
            <p className='text-xs text-muted-foreground'>This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pool Utilization
            </CardTitle>
            <Waves className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {manager.centerStats.poolUtilization}
            </div>
            <p className='text-xs text-muted-foreground'>Average utilization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>New Sign Ups</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {manager.centerStats.weeklyNewRegistrations}
            </div>
            <p className='text-xs text-muted-foreground'>This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs
        defaultValue='overview'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='courses'>Courses</TabsTrigger>
          <TabsTrigger value='instructors'>Instructors</TabsTrigger>
          <TabsTrigger value='transactions'>Transactions</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent
          value='overview'
          className='space-y-6 mt-6'
        >
          <div className='grid gap-6 md:grid-cols-2'>
            {/* Recent Transactions */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Recent Transactions</CardTitle>
                <Link
                  href='/dashboard/manager/transactions'
                  className='text-sm text-blue-600 hover:underline flex items-center'
                >
                  View All
                  <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </CardHeader>
              <CardContent>
                <div className='rounded-md border overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manager.recentTransactions
                        .slice(0, 3)
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{transaction.student}</TableCell>
                            <TableCell>{transaction.course}</TableCell>
                            <TableCell>{transaction.amount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  transaction.status === "Completed"
                                    ? "outline"
                                    : "secondary"
                                }
                                className={
                                  transaction.status === "Completed"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Active Promotions */}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Active Promotions</CardTitle>
                <Link
                  href='/dashboard/manager/promotions'
                  className='text-sm text-blue-600 hover:underline flex items-center'
                >
                  Manage
                  <ArrowRight className='ml-1 h-4 w-4' />
                </Link>
              </CardHeader>
              <CardContent>
                {manager.activePromotions.map((promo) => (
                  <div
                    key={promo.id}
                    className='flex items-center justify-between border-b py-3 last:border-0 last:pb-0 first:pt-0'
                  >
                    <div>
                      <div className='font-medium'>{promo.title}</div>
                      <div className='text-sm text-muted-foreground'>
                        Code: {promo.code}
                      </div>
                    </div>
                    <div className='flex flex-col items-end'>
                      <Badge
                        variant='outline'
                        className='bg-blue-50 text-blue-700 border-blue-200'
                      >
                        {promo.discount}
                      </Badge>
                      <div className='text-xs text-muted-foreground mt-1'>
                        {promo.usageCount} used
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant='outline'
                  className='w-full mt-4'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Create Promotion
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Preview */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Revenue Overview</CardTitle>
              <Link
                href='/dashboard/manager/analytics'
                className='text-sm text-blue-600 hover:underline flex items-center'
              >
                Full Analytics
                <ArrowRight className='ml-1 h-4 w-4' />
              </Link>
            </CardHeader>
            <CardContent className='h-80 flex items-center justify-center'>
              <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                <BarChart2 className='h-16 w-16' />
                <div className='text-center'>
                  <p className='font-medium'>Revenue Analytics Chart</p>
                  <p className='text-sm'>
                    Monthly revenue visualization would appear here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent
          value='courses'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Course Management</h2>
            <Link href='/dashboard/manager/courses/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Create Course
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Instructors</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manager.courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className='font-medium'>
                          {course.title}
                        </TableCell>
                        <TableCell>{course.students}</TableCell>
                        <TableCell>{course.instructors}</TableCell>
                        <TableCell>{course.revenue}</TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className='bg-green-50 text-green-700 border-green-200'
                          >
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Link
                            href={`/dashboard/manager/courses/${course.id}`}
                          >
                            <Button
                              variant='ghost'
                              size='sm'
                            >
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Instructors Tab */}
        <TabsContent
          value='instructors'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Instructor Management</h2>
            <Link href='/dashboard/manager/instructors/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Add Instructor
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manager.instructors.map((instructor) => (
                      <TableRow key={instructor.id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <img
                              src={instructor.avatar}
                              alt={instructor.name}
                              className='h-8 w-8 rounded-full'
                            />
                            <span className='font-medium'>
                              {instructor.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{instructor.specialty}</TableCell>
                        <TableCell>{instructor.students}</TableCell>
                        <TableCell>{instructor.classes}</TableCell>
                        <TableCell>★ {instructor.rating}</TableCell>
                        <TableCell className='text-right'>
                          <Link
                            href={`/dashboard/manager/instructors/${instructor.id}`}
                          >
                            <Button
                              variant='ghost'
                              size='sm'
                            >
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent
          value='transactions'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Transaction History</h2>
            <Link href='/dashboard/manager/transactions/export'>
              <Button variant='outline'>
                <FileText className='mr-2 h-4 w-4' />
                Export Data
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manager.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className='font-medium'>
                          {transaction.student}
                        </TableCell>
                        <TableCell>{transaction.course}</TableCell>
                        <TableCell>{transaction.amount}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "Completed"
                                ? "outline"
                                : "secondary"
                            }
                            className={
                              transaction.status === "Completed"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Link
                            href={`/dashboard/manager/transactions/${transaction.id}`}
                          >
                            <Button
                              variant='ghost'
                              size='sm'
                            >
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent
          value='analytics'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Analytics & Reports</h2>
            <div className='flex gap-2'>
              <Link href='/dashboard/manager/analytics/reports'>
                <Button variant='outline'>
                  <FileText className='mr-2 h-4 w-4' />
                  Generate Report
                </Button>
              </Link>
              <Button>
                <FileText className='mr-2 h-4 w-4' />
                Export Data
              </Button>
            </div>
          </div>

          {/* Analytics Cards */}
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent className='h-60 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <BarChart2 className='h-12 w-12' />
                  <div className='text-center'>
                    <p className='text-sm'>Revenue chart visualization</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Popularity</CardTitle>
              </CardHeader>
              <CardContent className='h-60 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <BarChart2 className='h-12 w-12' />
                  <div className='text-center'>
                    <p className='text-sm'>Course enrollment chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Growth</CardTitle>
              </CardHeader>
              <CardContent className='h-60 flex items-center justify-center'>
                <div className='flex items-center flex-col gap-2 text-muted-foreground'>
                  <BarChart2 className='h-12 w-12' />
                  <div className='text-center'>
                    <p className='text-sm'>Student growth chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Time Period Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Time Period Comparison</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>New Students</TableHead>
                      <TableHead className='text-right'>Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>Today</TableCell>
                      <TableCell>$420</TableCell>
                      <TableCell>8</TableCell>
                      <TableCell>3</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +12%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>This Week</TableCell>
                      <TableCell>$2,140</TableCell>
                      <TableCell>24</TableCell>
                      <TableCell>14</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +8%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>This Month</TableCell>
                      <TableCell>$15,240</TableCell>
                      <TableCell>156</TableCell>
                      <TableCell>42</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +23%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>This Year</TableCell>
                      <TableCell>$124,580</TableCell>
                      <TableCell>1,245</TableCell>
                      <TableCell>312</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +45%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
