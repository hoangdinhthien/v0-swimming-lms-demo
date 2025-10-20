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
  Settings,
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
import { fetchCourses } from "@/api/manager/courses-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import CourseCategoriesModal from "@/components/manager/course-categories-modal";

export default function CoursesPage() {
  const router = useRouter();
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Default page size
  const [total, setTotal] = useState(0); // Total courses from API
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token)
          throw new Error("Thiếu thông tin tenant hoặc token");
        // Use the fetchCourses API with pagination
        const res = await fetchCourses({ tenantId, token, page, limit });
        // fetchCourses returns only the data array, but we need total for pagination
        // So, fetchCourses should return { data, total } or you need to fetch total from the API response
        // Let's fix fetchCourses to return both data and total
        setCourses(res.data || []);
        setTotal(res.total || 0);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setCourses([]);
      }
      setLoading(false);
    }

    // ✅ Add request deduplication
    const timeoutId = setTimeout(fetchData, 100); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [page, limit]);

  // Fetch all courses for summary cards
  useEffect(() => {
    async function fetchAll() {
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) return;
        // Fetch all courses (no pagination)
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
  }, []);

  // Remove this line:
  // const filteredCourses = courses.filter((course) => { ... });
  // Instead, use the paginated API data directly:
  const displayedCourses = courses;

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách khóa học...</p>
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
              onClick={() => setCategoriesModalOpen(true)}
            >
              <Settings className='mr-2 h-4 w-4' />
              Quản lý danh mục
            </Button>
            <Link href='/dashboard/manager/courses/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Thêm khóa học mới
              </Button>
            </Link>
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
                    typeof course.students === "number" ? course.students : 0;
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
                          typeof course.students === "number"
                            ? course.students
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
            <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
              <div className='flex-1 relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Tìm kiếm theo tên, trình độ hoặc nhóm tuổi...'
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
                    {/* Extract unique categories from all courses */}
                    {Array.from(
                      new Set(
                        allCourses.flatMap((course) =>
                          Array.isArray(course.category)
                            ? course.category.map((cat: any) => cat.title)
                            : []
                        )
                      )
                    )
                      .filter(Boolean)
                      .map((categoryTitle) => (
                        <SelectItem
                          key={categoryTitle}
                          value={categoryTitle as string}
                        >
                          {categoryTitle}
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
                  <TableRow>
                    <TableHead>Tên khóa học</TableHead>
                    <TableHead>Nhóm trình độ</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Số buổi</TableHead>
                    <TableHead>Thời lượng/buổi</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-center py-8 text-muted-foreground'
                      >
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-center py-8 text-red-500'
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : displayedCourses.length > 0 ? (
                    displayedCourses.map((course: any) => (
                      <TableRow
                        key={course._id}
                        className='cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200'
                        onClick={() =>
                          router.push(
                            `/dashboard/manager/courses/${course._id}`
                          )
                        }
                      >
                        <TableCell className='font-medium group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {course.title}
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {Array.isArray(course.category)
                              ? course.category
                                  .map((cat: any) => cat.title)
                                  .join(", ")
                              : ""}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {course.price
                              ? course.price.toLocaleString() + "₫"
                              : ""}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {course.session_number}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {course.session_number_duration}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center justify-between'>
                            <Badge
                              variant='outline'
                              className={`transition-all duration-200 ${
                                course.is_active
                                  ? "bg-green-50 text-green-700 border-green-200 group-hover:bg-green-100 group-hover:border-green-300"
                                  : "bg-gray-50 text-gray-700 border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300"
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
                        className='text-center py-8 text-muted-foreground'
                      >
                        Không tìm thấy khóa học phù hợp với bộ lọc hiện tại.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className='flex justify-center mt-6'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        if (page > 1) setPage(page - 1);
                      }}
                      aria-disabled={page === 1}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
                    <PaginationItem key={i}>
                      <PaginationLink
                        href='#'
                        isActive={page === i + 1}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(i + 1);
                        }}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        if (page < Math.ceil(total / limit)) setPage(page + 1);
                      }}
                      aria-disabled={page === Math.ceil(total / limit)}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
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
