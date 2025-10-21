"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchStaffCourses } from "@/api/staff-data/staff-data-api";
import { apiCache } from "@/utils/api-cache";
import PermissionGuard from "@/components/permission-guard";

export default function StaffCoursesPage() {
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      setError(null);
      try {
        // Use updated staff API signature (no manual tenantId/token)
        const response = await fetchStaffCourses(1, 1000);

        // Extract data from the staff API response structure
        const data = response?.data || [];

        // Extract unique categories from courses
        const allCategories: any[] = [];
        data.forEach((course: any) => {
          if (course.category && Array.isArray(course.category)) {
            course.category.forEach((cat: any) => {
              if (!allCategories.find((c) => c._id === cat._id)) {
                allCategories.push(cat);
              }
            });
          }
        });
        setCategories(allCategories);

        setCourses(data);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setCourses([]);
      }
      setLoading(false);
    }
    loadCourses();
  }, []);

  // Filter courses based on filters and search
  const filteredCourses = courses.filter((course) => {
    // Filter by level/category
    const levelMatch =
      levelFilter === "all" ||
      (course.category &&
        Array.isArray(course.category) &&
        course.category.some((cat: any) => cat.title === levelFilter));

    // Filter by status
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "Active" && course.is_active) ||
      (statusFilter === "Completed" && !course.is_active);

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return levelMatch && statusMatch && searchMatch;
  });

  // Calculate statistics
  const totalCourses = courses.length;
  const activeCourses = courses.filter((c) => c.is_active).length;
  const averagePrice =
    courses.length > 0
      ? Math.round(
          courses.reduce((sum, course) => sum + (course.price || 0), 0) /
            courses.length
        )
      : 0;
  const totalSessions = courses.reduce(
    (sum, course) => sum + (course.session_number || 0),
    0
  );

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách khoá học...
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
      <div className='flex flex-col items-center justify-center min-h-[400px] py-16'>
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
          href='/dashboard/staff'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về trang nhân viên
        </Link>
      </div>

      <div className='flex flex-col space-y-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Quản lý khóa học
            </h1>
            <p className='text-muted-foreground'>
              Xem danh sách khóa học được phân quyền tại trung tâm bơi lội
            </p>
          </div>
          {/* Staff typically don't have permission to add courses, but keeping for consistency */}
          <PermissionGuard
            module='Course'
            action='POST'
          >
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Thêm khóa học mới
            </Button>
          </PermissionGuard>
        </div>

        <div className='mt-8 grid gap-6 md:grid-cols-4'>
          <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Khóa học đang hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-green-600'>
                {activeCourses}
              </div>
              <p className='text-xs text-muted-foreground'>Đang diễn ra</p>
            </CardContent>
          </Card>

          <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng số khóa học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-primary'>
                {totalCourses}
              </div>
              <p className='text-xs text-muted-foreground'>Khóa học có sẵn</p>
            </CardContent>
          </Card>

          <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Giá trung bình
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-amber-500'>
                {averagePrice.toLocaleString()}₫
              </div>
              <p className='text-xs text-muted-foreground'>Mỗi khóa học</p>
            </CardContent>
          </Card>

          <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng số buổi học
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-600'>
                {totalSessions}
              </div>
              <p className='text-xs text-muted-foreground'>Buổi học</p>
            </CardContent>
          </Card>
        </div>

        <Card className='mt-8 bg-card/80 backdrop-blur-sm border shadow-lg'>
          <CardHeader>
            <CardTitle>Danh sách khóa học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
              <div className='flex-1 relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Tìm kiếm theo tên khóa học hoặc mô tả...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className='grid grid-cols-2 gap-4 w-full md:w-[400px]'>
                <Select
                  value={levelFilter}
                  onValueChange={setLevelFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Lọc theo trình độ' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả trình độ</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem
                        key={cat._id}
                        value={cat.title}
                      >
                        {cat.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Lọc theo trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                    <SelectItem value='Active'>Đang hoạt động</SelectItem>
                    <SelectItem value='Completed'>Đã kết thúc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='rounded-md border overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/30 hover:bg-muted/40 border-border/50'>
                    <TableHead className='font-semibold'>
                      Tên khóa học
                    </TableHead>
                    <TableHead className='font-semibold'>
                      Nhóm trình độ
                    </TableHead>
                    <TableHead className='font-semibold'>Giá</TableHead>
                    <TableHead className='font-semibold'>Số buổi</TableHead>
                    <TableHead className='font-semibold'>
                      Thời lượng/buổi
                    </TableHead>
                    <TableHead className='font-semibold'>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.length > 0 ? (
                    filteredCourses.map((course: any) => (
                      <TableRow
                        key={course._id}
                        className='cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200 border-border/30'
                        onClick={() =>
                          router.push(`/dashboard/staff/courses/${course._id}`)
                        }
                      >
                        <TableCell className='font-medium group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='min-w-0 flex-1'>
                            <div className='font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {course.title}
                            </div>
                            {course.description && (
                              <div className='text-xs text-muted-foreground mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate'>
                                {course.description.length > 50
                                  ? course.description.substring(0, 50) + "..."
                                  : course.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex flex-wrap gap-1'>
                            {course.category &&
                            Array.isArray(course.category) ? (
                              course.category
                                .slice(0, 2)
                                .map((cat: any, index: number) => (
                                  <Badge
                                    key={cat._id}
                                    variant='outline'
                                    className='text-xs'
                                  >
                                    {cat.title}
                                  </Badge>
                                ))
                            ) : (
                              <span className='text-muted-foreground text-sm'>
                                -
                              </span>
                            )}
                            {course.category && course.category.length > 2 && (
                              <Badge
                                variant='outline'
                                className='text-xs'
                              >
                                +{course.category.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {course.price
                              ? course.price.toLocaleString() + "₫"
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {course.session_number || "-"}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {course.session_number_duration || "-"}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center justify-between'>
                            <Badge
                              variant='outline'
                              className={`transition-all duration-200 ${
                                course.is_active
                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 group-hover:bg-green-100 group-hover:border-green-300"
                                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 group-hover:bg-gray-100 group-hover:border-gray-300"
                              }`}
                            >
                              {course.is_active
                                ? "Đang hoạt động"
                                : "Đã kết thúc"}
                            </Badge>
                            <ChevronRight className='h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-center py-12'
                      >
                        <div className='flex flex-col items-center gap-2'>
                          <Calendar className='h-8 w-8 text-muted-foreground/50' />
                          <p className='text-muted-foreground font-medium'>
                            Không tìm thấy khóa học phù hợp
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
