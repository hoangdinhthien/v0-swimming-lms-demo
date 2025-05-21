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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Waves, Search } from "lucide-react";

export default function CoursesPage() {
  // Sample course data
  const courses = [
    {
      id: 1,
      title: "Bơi Cơ Bản",
      description:
        "Hoàn hảo cho người mới bắt đầu. Học an toàn dưới nước và các kiểu bơi cơ bản.",
      level: "Cơ bản",
      age: "5+ tuổi",
      duration: "8 tuần",
      instructor: "Sarah Johnson",
      price: "2.500.000₫",
    },
    {
      id: 2,
      title: "Kỹ Thuật Trung Cấp",
      description:
        "Hoàn thiện các kiểu bơi và xây dựng sức bền cho việc bơi tự tin.",
      level: "Trung cấp",
      age: "8+ tuổi",
      duration: "10 tuần",
      instructor: "Michael Chen",
      price: "3.200.000₫",
    },
    {
      id: 3,
      title: "Nâng Cao Hiệu Suất",
      description: "Làm chủ các kỹ thuật thi đấu và kỹ năng bơi nâng cao.",
      level: "Nâng cao",
      age: "12+ tuổi",
      duration: "12 tuần",
      instructor: "Emma Rodriguez",
      price: "3.600.000₫",
    },
    {
      id: 4,
      title: "Phụ Huynh & Trẻ Em",
      description:
        "Gắn kết với con bạn trong khi dạy cho chúng các kỹ năng nước cần thiết.",
      level: "Cơ bản",
      age: "6 tháng - 3 tuổi",
      duration: "6 tuần",
      instructor: "David Wilson",
      price: "2.000.000₫",
    },
    {
      id: 5,
      title: "Khóa Học Bơi Cho Người Lớn",
      description:
        "Không bao giờ là quá muộn để học! Được thiết kế đặc biệt cho người mới bắt đầu ở độ tuổi trưởng thành.",
      level: "Cơ bản",
      age: "16+ tuổi",
      duration: "8 tuần",
      instructor: "Lisa Thompson",
      price: "2.800.000₫",
    },
    {
      id: 6,
      title: "Hoàn Thiện Kỹ Thuật Thi Đấu",
      description: "Hoàn thiện kỹ thuật của bạn cho các sự kiện bơi thi đấu.",
      level: "Nâng cao",
      age: "14+ tuổi",
      duration: "10 tuần",
      instructor: "James Anderson",
      price: "4.000.000₫",
    },
  ];

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
              Giảng Viên
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
      </header>{" "}
      {/* Main Content */}
      <main className='flex-1'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
          {" "}
          <div className='flex flex-col gap-4'>
            <h1 className='text-3xl font-bold'>Khóa Học Bơi</h1>
            <p className='text-muted-foreground'>
              Duyệt qua các khóa học bơi toàn diện cho mọi lứa tuổi và trình độ
              kỹ năng.
            </p>
          </div>
          {/* Filters */}
          <div className='my-8 grid gap-4 md:grid-cols-4'>
            <div className='relative md:col-span-2'>
              {" "}
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Tìm kiếm khóa học...'
                className='w-full pl-8'
              />
            </div>{" "}
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Trình Độ' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất Cả Trình Độ</SelectItem>
                <SelectItem value='beginner'>Cơ Bản</SelectItem>
                <SelectItem value='intermediate'>Trung Cấp</SelectItem>
                <SelectItem value='advanced'>Nâng Cao</SelectItem>
              </SelectContent>
            </Select>{" "}
            <Select>
              <SelectTrigger>
                <SelectValue placeholder='Nhóm Tuổi' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất Cả Độ Tuổi</SelectItem>
                <SelectItem value='toddler'>Trẻ Nhỏ (0-3)</SelectItem>
                <SelectItem value='children'>Trẻ Em (4-12)</SelectItem>
                <SelectItem value='teen'>Thanh Thiếu Niên (13-17)</SelectItem>
                <SelectItem value='adult'>Người Lớn (18+)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Course Grid */}
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {courses.map((course) => (
              <Card
                key={course.id}
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
                    <div className='flex items-center gap-1'>
                      <span className='font-medium'>Thời gian:</span>{" "}
                      {course.duration}
                    </div>
                    <div className='flex items-center gap-1'>
                      <span className='font-medium'>Học phí:</span>{" "}
                      {course.price}
                    </div>
                    <div className='flex items-center gap-1 col-span-2'>
                      <span className='font-medium'>Giảng viên:</span>{" "}
                      {course.instructor}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex gap-2'>
                  <Link
                    href={`/courses/${course.id}`}
                    className='flex-1'
                  >
                    {" "}
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      Chi Tiết
                    </Button>
                  </Link>
                  <Link
                    href={`/courses/${course.id}/enroll`}
                    className='flex-1'
                  >
                    <Button className='w-full'>Đăng Ký</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
      {/* Footer */}{" "}
      <footer className='w-full border-t py-6 md:py-0'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 md:h-24'>
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
