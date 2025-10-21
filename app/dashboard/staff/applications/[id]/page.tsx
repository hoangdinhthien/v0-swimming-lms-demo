"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  Mail,
  User,
  Calendar,
  Clock,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  Cake,
  ClockIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { fetchStaffData } from "@/api/staff-data/staff-data-api";
import { getMediaDetails } from "@/api/media-api";
import Link from "next/link";

// Profile Image Component
function ProfileImage({
  featuredImage,
  username,
}: {
  featuredImage?: string | string[];
  username: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadImage() {
      if (!featuredImage) {
        console.log("[ProfileImage] No featured image provided");
        return;
      }

      setLoading(true);
      try {
        // Handle both string and array formats
        const imageId = Array.isArray(featuredImage)
          ? featuredImage[0]
          : featuredImage;
        console.log("[ProfileImage] Loading image for ID:", imageId);

        if (imageId) {
          const url = await getMediaDetails(imageId);
          console.log("[ProfileImage] Retrieved URL:", url);

          if (url) {
            // Ensure the URL is absolute
            const fullUrl = url.startsWith("http")
              ? url
              : `${window.location.origin}${url}`;
            console.log("[ProfileImage] Setting full URL:", fullUrl);
            setImageUrl(fullUrl);
          }
        }
      } catch (error) {
        console.error("Error loading profile image:", error);
        setImageUrl(null);
      } finally {
        setLoading(false);
      }
    }

    loadImage();
  }, [featuredImage]);

  // Get user initials for fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className='h-12 w-12 rounded-full bg-primary/10 ring-2 ring-primary/20 flex items-center justify-center'>
        <div className='animate-pulse bg-primary/20 h-8 w-8 rounded-full' />
      </div>
    );
  }

  return (
    <Avatar className='h-12 w-12 ring-2 ring-primary/20'>
      {imageUrl && (
        <AvatarImage
          src={imageUrl}
          alt={`${username} profile`}
          className='object-cover'
          onError={() => setImageUrl(null)}
        />
      )}
      <AvatarFallback className='bg-primary/10 text-primary font-semibold'>
        {getInitials(username)}
      </AvatarFallback>
    </Avatar>
  );
}

