"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  ImagePlus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  FormJudgeBuilder,
  type FormJudgeSchema,
  convertFormJudgeSchemaToAPI,
} from "@/components/manager/form-judge-builder";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MultiSelect from "@/components/ui/multi-select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { createCourse, type CreateCourseData } from "@/api/manager/courses-api";
import { fetchAllCourseCategories } from "@/api/manager/course-categories";
import { fetchAgeRules, type AgeRule } from "@/api/manager/age-types";
import { uploadMedia } from "@/api/media-api";
import { fetchStudents } from "@/api/manager/students-api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";

// Form schema for validation
const courseFormSchema = z
  .object({
    title: z.string().min(1, " Tên khóa học không được để trống"),
    description: z.string().min(1, " Mô tả khóa học không được để trống"),
    session_number: z.coerce
      .number({
        required_error: " Vui lòng nhập số buổi học",
        invalid_type_error: " Số buổi học phải là số nguyên dương",
      })
      .int(" Số buổi học phải là số nguyên")
      .min(1, " Số buổi học phải từ 1 đến 100")
      .max(100, " Số buổi học không được vượt quá 100"),
    session_number_duration: z
      .string()
      .min(1, " Thời lượng mỗi buổi không được để trống (VD: 45 phút, 1 giờ)"),
    detail: z.array(
      z.object({
        title: z.string().min(1, " Tiêu đề nội dung không được để trống"),
        description: z.string().min(1, " Mô tả nội dung không được để trống"),
      })
    ),
    category: z
      .array(z.string())
      .min(1, " Vui lòng chọn ít nhất 1 danh mục cho khóa học"),
    type: z.enum(["global", "custom"]),
    member_custom: z.array(z.string()).optional(),
    type_of_age: z
      .array(z.string())
      .min(1, " Vui lòng chọn ít nhất 1 độ tuổi cho khóa học"),
    is_active: z.boolean().default(false),
    price: z.coerce
      .number({
        required_error: " Vui lòng nhập giá khóa học",
        invalid_type_error: " Giá khóa học phải là số",
      })
      .int(" Giá khóa học phải là số nguyên")
      .min(0, " Giá khóa học không được là số âm")
      .max(1000000000, " Giá khóa học không được vượt quá 1 tỷ VNĐ"),
    max_member: z.coerce
      .number({
        required_error: " Vui lòng nhập số học viên tối đa",
        invalid_type_error: " Số học viên tối đa phải là số nguyên dương",
      })
      .int(" Số học viên tối đa phải là số nguyên")
      .min(1, " Số học viên tối đa phải từ 1 đến 30")
      .max(30, " Số học viên tối đa không được vượt quá 30"),
    media: z
      .array(z.string())
      .min(1, " Vui lòng tải lên ít nhất 1 hình ảnh khóa học"),
  })
  .refine((data) => data.detail.length === data.session_number, {
    message: "Số lượng nội dung chi tiết phải bằng với số buổi học",
    path: ["detail"],
  });

