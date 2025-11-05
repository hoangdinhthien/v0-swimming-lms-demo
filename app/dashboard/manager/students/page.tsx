"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  FileText,
  Users,
  UserCheck,
  UserX,
  Baby,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStudents } from "@/api/manager/students-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import PermissionGuard from "@/components/permission-guard";
import { useToast } from "@/hooks/use-toast";
import { columns, Student } from "./components/columns";
import { DataTable } from "@/components/ui/data-table/data-table";
import { useRouter } from "next/navigation";

// Helper function to extract avatar URL from featured_image
function extractAvatarUrl(featuredImage: any): string {
  console.log("Extracting avatar from featured_image:", featuredImage);

  if (!featuredImage) {
    console.log("No featured_image provided");
    return "/placeholder.svg";
  }

  // Handle empty array - return placeholder immediately
  if (Array.isArray(featuredImage) && featuredImage.length === 0) {
    console.log("Empty featured_image array, using placeholder");
    return "/placeholder.svg";
  }

  // Handle Array format: featured_image: [{ path: ["url"] }] or [{ path: "url" }]
  if (Array.isArray(featuredImage) && featuredImage.length > 0) {
    console.log("Handling array format featured_image");
    const firstImage = featuredImage[0];
    if (firstImage?.path) {
      if (Array.isArray(firstImage.path) && firstImage.path.length > 0) {
        console.log("Found URL in array path:", firstImage.path[0]);
        return firstImage.path[0];
      } else if (typeof firstImage.path === "string") {
        console.log("Found URL in string path:", firstImage.path);
        return firstImage.path;
      }
    }
  }
  // Handle Object format: featured_image: { path: "url" } or { path: ["url"] }
  else if (typeof featuredImage === "object" && featuredImage.path) {
    console.log("Handling object format featured_image");
    if (Array.isArray(featuredImage.path) && featuredImage.path.length > 0) {
      console.log("Found URL in object array path:", featuredImage.path[0]);
      return featuredImage.path[0];
    } else if (typeof featuredImage.path === "string") {
      console.log("Found URL in object string path:", featuredImage.path);
      return featuredImage.path;
    }
  }

  console.log("No valid avatar URL found, using placeholder");
  return "/placeholder.svg";
}

// Helper function to calculate age from birthday
function calculateAge(birthdayStr: string | null | undefined): number | null {
  if (!birthdayStr) return null;

  try {
    const birthday = new Date(birthdayStr);
    // Check if birthday is a valid date
    if (isNaN(birthday.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    // Adjust age if birthday hasn't occurred yet this year
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }
    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
}

export default function StudentsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId) throw new Error("Thiếu thông tin tenant");
      const data = await fetchStudents({
        tenantId: tenantId ?? undefined,
        token: token ?? undefined,
      });
      // Process each student to get their images and parent information
      const processedStudents = data.map((item: any) => {
        // Extract avatar URL using helper function
        const avatarUrl = extractAvatarUrl(item.user?.featured_image);
        console.log(`Avatar for student ${item.user?.username}:`, avatarUrl);

        // Extract parent name directly from the response data
        let parentName = null;
        if (
          item.user?.parent_id &&
          Array.isArray(item.user.parent_id) &&
          item.user.parent_id.length > 0
        ) {
          // Parent info is now included in the response
          const parentInfo = item.user.parent_id[0];
          if (parentInfo && parentInfo.username) {
            parentName = parentInfo.username;
          }
        }

        return {
          ...item,
          avatar: avatarUrl,
          parentName: parentName,
        };
      });
      setStudents(processedStudents);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
      setStudents([]);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
    toast({
      title: "Đã làm mới",
      description: "Danh sách học viên đã được cập nhật",
    });
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Calculate summary statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.user?.is_active
  ).length;
  const inactiveStudents = totalStudents - activeStudents;

  // Helper function to calculate age
  const calculateAge = (
    birthdayStr: string | null | undefined
  ): number | null => {
    if (!birthdayStr) return null;
    try {
      const birthday = new Date(birthdayStr);
      if (isNaN(birthday.getTime())) return null;
      const today = new Date();
      let age = today.getFullYear() - birthday.getFullYear();
      const monthDiff = today.getMonth() - birthday.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthday.getDate())
      ) {
        age--;
      }
      return age;
    } catch (error) {
      console.error("Error calculating age:", error);
      return null;
    }
  };

  const averageAge =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => {
            const age = calculateAge(student.user?.birthday);
            return sum + (age || 0);
          }, 0) /
            students.filter(
              (student) => calculateAge(student.user?.birthday) !== null
            ).length
        ) || 0
      : 0;

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách học viên...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>
            Lỗi tải dữ liệu
          </div>
          <p className='text-muted-foreground'>{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về trang quản lý
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý học viên</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả học viên đã đăng ký tại trung tâm bơi lội của bạn
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Link href='/dashboard/manager/students/import'>
            <Button variant='outline'>
              <FileText className='mr-2 h-4 w-4' />
              Nhập danh sách
            </Button>
          </Link>
          <PermissionGuard
            module='User'
            action='POST'
          >
            <Link href='/dashboard/manager/students/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Thêm học viên
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Users className='h-4 w-4 text-primary' />
              Tổng số học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {totalStudents}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Đã đăng ký</p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <UserCheck className='h-4 w-4 text-green-600' />
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {activeStudents}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalStudents > 0
                ? Math.round((activeStudents / totalStudents) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <UserX className='h-4 w-4 text-red-500' />
              Ngưng hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-500'>
              {inactiveStudents}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalStudents > 0
                ? Math.round((inactiveStudents / totalStudents) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Baby className='h-4 w-4 text-blue-600' />
              Tuổi trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{averageAge}</div>
            <p className='text-xs text-muted-foreground mt-1'>Tuổi</p>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8 bg-card/80 backdrop-blur-sm border shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <Users className='h-5 w-5 text-primary' />
            Danh sách học viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            searchKey='username'
            searchPlaceholder='Tìm kiếm theo tên hoặc email...'
            filterOptions={[
              {
                columnId: "status",
                title: "Trạng thái",
                options: [
                  {
                    label: "Đang hoạt động",
                    value: "active",
                    icon: "UserCheck",
                  },
                  {
                    label: "Ngưng hoạt động",
                    value: "inactive",
                    icon: "UserX",
                  },
                ],
              },
            ]}
            emptyMessage='Không tìm thấy học viên phù hợp.'
            onRowClick={(student: Student) => {
              const userId = (student as any)?.user?._id;
              if (userId) {
                router.push(`/dashboard/manager/students/${userId}`);
              }
            }}
          />
        </CardContent>
      </Card>
    </>
  );
}
