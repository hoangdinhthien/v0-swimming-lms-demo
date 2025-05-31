"use client";

import { useState, useEffect } from "react";
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
  Bell,
  Loader2,
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
import { getNews, formatRelativeTime, NewsItem } from "@/api/news-api";
import { withTenantGuard } from "@/components/tenant-provider";
import { TenantInfo } from "@/components/tenant-info";

function ManagerDashboardPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);

  // Fetch news when the component mounts
  useEffect(() => {
    async function fetchNews() {
      try {
        setIsLoadingNews(true);
        const news = await getNews();
        // Managers can see all notifications/news
        setNewsItems(news);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsLoadingNews(false);
      }
    }

    fetchNews();
  }, []);

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
        title: "Advanced Swimming",
        students: 28,
        instructors: 2,
        revenue: "$3,920",
        status: "Active",
      },
      {
        id: 3,
        title: "Water Safety",
        students: 36,
        instructors: 2,
        revenue: "$3,600",
        status: "Active",
      },
      {
        id: 4,
        title: "Competitive Training",
        students: 18,
        instructors: 1,
        revenue: "$2,160",
        status: "Active",
      },
    ],
    // We'll keep this as fallback in case API fails
    notifications: [
      {
        id: 1,
        title: "New Student Registration",
        description: "A new student has registered for Beginner Swimming",
        time: "3 hours ago",
      },
      {
        id: 2,
        title: "Instructor Absence",
        description: "Instructor John Smith has reported absence for tomorrow",
        time: "5 hours ago",
      },
      {
        id: 3,
        title: "Low Pool Chemical Levels",
        description: "Chlorine levels need to be checked in Pool 2",
        time: "Yesterday",
      },
    ],
    recentTransactions: [
      {
        id: 1,
        student: "Mai Tran",
        course: "Advanced Swimming",
        amount: "$140",
        date: "Today",
        status: "Completed",
      },
      {
        id: 2,
        student: "Duc Nguyen",
        course: "Beginner Swimming",
        amount: "$120",
        date: "Today",
        status: "Completed",
      },
      {
        id: 3,
        student: "Linh Pham",
        course: "Water Safety",
        amount: "$100",
        date: "Yesterday",
        status: "Completed",
      },
    ],
    upcomingClasses: [
      {
        id: 1,
        title: "Beginner Swimming - Group A",
        time: "9:00 AM - 10:00 AM",
        date: "Today",
        instructor: "Nguyen Van A",
        students: 12,
        pool: "Pool 1",
      },
      {
        id: 2,
        title: "Advanced Swimming - Group B",
        time: "10:30 AM - 12:00 PM",
        date: "Today",
        instructor: "Tran Thi B",
        students: 8,
        pool: "Pool 2",
      },
      {
        id: 3,
        title: "Water Safety Training",
        time: "2:00 PM - 3:30 PM",
        date: "Today",
        instructor: "Le Van C",
        students: 15,
        pool: "Pool 1",
      },
    ],
  };
  return (
    <>
      <TenantInfo />
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

      <Tabs defaultValue='overview'>
        <TabsList className='grid w-full grid-cols-3 md:w-auto'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='reports'>Reports</TabsTrigger>
        </TabsList>
        <TabsContent value='overview'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Students
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.totalStudents}
                </div>
                <p className='text-xs text-muted-foreground'>
                  +{manager.centerStats.weeklyNewRegistrations} from last week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Active Instructors
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.activeInstructors}
                </div>
                <p className='text-xs text-muted-foreground'>
                  All instructors currently active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Revenue
                </CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.totalRevenue}
                </div>
                <p className='text-xs text-muted-foreground'>
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Pool Utilization
                </CardTitle>
                <Waves className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.poolUtilization}
                </div>
                <p className='text-xs text-muted-foreground'>
                  +5% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>Course Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-8'>
                  <div className='space-y-2'>
                    <div className='flex items-center'>
                      <div className='text-sm font-medium'>Active Courses</div>
                      <div className='ml-auto'>{manager.courses.length}</div>
                    </div>
                    <div className='space-y-2'>
                      {manager.courses.map((course) => (
                        <div
                          key={course.id}
                          className='grid grid-cols-4 items-center gap-2'
                        >
                          <div className='text-sm font-medium'>
                            {course.title}
                          </div>
                          <div className='text-right text-sm'>
                            {course.students} students
                          </div>
                          <div className='text-right text-sm'>
                            {course.revenue}
                          </div>
                          <div className='text-right'>
                            <Badge variant='outline'>{course.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/courses'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      View All Courses
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>{" "}
            <Card className='lg:col-span-3'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Notifications</CardTitle>
                {isLoadingNews && (
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                )}
              </CardHeader>{" "}
              <CardContent>
                {isLoadingNews ? (
                  <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className='flex items-start gap-2 border-b pb-3'
                      >
                        <div className='mt-1 flex h-2 w-2 rounded-full bg-muted' />
                        <div className='flex flex-1 flex-col gap-1'>
                          <div className='h-4 w-3/4 rounded bg-muted' />
                          <div className='h-3 w-full rounded bg-muted' />
                          <div className='h-3 w-1/4 rounded bg-muted' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newsItems.length > 0 ? (
                  <div className='space-y-4'>
                    {/* Show only the 3 most recent notifications */}
                    {newsItems.slice(0, 3).map((newsItem) => (
                      <Link
                        key={newsItem._id}
                        href={`/dashboard/manager/notifications/${newsItem._id}`}
                        className='block'
                      >
                        <div className='flex items-start gap-2 border-b pb-3 last:border-0 hover:bg-muted/20 p-2 -mx-2 rounded-md transition-colors'>
                          <div className='mt-1 flex h-2 w-2 rounded-full bg-sky-500' />
                          <div className='flex flex-1 flex-col gap-1'>
                            <div className='text-sm font-medium'>
                              {newsItem.title}
                            </div>
                            <div className='text-xs text-muted-foreground line-clamp-2'>
                              {newsItem.content}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {formatRelativeTime(newsItem.created_at)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {manager.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className='flex items-start gap-2 border-b pb-3 last:border-0'
                      >
                        <div className='mt-1 flex h-2 w-2 rounded-full bg-sky-500' />
                        <div className='flex flex-1 flex-col gap-1'>
                          <div className='text-sm font-medium'>
                            {notification.title}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {notification.description}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {notification.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}{" "}
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/notifications'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      View All Notifications
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className='text-right'>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manager.recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.student}</TableCell>
                          <TableCell>{transaction.course}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell className='text-right'>
                            <Badge variant='outline'>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/transactions'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      View All Transactions
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>Upcoming Classes Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {manager.upcomingClasses.map((class_) => (
                    <div
                      key={class_.id}
                      className='flex flex-col gap-1 border-b pb-3 last:border-0'
                    >
                      <div className='flex justify-between'>
                        <div className='text-sm font-medium'>
                          {class_.title}
                        </div>
                        <Badge variant='outline'>{class_.pool}</Badge>
                      </div>
                      <div className='flex items-center gap-2 text-xs'>
                        <Calendar className='h-3 w-3' />
                        <span>
                          {class_.time} • {class_.date}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Instructor: {class_.instructor}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Students: {class_.students}
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/courses'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      View All Classes
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value='analytics'>
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='h-[300px] flex items-center justify-center border-2 border-dashed'>
                  <div className='text-center'>
                    <BarChart2 className='mx-auto h-12 w-12 text-muted-foreground' />
                    <h3 className='mt-2 text-xl font-semibold'>
                      Analytics Charts
                    </h3>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Visualize revenue and enrollment data
                    </p>
                    <Link href='/dashboard/manager/analytics'>
                      <Button className='mt-4'>
                        Go to Analytics
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Button>
                    </Link>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Classes</TableHead>
                      <TableHead className='text-right'>Growth</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>This Week</TableCell>
                      <TableCell>$3,245</TableCell>
                      <TableCell>24</TableCell>
                      <TableCell>42</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +12%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>This Month</TableCell>
                      <TableCell>$14,560</TableCell>
                      <TableCell>68</TableCell>
                      <TableCell>156</TableCell>
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
          </Card>{" "}
        </TabsContent>{" "}
      </Tabs>
    </>
  );
}

export default withTenantGuard(ManagerDashboardPage);
