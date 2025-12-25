"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchInstructorDetail,
  updateInstructor,
  fetchInstructorSpecialist,
} from "@/api/manager/instructors-api";
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
  Phone,
  GraduationCap,
  Users,
  Save,
  MapPin,
  CalendarDays,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  BookOpen,
  Eye,
  Target,
} from "lucide-react";
import Link from "next/link";
import { getAuthToken } from "@/api/auth-utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getMediaDetails, uploadMedia } from "@/api/media-api";
import { getTenantInfo } from "@/api/tenant-api";
import { useToast } from "@/hooks/use-toast";
import { parseApiFieldErrors } from "@/utils/api-response-parser";
import { ScheduleModal } from "@/components/manager/schedule-modal";
import InstructorSpecialistModal from "@/components/manager/instructor-specialist-modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import PermissionGuard from "@/components/permission-guard";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import ManagerNotFound from "@/components/manager/not-found";
import {
  optionalPhoneSchema,
  requiredStringSchema,
  getBirthDateSchema,
} from "@/lib/schemas";

const instructorFormSchema = z.object({
  username: requiredStringSchema("Tên đăng nhập là bắt buộc"),
  email: z.string().email("Email không hợp lệ"),
  phone: optionalPhoneSchema.optional(),
  birthday: getBirthDateSchema(18, "Huấn luyện viên").optional(),
  address: z.string().optional(),
  is_active: z.boolean().optional(),
  // Adding avatar field for the form schema
  avatar: z.any().optional(),
});

