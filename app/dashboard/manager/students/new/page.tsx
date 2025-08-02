"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  createStudent,
  type CreateStudentData,
  fetchUsersWithoutParent,
} from "@/api/students-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Form schema for validation
const studentFormSchema = z
  .object({
    username: z.string().min(1, "Vui lòng nhập họ tên học viên"),
    email: z.string().email("Vui lòng nhập email hợp lệ"),
    phone: z.string().optional(),
    birthday: z.string().optional(), // Changed from date_of_birth to birthday
    address: z.string().optional(),
    parent_id: z.string().optional(),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type StudentFormValues = z.infer<typeof studentFormSchema>;

// Default values for the form
const defaultValues: Partial<StudentFormValues> = {
  username: "",
  email: "",
  phone: "",
  birthday: "", // Changed from date_of_birth to birthday
  address: "",
  parent_id: "",
  password: "",
  confirmPassword: "",
};

export default function NewStudentPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parents, setParents] = useState<any[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    // Check for prefilled guest data from sessionStorage
    const guestDataStr = sessionStorage.getItem("guestData");
    if (guestDataStr) {
      try {
        const guestData = JSON.parse(guestDataStr);

        // Prefill the form with guest data
        if (guestData.username) {
          form.setValue("username", guestData.username);
        }
        if (guestData.email) {
          form.setValue("email", guestData.email);
        }
        if (guestData.phone) {
          form.setValue("phone", guestData.phone);
        }

        // Clear the data from sessionStorage after using it
        sessionStorage.removeItem("guestData");
      } catch (error) {
        console.error("Error parsing guest data:", error);
      }
    }

    // Fetch existing parents when the component mounts
    fetchExistingParents();
  }, []);

  const fetchExistingParents = async () => {
    setIsLoadingParents(true);
    try {
      // Get tenant ID and auth token
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Chưa chọn tenant hoặc chưa đăng nhập");
      }

      // Fetch all members as potential parents
      const result = await fetchUsersWithoutParent({
        tenantId,
        token,
      });

      // Transform the data to make it easier to use in the component
      // Updated to handle the new response structure: data[0][0].data
      const processedParents = result.map((item: any) => {
        let avatarUrl = "/placeholder.svg";

        // Handle featured_image structure - Both formats are valid:
        // - Array format: featured_image: [{ path: ["url"] }]
        // - Object format: featured_image: { path: "url" }
        if (item.user?.featured_image) {
          if (
            Array.isArray(item.user.featured_image) &&
            item.user.featured_image.length > 0
          ) {
            // Array format: [{ path: ["url"] }]
            const firstImage = item.user.featured_image[0];
            if (firstImage?.path) {
              if (
                Array.isArray(firstImage.path) &&
                firstImage.path.length > 0
              ) {
                avatarUrl = firstImage.path[0];
              } else if (typeof firstImage.path === "string") {
                avatarUrl = firstImage.path;
              }
            }
          } else if (
            typeof item.user.featured_image === "object" &&
            item.user.featured_image.path
          ) {
            // Object format: { path: "url" } or { path: ["url"] }
            if (Array.isArray(item.user.featured_image.path)) {
              avatarUrl = item.user.featured_image.path[0];
            } else if (typeof item.user.featured_image.path === "string") {
              avatarUrl = item.user.featured_image.path;
            }
          }
        }

        return {
          id: item.user?._id,
          username: item.user?.username || "Không có tên",
          email: item.user?.email || "Không có email",
          phone: item.user?.phone || "Không có số điện thoại",
          avatar: avatarUrl, // Add avatar for potential future use
        };
      });

      setParents(processedParents);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description:
          error.message || "Đã xảy ra lỗi khi tải danh sách phụ huynh",
        variant: "destructive",
      });
    } finally {
      setIsLoadingParents(false);
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true);
    try {
      // Get tenant ID and auth token
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId) {
        throw new Error("Chưa chọn tenant");
      }

      if (!token) {
        throw new Error("Chưa đăng nhập");
      }

      // Prepare student data - clean up empty values
      const studentData: CreateStudentData = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: ["member"], // Use "member" role for students
        is_active: true, // Set is_active to true by default
      };

      // Only add optional fields if they have values
      if (data.phone) studentData.phone = data.phone;
      if (data.birthday) studentData.birthday = data.birthday;
      if (data.address) studentData.address = data.address;
      if (data.parent_id) studentData.parent_id = data.parent_id;

      console.log("Sending student data:", studentData);

      // Call the API to create student
      const result = await createStudent({
        data: studentData,
        tenantId,
        token,
      });

      console.log("Student creation result:", result);

      // Show success message
      toast({
        title: "Thành công",
        description: "Đã thêm học viên mới",
      });

      // Check if there's a return URL from guest order flow
      const guestDataStr = sessionStorage.getItem("guestData");
      let returnUrl = null;

      if (guestDataStr) {
        try {
          const guestData = JSON.parse(guestDataStr);
          returnUrl = guestData.returnUrl;

          // Store the newly created user ID for the transaction page to use
          const newUserData = {
            userId: result.data?._id || result._id, // API might return data in different structures
            showClassModal: true, // Flag to show class modal immediately
          };
          sessionStorage.setItem("newUserData", JSON.stringify(newUserData));

          sessionStorage.removeItem("guestData");
        } catch (error) {
          console.error("Error parsing guest data:", error);
        }
      }

      // Redirect appropriately
      if (returnUrl) {
        // Coming from transaction detail page - go back there
        router.push(returnUrl);
      } else {
        // Normal flow - go to students list
        router.push("/dashboard/manager/students");
      }

      router.refresh(); // Refresh the page to show the new student
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi thêm học viên",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager/students'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' /> Quay về danh sách học viên
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>Thêm học viên mới</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <div>
                <h3 className='text-lg font-medium'>Thông tin học viên</h3>
                <Separator className='my-4' />
              </div>

              <FormField
                control={form.control}
                name='username'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Nhập họ tên học viên'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập email'
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
                          placeholder='Nhập số điện thoại'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
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

                <FormField
                  control={form.control}
                  name='address'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Địa chỉ</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập địa chỉ'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <h3 className='text-lg font-medium'>Thông tin phụ huynh</h3>
                <FormDescription>
                  Bắt buộc đối với học viên là trẻ em dưới 18 tuổi
                </FormDescription>
                <Separator className='my-4' />
              </div>

              <FormField
                control={form.control}
                name='parent_id'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Chọn phụ huynh</FormLabel>
                    <Popover
                      open={open}
                      onOpenChange={setOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            aria-expanded={open}
                            className='w-full justify-between'
                          >
                            {field.value
                              ? parents.find(
                                  (parent) => parent.id === field.value
                                )?.username
                              : "Chọn phụ huynh..."}
                            <Search className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0'>
                        <Command>
                          <CommandInput placeholder='Tìm kiếm phụ huynh...' />
                          <CommandEmpty>Không tìm thấy phụ huynh</CommandEmpty>
                          <CommandGroup className='max-h-60 overflow-auto'>
                            {isLoadingParents ? (
                              <div className='flex items-center justify-center p-4'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                <span className='ml-2'>Đang tải...</span>
                              </div>
                            ) : (
                              parents.map((parent) => (
                                <CommandItem
                                  key={parent.id}
                                  value={parent.username}
                                  onSelect={() => {
                                    form.setValue("parent_id", parent.id);
                                    setOpen(false);
                                  }}
                                  className='flex items-center gap-3 p-3'
                                >
                                  <CheckIcon
                                    className={cn(
                                      "h-4 w-4 flex-shrink-0",
                                      field.value === parent.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <Avatar className='h-8 w-8 flex-shrink-0'>
                                    <AvatarImage
                                      src={parent.avatar}
                                      alt={parent.username}
                                      className='object-cover'
                                    />
                                    <AvatarFallback className='bg-blue-100 text-blue-700 text-sm font-medium'>
                                      {parent.username.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className='flex flex-col flex-1 min-w-0'>
                                    <span className='font-medium truncate'>
                                      {parent.username}
                                    </span>
                                    <span className='text-xs text-muted-foreground truncate'>
                                      {parent.email}{" "}
                                      {parent.phone ? `• ${parent.phone}` : ""}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Chọn một thành viên hiện có làm phụ huynh cho học viên này
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <h3 className='text-lg font-medium'>Thông tin tài khoản</h3>
                <Separator className='my-4' />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='Nhập mật khẩu'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Mật khẩu phải có ít nhất 6 ký tự
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='confirmPassword'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          type='password'
                          placeholder='Nhập lại mật khẩu'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Đang tạo...
                    </>
                  ) : (
                    "Thêm học viên"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
