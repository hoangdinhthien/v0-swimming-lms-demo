"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/api/auth-utils";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    // For this version, we're directly redirecting to manager dashboard
    router.push("/dashboard/manager");
  }, [router]);

  // Show loading indicator while redirecting
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
        <p className='mt-2'>Đang chuyển hướng tới bảng điều khiển quản lý...</p>
      </div>
    </div>
  );
}