type CourseFormValues = z.infer<typeof courseFormSchema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{ id: string; title: string; preview: string }>
  >([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [ageRules, setAgeRules] = useState<AgeRule[]>([]);
  const [loadingAgeRules, setLoadingAgeRules] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Student selection for custom-type courses
  const [studentSearch, setStudentSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [selectedStudentsData, setSelectedStudentsData] = useState<any[]>([]);

  // State to store form_judge for each detail item
  const [detailFormJudges, setDetailFormJudges] = useState<
    Record<number, FormJudgeSchema>
  >({});

  // Default values for the form
  const defaultValues: Partial<CourseFormValues> = {
    title: "",
    description: "",
    session_number: 1,
    session_number_duration: "45 phút",
    detail: [{ title: "", description: "" }],
    category: [],
    type: "global",
    member_custom: [],
    type_of_age: [],
    is_active: false,
    price: 0,
    max_member: 20,
    media: [],
  };

  // Initialize the form
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues,
  });

  const { fields, replace, remove } = useFieldArray({
    control: form.control,
    name: "detail",
  });

  // Fetch course categories and age rules on component mount
  useEffect(() => {
    async function fetchCategories() {
      setLoadingCategories(true);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) throw new Error("Thiếu thông tin xác thực");
        const arr = await fetchAllCourseCategories({ tenantId, token });
        setCategories(arr);
      } catch (e: any) {
        toast({
          title: "Lỗi",
          description: e.message || "Không thể tải danh mục khóa học",
          variant: "destructive",
        });
      }
      setLoadingCategories(false);
    }

    async function fetchAgeRulesData() {
      setLoadingAgeRules(true);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) throw new Error("Thiếu thông tin xác thực");
        const rules = await fetchAgeRules({}, tenantId, token);
        setAgeRules(rules);
      } catch (e: any) {
        toast({
          title: "Lỗi",
          description: e.message || "Không thể tải danh sách độ tuổi",
          variant: "destructive",
        });
      }
      setLoadingAgeRules(false);
    }

    fetchCategories();
    fetchAgeRulesData();
  }, [toast]); // Empty dependency array - only fetch once on mount

  // Sync detail array with session_number with debounce
  useEffect(() => {
    const sessionNum = form.watch("session_number");
    const timer = setTimeout(() => {
      const currentSessionNumber =
        typeof sessionNum === "string" ? parseInt(sessionNum) : sessionNum;
      const currentDetails = form.getValues("detail") || [];

      // Sanity check: only sync if it's a reasonable number (1-100)
      if (
        currentSessionNumber &&
        currentSessionNumber > 0 &&
        currentSessionNumber <= 100 &&
        currentSessionNumber !== currentDetails.length
      ) {
        if (currentSessionNumber > currentDetails.length) {
          // Add missing detail items
          const newDetails = [...currentDetails];
          while (newDetails.length < currentSessionNumber) {
            newDetails.push({ title: "", description: "" });
          }
          replace(newDetails);
        } else if (currentSessionNumber < currentDetails.length) {
          // Remove excess detail items
          const newDetails = currentDetails.slice(0, currentSessionNumber);
          replace(newDetails);

          // Also clean up form judges for removed items
          const newFormJudges = { ...detailFormJudges };
          Object.keys(newFormJudges).forEach((key) => {
            const index = parseInt(key);
            if (index >= currentSessionNumber) {
              delete newFormJudges[index];
            }
          });
          setDetailFormJudges(newFormJudges);
        }
      }
    }, 400); // Debounce to prevent lag while typing

    return () => clearTimeout(timer);
  }, [form.watch("session_number"), replace, detailFormJudges]); // Re-run when session_number changes

  // Fetch students for member_custom when search term changes
  useEffect(() => {
    const term = studentSearch;
    const timer = setTimeout(async () => {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token) return;
      setSearchingStudents(true);
      try {
        const students = await fetchStudents({
          tenantId,
          token,
          role: "member",
          searchKey: term || undefined,
        });
        const searchOpts = (students || [])
          .map((s: any) => {
            const label =
              s.user?.username ||
              s.username ||
              s.user?.email ||
              s.email ||
              s._id ||
              "(unknown)";
            const id = s.user?._id || s._id || "";
            return { id, label };
          })
          .filter((o: any) => o.id);

        // Include selected students in options
        const selectedOpts = selectedStudentsData
          .map((m: any) => {
            const id = m._id || m.user?._id || "";
            const label =
              m.user?.username || m.username || m.user?.email || m.email || id;
            return { id, label };
          })
          .filter((o: any) => o.id);

        // Merge and deduplicate
        const allOpts = [...selectedOpts, ...searchOpts].filter(
          (o, i, arr) => arr.findIndex((x) => x.id === o.id) === i
        );

        setStudentOptions(allOpts);
      } catch (e) {
        // On error, still include selected students
        const selectedOpts = selectedStudentsData
          .map((m: any) => {
            const id = m._id || m.user?._id || "";
            const label =
              m.user?.username || m.username || m.user?.email || m.email || id;
            return { id, label };
          })
          .filter((o: any) => o.id);
        setStudentOptions(selectedOpts);
      } finally {
        setSearchingStudents(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [studentSearch, selectedStudentsData]);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const tenantId = getSelectedTenant();
    const token = getAuthToken();
    if (!tenantId || !token) {
      toast({
        title: "Lỗi",
        description: "Thiếu thông tin xác thực",
        variant: "destructive",
      });
      return;
    }

    setUploadingMedia(true);

    try {
      const file = e.target.files[0];

      // Use our API function to upload the media
      const result = await uploadMedia({
        file,
        title: file.name,
        alt: file.name,
        tenantId,
        token,
      });

      if (result.data && result.data._id) {
        // Create a URL for preview
        const newImage = {
          id: result.data._id,
          title: result.data.title || file.name,
          preview: URL.createObjectURL(file),
        };

        setUploadedImages((prev) => [...prev, newImage]);

        // Update the form's media field
        const currentMedia = form.getValues("media") || [];
        form.setValue("media", [...currentMedia, result.data._id]);

        toast({
          title: "Thành công",
          description: "Đã tải hình ảnh lên thành công",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi tải hình ảnh lên",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle image removal
  const handleRemoveImage = (index: number) => {
    const newImages = [...uploadedImages];
    const imageToRemove = newImages[index];
    newImages.splice(index, 1);
    setUploadedImages(newImages);

    // Update form value
    const currentMedia = form.getValues("media") || [];
    const updatedMedia = currentMedia.filter((id) => id !== imageToRemove.id);
    form.setValue("media", updatedMedia);
  };

  // Add a new detail item
  const addDetail = () => {
    const currentDetails = form.getValues("detail") || [];
    form.setValue("detail", [
      ...currentDetails,
      { title: "", description: "" },
    ]);
  };

  // Remove a detail item
  const removeDetail = (index: number) => {
    const currentDetails = form.getValues("detail") || [];
    if (currentDetails.length <= 1) return; // Keep at least one detail item
    const newDetails = [...currentDetails];
    newDetails.splice(index, 1);
    form.setValue("detail", newDetails);

    // Remove form_judge for this detail
    const newFormJudges = { ...detailFormJudges };
    delete newFormJudges[index];
    // Re-index remaining form_judges
    const reindexed: Record<number, FormJudgeSchema> = {};
    Object.keys(newFormJudges).forEach((key) => {
      const oldIndex = parseInt(key);
      const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
      reindexed[newIndex] = newFormJudges[oldIndex];
    });
    setDetailFormJudges(reindexed);
  };

  // Submit the form
  const onSubmit = async (values: CourseFormValues) => {
    const tenantId = getSelectedTenant();
    const token = getAuthToken();

    if (!tenantId || !token) {
      toast({
        title: "Lỗi",
        description: "Thiếu thông tin xác thực",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Merge detail with form_judge data
      const detailWithFormJudge = values.detail.map((item, index) => ({
        ...item,
        form_judge: convertFormJudgeSchemaToAPI(
          detailFormJudges[index] || {
            type: "object" as const,
            items: [],
          }
        ),
      }));

      // Use our API function to create the course
      await createCourse({
        courseData: {
          ...values,
          type: [values.type], // Convert string to array as required by API
          member_custom: (values as any).member_custom || [],
          detail: detailWithFormJudge,
        } as any,
        tenantId,
        token,
      });

      toast({
        title: "Thành công",
        description: "Đã tạo khóa học mới thành công",
      });

      // Navigate back to courses page
      router.push("/dashboard/manager/courses");
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Lỗi khi tạo khóa học",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager/courses'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về Danh sách khóa học
        </Link>
      </div>

      <div className='flex flex-col space-y-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Thêm khóa học mới
          </h1>
          <p className='text-muted-foreground'>
            Điền thông tin chi tiết để tạo một khóa học mới
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error("Form validation errors:", errors);
              toast({
                title: "Lỗi nhập liệu",
                description:
                  "Vui lòng kiểm tra lại các trường thông tin còn thiếu hoặc sai định dạng",
                variant: "destructive",
              });
            })}
            className='space-y-8'
          >
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tên khóa học <span className='text-red-500'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập tên khóa học'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Mô tả khóa học <span className='text-red-500'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Nhập mô tả chi tiết về khóa học'
                          className='resize-none min-h-[120px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='session_number'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Số buổi học <span className='text-red-500'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            min='1'
                            placeholder='Nhập số buổi học'
                            {...field}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === "") {
                                field.onChange(undefined);
                                return;
                              }
                              const num = parseInt(val);
                              if (!isNaN(num)) {
                                // Block at 100
                                if (num > 100) {
                                  field.onChange(100);
                                } else {
                                  field.onChange(num);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>Tối đa 100 buổi</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='session_number_duration'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Thời lượng mỗi buổi{" "}
                          <span className='text-red-500'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Input
                              placeholder='Ví dụ: 45'
                              {...field}
                              onChange={(e) => {
                                const valString = e.target.value.replace(
                                  /\D/g,
                                  ""
                                );
                                let num = valString ? parseInt(valString) : 0;
                                // Cap at 300 minutes (5 hours)
                                if (num > 300) {
                                  num = 300;
                                }
                                field.onChange(num === 0 ? "" : num.toString());
                              }}
                            />
                            <div className='absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none'>
                              phút
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>Tối đa 300 phút</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='price'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Giá khóa học (VNĐ){" "}
                          <span className='text-red-500'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='text'
                            placeholder='Nhập giá khóa học'
                            value={
                              field.value
                                ? field.value.toLocaleString("vi-VN")
                                : ""
                            }
                            onChange={(e) => {
                              let valString = e.target.value.replace(/\D/g, "");
                              let num = valString ? parseInt(valString) : 0;
                              // Block at 1 billion
                              if (num > 1000000000) {
                                num = 1000000000;
                              }
                              field.onChange(num);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='max_member'
                    render={({ field }) => {
                      const selectedAgeRuleIds =
                        form.watch("type_of_age") || [];
                      const hasChildrenUnder10 = selectedAgeRuleIds.some(
                        (id: string) => {
                          const rule = ageRules.find((r) => r._id === id);
                          if (!rule) return false;
                          const ageRange = Array.isArray(rule.age_range)
                            ? rule.age_range
                            : undefined;
                          const max = ageRange ? ageRange[1] : rule.max_age;
                          return max != null && max <= 10;
                        }
                      );
                      const maxLimit = hasChildrenUnder10 ? 20 : 30;

                      return (
                        <FormItem>
                          <FormLabel>
                            Số học viên tối đa{" "}
                            <span className='text-red-500'>*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              min='1'
                              placeholder={`Nhập số học viên tối đa (mặc định ${maxLimit})`}
                              {...field}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "") {
                                  field.onChange("");
                                  return;
                                }
                                let num = parseInt(val);
                                if (!isNaN(num)) {
                                  if (num > maxLimit) {
                                    num = maxLimit;
                                  }
                                  field.onChange(num);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Tối đa {maxLimit} học viên{" "}
                            {hasChildrenUnder10 &&
                              "(Giới hạn 20 người cho trẻ dưới 10 tuổi)"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='category'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Danh mục khóa học{" "}
                        <span className='text-red-500'>*</span>
                      </FormLabel>
                      {loadingCategories ? (
                        <div className='flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Đang tải danh mục...
                        </div>
                      ) : categories.length === 0 ? (
                        <div className='px-3 py-2 text-sm text-muted-foreground border rounded-md'>
                          Không có danh mục nào
                        </div>
                      ) : (
                        <div>
                          <MultiSelect
                            options={categories.map((c) => ({
                              id: c._id,
                              label: c.title,
                            }))}
                            value={field.value || []}
                            onChange={(vals) => field.onChange(vals)}
                          />
                        </div>
                      )}
                      <FormDescription>
                        Chọn một hoặc nhiều danh mục phù hợp cho khóa học này.
                        Giữ Ctrl (Windows) / Cmd (Mac) để chọn nhiều mục.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='type'
                  render={({ field }) => (
                    <FormItem className='space-y-3'>
                      <FormLabel>
                        Loại khóa học <span className='text-red-500'>*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className='flex flex-col space-y-1'
                        >
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem
                              value='global'
                              id='global'
                            />
                            <Label htmlFor='global'>Toàn hệ thống</Label>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <RadioGroupItem
                              value='custom'
                              id='custom'
                            />
                            <Label htmlFor='custom'>Tùy chỉnh</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Chọn loại khóa học.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("type") === "custom" && (
                  <FormField
                    control={form.control}
                    name='member_custom'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chọn học viên cho loại tùy chỉnh</FormLabel>
                        <MultiSelect
                          options={studentOptions}
                          value={field.value || []}
                          onChange={(vals) => field.onChange(vals)}
                          onSearch={(searchTerm) =>
                            setStudentSearch(searchTerm)
                          }
                          placeholder={
                            searchingStudents
                              ? "Đang tìm..."
                              : "Tìm kiếm và chọn học viên"
                          }
                        />
                        <FormDescription>
                          Chọn một hoặc nhiều học viên cho khóa học tùy chỉnh.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name='type_of_age'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Độ tuổi phù hợp <span className='text-red-500'>*</span>
                      </FormLabel>
                      {loadingAgeRules ? (
                        <div className='flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md'>
                          <Loader2 className='h-4 w-4 animate-spin' />
                          Đang tải độ tuổi...
                        </div>
                      ) : ageRules.length === 0 ? (
                        <div className='px-3 py-2 text-sm text-muted-foreground border rounded-md'>
                          Không có độ tuổi nào
                        </div>
                      ) : (
                        <div>
                          <MultiSelect
                            options={ageRules.map((rule) => {
                              // Prefer `age_range` array [min, max] from API; fallback to min_age/max_age
                              const ageRange = Array.isArray(rule.age_range)
                                ? rule.age_range
                                : undefined;
                              const min = ageRange?.[0] ?? rule.min_age;
                              const max = ageRange?.[1] ?? rule.max_age;
                              let range = "";
                              if (min != null && max != null) {
                                // treat very large max (e.g., 120) as open-ended
                                if (max >= 120) {
                                  range = `từ ${min} tuổi`;
                                } else {
                                  range = `${min}-${max} tuổi`;
                                }
                              } else if (min != null) {
                                range = `từ ${min} tuổi`;
                              } else if (max != null) {
                                range = `dưới ${max} tuổi`;
                              }
                              return {
                                id: rule._id,
                                label: range
                                  ? `${rule.title} (${range})`
                                  : rule.title,
                              };
                            })}
                            value={field.value || []}
                            onChange={(vals) => field.onChange(vals)}
                          />
                        </div>
                      )}
                      <FormDescription>
                        Chọn một hoặc nhiều độ tuổi phù hợp cho khóa học này.
                        Giữ Ctrl (Windows) / Cmd (Mac) để chọn nhiều mục.
                      </FormDescription>
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
                        <FormDescription>
                          Bật để đánh dấu khóa học này đang hoạt động
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Nội dung chi tiết <span className='text-red-500'>*</span>
                </CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Số lượng nội dung chi tiết sẽ tự động khớp với số buổi học bạn
                  đã chọn.
                </p>
              </CardHeader>
              <CardContent className='space-y-6'>
                <Accordion
                  type='multiple'
                  className='w-full'
                >
                  {fields.map((_, index) => (
                    <AccordionItem
                      key={fields[index].id}
                      value={`detail-${index}`}
                      className='border rounded-lg mb-4'
                    >
                      <AccordionTrigger className='px-4 py-3 hover:no-underline group'>
                        <div className='flex items-center justify-between w-full pr-4'>
                          <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium'>
                              {index + 1}
                            </div>
                            <div className='text-left'>
                              <h4 className='font-semibold text-foreground flex items-center gap-2'>
                                Nội dung {index + 1}
                              </h4>
                              {form.watch(`detail.${index}.title`) && (
                                <p className='text-sm text-muted-foreground line-clamp-1'>
                                  {form.watch(`detail.${index}.title`)}
                                </p>
                              )}
                            </div>
                          </div>
                          {form.formState.errors.detail?.[index] && (
                            <div className='flex items-center gap-2 text-destructive animate-pulse'>
                              <AlertCircle className='h-5 w-5' />
                              <span className='text-xs font-medium hidden sm:inline'>
                                Có lỗi
                              </span>
                            </div>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className='px-4 pb-4'>
                        <div className='space-y-4 pt-2'>
                          <FormField
                            control={form.control}
                            name={`detail.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Tiêu đề {index + 1}{" "}
                                  <span className='text-red-500'>*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='Tiêu đề nội dung chi tiết'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`detail.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Mô tả {index + 1}{" "}
                                  <span className='text-red-500'>*</span>
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder='Mô tả chi tiết nội dung'
                                    className='resize-none min-h-[80px]'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* FormJudge Builder */}
                          <div className='mt-4'>
                            <FormJudgeBuilder
                              value={detailFormJudges[index]}
                              onChange={(schema) => {
                                setDetailFormJudges((prev) => ({
                                  ...prev,
                                  [index]: schema,
                                }));
                              }}
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                <div className='flex flex-col gap-2 p-4 bg-muted/50 rounded-lg'>
                  <div className='text-sm text-muted-foreground'>
                    Hiện tại có {fields.length || 0} nội dung cho{" "}
                    {form.watch("session_number") || 0} buổi học.
                  </div>
                  {form.formState.errors.detail && (
                    <p className='text-sm font-medium text-destructive'>
                      {form.formState.errors.detail.message ||
                        (typeof form.formState.errors.detail === "object" &&
                          "root" in form.formState.errors.detail &&
                          (form.formState.errors.detail.root as any)?.message)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Hình ảnh khóa học <span className='text-red-500'>*</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <Label htmlFor='image'>Tải lên hình ảnh</Label>
                  <div className='mt-2 flex items-center gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingMedia}
                      className='w-full sm:w-auto'
                    >
                      {uploadingMedia ? (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      ) : (
                        <ImagePlus className='mr-2 h-4 w-4' />
                      )}
                      Chọn hình ảnh
                    </Button>
                    <input
                      ref={fileInputRef}
                      type='file'
                      id='image'
                      accept='image/*'
                      onChange={handleFileUpload}
                      className='hidden'
                    />
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div>
                    <Label>Hình ảnh đã tải lên</Label>
                    <div className='mt-2 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4'>
                      {uploadedImages.map((image, index) => (
                        <div
                          key={index}
                          className='relative group'
                        >
                          <img
                            src={image.preview}
                            alt={image.title}
                            className='h-32 w-full object-cover rounded-md border'
                          />
                          <Button
                            type='button'
                            variant='destructive'
                            size='icon'
                            className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity'
                            onClick={() => handleRemoveImage(index)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!form.formState.errors.media ? null : (
                  <p className='text-sm font-medium text-destructive'>
                    {form.formState.errors.media.message}
                  </p>
                )}
              </CardContent>
            </Card>

            <div className='flex justify-end gap-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push("/dashboard/manager/courses")}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button
                type='submit'
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Đang
                    tạo...
                  </>
                ) : (
                  <>
                    <Plus className='mr-2 h-4 w-4' /> Tạo khóa học
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
