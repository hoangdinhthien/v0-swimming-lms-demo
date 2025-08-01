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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { logout, getAuthenticatedUser } from "@/api/auth-utils";
import { getUserFrontendRole } from "@/api/role-utils";
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
import { ChevronDown, Check } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: "student" | "instructor" | "admin" | "manager"; // Optional, will use from auth if not provided
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
  const pathname = usePathname();
  const router = useRouter(); // Handle tenant switching
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

      // For this version of the app, we always use manager role
      setUserRole("manager");
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

    return () => clearTimeout(timer);
  }, []);
  // For this version of the app, we only have manager role
  const getRoleDisplayName = () => {
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
        icon: <LayoutDashboard className='h-4 w-4 mr-2' />,
      },
      {
        name: "Học Viên",
        href: "/dashboard/manager/students",
        icon: <Users className='h-4 w-4 mr-2' />,
      },
      {
        name: "Giáo Viên",
        href: "/dashboard/manager/instructors",
        icon: <Users className='h-4 w-4 mr-2' />,
      },
      {
        name: "Khóa Học",
        href: "/dashboard/manager/courses",
        icon: <Award className='h-4 w-4 mr-2' />,
      },
      {
        name: "Lớp Học",
        href: "/dashboard/manager/classes",
        icon: <Users className='h-4 w-4 mr-2' />,
      },
      {
        name: "Lịch",
        href: "/dashboard/manager/calendar",
        icon: <Calendar className='h-4 w-4 mr-2' />,
      },
      {
        name: "Đơn từ",
        href: "/dashboard/manager/applications",
        icon: <Building className='h-4 w-4 mr-2' />,
      },
      {
        name: "Giao Dịch",
        href: "/dashboard/manager/transactions",
        icon: <CreditCard className='h-4 w-4 mr-2' />,
      },
      {
        name: "Tin nhắn",
        href: "/dashboard/manager/messages",
        icon: <MessageSquare className='h-4 w-4 mr-2' />,
      },
      {
        name: "Khuyến Mãi",
        href: "/dashboard/manager/promotions",
        icon: <Percent className='h-4 w-4 mr-2' />,
      },
      {
        name: "Cài Đặt Tài Khoản",
        href: "/dashboard/manager/settings",
        icon: <Settings className='h-4 w-4 mr-2' />,
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
      {
        name: "Khuyến Mãi",
        href: "/dashboard/admin/promotions",
        icon: <Percent className='h-4 w-4 mr-2' />,
      },
      {
        name: "Cài Đặt Hệ Thống",
        href: "/dashboard/admin/settings",
        icon: <Settings className='h-4 w-4 mr-2' />,
      },
    ],
  }; // For this version of the application, we're focusing on manager functionality
  // Default to manager navigation items unless explicitly overridden  // For this version, we always use manager navigation items
  const currentNavItems = navItems.manager;
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
            <span className='hidden md:inline-block'>AquaLearn Manager</span>
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
              <span className='sr-only'>Toggle Menu</span>
            </Button>
          </SheetTrigger>{" "}
          <SheetContent
            side='left'
            className='pr-0 overflow-y-auto'
          >
            <div className='px-7'>
              <Link
                href='/'
                className='flex items-center gap-2 font-semibold'
              >
                <Waves className='h-6 w-6 text-sky-500' />
                <span>AquaLearn</span>
              </Link>
            </div>
            <div className='grid gap-2 py-6 px-7'>
              {currentNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className='flex items-center gap-2 text-lg font-semibold'
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              <AlertDialog
                open={logoutDialogOpen}
                onOpenChange={setLogoutDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    className='mt-2 justify-start px-2'
                  >
                    <LogOut className='h-5 w-5 mr-2' />
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
        <nav className='hidden border-r bg-muted/40 md:flex h-[calc(100vh-64px)] fixed top-16 w-[220px] z-20'>
          <div className='grid gap-2 p-4 w-full overflow-y-auto'>
            {currentNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all
                    ${
                      isActive
                        ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
        <main className='flex flex-1 flex-col p-4 md:gap-8 md:p-6 md:ml-[220px] mt-16'>
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
