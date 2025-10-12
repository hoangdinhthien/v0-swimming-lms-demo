"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStaffInstructors } from "@/hooks/useStaffData";
import { parseApiResponse } from "@/utils/api-response-parser";
import { UserAvatar } from "@/components/ui/user-avatar";

interface InstructorItem {
  _id: string;
  user: {
    _id: string;
    email?: string;
    username?: string;
    phone?: string;
    is_active?: boolean;
    created_at?: string;
    role_front?: string[];
    featured_image?: any;
    birthday?: string;
    address?: string;
    parent_id?: string[] | null;
  };
  [key: string]: any;
}

export default function StaffInstructorsPage() {
  const {
    data: staffUsersData,
    loading: isLoading,
    error,
    refetch,
    hasPermission,
  } = useStaffInstructors(); // Use the specific hook for instructors
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (staffUsersData) {
      // Use flexible API response parser
      const parsedResponse = parseApiResponse<InstructorItem>(staffUsersData);
      // Filter only instructors from the data
      const instructorData = parsedResponse.data.filter(
        (user) =>
          user.user?.role_front?.includes("instructor") ||
          user.user?.role_front?.includes("manager")
      );
      setInstructors(instructorData);
    }
  }, [staffUsersData]);

  // Filter instructors based on search and status
  const filteredInstructors = instructors.filter((instructor) => {
    const matchesSearch =
      searchTerm === "" ||
      instructor.user?.username
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      instructor.user?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      instructor.user?.phone?.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && instructor.user?.is_active) ||
      (statusFilter === "inactive" && !instructor.user?.is_active);

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalInstructors = instructors.length;
  const activeInstructors = instructors.filter(
    (instructor) => instructor.user?.is_active
  ).length;
  const inactiveInstructors = instructors.filter(
    (instructor) => !instructor.user?.is_active
  ).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredInstructors.length / limit);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Get current page data
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const currentPageData = filteredInstructors.slice(startIndex, endIndex);

  if (!hasPermission) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <Alert>
          <AlertDescription>
            Bạn không có quyền xem danh sách giảng viên. Vui lòng liên hệ quản
            lý.
          </AlertDescription>
        </Alert>
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
          <Button onClick={refetch}>Thử lại</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>
          Đang tải danh sách giảng viên...
        </p>
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
          <h1 className='text-3xl font-bold'>Quản lý Giảng viên</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả giảng viên tại trung tâm bơi lội
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
              Tổng số giảng viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalInstructors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{activeInstructors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tạm nghỉ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{inactiveInstructors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {
                instructors.filter(
                  (instructor) =>
                    instructor.user?.created_at &&
                    new Date(instructor.user.created_at).toDateString() ===
                      new Date().toDateString()
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách giảng viên</CardTitle>
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
                  <SelectItem value='active'>Đang hoạt động</SelectItem>
                  <SelectItem value='inactive'>Tạm nghỉ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && instructors.length === 0 ? (
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
                  currentPageData.map((instructor) => {
                    const joinDate = instructor.user?.created_at
                      ? formatDate(instructor.user.created_at)
                      : "N/A";
                    const roles =
                      instructor.user?.role_front?.join(", ") || "N/A";

                    return (
                      <TableRow
                        key={instructor._id}
                        className='cursor-pointer hover:bg-muted/50 transition-colors'
                      >
                        <TableCell>
                          <div className='flex items-center space-x-3'>
                            <UserAvatar
                              user={instructor.user}
                              size='md'
                            />
                            <div>
                              <div className='font-medium'>
                                {instructor.user?.username || "N/A"}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                ID: {instructor._id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <Mail className='h-4 w-4 text-muted-foreground' />
                            <span>{instructor.user?.email || "N/A"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <Phone className='h-4 w-4 text-muted-foreground' />
                            <span>{instructor.user?.phone || "N/A"}</span>
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
                              instructor.user?.is_active
                                ? "default"
                                : "secondary"
                            }
                            className={
                              instructor.user?.is_active
                                ? "bg-green-100 text-green-800 border-green-300"
                                : "bg-gray-100 text-gray-800 border-gray-300"
                            }
                          >
                            {instructor.user?.is_active
                              ? "Hoạt động"
                              : "Tạm nghỉ"}
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
                      Không tìm thấy giảng viên phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-muted-foreground'>
                Hiển thị {Math.min(startIndex + 1, filteredInstructors.length)}{" "}
                - {Math.min(endIndex, filteredInstructors.length)} trong tổng số{" "}
                {filteredInstructors.length} giảng viên
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
