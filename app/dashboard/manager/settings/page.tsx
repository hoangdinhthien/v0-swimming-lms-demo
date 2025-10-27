"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, User, Mail, Phone, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserProfile, UserProfileResponse } from "@/api/login-api";
import { getAuthenticatedUser, getAuthToken } from "@/api/auth-utils";
import { LoadingScreen } from "@/components/loading-screen";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<
    UserProfileResponse["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    username: "",
    role: "",
    status: "",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    browser: true,
    newStudent: true,
    courseUpdate: true,
    financialAlert: true,
  });

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Get the authentication token
        const token = getAuthToken();

        if (!token) {
          throw new Error("Không tìm thấy token xác thực");
        }

        const response = await getUserProfile(token);
        setUserProfile(response.data);

        // Update form with fetched data
        setProfileForm({
          name: response.data.username || "",
          email: response.data.email || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          username: response.data.username || "",
          role: response.data.role_front?.join(", ") || "",
          status: response.data.is_active ? "Hoạt động" : "Không hoạt động",
        });
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Có lỗi xảy ra khi tải thông tin người dùng"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Cập nhật thông tin cá nhân:", profileForm);
    // Here you would typically make an API call to update the profile
  };

  return (
    <>
      {loading && <LoadingScreen />}

      {error && (
        <div className='mb-6 p-4 bg-destructive/15 border border-destructive/20 rounded-lg'>
          <p className='text-destructive text-sm'>{error}</p>
        </div>
      )}

      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Về Trang Chủ
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Cài Đặt</h1>
          <p className='text-muted-foreground'>
            Quản lý tài khoản và cài đặt trung tâm bơi lội của bạn
          </p>
        </div>
      </div>

      <Tabs
        defaultValue='profile'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='profile'>
            <User className='mr-2 h-4 w-4' />
            Thông Tin Cá Nhân
          </TabsTrigger>
          <TabsTrigger value='notifications'>
            <Mail className='mr-2 h-4 w-4' />
            Thông Báo
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent
          value='profile'
          className='space-y-4 mt-6'
        >
          {!loading && (
            <>
              <Card>
                <form onSubmit={handleProfileSubmit}>
                  <CardHeader>
                    <CardTitle>Thông Tin Cá Nhân</CardTitle>
                    <CardDescription>
                      Cập nhật thông tin cá nhân và liên lạc của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    {/* Profile Image */}
                    {userProfile?.featured_image ? (
                      <div className='flex items-center space-x-4'>
                        <Avatar className='h-20 w-20'>
                          <AvatarImage
                            src={userProfile.featured_image.path}
                            alt={userProfile.featured_image.alt || "Profile"}
                          />
                          <AvatarFallback>
                            {profileForm.username?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className='text-lg font-medium'>
                            {profileForm.username}
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {profileForm.email}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='flex items-center space-x-4'>
                        <Avatar className='h-20 w-20'>
                          <AvatarFallback>
                            {profileForm.username?.charAt(0)?.toUpperCase() ||
                              "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className='text-lg font-medium'>
                            {profileForm.username}
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {profileForm.email}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className='space-y-2'>
                      <Label htmlFor='username'>Tên Đăng Nhập</Label>
                      <Input
                        id='username'
                        value={profileForm.username}
                        disabled
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='name'>Tên Hiển Thị</Label>
                      <Input
                        id='name'
                        value={profileForm.name}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='email'>Email</Label>
                      <Input
                        id='email'
                        type='email'
                        value={profileForm.email}
                        disabled
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='phone'>Số Điện Thoại</Label>
                      <Input
                        id='phone'
                        value={profileForm.phone}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='address'>Địa Chỉ</Label>
                      <Input
                        id='address'
                        value={profileForm.address}
                        onChange={(e) =>
                          setProfileForm({
                            ...profileForm,
                            address: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='role'>Vai Trò</Label>
                      <Input
                        id='role'
                        value={profileForm.role}
                        disabled
                      />
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='status'>Trạng Thái</Label>
                      <div className='flex items-center space-x-2'>
                        <Badge
                          variant={
                            userProfile?.is_active ? "default" : "secondary"
                          }
                        >
                          {profileForm.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className='flex justify-between'>
                    <Button
                      type='button'
                      variant='outline'
                    >
                      Hủy
                    </Button>
                    <Button type='submit'>
                      <Save className='mr-2 h-4 w-4' />
                      Lưu Thay Đổi
                    </Button>
                  </CardFooter>
                </form>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mật Khẩu</CardTitle>
                  <CardDescription>
                    Cập nhật mật khẩu tài khoản của bạn
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='current-password'>Mật Khẩu Hiện Tại</Label>
                    <Input
                      id='current-password'
                      type='password'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='new-password'>Mật Khẩu Mới</Label>
                    <Input
                      id='new-password'
                      type='password'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='confirm-password'>
                      Xác Nhận Mật Khẩu Mới
                    </Label>
                    <Input
                      id='confirm-password'
                      type='password'
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>
                    <Key className='mr-2 h-4 w-4' />
                    Thay Đổi Mật Khẩu
                  </Button>
                </CardFooter>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent
          value='notifications'
          className='space-y-4 mt-6'
        >
          <Card>
            <CardHeader>
              <CardTitle>Tùy Chọn Thông Báo</CardTitle>
              <CardDescription>
                Chọn cách thức bạn muốn nhận thông báo
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium mb-3'>Kênh Thông Báo</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='email-notifications'
                        className='text-base'
                      >
                        Thông Báo Email
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Nhận thông báo qua email
                      </p>
                    </div>
                    <Switch
                      id='email-notifications'
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='sms-notifications'
                        className='text-base'
                      >
                        Thông Báo SMS
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Nhận thông báo qua tin nhắn
                      </p>
                    </div>
                    <Switch
                      id='sms-notifications'
                      checked={notifications.sms}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, sms: checked })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='browser-notifications'
                        className='text-base'
                      >
                        Thông Báo Trình Duyệt
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Hiển thị thông báo trên trình duyệt
                      </p>
                    </div>
                    <Switch
                      id='browser-notifications'
                      checked={notifications.browser}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, browser: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-lg font-medium mb-3'>Loại Thông Báo</h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='new-student'
                        className='text-base'
                      >
                        Đăng Ký Học Viên Mới
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Khi có học viên mới đăng ký khóa học
                      </p>
                    </div>
                    <Switch
                      id='new-student'
                      checked={notifications.newStudent}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          newStudent: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='course-update'
                        className='text-base'
                      >
                        Cập Nhật Khóa Học
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Khi khóa học được tạo, chỉnh sửa hoặc hủy bỏ
                      </p>
                    </div>
                    <Switch
                      id='course-update'
                      checked={notifications.courseUpdate}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          courseUpdate: checked,
                        })
                      }
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <div>
                      <Label
                        htmlFor='financial-alert'
                        className='text-base'
                      >
                        Cảnh Báo Tài Chính
                      </Label>
                      <p className='text-sm text-muted-foreground'>
                        Tóm tắt doanh thu hàng ngày và cảnh báo thanh toán
                      </p>
                    </div>
                    <Switch
                      id='financial-alert'
                      checked={notifications.financialAlert}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          financialAlert: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button>Lưu Cài Đặt Thông Báo</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
