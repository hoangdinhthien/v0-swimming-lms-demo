"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchInstructorDetail } from "@/api/instructors-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  User,
  Tag,
  Key,
  Building,
  Award,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken } from "@/api/auth-utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMediaDetails } from "@/api/media-api";

export default function InstructorDetailPage() {
  const params = useParams();
  const instructorId = params?.id as string;
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      setDetail(null);
      try {
        const tenantId = getSelectedTenant();
        if (!tenantId) throw new Error("No tenant selected");
        const token = getAuthToken();
        if (!token) throw new Error("Not authenticated");
        const detailData = await fetchInstructorDetail({
          instructorId,
          tenantId,
          token,
        });
        setDetail(detailData);

        // Fetch avatar if available
        if (detailData?.user?.featured_image?.[0]) {
          try {
            const mediaPath = await getMediaDetails(
              detailData.user.featured_image[0]
            );
            if (mediaPath) {
              setAvatarUrl(mediaPath);
            }
          } catch (mediaErr) {
            console.error("Error fetching instructor image:", mediaErr);
          }
        }
      } catch (e: any) {
        setError(e.message || "Lỗi khi lấy thông tin giáo viên");
      }
      setLoading(false);
    }
    if (instructorId) fetchDetail();
  }, [instructorId]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <div>Đang tải chi tiết giáo viên...</div>
      </div>
    );
  }

  if (error) {
    return <div className='text-red-500 p-8'>{error}</div>;
  }

  if (!detail) {
    return <div className='p-8'>Không tìm thấy giáo viên.</div>;
  }
  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager/instructors'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' /> Quay về danh sách giáo viên
        </Link>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Profile Section */}
        <Card className='md:col-span-1'>
          <CardHeader className='pb-2'>
            <CardTitle>Thông tin giáo viên</CardTitle>
          </CardHeader>
          <CardContent className='flex flex-col items-center text-center pt-2'>
            <Avatar className='h-32 w-32 mb-4'>
              <AvatarImage
                src={avatarUrl}
                alt={detail.user?.username || "Instructor"}
              />
              <AvatarFallback className='text-2xl'>
                {detail.user?.username?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            <h2 className='text-xl font-bold'>{detail.user?.username}</h2>
            <p className='text-muted-foreground mb-2'>{detail.user?.email}</p>

            <div className='mt-4 w-full'>
              {detail.user?.role_front?.length > 0 && (
                <div className='flex flex-wrap gap-2 justify-center'>
                  {detail.user.role_front.map((role: string, index: number) => (
                    <Badge
                      key={index}
                      variant='outline'
                      className='py-1.5'
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              )}
              <div className='mt-4'>
                <Badge
                  variant={detail.user?.is_active ? "default" : "destructive"}
                  className='py-1.5'
                >
                  {detail.user?.is_active ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Section */}
        <Card className='md:col-span-2'>
          <CardHeader>
            <CardTitle>Chi tiết giáo viên</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-4'>
                <div className='flex items-start gap-2'>
                  <User className='h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0' />
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Tên đăng nhập
                    </p>
                    <p className='font-medium'>
                      {detail.user?.username || "-"}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-2'>
                  <Mail className='h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Email</p>
                    <p className='font-medium'>{detail.user?.email || "-"}</p>
                  </div>
                </div>

                <div className='flex items-start gap-2'>
                  <Calendar className='h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Ngày tạo</p>
                    <p className='font-medium'>
                      {detail.user?.created_at
                        ? (() => {
                            // Parse the UTC date string
                            const utcDate = new Date(detail.user.created_at);
                            // Format as UTC (not local Vietnam time)
                            return utcDate.toLocaleString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              timeZone: "UTC", // Show as UTC, not Vietnam time
                            });
                          })()
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='flex items-start gap-2'>
                  <Award className='h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Chuyên môn</p>
                    <p className='font-medium'>
                      {detail.user?.role_front?.join(", ") || "-"}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-2'>
                  <Key className='h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0' />
                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Mã giáo viên
                    </p>
                    <p className='font-medium'>{detail.user?._id || "-"}</p>
                  </div>
                </div>

                <div className='flex items-start gap-2'>
                  <Building className='h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0' />
                  <div>
                    <p className='text-sm text-muted-foreground'>Mã tenant</p>
                    <p className='font-medium'>{detail?.tenant_id || "-"}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className='my-4' />

            <div className='flex justify-end gap-3'>
              <Button variant='outline'>Chỉnh sửa</Button>
              <Button>Liên hệ</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
