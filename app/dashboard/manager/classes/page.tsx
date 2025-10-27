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
  Users,
  BookOpen,
  Clock,
  User,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { fetchClasses, type ClassItem } from "@/api/manager/class-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { useToast } from "@/hooks/use-toast";

export default function ClassesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isFetching, setIsFetching] = useState(false);

  // Helper function to get instructor name from class data
  const getInstructorName = (classItem: ClassItem): string => {
    if (!classItem.instructor) {
      return "Chưa phân công";
    }

    // If instructor is a string (ID), it means it's an old format or not populated
    if (typeof classItem.instructor === "string") {
      return "Không có thông tin";
    }

    // If instructor is an object (new format with populated data)
    if (
      typeof classItem.instructor === "object" &&
      !Array.isArray(classItem.instructor)
    ) {
      return (
        classItem.instructor.username ||
        classItem.instructor.email ||
        "Không có thông tin"
      );
    }

    // If instructor is an array
    if (Array.isArray(classItem.instructor)) {
      if (classItem.instructor.length === 0) {
        return "Chưa phân công";
      }

      // Get names from instructor array
      const names = classItem.instructor
        .map((instructor: any) => {
          if (typeof instructor === "string") {
            return "Không có thông tin";
          }
          if (typeof instructor === "object" && instructor?.username) {
            return instructor.username;
          }
          if (typeof instructor === "object" && instructor?.email) {
            return instructor.email;
          }
          return "Không có thông tin";
        })
        .filter((name) => name !== "Không có thông tin");

      return names.length > 0 ? names.join(", ") : "Không có thông tin";
    }

    return "Không có thông tin";
  };

  // Fetch all classes once - use for both summary cards AND pagination
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      // Prevent duplicate calls
      if (isFetching) return;

      setIsFetching(true);
      setLoading(true);
      setError(null);

      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token)
          throw new Error("Thiếu thông tin tenant hoặc token");

        // Fetch ALL classes at once (instead of 2 separate API calls)
        const result = await fetchClasses(tenantId, token, 1, 1000);

        if (isMounted) {
          setAllClasses(result.data);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e.message || "Lỗi không xác định");
          setAllClasses([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsFetching(false);
        }
      }
    }

    // Only fetch once when component mounts
    const timeoutId = setTimeout(fetchData, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []); // Empty dependency - only run once

  // Filter classes based on search query
  const filteredClasses = allClasses.filter(
    (classItem) =>
      classItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      classItem.course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Client-side pagination: slice the filtered results
  const totalCount = filteredClasses.length;
  const paginatedClasses = filteredClasses.slice(
    (page - 1) * limit,
    page * limit
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
          <Link href='/dashboard/manager/classes/create'>
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Thêm lớp học mới
            </Button>
          </Link>
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
                    <TableHead>Buổi học đã xếp</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClasses.length > 0 ? (
                    paginatedClasses.map((classItem) => (
                      <TableRow
                        key={classItem._id}
                        className='cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200'
                        onClick={() =>
                          router.push(
                            `/dashboard/manager/class/${classItem._id}?from=classes`
                          )
                        }
                      >
                        <TableCell className='font-medium group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-2'>
                            <Users className='h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                            <div className='font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {classItem.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-2'>
                            <BookOpen className='h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                            <div>
                              <div className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                {classItem.course.title}
                              </div>
                              <div className='text-sm text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                {classItem.course.session_number} buổi -{" "}
                                {classItem.course.session_number_duration}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                            <span className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {classItem.member?.length || 0} học viên
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-2'>
                            <User className='h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                            <span className='text-sm text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {getInstructorName(classItem)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-2'>
                            <div>
                              <div className='flex items-center gap-1'>
                                <span className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                  {classItem.schedules?.length || 0}
                                </span>
                                <span className='text-sm text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                  / {classItem.course.session_number || 0}
                                </span>
                              </div>
                              <div className='text-xs text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                {(() => {
                                  const scheduled =
                                    classItem.schedules?.length || 0;
                                  const total =
                                    classItem.course.session_number || 0;
                                  const remaining = total - scheduled;
                                  return remaining > 0
                                    ? `Còn thiếu ${remaining} buổi`
                                    : remaining === 0 && total > 0
                                    ? "Đã xếp đủ lịch"
                                    : "Chưa có lịch";
                                })()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center justify-between'>
                            <Badge
                              variant='outline'
                              className={`transition-all duration-200 ${
                                classItem.course.is_active
                                  ? "bg-green-50 text-green-700 border-green-200 group-hover:bg-green-100 group-hover:border-green-300"
                                  : "bg-gray-50 text-gray-700 border-gray-200 group-hover:bg-gray-100 group-hover:border-gray-300"
                              }`}
                            >
                              {classItem.course.is_active
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
