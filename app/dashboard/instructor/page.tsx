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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Bell,
  FileText,
  MessageSquare,
  Search,
  Filter,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

export default function InstructorDashboardPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  // Mock instructor data
  const instructor = {
    name: "Sarah Johnson",
    email: "sarah@example.com",
    role: "Giáo Viên",
    specialty: "Bơi cho người mới bắt đầu, An toàn dưới nước",
    classes: [
      {
        id: 1,
        title: "Bơi cho người mới bắt đầu - Nhóm A",
        students: 8,
        nextSession: "Hôm nay, 16:00",
        location: "Hồ Bơi Chính - Làn 1-2",
        progress: 45,
      },
      {
        id: 2,
        title: "An toàn dưới nước - Nhóm B",
        students: 6,
        nextSession: "Ngày mai, 17:30",
        location: "Hồ Bơi Huấn Luyện",
        progress: 80,
      },
      {
        id: 3,
        title: "Bơi Phụ Huynh & Trẻ Em",
        students: 5,
        nextSession: "Thứ Sáu, 10:00",
        location: "Hồ Bơi Nông",
        progress: 30,
      },
    ],
    upcomingSessions: [
      {
        id: 1,
        title: "Bơi cho người mới bắt đầu - Nhóm A",
        date: "7 tháng 5, 2023",
        time: "16:00 - 16:45",
        location: "Hồ Bơi Chính - Làn 1-2",
        students: 8,
      },
      {
        id: 2,
        title: "An toàn dưới nước - Nhóm B",
        date: "8 tháng 5, 2023",
        time: "17:30 - 18:15",
        location: "Hồ Bơi Huấn Luyện",
        students: 6,
      },
      {
        id: 3,
        title: "Bơi Phụ Huynh & Trẻ Em",
        date: "10 tháng 5, 2023",
        time: "10:00 - 10:45",
        location: "Hồ Bơi Nông",
        students: 5,
      },
    ],
    students: [
      {
        id: 1,
        name: "Alex Johnson",
        age: 8,
        course: "Beginner Swimming - Group A",
        progress: 45,
        attendance: "90%",
        lastAttended: "May 3, 2023",
        avatar: "/placeholder.svg?height=40&width=40&text=AJ",
      },
      {
        id: 2,
        name: "Emma Wilson",
        age: 7,
        course: "Beginner Swimming - Group A",
        progress: 50,
        attendance: "100%",
        lastAttended: "May 3, 2023",
        avatar: "/placeholder.svg?height=40&width=40&text=EW",
      },
      {
        id: 3,
        name: "Michael Chen",
        age: 9,
        course: "Beginner Swimming - Group A",
        progress: 40,
        attendance: "85%",
        lastAttended: "May 3, 2023",
        avatar: "/placeholder.svg?height=40&width=40&text=MC",
      },
      {
        id: 4,
        name: "Sophia Rodriguez",
        age: 25,
        course: "An toàn dưới nước - Nhóm B",
        progress: 75,
        attendance: "95%",
        lastAttended: "2 tháng 5, 2023",
        avatar: "/placeholder.svg?height=40&width=40&text=SR",
      },
      {
        id: 5,
        name: "James Taylor",
        age: 30,
        course: "An toàn dưới nước - Nhóm B",
        progress: 85,
        attendance: "100%",
        lastAttended: "2 tháng 5, 2023",
        avatar: "/placeholder.svg?height=40&width=40&text=JT",
      },
    ],
    notifications: [
      {
        id: 1,
        title: "Thay Đổi Lịch Học",
        message:
          "Lớp 'An toàn dưới nước - Nhóm B' vào ngày 15 tháng 5 đã được chuyển đến 18:00",
        date: "6 tháng 5, 2023",
        read: false,
      },
      {
        id: 2,
        title: "Học Viên Mới Đăng Ký",
        message:
          "Một học viên mới đã đăng ký vào lớp 'Bơi cho người mới bắt đầu - Nhóm A' của bạn",
        date: "5 tháng 5, 2023",
        read: true,
      },
    ],
  };

  return (
    <DashboardLayout userRole='instructor'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          {" "}
          <h1 className='text-3xl font-bold'>Bảng Điều Khiển Giáo Viên</h1>
          <p className='text-muted-foreground'>
            Chào mừng trở lại, {instructor.name}!
          </p>
        </div>
        <div className='flex gap-2'>
          <Link href='/dashboard/instructor/notifications'>
            <Button
              variant='outline'
              className='relative'
            >
              <Bell className='h-4 w-4' />
              {instructor.notifications.filter((n) => !n.read).length > 0 && (
                <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white'>
                  {instructor.notifications.filter((n) => !n.read).length}
                </span>
              )}
              <span className='sr-only'>Thông báo</span>
            </Button>
          </Link>
          <Link href='/dashboard/instructor/schedule'>
            <Button>
              {" "}
              <Calendar className='mr-2 h-4 w-4' />
              Xem Lịch Dạy
            </Button>
          </Link>
        </div>
      </div>

      <div className='grid gap-6 mt-8 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            {" "}
            <CardTitle className='text-sm font-medium'>
              Lớp Học Hoạt Động
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructor.classes.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Các lớp bạn đang dạy
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            {" "}
            <CardTitle className='text-sm font-medium'>
              Tổng Số Học Viên
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructor.students.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Học viên dưới sự hướng dẫn của bạn
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            {" "}
            <CardTitle className='text-sm font-medium'>
              Buổi Học Sắp Tới
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructor.upcomingSessions.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Buổi học trong tuần này
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue='classes'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-4'>
          {" "}
          <TabsTrigger value='classes'>Lớp Học Của Tôi</TabsTrigger>
          <TabsTrigger value='students'>Học Viên</TabsTrigger>
          <TabsTrigger value='attendance'>Điểm Danh</TabsTrigger>
          <TabsTrigger value='schedule'>Lịch Trình</TabsTrigger>
        </TabsList>
        <TabsContent
          value='classes'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Classes You're Teaching</h2>
            <Button variant='outline'>
              <FileText className='mr-2 h-4 w-4' />
              Download Reports
            </Button>
          </div>
          <div className='space-y-4'>
            {instructor.classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.title}</CardTitle>
                  <CardDescription>Location: {cls.location}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-2 md:grid-cols-2'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>{cls.students} Students</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>
                        Next Session: {cls.nextSession}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 md:col-span-2'>
                      <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>
                        Course Progress: {cls.progress}%
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                      setSelectedClass(cls.id === selectedClass ? null : cls.id)
                    }
                  >
                    View Students
                  </Button>
                  <Link href={`/dashboard/instructor/attendance/${cls.id}`}>
                    <Button size='sm'>Take Attendance</Button>
                  </Link>
                </CardFooter>
                {selectedClass === cls.id && (
                  <div className='px-6 pb-6'>
                    <h3 className='text-sm font-medium mb-2'>
                      Students in this class:
                    </h3>
                    <div className='space-y-2'>
                      {instructor.students
                        .filter((student) => student.course === cls.title)
                        .map((student) => (
                          <div
                            key={student.id}
                            className='flex items-center justify-between border-b pb-2'
                          >
                            <div className='flex items-center gap-2'>
                              <Avatar className='h-8 w-8'>
                                <AvatarImage
                                  src={student.avatar || "/placeholder.svg"}
                                  alt={student.name}
                                />
                                <AvatarFallback>
                                  {student.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className='text-sm font-medium'>
                                  {student.name}
                                </p>
                                <p className='text-xs text-muted-foreground'>
                                  Progress: {student.progress}%
                                </p>
                              </div>
                            </div>
                            <div className='flex gap-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                              >
                                <MessageSquare className='h-4 w-4' />
                                <span className='sr-only'>Send Feedback</span>
                              </Button>
                              <Link
                                href={`/dashboard/instructor/students/${student.id}`}
                              >
                                <Button
                                  variant='outline'
                                  size='sm'
                                >
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent
          value='students'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Your Students</h2>
            <div className='flex gap-2'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <input
                  type='search'
                  placeholder='Search students...'
                  className='pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                />
              </div>
              <Button
                variant='outline'
                size='sm'
              >
                <Filter className='h-4 w-4 mr-2' />
                Filter
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Student
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Course
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Progress
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Attendance
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructor.students.map((student) => (
                      <tr
                        key={student.id}
                        className='border-b'
                      >
                        <td className='py-3 px-4'>
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage
                                src={student.avatar || "/placeholder.svg"}
                                alt={student.name}
                              />
                              <AvatarFallback>
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='text-sm font-medium'>
                                {student.name}
                              </p>
                              <p className='text-xs text-muted-foreground'>
                                Age: {student.age}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className='py-3 px-4 text-sm'>{student.course}</td>
                        <td className='py-3 px-4 text-sm'>
                          {student.progress}%
                        </td>
                        <td className='py-3 px-4 text-sm'>
                          {student.attendance}
                        </td>
                        <td className='py-3 px-4'>
                          <div className='flex gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                            >
                              <MessageSquare className='h-4 w-4' />
                              <span className='sr-only'>Send Feedback</span>
                            </Button>
                            <Link
                              href={`/dashboard/instructor/students/${student.id}`}
                            >
                              <Button
                                variant='outline'
                                size='sm'
                              >
                                View
                              </Button>
                            </Link>
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
          value='attendance'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Take Attendance</h2>
            <div className='flex gap-2'>
              <select className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                <option value=''>Select a class</option>
                {instructor.classes.map((cls) => (
                  <option
                    key={cls.id}
                    value={cls.id}
                  >
                    {cls.title}
                  </option>
                ))}
              </select>
              <Button>
                <Calendar className='mr-2 h-4 w-4' />
                Today's Session
              </Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Beginner Swimming - Group A</CardTitle>
              <CardDescription>
                Session Date: May 7, 2023 | 4:00 PM - 4:45 PM
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {instructor.students
                  .filter(
                    (student) =>
                      student.course === "Beginner Swimming - Group A"
                  )
                  .map((student) => (
                    <div
                      key={student.id}
                      className='flex items-center justify-between border-b pb-4'
                    >
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage
                            src={student.avatar || "/placeholder.svg"}
                            alt={student.name}
                          />
                          <AvatarFallback>
                            {student.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium'>{student.name}</p>
                          <p className='text-xs text-muted-foreground'>
                            Last attended: {student.lastAttended}
                          </p>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                        >
                          Absent
                        </Button>
                        <Button size='sm'>Present</Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button>Save Attendance</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent
          value='schedule'
          className='space-y-6 mt-6'
        >
          <h2 className='text-xl font-bold'>Your Teaching Schedule</h2>
          <div className='space-y-4'>
            {instructor.upcomingSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>{session.title}</CardTitle>
                  <CardDescription>
                    Location: {session.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='grid gap-2 md:grid-cols-2'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>{session.date}</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>{session.time}</span>
                    </div>
                    <div className='flex items-center gap-2 md:col-span-2'>
                      <Users className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>
                        {session.students} Students
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                  >
                    View Lesson Plan
                  </Button>
                  <Link href={`/dashboard/instructor/attendance/${session.id}`}>
                    <Button size='sm'>Take Attendance</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
