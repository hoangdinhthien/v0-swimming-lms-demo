"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Users,
  UserCheck,
  Star,
  GraduationCap,
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
import { fetchInstructorDetail } from "@/api/manager/instructors-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getMediaDetails } from "@/api/media-api";
import {
  useOptimizedInstructors,
  useOptimizedAvatars,
} from "@/hooks/useOptimizedAPI";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Book, Calendar, Key, Building } from "lucide-react";

// Helper function to extract avatar URL from featured_image
function extractAvatarUrl(featuredImage: any): string {
  console.log("Extracting avatar from featured_image:", featuredImage);

  if (!featuredImage) {
    console.log("No featured_image provided");
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

function InstructorDetailModal({
  open,
  onClose,
  instructorId,
}: {
  open: boolean;
  onClose: () => void;
  instructorId: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState("/placeholder-user.jpg");

  useEffect(() => {
    if (!open || !instructorId) return;
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      setDetail(null);
      try {
        const tenantId = getSelectedTenant();
        if (!tenantId) throw new Error("No tenant selected");
        // instructorId is checked above, so we can safely cast
        const detailData = await fetchInstructorDetail({
          instructorId: instructorId as string,
          tenantId,
        });
        setDetail(detailData);

        // Extract avatar URL using helper function
        const avatarUrl = extractAvatarUrl(detailData.user?.featured_image);
        console.log("Setting avatar URL for instructor detail:", avatarUrl);
        setAvatarUrl(avatarUrl);
      } catch (e: any) {
        setError(e.message || "Lỗi khi lấy thông tin giáo viên");
      }
      setLoading(false);
    }
    fetchDetail();
  }, [open, instructorId]);

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      onClose();
    }
  };

  // Create initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className='sm:max-w-md md:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Chi tiết giáo viên</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về giáo viên trong hệ thống
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className='flex justify-center items-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        )}

        {error && (
          <div className='bg-destructive/10 text-destructive rounded-md p-4'>
            {error}
          </div>
        )}

        {detail && !loading && (
          <div className='space-y-6'>
            <div className='flex flex-col sm:flex-row gap-4 items-center'>
              <Avatar className='h-16 w-16 border-2 border-primary/10'>
                <AvatarImage
                  src={avatarUrl}
                  alt={detail.user?.username || "Instructor"}
                />
                <AvatarFallback className='bg-primary/10 text-primary'>
                  {getInitials(detail.user?.username || "IN")}
                </AvatarFallback>
              </Avatar>

              <div className='space-y-1 text-center sm:text-left'>
                <h3 className='font-bold text-lg'>
                  {detail.user?.username || "Unknown"}
                </h3>
                <p className='text-muted-foreground text-sm'>
                  {detail.user?.role_front?.join(", ") || "No specialty listed"}
                </p>
              </div>
            </div>

            <Separator />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium'>Email:</span>
                <span className='text-muted-foreground'>
                  {detail.user?.email || "N/A"}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Book className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium'>Chuyên môn:</span>
                <span className='text-muted-foreground'>
                  {detail.user?.role_front?.join(", ") || "N/A"}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium'>Ngày tạo:</span>
                <span className='text-muted-foreground'>
                  {detail.user?.created_at
                    ? new Date(detail.user.created_at).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )
                    : "N/A"}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <User className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium'>Trạng thái:</span>
                <Badge
                  variant='outline'
                  className={
                    detail.user?.is_active
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }
                >
                  {detail.user?.is_active
                    ? "Đang hoạt động"
                    : "Ngừng hoạt động"}
                </Badge>
              </div>

              <div className='flex items-center gap-2'>
                <Key className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium'>Mã giáo viên:</span>
                <span className='text-muted-foreground font-mono text-xs'>
                  {detail.user?._id || "N/A"}
                </span>
              </div>

              <div className='flex items-center gap-2'>
                <Building className='h-4 w-4 text-muted-foreground' />
                <span className='font-medium'>Mã tenant:</span>
                <span className='text-muted-foreground font-mono text-xs'>
                  {detail.user?.tenant_id || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className='sm:justify-start'>
          <Button
            variant='outline'
            size='sm'
            onClick={onClose}
            className='mt-2 sm:mt-0'
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function InstructorsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    string | null
  >(null);

  // Use optimized hooks for better performance
  const {
    data: rawInstructors,
    loading,
    error,
    refetch,
  } = useOptimizedInstructors();

  // Use optimized avatar loading
  const avatars = useOptimizedAvatars(rawInstructors || []);

  // Process instructors data with memoization
  const instructors = useMemo(() => {
    if (!rawInstructors) return [];

    return rawInstructors.map((item: any) => ({
      id: item._id,
      name: item?.username || "-",
      email: item?.email || "-",
      phone: item?.phone || "-",
      specialty: item?.role_front || [],
      status: item?.is_active ? "Active" : "Inactive",
      students: 0, // API does not provide
      classes: 0, // API does not provide
      joinDate: item?.created_at
        ? new Date(item.created_at).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "UTC",
          })
        : "-",
      rating: 0, // API does not provide
      avatar: avatars[item._id] || "/placeholder.svg",
      featuredImageData: item?.featured_image?.[0] || null,
    }));
  }, [rawInstructors, avatars]);

  // Get unique specialties for filter
  const specialties = Array.from(
    new Set(instructors.flatMap((instructor) => instructor.specialty))
  );

  // Filter instructors based on filters and search
  const filteredInstructors = instructors.filter((instructor) => {
    // Filter by status
    const statusMatch =
      statusFilter === "all" || instructor.status === statusFilter;

    // Filter by specialty
    const specialtyMatch =
      specialtyFilter === "all" ||
      instructor.specialty.includes(specialtyFilter);

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.phone.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && specialtyMatch && searchMatch;
  });

  // Calculate statistics
  const totalInstructors = instructors.length;
  const activeInstructors = instructors.filter(
    (i) => i.status === "Active"
  ).length;
  const averageRating =
    instructors.length > 0
      ? (
          instructors.reduce((sum, instructor) => sum + instructor.rating, 0) /
          instructors.length
        ).toFixed(1)
      : "0.0";
  const totalClasses = instructors.reduce(
    (sum, instructor) => sum + instructor.classes,
    0
  );

  // Create initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách giáo viên...</p>
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
      <InstructorDetailModal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        instructorId={selectedInstructorId}
      />
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về Bảng điều khiển
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Giáo viên</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả giáo viên tại trung tâm bơi lội của bạn
          </p>
        </div>
        <Link href='/dashboard/manager/instructors/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Thêm Giáo viên
          </Button>
        </Link>
      </div>

      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Users className='h-4 w-4 text-primary' />
              Tổng số giáo viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {totalInstructors}
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
              {activeInstructors}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalInstructors > 0
                ? Math.round((activeInstructors / totalInstructors) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Star className='h-4 w-4 text-amber-500' />
              Đánh giá trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-amber-500'>
              {averageRating}
            </div>
            <p className='text-xs text-amber-500 mt-1'>★★★★★</p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <GraduationCap className='h-4 w-4 text-blue-600' />
              Tổng số lớp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {totalClasses}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Lớp đang dạy</p>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8 bg-card/80 backdrop-blur-sm border shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5 text-primary' />
            Danh sách Giáo viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm giáo viên theo tên, email hoặc số điện thoại...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-2 gap-4 w-full md:w-[400px]'>
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
                  <SelectItem value='On Leave'>Đang nghỉ phép</SelectItem>
                  <SelectItem value='Inactive'>Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={specialtyFilter}
                onValueChange={setSpecialtyFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Lọc theo chuyên môn' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả chuyên môn</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem
                      key={specialty}
                      value={specialty}
                    >
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden bg-card/50'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/50'>
                  <TableHead className='font-semibold'>Giáo viên</TableHead>
                  <TableHead className='font-semibold'>Học viên</TableHead>
                  <TableHead className='font-semibold'>Lớp học</TableHead>
                  <TableHead className='font-semibold'>Đánh giá</TableHead>
                  <TableHead className='font-semibold'>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.length > 0 ? (
                  filteredInstructors.map((instructor) => {
                    const {
                      id,
                      name,
                      email,
                      phone,
                      specialty,
                      status,
                      students,
                      classes,
                      joinDate,
                      rating,
                      avatar,
                    } = instructor;
                    return (
                      <TableRow
                        key={id}
                        className='cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200 border-b border-border/50'
                        onClick={() =>
                          router.push(`/dashboard/manager/instructors/${id}`)
                        }
                      >
                        <TableCell className='py-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-3'>
                            <div className='relative group-hover:scale-105 transition-transform duration-200'>
                              <img
                                src={avatar}
                                alt={name}
                                className='h-10 w-10 rounded-full object-cover border-2 border-border/20 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors duration-200'
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const fallback = e.currentTarget
                                    .nextElementSibling as HTMLElement;
                                  if (fallback) {
                                    fallback.style.display = "flex";
                                  }
                                }}
                              />
                              <div
                                className='h-10 w-10 rounded-full bg-primary/10 border-2 border-border/20 hidden items-center justify-center text-sm font-medium text-primary group-hover:border-blue-300 dark:group-hover:border-blue-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-200'
                                style={{ display: "none" }}
                              >
                                {getInitials(name)}
                              </div>
                            </div>
                            <div className='min-w-0 flex-1'>
                              <div className='font-medium text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                {name}
                              </div>
                              <div className='text-sm text-muted-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                {email}
                              </div>
                              {specialty.length > 0 && (
                                <div className='text-xs text-muted-foreground mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                  {specialty.slice(0, 2).join(", ")}
                                  {specialty.length > 2 && "..."}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='py-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-2'>
                            <Users className='h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                            <span className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {students}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='py-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-2'>
                            <GraduationCap className='h-4 w-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                            <span className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {classes}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='py-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-1'>
                            <Star className='h-4 w-4 text-amber-500 fill-current group-hover:text-amber-600 transition-colors duration-200' />
                            <span className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {rating}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='py-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center justify-between'>
                            <Badge
                              variant='outline'
                              className={`transition-all duration-200 ${
                                status === "Active"
                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 group-hover:bg-green-100 group-hover:border-green-300"
                                  : status === "On Leave"
                                  ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 group-hover:bg-amber-100 group-hover:border-amber-300"
                                  : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800 group-hover:bg-gray-100 group-hover:border-gray-300"
                              }`}
                            >
                              {status === "Active"
                                ? "Đang hoạt động"
                                : status === "On Leave"
                                ? "Đang nghỉ phép"
                                : "Ngừng hoạt động"}
                            </Badge>
                            <ChevronRight className='h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center py-12'
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <Users className='h-8 w-8 text-muted-foreground/50' />
                        <p className='text-muted-foreground font-medium'>
                          Không tìm thấy giáo viên phù hợp
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
    </>
  );
}
