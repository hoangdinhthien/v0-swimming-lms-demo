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
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function InstructorDashboardPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  // Mock instructor data
  const instructor = {
    name: "Sarah Williams",
    email: "sarah@example.com",
    role: "Instructor",
    specialty: "Beginner Swimming, Water Safety",
    classes: [
      {
        id: 1,
        title: "Beginner Swimming",
        students: 12,
        time: "Mon, Wed, Fri - 4:00 PM",
        location: "Main Pool - Lane 1",
        attendance: 95,
      },
      {
        id: 2,
        title: "Water Safety",
        students: 10,
        time: "Tue, Thu - 5:30 PM",
        location: "Training Pool",
        attendance: 90,
      },
    ],
    upcomingLessons: [
      {
        id: 1,
        title: "Arm Movements for Freestyle",
        class: "Beginner Swimming",
        date: "May 7, 2023",
        time: "4:00 PM - 4:45 PM",
        students: 12,
        location: "Main Pool - Lane 1",
      },
      {
        id: 2,
        title: "Rescue Techniques",
        class: "Water Safety",
        date: "May 9, 2023",
        time: "5:30 PM - 6:15 PM",
        students: 10,
        location: "Training Pool",
      },
      {
        id: 3,
        title: "Breathing Techniques",
        class: "Beginner Swimming",
        date: "May 10, 2023",
        time: "4:00 PM - 4:45 PM",
        students: 12,
        location: "Main Pool - Lane 1",
      },
    ],
    students: [
      {
        id: 1,
        name: "Alex Johnson",
        classes: ["Beginner Swimming"],
        progress: 45,
        attendance: 100,
        avatar: "/placeholder.svg",
      },
      {
        id: 2,
        name: "Emma Wilson",
        classes: ["Beginner Swimming", "Water Safety"],
        progress: 60,
        attendance: 90,
        avatar: "/placeholder.svg",
      },
      {
        id: 3,
        name: "Michael Brown",
        classes: ["Water Safety"],
        progress: 75,
        attendance: 95,
        avatar: "/placeholder.svg",
      },
      {
        id: 4,
        name: "Sophia Lee",
        classes: ["Beginner Swimming"],
        progress: 30,
        attendance: 85,
        avatar: "/placeholder.svg",
      },
      {
        id: 5,
        name: "Daniel Kim",
        classes: ["Beginner Swimming", "Water Safety"],
        progress: 50,
        attendance: 100,
        avatar: "/placeholder.svg",
      },
    ],
    messages: [
      {
        id: 1,
        from: "Alex Johnson",
        message: "Hi Sarah, I have a question about tomorrow's lesson.",
        time: "2 hours ago",
        read: false,
        avatar: "/placeholder.svg",
      },
      {
        id: 2,
        from: "Emma Wilson",
        message: "Thanks for the feedback on my freestyle technique!",
        time: "Yesterday",
        read: true,
        avatar: "/placeholder.svg",
      },
      {
        id: 3,
        from: "System",
        message: "Your schedule for next week has been updated.",
        time: "May 3, 2023",
        read: true,
        avatar: "/placeholder.svg",
      },
    ],
  };

  return (
    <DashboardLayout userRole='instructor'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Bảng Điều Khiển Giáo Viên</h1>
          <p className='text-muted-foreground'>
            Chào mừng trở lại, {instructor.name}!
          </p>
        </div>
        <div className='flex gap-2'>
          <MessageSquare className='h-6 w-6' />
          <Bell className='h-6 w-6' />
        </div>
      </div>

      <div className='grid gap-6 mt-8 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Học viên trong lớp
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructor.students.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Tổng số học viên đăng ký
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Lớp đang dạy</CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructor.classes.length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Lớp học đang hoạt động
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tỷ lệ điểm danh
            </CardTitle>
            <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>93%</div>
            <p className='text-xs text-muted-foreground'>
              Trung bình tỷ lệ điểm danh
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue='schedule'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='schedule'>Lịch Dạy</TabsTrigger>
          <TabsTrigger value='students'>Học Viên</TabsTrigger>
          <TabsTrigger value='attendance'>Điểm Danh</TabsTrigger>
        </TabsList>
        <TabsContent
          value='schedule'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Lịch dạy sắp tới</h2>
            <Link href='/dashboard/instructor/schedule'>
              <Button variant='outline'>Xem toàn bộ lịch</Button>
            </Link>
          </div>
          <div className='space-y-4'>
            {instructor.upcomingLessons.map((lesson) => (
              <Card key={lesson.id}>
                <CardHeader>
                  <CardTitle>{lesson.title}</CardTitle>
                  <CardDescription>{lesson.class}</CardDescription>
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
                      <Users className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>
                        Học viên: {lesson.students}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <MessageSquare className='h-4 w-4 text-muted-foreground' />
                      <span className='text-sm'>
                        Địa điểm: {lesson.location}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex gap-2'>
                  <Link href={`/dashboard/instructor/attendance/${lesson.id}`}>
                    <Button>
                      <CheckCircle2 className='mr-2 h-4 w-4' />
                      Điểm danh
                    </Button>
                  </Link>
                  <Link href={`/dashboard/instructor/lessons/${lesson.id}`}>
                    <Button variant='outline'>Xem chi tiết</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent
          value='students'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Quản lý học viên</h2>
            <div className='flex gap-2'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <input
                  type='search'
                  placeholder='Tìm học viên...'
                  className='pl-8 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                />
              </div>
              <Button
                variant='outline'
                size='sm'
              >
                <Filter className='mr-2 h-4 w-4' />
                Lọc
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
                        Học viên
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Lớp
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Tiến độ
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Điểm danh
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Thao tác
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
                                src={student.avatar}
                                alt={student.name}
                              />
                              <AvatarFallback>
                                {student.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>{student.name}</span>
                          </div>
                        </td>
                        <td className='py-3 px-4'>
                          {student.classes.join(", ")}
                        </td>
                        <td className='py-3 px-4'>{student.progress}%</td>
                        <td className='py-3 px-4'>{student.attendance}%</td>
                        <td className='py-3 px-4'>
                          <div className='flex gap-2'>
                            <Link
                              href={`/dashboard/instructor/students/${student.id}`}
                            >
                              <Button
                                variant='outline'
                                size='sm'
                              >
                                Hồ sơ
                              </Button>
                            </Link>
                            <Button
                              variant='outline'
                              size='sm'
                            >
                              Đánh giá
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
          value='attendance'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Điểm danh theo lớp học</h2>
            <select className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
              <option value=''>Chọn lớp học</option>
              {instructor.classes.map((cls) => (
                <option
                  key={cls.id}
                  value={cls.id}
                >
                  {cls.title}
                </option>
              ))}
            </select>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            {instructor.classes.map((cls) => (
              <Card key={cls.id}>
                <CardHeader>
                  <CardTitle>{cls.title}</CardTitle>
                  <CardDescription>
                    {cls.students} học viên | {cls.time}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Tỷ lệ điểm danh</span>
                      <span className='font-medium'>{cls.attendance}%</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Địa điểm</span>
                      <span>{cls.location}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex justify-between'>
                  <Link href={`/dashboard/instructor/attendance/${cls.id}`}>
                    <Button>Điểm danh</Button>
                  </Link>
                  <Link
                    href={`/dashboard/instructor/attendance/${cls.id}/history`}
                  >
                    <Button variant='outline'>Lịch sử điểm danh</Button>
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
