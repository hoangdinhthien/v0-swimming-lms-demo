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
import { Waves, Users, Calendar, Award, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}
      <header className='sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between'>
          <div className='flex items-center gap-2 font-bold text-xl'>
            <Waves className='h-6 w-6 text-sky-500' />
            <span>AquaLearn</span>
          </div>{" "}
          <nav className='hidden md:flex items-center gap-6'>
            <Link
              href='/'
              className='text-sm font-medium'
            >
              Trang Chủ
            </Link>
            <Link
              href='/courses'
              className='text-sm font-medium'
            >
              Khóa Học
            </Link>
            <Link
              href='/instructors'
              className='text-sm font-medium'
            >
              Giáo Viên
            </Link>
            <Link
              href='/about'
              className='text-sm font-medium'
            >
              Giới Thiệu
            </Link>
          </nav>
          <div className='flex items-center gap-4'>
            <Link href='/login'>
              <Button variant='outline'>Đăng Nhập</Button>
            </Link>
            <Link href='/signup'>
              <Button>Đăng Ký</Button>
            </Link>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <section className='w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-800'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='grid gap-6 lg:grid-cols-2 lg:gap-12 items-center'>
            <div className='flex flex-col justify-center space-y-4'>
              {" "}
              <div className='space-y-2'>
                <h1 className='text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none'>
                  Học Bơi Với Sự Tự Tin
                </h1>
                <p className='max-w-[600px] text-muted-foreground md:text-xl'>
                  Các khóa học bơi toàn diện của chúng tôi được thiết kế cho mọi
                  lứa tuổi và trình độ. Theo dõi sự tiến bộ và đạt được mục tiêu
                  bơi lội của bạn với các giáo viên chuyên nghiệp.
                </p>
              </div>
              <div className='flex flex-col gap-2 min-[400px]:flex-row'>
                <Link href='/courses'>
                  <Button
                    size='lg'
                    className='bg-sky-600 hover:bg-sky-700'
                  >
                    Xem Khóa Học
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </Link>
                <Link href='/about'>
                  <Button
                    size='lg'
                    variant='outline'
                  >
                    Tìm Hiểu Thêm
                  </Button>
                </Link>
              </div>
            </div>
            <div className='mx-auto w-full max-w-[500px] lg:max-w-none'>
              <div className='aspect-video overflow-hidden rounded-xl'>
                <img
                  src='/placeholder.svg?height=500&width=800'
                  alt='Các buổi học bơi đang diễn ra'
                  className='object-cover w-full h-full'
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Features Section */}
      <section className='w-full py-12 md:py-24 lg:py-32'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-center space-y-4 text-center'>
            <div className='space-y-2'>
              {" "}
              <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                Tại Sao Chọn Hệ Thống Học Bơi Của Chúng Tôi?
              </h2>
              <p className='max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                Hệ thống quản lý học tập của chúng tôi được thiết kế đặc biệt
                cho giáo dục bơi lội, mang lại trải nghiệm liền mạch cho học
                viên và giáo viên.
              </p>
            </div>
          </div>
          <div className='mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12'>
            {" "}
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <Calendar className='h-8 w-8 text-sky-500' />
                <CardTitle>Lịch Học Linh Hoạt</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Đặt lịch học theo sự thuận tiện của bạn với hệ thống lịch dễ
                  sử dụng của chúng tôi.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <Users className='h-8 w-8 text-sky-500' />
                <CardTitle>Giáo Viên Chuyên Nghiệp</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Học từ các huấn luyện viên bơi lội được chứng nhận với nhiều
                  năm kinh nghiệm giảng dạy.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center gap-4'>
                <Award className='h-8 w-8 text-sky-500' />
                <CardTitle>Theo Dõi Tiến Độ</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  Theo dõi sự tiến bộ của bạn với báo cáo chi tiết và đánh giá
                  kỹ năng.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Popular Courses Section */}
      <section className='w-full py-12 md:py-24 lg:py-32 bg-slate-50 dark:bg-slate-900'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
          <div className='flex flex-col items-center justify-center space-y-4 text-center'>
            <div className='space-y-2'>
              {" "}
              <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                Các Khóa Học Bơi Phổ Biến
              </h2>
              <p className='max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed'>
                Khám phá các chương trình học bơi phổ biến nhất của chúng tôi
                cho mọi lứa tuổi và trình độ.
              </p>
            </div>
          </div>
          <div className='mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12'>
            {" "}
            {[
              {
                title: "Bơi Cơ Bản",
                description:
                  "Hoàn hảo cho người mới bắt đầu. Học an toàn dưới nước và các kiểu bơi cơ bản.",
                level: "Cơ bản",
                age: "5+ tuổi",
                duration: "8 tuần",
              },
              {
                title: "Kỹ Thuật Trung Cấp",
                description:
                  "Hoàn thiện các kiểu bơi và xây dựng sức bền cho việc bơi tự tin.",
                level: "Trung cấp",
                age: "8+ tuổi",
                duration: "10 tuần",
              },
              {
                title: "Nâng Cao Hiệu Suất",
                description:
                  "Làm chủ các kỹ thuật thi đấu và kỹ năng bơi nâng cao.",
                level: "Nâng cao",
                age: "12+ tuổi",
                duration: "12 tuần",
              },
            ].map((course, index) => (
              <Card
                key={index}
                className='overflow-hidden'
              >
                <div className='aspect-video w-full overflow-hidden'>
                  <img
                    src={`/placeholder.svg?height=200&width=400&text=${course.title}`}
                    alt={course.title}
                    className='object-cover w-full h-full'
                  />
                </div>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {" "}
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div className='flex items-center gap-1'>
                      <span className='font-medium'>Trình độ:</span>{" "}
                      {course.level}
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='font-medium'>Độ tuổi:</span> {course.age}
                    </div>
                    <div className='flex items-center gap-1 col-span-2'>
                      <span className='font-medium'>Thời gian:</span>{" "}
                      {course.duration}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link
                    href={`/courses/${index + 1}`}
                    className='w-full'
                  >
                    <Button className='w-full'>Xem Khóa Học</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>{" "}
          <div className='flex justify-center mt-8'>
            <Link href='/courses'>
              <Button
                variant='outline'
                size='lg'
              >
                Xem Tất Cả Khóa Học
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      {/* Footer */}{" "}
      <footer className='w-full border-t py-6 md:py-0'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:h-24'>
          <div className='flex items-center gap-2 font-semibold'>
            <Waves className='h-5 w-5 text-sky-500' />
            <span>AquaLearn</span>
          </div>{" "}
          <p className='text-sm text-muted-foreground'>
            © {new Date().getFullYear()} Trung Tâm Bơi AquaLearn. Mọi quyền được
            bảo lưu.
          </p>
          <div className='flex items-center gap-4'>
            <Link
              href='/terms'
              className='text-sm text-muted-foreground hover:underline'
            >
              Điều Khoản
            </Link>
            <Link
              href='/privacy'
              className='text-sm text-muted-foreground hover:underline'
            >
              Bảo Mật
            </Link>
            <Link
              href='/contact'
              className='text-sm text-muted-foreground hover:underline'
            >
              Liên Hệ
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