export default function StaffApplicationDetailPage() {
  const params = useParams();
  const applicationId = params?.id as string;
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadApplicationDetail = async () => {
      if (!applicationId) {
        setError("Thiếu mã đơn từ");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) throw new Error("Thiếu thông tin xác thực");

        const response = await fetchStaffData({
          module: "Application",
          tenantId,
          token,
          additionalParams: { "search[_id:equal]": applicationId },
        });

        // Extract application data from response
        const applicationData = response?.data?.[0];

        if (!applicationData) {
          throw new Error("Không tìm thấy đơn từ");
        }

        setApplication(applicationData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải thông tin đơn từ"
        );
        setApplication(null);
      } finally {
        setLoading(false);
      }
    };

    loadApplicationDetail();
  }, [applicationId]);

  // Helper function to get status info
  const getStatusInfo = (status?: string[]) => {
    if (!status || status.length === 0) {
      return {
        label: "Chưa xác định",
        variant: "secondary" as const,
        className:
          "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800",
        icon: AlertCircle,
      };
    }

    const currentStatus = status[0];
    switch (currentStatus) {
      case "pending":
        return {
          label: "Đang chờ xử lý",
          variant: "outline" as const,
          className:
            "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
          icon: ClockIcon,
        };
      case "approved":
        return {
          label: "Đã duyệt",
          variant: "default" as const,
          className:
            "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
          icon: CheckCircle2,
        };
      case "rejected":
        return {
          label: "Đã từ chối",
          variant: "destructive" as const,
          className:
            "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
          icon: XCircle,
        };
      default:
        return {
          label: currentStatus,
          variant: "secondary" as const,
          className:
            "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800",
          icon: AlertCircle,
        };
    }
  };

  // Helper function to get type styling
  const getTypeStyle = (type?: any) => {
    if (!type) {
      return {
        variant: "secondary" as const,
        className:
          "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800",
        icon: AlertCircle,
      };
    }

    // Handle different type formats: object with type array, direct array, or string
    let typeArray: string[] = [];

    if (typeof type === "object" && type !== null && "type" in type) {
      // Object format: { _id, title, type: string[] }
      typeArray = Array.isArray(type.type) ? type.type : [type.type];
    } else if (Array.isArray(type)) {
      // Direct array format: string[]
      typeArray = type;
    } else if (typeof type === "string") {
      // String format
      typeArray = [type];
    }

    if (typeArray.includes("instructor")) {
      return {
        variant: "default" as const,
        className:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
        icon: User,
      };
    } else if (typeArray.includes("member")) {
      return {
        variant: "secondary" as const,
        className:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
        icon: User,
      };
    } else if (typeArray.includes("staff")) {
      return {
        variant: "outline" as const,
        className:
          "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800",
        icon: User,
      };
    } else {
      return {
        variant: "secondary" as const,
        className:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800",
        icon: AlertCircle,
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-96 py-16'>
        <div className='relative'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
          <div className='absolute inset-0 h-12 w-12 rounded-full border-2 border-primary/20'></div>
        </div>
        <div className='text-lg font-medium text-foreground mb-2'>
          Đang tải chi tiết đơn từ
        </div>
        <div className='text-sm text-muted-foreground'>
          Vui lòng chờ trong giây lát...
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className='flex flex-col items-center justify-center min-h-96 py-16'>
        <XCircle className='h-12 w-12 text-destructive mb-4' />
        <div className='text-lg font-medium text-foreground mb-2'>
          {error ? "Có lỗi xảy ra" : "Không tìm thấy đơn từ"}
        </div>
        <div className='text-sm text-muted-foreground mb-4'>
          {error || "Đơn từ này có thể đã bị xóa hoặc không tồn tại"}
        </div>
        <Button
          asChild
          variant='outline'
        >
          <Link href='/dashboard/staff/applications'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Quay về danh sách
          </Link>
        </Button>
      </div>
    );
  }

  const typeStyle = getTypeStyle(application.type);
  const statusInfo = getStatusInfo(
    Array.isArray(application.status)
      ? application.status
      : [application.status]
  );
  const StatusIcon = statusInfo.icon;

  return (
    <div className='space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500'>
      {/* Breadcrumb Navigation */}
      <div className='flex items-center justify-between'>
        <Button
          asChild
          variant='ghost'
          size='sm'
          className='h-8 px-2 hover:bg-muted/80 transition-colors'
        >
          <Link
            href='/dashboard/staff/applications'
            className='flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>Quay về danh sách đơn từ</span>
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className='space-y-6'>
        {/* Header Card */}
        <Card className='border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/40 backdrop-blur-sm'>
          <CardHeader className='pb-6'>
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0'>
              <div className='flex-1 space-y-3'>
                <CardTitle className='text-2xl md:text-3xl xl:text-4xl font-bold text-foreground leading-tight'>
                  {application.title}
                </CardTitle>
                <div className='flex flex-wrap items-center gap-3'>
                  <Badge
                    variant={typeStyle.variant}
                    className={`${typeStyle.className} px-4 py-2 text-sm font-medium shadow-sm`}
                  >
                    {(() => {
                      if (!application.type) return "Không xác định";
                      if (
                        typeof application.type === "object" &&
                        application.type !== null &&
                        "title" in application.type
                      ) {
                        const typeObj = application.type;
                        return typeObj.title || "Không xác định";
                      }
                      if (Array.isArray(application.type)) {
                        return application.type
                          .map((t: string) =>
                            t === "instructor"
                              ? "Giảng viên"
                              : t === "member"
                              ? "Thành viên"
                              : t === "staff"
                              ? "Nhân viên"
                              : t
                          )
                          .join(", ");
                      }
                      return "Không xác định";
                    })()}
                  </Badge>

                  <Badge
                    variant={statusInfo.variant}
                    className={`${statusInfo.className} px-4 py-2 text-sm font-medium shadow-sm flex items-center gap-2`}
                  >
                    <StatusIcon className='h-4 w-4' />
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
              <div className='text-right text-sm text-muted-foreground lg:ml-6 flex-shrink-0 space-y-2'>
                <div className='flex items-center space-x-2 justify-end'>
                  <div className='p-1.5 rounded-md bg-muted/50'>
                    <Calendar className='h-4 w-4' />
                  </div>
                  <span className='font-medium'>
                    {formatDate(application.created_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Two Column Layout */}
        <div className='grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6'>
          {/* Main Content */}
          <div className='xl:col-span-3 lg:col-span-2 space-y-6'>
            {/* Application Content */}
            <Card className='shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-card/50 backdrop-blur-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center space-x-2 text-lg'>
                  <div className='p-2 rounded-lg bg-primary/10'>
                    <FileText className='h-5 w-5 text-primary' />
                  </div>
                  <span>Nội dung đơn từ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='p-6 bg-muted/40 rounded-xl border'>
                    <div
                      className='prose prose-lg dark:prose-invert max-w-none text-foreground leading-relaxed'
                      dangerouslySetInnerHTML={{
                        __html:
                          application.content?.replace(/\n/g, "<br />") ||
                          application.content,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Applicant Information */}
            <Card className='shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-card/50 backdrop-blur-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center space-x-2 text-lg'>
                  <div className='p-2 rounded-lg bg-green-100 dark:bg-green-900/30'>
                    <User className='h-5 w-5 text-green-600 dark:text-green-400' />
                  </div>
                  <span>Thông tin người gửi</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center space-x-3 p-4 bg-gradient-to-br from-muted/40 to-muted/60 rounded-xl border'>
                  <ProfileImage
                    featuredImage={application.created_by?.featured_image}
                    username={application.created_by?.username || "User"}
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='font-semibold text-foreground truncate'>
                      {application.created_by?.username || "Không xác định"}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      {application.created_by?.role_front?.[0] === "instructor"
                        ? "Giảng viên"
                        : application.created_by?.role_front?.[0] === "member"
                        ? "Thành viên"
                        : application.created_by?.role_front?.[0] === "staff"
                        ? "Nhân viên"
                        : "Người dùng"}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className='space-y-3'>
                  {application.created_by?.email && (
                    <div className='flex items-center space-x-3'>
                      <div className='p-1.5 rounded-md bg-muted/50 flex-shrink-0'>
                        <Mail className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <span className='text-sm text-foreground truncate'>
                        {application.created_by.email}
                      </span>
                    </div>
                  )}

                  {application.created_by?.phone && (
                    <div className='flex items-center space-x-3'>
                      <div className='p-1.5 rounded-md bg-muted/50 flex-shrink-0'>
                        <Phone className='h-4 w-4 text-muted-foreground' />
                      </div>
                      <span className='text-sm text-foreground'>
                        {application.created_by.phone}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Status Card */}
            <Card className='shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-card/50 backdrop-blur-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center space-x-2 text-lg'>
                  <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30'>
                    <Clock className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <span>Trạng thái đơn từ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='p-4 bg-gradient-to-br from-muted/40 to-muted/60 rounded-xl border'>
                  <div className='flex items-center justify-center mb-3'>
                    <StatusIcon className='h-8 w-8 text-center' />
                  </div>
                  <div className='text-center'>
                    <div className='font-semibold text-foreground text-lg'>
                      {statusInfo.label}
                    </div>
                  </div>
                </div>

                <div className='space-y-3 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Ngày tạo:</span>
                    <span className='font-medium'>
                      {formatDate(application.created_at)}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Cập nhật:</span>
                    <span className='font-medium'>
                      {formatDate(application.updated_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
