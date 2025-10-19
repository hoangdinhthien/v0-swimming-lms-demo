"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  User,
  Building,
  Key,
  Book,
  Filter,
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
import { fetchStaff } from "@/api/manager/staff-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import StaffPermissionModal from "@/components/manager/staff-permission-modal";

// Helper function to extract avatar URL from featured_image
function extractAvatarUrl(featuredImage: any): string {
  console.log("Extracting avatar from featured_image:", featuredImage);

  if (!featuredImage) {
    console.log("No featured_image provided");
    return "/placeholder.svg";
  }

  // Handle empty array - return placeholder immediately
  if (Array.isArray(featuredImage) && featuredImage.length === 0) {
    console.log("Empty featured_image array, using placeholder");
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

export default function StaffPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission modal states
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedStaffForPermission, setSelectedStaffForPermission] =
    useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId) throw new Error("No tenant selected");
        if (!token) throw new Error("Not authenticated");

        // Use the staff API to fetch staff members
        const data = await fetchStaff({
          tenantId,
          token,
        });

        // Process each staff member to get their images
        const processedStaff = data.map((item: any, index: number) => {
          // Extract avatar URL using helper function
          const avatarUrl = extractAvatarUrl(item.user?.featured_image);
          console.log(`Avatar for staff ${item.user?.username}:`, avatarUrl);

          // Debug logging for ID issues
          console.log(`Processing staff: ${item.user?.username}`);
          console.log(`- Staff ID (item._id): ${item._id}`);
          console.log(`- User ID (item.user._id): ${item.user?._id}`);
          console.log(`- Full item:`, item);

          // Use user._id for navigation since that's what the detail page expects
          // This ensures consistent ID usage throughout the application
          const primaryId = item.user?._id || `staff-${index}`;

          return {
            id: primaryId, // Use user._id for navigation and display
            staffId: item._id, // Keep staff._id for reference
            userId: item.user?._id, // Keep user._id separately for API calls
            name: item.user?.username || "-",
            email: item.user?.email || "-",
            phone: item.user?.phone || "-",
            department: item.user?.role_front || [],
            status: item.user?.is_active ? "Active" : "Inactive",
            joinDate: item.user?.created_at
              ? new Date(item.user.created_at).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  timeZone: "UTC",
                })
              : "-",
            avatar: avatarUrl,
            featuredImageData: item.user?.featured_image?.[0] || null,
          };
        });

        console.log("Processed staff array:", processedStaff);
        console.log(
          "Staff IDs:",
          processedStaff.map((s) => ({
            name: s.name,
            id: s.id,
            userId: s.userId,
            staffId: s.staffId,
          }))
        );

        // Since we're now always using staff._id, no need for duplicate checking
        console.log("Final staff array:", processedStaff);
        setStaff(processedStaff);
      } catch (e: any) {
        setError(e.message || "Failed to fetch staff");
      }
      setLoading(false);
    }
    load();
  }, []);

  // Get unique departments for filter
  const departments = Array.from(
    new Set(staff.flatMap((member) => member.department))
  );

  // Filter staff based on filters and search
  const filteredStaff = staff.filter((member) => {
    // Filter by status
    const statusMatch =
      statusFilter === "all" || member.status === statusFilter;

    // Filter by department
    const departmentMatch =
      departmentFilter === "all" ||
      member.department.includes(departmentFilter);

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && departmentMatch && searchMatch;
  });

  // Calculate statistics
  const totalStaff = staff.length;
  const activeStaff = staff.filter((m) => m.status === "Active").length;
  const inactiveStaff = totalStaff - activeStaff;

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
        <p className='text-muted-foreground'>Đang tải danh sách nhân viên...</p>
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

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Nhân viên</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả nhân viên tại trung tâm bơi lội của bạn
          </p>
        </div>
        <Link href='/dashboard/manager/staff/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Thêm Nhân viên
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Users className='h-4 w-4 text-primary' />
              Tổng số nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {totalStaff}
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
              {activeStaff}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalStaff > 0
                ? Math.round((activeStaff / totalStaff) * 100)
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
              {inactiveStaff}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalStaff > 0
                ? Math.round((inactiveStaff / totalStaff) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Building className='h-4 w-4 text-blue-600' />
              Phòng ban
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {departments.length}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Khác nhau</p>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8 bg-card/80 backdrop-blur-sm border shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5 text-primary' />
            Danh sách Nhân viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm nhân viên theo tên, email hoặc số điện thoại...'
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
                  <SelectItem value='Inactive'>Ngưng hoạt động</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Lọc theo phòng ban' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả phòng ban</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept}
                      value={dept}
                    >
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden bg-card/50'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/30 hover:bg-muted/40'>
                  <TableHead className='font-semibold'>Nhân viên</TableHead>
                  <TableHead className='font-semibold'>Liên hệ</TableHead>
                  <TableHead className='font-semibold'>Phòng ban</TableHead>
                  <TableHead className='font-semibold'>Ngày tham gia</TableHead>
                  <TableHead className='font-semibold'>Trạng thái</TableHead>
                  <TableHead className='font-semibold'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member, index) => (
                    <TableRow
                      key={`${member.id}-${index}`} // Ensure unique keys even if IDs are duplicated
                      className='cursor-pointer hover:bg-muted/50 transition-all duration-200 border-border/30 group hover:shadow-sm'
                      onClick={() =>
                        router.push(`/dashboard/manager/staff/${member.userId}`)
                      }
                    >
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-10 w-10 border-2 border-primary/10 group-hover:border-primary/30 transition-colors duration-200'>
                            <AvatarImage
                              src={member.avatar}
                              alt={member.name}
                              className='object-cover'
                            />
                            <AvatarFallback className='bg-primary/10 text-primary font-semibold group-hover:bg-primary/20 transition-colors duration-200'>
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {member.name}
                            </div>
                            <div className='text-sm text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-200'>
                              ID: {member.userId?.slice(-8) || "N/A"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1'>
                          <div className='flex items-center gap-2 text-sm'>
                            <Mail className='h-3 w-3 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200' />
                            <span className='group-hover:text-foreground/90 transition-colors duration-200'>
                              {member.email}
                            </span>
                          </div>
                          {member.phone !== "-" && (
                            <div className='flex items-center gap-2 text-sm'>
                              <Phone className='h-3 w-3 text-muted-foreground group-hover:text-blue-500 transition-colors duration-200' />
                              <span className='group-hover:text-foreground/90 transition-colors duration-200'>
                                {member.phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                        <div className='flex flex-wrap gap-1'>
                          {member.department.length > 0 ? (
                            member.department.map((dept: string) => (
                              <Badge
                                key={dept}
                                variant='outline'
                                className='text-xs group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300 dark:group-hover:border-blue-700 transition-all duration-200'
                              >
                                {dept}
                              </Badge>
                            ))
                          ) : (
                            <span className='text-muted-foreground text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              Chưa phân công
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                        <span className='text-sm text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                          {member.joinDate}
                        </span>
                      </TableCell>
                      <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                        <Badge
                          variant='outline'
                          className={`transition-all duration-200 ${
                            member.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 group-hover:bg-green-100 group-hover:border-green-300"
                              : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800 group-hover:bg-gray-100 group-hover:border-gray-300"
                          }`}
                        >
                          {member.status === "Active"
                            ? "Hoạt động"
                            : "Ngưng hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                        <div className='flex items-center justify-between'>
                          <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  "Opening permission modal for:",
                                  member
                                );
                                setSelectedStaffForPermission({
                                  _id: member.id,
                                  user: {
                                    username: member.name,
                                    email: member.email,
                                  },
                                });
                                setPermissionModalOpen(true);
                              }}
                            >
                              <Key className='h-4 w-4 mr-1' />
                              Quyền hạn
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  `Viewing details for staff: ${member.name}, ID: ${member.id}`
                                );
                                router.push(
                                  `/dashboard/manager/staff/${member.id}`
                                );
                              }}
                            >
                              <User className='h-4 w-4 mr-1' />
                              Chi tiết
                            </Button>
                          </div>
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
                      Không tìm thấy nhân viên phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Permission Modal */}
      <StaffPermissionModal
        open={permissionModalOpen}
        onOpenChange={setPermissionModalOpen}
        staffData={selectedStaffForPermission}
        onSuccess={() => {
          // Optionally refresh staff data or show success message
          console.log("Staff permissions updated successfully");
        }}
      />
    </>
  );
}
