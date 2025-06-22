"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getApplicationDetail } from "@/api/applications-api";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params?.id as string;
  const [application, setApplication] = useState<any>(null);
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

  // Helper function to get status styling
  const getStatusStyle = (status: string[]) => {
    if (status.includes("Accepted")) {
      return {
        variant: "default" as const,
        className:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
        icon: CheckCircle2,
      };
    } else if (status.includes("Rejected")) {
      return {
        variant: "destructive" as const,
        className:
          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
        icon: XCircle,
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
  const statusStyle = getStatusStyle(application.status);
  const StatusIcon = statusStyle.icon;
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
                  <div className='p-2 rounded-full bg-primary/10'>
                    <StatusIcon className='h-5 w-5 text-primary' />
                  </div>
                  <Badge
                    variant={statusStyle.variant}
                    className={`${statusStyle.className} px-4 py-2 text-sm font-medium shadow-sm`}
                  >
                    {application.status.join(", ")}
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
                <div className='prose prose-sm max-w-none dark:prose-invert'>
                  <div className='whitespace-pre-wrap text-foreground leading-relaxed p-6 bg-muted/40 rounded-xl border text-base shadow-inner'>
                    {application.content}
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Reply Section */}
            <Card className='shadow-sm hover:shadow-md transition-shadow duration-200 border-0 bg-card/50 backdrop-blur-sm'>
              <CardHeader className='pb-3'>
                <CardTitle className='flex items-center space-x-2 text-lg'>
                  <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30'>
                    <MessageSquare className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <span>Phản hồi</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {" "}
                {application.reply_content ? (
                  <div className='prose prose-sm max-w-none dark:prose-invert'>
                    <div className='whitespace-pre-wrap text-foreground leading-relaxed p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-800 text-base shadow-inner'>
                      {application.reply_content}
                    </div>
                  </div>
                ) : (
                  <div className='flex items-center justify-center p-12 bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl border-2 border-dashed border-muted-foreground/30'>
                    <div className='text-center'>
                      <div className='p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4'>
                        <MessageSquare className='h-10 w-10 text-muted-foreground' />
                      </div>
                      <div className='text-base font-medium text-muted-foreground'>
                        Chưa có phản hồi
                      </div>
                      <div className='text-sm text-muted-foreground/70 mt-1'>
                        Phản hồi sẽ hiển thị tại đây khi có
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
                  <div className='h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20'>
                    <User className='h-6 w-6 text-primary' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-base font-semibold text-foreground truncate'>
                      {application.created_by?.username || "Không có tên"}
                    </div>
                    <div className='text-sm text-muted-foreground font-medium'>
                      Người dùng
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

                <div className='flex justify-between items-center py-3 px-2'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Giờ tạo:
                  </span>
                  <span className='text-sm font-medium text-foreground'>
                    {application.created_at
                      ? new Date(application.created_at).toLocaleTimeString(
                          "vi-VN"
                        )
                      : "-"}
                  </span>
                </div>

                <Separator />

                <div className='flex justify-between items-start py-3 px-2'>
                  <span className='text-sm font-medium text-muted-foreground'>
                    Trạng thái:
                  </span>
                  <div className='text-right'>
                    <Badge
                      variant={statusStyle.variant}
                      className={`${statusStyle.className} px-3 py-1`}
                    >
                      {application.status.join(", ")}
                    </Badge>
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
