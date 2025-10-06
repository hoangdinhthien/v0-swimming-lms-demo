"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  User,
  Key,
  Building,
  Save,
  UserPlus,
  Upload,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import config from "@/api/config.json";

// Staff creation function using the actual API
async function createStaffMember(staffData: any) {
  const tenantId = getSelectedTenant();
  const token = getAuthToken();

  if (!tenantId) throw new Error("No tenant selected");
  if (!token) throw new Error("Not authenticated");

  console.log("Creating staff:", staffData);

  // Prepare the request body to match the API expected format
  const requestBody = {
    username: staffData.username,
    email: staffData.email,
    password: staffData.password,
    phone: staffData.phone,
    address: staffData.address,
    is_active: staffData.isActive,
    role_front: ["staff"], // Default role for staff
    ...(staffData.birthday && { birthday: staffData.birthday }),
    ...(staffData.featured_image && {
      featured_image: staffData.featured_image,
    }),
  };

  const response = await fetch(
    `${config.API}/v1/workflow-process/manager/user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-tenant-id": tenantId,
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage =
        errorData.message ||
        `Error (${response.status}): ${response.statusText}`;
    } catch (e) {
      errorMessage = `Error (${response.status}): ${
        errorText || response.statusText
      }`;
    }
    console.error("API error response:", errorText);
    throw new Error(errorMessage);
  }

  return await response.json();
}

export default function NewStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    birthday: "",
    address: "",
    isActive: true,
  });

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Tên nhân viên là bắt buộc";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    if (
      formData.phone &&
      !/^\d{10,11}$/.test(formData.phone.replace(/\D/g, ""))
    ) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const staffData = {
        ...formData,
        featured_image: avatarPreview,
      };

      const result = await createStaffMember(staffData);

      if (result) {
        toast({
          title: "Thành công",
          description: "Nhân viên đã được tạo thành công!",
        });
        router.push("/dashboard/manager/staff");
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Có lỗi xảy ra khi tạo nhân viên",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager/staff'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về Danh sách nhân viên
        </Link>
      </div>

      <div className='mb-8'>
        <h1 className='text-3xl font-bold flex items-center gap-3'>
          <UserPlus className='h-8 w-8 text-primary' />
          Thêm Nhân viên mới
        </h1>
        <p className='text-muted-foreground mt-2'>
          Điền thông tin để thêm nhân viên mới vào hệ thống
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className='space-y-8'
      >
        {/* Avatar Section */}
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5 text-primary' />
              Ảnh đại diện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-6'>
              <Avatar className='h-24 w-24 border-4 border-primary/10'>
                <AvatarImage
                  src={avatarPreview || "/placeholder-user.jpg"}
                  alt='Preview'
                />
                <AvatarFallback className='bg-primary/10 text-primary text-lg'>
                  {formData.username ? getInitials(formData.username) : "NV"}
                </AvatarFallback>
              </Avatar>
              <div className='space-y-3'>
                <Label
                  htmlFor='avatar-upload'
                  className='cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors'
                >
                  <Upload className='h-4 w-4' />
                  Tải ảnh lên
                </Label>
                <input
                  id='avatar-upload'
                  type='file'
                  accept='image/*'
                  onChange={handleImageUpload}
                  className='hidden'
                />
                <p className='text-xs text-muted-foreground'>
                  JPG, PNG hoặc GIF. Tối đa 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5 text-primary' />
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='username'>
                  Tên nhân viên <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='username'
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder='Nhập tên đầy đủ'
                  className={errors.username ? "border-red-500" : ""}
                />
                {errors.username && (
                  <p className='text-red-500 text-sm'>{errors.username}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>
                  Email <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder='example@domain.com'
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className='text-red-500 text-sm'>{errors.email}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>Số điện thoại</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder='0123456789'
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className='text-red-500 text-sm'>{errors.phone}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='birthday'>Ngày sinh</Label>
                <Input
                  id='birthday'
                  type='date'
                  value={formData.birthday}
                  onChange={(e) =>
                    handleInputChange("birthday", e.target.value)
                  }
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='address'>Địa chỉ</Label>
              <Textarea
                id='address'
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder='Nhập địa chỉ thường trú'
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Key className='h-5 w-5 text-primary' />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='space-y-2'>
                <Label htmlFor='password'>
                  Mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='password'
                  type='password'
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder='Ít nhất 6 ký tự'
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className='text-red-500 text-sm'>{errors.password}</p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>
                  Xác nhận mật khẩu <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder='Nhập lại mật khẩu'
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className='text-red-500 text-sm'>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div className='flex items-center space-x-2'>
              <Checkbox
                id='isActive'
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor='isActive'>Kích hoạt tài khoản ngay</Label>
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className='flex items-center justify-end gap-4 pt-6'>
          <Link href='/dashboard/manager/staff'>
            <Button
              variant='outline'
              disabled={loading}
            >
              Hủy bỏ
            </Button>
          </Link>
          <Button
            type='submit'
            disabled={loading}
            className='min-w-[120px]'
          >
            {loading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang tạo...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Tạo nhân viên
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
