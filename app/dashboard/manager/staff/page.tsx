"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchStaff } from "@/api/manager/staff-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import StaffPermissionModal from "@/components/manager/staff-permission-modal";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { columns, Staff } from "./components/columns";

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
  const { toast } = useToast();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Permission modal states
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedStaffForPermission, setSelectedStaffForPermission] =
    useState<any>(null);

  // Extract load logic into separate function with optional search
  const loadStaff = async (searchValue?: string, isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else if (searchValue !== undefined) {
      setIsSearching(true);
    }
    setError(null);

    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId) throw new Error("No tenant selected");
      if (!token) throw new Error("Not authenticated");

      // Use the staff API to fetch staff members with search
      const data = await fetchStaff({
        tenantId,
        token,
        searchKey: searchValue?.trim(),
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
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  // Handler for server-side search
  const handleServerSearch = (value: string) => {
    loadStaff(value, false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadStaff();
      toast({
        title: "Đã làm mới",
        description: "Dữ liệu nhân viên đã được cập nhật",
      });
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStaff(undefined, true);
  }, []);

  // Calculate statistics
  const totalStaff = staff.length;
  const activeStaff = staff.filter((m) => m.status === "Active").length;
  const inactiveStaff = totalStaff - activeStaff;

  // Get unique departments for filter options
  const departments = Array.from(
    new Set(staff.flatMap((member) => member.department))
  );

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách nhân viên...
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

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Nhân viên</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả nhân viên tại trung tâm bơi lội của bạn
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
        </div>
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
              <Building2 className='h-4 w-4 text-blue-600' />
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
          <DataTable
            columns={columns}
            data={staff}
            searchKey='name'
            searchPlaceholder='Tìm kiếm theo tên, email hoặc số điện thoại...'
            onServerSearch={handleServerSearch}
            filterOptions={[
              {
                columnId: "status",
                title: "Trạng thái",
                options: [
                  { label: "Hoạt động", value: "Active" },
                  { label: "Ngưng hoạt động", value: "Inactive" },
                ],
              },
              {
                columnId: "department",
                title: "Phòng ban",
                options: departments.map((dept) => ({
                  label: dept,
                  value: dept,
                })),
              },
            ]}
            emptyMessage='Không tìm thấy nhân viên nào'
          />
        </CardContent>
      </Card>

      {/* Staff Permission Modal */}
      <StaffPermissionModal
        open={permissionModalOpen}
        onOpenChange={setPermissionModalOpen}
        staffData={selectedStaffForPermission}
        onSuccess={() => {
          console.log("Staff permissions updated successfully");
        }}
      />
    </>
  );
}
