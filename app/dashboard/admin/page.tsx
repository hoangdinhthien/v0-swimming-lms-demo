"use client";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Waves,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  PlusCircle,
  Settings,
  FileText,
  Droplets,
  Wrench,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { withTenantGuard } from "@/components/tenant-provider";

function AdminDashboardPage() {
  // Mock admin data
  const admin = {
    name: "Admin User",
    email: "admin@example.com",
    role: "Administrator",
    centerStats: {
      totalStudents: 156,
      activeInstructors: 8,
      activeCourses: 12,
      totalRevenue: "$15,240",
      poolUtilization: "78%",
    },
    courses: [
      {
        id: 1,
        title: "Bơi cho người mới bắt đầu",
        students: 42,
        instructors: 3,
        revenue: "$5,040",
        status: "Hoạt động",
      },
      {
        id: 2,
        title: "Kỹ thuật trung cấp",
        students: 28,
        instructors: 2,
        revenue: "$4,200",
        status: "Hoạt động",
      },
      {
        id: 3,
        title: "Hiệu suất nâng cao",
        students: 15,
        instructors: 1,
        revenue: "$3,000",
        status: "Hoạt động",
      },
      {
        id: 4,
        title: "An toàn dưới nước",
        students: 35,
        instructors: 2,
        revenue: "$2,800",
        status: "Hoạt động",
      },
    ],
    instructors: [
      {
        id: 1,
        name: "Sarah Johnson",
        specialty: "Bơi cho người mới bắt đầu, An toàn dưới nước",
        students: 32,
        classes: 3,
        rating: 4.9,
        avatar: "/placeholder.svg?height=40&width=40&text=SJ",
      },
      {
        id: 2,
        name: "Michael Chen",
        specialty: "Bơi thi đấu, Kỹ thuật nâng cao",
        students: 18,
        classes: 2,
        rating: 4.8,
        avatar: "/placeholder.svg?height=40&width=40&text=MC",
      },
      {
        id: 3,
        name: "Emma Rodriguez",
        specialty: "Bơi cho trẻ em, Phát triển kỹ thuật bơi",
        students: 25,
        classes: 2,
        rating: 4.7,
        avatar: "/placeholder.svg?height=40&width=40&text=ER",
      },
    ],
    pools: [
      {
        id: 1,
        name: "Hồ Bơi Chính",
        status: "Đang hoạt động",
        temperature: "78°F",
        lastMaintenance: "30 tháng 4, 2023",
        nextMaintenance: "15 tháng 5, 2023",
        lanes: 6,
        currentClasses: 2,
      },
      {
        id: 2,
        name: "Hồ Bơi Huấn Luyện",
        status: "Đang hoạt động",
        temperature: "80°F",
        lastMaintenance: "2 tháng 5, 2023",
        nextMaintenance: "17 tháng 5, 2023",
        lanes: 4,
        currentClasses: 1,
      },
      {
        id: 3,
        name: "Hồ Bơi Nông",
        status: "Đã lên lịch bảo trì",
        temperature: "82°F",
        lastMaintenance: "25 tháng 4, 2023",
        nextMaintenance: "10 tháng 5, 2023",
        lanes: 0,
        currentClasses: 1,
      },
    ],
    recentPayments: [
      {
        id: 1,
        student: "Alex Johnson",
        course: "Bơi cho người mới bắt đầu",
        amount: "$120.00",
        date: "5 tháng 5, 2023",
        status: "Hoàn tất",
      },
      {
        id: 2,
        student: "Emma Wilson",
        course: "Kỹ thuật trung cấp",
        amount: "$150.00",
        date: "4 tháng 5, 2023",
        status: "Hoàn tất",
      },
      {
        id: 3,
        student: "Michael Brown",
        course: "An toàn dưới nước",
        amount: "$80.00",
        date: "3 tháng 5, 2023",
        status: "Hoàn tất",
      },
    ],
  };

  return (
    <DashboardLayout userRole='admin'>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        {" "}
        <div>
          <h1 className='text-3xl font-bold'>Bảng Điều Khiển Quản Trị</h1>
          <p className='text-muted-foreground'>
            Chào mừng trở lại, {admin.name}!
          </p>
        </div>
        <div className='flex gap-2'>
          <Link href='/dashboard/admin/reports'>
            {" "}
            <Button variant='outline'>
              <FileText className='mr-2 h-4 w-4' />
              Báo Cáo
            </Button>
          </Link>
          <Link href='/dashboard/admin/settings'>
            {" "}
            <Button variant='outline'>
              <Settings className='mr-2 h-4 w-4' />
              Cài Đặt
            </Button>
          </Link>
        </div>
      </div>
      <div className='grid gap-6 mt-8 md:grid-cols-3 lg:grid-cols-5'>
        <Card>
          {" "}
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng Số Học Viên
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {admin.centerStats.totalStudents}
            </div>
            <p className='text-xs text-muted-foreground'>Học viên đã đăng ký</p>
          </CardContent>
        </Card>
        <Card>
          {" "}
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Giáo Viên Hoạt Động
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {admin.centerStats.activeInstructors}
            </div>
            <p className='text-xs text-muted-foreground'>Đội ngũ giảng dạy</p>
          </CardContent>
        </Card>
        <Card>
          {" "}
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Khóa Học Hoạt Động
            </CardTitle>
            <Calendar className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {admin.centerStats.activeCourses}
            </div>
            <p className='text-xs text-muted-foreground'>Khóa học đang chạy</p>
          </CardContent>
        </Card>
        <Card>
          {" "}
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng Doanh Thu
            </CardTitle>
            <DollarSign className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {admin.centerStats.totalRevenue}
            </div>
            <p className='text-xs text-muted-foreground'>Tháng này</p>
          </CardContent>
        </Card>
        <Card>
          {" "}
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Sử Dụng Hồ Bơi
            </CardTitle>
            <Waves className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {admin.centerStats.poolUtilization}
            </div>
            <p className='text-xs text-muted-foreground'>
              Mức sử dụng trung bình
            </p>
          </CardContent>
        </Card>
      </div>{" "}
      <Tabs
        defaultValue='courses'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='courses'>Khóa Học</TabsTrigger>
          <TabsTrigger value='instructors'>Giáo Viên</TabsTrigger>
          <TabsTrigger value='pools'>Quản Lý Hồ Bơi</TabsTrigger>
          <TabsTrigger value='finances'>Tài Chính</TabsTrigger>
          <TabsTrigger value='reports'>Báo Cáo</TabsTrigger>
        </TabsList>{" "}
        <TabsContent
          value='courses'
          className='space-y-6 mt-6'
        >
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Quản Lý Khóa Học</h2>
            <Link href='/dashboard/admin/courses/new'>
              <Button>
                <PlusCircle className='mr-2 h-4 w-4' />
                Thêm Khóa Học Mới
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                {" "}
                <table className='w-full'>
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Khóa Học
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Học Viên
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Giáo Viên
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Doanh Thu
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Trạng Thái
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.courses.map((course) => (
                      <tr
                        key={course.id}
                        className='border-b'
                      >
                        <td className='py-3 px-4 font-medium'>
                          {course.title}
                        </td>
                        <td className='py-3 px-4'>{course.students}</td>
                        <td className='py-3 px-4'>{course.instructors}</td>
                        <td className='py-3 px-4'>{course.revenue}</td>
                        <td className='py-3 px-4'>
                          <Badge
                            variant='outline'
                            className='bg-green-50 text-green-700 border-green-200'
                          >
                            {course.status}
                          </Badge>
                        </td>
                        <td className='py-3 px-4'>
                          <div className='flex gap-2'>
                            <Link
                              href={`/dashboard/admin/courses/${course.id}`}
                            >
                              {" "}
                              <Button
                                variant='outline'
                                size='sm'
                              >
                                {" "}
                                Xem
                              </Button>
                            </Link>
                            <Link
                              href={`/dashboard/admin/courses/${course.id}/edit`}
                            >
                              <Button
                                variant='outline'
                                size='sm'
                              >
                                Chỉnh Sửa
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
          value='instructors'
          className='space-y-6 mt-6'
        >
          {" "}
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Quản Lý Giáo Viên</h2>
            <Link href='/dashboard/admin/instructors/new'>
              <Button>
                <PlusCircle className='mr-2 h-4 w-4' />
                Thêm Giáo Viên Mới
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className='p-0'>
              <div className='rounded-md overflow-hidden'>
                <table className='w-full'>
                  {" "}
                  <thead>
                    <tr className='border-b bg-muted/50'>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Giáo Viên
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Chuyên Môn
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Học Viên
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Lớp Học
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Đánh Giá
                      </th>
                      <th className='py-3 px-4 text-left font-medium text-sm'>
                        Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.instructors.map((instructor) => (
                      <tr
                        key={instructor.id}
                        className='border-b'
                      >
                        <td className='py-3 px-4'>
                          <div className='flex items-center gap-2'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage
                                src={instructor.avatar || "/placeholder.svg"}
                                alt={instructor.name}
                              />
                              <AvatarFallback>
                                {instructor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className='font-medium'>
                              {instructor.name}
                            </span>
                          </div>
                        </td>
                        <td className='py-3 px-4 text-sm'>
                          {instructor.specialty}
                        </td>
                        <td className='py-3 px-4'>{instructor.students}</td>
                        <td className='py-3 px-4'>{instructor.classes}</td>
                        <td className='py-3 px-4'>{instructor.rating}/5.0</td>
                        <td className='py-3 px-4'>
                          <div className='flex gap-2'>
                            {" "}
                            <Link
                              href={`/dashboard/admin/instructors/${instructor.id}`}
                            >
                              <Button
                                variant='outline'
                                size='sm'
                              >
                                Xem
                              </Button>
                            </Link>
                            <Link
                              href={`/dashboard/admin/instructors/${instructor.id}/edit`}
                            >
                              {" "}
                              <Button
                                variant='outline'
                                size='sm'
                              >
                                Chỉnh Sửa
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
          value='pools'
          className='space-y-6 mt-6'
        >
          {" "}
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Quản Lý Hồ Bơi</h2>
            <div className='flex gap-2'>
              <Link href='/dashboard/admin/pools/maintenance'>
                <Button variant='outline'>
                  <Wrench className='mr-2 h-4 w-4' />
                  Lịch Bảo Trì
                </Button>
              </Link>
              <Link href='/dashboard/admin/pools/new'>
                <Button>
                  <Droplets className='mr-2 h-4 w-4' />
                  Thêm Hồ Bơi Mới
                </Button>
              </Link>
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {admin.pools.map((pool) => (
              <Card key={pool.id}>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <CardTitle>{pool.name}</CardTitle>
                    <Badge
                      variant='outline'
                      className={
                        pool.status === "Đang hoạt động"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {pool.status}
                    </Badge>
                  </div>{" "}
                  <CardDescription>
                    {pool.lanes} làn đường | Nhiệt độ: {pool.temperature}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Lớp Học Hiện Tại:</span>
                      <span>{pool.currentClasses}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Bảo Trì Gần Nhất:</span>
                      <span>{pool.lastMaintenance}</span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span>Bảo Trì Kế Tiếp:</span>
                      <span>{pool.nextMaintenance}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex gap-2'>
                  <Link
                    href={`/dashboard/admin/pools/${pool.id}`}
                    className='flex-1'
                  >
                    {" "}
                    <Button
                      variant='outline'
                      className='w-full'
                      size='sm'
                    >
                      Xem Chi Tiết
                    </Button>
                  </Link>
                  <Link
                    href={`/dashboard/admin/pools/${pool.id}/schedule`}
                    className='flex-1'
                  >
                    <Button
                      className='w-full'
                      size='sm'
                    >
                      Quản Lý Lịch
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent
          value='finances'
          className='space-y-6 mt-6'
        >
          {" "}
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Tổng Quan Tài Chính</h2>
            <div className='flex gap-2'>
              <Button variant='outline'>
                <FileText className='mr-2 h-4 w-4' />
                Xuất Báo Cáo
              </Button>
              <select className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                <option value='this-month'>Tháng Này</option>
                <option value='last-month'>Tháng Trước</option>
                <option value='last-3-months'>3 Tháng Gần Nhất</option>
                <option value='year-to-date'>Từ Đầu Năm</option>
              </select>
            </div>
          </div>
          <div className='grid gap-6 md:grid-cols-2'>
            <Card>
              {" "}
              <CardHeader>
                <CardTitle>Doanh Thu Theo Khóa Học</CardTitle>
                <CardDescription>
                  Phân tích doanh thu hàng tháng theo khóa học
                </CardDescription>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                  <BarChart3 className='h-16 w-16 mx-auto mb-2' />
                  <p>Biểu đồ doanh thu sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Thanh Toán Gần Đây</CardTitle>
                <CardDescription>
                  Các giao dịch thanh toán mới nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {admin.recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className='flex items-center justify-between border-b pb-4'
                    >
                      <div>
                        <p className='font-medium'>{payment.student}</p>
                        <p className='text-sm text-muted-foreground'>
                          {payment.course}
                        </p>
                        <p className='text-xs text-muted-foreground'>
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
              </CardContent>{" "}
              <CardFooter>
                <Button
                  variant='outline'
                  size='sm'
                >
                  Xem Tất Cả Giao Dịch
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        <TabsContent
          value='reports'
          className='space-y-6 mt-6'
        >
          {" "}
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold'>Báo Cáo & Phân Tích</h2>
            <div className='flex gap-2'>
              <select className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'>
                <option value='this-month'>Tháng Này</option>
                <option value='last-month'>Tháng Trước</option>
                <option value='last-3-months'>3 Tháng Gần Nhất</option>
                <option value='year-to-date'>Từ Đầu Năm</option>
              </select>
              <Button>
                <FileText className='mr-2 h-4 w-4' />
                Tạo Báo Cáo
              </Button>
            </div>
          </div>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <Card>
              {" "}
              <CardHeader>
                <CardTitle>Xu Hướng Ghi Danh</CardTitle>
                <CardDescription>
                  Học viên ghi danh theo thời gian
                </CardDescription>
              </CardHeader>
              <CardContent className='h-60 flex items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                  <BarChart3 className='h-12 w-12 mx-auto mb-2' />
                  <p>Biểu đồ ghi danh sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Khóa Học Phổ Biến</CardTitle>
                <CardDescription>
                  Khóa học bơi được ưa chuộng nhất
                </CardDescription>
              </CardHeader>
              <CardContent className='h-60 flex items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                  <BarChart3 className='h-12 w-12 mx-auto mb-2' />
                  <p>Biểu đồ độ phổ biến khóa học sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Hiệu Suất Giáo Viên</CardTitle>
                <CardDescription>
                  Đánh giá giáo viên và số lượng học viên
                </CardDescription>
              </CardHeader>
              <CardContent className='h-60 flex items-center justify-center'>
                <div className='text-center text-muted-foreground'>
                  <BarChart3 className='h-12 w-12 mx-auto mb-2' />
                  <p>Biểu đồ hiệu suất giáo viên sẽ hiển thị ở đây</p>
                </div>
              </CardContent>
            </Card>
          </div>{" "}
          <Card>
            <CardHeader>
              <CardTitle>Báo Cáo Có Sẵn</CardTitle>
              <CardDescription>
                Tạo và tải xuống các báo cáo chi tiết
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
                <Button
                  variant='outline'
                  className='h-auto py-4 justify-start'
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Tổng Kết Tài Chính</span>
                    <span className='text-xs text-muted-foreground'>
                      Doanh thu, chi phí và lợi nhuận
                    </span>
                  </div>
                </Button>
                <Button
                  variant='outline'
                  className='h-auto py-4 justify-start'
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Báo Cáo Điểm Danh</span>
                    <span className='text-xs text-muted-foreground'>
                      Điểm danh học viên theo khóa học
                    </span>
                  </div>
                </Button>
                <Button
                  variant='outline'
                  className='h-auto py-4 justify-start'
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Hiệu Suất Giáo Viên</span>
                    <span className='text-xs text-muted-foreground'>
                      Đánh giá và phản hồi từ học viên
                    </span>
                  </div>
                </Button>
                <Button
                  variant='outline'
                  className='h-auto py-4 justify-start'
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>
                      Phân Tích Sử Dụng Hồ Bơi
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      Mức độ sử dụng và bảo trì hồ bơi
                    </span>
                  </div>
                </Button>
                <Button
                  variant='outline'
                  className='h-auto py-4 justify-start'
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Tiến Độ Học Viên</span>
                    <span className='text-xs text-muted-foreground'>
                      Kết quả học tập và thành tích
                    </span>
                  </div>
                </Button>
                <Button
                  variant='outline'
                  className='h-auto py-4 justify-start'
                >
                  <div className='flex flex-col items-start'>
                    <span className='font-medium'>Hoàn Thành Khóa Học</span>
                    <span className='text-xs text-muted-foreground'>
                      Tỷ lệ chứng nhận và tốt nghiệp
                    </span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>{" "}
    </DashboardLayout>
  );
}

export default withTenantGuard(AdminDashboardPage);
