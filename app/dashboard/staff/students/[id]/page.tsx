"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Mail,
  Calendar,
  User,
  Building,
  Award,
  Book,
  GraduationCap,
  Phone,
  CreditCard,
  Users,
} from "lucide-react";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMediaDetails } from "@/api/media-api";
import { fetchStaffStudentDetail } from "@/api/staff-data/staff-data-api";
import { getTenantInfo } from "@/api/tenant-api";
import ManagerNotFound from "@/components/manager/not-found";

export default function StaffStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [detail, setDetail] = useState<any>(null);
  const [parentInfo, setParentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [tenantName, setTenantName] = useState<string>("");
  const [isFetchingTenant, setIsFetchingTenant] = useState(false);

  // Fetch tenant name function
  const fetchTenantName = async (tenantId: string) => {
    if (!tenantId) return;
    setIsFetchingTenant(true);
    try {
      const { title } = await getTenantInfo(tenantId);
      setTenantName(title);
    } catch (err) {
      console.error("Error fetching tenant name:", err);
    } finally {
      setIsFetchingTenant(false);
    }
  };

  useEffect(() => {
    async function fetchDetail() {
      setLoading(true);
      setError(null);
      setDetail(null);
      setParentInfo(null);
      try {
        const tenantId = getSelectedTenant();
        if (!tenantId) throw new Error("Không tìm thấy tenant");
        const token = getAuthToken();
        if (!token) throw new Error("Không có thông tin xác thực");

        const detailData = await fetchStaffStudentDetail({
          studentId,
          tenantId,
          token,
        });
        setDetail(detailData);

        // Fetch avatar if available - handle featured_image structure
        if (detailData?.user?.featured_image) {
          if (
            Array.isArray(detailData.user.featured_image) &&
            detailData.user.featured_image.length > 0
          ) {
            const firstImage = detailData.user.featured_image[0];
            if (firstImage?.path) {
              if (
                Array.isArray(firstImage.path) &&
                firstImage.path.length > 0
              ) {
                setAvatarUrl(firstImage.path[0]);
              } else if (typeof firstImage.path === "string") {
                setAvatarUrl(firstImage.path);
              }
            }
          } else if (
            typeof detailData.user.featured_image === "object" &&
            detailData.user.featured_image.path
          ) {
            if (Array.isArray(detailData.user.featured_image.path)) {
              setAvatarUrl(detailData.user.featured_image.path[0]);
            } else if (
              typeof detailData.user.featured_image.path === "string"
            ) {
              setAvatarUrl(detailData.user.featured_image.path);
            }
          } else if (typeof detailData.user.featured_image === "string") {
            try {
              const mediaPath = await getMediaDetails(
                detailData.user.featured_image
              );
              if (mediaPath) {
                setAvatarUrl(mediaPath);
              }
            } catch (error) {
              console.error("Error fetching media details:", error);
            }
          }
        }

        // Check if student has a parent
        if (
          detailData?.user?.parent_id &&
          detailData.user.parent_id.length > 0
        ) {
          const parent = detailData.user.parent_id[0];
          if (parent) {
            setParentInfo({ user: parent });
          }
        }
      } catch (e: any) {
        setError(e.message || "Lỗi khi lấy thông tin học viên");
      }
      setLoading(false);
    }
    if (studentId) fetchDetail();
  }, [studentId]);

  // Effect to fetch tenant name when component loads
  useEffect(() => {
    const currentTenantId = getSelectedTenant();
    if (currentTenantId) {
      fetchTenantName(currentTenantId);
    }
  }, []);

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải thông tin học viên...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error === "NOT_FOUND" || !detail) {
    return <ManagerNotFound />;
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-96 py-16'>
        <div className='text-center space-y-4'>
          <div className='text-lg font-medium text-foreground mb-2'>
            Có lỗi xảy ra
          </div>
          <div className='text-sm text-muted-foreground mb-4'>{error}</div>
          <Button
            asChild
            variant='outline'
          >
            <Link href='/dashboard/staff/students'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Quay về danh sách học viên
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4 animate-in fade-in duration-500'>
      {/* Back Button */}
      <div className='mb-6'>
        <Link
          href='/dashboard/staff/students'
          className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/30'
        >
          <ArrowLeft className='h-4 w-4' />
          Quay về danh sách
        </Link>
      </div>

      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Hồ sơ học viên</h1>
        <p className='text-muted-foreground mt-1'>
          Thông tin chi tiết và lịch sử học tập của học viên
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {/* Profile Section */}
        <Card className='md:col-span-1 overflow-hidden border-0 shadow-md'>
          <div className='bg-gradient-to-r from-blue-500 to-cyan-400 h-24 dark:from-blue-600 dark:to-cyan-500'></div>
          <CardContent className='flex flex-col items-center text-center pt-0 relative pb-6'>
            <Avatar className='h-32 w-32 border-4 border-background shadow-md absolute -top-16'>
              <AvatarImage
                src={avatarUrl}
                alt={detail.user?.username || "Student"}
                className='object-cover'
              />
              <AvatarFallback className='text-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white'>
                {detail.user?.username?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div className='mt-16 w-full'>
              <h2 className='text-2xl font-bold mt-2'>
                {detail.user?.username}
              </h2>
              <p className='text-muted-foreground mb-3 italic'>
                {detail.user?.email}
              </p>

              {detail.user?.role_front?.length > 0 && (
                <div className='flex flex-wrap gap-2 justify-center mb-4'>
                  {detail.user.role_front.map((role: string, index: number) => (
                    <Badge
                      key={index}
                      variant='outline'
                      className='py-1.5 px-3 bg-blue-50/90 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800'
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              )}

              <div className='mt-3'>
                <Badge
                  variant={detail.user?.is_active ? "default" : "destructive"}
                  className={`py-1.5 px-4 ${
                    detail.user?.is_active
                      ? "bg-green-100 hover:bg-green-200 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800"
                      : "bg-red-100 hover:bg-red-200 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800"
                  }`}
                >
                  {detail.user?.is_active ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>

              {/* Action Button - View Schedule Only */}
              <div className='flex flex-col gap-3 mt-6'>
                <Button className='w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 shadow-sm'>
                  <Calendar className='mr-2 h-4 w-4' /> Xem lịch học
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Section */}
        <Card className='md:col-span-2 border-0 shadow-md'>
          <CardHeader className='bg-gradient-to-r from-muted/50 to-muted border-b'>
            <CardTitle className='text-xl flex items-center gap-2'>
              <User className='h-5 w-5 text-blue-600 dark:text-blue-400' /> Chi
              tiết học viên
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-8 pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div className='space-y-5 bg-muted/50 p-5 rounded-lg'>
                <h3 className='text-md font-semibold text-blue-800 dark:text-blue-300 mb-4 border-b pb-2'>
                  Thông tin cá nhân
                </h3>
                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <User className='h-5 w-5 mt-0.5 text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Tên đăng nhập
                    </p>
                    <p className='font-medium mt-0.5'>
                      {detail.user?.username || "-"}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <Mail className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Email
                    </p>
                    <p className='font-medium mt-0.5'>
                      {detail.user?.email || "-"}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <Calendar className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Ngày đăng ký
                    </p>
                    <p className='font-medium mt-0.5'>
                      {detail.user?.created_at
                        ? new Date(detail.user.created_at).toLocaleString()
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <Calendar className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Ngày sinh
                    </p>
                    <p className='font-medium mt-0.5'>
                      {detail.user?.birthday
                        ? new Date(detail.user.birthday).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <Phone className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Số điện thoại
                    </p>
                    <p className='font-medium mt-0.5'>
                      {detail.user?.phone || "-"}
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <Building className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Địa chỉ
                    </p>
                    <p className='font-medium mt-0.5'>
                      {detail.user?.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-5 bg-muted/50 p-5 rounded-lg'>
                <h3 className='text-md font-semibold text-blue-800 dark:text-blue-300 mb-4 border-b pb-2'>
                  Thông tin học tập
                </h3>
                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <GraduationCap className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Loại tài khoản
                    </p>
                    <p className='font-medium mt-0.5'>
                      {detail.user?.role_front?.join(", ") || "-"}
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <Building className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Chi nhánh
                    </p>
                    <p className='font-medium mt-0.5'>
                      {isFetchingTenant ? (
                        <span className='inline-flex items-center'>
                          <Loader2 className='h-3 w-3 mr-2 animate-spin' />
                          Đang tải...
                        </span>
                      ) : (
                        tenantName || "Chi nhánh không xác định"
                      )}
                    </p>
                  </div>
                </div>
                <div className='flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md'>
                  <CreditCard className='h-5 w-5 mt-0.5 text-blue-500 dark:text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform' />
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Trạng thái thanh toán
                    </p>
                    <p className='font-medium mt-0.5'>Đã thanh toán</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information Section - Show only when parent_id exists */}
            {parentInfo && (
              <div className='mt-6'>
                <h3 className='text-lg font-semibold text-blue-800 dark:text-blue-300 flex items-center mb-4 border-b pb-2'>
                  <Users className='h-5 w-5 mr-2 text-blue-600 dark:text-blue-400' />{" "}
                  Thông tin phụ huynh
                </h3>
                <div className='bg-amber-50 border border-amber-100 rounded-md p-5 dark:bg-amber-950/30 dark:border-amber-900/60'>
                  <div className='flex items-center gap-4 mb-4'>
                    <Avatar className='h-14 w-14 border-2 border-background shadow-sm'>
                      <AvatarFallback className='bg-gradient-to-br from-amber-500 to-orange-400 text-white'>
                        {parentInfo.user?.username?.charAt(0) || "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium text-lg'>
                        {parentInfo.user?.username}
                      </p>
                      <p className='text-sm text-amber-700/80 dark:text-amber-400/80'>
                        {parentInfo.user?.email}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 bg-background p-3 rounded-md'>
                    {parentInfo.user?.phone && (
                      <div className='flex items-center gap-2'>
                        <Phone className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                        <span>{parentInfo.user.phone}</span>
                      </div>
                    )}

                    {parentInfo.user?.address && (
                      <div className='flex items-center gap-2'>
                        <Building className='h-4 w-4 text-amber-600 dark:text-amber-400' />
                        <span>{parentInfo.user.address}</span>
                      </div>
                    )}
                  </div>

                  <div className='mt-4 flex justify-end'>
                    <Link
                      href={`/dashboard/staff/students/${parentInfo.user?._id}`}
                    >
                      <Button
                        variant='outline'
                        size='sm'
                        className='bg-background hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      >
                        <User className='mr-2 h-4 w-4' />
                        Xem hồ sơ phụ huynh
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <Separator className='my-6' />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
