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
import { Waves, Calendar, Clock, Users, Award, ArrowLeft } from "lucide-react";

export default function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // This would normally come from a database
  const course = {
    id: Number.parseInt(params.id),
    title: "Bơi Cơ Bản",
    description:
      "Hoàn hảo cho người mới bắt đầu. Học an toàn dưới nước và các kiểu bơi cơ bản.",
    fullDescription:
      "Khóa học bơi cơ bản toàn diện này được thiết kế cho những người có ít hoặc không có kinh nghiệm bơi lội. Các giảng viên chuyên nghiệp của chúng tôi sẽ hướng dẫn bạn các nguyên tắc an toàn dưới nước, kỹ thuật nổi cơ bản và các kiểu bơi căn bản. Vào cuối khóa học, bạn sẽ cảm thấy tự tin và thoải mái dưới nước, có khả năng bơi khoảng cách ngắn với kỹ thuật đúng.",
    level: "Cơ bản",
    age: "5+ tuổi",
    duration: "8 tuần",
    sessions: "2 buổi mỗi tuần, 45 phút mỗi buổi",
    instructor: "Sarah Johnson",
    price: "2.500.000₫",
    maxStudents: 8,
    location: "Hồ Chính - Làn 1-2",
    prerequisites: "Không",
    equipment: "Đồ bơi, khăn tắm, kính bơi và mũ bơi",
    startDate: "15 tháng 6, 2023",
    modules: [
      {
        title: "Làm quen và An toàn dưới nước",
        description:
          "Học cách làm quen với nước và hiểu các quy tắc an toàn cơ bản dưới nước.",
        lessons: [
          "Quy tắc và an toàn hồ bơi",
          "Xuống và lên nước",
          "Ngâm mặt dưới nước",
          "Kiểm soát hơi thở",
        ],
      },
      {
        title: "Nổi và Lướt",
        description: "Làm chủ các kỹ năng cơ bản về nổi và lướt trong nước.",
        lessons: [
          "Nổi sấp",
          "Nổi ngửa",
          "Lướt sấp",
          "Lướt ngửa",
          "Tư thế dòng chảy",
        ],
      },
      {
        title: "Kỹ thuật Đạp chân",
        description:
          "Phát triển kỹ thuật đạp chân hiệu quả cho các kiểu bơi khác nhau.",
        lessons: [
          "Đạp chân tự do",
          "Đạp chân ếch",
          "Đạp chân bướm",
          "Đạp chân dọc",
        ],
      },
      {
        title: "Động tác Tay",
        description: "Học động tác tay đúng cách cho các kiểu bơi cơ bản.",
        lessons: [
          "Động tác tay bơi tự do",
          "Động tác tay bơi ngửa",
          "Động tác tay bơi ếch",
          "Phối hợp tay và chân",
        ],
      },
      {
        title: "Kỹ thuật Thở",
        description: "Làm chủ kỹ thuật thở đúng cách khi bơi.",
        lessons: ["Thở nghiêng", "Thở nhịp nhàng", "Thở hai bên"],
      },
      {
        title: "Các kiểu bơi cơ bản",
        description: "Kết hợp tất cả để thực hiện các kiểu bơi cơ bản.",
        lessons: [
          "Bơi tự do (crawl)",
          "Bơi ngửa",
          "Bơi ngửa cơ bản",
          "Bơi ếch cơ bản",
        ],
      },
      {
        title: "Tự tin dưới nước",
        description:
          "Xây dựng sự tự tin thông qua các hoạt động và thử thách dưới nước.",
        lessons: [
          "Giữ thăng bằng dưới nước",
          "Thay đổi hướng",
          "Lặn bề mặt",
          "Bơi quãng đường dài",
        ],
      },
      {
        title: "Đánh giá và Tốt nghiệp",
        description: "Thể hiện kỹ năng bơi mới của bạn và nhận chứng chỉ.",
        lessons: [
          "Ôn tập kỹ năng",
          "Đánh giá bơi quãng đường",
          "Đánh giá an toàn",
          "Lễ trao chứng chỉ",
        ],
      },
    ],
  };

  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}{" "}
      <header className='sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between'>
          <Link
            href='/'
            className='flex items-center gap-2 font-bold text-xl'
          >
            <Waves className='h-6 w-6 text-sky-500' />
            <span>AquaLearn</span>
          </Link>
          <nav className='hidden md:flex items-center gap-6'>
            <Link
              href='/'
              className='text-sm font-medium'
            >
              Trang Chủ
            </Link>
            <Link
              href='/courses'
              className='text-sm font-medium text-sky-600 dark:text-sky-400'
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
            {" "}
            <Link href='/login'>
              <Button variant='outline'>Đăng Nhập</Button>
            </Link>
            <Link href='/signup'>
              <Button>Đăng Ký</Button>
            </Link>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className='flex-1'>
        <div className='container py-8 md:py-12'>
          {" "}
          <div className='mb-6'>
            <Link
              href='/courses'
              className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
            >
              <ArrowLeft className='mr-1 h-4 w-4' />
              Quay lại Khóa Học
            </Link>
          </div>
          <div className='grid gap-6 lg:grid-cols-3'>
            {/* Course Image and Details */}
            <div className='lg:col-span-2'>
              <div className='rounded-lg overflow-hidden mb-6'>
                <img
                  src={`/placeholder.svg?height=400&width=800&text=${course.title}`}
                  alt={course.title}
                  className='w-full h-auto object-cover aspect-video'
                />
              </div>

              <h1 className='text-3xl font-bold mb-4'>{course.title}</h1>
              <p className='text-muted-foreground mb-6'>
                {course.fullDescription}
              </p>

              <Tabs defaultValue='curriculum'>
                <TabsList className='grid w-full grid-cols-3'>
                  {" "}
                  <TabsTrigger value='curriculum'>Chương Trình Học</TabsTrigger>
                  <TabsTrigger value='details'>Chi Tiết</TabsTrigger>
                  <TabsTrigger value='instructor'>Giáo Viên</TabsTrigger>
                </TabsList>
                <TabsContent
                  value='curriculum'
                  className='pt-6'
                >
                  <div className='space-y-6'>
                    {course.modules.map((module, index) => (
                      <Card key={index}>
                        <CardHeader>
                          {" "}
                          <CardTitle>
                            Phần {index + 1}: {module.title}
                          </CardTitle>
                          <CardDescription>
                            {module.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className='list-disc pl-5 space-y-1'>
                            {module.lessons.map((lesson, lessonIndex) => (
                              <li key={lessonIndex}>{lesson}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent
                  value='details'
                  className='pt-6'
                >
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='grid gap-4 md:grid-cols-2'>
                        {" "}
                        <div className='flex items-start gap-2'>
                          <Award className='h-5 w-5 text-sky-500 mt-0.5' />
                          <div>
                            <p className='font-medium'>Cấp độ</p>
                            <p className='text-sm text-muted-foreground'>
                              {course.level}
                            </p>
                          </div>
                        </div>{" "}
                        <div className='flex items-start gap-2'>
                          <Users className='h-5 w-5 text-sky-500 mt-0.5' />
                          <div>
                            <p className='font-medium'>Độ tuổi</p>
                            <p className='text-sm text-muted-foreground'>
                              {course.age}
                            </p>
                          </div>
                        </div>{" "}
                        <div className='flex items-start gap-2'>
                          <Calendar className='h-5 w-5 text-sky-500 mt-0.5' />
                          <div>
                            <p className='font-medium'>Thời gian</p>
                            <p className='text-sm text-muted-foreground'>
                              {course.duration}
                            </p>
                          </div>
                        </div>{" "}
                        <div className='flex items-start gap-2'>
                          <Clock className='h-5 w-5 text-sky-500 mt-0.5' />
                          <div>
                            <p className='font-medium'>Phiên học</p>
                            <p className='text-sm text-muted-foreground'>
                              {course.sessions}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className='mt-6 space-y-4'>
                        {" "}
                        <div>
                          <p className='font-medium'>Yêu cầu tiên quyết</p>
                          <p className='text-sm text-muted-foreground'>
                            {course.prerequisites}
                          </p>
                        </div>{" "}
                        <div>
                          <p className='font-medium'>Thiết bị cần thiết</p>
                          <p className='text-sm text-muted-foreground'>
                            {course.equipment}
                          </p>
                        </div>{" "}
                        <div>
                          <p className='font-medium'>Địa điểm</p>
                          <p className='text-sm text-muted-foreground'>
                            {course.location}
                          </p>
                        </div>{" "}
                        <div>
                          <p className='font-medium'>Quy mô lớp học</p>
                          <p className='text-sm text-muted-foreground'>
                            Tối đa {course.maxStudents} học viên mỗi lớp
                          </p>
                        </div>{" "}
                        <div>
                          <p className='font-medium'>Ngày bắt đầu</p>
                          <p className='text-sm text-muted-foreground'>
                            {course.startDate}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent
                  value='instructor'
                  className='pt-6'
                >
                  <Card>
                    <CardContent className='pt-6'>
                      <div className='flex flex-col md:flex-row gap-6 items-start'>
                        <div className='w-32 h-32 rounded-full overflow-hidden flex-shrink-0'>
                          <img
                            src='/placeholder.svg?height=128&width=128&text=Instructor'
                            alt={course.instructor}
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <div>
                          <h3 className='text-xl font-bold mb-2'>
                            {course.instructor}
                          </h3>{" "}
                          <p className='text-muted-foreground mb-4'>
                            Sarah Johnson là giảng viên bơi lội được chứng nhận
                            với hơn 10 năm kinh nghiệm dạy bơi cho học viên ở
                            mọi lứa tuổi. Cô chuyên làm việc với người mới bắt
                            đầu và giúp họ vượt qua lo âu dưới nước. Sarah có
                            chứng chỉ từ Hội Chữ Thập Đỏ Hoa Kỳ và đã thi đấu ở
                            cấp đại học.
                          </p>
                          <div className='flex gap-2'>
                            {" "}
                            <Button
                              variant='outline'
                              size='sm'
                            >
                              Xem Hồ Sơ
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                            >
                              Liên Hệ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Enrollment Card */}
            <div>
              {" "}
              <Card className='sticky top-24'>
                <CardHeader>
                  <CardTitle>Đăng Ký Khóa Học</CardTitle>
                  <CardDescription>
                    Đảm bảo chỗ của bạn trong khóa học phổ biến này
                  </CardDescription>
                </CardHeader>{" "}
                <CardContent className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Giá:</span>
                    <span className='text-xl font-bold'>{course.price}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Ngày bắt đầu:</span>
                    <span>{course.startDate}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Thời gian:</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Tình trạng:</span>
                    <span className='text-green-600 dark:text-green-400'>
                      Còn chỗ
                    </span>
                  </div>
                </CardContent>{" "}
                <CardFooter className='flex flex-col gap-4'>
                  <Button className='w-full'>Đăng Ký Ngay</Button>
                  <Button
                    variant='outline'
                    className='w-full'
                  >
                    Thêm vào Danh sách Yêu thích
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className='w-full border-t py-6 md:py-0'>
        <div className='container flex flex-col md:flex-row items-center justify-between gap-4 md:h-24'>
          <div className='flex items-center gap-2 font-semibold'>
            <Waves className='h-5 w-5 text-sky-500' />
            <span>AquaLearn</span>
          </div>{" "}
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
