import Link from "next/link";
import type { ReactNode } from "react";
import {
  Waves,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  Award,
  Settings,
  BarChart3,
  CreditCard,
  MessageSquare,
  Bell,
  Percent,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: "student" | "instructor" | "admin";
}

export default function DashboardLayout({
  children,
  userRole,
}: DashboardLayoutProps) {
  const navItems = {
    student: [
      {
        href: "/dashboard/student",
        label: "Bảng Điều Khiển",
        icon: <LayoutDashboard className='h-5 w-5' />,
      },
      {
        href: "/dashboard/student/courses",
        label: "Khóa Học Của Tôi",
        icon: <Award className='h-5 w-5' />,
      },
      {
        href: "/dashboard/student/schedule",
        label: "Lịch Học",
        icon: <Calendar className='h-5 w-5' />,
      },
      {
        href: "/dashboard/student/payments",
        label: "Thanh Toán",
        icon: <CreditCard className='h-5 w-5' />,
      },
      {
        href: "/dashboard/student/notifications",
        label: "Thông Báo",
        icon: <Bell className='h-5 w-5' />,
      },
      {
        href: "/chat",
        label: "Tin Nhắn",
        icon: <MessageSquare className='h-5 w-5' />,
      },
      {
        href: "/dashboard/student/feedback",
        label: "Đánh Giá",
        icon: <Star className='h-5 w-5' />,
      },
    ],
    instructor: [
      {
        href: "/dashboard/instructor",
        label: "Bảng Điều Khiển",
        icon: <LayoutDashboard className='h-5 w-5' />,
      },
      {
        href: "/dashboard/instructor/classes",
        label: "Lớp Học Của Tôi",
        icon: <Users className='h-5 w-5' />,
      },
      {
        href: "/dashboard/instructor/students",
        label: "Học Viên",
        icon: <Users className='h-5 w-5' />,
      },
      {
        href: "/dashboard/instructor/schedule",
        label: "Lịch Dạy",
        icon: <Calendar className='h-5 w-5' />,
      },
      {
        href: "/dashboard/instructor/feedback",
        label: "Phản Hồi",
        icon: <MessageSquare className='h-5 w-5' />,
      },
      {
        href: "/chat",
        label: "Tin Nhắn",
        icon: <MessageSquare className='h-5 w-5' />,
      },
    ],
    admin: [
      {
        href: "/dashboard/admin",
        label: "Bảng Điều Khiển",
        icon: <LayoutDashboard className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/courses",
        label: "Khóa Học",
        icon: <Award className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/instructors",
        label: "Giáo Viên",
        icon: <Users className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/students",
        label: "Học Viên",
        icon: <Users className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/pools",
        label: "Quản Lý Hồ Bơi",
        icon: <Waves className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/finances",
        label: "Tài Chính",
        icon: <CreditCard className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/promotions",
        label: "Khuyến Mãi",
        icon: <Percent className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/reports",
        label: "Báo Cáo",
        icon: <BarChart3 className='h-5 w-5' />,
      },
      {
        href: "/dashboard/admin/settings",
        label: "Cài Đặt",
        icon: <Settings className='h-5 w-5' />,
      },
    ],
  };

  return (
    <div className='flex flex-col min-h-screen'>
      {" "}
      {/* Header */}{" "}
      <header className='sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between'>
          <Link
            href='/'
            className='flex items-center gap-2 font-bold text-xl'
          >
            {" "}
            <Waves className='h-6 w-6 text-sky-500' />
            <span>AquaLearn</span>
          </Link>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700'>
                <User className='h-4 w-4' />
              </div>
              <span className='text-sm font-medium hidden md:inline-block'>
                {userRole === "student"
                  ? "Alex Johnson"
                  : userRole === "instructor"
                  ? "Sarah Johnson"
                  : "Admin User"}
              </span>
            </div>
            <Button
              variant='ghost'
              size='icon'
            >
              <LogOut className='h-5 w-5' />
              <span className='sr-only'>Đăng xuất</span>
            </Button>
          </div>
        </div>
      </header>
      <div className='flex flex-1'>
        {/* Sidebar */}
        <aside className='hidden md:block w-64 flex-shrink-0 border-r border-border bg-sidebar'>
          <div className='flex flex-col gap-2 p-4 sticky top-16'>
            {navItems[userRole].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-sidebar-accent
                  ${
                    item.href.endsWith(userRole)
                      ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                      : "text-sidebar-foreground"
                  }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>{" "}
        </aside>{" "}
        {/* Main Content */}
        <main className='flex-1 w-full overflow-auto'>
          <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 md:py-6 lg:py-8'>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
