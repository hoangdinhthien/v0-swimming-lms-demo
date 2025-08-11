"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Clock,
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
import { fetchCourses } from "@/api/courses-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  fetchOrders,
  Order,
  getOrderUserName,
  getOrderCourseTitle,
  formatPrice,
  getStatusName,
  getStatusClass,
} from "@/api/orders-api";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchDateRangeSchedule,
  fetchWeekSchedule,
  type ScheduleEvent,
} from "@/api/schedule-api";

function ManagerDashboardPage() {
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const { token, tenantId } = useAuth();

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
        const res = await fetchCourses({ tenantId, token });
        setCourses(res.data || []);
      } catch (e: any) {
        setCoursesError(e.message || "Lỗi không xác định");
        setCourses([]);
      }
      setIsLoadingCourses(false);
    }
    fetchCoursesData();
  }, []);

  // Fetch recent orders - Only once on mount
  useEffect(() => {
    async function fetchRecentOrders() {
      const currentToken = getAuthToken();
      const currentTenantId = getSelectedTenant();

      if (!currentToken || !currentTenantId) {
        setIsLoadingOrders(false);
        return;
      }

      setIsLoadingOrders(true);
      try {
        const ordersData = await fetchOrders({
          tenantId: currentTenantId,
          token: currentToken,
          page: 1,
          limit: 5, // Get only the 5 most recent orders
        });

        if (ordersData && ordersData.orders) {
          // Sort by creation date descending to get the most recent first
          const sortedOrders = ordersData.orders.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
          setRecentOrders(sortedOrders);
        }
      } catch (e: any) {
        console.error("Error fetching recent orders:", e);
        setOrdersError(e.message || "Lỗi không thể tải giao dịch gần đây");
        setRecentOrders([]);
      }
      setIsLoadingOrders(false);
    }
    fetchRecentOrders();
  }, []); // ✅ Only fetch once on mount

  // Fetch upcoming schedule events (next 7 days) - Only once on mount
  useEffect(() => {
    async function fetchUpcomingSchedule() {
      const currentToken = getAuthToken();
      const currentTenantId = getSelectedTenant();

      if (!currentToken || !currentTenantId) {
        setIsLoadingSchedule(false);
        return;
      }

      setIsLoadingSchedule(true);
      setScheduleError(null);
      try {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const events = await fetchDateRangeSchedule(today, nextWeek);

        // Sort by date and time
        const sortedEvents = events.sort((a, b) => {
          const dateComparison =
            new Date(a.date).getTime() - new Date(b.date).getTime();
          if (dateComparison !== 0) return dateComparison;

          // If same date, sort by start time
          const aSlot = Array.isArray(a.slot) ? a.slot[0] : a.slot;
          const bSlot = Array.isArray(b.slot) ? b.slot[0] : b.slot;

          if (aSlot && bSlot) {
            const aTime = aSlot.start_time * 60 + aSlot.start_minute;
            const bTime = bSlot.start_time * 60 + bSlot.start_minute;
            return aTime - bTime;
          }
          return 0;
        });

        setScheduleEvents(sortedEvents);
      } catch (e: any) {
        console.error("Error fetching schedule:", e);
        setScheduleError(e.message || "Lỗi không thể tải lịch học");
        setScheduleEvents([]);
      }
      setIsLoadingSchedule(false);
    }
    fetchUpcomingSchedule();
  }, []); // ✅ Only fetch once on mount

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

  // Helper function to format schedule events for display
  const formatScheduleEvent = (event: ScheduleEvent) => {
    const slots = Array.isArray(event.slot) ? event.slot : [event.slot];
    const classrooms = Array.isArray(event.classroom)
      ? event.classroom
      : [event.classroom];
    const pools = Array.isArray(event.pool) ? event.pool : [event.pool];

    const slot = slots[0];
    const classroom = classrooms[0];
    const pool = pools[0];

    if (!slot || !classroom) return null;

    // Format time display
    const formatTime = (hour: number, minute: number) => {
      return `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    };

    const startTime = formatTime(slot.start_time, slot.start_minute);
    const endTime = formatTime(slot.end_time, slot.end_minute);

    // Format date for display
    const eventDate = new Date(event.date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateDisplay = "";
    if (eventDate.toDateString() === today.toDateString()) {
      dateDisplay = "Hôm nay";
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      dateDisplay = "Ngày mai";
    } else {
      dateDisplay = eventDate.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      });
    }

    return {
      id: event._id,
      title: classroom.name,
      time: `${startTime} - ${endTime}`,
      date: dateDisplay,
      instructor: "Đang cập nhật", // API doesn't provide instructor info
      students: "Đang cập nhật", // API doesn't provide student count
      pool: pool?.title || "Chưa phân bổ",
      rawDate: eventDate,
    };
  };

  // Get formatted upcoming classes from schedule events
  const getUpcomingClasses = () => {
    return scheduleEvents
      .map(formatScheduleEvent)
      .filter((event) => event !== null)
      .slice(0, 3); // Show only the first 3 upcoming classes
  };

  return (
    <>
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
      </div>{" "}
      <Tabs defaultValue='overview'>
        <TabsList className='grid w-full grid-cols-3 md:w-auto'>
          <TabsTrigger value='overview'>Tổng Quan</TabsTrigger>
          <TabsTrigger value='calendar'>Lịch</TabsTrigger>
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
              <CardHeader className='flex flex-row items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'>
                    <FileText className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>
                      Tổng Quan Khóa Học
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      Thông tin các khóa học đang hoạt động
                    </p>
                  </div>
                </div>
                {isLoadingCourses && (
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                )}
              </CardHeader>
              <CardContent>
                {isLoadingCourses ? (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 bg-muted rounded-full animate-pulse'></div>
                        <div>
                          <div className='h-4 w-24 bg-muted rounded animate-pulse mb-1'></div>
                          <div className='h-3 w-16 bg-muted rounded animate-pulse'></div>
                        </div>
                      </div>
                      <div className='h-6 w-16 bg-muted rounded animate-pulse'></div>
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-3 bg-muted/10 rounded-lg border'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-muted rounded-full animate-pulse'></div>
                          <div>
                            <div className='h-3 w-20 bg-muted rounded animate-pulse mb-1'></div>
                            <div className='h-2 w-12 bg-muted rounded animate-pulse'></div>
                          </div>
                        </div>
                        <div className='space-y-1'>
                          <div className='h-3 w-12 bg-muted rounded animate-pulse'></div>
                          <div className='h-2 w-8 bg-muted rounded animate-pulse'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : coursesError ? (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <div className='w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-3'>
                      <FileText className='h-6 w-6 text-red-600 dark:text-red-400' />
                    </div>
                    <p className='text-red-600 dark:text-red-400 font-medium mb-1'>
                      Lỗi tải dữ liệu
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {coursesError}
                    </p>
                  </div>
                ) : courses.length > 0 ? (
                  <div className='space-y-4'>
                    {/* Header Stats */}
                    <div className='flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                      <div className='flex items-center space-x-3'>
                        <div className='p-2 bg-blue-500 rounded-full'>
                          <FileText className='h-5 w-5 text-white' />
                        </div>
                        <div>
                          <p className='text-sm font-medium text-blue-900 dark:text-blue-100'>
                            Khóa Học Đang Hoạt Động
                          </p>
                          <p className='text-xs text-blue-700 dark:text-blue-300'>
                            Tổng số khóa học hiện tại
                          </p>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
                          {courses.filter((c) => c.is_active).length}
                        </div>
                        <p className='text-xs text-blue-700 dark:text-blue-300'>
                          khóa học
                        </p>
                      </div>
                    </div>

                    {/* Course List */}
                    <div className='space-y-3'>
                      {courses.slice(0, 4).map((course: any, index: number) => (
                        <div
                          key={course._id}
                          className='group relative flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 cursor-pointer'
                          onClick={() =>
                            router.push(
                              `/dashboard/manager/courses/${course._id}`
                            )
                          }
                        >
                          {/* Left side - Course info */}
                          <div className='flex items-center space-x-3 flex-1 min-w-0'>
                            <div
                              className={`p-2 rounded-full ${
                                index === 0
                                  ? "bg-green-100 dark:bg-green-900"
                                  : index === 1
                                  ? "bg-blue-100 dark:bg-blue-900"
                                  : index === 2
                                  ? "bg-purple-100 dark:bg-purple-900"
                                  : "bg-orange-100 dark:bg-orange-900"
                              }`}
                            >
                              <FileText
                                className={`h-4 w-4 ${
                                  index === 0
                                    ? "text-green-600 dark:text-green-400"
                                    : index === 1
                                    ? "text-blue-600 dark:text-blue-400"
                                    : index === 2
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-orange-600 dark:text-orange-400"
                                }`}
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                                {course.title}
                              </h4>
                              <div className='flex items-center space-x-3 mt-1'>
                                <span className='text-xs text-gray-500 dark:text-gray-400 flex items-center'>
                                  <Users className='h-3 w-3 mr-1' />
                                  {typeof course.students === "number"
                                    ? course.students
                                    : 0}{" "}
                                  học viên
                                </span>
                                <span className='text-xs text-gray-500 dark:text-gray-400'>
                                  •
                                </span>
                                <span className='text-xs font-medium text-green-600 dark:text-green-400'>
                                  {course.price
                                    ? course.price.toLocaleString() + "₫"
                                    : "Miễn phí"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Status and arrow */}
                          <div className='flex items-center space-x-3'>
                            <Badge
                              variant={
                                course.is_active ? "default" : "secondary"
                              }
                              className={
                                course.is_active
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                              }
                            >
                              {course.is_active
                                ? "Đang hoạt động"
                                : "Đã kết thúc"}
                            </Badge>
                            <ArrowRight className='h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-200' />
                          </div>

                          {/* Hover effect overlay */}
                          <div className='absolute inset-0 bg-blue-50 dark:bg-blue-900/10 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-200 pointer-events-none'></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <div className='w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4'>
                      <FileText className='h-8 w-8 text-gray-400' />
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                      Chưa có khóa học nào
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                      Bắt đầu bằng cách tạo khóa học đầu tiên của bạn
                    </p>
                    <Link href='/dashboard/manager/courses/new'>
                      <Button
                        size='sm'
                        className='bg-blue-600 hover:bg-blue-700'
                      >
                        <Plus className='h-4 w-4 mr-1' />
                        Tạo khóa học
                      </Button>
                    </Link>
                  </div>
                )}
                <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
                  <Link href='/dashboard/manager/courses'>
                    <Button
                      variant='outline'
                      className='w-full bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-600'
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
                <div className='flex items-center space-x-2'>
                  <div className='p-2 bg-sky-100 dark:bg-sky-900 rounded-lg'>
                    <Bell className='h-5 w-5 text-sky-600 dark:text-sky-400' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>Thông Báo</CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      Cập nhật mới nhất từ hệ thống
                    </p>
                  </div>
                </div>
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
                        className='flex items-start space-x-3 p-3 bg-muted/20 rounded-lg animate-pulse'
                      >
                        <div className='w-8 h-8 bg-muted rounded-full flex-shrink-0' />
                        <div className='flex-1 space-y-2'>
                          <div className='h-4 w-3/4 bg-muted rounded' />
                          <div className='h-3 w-full bg-muted rounded' />
                          <div className='h-3 w-1/3 bg-muted rounded' />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newsItems.length > 0 ? (
                  <div className='space-y-4'>
                    {/* Show only the 3 most recent notifications */}
                    {newsItems.slice(0, 3).map((newsItem, index: number) => (
                      <Link
                        key={newsItem._id}
                        href={`/dashboard/manager/notifications/${newsItem._id}`}
                        className='block group'
                      >
                        <div className='relative flex items-start space-x-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1'>
                          <div
                            className={`relative p-3 rounded-xl flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 ${
                              index === 0
                                ? "bg-gradient-to-br from-emerald-400 to-teal-500"
                                : index === 1
                                ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                                : "bg-gradient-to-br from-indigo-400 to-blue-500"
                            }`}
                          >
                            <Bell className='h-4 w-4 text-white group-hover:scale-110 transition-transform duration-200' />
                            <div className='absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200' />
                            {/* Notification indicator */}
                            <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white dark:border-gray-800' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between mb-2'>
                              <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 pr-2'>
                                {newsItem.title}
                              </h4>
                              <div className='flex items-center space-x-2 flex-shrink-0'>
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    index === 0
                                      ? "bg-emerald-400"
                                      : index === 1
                                      ? "bg-blue-400"
                                      : "bg-indigo-400"
                                  } animate-pulse`}
                                />
                                <ArrowRight className='h-4 w-4 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-2 transition-all duration-300' />
                              </div>
                            </div>
                            <p className='text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors'>
                              {newsItem.content}
                            </p>
                            <div className='flex items-center justify-between'>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                                  index === 0
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                    : index === 1
                                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                                    : "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
                                }`}
                              >
                                <Calendar className='h-3 w-3 mr-1.5' />
                                {formatRelativeTime(newsItem.created_at)}
                              </span>
                              <div className='text-xs text-gray-400 dark:text-gray-500 font-medium'>
                                Mới
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {manager.notifications.map(
                      (notification, index: number) => (
                        <div
                          key={notification.id}
                          className='relative flex items-start space-x-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 hover:shadow-lg hover:border-amber-200 dark:hover:border-amber-700 transition-all duration-300'
                        >
                          <div
                            className={`relative p-3 rounded-xl flex-shrink-0 shadow-md ${
                              index === 0
                                ? "bg-gradient-to-br from-amber-400 to-orange-500"
                                : index === 1
                                ? "bg-gradient-to-br from-cyan-400 to-blue-500"
                                : "bg-gradient-to-br from-rose-400 to-red-500"
                            }`}
                          >
                            <Bell className='h-4 w-4 text-white' />
                            <div className='absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce border-2 border-white dark:border-gray-800' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-start justify-between mb-2'>
                              <h4 className='text-sm font-semibold text-gray-900 dark:text-gray-100'>
                                {notification.title}
                              </h4>
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  index === 0
                                    ? "bg-amber-400"
                                    : index === 1
                                    ? "bg-cyan-400"
                                    : "bg-rose-400"
                                }`}
                              />
                            </div>
                            <p className='text-xs text-gray-600 dark:text-gray-300 mb-3'>
                              {notification.description}
                            </p>
                            <div className='flex items-center space-x-2'>
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                                  index === 0
                                    ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                    : index === 1
                                    ? "bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-800"
                                    : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800"
                                }`}
                              >
                                <Calendar className='h-3 w-3 mr-1.5' />
                                {notification.time}
                              </span>
                            </div>
                          </div>
                          {/* Subtle hover gradient */}
                          <div className='absolute inset-0 bg-gradient-to-br from-amber-50/30 via-transparent to-orange-50/30 dark:from-amber-900/10 dark:to-orange-900/10 opacity-0 hover:opacity-100 rounded-xl transition-opacity duration-300 pointer-events-none' />
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Empty state when no notifications */}
                {!isLoadingNews &&
                  newsItems.length === 0 &&
                  manager.notifications.length === 0 && (
                    <div className='flex flex-col items-center justify-center py-12 text-center relative'>
                      {/* Background decorative elements */}
                      <div className='absolute inset-0 flex items-center justify-center'>
                        <div className='w-32 h-32 bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-pink-900/20 rounded-full opacity-50' />
                      </div>
                      <div className='relative'>
                        <div className='w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg rotate-3 hover:rotate-6 transition-transform duration-300'>
                          <Bell className='h-8 w-8 text-white' />
                          <div className='absolute inset-0 bg-white/20 rounded-2xl' />
                        </div>
                        <h3 className='text-base font-bold text-gray-900 dark:text-gray-100 mb-2'>
                          Chưa có thông báo nào
                        </h3>
                        <p className='text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-xs'>
                          Thông báo mới sẽ xuất hiện ở đây khi có cập nhật từ hệ
                          thống
                        </p>

                        {/* Animated notification preview cards */}
                        <div className='flex justify-center space-x-2 opacity-30'>
                          <div className='w-2 h-8 bg-gradient-to-t from-indigo-400 to-indigo-200 rounded-full animate-pulse' />
                          <div
                            className='w-2 h-6 bg-gradient-to-t from-purple-400 to-purple-200 rounded-full animate-pulse'
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className='w-2 h-10 bg-gradient-to-t from-pink-400 to-pink-200 rounded-full animate-pulse'
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                <div className='mt-8 pt-6 border-t border-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700 relative'>
                  {/* Decorative border gradient */}
                  <div className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent dark:via-indigo-700' />

                  <Link href='/dashboard/manager/notifications'>
                    <Button
                      variant='outline'
                      className='w-full group relative overflow-hidden bg-gradient-to-br from-white via-indigo-50 to-blue-50 dark:from-gray-800 dark:via-indigo-950 dark:to-blue-950 hover:from-indigo-50 hover:via-blue-50 hover:to-blue-100 dark:hover:from-indigo-950 dark:hover:via-blue-950 dark:hover:to-blue-900 border-2 border-indigo-200 dark:border-indigo-700 hover:border-indigo-300 dark:hover:border-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-200 font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5'
                    >
                      <span className='relative z-10 flex items-center justify-center space-x-2'>
                        <span>Xem Tất Cả Thông Báo</span>
                        <ArrowRight className='ml-2 h-4 w-4 group-hover:translate-x-2 transition-transform duration-300' />
                      </span>

                      {/* Animated background effect */}
                      <div className='absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

                      {/* Shimmer effect */}
                      <div className='absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className='mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
            <Card className='lg:col-span-4'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg'>
                    <DollarSign className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>Giao Dịch Gần Đây</CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      Thanh toán và giao dịch mới nhất
                    </p>
                  </div>
                </div>
                {isLoadingOrders && (
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                )}
              </CardHeader>
              <CardContent>
                {isLoadingOrders ? (
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between p-3 bg-muted/30 rounded-lg'>
                      <div className='flex items-center space-x-3'>
                        <div className='w-10 h-10 bg-muted rounded-full animate-pulse'></div>
                        <div>
                          <div className='h-4 w-24 bg-muted rounded animate-pulse mb-1'></div>
                          <div className='h-3 w-16 bg-muted rounded animate-pulse'></div>
                        </div>
                      </div>
                      <div className='h-6 w-16 bg-muted rounded animate-pulse'></div>
                    </div>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className='flex items-center justify-between p-3 bg-muted/10 rounded-lg border'
                      >
                        <div className='flex items-center space-x-3'>
                          <div className='w-8 h-8 bg-muted rounded-full animate-pulse'></div>
                          <div>
                            <div className='h-3 w-20 bg-muted rounded animate-pulse mb-1'></div>
                            <div className='h-2 w-12 bg-muted rounded animate-pulse'></div>
                          </div>
                        </div>
                        <div className='space-y-1'>
                          <div className='h-3 w-12 bg-muted rounded animate-pulse'></div>
                          <div className='h-2 w-8 bg-muted rounded animate-pulse'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : ordersError ? (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <div className='w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-3'>
                      <DollarSign className='h-6 w-6 text-red-600 dark:text-red-400' />
                    </div>
                    <p className='text-red-600 dark:text-red-400 font-medium mb-1'>
                      Lỗi tải dữ liệu
                    </p>
                    <p className='text-sm text-muted-foreground'>
                      {ordersError}
                    </p>
                  </div>
                ) : recentOrders.length > 0 ? (
                  <div className='space-y-4'>
                    {/* Transaction List */}
                    <div className='space-y-3'>
                      {recentOrders.map((order, index: number) => {
                        const orderDate = new Date(order.created_at);
                        const today = new Date();
                        const isToday =
                          orderDate.toDateString() === today.toDateString();
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        const isYesterday =
                          orderDate.toDateString() === yesterday.toDateString();

                        let dateDisplay = "";
                        if (isToday) {
                          dateDisplay = "Hôm nay";
                        } else if (isYesterday) {
                          dateDisplay = "Hôm qua";
                        } else {
                          dateDisplay = orderDate.toLocaleDateString("vi-VN");
                        }

                        const statusColor =
                          order.status?.[0] === "paid"
                            ? "emerald"
                            : order.status?.[0] === "pending"
                            ? "amber"
                            : "gray";

                        return (
                          <div
                            key={order._id}
                            className='group relative flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all duration-200 cursor-pointer'
                            onClick={() =>
                              router.push(
                                `/dashboard/manager/transactions/${order._id}`
                              )
                            }
                          >
                            {/* Left side - Transaction info */}
                            <div className='flex items-center space-x-3 flex-1 min-w-0'>
                              <div
                                className={`p-2 rounded-full ${
                                  index === 0
                                    ? "bg-emerald-100 dark:bg-emerald-900"
                                    : index === 1
                                    ? "bg-blue-100 dark:bg-blue-900"
                                    : index === 2
                                    ? "bg-purple-100 dark:bg-purple-900"
                                    : index === 3
                                    ? "bg-orange-100 dark:bg-orange-900"
                                    : "bg-gray-100 dark:bg-gray-900"
                                }`}
                              >
                                <DollarSign
                                  className={`h-4 w-4 ${
                                    index === 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : index === 1
                                      ? "text-blue-600 dark:text-blue-400"
                                      : index === 2
                                      ? "text-purple-600 dark:text-purple-400"
                                      : index === 3
                                      ? "text-orange-600 dark:text-orange-400"
                                      : "text-gray-600 dark:text-gray-400"
                                  }`}
                                />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <div className='flex items-center space-x-2 mb-1'>
                                  <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors'>
                                    {getOrderUserName(order)}
                                  </h4>
                                  <span className='text-xs text-gray-400'>
                                    •
                                  </span>
                                  <span className='text-xs text-gray-500 dark:text-gray-400'>
                                    {dateDisplay}
                                  </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                  <div>
                                    <p className='text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]'>
                                      {getOrderCourseTitle(order)}
                                    </p>
                                  </div>
                                  <div className='flex items-center space-x-2'>
                                    <span className='text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                                      {formatPrice(order.price)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Right side - Status and arrow */}
                            <div className='flex items-center space-x-3 ml-4'>
                              <Badge
                                variant='outline'
                                className={`${
                                  statusColor === "emerald"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                                    : statusColor === "amber"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                                    : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                                } text-xs px-2 py-1`}
                              >
                                {getStatusName(order.status)}
                              </Badge>
                              <ArrowRight className='h-4 w-4 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-200' />
                            </div>

                            {/* Hover effect overlay */}
                            <div className='absolute inset-0 bg-emerald-50 dark:bg-emerald-900/10 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-200 pointer-events-none'></div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-12 text-center'>
                    <div className='w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4'>
                      <DollarSign className='h-8 w-8 text-gray-400' />
                    </div>
                    <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                      Chưa có giao dịch nào
                    </h3>
                    <p className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
                      Các giao dịch mới sẽ xuất hiện ở đây
                    </p>
                    <Link href='/dashboard/manager/transactions/new'>
                      <Button
                        size='sm'
                        className='bg-emerald-600 hover:bg-emerald-700'
                      >
                        <Plus className='h-4 w-4 mr-1' />
                        Ghi nhận thanh toán
                      </Button>
                    </Link>
                  </div>
                )}
                <div className='mt-6 pt-4 border-t border-gray-200 dark:border-gray-700'>
                  <Link href='/dashboard/manager/transactions'>
                    <Button
                      variant='outline'
                      className='w-full bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-600'
                    >
                      Xem Tất Cả Giao Dịch
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className='lg:col-span-3'>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='p-2 bg-blue-100 dark:bg-blue-900 rounded-lg'>
                    <Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>Lớp Học Sắp Tới</CardTitle>
                    <p className='text-sm text-muted-foreground'>
                      Lịch học trong 7 ngày tới
                    </p>
                  </div>
                </div>
                {isLoadingSchedule && (
                  <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
                )}
              </CardHeader>
              <CardContent>
                {isLoadingSchedule ? (
                  <div className='space-y-4'>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className='flex flex-col gap-1 border-b pb-3 last:border-0 animate-pulse'
                      >
                        <div className='flex justify-between'>
                          <div className='h-4 w-32 bg-muted rounded'></div>
                          <div className='h-4 w-16 bg-muted rounded'></div>
                        </div>
                        <div className='h-3 w-24 bg-muted rounded'></div>
                        <div className='h-3 w-20 bg-muted rounded'></div>
                      </div>
                    ))}
                  </div>
                ) : scheduleError ? (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <div className='w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-3'>
                      <Calendar className='h-6 w-6 text-red-600 dark:text-red-400' />
                    </div>
                    <h3 className='text-sm font-medium text-red-900 dark:text-red-100 mb-1'>
                      Lỗi tải lịch học
                    </h3>
                    <p className='text-xs text-red-600 dark:text-red-400'>
                      {scheduleError}
                    </p>
                  </div>
                ) : getUpcomingClasses().length > 0 ? (
                  <div className='space-y-4'>
                    {getUpcomingClasses().map((class_) => (
                      <div
                        key={class_.id}
                        className='flex flex-col gap-1 border-b pb-3 last:border-0 hover:bg-muted/30 rounded-lg p-2 transition-colors'
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
                ) : (
                  <div className='flex flex-col items-center justify-center py-8 text-center'>
                    <div className='w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3'>
                      <Calendar className='h-6 w-6 text-gray-400' />
                    </div>
                    <h3 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-1'>
                      Chưa có lớp học nào
                    </h3>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>
                      Lịch học sẽ hiển thị ở đây khi có dữ liệu
                    </p>
                  </div>
                )}
                <div className='mt-4 flex justify-center'>
                  <Link href='/dashboard/manager/calendar'>
                    <Button
                      variant='outline'
                      className='w-full'
                    >
                      Xem Tất Cả Lịch Học
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>{" "}
        <TabsContent value='calendar'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <div className='p-2 bg-purple-100 dark:bg-purple-900 rounded-lg'>
                  <Calendar className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                </div>
                <div>
                  <CardTitle className='text-lg'>Lịch Học và Sự Kiện</CardTitle>
                  <p className='text-sm text-muted-foreground'>
                    Tổng quan lịch học trong tuần tới
                  </p>
                </div>
              </div>
              {isLoadingSchedule && (
                <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
              )}
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {/* Calendar Overview Section */}
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  <div className='bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-4 border border-blue-200 dark:border-blue-800'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-blue-600 dark:text-blue-400'>
                          Tổng Lớp Học
                        </p>
                        <p className='text-2xl font-bold text-blue-900 dark:text-blue-100'>
                          {isLoadingSchedule ? (
                            <span className='w-8 h-6 bg-blue-200 dark:bg-blue-800 animate-pulse rounded'></span>
                          ) : (
                            scheduleEvents.length
                          )}
                        </p>
                      </div>
                      <div className='w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center'>
                        <Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                      </div>
                    </div>
                  </div>

                  <div className='bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-950 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-emerald-600 dark:text-emerald-400'>
                          Hôm Nay
                        </p>
                        <p className='text-2xl font-bold text-emerald-900 dark:text-emerald-100'>
                          {isLoadingSchedule ? (
                            <span className='w-8 h-6 bg-emerald-200 dark:bg-emerald-800 animate-pulse rounded'></span>
                          ) : (
                            scheduleEvents.filter((event) => {
                              const eventDate = new Date(event.date);
                              const today = new Date();
                              return (
                                eventDate.toDateString() ===
                                today.toDateString()
                              );
                            }).length
                          )}
                        </p>
                      </div>
                      <div className='w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center'>
                        <Clock className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                      </div>
                    </div>
                  </div>

                  <div className='bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-950 dark:to-yellow-950 rounded-xl p-4 border border-amber-200 dark:border-amber-800'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-amber-600 dark:text-amber-400'>
                          Tuần Này
                        </p>
                        <p className='text-2xl font-bold text-amber-900 dark:text-amber-100'>
                          {isLoadingSchedule ? (
                            <span className='w-8 h-6 bg-amber-200 dark:bg-amber-800 animate-pulse rounded'></span>
                          ) : (
                            scheduleEvents.filter((event) => {
                              const eventDate = new Date(event.date);
                              const today = new Date();
                              const startOfWeek = new Date(
                                today.setDate(
                                  today.getDate() - today.getDay() + 1
                                )
                              );
                              const endOfWeek = new Date(
                                today.setDate(
                                  today.getDate() - today.getDay() + 7
                                )
                              );
                              return (
                                eventDate >= startOfWeek &&
                                eventDate <= endOfWeek
                              );
                            }).length
                          )}
                        </p>
                      </div>
                      <div className='w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center'>
                        <Users className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                      </div>
                    </div>
                  </div>

                  <div className='bg-gradient-to-br from-rose-50 to-pink-100 dark:from-rose-950 dark:to-pink-950 rounded-xl p-4 border border-rose-200 dark:border-rose-800'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-rose-600 dark:text-rose-400'>
                          Hồ Bơi Sử Dụng
                        </p>
                        <p className='text-2xl font-bold text-rose-900 dark:text-rose-100'>
                          {isLoadingSchedule ? (
                            <span className='w-8 h-6 bg-rose-200 dark:bg-rose-800 animate-pulse rounded'></span>
                          ) : (
                            new Set(
                              scheduleEvents
                                .map((event) => {
                                  const pools = Array.isArray(event.pool)
                                    ? event.pool
                                    : [event.pool];
                                  return pools[0]?.title || "Chưa phân bổ";
                                })
                                .filter((pool) => pool !== "Chưa phân bổ")
                            ).size
                          )}
                        </p>
                      </div>
                      <div className='w-10 h-10 bg-rose-100 dark:bg-rose-900 rounded-lg flex items-center justify-center'>
                        <Waves className='h-5 w-5 text-rose-600 dark:text-rose-400' />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule List Section */}
                <div className='bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-slate-900 dark:text-slate-100'>
                      Lịch Học Chi Tiết
                    </h3>
                    <Link href='/dashboard/manager/calendar'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='text-xs'
                      >
                        Xem Đầy Đủ
                        <ArrowRight className='ml-1 h-3 w-3' />
                      </Button>
                    </Link>
                  </div>

                  {isLoadingSchedule ? (
                    <div className='space-y-3'>
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className='flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg animate-pulse'
                        >
                          <div className='flex items-center space-x-3'>
                            <div className='w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg'></div>
                            <div className='space-y-1'>
                              <div className='h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded'></div>
                              <div className='h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded'></div>
                            </div>
                          </div>
                          <div className='h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded'></div>
                        </div>
                      ))}
                    </div>
                  ) : scheduleError ? (
                    <div className='text-center py-8'>
                      <div className='w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Calendar className='h-8 w-8 text-red-600 dark:text-red-400' />
                      </div>
                      <h3 className='text-lg font-medium text-red-900 dark:text-red-100 mb-2'>
                        Lỗi tải lịch học
                      </h3>
                      <p className='text-sm text-red-600 dark:text-red-400'>
                        {scheduleError}
                      </p>
                    </div>
                  ) : scheduleEvents.length > 0 ? (
                    <div className='space-y-3 max-h-96 overflow-y-auto'>
                      {scheduleEvents.slice(0, 6).map((event, index) => {
                        const formattedEvent = formatScheduleEvent(event);
                        if (!formattedEvent) return null;

                        return (
                          <div
                            key={formattedEvent.id}
                            className='flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 hover:shadow-md transition-shadow group'
                          >
                            <div className='flex items-center space-x-4'>
                              <div
                                className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                  index % 4 === 0
                                    ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                                    : index % 4 === 1
                                    ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400"
                                    : index % 4 === 2
                                    ? "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400"
                                    : "bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                <Clock className='h-5 w-5' />
                              </div>
                              <div className='space-y-1'>
                                <div className='font-medium text-slate-900 dark:text-slate-100'>
                                  {formattedEvent.title}
                                </div>
                                <div className='text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2'>
                                  <span>{formattedEvent.time}</span>
                                  <span>•</span>
                                  <span>{formattedEvent.date}</span>
                                  <span>•</span>
                                  <span>{formattedEvent.pool}</span>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Badge
                                variant='outline'
                                className='text-xs'
                              >
                                {formattedEvent.date}
                              </Badge>
                              <ArrowRight className='h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors' />
                            </div>
                          </div>
                        );
                      })}
                      {scheduleEvents.length > 6 && (
                        <div className='text-center py-3 text-sm text-slate-500 dark:text-slate-400'>
                          Còn {scheduleEvents.length - 6} lớp học khác...
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='text-center py-12'>
                      <div className='w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Calendar className='h-8 w-8 text-slate-400' />
                      </div>
                      <h3 className='text-lg font-medium text-slate-900 dark:text-slate-100 mb-2'>
                        Chưa có lịch học nào
                      </h3>
                      <p className='text-sm text-slate-500 dark:text-slate-400 mb-4'>
                        Lịch học sẽ hiển thị ở đây khi có dữ liệu từ hệ thống
                      </p>
                      <Link href='/dashboard/manager/calendar'>
                        <Button variant='outline'>
                          Đi Tới Trang Lịch
                          <ArrowRight className='ml-2 h-4 w-4' />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className='flex justify-center'>
                  <Link href='/dashboard/manager/calendar'>
                    <Button className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
                      <Calendar className='mr-2 h-4 w-4' />
                      Mở Lịch Đầy Đủ
                      <ArrowRight className='ml-2 h-4 w-4' />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

export default withTenantGuard(ManagerDashboardPage);