export default function InstructorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const instructorId = params?.id as string;
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [tenantName, setTenantName] = useState<string>("");
  const [isFetchingTenant, setIsFetchingTenant] = useState(false);
  const [open, setOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // New state to track avatar upload for form submission
  const [uploadedAvatarId, setUploadedAvatarId] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [specialistInfo, setSpecialistInfo] = useState<any>(null);
  const [isSpecialistModalOpen, setIsSpecialistModalOpen] = useState(false);
  const form = useForm<z.infer<typeof instructorFormSchema>>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues: {
      username: "",
      email: "",
      phone: "",
      birthday: "",
      address: "",
      is_active: true, // Default to true for new instructors
      avatar: undefined,
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

        const detailData = await fetchInstructorDetail({
          instructorId,
          tenantId,
          token,
        });

        setDetail(detailData);

        // Handle featured_image structure - API returns different formats across endpoints:
        // Both formats are valid:
        // - Array format: featured_image: [{ path: ["url"] }] (array of objects with path arrays)
        // - Object format: featured_image: { path: "url" } (object with path string)
        if (detailData?.user?.featured_image) {
          if (
            Array.isArray(detailData.user.featured_image) &&
            detailData.user.featured_image.length > 0
          ) {
            // Array format: [{ path: ["url"] }]
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
            // Object format: { path: "url" } or { path: ["url"] }
            if (Array.isArray(detailData.user.featured_image.path)) {
              setAvatarUrl(detailData.user.featured_image.path[0]);
            } else if (
              typeof detailData.user.featured_image.path === "string"
            ) {
              setAvatarUrl(detailData.user.featured_image.path);
            }
          } else if (typeof detailData.user.featured_image === "string") {
            // Fallback: if it's just a media ID string, try to get media details
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
        } // Set form default values
        form.reset({
          username: detailData.user?.username || "",
          email: detailData.user?.email || "",
          phone: detailData.user?.phone || "",
          birthday: detailData.user?.birthday
            ? new Date(detailData.user.birthday).toISOString().split("T")[0]
            : "",
          address: detailData.user?.address || "",
          is_active: detailData.user?.is_active ?? true, // Use nullish coalescing to preserve false values
        });

        // Fetch specialist information
        try {
          const specialistData = await fetchInstructorSpecialist({
            searchParams: { user: detailData.user?._id },
            tenantId,
            token,
          });
          if (specialistData && specialistData.length > 0) {
            setSpecialistInfo(specialistData[0]);
          }
        } catch (specialistError) {
          console.error("Error fetching specialist info:", specialistError);
          // Don't set error state for specialist info, just log it
        }
      } catch (e: any) {
        console.error("[DEBUG] Error fetching instructor detail:", e);
        // Check if it's a 404 error (instructor not found)
        if (
          e.message?.includes("404") ||
          e.message?.includes("không tìm thấy") ||
          e.message?.includes("not found")
        ) {
          setError("404");
        } else {
          setError(e.message || "Lỗi khi lấy thông tin Huấn luyện viên");
        }
      }
      setLoading(false);
    }
    if (instructorId) fetchDetail();
  }, [instructorId]);
  // Effect to fetch tenant name when component loads
  useEffect(() => {
    const currentTenantId = getSelectedTenant();
    if (currentTenantId) {
      fetchTenantName(currentTenantId);
    }
  }, []); // Run once when component mounts

  const onSubmit = async (data: z.infer<typeof instructorFormSchema>) => {
    const tenantId = getSelectedTenant();
    const token = getAuthToken();
    if (!tenantId || !token) return;

    try {
      // Use the user._id for the actual update, not the outer instructorId
      const actualUserId = detail?.user?._id;
      if (!actualUserId) {
        throw new Error("Không tìm thấy ID người dùng hợp lệ");
      }

      // Prepare update data, preserving existing fields not in the form
      let updateData: any = {
        ...data,
        // Preserve the existing role information
        role: detail.user?.role || ["instructor"],
      };

      // Remove avatar field as it's not expected by the API
      delete updateData.avatar;

      // Add featured_image only if we have a new uploaded avatar
      if (uploadedAvatarId) {
        updateData.featured_image = [uploadedAvatarId]; // Send as array of strings
      }

      // Send request to update instructor using the correct user ID
      await updateInstructor({
        instructorId: actualUserId, // Use the user._id instead of the outer _id
        tenantId,
        token,
        data: updateData,
      });

      toast({
        title: "Cập nhật thành công",
        description: "Thông tin Huấn luyện viên đã được cập nhật",
        variant: "default",
        className:
          "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
      });

      setOpen(false);

      // Refetch instructor details
      setLoading(true);
      setError(null);
      setDetail(null);
      try {
        const detailData = await fetchInstructorDetail({
          instructorId,
          tenantId,
          token,
        });
        setDetail(detailData);

        // Handle featured_image structure - API returns different formats across endpoints:
        // Both formats are valid:
        // - Array format: featured_image: [{ path: ["url"] }] (array of objects with path arrays)
        // - Object format: featured_image: { path: "url" } (object with path string)
        if (detailData?.user?.featured_image) {
          if (
            Array.isArray(detailData.user.featured_image) &&
            detailData.user.featured_image.length > 0
          ) {
            // Array format: [{ path: ["url"] }]
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
            // Object format: { path: "url" } or { path: ["url"] }
            if (Array.isArray(detailData.user.featured_image.path)) {
              setAvatarUrl(detailData.user.featured_image.path[0]);
            } else if (
              typeof detailData.user.featured_image.path === "string"
            ) {
              setAvatarUrl(detailData.user.featured_image.path);
            }
          } else if (typeof detailData.user.featured_image === "string") {
            // Fallback: if it's just a media ID string, try to get media details
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
        } // Reset form with new values
        form.reset({
          username: detailData.user?.username || "",
          email: detailData.user?.email || "",
          phone: detailData.user?.phone || "",
          birthday: detailData.user?.birthday || "",
          address: detailData.user?.address || "",
          is_active: detailData.user?.is_active ?? true, // Use nullish coalescing to preserve false values
        });

        // Clear the uploaded avatar ID after successful update
        setUploadedAvatarId(null);
      } catch (e: any) {
        setError(e.message || "Lỗi khi lấy thông tin Huấn luyện viên");
      }
      setLoading(false);
    } catch (error) {
      // Parse field-specific errors from API response
      const { fieldErrors, generalError } = parseApiFieldErrors(error);

      // Set field-specific errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        try {
          form.setError(field as keyof z.infer<typeof instructorFormSchema>, {
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
      console.error("Error updating instructor:", error);
    }
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
        title: `Avatar for ${detail?.user?.username || "instructor"}`,
        alt: `Avatar for ${detail?.user?.username || "instructor"}`,
        tenantId,
        token,
      });

      if (!uploadResponse || !uploadResponse.data || !uploadResponse.data._id) {
        throw new Error("Không nhận được ID media từ server");
      }

      const mediaId = uploadResponse.data._id;

      // Update the instructor's data in our state first
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

      setUploadedAvatarId(mediaId); // Set the uploaded avatar ID for form submission

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">
            Đang tải chi tiết Huấn luyện viên...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
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
    return <div className="text-red-500 p-8">{error}</div>;
  }
  return (
    <div className="container mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          href="/dashboard/manager/instructors"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay về danh sách
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Hồ sơ Huấn luyện viên</h1>
        <p className="text-muted-foreground mt-1">
          Thông tin chi tiết và lịch dạy của Huấn luyện viên
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Section */}
        <Card className="md:col-span-1 overflow-hidden border-0 shadow-md">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-400 h-24 dark:from-indigo-600 dark:to-purple-500"></div>
          <CardContent className="flex flex-col items-center text-center pt-0 relative pb-6">
            <Avatar className="h-32 w-32 border-4 border-background shadow-md absolute -top-16">
              <AvatarImage
                src={avatarUrl}
                alt={detail.user?.username || "Instructor"}
                className="object-cover"
              />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                {detail.user?.username?.charAt(0) || "G"}
              </AvatarFallback>
            </Avatar>
            <div className="mt-16 w-full">
              <h2 className="text-2xl font-bold mt-2">
                {detail.user?.username}
              </h2>
              <p className="text-muted-foreground mb-3 italic">
                {detail.user?.email}
              </p>

              {detail.user?.role_front?.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {detail.user.role_front.map((role: string, index: number) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="py-1.5 px-3 bg-indigo-50/90 border-indigo-200 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800"
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mt-3">
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

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 mt-6">
                <PermissionGuard module="User" action="PUT" showLoading={false}>
                  <Button
                    variant="outline"
                    className="w-full border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 dark:border-indigo-800 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                    onClick={() => setOpen(true)}
                  >
                    <User className="mr-2 h-4 w-4" /> Chỉnh sửa thông tin
                  </Button>
                </PermissionGuard>
                <PermissionGuard module="User" action="PUT" showLoading={false}>
                  <Button
                    variant="outline"
                    className="w-full border-purple-200 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-800 dark:hover:bg-purple-900/30 dark:hover:text-purple-300"
                    onClick={() => setIsSpecialistModalOpen(true)}
                  >
                    <Target className="mr-2 h-4 w-4" /> Quản lý chuyên môn
                  </Button>
                </PermissionGuard>
                <PermissionGuard
                  module="Schedule"
                  action="GET"
                  showLoading={false}
                >
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 shadow-sm"
                    onClick={() => setIsScheduleModalOpen(true)}
                  >
                    <Calendar className="mr-2 h-4 w-4" /> Xem lịch dạy
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Section */}
        <Card className="md:col-span-2 border-0 shadow-md">
          <CardHeader className="bg-gradient-to-r from-muted/50 to-muted border-b">
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />{" "}
              Chi tiết Huấn luyện viên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5 bg-muted/50 p-5 rounded-lg">
                <h3 className="text-md font-semibold text-indigo-800 dark:text-indigo-300 mb-4 border-b pb-2">
                  Thông tin cá nhân
                </h3>
                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <User className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tên đăng nhập
                    </p>
                    <p className="font-medium mt-0.5">
                      {detail.user?.username || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <Mail className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Email
                    </p>
                    <p className="font-medium mt-0.5">
                      {detail.user?.email || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <Calendar className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ngày tạo
                    </p>
                    <p className="font-medium mt-0.5">
                      {detail.user?.created_at
                        ? new Date(detail.user.created_at).toLocaleString(
                            "vi-VN"
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <Phone className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Số điện thoại
                    </p>
                    <p className="font-medium mt-0.5">
                      {detail.user?.phone || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <CalendarDays className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ngày sinh
                    </p>
                    <p className="font-medium mt-0.5">
                      {detail.user?.birthday
                        ? new Date(detail.user.birthday).toLocaleDateString(
                            "vi-VN"
                          )
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <MapPin className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Địa chỉ
                    </p>
                    <p className="font-medium mt-0.5">
                      {detail.user?.address || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 bg-muted/50 p-5 rounded-lg">
                <h3 className="text-md font-semibold text-indigo-800 dark:text-indigo-300 mb-4 border-b pb-2">
                  Thông tin công việc
                </h3>
                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <GraduationCap className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Chuyên môn
                    </p>
                    <p className="font-medium mt-0.5">
                      {detail.user?.role_front?.join(", ") || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group transition-all hover:bg-background hover:shadow-sm p-2 rounded-md">
                  <Building className="h-5 w-5 mt-0.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Chi nhánh
                    </p>
                    <p className="font-medium mt-0.5">
                      {isFetchingTenant ? (
                        <span className="inline-flex items-center">
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Đang tải...
                        </span>
                      ) : (
                        tenantName || "Chi nhánh không xác định"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Specialist Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 flex items-center mb-4 border-b pb-2">
                <Target className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                Thông tin chuyên môn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 bg-muted/50 p-5 rounded-lg">
                  <h4 className="text-md font-semibold text-indigo-800 dark:text-indigo-300 mb-3 border-b pb-2">
                    Danh mục khóa học
                  </h4>
                  {specialistInfo?.category &&
                  specialistInfo.category.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {specialistInfo.category.map(
                        (cat: any, index: number) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800"
                          >
                            {typeof cat === "string" ? cat : cat.title || cat}
                          </Badge>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Chưa cập nhật
                    </p>
                  )}
                </div>

                <div className="space-y-4 bg-muted/50 p-5 rounded-lg">
                  <h4 className="text-md font-semibold text-indigo-800 dark:text-indigo-300 mb-3 border-b pb-2">
                    Độ tuổi
                  </h4>
                  {specialistInfo?.age_types &&
                  specialistInfo.age_types.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {specialistInfo.age_types.map(
                        (age: any, index: number) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/30"
                          >
                            {typeof age === "string" ? age : age.title || age}
                          </Badge>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Chưa cập nhật
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300 flex items-center mb-4 border-b pb-2">
                <Award className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" />{" "}
                Lớp học đang giảng dạy
              </h3>
              {detail.classesAsInstructor &&
              detail.classesAsInstructor.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {detail.classesAsInstructor.map((classItem: any) => (
                    <Card
                      key={classItem._id}
                      className="border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-2">
                              <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-indigo-900 dark:text-indigo-200">
                                {classItem.title || classItem.name || "Lớp học"}
                              </h4>
                              <p className="text-sm text-indigo-700 dark:text-indigo-400">
                                ID:{" "}
                                {classItem._id?.slice(-8) ||
                                  classItem.id?.slice(-8) ||
                                  "N/A"}
                              </p>
                            </div>
                          </div>
                          {/* <Badge
                            variant='outline'
                            className='bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300'
                          >
                            <GraduationCap className='h-3 w-3 mr-1' />
                            Huấn luyện viên
                          </Badge> */}
                        </div>

                        <div className="space-y-2 text-sm">
                          {classItem.description && (
                            <p className="text-indigo-700/80 dark:text-indigo-300/80 mb-3">
                              {classItem.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                            <span className="text-muted-foreground">
                              Học viên:
                            </span>
                            <span className="font-medium">
                              {classItem.member?.length || 0} người
                            </span>
                          </div>

                          {classItem.max_members && (
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                              <span className="text-muted-foreground">
                                Sĩ số tối đa:
                              </span>
                              <span className="font-medium">
                                {classItem.max_members} người
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                            <span className="text-muted-foreground">
                              Ngày tạo:
                            </span>
                            <span className="font-medium">
                              {classItem.created_at
                                ? new Date(
                                    classItem.created_at
                                  ).toLocaleDateString("vi-VN")
                                : "-"}
                            </span>
                          </div>

                          {classItem.course && (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                              <span className="text-muted-foreground">
                                Khóa học:
                              </span>
                              <span className="font-medium">
                                {typeof classItem.course === "object" &&
                                classItem.course.title
                                  ? classItem.course.title
                                  : classItem.course?.slice(-8) || "N/A"}
                              </span>
                            </div>
                          )}

                          {classItem.level && (
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                              <span className="text-muted-foreground">
                                Trình độ:
                              </span>
                              <span className="font-medium">
                                {classItem.level}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-indigo-200 dark:border-indigo-800">
                          <Link
                            href={`/dashboard/manager/class/${
                              classItem._id || classItem.id
                            }`}
                            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors w-full justify-center"
                          >
                            <Eye className="mr-2 h-3 w-3" />
                            Xem chi tiết lớp học
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-100 rounded-md p-6 text-center dark:bg-indigo-950/30 dark:border-indigo-800">
                  <div className="bg-background rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-sm">
                    <Users className="h-8 w-8 text-indigo-400" />
                  </div>
                  <p className="text-indigo-900 dark:text-indigo-200 font-medium mb-1">
                    Chưa có lớp học nào được phân công
                  </p>
                  <p className="text-indigo-700/70 dark:text-indigo-300/70 text-sm mb-4">
                    Huấn luyện viên chưa được phân công giảng dạy lớp học nào
                  </p>
                  {/* <Button
                    size="sm"
                    variant="outline"
                    className="bg-background hover:bg-indigo-50 dark:hover:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300"
                  >
                    <span className="mr-1">+</span> Phân công lớp học mới
                  </Button> */}
                </div>
              )}
            </div>

            <Separator className="my-6" />
          </CardContent>
        </Card>
      </div>

      {/* Edit Instructor Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Chỉnh sửa thông tin Huấn luyện viên
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cá nhân và công việc của Huấn luyện viên
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đăng nhập</FormLabel>
                      <FormControl>
                        <Input placeholder="Tên đăng nhập" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input placeholder="Số điện thoại" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày sinh</FormLabel>
                      <FormControl>
                        <Input type="date" placeholder="Ngày sinh" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Địa chỉ</FormLabel>
                      <FormControl>
                        <Input placeholder="Địa chỉ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />{" "}
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">
                          Trạng thái hoạt động
                        </FormLabel>
                        <FormDescription>
                          {field.value
                            ? "Huấn luyện viên đang ở trạng thái hoạt động và có thể được phân công lớp học"
                            : "Huấn luyện viên đang ở trạng thái ngừng hoạt động và không thể được phân công lớp học mới"}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Toggle instructor active status"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {/* Avatar Upload Field */}
                <FormField
                  control={form.control}
                  name="avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ảnh đại diện</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16 border-4 border-background shadow-md">
                            <AvatarImage
                              src={avatarUrl}
                              alt={detail.user?.username || "Instructor"}
                              className="object-cover"
                            />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                              {detail.user?.username?.charAt(0) || "G"}
                            </AvatarFallback>
                          </Avatar>
                          <label className="flex-1">
                            <Button
                              variant="outline"
                              className="w-full"
                              type="button"
                              asChild
                            >
                              <span className="flex items-center justify-center">
                                <Upload className="mr-2 h-4 w-4" /> Tải ảnh lên
                              </span>
                            </Button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleAvatarUpload(e)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => setOpen(false)}
                >
                  Huỷ
                </Button>
                <Button type="submit">Lưu thay đổi</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Schedule Modal */}
      <ScheduleModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
        userId={detail?.user?._id || instructorId}
        userName={detail?.user?.username || ""}
        userType="instructor"
      />

      {/* Specialist Modal */}
      <InstructorSpecialistModal
        open={isSpecialistModalOpen}
        onOpenChange={setIsSpecialistModalOpen}
        instructorData={
          detail?.user
            ? {
                id: detail.user._id,
                name: detail.user.username,
                email: detail.user.email,
              }
            : null
        }
        onSuccess={async () => {
          // Refresh specialist information
          try {
            const tenantId = getSelectedTenant();
            const token = getAuthToken();
            if (tenantId && token && detail?.user?._id) {
              const specialistData = await fetchInstructorSpecialist({
                searchParams: { "user._id:equal": detail.user._id },
                tenantId,
                token,
              });
              if (specialistData && specialistData.length > 0) {
                setSpecialistInfo(specialistData[0]);
              } else {
                setSpecialistInfo(null);
              }
            }
          } catch (specialistError) {
            console.error("Error refreshing specialist info:", specialistError);
          }
        }}
      />
    </div>
  );
}
