"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import RoleGuard from "@/components/role-guard";
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
  Menu,
  X,
  Building,
  // Add new icons for better visual hierarchy
  Home,
  GraduationCap,
  UserCheck,
  BookOpen,
  Clock,
  FileText,
  CreditCard as PaymentIcon,
  Tag,
  Cog,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { logout, getAuthenticatedUser } from "@/api/auth-utils";
import { getUserFrontendRole } from "@/api/role-utils";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LoadingScreen } from "@/components/loading-screen";
import { getSelectedTenant, setSelectedTenant } from "@/utils/tenant-utils";
import { getTenantInfo, getAvailableTenants } from "@/api/tenant-api";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: "student" | "instructor" | "admin" | "manager" | "staff"; // Optional, will use from auth if not provided
}

export default function DashboardLayout({
  children,
  userRole: propUserRole,
}: DashboardLayoutProps) {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState<string>(propUserRole || "");
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState("");
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantIdState] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // Normalize pathnames for robust comparisons (remove trailing slash and query)
  const normalizePath = (p?: string) =>
    (p || "").replace(/\?.*$/, "").replace(/\/$/, "");
  // (debug logs moved down after isStaff is available)

  // Staff permissions hook
  const {
    allowedNavigationItems,
    isManager,
    isStaff,
    loading: permissionsLoading,
  } = useStaffPermissions(); // Handle tenant switching

  const handleTenantSwitch = async (newTenantId: string) => {
    try {
      // Set the new tenant ID
      setSelectedTenant(newTenantId);
      setSelectedTenantIdState(newTenantId);

      // Update the tenant name
      const tenantInfo = await getTenantInfo(newTenantId);
      setTenantName(tenantInfo.title);

      // Refresh the page to reload data with new tenant
      window.location.reload();
    } catch (error) {
      console.error("Error switching tenant:", error);
    }
  };

  // Get the current user's name and role from localStorage on component mount
  useEffect(() => {
    const user = getAuthenticatedUser();

    if (user) {
      // Set user name from available fields
      setUserName(user.name || user.fullName || user.username || "User");

      // Get the actual user role
      const actualRole = getUserFrontendRole();
      setUserRole(actualRole);
    } // Load tenant info and available tenants
    const loadTenantInfo = async () => {
      try {
        const selectedTenantId = getSelectedTenant();
        if (selectedTenantId) {
          setSelectedTenantIdState(selectedTenantId);

          // Load current tenant info
          const tenantInfo = await getTenantInfo(selectedTenantId);
          setTenantName(tenantInfo.title);
          // Load all available tenants
          const tenants = await getAvailableTenants();
          setAvailableTenants(tenants);
        }
      } catch (error) {
        console.error("Error fetching tenant info:", error);
        setTenantName("");
        setAvailableTenants([]);
      }
    };

    loadTenantInfo();

    // Simulate loading delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Adjust the delay as needed

    // Keyboard shortcut for sidebar toggle (Ctrl/Cmd + B)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        setSidebarCollapsed((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  // Get role display name based on user role
  const getRoleDisplayName = () => {
    if (isStaff) {
      return "Nhân Viên";
    }
    return "Quản Lý";
  };

  const handleLogout = () => {
    logout();
  }; // Navigation items - for this version, we only have manager role
  const navItems = {
    manager: [
      {
        name: "Dashboard",
        href: "/dashboard/manager",
        icon: <Home className='h-4 w-4' />,
      },
      {
        name: "Học Viên",
        href: "/dashboard/manager/students",
        icon: <GraduationCap className='h-4 w-4' />,
      },
      {
        name: "Giáo Viên",
        href: "/dashboard/manager/instructors",
        icon: <UserCheck className='h-4 w-4' />,
      },
      {
        name: "Nhân Viên",
        href: "/dashboard/manager/staff",
        icon: <Users className='h-4 w-4' />,
      },
      {
        name: "Khóa Học",
        href: "/dashboard/manager/courses",
        icon: <BookOpen className='h-4 w-4' />,
      },
      {
        name: "Lớp Học",
        href: "/dashboard/manager/classes",
        icon: <Users className='h-4 w-4' />,
      },
      {
        name: "Hồ Bơi",
        href: "/dashboard/manager/pools",
        icon: <Waves className='h-4 w-4' />,
      },
      {
        name: "Slots",
        href: "/dashboard/manager/slots",
        icon: <Clock className='h-4 w-4' />,
      },
      {
        name: "Phê duyệt",
        href: "/dashboard/manager/data-review",
        icon: <FileCheck className='h-4 w-4' />,
      },
      {
        name: "Tin tức",
        href: "/dashboard/manager/news",
        icon: <Bell className='h-4 w-4' />,
      },
      {
        name: "Lịch",
        href: "/dashboard/manager/calendar",
        icon: <Clock className='h-4 w-4' />,
      },
      {
        name: "Liên hệ",
        href: "/dashboard/manager/contacts",
        icon: <MessageSquare className='h-4 w-4' />,
      },
      {
        name: "Đơn từ",
        href: "/dashboard/manager/applications",
        icon: <FileText className='h-4 w-4' />,
      },
      {
        name: "Loại Đơn Từ",
        href: "/dashboard/manager/application-types",
        icon: <Settings className='h-4 w-4' />,
      },
      {
        name: "Giao Dịch",
        href: "/dashboard/manager/transactions",
        icon: <PaymentIcon className='h-4 w-4' />,
      },
      // {
      //   name: "Khuyến Mãi",
      //   href: "/dashboard/manager/promotions",
      //   icon: <Tag className='h-4 w-4' />,
      // },
      {
        name: "Cài Đặt Tài Khoản",
        href: "/dashboard/manager/settings",
        icon: <Cog className='h-4 w-4' />,
      },
    ],
    // We keep this structure for compatibility but it won't be used
    admin: [
      {
        name: "Dashboard",
        href: "/dashboard/admin",
        icon: <LayoutDashboard className='h-4 w-4 mr-2' />,
      },
      {
        name: "Học Viên",
        href: "/dashboard/admin/students",
        icon: <Users className='h-4 w-4 mr-2' />,
      },
      {
        name: "Giáo Viên",
        href: "/dashboard/admin/instructors",
        icon: <Users className='h-4 w-4 mr-2' />,
      },
      {
        name: "Khóa Học",
        href: "/dashboard/admin/courses",
        icon: <Award className='h-4 w-4 mr-2' />,
      },
      {
        name: "Giao Dịch",
        href: "/dashboard/admin/transactions",
        icon: <CreditCard className='h-4 w-4 mr-2' />,
      },
      {
        name: "Thống Kê",
        href: "/dashboard/admin/analytics",
        icon: <BarChart3 className='h-4 w-4 mr-2' />,
      },
      // {
      //   name: "Khuyến Mãi",
      //   href: "/dashboard/admin/promotions",
      //   icon: <Percent className='h-4 w-4 mr-2' />,
      // },
      {
        name: "Cài Đặt Hệ Thống",
        href: "/dashboard/admin/settings",
        icon: <Settings className='h-4 w-4 mr-2' />,
      },
    ],
  };

  // Function to filter navigation items based on staff permissions
  const getFilteredNavItems = (): {
    name: string;
    href: string;
    icon: React.ReactElement;
  }[] => {
    const baseNavItems = navItems.manager;

    // If user is manager, show all items with manager routes
    if (isManager) {
      return baseNavItems;
    }

    // If user is staff, filter based on permissions and use staff routes
    if (isStaff) {
      return baseNavItems
        .filter((item) => {
          // Extract the route from href (e.g., "/dashboard/manager/students" -> "students")
          const routeParts = item.href.split("/");
          const route = routeParts[routeParts.length - 1];

          const allowed = allowedNavigationItems.includes(route);

          // Always allow dashboard access
          if (route === "manager") {
            return true;
          }

          // Check if staff has permission for this route
          return allowed;
        })
        .map((item) => {
          // Convert manager routes to staff routes for staff users
          if (isStaff) {
            const href = item.href.replace(
              "/dashboard/manager",
              "/dashboard/staff"
            );
            return {
              ...item,
              href,
            };
          }
          return item;
        });
    }

    // Default to empty for other roles
    return [];
  };

  // For this version of the application, we're focusing on manager functionality
  // Default to manager navigation items unless explicitly overridden  // For this version, we always use manager navigation items
  const currentNavItems = getFilteredNavItems();

  // Build the content
  const content = (
    <div className='flex min-h-screen flex-col'>
      {/* Header */}
      <header className='fixed top-0 left-0 right-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6'>
        <nav className='hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6'>
          <Link
            href='/'
            className='flex items-center gap-2 font-semibold'
          >
            <Waves className='h-6 w-6 text-sky-500' />
            <span className='hidden md:inline-block'>
              SCMP {isStaff ? "Staff" : "Manager"}
            </span>
          </Link>
        </nav>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='md:hidden'
            >
              <Menu className='h-5 w-5' />
              sidebarCollapsed ? "opacity-0 h-0 p-0" : "opacity-100"
            </Button>
          </SheetTrigger>{" "}
          <SheetContent
            side='left'
            className='pr-0 overflow-y-auto'
          >
            <div className='px-4 py-6'>
              <div className='mb-6'>
                <Link
                  href='/'
                  className='flex items-center gap-2 font-semibold text-lg'
                >
                  <Waves className='h-6 w-6 text-sky-500' />
                  <span>SCMP</span>
                </Link>
              </div>

              <div className='space-y-2'>
                {currentNavItems.map((item) => {
                  const isActive =
                    normalizePath(pathname) === normalizePath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className='mt-6 pt-6 border-t'>
                <AlertDialog
                  open={logoutDialogOpen}
                  onOpenChange={setLogoutDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='ghost'
                      className='w-full justify-start px-3 text-muted-foreground hover:text-foreground'
                    >
                      <LogOut className='h-4 w-4 mr-3' />
                      Đăng xuất
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Bạn chắc chắn muốn đăng xuất?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn sẽ bị đăng xuất khỏi tài khoản của mình. Để tiếp tục
                        sử dụng, bạn sẽ cần đăng nhập lại.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>
                        Đăng xuất
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SheetContent>
        </Sheet>{" "}
        <div className='flex flex-1 items-center gap-4 md:gap-2 lg:gap-4'>
          {/* Tenant Dropdown */}
          {tenantName && availableTenants.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className='flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md px-2 py-1 hover:bg-muted'
                  title='Switch tenant'
                >
                  <Building className='h-4 w-4' />
                  <span className='hidden md:inline'>Chi nhánh:</span>
                  <span className='font-semibold text-foreground'>
                    {tenantName}
                  </span>
                  <ChevronDown className='h-4 w-4' />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align='start'
                className='w-64'
              >
                <DropdownMenuLabel>Chọn Chi Nhánh</DropdownMenuLabel>
                <DropdownMenuSeparator />{" "}
                {availableTenants.map((tenant) => (
                  <DropdownMenuItem
                    key={tenant.tenant_id._id}
                    onClick={() => handleTenantSwitch(tenant.tenant_id._id)}
                    className='flex items-center justify-between cursor-pointer'
                  >
                    <div className='flex flex-col'>
                      <span className='font-medium'>
                        {tenant.tenant_id.title}
                      </span>
                    </div>
                    {selectedTenantId === tenant.tenant_id._id && (
                      <Check className='h-4 w-4 text-primary' />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className='ml-auto flex items-center gap-2'>
            <div className='hidden items-center gap-2 md:flex'>
              <span className='text-sm text-muted-foreground'>
                Xin chào, {userName || getRoleDisplayName()}
              </span>
              {isStaff && (
                <span className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full border border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800'>
                  Nhân viên
                </span>
              )}
              <div className='h-6 w-px bg-muted'></div>
              {/* Add ThemeToggle button here */}
              <ThemeToggle />
              <AlertDialog
                open={logoutDialogOpen}
                onOpenChange={setLogoutDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='justify-start gap-2 px-2'
                  >
                    <LogOut className='h-4 w-4' />
                    <span>Đăng xuất</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Bạn chắc chắn muốn đăng xuất?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn sẽ bị đăng xuất khỏi tài khoản của mình. Để tiếp tục
                      sử dụng, bạn sẽ cần đăng nhập lại.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Đăng xuất
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>{" "}
      <div className='flex flex-1'>
        <nav
          className={`hidden border-r bg-gradient-to-b from-slate-50/90 to-slate-100/50 dark:from-slate-800/90 dark:to-slate-900/50 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 dark:supports-[backdrop-filter]:bg-slate-800/60 md:flex h-[calc(100vh-64px)] fixed top-16 z-20 shadow-sm border-r-border/50 transition-all duration-300 ${
            sidebarCollapsed ? "w-[70px]" : "w-[260px]"
          }`}
        >
          <div className='flex flex-col w-full'>
            {/* Sidebar Header */}
            <div className='p-4 border-b border-border/50 flex items-center justify-between'>
              <div
                className={`flex items-center gap-2 text-sm font-medium text-muted-foreground transition-opacity duration-200 ${
                  sidebarCollapsed ? "opacity-0" : "opacity-100"
                }`}
              >
                <Building className='h-4 w-4 text-primary' />
                {!sidebarCollapsed && (
                  <span>
                    {isStaff ? "Hệ Thống Nhân Viên" : "Quản Lý Hệ Thống"}
                  </span>
                )}
              </div>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className='h-8 w-8 p-0 hover:bg-muted'
                title={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className='h-4 w-4' />
                ) : (
                  <ChevronLeft className='h-4 w-4' />
                )}
              </Button>
            </div>

            {/* Navigation Items */}
            <div className='flex-1 overflow-y-auto px-3 py-4'>
              <div className='space-y-6'>
                {/* Overview Section */}
                <div className='space-y-1'>
                  <div
                    className={`px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-opacity duration-200 ${
                      sidebarCollapsed ? "opacity-0 h-0 p-0" : "opacity-100"
                    }`}
                  >
                    {!sidebarCollapsed && "Tổng Quan"}
                  </div>
                  <Link
                    href={isStaff ? "/dashboard/staff" : "/dashboard/manager"}
                    className={`group flex items-center ${
                      sidebarCollapsed ? "justify-center" : "gap-3"
                    } rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 relative
                      ${
                        normalizePath(pathname) ===
                        normalizePath(
                          isStaff ? "/dashboard/staff" : "/dashboard/manager"
                        )
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    title={sidebarCollapsed ? "Dashboard" : undefined}
                  >
                    <div
                      className={`flex-shrink-0 ${
                        pathname ===
                        (isStaff ? "/dashboard/staff" : "/dashboard/manager")
                          ? "text-primary-foreground"
                          : "group-hover:text-foreground"
                      }`}
                    >
                      <Home className='h-4 w-4' />
                    </div>
                    {!sidebarCollapsed && (
                      <span className='truncate'>Dashboard</span>
                    )}
                    {normalizePath(pathname) ===
                      normalizePath(
                        isStaff ? "/dashboard/staff" : "/dashboard/manager"
                      ) && (
                      <div className='absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full' />
                    )}
                  </Link>
                </div>

                {/* Management Section - Permission-based for staff */}
                <div className='space-y-1'>
                  <div
                    className={`px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-opacity duration-200 ${
                      sidebarCollapsed ? "opacity-0 h-0 p-0" : "opacity-100"
                    }`}
                  >
                    {!sidebarCollapsed && "Quản Lý"}
                  </div>
                  {[
                    // User module items - only show if has User permission
                    ...(isManager || allowedNavigationItems.includes("students")
                      ? [
                          {
                            name: "Học Viên",
                            href: "/dashboard/manager/students",
                            icon: <GraduationCap className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    ...(isManager || allowedNavigationItems.includes("students")
                      ? [
                          {
                            name: "Giáo Viên",
                            href: "/dashboard/manager/instructors",
                            icon: <UserCheck className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Staff management - only for managers
                    ...(isManager
                      ? [
                          {
                            name: "Nhân Viên",
                            href: "/dashboard/manager/staff",
                            icon: <Users className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Course module - only show if has Course permission
                    ...(isManager || allowedNavigationItems.includes("courses")
                      ? [
                          {
                            name: "Khóa Học",
                            href: "/dashboard/manager/courses",
                            icon: <BookOpen className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Class module - only show if has Class permission
                    ...(isManager || allowedNavigationItems.includes("classes")
                      ? [
                          {
                            name: "Lớp Học",
                            href: "/dashboard/manager/classes",
                            icon: <Users className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Pool module - only show if has Pool permission
                    ...(isManager || allowedNavigationItems.includes("pools")
                      ? [
                          {
                            name: "Hồ Bơi",
                            href: "/dashboard/manager/pools",
                            icon: <Waves className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Data Review - only for managers
                    ...(isManager
                      ? [
                          {
                            name: "Slots",
                            href: "/dashboard/manager/slots",
                            icon: <Clock className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Data Review - only for managers
                    ...(isManager
                      ? [
                          {
                            name: "Phê duyệt",
                            href: "/dashboard/manager/data-review",
                            icon: <FileCheck className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // News module - only show if has News permission
                    ...(isManager || allowedNavigationItems.includes("news")
                      ? [
                          {
                            name: "Tin tức",
                            href: "/dashboard/manager/news",
                            icon: <Bell className='h-4 w-4' />,
                          },
                        ]
                      : []),
                  ].map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center ${
                          sidebarCollapsed ? "justify-center" : "gap-3"
                        } rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 relative
                          ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <div
                          className={`flex-shrink-0 ${
                            isActive
                              ? "text-primary-foreground"
                              : "group-hover:text-foreground"
                          }`}
                        >
                          {item.icon}
                        </div>
                        {!sidebarCollapsed && (
                          <span className='truncate'>{item.name}</span>
                        )}
                        {isActive && (
                          <div className='absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full' />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Operations Section - Permission-based for staff */}
                <div className='space-y-1'>
                  <div
                    className={`px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-opacity duration-200 ${
                      sidebarCollapsed ? "opacity-0 h-0 p-0" : "opacity-100"
                    }`}
                  >
                    {!sidebarCollapsed && "Hoạt Động"}
                  </div>
                  {[
                    // Calendar - only show if user has Class/calendar permission or is manager
                    ...(isManager || allowedNavigationItems.includes("calendar")
                      ? [
                          {
                            name: "Lịch",
                            // Calendar is the same manager-managed page; even for staff
                            // we keep the canonical URL under /dashboard/manager/calendar
                            // but staff will access with the required 'service: Schedule' header.
                            href: "/dashboard/manager/calendar",
                            icon: <Clock className='h-4 w-4' />,
                          },
                        ]
                      : []),

                    ...(isManager
                      ? [
                          {
                            name: "Liên hệ",
                            href: "/dashboard/manager/contacts",
                            icon: <MessageSquare className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Application module - only show if has Application permission
                    ...(isManager ||
                    allowedNavigationItems.includes("applications")
                      ? [
                          {
                            name: "Đơn từ",
                            href: "/dashboard/manager/applications",
                            icon: <FileText className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Application types - only for managers
                    ...(isManager
                      ? [
                          {
                            name: "Loại Đơn Từ",
                            href: "/dashboard/manager/application-types",
                            icon: <Settings className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Order module - only show if has Order permission
                    ...(isManager || allowedNavigationItems.includes("orders")
                      ? [
                          {
                            name: "Giao Dịch",
                            href: "/dashboard/manager/transactions",
                            icon: <PaymentIcon className='h-4 w-4' />,
                          },
                        ]
                      : []),
                    // Promotions - only for managers
                    ...(isManager
                      ? [
                          {
                            name: "Khuyến Mãi",
                            href: "/dashboard/manager/promotions",
                            icon: <Tag className='h-4 w-4' />,
                          },
                        ]
                      : []),
                  ].map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center ${
                          sidebarCollapsed ? "justify-center" : "gap-3"
                        } rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 relative
                          ${
                            isActive
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          }`}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <div
                          className={`flex-shrink-0 ${
                            isActive
                              ? "text-primary-foreground"
                              : "group-hover:text-foreground"
                          }`}
                        >
                          {item.icon}
                        </div>
                        {!sidebarCollapsed && (
                          <span className='truncate'>{item.name}</span>
                        )}
                        {isActive && (
                          <div className='absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full' />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Settings Section - Only for managers or specific staff permissions */}
                {isManager && (
                  <div className='space-y-1'>
                    <div
                      className={`px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider transition-opacity duration-200 ${
                        sidebarCollapsed ? "opacity-0 h-0 p-0" : "opacity-100"
                      }`}
                    >
                      {!sidebarCollapsed && "Cài Đặt"}
                    </div>
                    <Link
                      href='/dashboard/manager/settings'
                      className={`group flex items-center ${
                        sidebarCollapsed ? "justify-center" : "gap-3"
                      } rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 relative
                        ${
                          pathname === "/dashboard/manager/settings"
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                      title={sidebarCollapsed ? "Cài Đặt Tài Khoản" : undefined}
                    >
                      <div
                        className={`flex-shrink-0 ${
                          pathname === "/dashboard/manager/settings"
                            ? "text-primary-foreground"
                            : "group-hover:text-foreground"
                        }`}
                      >
                        <Cog className='h-4 w-4' />
                      </div>
                      {!sidebarCollapsed && (
                        <span className='truncate'>Cài Đặt Tài Khoản</span>
                      )}
                      {pathname === "/dashboard/manager/settings" && (
                        <div className='absolute left-0 top-0 bottom-0 w-1 bg-primary-foreground rounded-r-full' />
                      )}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className='p-4 border-t border-border/50 mt-auto bg-slate-100/40 dark:bg-slate-900/40'>
              <div
                className={`flex items-center text-xs text-muted-foreground transition-all duration-200 ${
                  sidebarCollapsed ? "justify-center" : "gap-2 justify-center"
                }`}
              >
                <Waves className='h-3 w-3 text-primary' />
                {!sidebarCollapsed && (
                  <>
                    <span className='font-medium'>SCMP Manager</span>
                    <span className='text-muted-foreground/60'>v2.0</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main
          className={`flex flex-1 flex-col p-4 md:gap-8 md:p-6 mt-16 transition-all duration-300 ${
            sidebarCollapsed ? "md:ml-[70px]" : "md:ml-[260px]"
          }`}
        >
          {loading ? <LoadingScreen /> : children}
        </main>
      </div>
    </div>
  );

  // If a userRole is specified, wrap with RoleGuard
  if (userRole) {
    return (
      <RoleGuard
        allowedRoles={[userRole]}
        fallbackUrl='/'
      >
        {content}
      </RoleGuard>
    );
  }

  return content;
}
