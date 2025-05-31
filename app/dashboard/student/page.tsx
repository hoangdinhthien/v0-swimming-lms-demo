"use client";

import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Waves,
  User,
  BookOpen,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
  Bell,
  CreditCard,
  FileText,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout-v2";
import RoleGuard from "@/components/role-guard";
import { withTenantGuard } from "@/components/tenant-provider";

function StudentDashboardPage() {
  const [progress, setProgress] = useState({
    "Beginner Swimming": 45,
    "Water Safety": 80,
  });

  // Mock user data
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "Student",
    enrolledCourses: [
      {
        id: 1,
        title: "Beginner Swimming",
        progress: progress["Beginner Swimming"],
        nextLesson: "Tomorrow, 4:00 PM",
        instructor: "Sarah Williams",
        location: "Main Pool - Lane 1",
      },
      {
        id: 2,
        title: "Water Safety",
        progress: progress["Water Safety"],
        nextLesson: "Friday, 5:30 PM",
        instructor: "Michael Chen",
        location: "Training Pool",
      },
    ],
    completedModules: [
      "Water Comfort and Safety",
      "Floating and Gliding",
      "Basic Kicking Techniques",
    ],
    upcomingLessons: [
      {
        id: 1,
        title: "Arm Movements for Freestyle",
        date: "May 7, 2023",
        time: "4:00 PM - 4:45 PM",
        instructor: "Sarah Williams",
        course: "Beginner Swimming",
        location: "Main Pool - Lane 1",
      },
      {
        id: 2,
        title: "Rescue Techniques",
        date: "May 10, 2023",
        time: "5:30 PM - 6:15 PM",
        instructor: "Michael Chen",
        course: "Water Safety",
        location: "Training Pool",
      },
      {
        id: 3,
        title: "Breathing Techniques",
        date: "May 14, 2023",
        time: "4:00 PM - 4:45 PM",
        instructor: "Sarah Williams",
        course: "Beginner Swimming",
        location: "Main Pool - Lane 1",
      },
    ],
    achievements: [
      {
        id: 1,
        title: "First Dive",
        description: "Successfully completed your first dive",
        date: "April 15, 2023",
      },
      {
        id: 2,
        title: "25m Freestyle",
        description: "Swam 25 meters using freestyle technique",
        date: "April 22, 2023",
      },
      {
        id: 3,
        title: "Water Safety Basics",
        description: "Completed the water safety basics module",
        date: "April 29, 2023",
      },
    ],
    notifications: [
      {
        id: 1,
        title: "Upcoming Lesson Reminder",
        message:
          "Your 'Arm Movements for Freestyle' lesson is tomorrow at 4:00 PM",
        date: "May 6, 2023",
        read: false,
      },
      {
        id: 2,
        title: "New Feedback Available",
        message: "Sarah Williams has provided feedback on your last lesson",
        date: "May 5, 2023",
        read: true,
      },
      {
        id: 3,
        title: "Pool Maintenance Notice",
        message: "The Main Pool will be closed for maintenance on May 20, 2023",
        date: "May 4, 2023",
        read: true,
      },
    ],
    payments: [
      {
        id: 1,
        course: "Beginner Swimming",
        amount: "$120.00",
        date: "April 1, 2023",
        status: "Paid",
      },
      {
        id: 2,
        course: "Water Safety",
        amount: "$80.00",
        date: "April 15, 2023",
        status: "Paid",
      },
    ],
  };

  return (
    <RoleGuard
      allowedRoles={["student"]}
      fallbackUrl='/dashboard'
    >
      <DashboardLayout userRole='student'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            {" "}
            <h1 className='text-3xl font-bold'>Bảng Điều Khiển Học Viên</h1>
            <p className='text-muted-foreground'>
              Chào mừng trở lại, {user.name}!
            </p>
          </div>
          <div className='flex gap-2'>
            <Link href='/courses'>
              <Button variant='outline'>
                {" "}
                <BookOpen className='mr-2 h-4 w-4' />
                Duyệt Khóa Học
              </Button>
            </Link>
            <Link href='/dashboard/student/notifications'>
              <Button
                variant='outline'
                className='relative'
              >
                <Bell className='h-4 w-4' />
                {user.notifications.filter((n) => !n.read).length > 0 && (
                  <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white'>
                    {user.notifications.filter((n) => !n.read).length}
                  </span>
                )}
                <span className='sr-only'>Thông báo</span>
              </Button>
            </Link>
          </div>
        </div>
        <div className='grid gap-6 mt-8 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              {" "}
              <CardTitle className='text-sm font-medium'>
                Khóa Học Đã Đăng Ký
              </CardTitle>
              <BookOpen className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {user.enrolledCourses.length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Khóa học đang tham gia
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              {" "}
              <CardTitle className='text-sm font-medium'>
                Bài Học Sắp Tới
              </CardTitle>
              <Calendar className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {user.upcomingLessons.length}
              </div>
              <p className='text-xs text-muted-foreground'>
                Buổi học đã lên lịch
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium'>
                Achievements
              </CardTitle>
              <Award className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {user.achievements.length}
              </div>
              <p className='text-xs text-muted-foreground'>Earned badges</p>
            </CardContent>
          </Card>
        </div>
        <Tabs
          defaultValue='progress'
          className='mt-8'
        >
          <TabsList className='grid w-full grid-cols-5'>
            {" "}
            <TabsTrigger value='progress'>Tiến Độ Của Tôi</TabsTrigger>
            <TabsTrigger value='schedule'>Lịch Học</TabsTrigger>
            <TabsTrigger value='achievements'>Thành Tích</TabsTrigger>
            <TabsTrigger value='payments'>Thanh Toán</TabsTrigger>
            <TabsTrigger value='notifications'>Thông Báo</TabsTrigger>
          </TabsList>
          <TabsContent
            value='progress'
            className='space-y-6 mt-6'
          >
            <h2 className='text-xl font-bold'>Course Progress</h2>
            {user.enrolledCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>
                    Instructor: {course.instructor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Progress</span>
                      <span className='font-medium'>{course.progress}%</span>
                    </div>
                    <Progress
                      value={course.progress}
                      className='h-2'
                    />
                  </div>
                  <div className='mt-4 space-y-2'>
                    <h4 className='text-sm font-medium'>Completed Modules</h4>
                    <ul className='space-y-1'>
                      {user.completedModules.map((module, index) => (
                        <li
                          key={index}
                          className='text-sm flex items-center gap-2'
                        >
                          <CheckCircle2 className='h-4 w-4 text-green-500' />
                          {module}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className='flex justify-between'>
                  <div className='text-sm'>
                    <span className='font-medium'>Next Lesson:</span>{" "}
                    {course.nextLesson}
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      View Course
                    </Button>
                    {course.progress === 100 && (
                      <Button size='sm'>
                        <FileText className='mr-2 h-4 w-4' />
                        Get Certificate
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </TabsContent>
          <TabsContent
            value='schedule'
            className='space-y-6 mt-6'
          >
            <h2 className='text-xl font-bold'>Upcoming Lessons</h2>
            <div className='space-y-4'>
              {user.upcomingLessons.map((lesson) => (
                <Card key={lesson.id}>
                  <CardHeader>
                    <CardTitle>{lesson.title}</CardTitle>
                    <CardDescription>{lesson.course}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='grid gap-2 md:grid-cols-2'>
                      <div className='flex items-center gap-2'>
                        <Calendar className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm'>{lesson.date}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Clock className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm'>{lesson.time}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm'>
                          Instructor: {lesson.instructor}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Waves className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm'>
                          Location: {lesson.location}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      Add to Calendar
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      Request Reschedule
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent
            value='achievements'
            className='space-y-6 mt-6'
          >
            <h2 className='text-xl font-bold'>Your Achievements</h2>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {user.achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardHeader className='pb-2'>
                    <div className='flex justify-center mb-2'>
                      <div className='w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center'>
                        <Award className='h-8 w-8 text-sky-600' />
                      </div>
                    </div>
                    <CardTitle className='text-center'>
                      {achievement.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-center text-muted-foreground'>
                      {achievement.description}
                    </p>
                  </CardContent>
                  <CardFooter className='flex justify-center pt-0'>
                    <p className='text-xs text-muted-foreground'>
                      Earned on {achievement.date}
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent
            value='payments'
            className='space-y-6 mt-6'
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-bold'>Payment History</h2>
              <Button>
                <CreditCard className='mr-2 h-4 w-4' />
                Make Payment
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  View your payment history and receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {user.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className='flex items-center justify-between border-b pb-4'
                    >
                      <div>
                        <p className='font-medium'>{payment.course}</p>
                        <p className='text-sm text-muted-foreground'>
                          {payment.date}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>{payment.amount}</p>
                        <Badge
                          variant='outline'
                          className='bg-green-50 text-green-700 border-green-200'
                        >
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant='outline'
                  size='sm'
                >
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>{" "}
          <TabsContent
            value='notifications'
            className='space-y-6 mt-6'
          >
            <h2 className='text-xl font-bold'>Thông Báo</h2>
            <Card>
              <CardContent className='pt-6'>
                <div className='space-y-4'>
                  {user.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 border-b pb-4 ${
                        !notification.read ? "bg-sky-50 p-3 rounded-md" : ""
                      }`}
                    >
                      <Bell
                        className={`h-5 w-5 mt-0.5 ${
                          !notification.read
                            ? "text-sky-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div className='flex-1'>
                        <div className='flex items-center justify-between'>
                          <p className='font-medium'>{notification.title}</p>
                          <p className='text-xs text-muted-foreground'>
                            {notification.date}
                          </p>
                        </div>
                        <p className='text-sm mt-1'>{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <Badge className='bg-sky-100 text-sky-700 hover:bg-sky-200 cursor-pointer'>
                          Mark as read
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant='outline'
                  size='sm'
                >
                  Mark All as Read
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>{" "}
      </DashboardLayout>
    </RoleGuard>
  );
}

export default withTenantGuard(StudentDashboardPage);
