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
import {
  Waves,
  User,
  LogOut,
  BookOpen,
  Calendar,
  Award,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const [progress, setProgress] = useState({
    "Beginner Swimming": 45,
    "Water Safety": 80,
  });
  // Mock user data
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "Học viên",
    enrolledCourses: [
      {
        id: 1,
        title: "Bơi cho người mới bắt đầu",
        progress: progress["Beginner Swimming"],
        nextLesson: "Ngày mai, 16:00",
        instructor: "Sarah Williams",
      },
      {
        id: 2,
        title: "An toàn dưới nước",
        progress: progress["Water Safety"],
        nextLesson: "Thứ sáu, 17:30",
        instructor: "Michael Chen",
      },
    ],
    completedModules: [
      "Làm quen và an toàn dưới nước",
      "Kỹ thuật nổi và lướt",
      "Kỹ thuật đạp chân cơ bản",
    ],
    upcomingLessons: [
      {
        id: 1,
        title: "Động tác tay bơi tự do",
        date: "7 tháng 5, 2023",
        time: "16:00 - 16:45",
        instructor: "Sarah Williams",
        course: "Bơi cho người mới bắt đầu",
      },
      {
        id: 2,
        title: "Kỹ thuật cứu hộ",
        date: "10 tháng 5, 2023",
        time: "17:30 - 18:15",
        instructor: "Michael Chen",
        course: "An toàn dưới nước",
      },
      {
        id: 3,
        title: "Kỹ thuật thở",
        date: "14 tháng 5, 2023",
        time: "16:00 - 16:45",
        instructor: "Sarah Williams",
        course: "Bơi cho người mới bắt đầu",
      },
    ],
    achievements: [
      {
        id: 1,
        title: "Lặn đầu tiên",
        description: "Hoàn thành thành công bài lặn đầu tiên",
        date: "15 tháng 4, 2023",
      },
      {
        id: 2,
        title: "Bơi tự do 25m",
        description: "Bơi được 25 mét với kỹ thuật bơi tự do",
        date: "22 tháng 4, 2023",
      },
      {
        id: 3,
        title: "Kỹ năng an toàn nước cơ bản",
        description: "Hoàn thành module an toàn nước cơ bản",
        date: "29 tháng 4, 2023",
      },
    ],
  };

  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}
      <header className='sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        {" "}
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between'>
          <Link
            href='/'
            className='flex items-center gap-2 font-bold text-xl'
          >
            <Waves className='h-6 w-6 text-sky-500' />
            <span>AquaLearn</span>
          </Link>{" "}
          <nav className='hidden md:flex items-center gap-6'>
            <Link
              href='/dashboard'
              className='text-sm font-medium text-sky-600 dark:text-sky-400'
            >
              Bảng điều khiển
            </Link>
            <Link
              href='/courses'
              className='text-sm font-medium'
            >
              Khóa học
            </Link>
            <Link
              href='/calendar'
              className='text-sm font-medium'
            >
              Lịch học
            </Link>
            <Link
              href='/achievements'
              className='text-sm font-medium'
            >
              Thành tích
            </Link>
          </nav>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700'>
                <User className='h-4 w-4' />
              </div>
              <span className='text-sm font-medium hidden md:inline-block'>
                {user.name}
              </span>
            </div>
            <Button
              variant='ghost'
              size='icon'
            >
              <LogOut className='h-5 w-5' />
              <span className='sr-only'>Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>{" "}
      {/* Main Content */}
      <main className='flex-1'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8'>
          {" "}
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold'>Bảng Điều Khiển Học Viên</h1>
              <p className='text-muted-foreground'>
                Chào mừng trở lại, {user.name}!
              </p>
            </div>
            <Button>
              <BookOpen className='mr-2 h-4 w-4' />
              Xem Thêm Khóa Học
            </Button>
          </div>
          <div className='grid gap-6 mt-8 md:grid-cols-3'>
            {" "}
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
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
                  Khóa học đang học
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between pb-2'>
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
                  Thành Tích
                </CardTitle>
                <Award className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {user.achievements.length}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Huy hiệu đạt được
                </p>
              </CardContent>
            </Card>
          </div>
          <Tabs
            defaultValue='progress'
            className='mt-8'
          >
            {" "}
            <TabsList className='grid w-full grid-cols-4'>
              <TabsTrigger value='progress'>Tiến độ</TabsTrigger>
              <TabsTrigger value='schedule'>Lịch học</TabsTrigger>
              <TabsTrigger value='achievements'>Thành tích</TabsTrigger>
              <TabsTrigger value='resources'>Tài liệu</TabsTrigger>
            </TabsList>
            <TabsContent
              value='progress'
              className='space-y-6 mt-6'
            >
              {" "}
              <h2 className='text-xl font-bold'>Tiến Độ Khóa Học</h2>
              {user.enrolledCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>
                      Giảng viên: {course.instructor}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>Tiến độ</span>
                        <span className='font-medium'>{course.progress}%</span>
                      </div>
                      <Progress
                        value={course.progress}
                        className='h-2'
                      />
                    </div>
                    <div className='mt-4 space-y-2'>
                      <h4 className='text-sm font-medium'>
                        Các phần đã hoàn thành
                      </h4>
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
                      <span className='font-medium'>Bài học tiếp theo:</span>{" "}
                      {course.nextLesson}
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      Xem khóa học
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
            <TabsContent
              value='schedule'
              className='space-y-6 mt-6'
            >
              {" "}
              <h2 className='text-xl font-bold'>Bài Học Sắp Tới</h2>
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
                        <div className='flex items-center gap-2 md:col-span-2'>
                          <User className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>
                            Giảng viên: {lesson.instructor}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant='outline'
                        size='sm'
                      >
                        Thêm vào lịch
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
              {" "}
              <h2 className='text-xl font-bold'>Thành Tích Của Bạn</h2>
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
                        Đạt được vào {achievement.date}
                      </p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent
              value='resources'
              className='space-y-6 mt-6'
            >
              {" "}
              <h2 className='text-xl font-bold'>Tài Liệu Học Tập</h2>
              <div className='grid gap-4 md:grid-cols-2'>
                <Card>
                  <CardHeader>
                    <CardTitle>Video Kỹ Thuật Bơi</CardTitle>
                    <CardDescription>
                      Xem video hướng dẫn để cải thiện kỹ thuật của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Kỹ thuật thở khi bơi tự do
                        </Link>
                      </li>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Tư thế bơi ếch đúng cách
                        </Link>
                      </li>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Chuyển động tay khi bơi ngửa
                        </Link>
                      </li>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Hướng dẫn đạp chân bơi bướm
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      Xem tất cả video
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Bài Tập Bơi</CardTitle>
                    <CardDescription>
                      Các bài tập thực hành để nâng cao kỹ năng bơi của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Bài tập ván đạp cho người mới bắt đầu
                        </Link>
                      </li>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Bài tập với phao kẹp
                        </Link>
                      </li>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Bài tập kiểm soát hơi thở
                        </Link>
                      </li>
                      <li className='text-sm'>
                        <Link
                          href='#'
                          className='text-sky-600 hover:underline'
                        >
                          Bộ bài tập rèn luyện sức bền
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      Xem tất cả bài tập
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      {/* Footer */}{" "}
      <footer className='w-full border-t py-6 md:py-0'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:h-24'>
          <div className='flex items-center gap-2 font-semibold'>
            <Waves className='h-5 w-5 text-sky-500' />
            <span>AquaLearn</span>
          </div>
          <p className='text-sm text-muted-foreground'>
            © {new Date().getFullYear()} Trung Tâm Dạy Bơi AquaLearn. Đã đăng ký
            bản quyền.
          </p>
          <div className='flex items-center gap-4'>
            <Link
              href='/terms'
              className='text-sm text-muted-foreground hover:underline'
            >
              Điều khoản
            </Link>
            <Link
              href='/privacy'
              className='text-sm text-muted-foreground hover:underline'
            >
              Bảo mật
            </Link>
            <Link
              href='/contact'
              className='text-sm text-muted-foreground hover:underline'
            >
              Liên hệ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
