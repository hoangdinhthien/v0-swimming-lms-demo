"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  FileText,
  Users,
  UserCheck,
  UserX,
  Baby,
  Mail,
  Phone,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchStudents } from "@/api/manager/students-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
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

// Helper function to calculate age from birthday
function calculateAge(birthdayStr: string | null | undefined): number | null {
  if (!birthdayStr) return null;

  try {
    const birthday = new Date(birthdayStr);
    // Check if birthday is a valid date
    if (isNaN(birthday.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    // Adjust age if birthday hasn't occurred yet this year
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }
    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
}

export default function StudentsPage() {
  const router = useRouter();
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
        // Process each student to get their images and parent information
        const processedStudents = data.map((item: any) => {
          // Extract avatar URL using helper function
          const avatarUrl = extractAvatarUrl(item.user?.featured_image);
          console.log(`Avatar for student ${item.user?.username}:`, avatarUrl);

          // Extract parent name directly from the response data
          let parentName = null;
          if (
            item.user?.parent_id &&
            Array.isArray(item.user.parent_id) &&
            item.user.parent_id.length > 0
          ) {
            // Parent info is now included in the response
            const parentInfo = item.user.parent_id[0];
            if (parentInfo && parentInfo.username) {
              parentName = parentInfo.username;
            }
          }

          return {
            ...item,
            avatar: avatarUrl,
            parentName: parentName,
          };
        });
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

  // Calculate summary statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(
    (student) => student.user?.is_active
  ).length;
  const inactiveStudents = totalStudents - activeStudents;
  const averageAge =
    students.length > 0
      ? Math.round(
          students.reduce((sum, student) => {
            const age = calculateAge(student.user?.birthday);
            return sum + (age || 0);
          }, 0) /
            students.filter(
              (student) => calculateAge(student.user?.birthday) !== null
            ).length
        ) || 0
      : 0;

  // Helper function to get user initials
  const getUserInitials = (username: string) => {
    return username
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
        <p className='text-muted-foreground'>Đang tải danh sách học viên...</p>
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
          <PermissionGuard
            module='User'
            action='POST'
          >
            <Link href='/dashboard/manager/students/new'>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Thêm học viên
              </Button>
            </Link>
          </PermissionGuard>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Users className='h-4 w-4 text-primary' />
              Tổng số học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {totalStudents}
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
              {activeStudents}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalStudents > 0
                ? Math.round((activeStudents / totalStudents) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <UserX className='h-4 w-4 text-red-500' />
              Ngưng hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-500'>
              {inactiveStudents}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalStudents > 0
                ? Math.round((inactiveStudents / totalStudents) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Baby className='h-4 w-4 text-blue-600' />
              Tuổi trung bình
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{averageAge}</div>
            <p className='text-xs text-muted-foreground mt-1'>Tuổi</p>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8 bg-card/80 backdrop-blur-sm border shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <Users className='h-5 w-5 text-primary' />
            Danh sách học viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm học viên theo tên, email hoặc số điện thoại...'
                className='pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-colors'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='w-full md:w-[200px]'>
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className='h-11 border-muted-foreground/20 focus:border-primary transition-colors'>
                  <SelectValue placeholder='Lọc theo trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4' />
                      Tất cả học viên
                    </div>
                  </SelectItem>
                  <SelectItem value='active'>
                    <div className='flex items-center gap-2'>
                      <UserCheck className='h-4 w-4 text-green-600' />
                      Đang hoạt động
                    </div>
                  </SelectItem>
                  <SelectItem value='inactive'>
                    <div className='flex items-center gap-2'>
                      <UserX className='h-4 w-4 text-red-500' />
                      Ngưng hoạt động
                    </div>
                  </SelectItem>
                  <SelectItem value='on hold'>
                    <div className='flex items-center gap-2'>
                      <Filter className='h-4 w-4 text-orange-500' />
                      Tạm hoãn
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-lg border border-border/50 overflow-hidden shadow-sm'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/30 hover:bg-muted/40 border-border/50'>
                  <TableHead className='font-semibold text-foreground py-4'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4' />
                      Học viên
                    </div>
                  </TableHead>
                  <TableHead className='font-semibold text-foreground py-4'>
                    <div className='flex items-center gap-2'>
                      <Baby className='h-4 w-4' />
                      Tuổi
                    </div>
                  </TableHead>
                  <TableHead className='font-semibold text-foreground py-4'>
                    Khoá học đã đăng ký
                  </TableHead>
                  <TableHead className='font-semibold text-foreground py-4'>
                    Trạng thái
                  </TableHead>
                  <TableHead className='font-semibold text-foreground py-4'>
                    Phụ Huynh
                  </TableHead>
                  <TableHead className='w-8'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const user = student.user || {};
                    return (
                      <TableRow
                        key={student._id}
                        className='cursor-pointer hover:bg-muted/50 transition-all duration-200 border-border/30 group hover:shadow-sm'
                        onClick={() =>
                          router.push(`/dashboard/manager/students/${user._id}`)
                        }
                      >
                        <TableCell className='py-4'>
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-10 w-10 border-2 border-primary/10 shadow-sm group-hover:border-primary/30 transition-colors duration-200'>
                              <AvatarImage
                                src={student.avatar}
                                alt={user.username || "avatar"}
                                className='object-cover'
                              />
                              <AvatarFallback className='bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm group-hover:from-primary/30 group-hover:to-primary/20 transition-colors duration-200'>
                                {user.username
                                  ? getUserInitials(user.username)
                                  : "ST"}
                              </AvatarFallback>
                            </Avatar>
                            <div className='min-w-0 flex-1'>
                              <div className='font-medium text-foreground truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                {user.username}
                              </div>
                              <div className='flex items-center gap-1 text-xs text-muted-foreground mt-1 group-hover:text-muted-foreground/80'>
                                <Mail className='h-3 w-3 group-hover:text-blue-500 transition-colors duration-200' />
                                <span className='truncate'>{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='py-4'>
                          <div className='flex items-center gap-2'>
                            <span className='font-medium text-foreground group-hover:text-foreground/90 transition-colors duration-200'>
                              {calculateAge(user.birthday) !== null
                                ? calculateAge(user.birthday)
                                : "-"}
                            </span>
                            {calculateAge(user.birthday) !== null && (
                              <span className='text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200'>
                                tuổi
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className='py-4'>
                          <span className='text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200'>
                            -
                          </span>
                        </TableCell>
                        <TableCell className='py-4'>
                          <Badge
                            variant='outline'
                            className={`transition-all duration-200 ${
                              user.is_active
                                ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 group-hover:bg-green-100 group-hover:border-green-300 dark:group-hover:bg-green-900"
                                : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 group-hover:bg-gray-100 group-hover:border-gray-300 dark:group-hover:bg-gray-900"
                            }`}
                          >
                            {user.is_active
                              ? "Đang hoạt động"
                              : "Ngưng hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell className='py-4'>
                          {student.parentName ? (
                            <div className='flex items-center gap-2'>
                              <Users className='h-3 w-3 text-blue-600 group-hover:text-blue-700 transition-colors duration-200' />
                              <span className='text-sm font-medium text-blue-700 dark:text-blue-400 group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors duration-200'>
                                {student.parentName}
                              </span>
                            </div>
                          ) : (
                            <span className='text-sm text-muted-foreground italic group-hover:text-muted-foreground/80 transition-colors duration-200'>
                              Không có
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='py-4 w-8'>
                          <ChevronRight className='h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200' />
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
