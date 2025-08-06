"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown, Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  createStudent,
  fetchUsersWithoutParent,
  CreateStudentData,
} from "@/api/students-api";

// Form schema for validation
const studentFormSchema = z
  .object({
    username: z.string().min(1, "Vui lòng nhập họ tên học viên"),
    email: z.string().email("Vui lòng nhập email hợp lệ"),
    phone: z.string().optional(),
    birthday: z.string().optional(),
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

interface CreateStudentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (studentId: string) => void;
  guestData?: {
    username?: string;
    email?: string;
    phone?: string;
  };
}

export default function CreateStudentModal({
  open,
  onOpenChange,
  onSuccess,
  guestData,
}: CreateStudentModalProps) {
  const { toast } = useToast();
  const { token, tenantId } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parents, setParents] = useState<any[]>([]);
  const [isLoadingParents, setIsLoadingParents] = useState(false);
  const [parentPopoverOpen, setParentPopoverOpen] = useState(false);

  // Default values for the form
  const defaultValues: Partial<StudentFormValues> = {
    username: guestData?.username || "",
    email: guestData?.email || "",
    phone: guestData?.phone || "",
    birthday: "",
    address: "",
    parent_id: "",
    password: "",
    confirmPassword: "",
  };

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues,
    mode: "onChange",
  });

  // Reset form when modal opens with new guest data
  useEffect(() => {
    if (open && guestData) {
      form.reset({
        username: guestData.username || "",
        email: guestData.email || "",
        phone: guestData.phone || "",
        birthday: "",
        address: "",
        parent_id: "",
        password: "",
        confirmPassword: "",
      });
    }
  }, [open, guestData, form]);

  // Fetch existing parents when the modal opens
  useEffect(() => {
    if (open) {
      fetchExistingParents();
    }
  }, [open]);

  const fetchExistingParents = async () => {
    if (!token || !tenantId) return;

    setIsLoadingParents(true);
    try {
      const result = await fetchUsersWithoutParent({
        tenantId,
        token,
      });

      // Transform the data to make it easier to use in the component
      const processedParents = result.map((item: any) => {
        let avatarUrl = "/placeholder.svg";

        // Handle featured_image structure
        if (item.user?.featured_image) {
          if (
            Array.isArray(item.user.featured_image) &&
            item.user.featured_image.length > 0
          ) {
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
          avatar: avatarUrl,
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
    if (!token || !tenantId) {
      toast({
        title: "Lỗi",
        description: "Chưa đăng nhập hoặc chưa chọn chi nhánh",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare student data - clean up empty values
      const studentData: CreateStudentData = {
        username: data.username,
        email: data.email,
        password: data.password,
        role: ["member"],
        is_active: true,
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

      // Extract the insertedId from the nested response structure
      let studentId = null;
      try {
        // Response structure: { data: [[ { acknowledged: true, insertedId: "..." } ], [null]] }
        studentId =
          result.data?.[0]?.[0]?.insertedId || result.data?._id || result._id;
      } catch (error) {
        console.error("Error extracting student ID:", error);
        studentId = result.data?._id || result._id;
      }

      if (!studentId) {
        throw new Error("Không thể lấy ID của học viên vừa tạo");
      }

      // Show success message
      toast({
        title: "Thành công",
        description: `Đã tạo tài khoản cho ${data.username}`,
      });

      // Close modal and notify parent component
      onOpenChange(false);

      // Reset form for next use
      form.reset();

      // Call success callback with the new student ID
      onSuccess(studentId);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tạo tài khoản",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-[800px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Tạo tài khoản học viên</DialogTitle>
          <DialogDescription>
            Tạo tài khoản cho khách hàng {guestData?.username || "này"} để thêm
            vào lớp học.
          </DialogDescription>
        </DialogHeader>

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
                    open={parentPopoverOpen}
                    onOpenChange={setParentPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          role='combobox'
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? parents.find(
                                (parent) => parent.id === field.value
                              )?.username
                            : "Chọn phụ huynh"}
                          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-full p-0'>
                      <Command>
                        <CommandInput placeholder='Tìm kiếm phụ huynh...' />
                        <CommandList>
                          <CommandEmpty>
                            Không tìm thấy phụ huynh nào.
                          </CommandEmpty>
                          <CommandGroup>
                            {isLoadingParents ? (
                              <div className='flex justify-center py-4'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                              </div>
                            ) : (
                              parents.map((parent) => (
                                <CommandItem
                                  value={parent.username}
                                  key={parent.id}
                                  onSelect={() => {
                                    form.setValue("parent_id", parent.id);
                                    setParentPopoverOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      parent.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  <div>
                                    <div className='font-medium'>
                                      {parent.username}
                                    </div>
                                    <div className='text-sm text-muted-foreground'>
                                      {parent.email} • {parent.phone}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
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

            <div className='flex justify-end gap-2 pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
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
                  <>
                    <UserPlus className='mr-2 h-4 w-4' />
                    Tạo tài khoản
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
