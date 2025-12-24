"use client";

import { useAuth } from "@/hooks/use-auth";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { useStaffDashboardStats } from "@/hooks/useStaffDashboardStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  Award,
  Bell,
  UserPlus,
} from "lucide-react";
import Link from "next/link";

export default function StaffDashboard() {
  const { user } = useAuth();
  const {
    allowedNavigationItems,
    isStaff,
    loading: permissionsLoading,
  } = useStaffPermissions();
  const {
    stats,
    previewData,
    loading: statsLoading,
  } = useStaffDashboardStats();

  const loading = permissionsLoading || statsLoading;

  const getStatsCards = () => {
    const allCards = [
      {
        title: "Học Viên",
        icon: <Users className="h-4 w-4" />,
        value: stats.students !== null ? stats.students : "---",
        description: "Tổng số học viên",
        requiredPermission: "students",
      },
      {
        title: "Khóa Học",
        icon: <BookOpen className="h-4 w-4" />,
        value: stats.courses !== null ? stats.courses : "---",
        description: "Tổng số khóa học",
        requiredPermission: "courses",
      },
      {
        title: "Lớp Học",
        icon: <Calendar className="h-4 w-4" />,
        value: stats.classes !== null ? stats.classes : "---",
        description: "Tổng số lớp học",
        requiredPermission: "classes",
      },
      {
        title: "Đơn Từ",
        icon: <FileText className="h-4 w-4" />,
        value: stats.applications !== null ? stats.applications : "---",
        description: "Đơn từ chờ xử lý",
        requiredPermission: "applications",
      },
      {
        title: "Huấn luyện viên",
        icon: <Award className="h-4 w-4" />,
        value: stats.instructors !== null ? stats.instructors : "---",
        description: "Tổng số Huấn luyện viên",
        requiredPermission: "instructors",
      },
      {
        title: "Tin Tức",
        icon: <Bell className="h-4 w-4" />,
        value: stats.news !== null ? stats.news : "---",
        description: "Bài viết tin tức",
        requiredPermission: "news",
      },
    ];

    // Filter cards based on staff permissions
    return allCards.filter((card) =>
      allowedNavigationItems.includes(card.requiredPermission)
    );
  };

  // Helper to safely format date
  const safeDate = (dateString: string | undefined): Date => {
    if (!dateString) return new Date();
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Chào mừng, {user?.name || user?.fullName || "Nhân viên"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Quản lý các hoạt động và theo dõi thông tin trung tâm
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full border">
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 border-0 px-3 py-1"
          >
            Nhân viên
          </Badge>
        </div>
      </div>

      {isStaff && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4 border border-blue-100 dark:border-blue-900/50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mt-0.5">
              <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Phân quyền truy cập</h3>
              <div className="flex flex-wrap gap-2">
                {allowedNavigationItems.length > 0 ? (
                  allowedNavigationItems.map((item) => (
                    <Badge
                      key={item}
                      variant="outline"
                      className="bg-white/50 dark:bg-black/50 hover:bg-white dark:hover:bg-black transition-colors capitalize text-xs"
                    >
                      {getModuleDisplayName(item)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Chưa có quyền truy cập nào.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {getStatsCards().length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {getStatsCards().map((card, index) => (
            <Card
              key={index}
              className="overflow-hidden border-0 shadow-sm bg-white dark:bg-gray-950 hover:shadow-md transition-shadow group ring-1 ring-gray-200 dark:ring-gray-800"
            >
              <CardContent className="p-5 flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full group-hover:scale-110 transition-transform">
                  <div className="text-gray-600 dark:text-gray-400">
                    {card.icon}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    {card.value}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wide">
                    {card.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Left Column (Courses) - Takes up 2 columns on large screens */}
        <div className="xl:col-span-2 space-y-6">
          {allowedNavigationItems.includes("courses") && (
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    Khóa học mới
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Các khóa học gần đây tại trung tâm
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted font-normal"
                >
                  Xem tất cả
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-muted/30 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : previewData?.recentCourses?.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {previewData.recentCourses.map(
                      (course: any, idx: number) => (
                        <Link
                          href={`/dashboard/manager/courses/${course._id}`}
                          key={course._id || idx}
                          className="flex items-center gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors"
                        >
                          <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {course.media && course.media.length > 0 ? (
                              <img
                                src={course.media[0].path}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <BookOpen className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {course.title}
                            </h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />{" "}
                                {Array.isArray(course.students)
                                  ? course.students.length
                                  : course.students || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{" "}
                                {course.session_number || 0} buổi
                              </span>
                              {course.category &&
                                course.category.length > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs">
                                    {typeof course.category[0] === "object"
                                      ? (course.category[0] as any).title ||
                                        (course.category[0] as any).name
                                      : course.category[0]}
                                  </span>
                                )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                              {course.price
                                ? course.price.toLocaleString() + "₫"
                                : "Free"}
                            </div>
                            <Badge
                              variant={
                                course.is_active ? "default" : "secondary"
                              }
                              className="mt-1 text-[10px] h-5 px-1.5 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                            >
                              {course.is_active ? "Open" : "Closed"}
                            </Badge>
                          </div>
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Chưa có dữ liệu khóa học.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (Students & News) */}
        <div className="xl:col-span-1 space-y-6">
          {/* New Students Section */}
          {allowedNavigationItems.includes("students") && (
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-emerald-500" />
                    Học viên mới
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-muted/40" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-muted/40 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : previewData?.recentStudents?.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {previewData.recentStudents.map(
                      (item: any, idx: number) => {
                        // Handle nested structure: raw item usually has { user: {...}, role: ... }
                        const student = item.user || item;
                        const name =
                          student.full_name ||
                          student.name ||
                          student.username ||
                          "Học viên";
                        const email = student.email || "No email";
                        const avatar = student.avatar || student.featured_image;

                        return (
                          <Link
                            href={`/dashboard/manager/students/${student._id}`}
                            key={student._id || idx}
                            className="flex items-center gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors"
                          >
                            <Avatar className="h-10 w-10 border border-gray-100 dark:border-gray-800">
                              <AvatarImage
                                src={avatar}
                                alt={name}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-sm">
                                {name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {name}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {email}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {safeDate(student.created_at).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </Link>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Chưa có học viên mới.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notifications/News */}
          {allowedNavigationItems.includes("news") && (
            <Card className="border-0 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
              <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Thông báo
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-muted/40" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-muted/40 rounded" />
                          <div className="h-3 w-1/2 bg-muted/30 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : previewData?.recentNews?.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {previewData.recentNews.map(
                      (newsItem: any, index: number) => {
                        const date = safeDate(newsItem.created_at);
                        return (
                          <Link
                            href={`/dashboard/manager/news/${newsItem._id}`}
                            key={newsItem._id || index}
                            className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-col items-center hidden sm:flex shrink-0 w-12 text-center">
                                <div className="text-lg font-bold text-gray-400 group-hover:text-amber-500 transition-colors leading-none">
                                  {date.getDate()}
                                </div>
                                <div className="text-[9px] uppercase text-gray-400 font-semibold mt-0.5">
                                  T{date.getMonth() + 1}
                                </div>
                              </div>
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  {index === 0 && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                                  )}
                                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                                    {newsItem.title}
                                  </h4>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {newsItem.content}
                                </p>
                                <div className="flex items-center gap-2 pt-1 text-[10px] text-gray-400">
                                  <span>
                                    {date.toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    {newsItem.created_by?.username || "Admin"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    Không có thông báo mới.
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Quick Actions - Floating or Bottom Grid */}
      {allowedNavigationItems.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Thao tác nhanh
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {allowedNavigationItems.map((item) => (
              <Link
                key={item}
                href={`/dashboard/manager/${item}`}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-sm transition-all group"
              >
                <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-900 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 text-gray-500 group-hover:text-blue-600 transition-colors">
                  {getModuleIcon(item)}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200">
                  {getModuleDisplayName(item)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getModuleDisplayName(module: string): string {
  const displayNames: Record<string, string> = {
    students: "Học Viên",
    instructors: "Huấn luyện viên",
    courses: "Khóa Học",
    classes: "Lớp Học",
    applications: "Đơn Từ",
    news: "Tin Tức",
    calendar: "Lịch",
    transactions: "Giao Dịch",
    promotions: "Khuyến Mãi",
    settings: "Cài Đặt",
    orders: "Giao Dịch",
    contacts: "Liên hệ",
    reports: "Báo cáo",
  };
  return displayNames[module] || module;
}

function getModuleIcon(module: string): React.ReactElement {
  const icons: Record<string, React.ReactElement> = {
    students: <Users className="h-4 w-4" />,
    instructors: <Award className="h-4 w-4" />,
    courses: <BookOpen className="h-4 w-4" />,
    classes: <Calendar className="h-4 w-4" />,
    applications: <FileText className="h-4 w-4" />,
    news: <Bell className="h-4 w-4" />,
    calendar: <Calendar className="h-4 w-4" />,
    transactions: <Award className="h-4 w-4" />,
    promotions: <Award className="h-4 w-4" />,
    settings: <Award className="h-4 w-4" />,
    orders: <Award className="h-4 w-4" />,
    contacts: <Users className="h-4 w-4" />,
    reports: <FileText className="h-4 w-4" />,
  };
  return icons[module] || <Award className="h-4 w-4" />;
}
