"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Users,
  Waves,
  BarChart2,
  Plus,
  ArrowRight,
  Percent,
  Bell,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getNews,
  formatRelativeTime,
  NewsItem,
  getNewsDetail,
} from "@/api/news-api";
import { withTenantGuard } from "@/components/tenant-provider";
import { TenantInfo } from "@/components/tenant-info";
import { fetchCourses } from "@/api/courses-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

function ManagerDashboardPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // Fetch news when the component mounts
  useEffect(() => {
    async function fetchNews() {
      try {
        setIsLoadingNews(true);
        const news = await getNews();
        // Managers can see all notifications/news
        setNewsItems(news);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsLoadingNews(false);
      }
    }

    fetchNews();
  }, []);

  useEffect(() => {
    async function fetchCoursesData() {
      setIsLoadingCourses(true);
      setCoursesError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token)
          throw new Error("Thiếu thông tin tenant hoặc token");
        const data = await fetchCourses({ tenantId, token });
        setCourses(data);
      } catch (e: any) {
        setCoursesError(e.message || "Lỗi không xác định");
        setCourses([]);
      }
      setIsLoadingCourses(false);
    }
    fetchCoursesData();
  }, []);
  // Mock manager data
  const manager = {
    name: "Quản Lý",
    email: "manager@example.com",
    role: "Quản Lý",
    centerStats: {
      totalStudents: 156,
      activeInstructors: 8,
      activeCourses: 12,
      totalRevenue: "$15,240",
      poolUtilization: "78%",
      weeklyNewRegistrations: 24,
    },
    courses: [
      {
        id: 1,
        title: "Bơi Cho Người Mới",
        students: 42,
        instructors: 3,
        revenue: "$5,040",
        status: "Active",
      },
      {
        id: 2,
        title: "Bơi Nâng Cao",
        students: 28,
        instructors: 2,
        revenue: "$3,920",
        status: "Active",
      },
      {
        id: 3,
        title: "An Toàn Dưới Nước",
        students: 36,
        instructors: 2,
        revenue: "$3,600",
        status: "Active",
      },
      {
        id: 4,
        title: "Huấn Luyện Thi Đấu",
        students: 18,
        instructors: 1,
        revenue: "$2,160",
        status: "Active",
      },
    ],
    // We'll keep this as fallback in case API fails
    notifications: [
      {
        id: 1,
        title: "Đăng Ký Học Viên Mới",
        description: "Một học viên mới đã đăng ký khóa Bơi Cho Người Mới",
        time: "3 giờ trước",
      },
      {
        id: 2,
        title: "Huấn Luyện Viên Vắng Mặt",
        description: "Huấn luyện viên Nguyễn Văn A đã báo nghỉ vào ngày mai",
        time: "5 giờ trước",
      },
      {
        id: 3,
        title: "Mức Hóa Chất Hồ Bơi Thấp",
        description: "Cần kiểm tra mức clo tại Hồ Bơi 2",
        time: "Hôm qua",
      },
    ],
    recentTransactions: [
      {
        id: 1,
        student: "Mai Tran",
        course: "Bơi Nâng Cao",
        amount: "$140",
        date: "Hôm nay",
        status: "Completed",
      },
      {
        id: 2,
        student: "Duc Nguyen",
        course: "Bơi Cho Người Mới",
        amount: "$120",
        date: "Hôm nay",
        status: "Completed",
      },
      {
        id: 3,
        student: "Linh Pham",
        course: "An Toàn Dưới Nước",
        amount: "$100",
        date: "Hôm qua",
        status: "Completed",
      },
    ],
    upcomingClasses: [
      {
        id: 1,
        title: "Bơi Cho Người Mới - Nhóm A",
        time: "9:00 - 10:00",
        date: "Hôm nay",
        instructor: "Nguyen Van A",
        students: 12,
        pool: "Hồ bơi 1",
      },
      {
        id: 2,
        title: "Bơi Nâng Cao - Nhóm B",
        time: "10:30 - 12:00",
        date: "Hôm nay",
        instructor: "Tran Thi B",
        students: 8,
        pool: "Hồ bơi 2",
      },
      {
        id: 3,
        title: "Huấn Luyện An Toàn Dưới Nước",
        time: "14:00 - 15:30",
        date: "Hôm nay",
        instructor: "Le Van C",
        students: 15,
        pool: "Hồ bơi 1",
      },
    ],
  };
  return (
    <>
      <TenantInfo />
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Bảng Điều Khiển Quản Lý</h1>
          <p className='text-muted-foreground'>
            Chào mừng trở lại, {manager.name}!
          </p>
        </div>
        <div className='flex gap-2'>
          <Link href='/dashboard/manager/reports'>
            <Button variant='outline'>
              <FileText className='mr-2 h-4 w-4' />
              Báo Cáo
            </Button>
          </Link>
          <Link href='/dashboard/manager/settings'>
            <Button variant='outline'>
              <Settings className='mr-2 h-4 w-4' />
              Cài Đặt
            </Button>
          </Link>
        </div>
      </div>
      <Tabs defaultValue='overview'>
        <TabsList className='grid w-full grid-cols-3 md:w-auto'>
          <TabsTrigger value='overview'>Tổng Quan</TabsTrigger>
          <TabsTrigger value='analytics'>Phân Tích</TabsTrigger>
          <TabsTrigger value='reports'>Báo Cáo</TabsTrigger>
        </TabsList>
        <TabsContent value='overview'>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Tổng Học Viên
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.totalStudents}
                </div>
                <p className='text-xs text-muted-foreground'>
                  +{manager.centerStats.weeklyNewRegistrations} từ tuần trước
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Huấn Luyện Viên Hoạt Động
                </CardTitle>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.activeInstructors}
                </div>
                <p className='text-xs text-muted-foreground'>
                  Tất cả huấn luyện viên đang hoạt động
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Tổng Doanh Thu
                </CardTitle>
                <DollarSign className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.totalRevenue}
                </div>
                <p className='text-xs text-muted-foreground'>
                  +12% so với tháng trước
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Sử Dụng Hồ Bơi
                </CardTitle>
                <Waves className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {manager.centerStats.poolUtilization}
                </div>
                <p className='text-xs text-muted-foreground'>
                  +5% so với tháng trước
                </p>
              </CardContent>
            </Card>
          </div>
          <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>Tổng Quan Khóa Học</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCourses ? (
                  <div className='space-y-2'>Đang tải dữ liệu khóa học...</div>
                ) : coursesError ? (
                  <div className='text-red-500'>{coursesError}</div>
                ) : (
                  <div className='space-y-8'>
                    <div className='space-y-2'>
                      <div className='flex items-center'>
                        <div className='text-sm font-medium'>
                          Khóa Học Đang Hoạt Động
                        </div>
                        <div className='ml-auto'>
                          {courses.filter((c) => c.is_active).length}
                        </div>
                      </div>
                      <div className='space-y-2'>
                        {courses.slice(0, 4).map((course: any) => (
                          <div
                            key={course._id}
                            className='grid grid-cols-4 items-center gap-2'
                          >
                            <div className='text-sm font-medium'>
                              {course.title}
                            </div>
                            <div className='text-right text-sm'>
                              {typeof course.students === "number"
                                ? course.students
                                : 0}{" "}
                              học viên
                            </div>
                            <div className='text-right text-sm'>
                              {course.price
                                ? course.price.toLocaleString() + "₫"
                                : ""}
                            </div>
                            <div className='text-right'>
                              <Badge variant='outline'>
                                {course.is_active
                                  ? "Đang hoạt động"
                                  : "Đã kết thúc"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/courses'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      Xem Tất Cả Khóa Học
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className='lg:col-span-3'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <CardTitle>Thông Báo</CardTitle>
                {isLoadingNews && (
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                )}
              </CardHeader>
              <CardContent>
                {isLoadingNews ? (
                  <div className='space-y-4'>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className='flex items-start gap-2 border-b pb-3'
                      >
                        <div className='mt-1 flex h-2 w-2 rounded-full bg-muted' />
                        <div className='flex flex-1 flex-col gap-1'>
                          <div className='h-4 w-3/4 rounded bg-muted' />
                          <div className='h-3 w-full rounded bg-muted' />
                          <div className='h-3 w-1/4 rounded bg-muted' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newsItems.length > 0 ? (
                  <div className='space-y-4'>
                    {/* Show only the 3 most recent notifications */}
                    {newsItems.slice(0, 3).map((newsItem) => (
                      <Link
                        key={newsItem._id}
                        href={`/dashboard/manager/notifications/${newsItem._id}`}
                        className='block'
                      >
                        <div className='flex items-start gap-2 border-b pb-3 last:border-0 hover:bg-muted/20 p-2 -mx-2 rounded-md transition-colors'>
                          <div className='mt-1 flex h-2 w-2 rounded-full bg-sky-500' />
                          <div className='flex flex-1 flex-col gap-1'>
                            <div className='text-sm font-medium'>
                              {newsItem.title}
                            </div>
                            <div className='text-xs text-muted-foreground line-clamp-2'>
                              {newsItem.content}
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {formatRelativeTime(newsItem.created_at)}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {" "}
                    {manager.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className='flex items-start gap-2 border-b pb-3 last:border-0'
                      >
                        <div className='mt-1 flex h-2 w-2 rounded-full bg-sky-500' />
                        <div className='flex flex-1 flex-col gap-1'>
                          <div className='text-sm font-medium'>
                            {notification.title}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {notification.description}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {notification.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/notifications'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      Xem Tất Cả Thông Báo
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader>
                <CardTitle>Giao Dịch Gần Đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Học viên</TableHead>
                        <TableHead>Khóa học</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead className='text-right'>Trạng thái</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manager.recentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>{transaction.student}</TableCell>
                          <TableCell>{transaction.course}</TableCell>
                          <TableCell>{transaction.amount}</TableCell>
                          <TableCell>{transaction.date}</TableCell>
                          <TableCell className='text-right'>
                            <Badge variant='outline'>Hoàn thành</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/transactions'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      Xem Tất Cả Giao Dịch
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className='lg:col-span-3'>
              <CardHeader>
                <CardTitle>Lớp Học Hôm Nay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {manager.upcomingClasses.map((class_) => (
                    <div
                      key={class_.id}
                      className='flex flex-col gap-1 border-b pb-3 last:border-0'
                    >
                      <div className='flex justify-between'>
                        <div className='text-sm font-medium'>
                          {class_.title}
                        </div>
                        <Badge variant='outline'>{class_.pool}</Badge>
                      </div>
                      <div className='flex items-center gap-2 text-xs'>
                        <Calendar className='h-3 w-3' />
                        <span>
                          {class_.time} • {class_.date}
                        </span>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Huấn luyện viên: {class_.instructor}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Học viên: {class_.students}
                      </div>
                    </div>
                  ))}
                </div>
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/courses'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      Xem Tất Cả Lớp Học
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value='analytics'>
          <Card>
            <CardHeader>
              <CardTitle>Phân Tích Doanh Thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='h-[300px] flex items-center justify-center border-2 border-dashed'>
                  <div className='text-center'>
                    <BarChart2 className='mx-auto h-12 w-12 text-muted-foreground' />
                    <h3 className='mt-2 text-xl font-semibold'>
                      Biểu Đồ Phân Tích
                    </h3>
                    <p className='mt-1 text-sm text-muted-foreground'>
                      Trực quan hóa dữ liệu doanh thu và đăng ký
                    </p>
                    <Link href='/dashboard/manager/analytics'>
                      <Button className='mt-4'>
                        Đến Trang Phân Tích
                        <ArrowRight className='ml-2 h-4 w-4' />
                      </Button>
                    </Link>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời Gian</TableHead>
                      <TableHead>Doanh Thu</TableHead>
                      <TableHead>Học Viên</TableHead>
                      <TableHead>Lớp Học</TableHead>
                      <TableHead className='text-right'>Tăng Trưởng</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-medium'>Tuần Này</TableCell>
                      <TableCell>$3,245</TableCell>
                      <TableCell>24</TableCell>
                      <TableCell>42</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +12%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>Tháng Này</TableCell>
                      <TableCell>$14,560</TableCell>
                      <TableCell>68</TableCell>
                      <TableCell>156</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +23%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className='font-medium'>Năm Nay</TableCell>
                      <TableCell>$124,580</TableCell>
                      <TableCell>1,245</TableCell>
                      <TableCell>312</TableCell>
                      <TableCell className='text-right text-green-600'>
                        +45%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default withTenantGuard(ManagerDashboardPage);
