"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Users,
  BookOpen,
  Clock,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchClasses } from "@/api/manager/class-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { createColumns, ClassItem } from "./components/columns";

export default function ClassesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all classes with optional searchKey (searches by class name, course title, or instructor name)
  const fetchData = async (searchValue?: string, isInitialLoad = false) => {
    // Prevent duplicate calls
    if (isFetching) return;

    setIsFetching(true);
    if (isInitialLoad) {
      setLoading(true);
    } else if (searchValue !== undefined) {
      setIsSearching(true);
    }
    setError(null);

    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");

      // Use searchKey param - backend will search across name, course.title, and instructor.username
      const searchKey = searchValue?.trim() || undefined;

      // Fetch ALL classes at once (instead of 2 separate API calls)
      const result = await fetchClasses(tenantId, token, 1, 1000, searchKey);
      setAllClasses(result.data);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
      setAllClasses([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
      setIsFetching(false);
    }
  };

  // Fetch all classes once - use for both summary cards AND pagination
  useEffect(() => {
    let isMounted = true;

    // Only fetch once when component mounts
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        fetchData(undefined, true);
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency - only run once

  // Handler for server-side search
  const handleServerSearch = (value: string) => {
    setSearchQuery(value); // Store search query for highlighting
    fetchData(value, false);
  };

  // Calculate summary statistics
  const totalClasses = allClasses.length;
  const totalStudents = allClasses.reduce((sum, classItem) => {
    return sum + (classItem.member?.length || 0);
  }, 0);
  const averageStudentsPerClass =
    totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
  const activeClasses = allClasses.filter(
    (classItem) => classItem.course.is_active
  ).length;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");

      const result = await fetchClasses(tenantId, token, 1, 1000);
      setAllClasses(result.data);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách lớp học...
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
          Quay về Bảng điều khiển
        </Link>
      </div>

      <div className='flex flex-col space-y-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Quản lý lớp học
            </h1>
            <p className='text-muted-foreground'>
              Quản lý tất cả các lớp học hiện có
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Link href='/dashboard/manager/classes/create'>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Thêm lớp học mới
              </Button>
            </Link>
          </div>
        </div>

        <div className='mt-8 grid gap-6 md:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng số lớp học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalClasses}</div>
              <p className='text-xs text-muted-foreground'>Tất cả lớp học</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Lớp học đang hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{activeClasses}</div>
              <p className='text-xs text-muted-foreground'>Đang diễn ra</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng số học viên
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalStudents}</div>
              <p className='text-xs text-muted-foreground'>
                Học viên đã đăng ký
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Sĩ số trung bình
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {averageStudentsPerClass}
              </div>
              <p className='text-xs text-muted-foreground'>Học viên mỗi lớp</p>
            </CardContent>
          </Card>
        </div>

        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Danh sách lớp học</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={createColumns(searchQuery)}
              data={allClasses}
              searchKey='name'
              searchPlaceholder='Tìm kiếm lớp học (tên, khóa học, huấn luyện viên)...'
              onServerSearch={handleServerSearch}
              filterOptions={[
                {
                  columnId: "status",
                  title: "Trạng thái",
                  options: [
                    { label: "Đang hoạt động", value: "active" },
                    { label: "Đã kết thúc", value: "inactive" },
                  ],
                },
              ]}
              emptyMessage='Không tìm thấy lớp học nào'
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
