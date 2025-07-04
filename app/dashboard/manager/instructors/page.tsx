"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search } from "lucide-react";
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
import { fetchInstructors, fetchInstructorDetail } from "@/api/instructors-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getMediaDetails } from "@/api/media-api";

// Add for instructor detail modal
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

        // Try to get avatar if available - handle new featured_image structure
        if (detailData.user?.featured_image?.[0]?.path?.[0]) {
          setAvatarUrl(detailData.user.featured_image[0].path[0]);
        }
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    string | null
  >(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId) throw new Error("No tenant selected");
        if (!token) throw new Error("Not authenticated");

        // Update the API implementation to accept a token and role
        const data = await fetchInstructors({
          tenantId,
          token,
          role: "instructor",
        });

        // Process each instructor to get their images
        const processedInstructors = data.map((item: any) => {
          let avatarUrl = "/placeholder.svg";

          // Handle featured_image structure - Both formats are valid:
          // - Array format: featured_image: [{ path: ["url"] }]
          // - Object format: featured_image: { path: "url" }
          if (item.user?.featured_image) {
            if (
              Array.isArray(item.user.featured_image) &&
              item.user.featured_image.length > 0
            ) {
              // Array format: [{ path: ["url"] }]
              const firstImage = item.user.featured_image[0];
              if (firstImage?.path) {
                if (
                  Array.isArray(firstImage.path) &&
                  firstImage.path.length > 0
                ) {
                  avatarUrl = firstImage.path[0];
                } else if (typeof firstImage.path === "string") {
                  avatarUrl = firstImage.path;
                }
              }
            } else if (
              typeof item.user.featured_image === "object" &&
              item.user.featured_image.path
            ) {
              // Object format: { path: "url" } or { path: ["url"] }
              if (Array.isArray(item.user.featured_image.path)) {
                avatarUrl = item.user.featured_image.path[0];
              } else if (typeof item.user.featured_image.path === "string") {
                avatarUrl = item.user.featured_image.path;
              }
            }
          }

          return {
            id: item._id,
            name: item.user?.username || "-",
            email: item.user?.email || "-",
            phone: item.user?.phone || "-",
            specialty: item.user?.role_front || [],
            status: item.user?.is_active ? "Active" : "Inactive",
            students: 0, // API does not provide
            classes: 0, // API does not provide
            joinDate: item.user?.created_at
              ? new Date(item.user.created_at).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  timeZone: "UTC", // Use UTC timezone for consistency
                })
              : "-",
            rating: 0, // API does not provide
            avatar: avatarUrl,
            // Store the original image data for reference if needed
            featuredImageData: item.user?.featured_image?.[0] || null,
          };
        });

        setInstructors(processedInstructors);
      } catch (e: any) {
        setError(e.message || "Failed to fetch instructors");
      }
      setLoading(false);
    }
    load();
  }, []);

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
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Giáo viên đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructors.filter((i) => i.status === "Active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Điểm đánh giá trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(
                instructors.reduce(
                  (sum, instructor) => sum + instructor.rating,
                  0
                ) / (instructors.length || 1)
              ).toFixed(1)}
            </div>
            <p className='text-xs text-amber-500'>★★★★★</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng số lớp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructors.reduce(
                (sum, instructor) => sum + instructor.classes,
                0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Số lớp trung bình/giáo viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(() => {
                const activeInstructors = instructors.filter(
                  (i) => i.status === "Active"
                );
                const activeCount = activeInstructors.length;
                const totalClasses = instructors.reduce(
                  (sum, instructor) => sum + instructor.classes,
                  0
                );

                // Avoid division by zero and handle edge cases
                if (!activeCount) return 0;

                return Math.round((totalClasses / activeCount) * 10) / 10;
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách Giáo viên</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <div className='py-8 text-center'>Đang tải...</div>}
          {error && (
            <div className='py-8 text-center text-red-500'>{error}</div>
          )}
          {!loading && !error && (
            <>
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

              <div className='rounded-md border overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Giáo viên</TableHead>
                      <TableHead>Chuyên môn</TableHead>
                      <TableHead>Học viên</TableHead>
                      <TableHead>Lớp học</TableHead>
                      <TableHead>Đánh giá</TableHead>
                      <TableHead>Trạng thái</TableHead>
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
                          <TableRow key={id}>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <img
                                  src={avatar}
                                  alt={name}
                                  className='h-8 w-8 rounded-full'
                                />
                                <div>
                                  <Link
                                    href={`/dashboard/manager/instructors/${id}`}
                                    className='font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                                  >
                                    {name}
                                  </Link>
                                  <div className='text-xs text-muted-foreground'>
                                    {email}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col gap-1'>
                                {specialty.map(
                                  (spec: string, index: number) => (
                                    <div
                                      key={index}
                                      className='text-sm'
                                    >
                                      {spec}
                                    </div>
                                  )
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{students}</TableCell>
                            <TableCell>{classes}</TableCell>
                            <TableCell>
                              <div className='flex items-center'>
                                <span className='text-amber-500 mr-1'>★</span>
                                {rating}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant='outline'
                                className={
                                  status === "Active"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : status === "On Leave"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                }
                              >
                                {status === "Active"
                                  ? "Đang hoạt động"
                                  : status === "On Leave"
                                  ? "Đang nghỉ phép"
                                  : "Ngừng hoạt động"}
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
                          Không tìm thấy giáo viên phù hợp với bộ lọc hiện tại.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
