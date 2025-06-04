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
      } catch (e: any) {
        setError(e.message || "Lỗi khi lấy thông tin giáo viên");
      }
      setLoading(false);
    }
    fetchDetail();
  }, [open, instructorId]);

  if (!open) return null;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40'>
      <div className='bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-md p-6 relative'>
        <button
          className='absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white'
          onClick={onClose}
        >
          ×
        </button>
        <h2 className='text-xl font-bold mb-4'>Chi tiết giáo viên</h2>
        {loading && <div>Đang tải...</div>}
        {error && <div className='text-red-500'>{error}</div>}
        {detail && (
          <div className='space-y-2'>
            <div>
              <b>Tên đăng nhập:</b> {detail.user?.username}
            </div>
            <div>
              <b>Email:</b> {detail.user?.email}
            </div>
            <div>
              <b>Chuyên môn:</b> {detail.user?.role_front?.join(", ")}
            </div>
            <div>
              <b>Ngày tạo:</b>{" "}
              {detail.user?.created_at
                ? new Date(detail.user.created_at).toLocaleString()
                : "-"}
            </div>
            <div>
              <b>Mã giáo viên:</b> {detail.user?._id}
            </div>
            <div>
              <b>Mã tenant:</b> {detail.user?.tenant_id}
            </div>
          </div>
        )}
      </div>
    </div>
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
        const processedInstructors = await Promise.all(
          data.map(async (item: any) => {
            let avatarUrl = "/placeholder.svg";

            // Check if the instructor has a featured image (cover)
            if (item.user?.featured_image?.[0]) {
              try {
                // Use getMediaDetails to fetch the proper image path
                const mediaPath = await getMediaDetails(
                  item.user.featured_image[0]
                );
                if (mediaPath) {
                  avatarUrl = mediaPath;
                }
              } catch (mediaErr) {
                console.error("Error fetching instructor image:", mediaErr);
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
                ? new Date(item.user.created_at).toLocaleDateString()
                : "-",
              rating: 0, // API does not provide
              avatar: avatarUrl,
              // Store the original image ID for reference if needed
              coverImageId: item.user?.featured_image?.[0] || null,
            };
          })
        );

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
                      <TableHead className='text-right'>Thao tác</TableHead>
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
                                  <div className='font-medium'>{name}</div>
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
                            <TableCell className='text-right space-x-2'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => {
                                  setSelectedInstructorId(id);
                                  setDetailModalOpen(true);
                                }}
                              >
                                Xem
                              </Button>
                              <Link
                                href={`/dashboard/manager/instructors/${id}/schedule`}
                              >
                                <Button
                                  variant='ghost'
                                  size='sm'
                                >
                                  Lịch dạy
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
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
