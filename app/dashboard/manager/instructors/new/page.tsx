"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  createInstructor,
  type CreateInstructorData,
} from "@/api/manager/instructors-api";
import { parseApiFieldErrors } from "@/utils/api-response-parser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  optionalPhoneSchema,
  passwordSchema,
  requiredStringSchema,
  getBirthDateSchema,
} from "@/lib/schemas";
import PermissionGuard from "@/components/permission-guard";
import { useWithReview } from "@/hooks/use-with-review";

// Form schema for validation
const instructorFormSchema = z
  .object({
    username: requiredStringSchema("Vui lòng nhập tên đăng nhập"),
    email: z.string().email("Vui lòng nhập email hợp lệ"),
    password: passwordSchema,
    confirmPassword: z.string(),
    // Optional fields
    phone: optionalPhoneSchema.optional(),
    birthday: getBirthDateSchema(18, "Huấn luyện viên").optional(),
    address: z.string().optional(),
    is_active: z.boolean().default(true),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type InstructorFormValues = z.infer<typeof instructorFormSchema>;

// Default values for the form
const defaultValues: Partial<InstructorFormValues> = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  birthday: "",
  address: "",
  is_active: true,
};

export default function NewInstructorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InstructorFormValues>({
    resolver: zodResolver(instructorFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { handleResponse } = useWithReview({
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã thêm Huấn luyện viên mới",
      });
      router.push("/dashboard/manager/instructors");
      router.refresh();
    },
  });

  const onSubmit = async (data: InstructorFormValues) => {
    setIsSubmitting(true);
    try {
      // Get tenant ID and auth token
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId) {
        throw new Error("No tenant selected");
      }

      if (!token) {
        throw new Error("Not authenticated");
      }

      // Prepare instructor data
      const instructorData: CreateInstructorData = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: ["instructor"],
        // Include optional fields
        phone: data.phone,
        birthday: data.birthday,
        address: data.address,
        is_active: data.is_active,
      };

      // Call the API to create instructor
      const result = await createInstructor({
        data: instructorData,
        tenantId,
        token,
      });

      handleResponse(result);
    } catch (error: any) {
      // Parse field-specific errors from API response
      const { fieldErrors, generalError } = parseApiFieldErrors(error);

      // Set field-specific errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        try {
          form.setError(field as keyof InstructorFormValues, {
            type: "server",
            message,
          });
        } catch (e) {
          // Ignore if field doesn't exist in form
        }
      });

      toast({
        title: "Lỗi",
        description: generalError,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGuard
      module="User"
      action="POST"
      redirectTo="/dashboard/manager/instructors"
    >
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/dashboard/manager/instructors"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Quay về danh sách Huấn luyện
            viên
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Thêm Huấn luyện viên mới</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên đăng nhập</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tên đăng nhập" {...field} />
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
                        <Input placeholder="Nhập email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Nhập mật khẩu"
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
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Nhập lại mật khẩu"
                          {...field}
                        />
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
                        <Input placeholder="Nhập số điện thoại" {...field} />
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
                        <Input
                          type="date"
                          placeholder="Chọn ngày sinh"
                          {...field}
                        />
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
                        <Input placeholder="Nhập địa chỉ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Trạng thái hoạt động</FormLabel>
                        <FormDescription>
                          Chọn để đặt Huấn luyện viên ở trạng thái hoạt động
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      "Thêm Huấn luyện viên"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
