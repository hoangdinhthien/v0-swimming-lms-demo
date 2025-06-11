"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Filter, FileText } from "lucide-react";
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
import { fetchStudents } from "@/api/students-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getMediaDetails } from "@/api/media-api";

export default function StudentsPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId) throw new Error("Thiếu thông tin tenant");
        const data = await fetchStudents({
          tenantId: tenantId ?? undefined,
          token: token ?? undefined,
        });
        // Process each student to get their images
        const processedStudents = await Promise.all(
          data.map(async (item: any) => {
            let avatarUrl = "/placeholder.svg";
            if (item.user?.featured_image?.[0]) {
              try {
                const mediaPath = await getMediaDetails(
                  item.user.featured_image[0]
                );
                if (mediaPath) {
                  avatarUrl = mediaPath;
                }
              } catch (mediaErr) {
                console.error("Error fetching student image:", mediaErr);
              }
            }
            return {
              ...item,
              avatar: avatarUrl,
            };
          })
        );
        setStudents(processedStudents);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setStudents([]);
      }
      setLoading(false);
    }
    loadStudents();
  }, []);

  // Filter and search students
  const filteredStudents = students.filter((student) => {
    // Defensive: unwrap user object
    const user = student.user || {};
    // Filter by status
    const statusMatch =
      filter === "all" ||
      (user.is_active ? "active" : "inactive") === filter.toLowerCase();
    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      (user.username &&
        user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.email &&
        user.email.toLowerCase().includes(searchQuery.toLowerCase()));
    return statusMatch && searchMatch;
  });
  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về trang quản lý
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý học viên</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả học viên đã đăng ký tại trung tâm bơi lội của bạn
          </p>
        </div>
        <div className='flex gap-2'>
          <Link href='/dashboard/manager/students/import'>
            <Button variant='outline'>
              <FileText className='mr-2 h-4 w-4' />
              Nhập danh sách
            </Button>
          </Link>
          <Link href='/dashboard/manager/students/new'>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Thêm học viên
            </Button>
          </Link>
        </div>
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
                placeholder='Tìm kiếm học viên theo tên, email hoặc số điện thoại...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='w-full md:w-[180px]'>
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Lọc theo trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả học viên</SelectItem>
                  <SelectItem value='active'>Đang hoạt động</SelectItem>
                  <SelectItem value='inactive'>Ngưng hoạt động</SelectItem>
                  <SelectItem value='on hold'>Tạm hoãn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Tuổi</TableHead>
                  <TableHead>Khoá học đã đăng ký</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow key='loading-row'>
                    <TableCell
                      colSpan={6}
                      className='text-center py-8 text-muted-foreground'
                    >
                      Đang tải dữ liệu học viên...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow key='error-row'>
                    <TableCell
                      colSpan={6}
                      className='text-center py-8 text-red-500'
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const user = student.user || {};
                    return (
                      <TableRow key={student._id}>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <img
                              src={student.avatar}
                              alt={user.username || "avatar"}
                              className='h-8 w-8 rounded-full'
                            />
                            <div>
                              <div className='font-medium'>{user.username}</div>
                              <div className='text-xs text-muted-foreground'>
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>{" "}
                        <TableCell>-</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={
                              user.is_active
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }
                          >
                            {user.is_active
                              ? "Đang hoạt động"
                              : "Ngưng hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className='text-right'>
                          <Link
                            href={`/dashboard/manager/students/${user._id}`}
                          >
                            <Button
                              variant='ghost'
                              size='sm'
                            >
                              Xem
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow key='empty-row'>
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
        </CardContent>
      </Card>
    </>
  );
}
