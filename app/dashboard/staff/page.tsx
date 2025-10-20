"use client";

import { useAuth } from "@/hooks/use-auth";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Calendar, FileText, Award, Bell } from "lucide-react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const { allowedNavigationItems, staffPermissions, loading, isStaff } =
    useStaffPermissions();

  const getStatsCards = () => {
    const allCards = [
      {
        title: "Học Viên",
        icon: <Users className='h-4 w-4' />,
        value: "---",
        description: "Tổng số học viên",
        requiredPermission: "students",
      },
      {
        title: "Khóa Học",
        icon: <BookOpen className='h-4 w-4' />,
        value: "---",
        description: "Tổng số khóa học",
        requiredPermission: "courses",
      },
      {
        title: "Lớp Học",
        icon: <Calendar className='h-4 w-4' />,
        value: "---",
        description: "Tổng số lớp học",
        requiredPermission: "classes",
      },
      {
        title: "Đơn Từ",
        icon: <FileText className='h-4 w-4' />,
        value: "---",
        description: "Đơn từ chờ xử lý",
        requiredPermission: "applications",
      },
      {
        title: "Giáo Viên",
        icon: <Award className='h-4 w-4' />,
        value: "---",
        description: "Tổng số giáo viên",
        requiredPermission: "instructors",
      },
      {
        title: "Tin Tức",
        icon: <Bell className='h-4 w-4' />,
        value: "---",
        description: "Bài viết tin tức",
        requiredPermission: "news",
      },
    ];

    // Filter cards based on staff permissions
    return allCards.filter((card) =>
      allowedNavigationItems.includes(card.requiredPermission)
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Welcome Section */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>
          Chào mừng, {user?.name || user?.fullName || "Nhân viên"}!
        </h1>
        <div className='flex items-center gap-2'>
          <p className='text-muted-foreground'>
            Bảng điều khiển nhân viên - Quản lý các tác vụ được phân quyền
          </p>
          <Badge
            variant='secondary'
            className='bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          >
            Nhân viên
          </Badge>
        </div>
      </div>

      {/* Permissions Info */}
      {isStaff && (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Quyền Truy Cập</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              <p className='text-sm text-muted-foreground'>
                Bạn có quyền truy cập vào các module sau:
              </p>
              <div className='flex flex-wrap gap-2'>
                {allowedNavigationItems.length > 0 ? (
                  allowedNavigationItems.map((item) => (
                    <Badge
                      key={item}
                      variant='outline'
                      className='capitalize'
                    >
                      {getModuleDisplayName(item)}
                    </Badge>
                  ))
                ) : (
                  <p className='text-sm text-muted-foreground italic'>
                    Chưa có quyền truy cập nào được cấp.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      {getStatsCards().length > 0 && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {getStatsCards().map((card, index) => (
            <Card key={index}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {card.title}
                </CardTitle>
                {card.icon}
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{card.value}</div>
                <p className='text-xs text-muted-foreground'>
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {allowedNavigationItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Thao Tác Nhanh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
              {allowedNavigationItems.map((item) => (
                <a
                  key={item}
                  href={`/dashboard/staff/${item}`}
                  className='flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors'
                >
                  {getModuleIcon(item)}
                  <span className='font-medium'>
                    {getModuleDisplayName(item)}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Permissions Message */}
      {allowedNavigationItems.length === 0 && (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center py-12'>
              <div className='mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4'>
                <Users className='h-6 w-6 text-muted-foreground' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>
                Chưa Có Quyền Truy Cập
              </h3>
              <p className='text-muted-foreground mb-4'>
                Tài khoản của bạn chưa được cấp quyền truy cập vào bất kỳ module
                nào.
              </p>
              <p className='text-sm text-muted-foreground'>
                Vui lòng liên hệ với quản lý để được cấp quyền truy cập.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function getModuleDisplayName(module: string): string {
  const displayNames: Record<string, string> = {
    students: "Học Viên",
    instructors: "Giáo Viên",
    courses: "Khóa Học",
    classes: "Lớp Học",
    applications: "Đơn Từ",
    news: "Tin Tức",
    calendar: "Lịch",
    transactions: "Giao Dịch",
    promotions: "Khuyến Mãi",
    settings: "Cài Đặt",
    orders: "Đơn Hàng",
  };
  return displayNames[module] || module;
}

function getModuleIcon(module: string): React.ReactElement {
  const icons: Record<string, React.ReactElement> = {
    students: <Users className='h-4 w-4' />,
    instructors: <Award className='h-4 w-4' />,
    courses: <BookOpen className='h-4 w-4' />,
    classes: <Calendar className='h-4 w-4' />,
    applications: <FileText className='h-4 w-4' />,
    news: <Bell className='h-4 w-4' />,
    calendar: <Calendar className='h-4 w-4' />,
    transactions: <Award className='h-4 w-4' />,
    promotions: <Award className='h-4 w-4' />,
    settings: <Award className='h-4 w-4' />,
    orders: <Award className='h-4 w-4' />,
  };
  return icons[module] || <Award className='h-4 w-4' />;
}
