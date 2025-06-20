"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Waves, User } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  isAuthenticated,
  getAuthenticatedUser,
  logout,
} from "@/api/auth-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getTenantInfo } from "@/api/tenant-api";

export default function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const pathname = usePathname();

  // Check if we're in a dashboard route
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  useEffect(() => {
    // This function will check auth status on mount and periodically
    const checkAuth = async () => {
      const authStatus = isAuthenticated();
      setIsLoggedIn(authStatus);

      if (authStatus) {
        const user = getAuthenticatedUser();
        if (user) {
          setUserName(
            user.name || user.fullName || user.username || "Người dùng"
          );

          // Determine user role - prioritize role_front for frontend display
          let frontendRole = "";
          if (Array.isArray(user.role_front) && user.role_front.length > 0) {
            frontendRole = user.role_front[0].toLowerCase();
          } else if (typeof user.role_front === "string") {
            frontendRole = user.role_front.toLowerCase();
          } else if (typeof user.role_system === "string") {
            // Fallback to role_system if role_front is not available
            frontendRole = user.role_system.toLowerCase();
          } else if (Array.isArray(user.role) && user.role.length > 0) {
            frontendRole = user.role[0].toLowerCase();
          } else if (typeof user.role === "string") {
            frontendRole = user.role.toLowerCase();
          }
          setUserRole(frontendRole);
        }
      }
    };

    // Check on component mount
    checkAuth();

    // Set up storage event listener to check auth when localStorage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "token" || event.key === "user") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Clean up listener on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Fetch tenant info when in dashboard
  useEffect(() => {
    const fetchTenantName = async () => {
      if (isDashboardRoute && isLoggedIn) {
        try {
          const selectedTenantId = getSelectedTenant();
          if (selectedTenantId) {
            const tenantInfo = await getTenantInfo(selectedTenantId);
            setTenantName(tenantInfo.title);
          }
        } catch (error) {
          console.error("Error fetching tenant info:", error);
          setTenantName("");
        }
      } else {
        setTenantName("");
      }
    };

    fetchTenantName();
  }, [isDashboardRoute, isLoggedIn]);

  return (
    <header className='sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between'>
        <div className='flex items-center gap-2 font-bold text-xl'>
          <Link
            href='/'
            className='flex items-center gap-2'
            onClick={() => {
              // Force refresh auth status when clicking logo
              const authStatus = isAuthenticated();
              setIsLoggedIn(authStatus);
            }}
          >
            <Waves className='h-6 w-6 text-sky-500' />
            <span>AquaLearn Manager</span>
          </Link>
        </div>

        {/* Display tenant name in the center of header when in dashboard */}
        {isDashboardRoute && tenantName && (
          <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
            <span className='hidden md:inline'>Chi nhánh:</span>
            <span className='font-semibold text-foreground'>{tenantName}</span>
          </div>
        )}

        <nav className='hidden md:flex items-center gap-6'>
          <Link
            href='/'
            className='text-sm font-medium'
          >
            Trang Chủ
          </Link>
          <Link
            href='/dashboard/manager/courses'
            className='text-sm font-medium'
          >
            Khóa Học
          </Link>
          <Link
            href='/instructors'
            className='text-sm font-medium'
          >
            Giáo Viên
          </Link>
          <Link
            href='/about'
            className='text-sm font-medium'
          >
            Giới Thiệu
          </Link>
        </nav>
        <div className='flex items-center gap-4'>
          <ThemeToggle />
          {isLoggedIn ? (
            <div className='flex items-center gap-2'>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    className='flex items-center gap-2'
                  >
                    <div className='w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-sky-700'>
                      <User className='h-4 w-4' />
                    </div>
                    <span className='hidden md:inline'>{userName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/dashboard/${userRole}`}
                      className='cursor-pointer'
                    >
                      Bảng điều khiển
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='cursor-pointer text-red-500'
                    onClick={() => logout()}
                  >
                    Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link href='/login'>
                <Button variant='outline'>Đăng Nhập</Button>
              </Link>
              <Link href='/login'>
                <Button>Đăng Ký</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
