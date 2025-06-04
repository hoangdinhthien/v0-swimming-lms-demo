"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Calendar,
  Loader2,
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
import { fetchCourses, fetchCourseCategories } from "@/api/courses-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesPage() {
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token)
          throw new Error("Thiếu thông tin tenant hoặc token");
        const data = await fetchCourses({ tenantId, token });
        setCourses(data);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setCourses([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      setLoadingCategories(true);
      setCategoriesError(null);
      try {
        const tenantId = getSelectedTenant();
        if (!tenantId) throw new Error("Thiếu thông tin tenant");
        const arr = await fetchCourseCategories({ tenantId });
        setCategories(arr);
      } catch (e: any) {
        setCategoriesError(e.message || "Lỗi không xác định");
        setCategories([]);
      }
      setLoadingCategories(false);
    }
    fetchCategories();
  }, []);

  // Filter courses based on filters and search
  const filteredCourses = courses.filter((course) => {
    // Filter by level
    const levelMatch =
      levelFilter === "all" ||
      (Array.isArray(course.category)
        ? course.category.some((cat: any) => cat.title === levelFilter)
        : course.level === levelFilter);

    // Filter by status (use is_active for now)
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "Active" && course.is_active) ||
      (statusFilter === "Completed" && course.is_active === false) ||
      (statusFilter === "Upcoming" && false); // No upcoming info in API

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(course.category) &&
        course.category.some((cat: any) =>
          cat.title?.toLowerCase().includes(searchQuery.toLowerCase())
        ));

    return levelMatch && statusMatch && searchMatch;
  });

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <div className='w-full max-w-3xl'>
          <div className='rounded-md border overflow-hidden'>
            <table className='w-full'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Tên khóa học
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Nhóm trình độ
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Giá
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Số buổi
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Thời lượng/buổi
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Trạng thái
                  </th>
                  <th className='py-3 px-4 text-right font-medium text-sm'>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...Array(4)].map((_, i) => (
                  <tr
                    key={i}
                    className='border-b'
                  >
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-32' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-24' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-16' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-10' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-16' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-20' />
                    </td>
                    <td className='py-3 px-4 text-right'>
                      <Skeleton className='h-8 w-20' />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
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
          <Link href='/dashboard/manager/courses/new'>
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Thêm khóa học mới
            </Button>
          </Link>
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
                {courses.filter((c) => c.is_active).length}
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
                {courses.reduce((sum, course) => {
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
                {courses.length > 0
                  ? Math.round(
                      courses.reduce((sum, course) => {
                        const students =
                          typeof course.students === "number"
                            ? course.students
                            : 0;
                        return sum + students;
                      }, 0) / courses.length
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
                    {loadingCategories ? (
                      <SelectItem
                        value=''
                        disabled
                      >
                        Đang tải...
                      </SelectItem>
                    ) : categoriesError ? (
                      <SelectItem
                        value=''
                        disabled
                      >
                        Lỗi tải trình độ
                      </SelectItem>
                    ) : categories.length > 0 ? (
                      categories.map((cat) => (
                        <SelectItem
                          key={cat._id}
                          value={cat.title}
                        >
                          {cat.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem
                        value=''
                        disabled
                      >
                        Không có trình độ
                      </SelectItem>
                    )}
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
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='text-center py-8 text-muted-foreground'
                      >
                        Đang tải dữ liệu...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='text-center py-8 text-red-500'
                      >
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredCourses.length > 0 ? (
                    filteredCourses.map((course: any) => (
                      <TableRow key={course._id}>
                        <TableCell className='font-medium'>
                          {course.title}
                        </TableCell>
                        <TableCell>
                          {Array.isArray(course.category)
                            ? course.category
                                .map((cat: any) => cat.title)
                                .join(", ")
                            : ""}
                        </TableCell>
                        <TableCell>
                          {course.price
                            ? course.price.toLocaleString() + "₫"
                            : ""}
                        </TableCell>
                        <TableCell>{course.session_number}</TableCell>
                        <TableCell>{course.session_number_duration}</TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={
                              course.is_active
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {course.is_active
                              ? "Đang hoạt động"
                              : "Đã kết thúc"}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right space-x-2'>
                          <Link
                            href={`/dashboard/manager/courses/${course._id}`}
                          >
                            <Button
                              variant='ghost'
                              size='sm'
                            >
                              Xem chi tiết
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className='text-center py-8 text-muted-foreground'
                      >
                        Không tìm thấy khóa học phù hợp với bộ lọc hiện tại.
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
