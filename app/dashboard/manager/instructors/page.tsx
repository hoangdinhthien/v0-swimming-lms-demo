"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Users,
  UserCheck,
  Star,
  GraduationCap,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchInstructorDetail,
  fetchInstructors,
} from "@/api/manager/instructors-api";
import { fetchClasses } from "@/api/manager/class-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getMediaDetails } from "@/api/media-api";
import { useOptimizedAvatars } from "@/hooks/useOptimizedAPI";
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
import { useToast } from "@/hooks/use-toast";
import { createColumns, Instructor } from "./components/columns";
import { DataTable } from "@/components/ui/data-table/data-table";
import InstructorSpecialistModal from "@/components/manager/instructor-specialist-modal";

// Helper function to extract avatar URL from featured_image
function extractAvatarUrl(featuredImage: any): string {
  if (!featuredImage) {
    return "/placeholder.svg";
  }

  // Handle empty array - return placeholder immediately
  if (Array.isArray(featuredImage) && featuredImage.length === 0) {
    return "/placeholder.svg";
  }

  // Handle Array format: featured_image: [{ path: ["url"] }] or [{ path: "url" }]
  if (Array.isArray(featuredImage) && featuredImage.length > 0) {
    const firstImage = featuredImage[0];
    if (firstImage?.path) {
      if (Array.isArray(firstImage.path) && firstImage.path.length > 0) {
        return firstImage.path[0];
      } else if (typeof firstImage.path === "string") {
        return firstImage.path;
      }
    }
  }
  // Handle Object format: featured_image: { path: "url" } or { path: ["url"] }
  else if (typeof featuredImage === "object" && featuredImage.path) {
    if (Array.isArray(featuredImage.path) && featuredImage.path.length > 0) {
      return featuredImage.path[0];
    } else if (typeof featuredImage.path === "string") {
      return featuredImage.path;
    }
  }

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
        setAvatarUrl(avatarUrl);
      } catch (e: any) {
        setError(e.message || "Lỗi khi lấy thông tin huấn luyện viên");
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Chi tiết huấn luyện viên
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về huấn luyện viên trong hệ thống
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-4">
            {error}
          </div>
        )}

        {detail && !loading && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Avatar className="h-16 w-16 border-2 border-primary/10">
                <AvatarImage
                  src={avatarUrl}
                  alt={detail.user?.username || "Instructor"}
                />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(detail.user?.username || "IN")}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-bold text-lg">
                  {detail.user?.username || "Unknown"}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {detail.user?.role_front?.join(", ") || "No specialty listed"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span className="text-muted-foreground">
                  {detail.user?.email || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Book className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Chuyên môn:</span>
                <span className="text-muted-foreground">
                  {detail.user?.role_front?.join(", ") || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Ngày tạo:</span>
                <span className="text-muted-foreground">
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

              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Trạng thái:</span>
                <Badge
                  variant="outline"
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

              <div className="flex items-center gap-2">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Mã huấn luyện viên:</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {detail.user?._id || "N/A"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Mã tenant:</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {detail.user?.tenant_id || "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="mt-2 sm:mt-0"
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
  const { toast } = useToast();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<
    string | null
  >(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rawInstructors, setRawInstructors] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Specialist modal states
  const [specialistModalOpen, setSpecialistModalOpen] = useState(false);
  const [selectedInstructorForSpecialist, setSelectedInstructorForSpecialist] =
    useState<Instructor | null>(null);

  // Fetch instructors with optional search
  const fetchData = async (searchValue?: string, isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    } else if (searchValue !== undefined) {
      setIsSearching(true);
    }
    setError(null);

    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Missing tenant or token");
      }

      const instructors = await fetchInstructors({
        tenantId,
        token,
        role: "instructor",
        searchKey: searchValue?.trim(),
      });

      // Also fetch all classes to aggregate stats
      const classesResult = await fetchClasses(tenantId, token, 1, 1000);

      setRawInstructors(instructors || []);
      setAllClasses(classesResult.data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch instructors");
      setRawInstructors([]);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tải danh sách huấn luyện viên",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchData(undefined, true);
  }, []);

  // Handle server-side search
  const handleServerSearch = (value: string) => {
    fetchData(value, false);
  };

  // Handler for refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token) throw new Error("Missing tenant or token");

      const instructors = await fetchInstructors({
        tenantId,
        token,
        role: "instructor",
      });

      // Also fetch all classes to aggregate stats
      const classesResult = await fetchClasses(tenantId, token, 1, 1000);

      setRawInstructors(instructors || []);
      setAllClasses(classesResult.data || []);
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

  // Handler for edit specialist button click
  const handleEditSpecialist = (instructor: Instructor) => {
    setSelectedInstructorForSpecialist(instructor);
    setSpecialistModalOpen(true);
  };

  // Use optimized avatar loading
  const avatars = useOptimizedAvatars(rawInstructors || []);

  // Process instructors data with memoization
  const instructors = useMemo(() => {
    if (!rawInstructors) return [];

    return rawInstructors.map((item: any) => {
      // Find classes for this instructor
      const instructorClasses = allClasses.filter((c: any) => {
        if (!c.instructor) return false;

        // Normalize instructor(s) to an array of IDs
        const instructorIds: string[] = [];
        if (typeof c.instructor === "string") {
          instructorIds.push(c.instructor);
        } else if (Array.isArray(c.instructor)) {
          c.instructor.forEach((inst: any) => {
            if (typeof inst === "string") instructorIds.push(inst);
            else if (inst?._id) instructorIds.push(inst._id);
            else if (inst?.id) instructorIds.push(inst.id);
          });
        } else if (typeof c.instructor === "object") {
          if (c.instructor._id) instructorIds.push(c.instructor._id);
          else if (c.instructor.id) instructorIds.push(c.instructor.id);
        }

        // Compare against the instructor's ID
        return instructorIds.includes(item._id);
      });

      const studentCount = instructorClasses.reduce(
        (acc: number, c: any) => acc + (c.member?.length || 0),
        0
      );

      return {
        id: item._id,
        name: item?.username || "-",
        email: item?.email || "-",
        phone: item?.phone || "-",
        specialty: item?.role_front || [],
        status: item?.is_active ? "Active" : "Inactive",
        students: studentCount,
        classes: instructorClasses.length,
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
      };
    });
  }, [rawInstructors, avatars, allClasses]);

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
  const totalStudents = instructors.reduce(
    (sum, instructor) => sum + instructor.students,
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">
            Đang tải danh sách huấn luyện viên...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-16">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">
            Lỗi tải dữ liệu
          </div>
          <p className="text-muted-foreground">{error}</p>
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
      <div className="mb-6">
        <Link
          href="/dashboard/manager"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay về Bảng điều khiển
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Huấn luyện viên</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả huấn luyện viên tại trung tâm bơi lội của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Link href="/dashboard/manager/instructors/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Thêm Huấn luyện viên
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <Card className="bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Tổng số huấn luyện viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {totalInstructors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Đã đăng ký</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Đang hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeInstructors}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalInstructors > 0
                ? Math.round((activeInstructors / totalInstructors) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Tổng số học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalStudents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Đang theo học</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-indigo-600" />
              Tổng số lớp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {totalClasses}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lớp đang dạy</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8 bg-card/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Danh sách Huấn luyện viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={createColumns(handleEditSpecialist)}
            data={instructors}
            searchKey="name"
            searchPlaceholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
            onServerSearch={handleServerSearch}
            filterOptions={[
              {
                columnId: "status",
                title: "Trạng thái",
                options: [
                  {
                    label: "Đang hoạt động",
                    value: "Active",
                    icon: "UserCheck",
                  },
                  {
                    label: "Ngừng hoạt động",
                    value: "Inactive",
                    icon: "UserX",
                  },
                ],
              },
            ]}
            emptyMessage="Không tìm thấy huấn luyện viên phù hợp."
          />
        </CardContent>
      </Card>

      {/* Instructor Specialist Modal */}
      <InstructorSpecialistModal
        open={specialistModalOpen}
        onOpenChange={setSpecialistModalOpen}
        instructorData={
          selectedInstructorForSpecialist
            ? {
                id: selectedInstructorForSpecialist.id,
                name: selectedInstructorForSpecialist.name,
                email: selectedInstructorForSpecialist.email,
              }
            : null
        }
        onSuccess={() => {
          // Refresh data after successful update
          fetchData(undefined, false);
        }}
      />
    </>
  );
}
