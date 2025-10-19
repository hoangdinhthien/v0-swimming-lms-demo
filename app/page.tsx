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
import {
  Waves,
  Users,
  Calendar,
  Award,
  ArrowRight,
  BookOpen,
  BarChart,
  MessageCircle,
  Clock,
} from "lucide-react";
import SiteHeader from "@/components/site-header";
import { fetchCourses } from "@/api/manager/courses-api";

export default async function Home() {
  const data = await fetchCourses();
  // Extract courses from nested API structure
  const courses = data?.data?.[0]?.[0]?.data || [];

  return (
    <div className='flex flex-col min-h-screen'>
      <SiteHeader />

      {/* Hero Section */}
      <section className='w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-6 lg:grid-cols-2 lg:gap-12 items-center'>
            <div className='flex flex-col justify-center space-y-4'>
              {" "}
              <div className='space-y-2'>
                <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                  AquaLearn Pool Management System
                </h1>
                <p className='max-w-[600px] text-muted-foreground md:text-xl'>
                  Hệ thống Quản lý Trung tâm Dạy Bơi AquaLearn. Quản lý học
                  viên, khóa học, giáo viên và hồ bơi hiệu quả. Theo dõi doanh
                  thu và tạo báo cáo tổng quan để điều hành trung tâm dạy bơi
                  của bạn.
                </p>
              </div>
              <div className='flex flex-col gap-2 min-[400px]:flex-row'>
                <Link href='/dashboard/manager'>
                  <Button
                    size='lg'
                    className='bg-sky-600 hover:bg-sky-700'
                  >
                    Bảng điều khiển
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </Link>
                <Link href='/login'>
                  <Button
                    size='lg'
                    variant='outline'
                  >
                    Đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
            <div className='mx-auto w-full max-w-[500px] lg:max-w-none'>
              <div className='aspect-video overflow-hidden rounded-xl'>
                <img
                  src='/placeholder.svg?height=500&width=800&text=AquaLearn+LMS'
                  alt='AquaLearn LMS Dashboard Preview'
                  className='object-cover w-full h-full'
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LMS Features Section */}
      <section className='w-full py-12 md:py-24 lg:py-32'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-center space-y-4 text-center'>
            <div className='space-y-2'>
              <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                Tính năng của AquaLearn LMS
              </h2>
              <p className='max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                Hệ thống quản lý học tập của chúng tôi được thiết kế đặc biệt
                cho giáo dục bơi lội, mang lại trải nghiệm liền mạch cho học
                viên và giáo viên.
              </p>
            </div>
          </div>
          <div className='mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12'>
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <Calendar className='h-8 w-8 text-sky-500' />
                <CardTitle>Lịch Học</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Quản lý lịch học và đặt lịch cho các buổi học của bạn</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <BookOpen className='h-8 w-8 text-sky-500' />
                <CardTitle>Tài liệu học tập</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Truy cập tài liệu học tập cho tất cả các khóa học của bạn</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <BarChart className='h-8 w-8 text-sky-500' />
                <CardTitle>Theo dõi tiến độ</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Theo dõi sự tiến bộ và thành tích của bạn trong các kỹ năng
                  bơi lội
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <MessageCircle className='h-8 w-8 text-sky-500' />
                <CardTitle>Chat với giáo viên</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Tương tác trực tiếp với giáo viên của bạn thông qua hệ thống
                  chat
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Activities Section */}
      <section className='w-full py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-center space-y-4 text-center'>
            <div className='space-y-2'>
              <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                Khóa Học Sắp Tới
              </h2>
              <p className='max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                Các lớp học và buổi học sắp diễn ra trong tuần tới
              </p>
            </div>
          </div>
          <div className='mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12'>
            {courses.slice(0, 3).map((course: any) => (
              <Card
                key={course._id}
                className='overflow-hidden flex flex-col'
              >
                <div className='aspect-video w-full overflow-hidden'>
                  <img
                    src={course.thumbnail || "/placeholder.svg"}
                    alt={course.title}
                    className='object-cover h-full w-full'
                  />
                </div>
                <CardHeader>
                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                    <Clock className='h-4 w-4' />
                    <span>Sắp diễn ra</span>
                  </div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>
                    {course.description?.substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardContent className='flex-1'>
                  <p className='text-sm'>Giáo viên: {course.instructor}</p>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/courses/${course._id}`}
                    className='w-full'
                  >
                    <Button className='w-full'>
                      Xem Khóa Học <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className='flex justify-center mt-8'>
            <Link href='/dashboard'>
              <Button
                variant='outline'
                size='lg'
              >
                Xem tất cả hoạt động
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='w-full border-t py-6 md:py-0'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:h-24'>
          <div className='flex items-center gap-2 font-semibold'>
            <Waves className='h-5 w-5 text-sky-500' />
            <span>AquaLearn LMS</span>
          </div>
          <p className='text-sm text-muted-foreground'>
            © {new Date().getFullYear()} AquaLearn. Tất cả quyền được bảo lưu.
          </p>
          <div className='flex items-center gap-4'>
            <Link
              href='https://aqualearn.vn'
              className='text-sm text-muted-foreground hover:underline'
            >
              Trang chủ
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
