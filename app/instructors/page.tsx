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
import { Waves, Search, Star } from "lucide-react";

export default function InstructorsPage() {
  // Sample instructor data
  const instructors = [
    {
      id: 1,
      name: "Sarah Johnson",
      specialty: "Bơi Cơ Bản, An Toàn Dưới Nước",
      experience: "10+ năm",
      certifications: [
        "Huấn Luyện Viên Hội Chữ Thập Đỏ WSI",
        "Chứng Nhận Cứu Hộ",
      ],
      bio: "Sarah chuyên dạy người mới bắt đầu và giúp học viên vượt qua nỗi lo âu dưới nước. Phương pháp kiên nhẫn của cô giúp việc học bơi trở nên thú vị cho mọi lứa tuổi.",
      rating: 4.9,
      reviews: 124,
      image: "/placeholder.svg?height=300&width=300&text=Sarah",
    },
    {
      id: 2,
      name: "Michael Chen",
      specialty: "Bơi Thi Đấu, Kỹ Thuật Nâng Cao",
      experience: "15+ năm",
      certifications: [
        "Huấn Luyện Viên Bơi Hoa Kỳ",
        "Cựu Vận Động Viên Olympic",
      ],
      bio: "Michael là cựu vận động viên bơi lội thi đấu, hiện đang chia sẻ chuyên môn của mình với học viên muốn hoàn thiện kỹ thuật và cải thiện tốc độ.",
      rating: 4.8,
      reviews: 98,
      image: "/placeholder.svg?height=300&width=300&text=Michael",
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      specialty: "Bơi Lội Thanh Thiếu Niên, Phát Triển Kỹ Thuật",
      experience: "8+ năm",
      certifications: ["Huấn Luyện Viên ASCA Cấp 2", "Giảng Viên Swim America"],
      bio: "Emma có tài năng đặc biệt làm việc với trẻ em và phát triển các kỹ thuật bơi đúng từ độ tuổi sớm.",
      rating: 4.7,
      reviews: 87,
      image: "/placeholder.svg?height=300&width=300&text=Emma",
    },
    {
      id: 4,
      name: "David Wilson",
      specialty: "Bơi Phụ Huynh & Trẻ Em, Làm Quen Với Nước",
      experience: "12+ năm",
      certifications: [
        "Chuyên Gia Bơi Lội Cho Trẻ Sơ Sinh",
        "Giảng Viên An Toàn Dưới Nước",
      ],
      bio: "David chuyên về các bài học bơi dành cho phụ huynh-trẻ em và giúp trẻ sơ sinh và trẻ mới biết đi làm quen với môi trường nước.",
      rating: 4.9,
      reviews: 112,
      image: "/placeholder.svg?height=300&width=300&text=David",
    },
    {
      id: 5,
      name: "Lisa Thompson",
      specialty: "Dạy Bơi Cho Người Lớn, Thể Dục Dưới Nước",
      experience: "9+ năm",
      certifications: [
        "Giảng Viên Dạy Bơi Cho Người Lớn",
        "Hiệp Hội Thể Dục Dưới Nước",
      ],
      bio: "Lisa tập trung vào các học viên là người lớn và những người muốn sử dụng bơi lội cho mục đích thể dục và phục hồi.",
      rating: 4.8,
      reviews: 76,
      image: "/placeholder.svg?height=300&width=300&text=Lisa",
    },
    {
      id: 6,
      name: "James Anderson",
      specialty: "Huấn Luyện Thi Đấu, Phân Tích Hiệu Suất",
      experience: "20+ năm",
      certifications: [
        "Huấn Luyện Viên ASCA Cấp 4",
        "Chuyên Gia Phân Tích Hiệu Suất Thể Thao",
      ],
      bio: "James đã huấn luyện các vận động viên bơi lội thi đấu ở cấp quốc gia và quốc tế, với chuyên môn về phân tích hiệu suất và hoàn thiện kỹ thuật.",
      rating: 4.9,
      reviews: 145,
      image: "/placeholder.svg?height=300&width=300&text=James",
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
              className='text-sm font-medium'
            >
              Khóa Học
            </Link>
            <Link
              href='/instructors'
              className='text-sm font-medium text-sky-600 dark:text-sky-400'
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
            <h1 className='text-3xl font-bold'>Đội Ngũ Giảng Viên Bơi Lội</h1>
            <p className='text-muted-foreground'>
              Gặp gỡ đội ngũ giảng viên bơi lội được chứng nhận của chúng tôi
              với nhiều năm kinh nghiệm dạy bơi cho học viên ở mọi lứa tuổi và
              trình độ.
            </p>
          </div>
          {/* Search */}
          <div className='my-8'>
            <div className='relative max-w-md'>
              {" "}
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='search'
                placeholder='Tìm kiếm giảng viên theo tên hoặc chuyên môn...'
                className='w-full pl-8'
              />
            </div>
          </div>
          {/* Instructors Grid */}
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            {instructors.map((instructor) => (
              <Card
                key={instructor.id}
                className='overflow-hidden'
              >
                <div className='aspect-square w-full overflow-hidden'>
                  <img
                    src={instructor.image || "/placeholder.svg"}
                    alt={instructor.name}
                    className='object-cover w-full h-full'
                  />
                </div>
                <CardHeader>
                  <CardTitle>{instructor.name}</CardTitle>
                  <CardDescription>{instructor.specialty}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <p className='text-sm'>{instructor.bio}</p>
                  <div className='flex items-center gap-1'>
                    <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                    <span className='font-medium'>
                      {instructor.rating}
                    </span>{" "}
                    <span className='text-muted-foreground text-sm'>
                      ({instructor.reviews} đánh giá)
                    </span>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>Kinh nghiệm:</p>
                    <p className='text-sm'>{instructor.experience}</p>
                  </div>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium'>Chứng chỉ:</p>
                    <ul className='text-sm list-disc pl-5'>
                      {instructor.certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className='flex gap-2'>
                  <Button
                    variant='outline'
                    className='flex-1'
                  >
                    Xem Hồ Sơ
                  </Button>
                  <Button className='flex-1'>Đặt Lịch Học</Button>
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
