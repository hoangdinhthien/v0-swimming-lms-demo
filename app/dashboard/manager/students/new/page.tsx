"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Search, UserPlus } from "lucide-react";
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
  fetchStudents,
  sendAccountCreatedEmail,
} from "@/api/manager/students-api";
import { fetchContacts, type Contact } from "@/api/manager/contact-api";
import { parseApiFieldErrors } from "@/utils/api-response-parser";
import { reverseGeocode } from "@/utils/geocoding";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  optionalPhoneSchema,
  passwordSchema,
  requiredStringSchema,
  birthDateSchema,
} from "@/lib/schemas";
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
import PermissionGuard from "@/components/permission-guard";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Form schema for validation
const studentFormSchema = z
  .object({
    username: requiredStringSchema("Vui lòng nhập họ tên học viên"),
    email: z.string().email("Vui lòng nhập email hợp lệ"),
    phone: optionalPhoneSchema.optional(),
    birthday: birthDateSchema.optional(),
    address: z.string().optional(),
    parent_id: z.string().optional(),
    password: passwordSchema,
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

function NewStudentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contactId");
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parents, setParents] = useState<any[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [open, setOpen] = useState(false);

  // Contact state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());

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
    fetchContactsData();
    checkExistingEmails();
  }, []);

  const checkExistingEmails = async () => {
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (tenantId && token) {
        const students = await fetchStudents({ tenantId, token });
        const emails = new Set<string>(
          students
            .map((s: any) => s.user?.email || s.email)
            .filter(
              (e: any): e is string => typeof e === "string" && e.length > 0
            )
        );
        setExistingEmails(emails);
      }
    } catch (error) {
      console.error("Failed to fetch existing emails", error);
    }
  };

  // Handle auto-select contact from URL
  useEffect(() => {
    if (contactId && contacts.length > 0) {
      const contact = contacts.find((c) => c._id === contactId);
      if (contact) {
        handleSelectContact(contact);
      }
    }
  }, [contactId, contacts]);

  const fetchContactsData = async () => {
    setIsLoadingContacts(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (tenantId && token) {
        const data = await fetchContacts(tenantId, token);
        setContacts(data);
      }
    } catch (error) {
      console.error("Failed to fetch contacts", error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleSelectContact = async (contact: Contact) => {
    form.setValue("username", contact.name);
    form.setValue("email", contact.email);
    form.setValue("phone", contact.phone);
    if (contact.birthday) {
      // Handle "DD-MM-YYYY" format from API
      let formattedBirthday = contact.birthday;
      if (contact.birthday.includes("-")) {
        const parts = contact.birthday.split("-");
        // If it looks like DD-MM-YYYY (parts[0] is day, parts[2] is year)
        if (parts.length === 3) {
          if (parts[0].length === 2 && parts[2].length === 4) {
            // Convert DD-MM-YYYY to YYYY-MM-DD
            formattedBirthday = `${parts[2]}-${parts[1]}-${parts[0]}`;
          } else if (parts[0].length === 4 && parts[2].length === 2) {
            // Already YYYY-MM-DD or YYYY-MM-DD? standard is YYYY-MM-DD
            // Just keep it if it fits YYYY-MM-DD
          }
        }
      }
      form.setValue("birthday", formattedBirthday);
    }

    toast({
      title: "Đã điền thông tin",
      description: `Đã điền thông tin từ liên hệ: ${contact.name}`,
    });

    // Geocoding if address is empty and location exists
    if (contact.location && !form.getValues("address")) {
      try {
        // location is [lng, lat]
        const address = await reverseGeocode(
          contact.location[1],
          contact.location[0]
        );
        if (address) {
          form.setValue("address", address);
          toast({
            title: "Đã tìm thấy địa chỉ",
            description: "Đã tự động điền địa chỉ từ vị trí",
          });
        }
      } catch (error) {
        console.error("Geocoding failed", error);
      }
    }
  };

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

      // Call the API to create student
      const result = await createStudent({
        data: studentData,
        tenantId,
        token,
      });

      // Send account created email (fire and forget)
      // Call the test endpoint to send welcome email
      sendAccountCreatedEmail({
        email: studentData.email,
        password: studentData.password,
        tenantId,
        token,
      });

      // Show success message
      toast({
        title: "Thành công",
        description: "Đã thêm học viên và gửi email thông báo",
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
      // Parse field-specific errors from API response
      const { fieldErrors, generalError } = parseApiFieldErrors(error);

      // Set field-specific errors
      Object.entries(fieldErrors).forEach(([field, message]) => {
        try {
          form.setError(field as keyof StudentFormValues, {
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
      redirectTo="/dashboard/manager/students"
    >
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link
            href="/dashboard/manager/students"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Quay về danh sách học viên
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Thêm học viên mới</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Contact Selection */}
            <div className="mb-8 p-4 border rounded-lg bg-muted/40">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Điền từ Liên hệ</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Chọn liên hệ để tự động điền thông tin học viên
              </p>
              <Select
                onValueChange={(value) => {
                  const contact = contacts.find((c) => c._id === value);
                  if (contact) handleSelectContact(contact);
                }}
                defaultValue={contactId || undefined}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Chọn liên hệ..." />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingContacts ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Đang tải danh sách...
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Không có liên hệ nào
                    </div>
                  ) : (
                    contacts.map((contact) => (
                      <SelectItem
                        key={contact._id}
                        value={contact._id}
                        disabled={existingEmails.has(contact.email)}
                      >
                        {contact.name} - {contact.email || contact.phone}{" "}
                        {existingEmails.has(contact.email) &&
                          "(Đã có tài khoản)"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-medium">Thông tin học viên</h3>
                  <Separator className="my-4" />
                </div>

                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập họ tên học viên" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ngày sinh</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
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
                </div>

                <div>
                  <h3 className="text-lg font-medium">Thông tin phụ huynh</h3>
                  <FormDescription>
                    Bắt buộc đối với học viên là trẻ em dưới 18 tuổi
                  </FormDescription>
                  <Separator className="my-4" />
                </div>

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Chọn phụ huynh</FormLabel>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="w-full justify-between"
                            >
                              {field.value
                                ? parents.find(
                                    (parent) => parent.id === field.value
                                  )?.username
                                : "Chọn phụ huynh..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Tìm kiếm phụ huynh..." />
                            <CommandEmpty>
                              Không tìm thấy phụ huynh
                            </CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-auto">
                              {isLoadingParents ? (
                                <div className="flex items-center justify-center p-4">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  <span className="ml-2">Đang tải...</span>
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
                                    className="flex items-center gap-3 p-3"
                                  >
                                    <CheckIcon
                                      className={cn(
                                        "h-4 w-4 flex-shrink-0",
                                        field.value === parent.id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                    <Avatar className="h-8 w-8 flex-shrink-0">
                                      <AvatarImage
                                        src={parent.avatar}
                                        alt={parent.username}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                                        {parent.username
                                          .charAt(0)
                                          .toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="font-medium truncate">
                                        {parent.username}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {parent.email}{" "}
                                        {parent.phone
                                          ? `• ${parent.phone}`
                                          : ""}
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
                        Chọn một thành viên hiện có làm phụ huynh cho học viên
                        này
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-lg font-medium">Thông tin tài khoản</h3>
                  <Separator className="my-4" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </PermissionGuard>
  );
}

export default function NewStudentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <NewStudentForm />
    </Suspense>
  );
}
