"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  Building,
  Key,
  Edit,
  Loader2,
  Camera,
  Upload,
  MapPin,
  Clock,
  Badge as BadgeIcon,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  fetchStaffDetailWithModule,
  fetchStaffDetail,
  updateStaff,
} from "@/api/manager/staff-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getTenantInfo } from "@/api/tenant-api";
import { uploadMedia, getMediaDetails } from "@/api/media-api";
import { useToast } from "@/hooks/use-toast";
import { parseApiFieldErrors } from "@/utils/api-response-parser";
import ManagerNotFound from "@/components/manager/not-found";
import { UserAvatar } from "@/components/ui/user-avatar";
import StaffPermissionModal from "@/components/manager/staff-permission-modal";

const staffFormSchema = z
  .object({
    username: z.string().min(1, { message: "Tên nhân viên là bắt buộc" }),
    email: z.string().min(1, { message: "Email là bắt buộc" }).email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    birthday: z.string().optional(),
    is_active: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Validate birthday if provided
      if (data.birthday) {
        const birthDate = new Date(data.birthday);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        // Check if date is valid
        if (isNaN(birthDate.getTime())) {
          return false;
        }

        // Check if date is not in the future
        if (birthDate > today) {
          return false;
        }

        // Check if age is reasonable (between 0 and 120 years)
        if (age < 0 || age > 120) {
          return false;
        }

        // If age is exactly 120, check month and day
        if (
          age === 120 &&
          (monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate()))
        ) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Ngày sinh không hợp lệ",
      path: ["birthday"],
    }
  );

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFetchingTenant, setIsFetchingTenant] = useState(false);
  const [tenantName, setTenantName] = useState<string>("");
  // New state to track avatar upload for form submission
  const [uploadedAvatarId, setUploadedAvatarId] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  // Staff Permission Modal state
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedStaffForPermission, setSelectedStaffForPermission] =
    useState<any>(null);

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      address: "",
      birthday: "",
      is_active: true,
    },
  });

  const { toast } = useToast();

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
      try {
        const tenantId = getSelectedTenant();
        if (!tenantId) throw new Error("Không tìm thấy tenant");
        const token = getAuthToken();
        if (!token) throw new Error("Không có thông tin xác thực");

        // Try to fetch staff detail with permissions first
        const detailData = await fetchStaffDetailWithModule({
          staffId, // This is now user._id from the URL
          tenantId,
          token,
        });

        // Check if the response data is empty or null (no staff data found)
        if (!detailData || !detailData.user) {
          // Fallback to fetchStaffDetail if no data found
          const fallbackData = await fetchStaffDetail({
            staffId,
            tenantId,
            token,
          });

          // Convert to expected format and add empty permission array
          // fallbackData already has the structure: { _id, user: {...}, classesAsInstructor, classesAsMember }
          const finalDetailData = {
            user: fallbackData.user, // Extract user from fallbackData
            permission: [],
          };

          setDetail(finalDetailData);

          // Set form default values for fallback data
          form.reset({
            username: fallbackData?.user?.username || "",
            email: fallbackData?.user?.email || "",
            phone: fallbackData?.user?.phone || "",
            address: fallbackData?.user?.address || "",
            birthday: (fallbackData?.user as any)?.birthday
              ? new Date((fallbackData.user as any).birthday)
                  .toISOString()
                  .split("T")[0]
              : "",
            is_active: fallbackData?.user?.is_active ?? true,
          });
        } else {
          setDetail(detailData);

          // Set form default values for normal data
          form.reset({
            username: detailData.user?.username || "",
            email: detailData.user?.email || "",
            phone: detailData.user?.phone || "",
            address: detailData.user?.address || "",
            birthday: (detailData.user as any)?.birthday
              ? new Date((detailData.user as any).birthday)
                  .toISOString()
                  .split("T")[0]
              : "",
            is_active: detailData.user?.is_active ?? true,
          });
        }
      } catch (e: any) {
        // Check if it's a 404 error (staff not found)
        if (
          e.message?.includes("404") ||
          e.message?.includes("không tìm thấy") ||
          e.message?.includes("not found")
        ) {
          setError("404");
        } else {
          setError(e.message || "Lỗi khi lấy thông tin nhân viên");
        }
      }
      setLoading(false);
    }
    if (staffId) fetchDetail();
  }, [staffId]);

  // Effect to fetch tenant name when component loads
  useEffect(() => {
    const currentTenantId = getSelectedTenant();
    if (currentTenantId) {
      fetchTenantName(currentTenantId);
    }
  }, []);

  const onSubmit = async (data: z.infer<typeof staffFormSchema>) => {
    const tenantId = getSelectedTenant();
    const token = getAuthToken();
    if (!tenantId || !token) return;

    try {
      // Prepare update data
      let updateData: any = {
        ...data,
        // Preserve the existing role information
        role_front: detail.user?.role_front || ["staff"],
      };

      // Add featured_image only if we have a new uploaded avatar
      if (uploadedAvatarId) {
        updateData.featured_image = [uploadedAvatarId];
      }

      // Send request to update staff using the user ID from URL
      await updateStaff({
        staffId: staffId, // URL param is now user._id
        tenantId,
        token,
        updates: updateData,
      });

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin nhân viên đã được cập nhật",
        variant: "default",
        className:
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
      });

      setIsEditModalOpen(false);

      // Refetch staff details
      await fetchDetailAgain();
    } catch (error) {
      // Parse field-specific errors from API response
      const { fieldErrors, generalError } = parseApiFieldErrors(error);

      // Set field-specific errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        try {
          form.setError(field as keyof z.infer<typeof staffFormSchema>, {
            type: "server",
            message,
          });
        } catch (e) {
          // Ignore if field doesn't exist in form
        }
      });

      toast({
        title: "Cập nhật thất bại",
        description: generalError,
        variant: "destructive",
      });
      console.error("Error updating staff:", error);
    }
  };

  // Function to refetch staff details
  const fetchDetailAgain = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = getSelectedTenant();
      if (!tenantId) throw new Error("Không tìm thấy tenant");
      const token = getAuthToken();
      if (!token) throw new Error("Không có thông tin xác thực");

      // Try to fetch staff detail with permissions first
      const detailData = await fetchStaffDetailWithModule({
        staffId, // This is user._id from the URL
        tenantId,
        token,
      });

      // Check if the response data is empty or null (no staff data found)
      if (!detailData || !detailData.user) {
        // Fallback to fetchStaffDetail if no data found
        const fallbackData = await fetchStaffDetail({
          staffId,
          tenantId,
          token,
        });

        // Convert to expected format and add empty permission array
        const finalDetailData = {
          user: fallbackData.user, // Extract user from fallbackData
          permission: [],
        };

        setDetail(finalDetailData);

        // Reset form with fallback values
        form.reset({
          username: fallbackData?.user?.username || "",
          email: fallbackData?.user?.email || "",
          phone: fallbackData?.user?.phone || "",
          address: fallbackData?.user?.address || "",
          birthday: (fallbackData?.user as any)?.birthday
            ? new Date((fallbackData.user as any).birthday)
                .toISOString()
                .split("T")[0]
            : "",
          is_active: fallbackData?.user?.is_active ?? true,
        });
      } else {
        setDetail(detailData);

        // Reset form with normal values
        form.reset({
          username: detailData.user?.username || "",
          email: detailData.user?.email || "",
          phone: detailData.user?.phone || "",
          address: detailData.user?.address || "",
          birthday: (detailData.user as any)?.birthday
            ? new Date((detailData.user as any).birthday)
                .toISOString()
                .split("T")[0]
            : "",
          is_active: detailData.user?.is_active ?? true,
        });
      }

      // Clear the uploaded avatar ID after successful update
      setUploadedAvatarId(null);
    } catch (e: any) {
      setError(e.message || "Lỗi khi lấy thông tin nhân viên");
    }
    setLoading(false);
  };

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const tenantId = getSelectedTenant();
    const token = getAuthToken();
    if (!tenantId || !token) {
      toast({
        title: "Lỗi xác thực",
        description: "Không thể xác thực thông tin người dùng",
        variant: "destructive",
      });
      return;
    }

    try {
      const file = e.target.files[0];
      setIsAvatarUploading(true);

      // Upload the media file
      const uploadResponse = await uploadMedia({
        file,
        title: `Avatar for ${detail?.user?.username || "staff"}`,
        alt: `Avatar for ${detail?.user?.username || "staff"}`,
        tenantId,
        token,
      });

      if (!uploadResponse || !uploadResponse.data || !uploadResponse.data._id) {
        throw new Error("Không nhận được ID media từ server");
      }

      const mediaId = uploadResponse.data._id;

      // Update the staff's data in our state first
      if (detail && detail.user) {
        const updatedDetail = {
          ...detail,
          user: {
            ...detail.user,
            featured_image: [mediaId],
          },
        };
        setDetail(updatedDetail);
      }

      setUploadedAvatarId(mediaId);

      toast({
        title: "Tải ảnh lên thành công",
        description: "Ảnh đại diện đã được cập nhật. Nhớ lưu thay đổi!",
        variant: "default",
        className:
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Tải ảnh lên thất bại",
        description: "Đã xảy ra lỗi khi tải ảnh đại diện",
        variant: "destructive",
      });
    } finally {
      setIsAvatarUploading(false);
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

  // Handle opening permissions modal
  const handleOpenPermissionsModal = () => {
    if (!detail) return;

    // Prepare staff data for the permission modal
    const staffData = {
      _id: staffId, // Use the staff ID from URL params
      user: {
        username: detail.user?.username || "",
        email: detail.user?.email || "",
      },
      currentPermissions: detail.permission || [],
    };

    setSelectedStaffForPermission(staffData);
    setPermissionModalOpen(true);
  };

  // Handle permission modal success
  const handlePermissionSuccess = () => {
    // Refresh staff details to show updated permissions
    fetchDetailAgain();
  };

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải chi tiết nhân viên...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error === "404" || !detail) {
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
            <Link href='/dashboard/manager/staff'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Quay về danh sách nhân viên
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
          href='/dashboard/manager/staff'
          className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/30'
        >
          <ArrowLeft className='h-4 w-4' />
          Quay về danh sách
        </Link>
      </div>

      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Hồ sơ nhân viên</h1>
        <p className='text-muted-foreground mt-1'>
          Thông tin chi tiết và công việc của nhân viên
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
        {/* Profile Section */}
        <Card className='md:col-span-1 overflow-hidden border-0 shadow-md'>
          <div className='bg-gradient-to-r from-green-500 to-emerald-400 h-24 dark:from-green-600 dark:to-emerald-500'></div>
          <CardContent className='flex flex-col items-center text-center pt-0 relative pb-6'>
            <UserAvatar
              user={{
                username: detail.user?.username || "NV",
                featured_image: detail.user?.featured_image,
              }}
              className='h-32 w-32 border-4 border-background shadow-md absolute -top-16'
            />
            <div className='mt-16 w-full'>
              <h2 className='text-2xl font-bold mt-2'>
                {detail.user?.username || "Không có tên"}
              </h2>
              <p className='text-muted-foreground mb-3 italic'>
                {detail.position || "Nhân viên"}
              </p>

              {detail.user?.role_front?.length > 0 && (
                <div className='flex flex-wrap gap-1 justify-center mb-4'>
                  {detail.user.role_front.map((role: string) => (
                    <Badge
                      key={role}
                      variant='secondary'
                      className='text-xs'
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              )}

              <div className='mt-3'>
                <Badge
                  variant='outline'
                  className={
                    detail.user?.is_active
                      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                      : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                  }
                >
                  {detail.user?.is_active
                    ? "Đang hoạt động"
                    : "Ngưng hoạt động"}
                </Badge>
              </div>

              <div className='flex flex-col gap-3 mt-6'>
                <Button
                  onClick={() => setIsEditModalOpen(true)}
                  className='w-full'
                >
                  <Edit className='mr-2 h-4 w-4' />
                  Chỉnh sửa thông tin
                </Button>
                <Button
                  onClick={handleOpenPermissionsModal}
                  variant='outline'
                  className='w-full'
                >
                  <UserCheck className='mr-2 h-4 w-4' />
                  Quản lý quyền truy cập
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Section */}
        <Card className='md:col-span-2 border-0 shadow-md'>
          <CardHeader className='bg-gradient-to-r from-muted/50 to-muted border-b'>
            <CardTitle className='text-xl flex items-center gap-2'>
              Chi tiết nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-8 pt-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div className='space-y-5 bg-muted/50 p-5 rounded-lg'>
                <h3 className='text-lg font-semibold text-green-800 dark:text-green-300 flex items-center mb-4 border-b pb-2'>
                  <User className='h-5 w-5 mr-2 text-green-600 dark:text-green-400' />
                  Thông tin cá nhân
                </h3>

                <div className='flex items-center gap-3'>
                  <Mail className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Email</p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.user?.email || "Không có"}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <Phone className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Số điện thoại</p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.user?.phone || "Không có"}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <MapPin className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Địa chỉ</p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.user.address || "Không có"}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Ngày tạo tài khoản</p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.user?.created_at
                        ? new Date(detail.user.created_at).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              timeZone: "UTC",
                            }
                          )
                        : "Không có"}
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3'>
                  <Key className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Mã nhân viên</p>
                    <p className='text-sm text-muted-foreground font-mono'>
                      {detail.user?._id?.slice(-8) || "Không có"}
                    </p>
                  </div>
                </div>
              </div>

              <div className='space-y-5 bg-muted/50 p-5 rounded-lg'>
                <h3 className='text-lg font-semibold text-green-800 dark:text-green-300 flex items-center mb-4 border-b pb-2'>
                  <Building className='h-5 w-5 mr-2 text-green-600 dark:text-green-400' />
                  Thông tin công việc
                </h3>

                <div className='flex items-center gap-3'>
                  <BadgeIcon className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Chức vụ</p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.position || "Không có"}
                    </p>
                  </div>
                </div>

                {/* <div className='flex items-center gap-3'>
                  <Calendar className='h-4 w-4 text-muted-foreground' />
                  <div>
                    <p className='text-sm font-medium'>Ngày bắt đầu làm việc</p>
                    <p className='text-sm text-muted-foreground'>
                      {detail.start_date
                        ? new Date(detail.start_date).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              timeZone: "UTC",
                            }
                          )
                        : "Không có"}
                    </p>
                  </div>
                </div> */}

                {detail.bio && (
                  <div className='flex items-start gap-3'>
                    <User className='h-4 w-4 text-muted-foreground mt-1' />
                    <div>
                      <p className='text-sm font-medium'>Ghi chú</p>
                      <p className='text-sm text-muted-foreground'>
                        {detail.bio}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Section */}
            {detail.permission && detail.permission.length > 0 && (
              <div className='mt-8'>
                <h3 className='text-lg font-semibold text-blue-800 dark:text-blue-300 flex items-center mb-4 border-b pb-2'>
                  <UserCheck className='h-5 w-5 mr-2 text-blue-600 dark:text-blue-400' />
                  Quyền truy cập hệ thống
                </h3>
                <div className='bg-blue-50/50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800'>
                  <div className='space-y-4'>
                    {detail.permission
                      .filter(
                        (perm: any) => perm?.module && perm.module.length > 0
                      )
                      .map((perm: any, index: number) => (
                        <div
                          key={index}
                          className='border-b border-blue-200 dark:border-blue-700 last:border-b-0 pb-4 last:pb-0'
                        >
                          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <h4 className='font-medium text-blue-900 dark:text-blue-200'>
                                  {perm.module
                                    .map((module: string) => {
                                      const moduleTranslations: {
                                        [key: string]: string;
                                      } = {
                                        Class: "Quản lý lớp học",
                                        Order: "Quản lý Giao dịch",
                                        Course: "Quản lý khóa học",
                                        User: "Quản lý người dùng",
                                        Schedule: "Quản lý lịch học",
                                        News: "Quản lý tin tức",
                                        Application: "Quản lý đơn từ",
                                        ContactForm: "Quản lý liên hệ",
                                      };
                                      return (
                                        moduleTranslations[module] || module
                                      );
                                    })
                                    .join(", ")}
                                </h4>
                                {perm.noReview && (
                                  <Badge
                                    variant='outline'
                                    className='bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-300 dark:border-orange-700 text-xs'
                                  >
                                    Không cần duyệt
                                  </Badge>
                                )}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                <span className='font-medium'>
                                  Quyền thao tác:{" "}
                                </span>
                                {perm.action && Array.isArray(perm.action)
                                  ? perm.action
                                      .map((action: string) => {
                                        const actionTranslations: {
                                          [key: string]: string;
                                        } = {
                                          GET: "Xem",
                                          POST: "Tạo mới",
                                          PUT: "Chỉnh sửa",
                                          DELETE: "Xóa",
                                        };
                                        return (
                                          actionTranslations[action] || action
                                        );
                                      })
                                      .join(", ")
                                  : "Không có"}
                              </div>
                            </div>
                            <div className='flex flex-wrap gap-1'>
                              {perm.action.map((action: string) => {
                                const actionConfig: {
                                  [key: string]: {
                                    label: string;
                                    className: string;
                                  };
                                } = {
                                  GET: {
                                    label: "Xem",
                                    className:
                                      "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700",
                                  },
                                  POST: {
                                    label: "Tạo",
                                    className:
                                      "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700",
                                  },
                                  PUT: {
                                    label: "Sửa",
                                    className:
                                      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700",
                                  },
                                  DELETE: {
                                    label: "Xóa",
                                    className:
                                      "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700",
                                  },
                                };
                                const config = actionConfig[action] || {
                                  label: action,
                                  className:
                                    "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700",
                                };
                                return (
                                  <Badge
                                    key={action}
                                    variant='outline'
                                    className={`text-xs ${config.className}`}
                                  >
                                    {config.label}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <Separator className='my-6' />
          </CardContent>
        </Card>
      </div>

      {/* Edit Staff Dialog */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      >
        <DialogContent className='sm:max-w-[600px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-lg font-semibold'>
              Chỉnh sửa thông tin nhân viên
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cá nhân và công việc của nhân viên
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4'
            >
              <div className='grid gap-6 py-4'>
                {/* Avatar Upload Section */}
                <div className='flex flex-col items-center gap-4'>
                  <UserAvatar
                    user={{
                      username: detail.user?.username || "NV",
                      featured_image: detail.user?.featured_image,
                    }}
                    className='h-24 w-24 border-4 border-primary/10'
                  />
                  <div className='flex flex-col items-center gap-2'>
                    <Label
                      htmlFor='avatar-upload'
                      className='cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      {isAvatarUploading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        <Camera className='h-4 w-4' />
                      )}
                      {isAvatarUploading ? "Đang tải..." : "Thay đổi ảnh"}
                    </Label>
                    <input
                      id='avatar-upload'
                      type='file'
                      accept='image/*'
                      onChange={handleAvatarUpload}
                      className='hidden'
                      disabled={isAvatarUploading}
                    />
                    <p className='text-xs text-muted-foreground text-center'>
                      JPG, PNG hoặc GIF. Tối đa 5MB.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='username'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên nhân viên</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Nhập tên đầy đủ'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder='example@domain.com'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số điện thoại</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='0123456789'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='birthday'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày sinh</FormLabel>
                        <FormControl>
                          <Input
                            type='date'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Địa chỉ</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Nhập địa chỉ thường trú'
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='is_active'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                      <div className='space-y-0.5'>
                        <FormLabel className='text-base'>
                          Trạng thái hoạt động
                        </FormLabel>
                        <div className='text-sm text-muted-foreground'>
                          Bật/tắt trạng thái hoạt động của nhân viên
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type='submit'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <StaffPermissionModal
        open={permissionModalOpen}
        onOpenChange={setPermissionModalOpen}
        staffData={selectedStaffForPermission}
        onSuccess={fetchDetailAgain}
      />
    </div>
  );
}
