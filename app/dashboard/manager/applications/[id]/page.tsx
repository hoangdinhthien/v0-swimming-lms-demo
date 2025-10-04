"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getApplicationDetail,
  Application,
  ApplicationType,
} from "@/api/applications-api";
import { getMediaDetails } from "@/api/media-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params?.id as string;
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplication() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken() ?? undefined;
        if (!tenantId || !token || !applicationId)
          throw new Error("Thiếu thông tin tenant, token hoặc applicationId");
        const appData = await getApplicationDetail(
          applicationId,
          tenantId,
          token
        );
        console.log("[ApplicationDetailPage] Loaded application:", appData);
        console.log("[ApplicationDetailPage] Application type:", appData?.type);
        setApplication(appData);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setApplication(null);
      }
      setLoading(false);
    }
    if (applicationId) loadApplication();
  }, [applicationId]);
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

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-96 py-16'>
        <XCircle className='h-12 w-12 text-destructive mb-4' />
        <div className='text-lg font-medium text-foreground mb-2'>
          Có lỗi xảy ra
        </div>
        <div className='text-sm text-muted-foreground mb-4'>{error}</div>
        <Button
          asChild
          variant='outline'
        >
          <Link href='/dashboard/manager/applications'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Quay về danh sách
          </Link>
        </Button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className='flex flex-col items-center justify-center min-h-96 py-16'>
        <FileText className='h-12 w-12 text-muted-foreground mb-4' />
        <div className='text-lg font-medium text-foreground mb-2'>
          Không tìm thấy đơn từ
        </div>
        <div className='text-sm text-muted-foreground mb-4'>
          Đơn từ này có thể đã bị xóa hoặc không tồn tại
        </div>
        <Button
          asChild
          variant='outline'
        >
          <Link href='/dashboard/manager/applications'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Quay về danh sách
          </Link>
        </Button>
      </div>
    );
  }

  // Helper function to get type styling
  const getTypeStyle = (type?: string | string[] | ApplicationType) => {
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
  const typeStyle = getTypeStyle(application.type);
  const StatusIcon = typeStyle.icon;
  return (
    <div className='space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500'>
      {/* Breadcrumb Navigation */}
      <div className='flex items-center space-x-2 text-sm'>
        <Button
          asChild
          variant='ghost'
          size='sm'
          className='h-8 px-2 hover:bg-muted/80 transition-colors'
        >
          <Link
            href='/dashboard/manager/applications'
            className='flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
            <span>Quay về danh sách đơn từ</span>
          </Link>
        </Button>
      </div>

      {/* Main Content */}
      <div className='space-y-6'>
        {" "}
        {/* Header Card */}
        <Card className='border-0 shadow-xl bg-gradient-to-br from-background via-background to-muted/40 backdrop-blur-sm'>
          <CardHeader className='pb-6'>
            <div className='flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0'>
              <div className='flex-1 space-y-3'>
                <CardTitle className='text-2xl md:text-3xl xl:text-4xl font-bold text-foreground leading-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text'>
                  {application.title}
                </CardTitle>
                <div className='flex items-center space-x-3'>
                  <Badge
                    variant={typeStyle.variant}
                    className={`${typeStyle.className} px-4 py-2 text-sm font-medium shadow-sm`}
                  >
                    {(() => {
                      if (!application.type) return "Không xác định";

                      // Handle object format: { _id, title, type: string[] }
                      if (
                        typeof application.type === "object" &&
                        application.type !== null &&
                        "title" in application.type
                      ) {
                        const typeObj = application.type as ApplicationType;
                        return typeObj.title || "Không xác định";
                      }

                      // Handle array format: string[]
                      if (Array.isArray(application.type)) {
                        return application.type
                          .map((t) =>
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

                      // Handle string format
                      if (typeof application.type === "string") {
                        return application.type === "instructor"
                          ? "Giảng viên"
                          : application.type === "member"
                          ? "Thành viên"
                          : application.type === "staff"
                          ? "Nhân viên"
                          : "Đơn từ tùy chỉnh";
                      }

                      return "Không xác định";
                    })()}
                  </Badge>
                </div>
              </div>
              <div className='text-right text-sm text-muted-foreground lg:ml-6 flex-shrink-0 space-y-2'>
                <div className='flex items-center space-x-2 justify-end'>
                  <div className='p-1.5 rounded-md bg-muted/50'>
                    <Calendar className='h-4 w-4' />
                  </div>
                  <span className='font-medium'>
                    {application.created_at
                      ? new Date(application.created_at).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "-"}
                  </span>
                </div>
                <div className='flex items-center space-x-2 justify-end'>
                  <div className='p-1.5 rounded-md bg-muted/50'>
                    <Clock className='h-4 w-4' />
                  </div>
                  <span className='font-medium'>
                    {application.created_at
                      ? new Date(application.created_at).toLocaleTimeString(
                          "vi-VN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "-"}
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
            {" "}
            {/* Application Information */}
            <Card className='shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-card/50 backdrop-blur-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center space-x-2 text-lg'>
                  <div className='p-2 rounded-lg bg-primary/10'>
                    <FileText className='h-5 w-5 text-primary' />
                  </div>
                  <span>Thông tin đơn từ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='p-6 bg-muted/40 rounded-xl border'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <div className='text-sm font-medium text-muted-foreground mb-1'>
                          Tiêu đề đơn từ
                        </div>
                        <div className='text-base font-semibold text-foreground'>
                          {application.title}
                        </div>
                      </div>
                      <div>
                        <div className='text-sm font-medium text-muted-foreground mb-1'>
                          Loại đơn từ
                        </div>
                        <div className='space-y-2'>
                          {(() => {
                            if (!application.type) {
                              return (
                                <Badge
                                  variant='outline'
                                  className='text-xs'
                                >
                                  Không xác định
                                </Badge>
                              );
                            }

                            // Handle object format: { _id, title, type: string[] }
                            if (
                              typeof application.type === "object" &&
                              application.type !== null &&
                              "title" in application.type
                            ) {
                              const typeObj =
                                application.type as ApplicationType;
                              return (
                                <div className='space-y-1'>
                                  <div className='text-sm font-semibold text-foreground'>
                                    {typeObj.title}
                                  </div>
                                  <div className='flex flex-wrap gap-1'>
                                    {Array.isArray(typeObj.type) &&
                                      typeObj.type.map((t: string) => (
                                        <Badge
                                          key={t}
                                          variant='outline'
                                          className='text-xs'
                                        >
                                          {t === "instructor"
                                            ? "Giảng viên"
                                            : t === "member"
                                            ? "Thành viên"
                                            : t === "staff"
                                            ? "Nhân viên"
                                            : t}
                                        </Badge>
                                      ))}
                                  </div>
                                </div>
                              );
                            }

                            // Handle array format: string[]
                            if (Array.isArray(application.type)) {
                              return (
                                <div className='flex flex-wrap gap-1'>
                                  {application.type.map((t: string) => (
                                    <Badge
                                      key={t}
                                      variant='outline'
                                      className='text-xs'
                                    >
                                      {t === "instructor"
                                        ? "Giảng viên"
                                        : t === "member"
                                        ? "Thành viên"
                                        : t === "staff"
                                        ? "Nhân viên"
                                        : t}
                                    </Badge>
                                  ))}
                                </div>
                              );
                            }

                            // Handle string format
                            return (
                              <Badge
                                variant='outline'
                                className='text-xs'
                              >
                                {typeof application.type === "string"
                                  ? "Đơn từ tùy chỉnh"
                                  : "Không xác định"}
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className='text-sm font-medium text-muted-foreground mb-1'>
                          Ngày tạo
                        </div>
                        <div className='text-base text-foreground'>
                          {new Date(application.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Status/Progress Section */}
            <Card className='shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-card/50 backdrop-blur-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center space-x-2 text-lg'>
                  <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30'>
                    <MessageSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <span>Trạng thái xử lý</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {application.content || application.reply_content ? (
                  <div className='space-y-4'>
                    {application.content && (
                      <div>
                        <div className='text-sm font-medium text-muted-foreground mb-2'>
                          Nội dung đơn từ:
                        </div>
                        <div className='whitespace-pre-wrap text-foreground leading-relaxed p-4 bg-gradient-to-br from-muted/40 to-muted/60 rounded-lg border text-sm'>
                          {application.content}
                        </div>
                      </div>
                    )}
                    {application.reply_content && (
                      <div>
                        <div className='text-sm font-medium text-muted-foreground mb-2'>
                          Phản hồi:
                        </div>
                        <div className='whitespace-pre-wrap text-foreground leading-relaxed p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-lg border border-blue-200 dark:border-blue-800 text-sm'>
                          {application.reply_content}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='flex items-center justify-center p-12 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/30'>
                    <div className='text-center'>
                      <div className='p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4'>
                        <MessageSquare className='h-10 w-10 text-muted-foreground' />
                      </div>
                      <div className='text-base font-medium text-muted-foreground'>
                        Đơn từ đang được xử lý
                      </div>
                      <div className='text-sm text-muted-foreground/70 mt-1'>
                        Chi tiết và phản hồi sẽ hiển thị tại đây khi có cập nhật
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>{" "}
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
                    <div className='text-base font-semibold text-foreground truncate'>
                      {application.created_by?.username || "Không có tên"}
                    </div>
                  </div>
                </div>
                <Separator />{" "}
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3 text-sm'>
                    <div className='h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center'>
                      <Mail className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                    </div>
                    <span className='text-foreground font-medium'>
                      {application.created_by?.email || "Không có email"}
                    </span>
                  </div>
                  {application.created_by?.phone && (
                    <div className='flex items-center space-x-3 text-sm'>
                      <div className='h-8 w-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center'>
                        <Phone className='h-4 w-4 text-green-600 dark:text-green-400' />
                      </div>
                      <span className='text-foreground font-medium'>
                        {application.created_by.phone}
                      </span>
                    </div>
                  )}{" "}
                  {application.created_by?.role_front && (
                    <div className='flex items-start space-x-3 text-sm'>
                      <div className='h-8 w-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mt-0.5'>
                        <Badge className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {application.created_by.role_front.map(
                          (role: string, index: number) => (
                            <Badge
                              key={index}
                              variant='outline'
                              className='text-xs px-2 py-1'
                            >
                              {role}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>{" "}
            {/* Application Metadata */}
            <Card className='shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-card/50 backdrop-blur-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center space-x-2 text-lg'>
                  <div className='p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30'>
                    <FileText className='h-5 w-5 text-orange-600 dark:text-orange-400' />
                  </div>
                  <span>Chi tiết đơn từ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex justify-between items-center py-3 px-2'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    ID đơn từ:
                  </span>
                  <span className='text-sm font-mono bg-muted px-3 py-1.5 rounded-md text-foreground border'>
                    {application._id.slice(-8)}
                  </span>
                </div>

                <Separator />

                <div className='flex justify-between items-center py-3 px-2'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Ngày tạo:
                  </span>
                  <span className='text-sm font-medium text-foreground'>
                    {application.created_at
                      ? new Date(application.created_at).toLocaleDateString(
                          "vi-VN"
                        )
                      : "-"}
                  </span>
                </div>

                <Separator />

                <div className='flex justify-between items-start py-3 px-2'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Loại đơn từ:
                  </span>
                  <div className='text-right max-w-[60%]'>
                    {(() => {
                      if (!application.type) {
                        return (
                          <Badge
                            variant='secondary'
                            className='px-3 py-1'
                          >
                            Không xác định
                          </Badge>
                        );
                      }

                      // Handle object format: { _id, title, type: string[] }
                      if (
                        typeof application.type === "object" &&
                        application.type !== null &&
                        "title" in application.type
                      ) {
                        const typeObj = application.type as ApplicationType;
                        return (
                          <div className='space-y-1'>
                            <div className='text-sm font-semibold text-foreground'>
                              {typeObj.title}
                            </div>
                            <div className='flex flex-wrap gap-1 justify-end'>
                              {Array.isArray(typeObj.type) &&
                                typeObj.type.map((t: string) => (
                                  <Badge
                                    key={t}
                                    variant={typeStyle.variant}
                                    className={`${typeStyle.className} px-2 py-1 text-xs`}
                                  >
                                    {t === "instructor"
                                      ? "Giảng viên"
                                      : t === "member"
                                      ? "Thành viên"
                                      : t === "staff"
                                      ? "Nhân viên"
                                      : t}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        );
                      }

                      // Handle array format: string[]
                      if (Array.isArray(application.type)) {
                        return (
                          <div className='flex flex-wrap gap-1 justify-end'>
                            {application.type.map((t: string) => (
                              <Badge
                                key={t}
                                variant={typeStyle.variant}
                                className={`${typeStyle.className} px-2 py-1 text-xs`}
                              >
                                {t === "instructor"
                                  ? "Giảng viên"
                                  : t === "member"
                                  ? "Thành viên"
                                  : t === "staff"
                                  ? "Nhân viên"
                                  : t}
                              </Badge>
                            ))}
                          </div>
                        );
                      }

                      // Handle string format
                      return (
                        <Badge
                          variant={typeStyle.variant}
                          className={`${typeStyle.className} px-3 py-1`}
                        >
                          {typeof application.type === "string"
                            ? "Đơn từ tùy chỉnh"
                            : "Không xác định"}
                        </Badge>
                      );
                    })()}
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
