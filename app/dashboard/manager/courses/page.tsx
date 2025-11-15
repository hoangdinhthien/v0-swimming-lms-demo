"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Settings, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCourses } from "@/api/manager/courses-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import CourseCategoriesModal from "@/components/manager/course-categories-modal";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { columns, Course } from "./components/columns";

export default function CoursesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKey, setSearchKey] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Separate state for search

  // Function to load courses with search support
  const loadCourses = async (searchValue?: string, isInitialLoad = false) => {
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

      // Fetch courses with searchKey
      const res = await fetchCourses({
        tenantId,
        token,
        page: 1,
        limit: 1000,
        searchKey: searchValue,
      });

      setCourses(res.data || []);
    } catch (e: any) {
      setError(e.message || "Lỗi không xác định");
      setCourses([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Handle server-side search
  const handleServerSearch = (searchValue: string) => {
    setSearchKey(searchValue);
    loadCourses(searchValue, false);
  };

  // Function to manually refresh courses
  const refreshCourses = async () => {
    setRefreshing(true);
    try {
      await loadCourses(searchKey, false);
      toast({
        title: "Đã làm mới",
        description: "Danh sách khóa học đã được cập nhật",
      });
    } catch (e: any) {
      toast({
        title: "Lỗi",
        description: e.message || "Không thể tải lại danh sách",
        variant: "destructive",
      });
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadCourses(undefined, true); // Initial load
  }, []);

  // Fetch all courses for summary cards
  useEffect(() => {
    async function fetchAll() {
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) return;
        const res = await fetchCourses({
          tenantId,
          token,
          page: 1,
          limit: 1000,
        });
        setAllCourses(res.data || []);
      } catch {
        setAllCourses([]);
      }
    }
    fetchAll();
  }, [courses]);

  // Get unique categories for filter
  const categories = Array.from(
    new Set(
      allCourses.flatMap((course) =>
        Array.isArray(course.category)
          ? course.category.map((cat: any) => cat.title || cat)
          : []
      )
    )
  );

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách khóa học...
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
              Quản lý khóa học
            </h1>
            <p className='text-muted-foreground'>
              Quản lý tất cả các khóa học bơi hiện có
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={refreshCourses}
              disabled={refreshing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button
              variant='outline'
              onClick={() => setCategoriesModalOpen(true)}
            >
              <Settings className='mr-2 h-4 w-4' />
              Quản lý danh mục
            </Button>
            <Button
              onClick={() => router.push("/dashboard/manager/courses/new")}
            >
              <Plus className='mr-2 h-4 w-4' />
              Tạo khóa học mới
            </Button>
          </div>
        </div>

        <div className='mt-8 grid gap-6 md:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Khóa học đang hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {allCourses.filter((c) => c.is_active).length}
              </div>
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
              <div className='text-2xl font-bold'>
                {allCourses.reduce((sum, course) => {
                  const students =
                    typeof course.studentCount === "number"
                      ? course.studentCount
                      : 0;
                  return sum + students;
                }, 0)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Học viên đã đăng ký
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Khóa học sắp khai giảng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {/* No upcoming info in API, so always 0 */}0
              </div>
              <p className='text-xs text-muted-foreground'>Sắp bắt đầu</p>
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
                {allCourses.length > 0
                  ? Math.round(
                      allCourses.reduce((sum, course) => {
                        const students =
                          typeof course.studentCount === "number"
                            ? course.studentCount
                            : 0;
                        return sum + students;
                      }, 0) / allCourses.length
                    )
                  : 0}
              </div>
              <p className='text-xs text-muted-foreground'>Học viên mỗi khóa</p>
            </CardContent>
          </Card>
        </div>

        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Danh sách khóa học</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={columns}
              data={courses}
              searchKey='title'
              searchPlaceholder='Tìm kiếm theo tên khóa học...'
              onServerSearch={handleServerSearch}
              filterOptions={[
                {
                  columnId: "category",
                  title: "Danh mục",
                  options: categories.map((cat) => ({
                    label: String(cat),
                    value: String(cat),
                  })),
                },
                {
                  columnId: "is_active",
                  title: "Trạng thái",
                  options: [
                    { label: "Đang mở", value: "Active" },
                    { label: "Đã đóng", value: "Completed" },
                  ],
                },
              ]}
              emptyMessage='Không tìm thấy khóa học nào'
            />
          </CardContent>
        </Card>
      </div>

      {/* Course Categories Management Modal */}
      <CourseCategoriesModal
        open={categoriesModalOpen}
        onOpenChange={setCategoriesModalOpen}
      />
    </>
  );
}
