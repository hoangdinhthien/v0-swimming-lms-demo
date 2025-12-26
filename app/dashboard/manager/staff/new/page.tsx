"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  User,
  Key,
  Shield,
  Loader2,
  Save,
  Upload,
  Phone,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createStaff } from "@/api/manager/staff-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { uploadMedia, getMediaDetails } from "@/api/media-api";
import { parseApiFieldErrors } from "@/utils/api-response-parser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  phoneSchema,
  passwordSchema,
  requiredStringSchema,
  getBirthDateSchema,
} from "@/lib/schemas";
import { getTenantInfo } from "@/api/tenant-api";
import { useWithReview } from "@/hooks/use-with-review";

const staffFormSchema = z
  .object({
    username: requiredStringSchema("Tên đăng nhập là bắt buộc"),
    email: z.string().email("Email không hợp lệ"),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: phoneSchema,
    address: z.string().optional(),
    birthday: getBirthDateSchema(18, "Nhân viên"),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function NewStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState("");
  const [isFetchingTenant, setIsFetchingTenant] = useState(false);

  import { useWithReview } from "@/hooks/use-with-review";

  // ... imports

  // Initialize form
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      address: "",
      birthday: "",
      is_active: true,
    },
  });

  const { handleResponse } = useWithReview({
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã tạo nhân viên mới thành công",
        className: "bg-green-50 border-green-200 text-green-800",
      });

      router.push("/dashboard/manager/staff");
      router.refresh();
    },
  });

  // Fetch tenant name
  useEffect(() => {
    const fetchTenant = async () => {
      const tenantId = getSelectedTenant();
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

    fetchTenant();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File quá lớn",
          description: "Vui lòng chọn ảnh có kích thước dưới 5MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Định dạng không hợp lệ",
          description: "Vui lòng chọn file ảnh",
          variant: "destructive",
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatarPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: StaffFormValues) => {
    setLoading(true);
    try {
      const tenantId = getSelectedTenant();
      if (!tenantId) throw new Error("Tenant ID not found");

      const token = getAuthToken();
      if (!token) throw new Error("Auth token not found");

      // Handle avatar upload first if exists
      let featured_image = undefined;
      if (avatarFile) {
        try {
          const uploadResponse = await uploadMedia({
            file: avatarFile,
            tenantId,
            token,
            title: `Avatar for ${values.username}`,
            alt: `avatar-${values.username}`,
          });
          if (uploadResponse?.data?._id) {
            featured_image = [uploadResponse.data._id];
          }
        } catch (uploadError) {
          console.error("Failed to upload avatar:", uploadError);
          toast({
            title: "Cảnh báo",
            description:
              "Không thể tải ảnh đại diện lên, nhưng vẫn sẽ tạo nhân viên.",
            variant: "default",
            className: "bg-yellow-50 border-yellow-200 text-yellow-800",
          });
        }
      }

      // Prepare payload
      const payload: any = {
        username: values.username,
        email: values.email,
        password: values.password,
        is_active: values.is_active,
        phone: values.phone,
        address: values.address,
        birthday: values.birthday,
      };

      if (featured_image) {
        payload.featured_image = featured_image;
      }

      // Remove empty optional string fields
      Object.keys(payload).forEach((key) => {
        if (
          payload[key] === "" ||
          payload[key] === null ||
          payload[key] === undefined
        ) {
          delete payload[key];
        }
      });

      const response = await createStaff({
        tenantId,
        token,
        staffData: payload,
      });

      handleResponse(response);
    } catch (error: any) {
      console.error("Error creating staff:", error);
      const { fieldErrors, generalError } = parseApiFieldErrors(error);

      // Set field errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        if (["username", "email", "password", "phone"].includes(field)) {
          form.setError(field as any, { type: "server", message });
        }
      });

      toast({
        title: "Lỗi",
        description: generalError || "Có lỗi xảy ra khi tạo nhân viên",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-6 animate-in fade-in duration-500">
      <div className="mb-6">
        <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
          <Link
            href="/dashboard/manager/staff"
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại danh sách nhân viên
          </Link>
        </Button>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Thêm nhân viên mới
            </h1>
            <p className="text-muted-foreground mt-1">
              Tạo tài khoản nhân viên mới cho{" "}
              {isFetchingTenant ? "..." : tenantName}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin cơ bản
                </CardTitle>
                <CardDescription>
                  Thông tin đăng nhập và nhận dạng của nhân viên
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tên nhân viên <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Nhập tên hiển thị" {...field} />
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
                        <FormLabel>
                          Email <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="example@domain.com"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Mật khẩu <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Nhập mật khẩu"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Xác nhận mật khẩu{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="password"
                              placeholder="Nhập lại mật khẩu"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="avatar">Ảnh đại diện</Label>
                    <div className="flex items-center gap-6">
                      <div className="h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted relative group">
                        {avatarPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarPreview}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                        <label
                          htmlFor="avatar-upload"
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <span className="text-white text-xs font-medium">
                            Thay đổi
                          </span>
                        </label>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("avatar-upload")?.click()
                          }
                        >
                          Chọn ảnh
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Hỗ trợ: JPG, PNG, GIF. Tối đa 5MB.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin cá nhân & Vai trò
                </CardTitle>
                <CardDescription>
                  Thông tin liên hệ và phân quyền hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Số điện thoại <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="0912345678"
                              className="pl-9"
                              {...field}
                            />
                          </div>
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
                        <FormLabel>
                          Ngày sinh <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Địa chỉ</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Nhập địa chỉ liên hệ"
                              className="pl-9"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Trạng thái hoạt động
                          </FormLabel>
                          <FormDescription>
                            Cho phép nhân viên đăng nhập vào hệ thống
                          </FormDescription>
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
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/manager/staff")}
                disabled={loading}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="min-w-[120px]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Tạo nhân viên
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
