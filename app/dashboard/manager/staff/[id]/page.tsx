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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { fetchStaffDetail, updateStaff } from "@/api/staff-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getTenantInfo } from "@/api/tenant-api";
import { uploadMedia, getMediaDetails } from "@/api/media-api";
import { useToast } from "@/hooks/use-toast";
import ManagerNotFound from "@/components/manager/not-found";

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

const staffFormSchema = z.object({
  username: z.string().min(1, { message: "Tên nhân viên là bắt buộc" }),
  email: z.string().min(1, { message: "Email là bắt buộc" }).email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  emergency_contact: z.string().optional(),
  start_date: z.string().optional(),
  position: z.string().optional(),
  is_active: z.boolean().optional(),
});

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = params?.id as string;
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [tenantName, setTenantName] = useState<string>("");
  const [isFetchingTenant, setIsFetchingTenant] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // New state to track avatar upload for form submission
  const [uploadedAvatarId, setUploadedAvatarId] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  const form = useForm<z.infer<typeof staffFormSchema>>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      address: "",
      bio: "",
      emergency_contact: "",
      start_date: "",
      position: "",
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

        console.log("[DEBUG] Fetching staff with user ID:", staffId);
        console.log(
          "[DEBUG] This should be user._id from the staff list (correct)"
        );

        const detailData = await fetchStaffDetail({
          staffId,
          tenantId,
          token,
        });

        console.log("[DEBUG] Fetched staff data:", detailData);
        console.log("[DEBUG] Staff user data:", detailData.user);
        console.log(
          "[DEBUG] Staff featured_image:",
          detailData.user?.featured_image
        );
        console.log(
          "[DEBUG] Staff classes as instructor:",
          detailData.classesAsInstructor
        );
        console.log(
          "[DEBUG] Staff classes as member:",
          detailData.classesAsMember
        );

        setDetail(detailData);

        // Extract avatar URL using helper function
        const avatarUrl = extractAvatarUrl(detailData.user?.featured_image);
        console.log("Setting avatar URL for staff detail:", avatarUrl);
        setAvatarUrl(avatarUrl);

        // Set form default values
        form.reset({
          username: detailData.user?.username || "",
          email: detailData.user?.email || "",
          phone: detailData.user?.phone || "",
          address: detailData.address || "",
          bio: detailData.bio || "",
          emergency_contact: detailData.emergency_contact || "",
          start_date: detailData.start_date
            ? new Date(detailData.start_date).toISOString().split("T")[0]
            : "",
          position: detailData.position || "",
          is_active: detailData.user?.is_active ?? true,
        });
      } catch (e: any) {
        console.error("[DEBUG] Error fetching staff detail:", e);
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
      console.log("[DEBUG] Updating staff with user ID:", staffId);
      console.log("[DEBUG] Staff detail data:", detail);
      console.log("[DEBUG] User ID from URL:", staffId);
      console.log("[DEBUG] Update data:", data);

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

      console.log("[DEBUG] Final update data being sent:", updateData);
      console.log("[DEBUG] Using user ID for update:", staffId);

      // Send request to update staff using the user ID from URL
      await updateStaff({
        staffId: staffId,
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
      toast({
        title: "Cập nhật thất bại",
        description: "Đã xảy ra lỗi khi cập nhật thông tin nhân viên",
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

      const detailData = await fetchStaffDetail({
        staffId,
        tenantId,
        token,
      });
      setDetail(detailData);

      // Extract avatar URL using helper function
      const avatarUrl = extractAvatarUrl(detailData.user?.featured_image);
      setAvatarUrl(avatarUrl);

      // Reset form with new values
      form.reset({
        username: detailData.user?.username || "",
        email: detailData.user?.email || "",
        phone: detailData.user?.phone || "",
        address: detailData.address || "",
        bio: detailData.bio || "",
        emergency_contact: detailData.emergency_contact || "",
        start_date: detailData.start_date
          ? new Date(detailData.start_date).toISOString().split("T")[0]
          : "",
        position: detailData.position || "",
        is_active: detailData.user?.is_active ?? true,
      });

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

      // Update the avatar URL immediately to show the change
      const mediaPath = await getMediaDetails(mediaId);
      if (mediaPath) {
        setAvatarUrl(mediaPath);
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

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <div>Đang tải chi tiết nhân viên...</div>
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
    <div className='container mx-auto py-8 px-4'>
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
            <Avatar className='h-32 w-32 border-4 border-background shadow-md absolute -top-16'>
              <AvatarImage
                src={avatarUrl}
                alt={detail.user?.username || "Staff"}
                className='object-cover'
              />
              <AvatarFallback className='text-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white'>
                {getInitials(detail.user?.username || "NV")}
              </AvatarFallback>
            </Avatar>
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

            <Separator className='my-6' />
          </CardContent>
        </Card>
      </div>

      {/* Edit Staff Dialog */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      >
        <DialogContent className='sm:max-w-[600px]'>
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
                  <Avatar className='h-24 w-24 border-4 border-primary/10'>
                    <AvatarImage
                      src={avatarUrl}
                      alt='Staff Avatar'
                    />
                    <AvatarFallback className='bg-primary/10 text-primary text-lg'>
                      {getInitials(detail.user?.username || "NV")}
                    </AvatarFallback>
                  </Avatar>
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
                    name='position'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chức vụ</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Nhập chức vụ'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='start_date'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày bắt đầu làm việc</FormLabel>
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

                  <FormField
                    control={form.control}
                    name='emergency_contact'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Liên hệ khẩn cấp</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Số điện thoại người thân'
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
                  name='bio'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ghi chú</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Thông tin bổ sung về nhân viên...'
                          rows={4}
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
    </div>
  );
}
