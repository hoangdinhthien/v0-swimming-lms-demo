"use client";

import { useStaffStudents } from "@/hooks/useStaffData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Plus,
  ArrowLeft,
  Download,
  Search,
  User,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { parseApiResponse } from "@/utils/api-response-parser";
import { UserAvatar } from "@/components/ui/user-avatar";
import Link from "next/link";
import { useState, useMemo } from "react";

interface StudentItem {
  _id: string;
  user: {
    _id: string;
    username?: string;
    email?: string;
    phone?: string;
    role_front?: string[];
    is_active?: boolean;
    created_at?: string;
    featured_image?: any;
    birthday?: string;
    address?: string;
    parent_id?: string[] | null;
  };
}

export default function StaffStudentsPage() {
  const {
    data,
    loading: isLoading,
    error,
    refetch,
    hasPermission,
  } = useStaffStudents(); // Use the specific hook for students

  // Parse API response to get students array
  const students = useMemo<StudentItem[]>(() => {
    if (!data) return [];
    const parsedData = parseApiResponse(data);

    return parsedData.data.filter((student: StudentItem) =>
      student.user?.role_front?.some(
        (role: string) =>
          role.toLowerCase().includes("member") ||
          role.toLowerCase().includes("học viên")
      )
    );
  }, [data]);

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Date formatting function
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.user?.username
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.phone?.includes(searchTerm) ||
        student._id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && student.user?.is_active) ||
        (statusFilter === "inactive" && !student.user?.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, filteredStudents.length);
  const currentPageData = filteredStudents.slice(startIndex, endIndex);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.user?.is_active
  ).length;
  const inactiveStudents = students.filter(
    (student) => !student.user?.is_active
  ).length;

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách học viên...</p>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Alert>
        <AlertDescription>
          You don't have permission to view students. Please contact your
          manager.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-3xl font-bold tracking-tight'>My Students</h2>
          <Button
            onClick={refetch}
            variant='outline'
            size='sm'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </Button>
        </div>
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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
          Quay lại Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Học viên</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả học viên tại trung tâm bơi lội
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Xuất dữ liệu
          </Button>
          <Button onClick={refetch}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Làm mới
          </Button>
        </div>
      </div>

      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng số học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Đang học</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tạm nghỉ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{inactiveStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {
                students.filter(
                  (student) =>
                    student.user?.created_at &&
                    new Date(student.user.created_at).toDateString() ===
                      new Date().toDateString()
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách học viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm theo tên, email, số điện thoại...'
                className='pl-8'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-1 gap-4'>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='active'>Đang học</SelectItem>
                  <SelectItem value='inactive'>Tạm nghỉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && students.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center py-10'
                    >
                      <div className='flex justify-center'>
                        <div className='animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full'></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : currentPageData.length > 0 ? (
                  currentPageData.map((student) => {
                    const joinDate = student.user?.created_at
                      ? formatDate(student.user.created_at)
                      : "N/A";
                    const roles = student.user?.role_front?.join(", ") || "N/A";

                    return (
                      <TableRow
                        key={student._id}
                        className='cursor-pointer hover:bg-muted/50 transition-colors'
                      >
                        <TableCell>
                          <div className='flex items-center space-x-3'>
                            <UserAvatar
                              user={student.user}
                              size='md'
                            />
                            <div>
                              <div className='font-medium'>
                                {student.user?.username || "N/A"}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                ID: {student._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <Mail className='h-4 w-4 text-muted-foreground' />
                            <span>{student.user?.email || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <Phone className='h-4 w-4 text-muted-foreground' />
                            <span>{student.user?.phone || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <Calendar className='h-4 w-4 text-muted-foreground' />
                            <span>{joinDate}</span>
                          </div>
                        </TableCell>
                        <TableCell className='capitalize'>{roles}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.user?.is_active ? "default" : "secondary"
                            }
                            className={
                              student.user?.is_active
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-gray-100 text-gray-800 border-gray-300"
                            }
                          >
                            {student.user?.is_active ? "Đang học" : "Tạm nghỉ"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center py-8 text-muted-foreground'
                    >
                      Không tìm thấy học viên phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-muted-foreground'>
                Hiển thị {Math.min(startIndex + 1, filteredStudents.length)} -{" "}
                {Math.min(endIndex, filteredStudents.length)} trong tổng số{" "}
                {filteredStudents.length} học viên
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className='h-4 w-4' />
                  <span className='sr-only'>Trang trước</span>
                </Button>
                <div className='text-sm'>
                  Trang {currentPage} / {totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={!canGoNext}
                >
                  <ChevronRight className='h-4 w-4' />
                  <span className='sr-only'>Trang sau</span>
                </Button>
              </div>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className='w-[120px]'>
                  <SelectValue placeholder='Hiển thị' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>10 mỗi trang</SelectItem>
                  <SelectItem value='25'>25 mỗi trang</SelectItem>
                  <SelectItem value='50'>50 mỗi trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
