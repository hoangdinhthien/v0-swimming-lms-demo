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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { fetchStaffInstructors } from "@/api/staff-data/staff-data-api";
import { apiCache } from "@/utils/api-cache";
import PermissionGuard from "@/components/permission-guard";

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

export default function StaffInstructorsPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInstructors() {
      setLoading(true);
      setError(null);
      try {
        // Use updated staff API signature (no manual tenantId/token)
        const response = await fetchStaffInstructors(1, 1000);

        // Extract data from the staff API response structure
        // New API structure: response.data.data (nested data)
        const data = response?.data?.data || [];

        // Process each instructor to get their images
        const processedInstructors = data.map((item: any) => {
          // Extract avatar URL using helper function - now from item.user.featured_image
          const avatarUrl = extractAvatarUrl(item.user?.featured_image);
          console.log(
            `Avatar for instructor ${item.user?.username}:`,
            avatarUrl
          );

          return {
            id: item.user?._id || item._id, // Use user._id for detail page navigation
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
                  timeZone: "UTC",
                })
              : "-",
            rating: 0, // API does not provide
            avatar: avatarUrl,
            ...item,
            user: item.user, // Include the user object
          };
        });

        setInstructors(processedInstructors);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setInstructors([]);
      }
      setLoading(false);
    }
    loadInstructors();
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

  // Calculate statistics
  const totalInstructors = instructors.length;
  const activeInstructors = instructors.filter(
    (i) => i.status === "Active"
  ).length;
  const averageRating = "0.0"; // Staff API doesn't provide rating data
  const totalClasses = 0; // Staff API doesn't provide class data

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
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách giáo viên...
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
      <div className='flex flex-col items-center justify-center min-h-[400px] py-16'>
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
          href='/dashboard/staff'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về trang nhân viên
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Giáo viên</h1>
          <p className='text-muted-foreground'>
            Xem danh sách giáo viên được phân quyền tại trung tâm bơi lội
          </p>
        </div>
        {/* Staff typically don't have permission to add instructors, but keeping for consistency */}
        <PermissionGuard
          module='User'
          action='POST'
        >
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Thêm Giáo viên
          </Button>
        </PermissionGuard>
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
                      rating,
                      avatar,
                    } = instructor;
                    return (
                      <TableRow
                        key={id}
                        className='cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200 border-b border-border/50'
                        onClick={() =>
                          router.push(`/dashboard/staff/instructors/${id}`)
                        }
                      >
                        <TableCell className='py-4 group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-center gap-3'>
                            <div className='relative group-hover:scale-105 transition-transform duration-200'>
                              <Avatar className='h-10 w-10 border-2 border-border/20 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors duration-200'>
                                <AvatarImage
                                  src={avatar}
                                  alt={name}
                                  className='object-cover'
                                />
                                <AvatarFallback className='bg-primary/10 border-2 border-border/20 text-primary group-hover:border-blue-300 dark:group-hover:border-blue-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-all duration-200'>
                                  {getInitials(name)}
                                </AvatarFallback>
                              </Avatar>
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
