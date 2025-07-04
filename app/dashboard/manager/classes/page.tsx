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
  Users,
  BookOpen,
  Clock,
  User,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { fetchClasses, type ClassItem } from "@/api/class-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

export default function ClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch paginated classes data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token)
          throw new Error("Thiếu thông tin tenant hoặc token");

        const result = await fetchClasses(tenantId, token, page, limit);
        setClasses(result.data);
        setTotalCount(result.meta_data.count);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setClasses([]);
      }
      setLoading(false);
    }
    fetchData();
  }, [page, limit]);

  // Fetch all classes for summary cards
  useEffect(() => {
    async function fetchAllClasses() {
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) return;

        const result = await fetchClasses(tenantId, token, 1, 1000);
        setAllClasses(result.data);
      } catch {
        setAllClasses([]);
      }
    }
    fetchAllClasses();
  }, []);

  // Filter classes based on search query
  const filteredClasses = classes.filter(
    (classItem) =>
      classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <div className='w-full max-w-5xl'>
          <div className='rounded-md border overflow-hidden'>
            <table className='w-full'>
              <thead>
                <tr className='border-b bg-muted/50'>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Tên lớp học
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Khóa học
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Số học viên
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Giáo viên
                  </th>
                  <th className='py-3 px-4 text-left font-medium text-sm'>
                    Ngày tạo
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
                      <Skeleton className='h-4 w-40' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-16' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-24' />
                    </td>
                    <td className='py-3 px-4'>
                      <Skeleton className='h-4 w-20' />
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
    return (
      <div className='flex flex-col items-center justify-center py-16'>
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
          <Button>
            <Plus className='mr-2 h-4 w-4' /> Thêm lớp học mới
          </Button>
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
            <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
              <div className='flex-1 relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Tìm kiếm theo tên lớp học hoặc khóa học...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className='rounded-md border overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên lớp học</TableHead>
                    <TableHead>Khóa học</TableHead>
                    <TableHead>Số học viên</TableHead>
                    <TableHead>Giáo viên</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClasses.length > 0 ? (
                    filteredClasses.map((classItem) => (
                      <TableRow key={classItem._id}>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-2'>
                            <Users className='h-4 w-4 text-muted-foreground' />
                            <Link
                              href={`/dashboard/manager/class/${classItem._id}?from=classes`}
                              className='text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                            >
                              {classItem.name}
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <BookOpen className='h-4 w-4 text-muted-foreground' />
                            <div>
                              <div className='font-medium'>
                                {classItem.course.title}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                {classItem.course.session_number} buổi -{" "}
                                {classItem.course.session_number_duration}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4 text-muted-foreground' />
                            <span className='font-medium'>
                              {classItem.member?.length || 0} học viên
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm text-muted-foreground'>
                              {classItem.instructor
                                ? Array.isArray(classItem.instructor)
                                  ? `${classItem.instructor.length} giáo viên`
                                  : "1 giáo viên"
                                : "Chưa phân công"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Clock className='h-4 w-4 text-muted-foreground' />
                            <span className='text-sm text-muted-foreground'>
                              {new Date(
                                classItem.created_at
                              ).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={
                              classItem.course.is_active
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {classItem.course.is_active
                              ? "Đang hoạt động"
                              : "Đã kết thúc"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className='text-center py-8 text-muted-foreground'
                      >
                        {searchQuery
                          ? "Không tìm thấy lớp học phù hợp với từ khóa tìm kiếm."
                          : "Chưa có lớp học nào được tạo."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalCount > limit && (
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
                    {Array.from(
                      { length: Math.ceil(totalCount / limit) },
                      (_, i) => (
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
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href='#'
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < Math.ceil(totalCount / limit))
                            setPage(page + 1);
                        }}
                        aria-disabled={page === Math.ceil(totalCount / limit)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
