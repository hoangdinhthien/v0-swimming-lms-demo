"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Loader2, ImagePlus } from "lucide-react";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form schema for validation
const courseFormSchema = z.object({
  title: z.string().min(1, " Tên khóa học không được để trống"),
  description: z.string().min(1, " Mô tả khóa học không được để trống"),
  session_number: z.coerce
    .number({
      required_error: " Vui lòng nhập số buổi học",
      invalid_type_error: " Số buổi học phải là số nguyên dương",
    })
    .int(" Số buổi học phải là số nguyên")
    .positive(" Số buổi học phải lớn hơn 0"),
  session_number_duration: z
    .string()
    .min(1, " Thời lượng mỗi buổi không được để trống (VD: 45 phút, 1 giờ)"),
  detail: z
    .array(
      z.object({
        title: z.string().min(1, " Tiêu đề nội dung không được để trống"),
        description: z.string().min(1, " Mô tả nội dung không được để trống"),
      })
    )
    .min(1, " Vui lòng thêm ít nhất 1 nội dung chi tiết cho khóa học"),
  category: z
    .array(z.string())
    .min(1, " Vui lòng chọn ít nhất 1 danh mục cho khóa học"),
  type: z.enum(["global", "custom"]),
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
    .nonnegative(" Giá khóa học không được là số âm"),
  max_member: z.coerce
    .number({
      required_error: " Vui lòng nhập số học viên tối đa",
      invalid_type_error: " Số học viên tối đa phải là số nguyên dương",
    })
    .int(" Số học viên tối đa phải là số nguyên")
    .positive(" Số học viên tối đa phải lớn hơn 0"),
  media: z.array(z.string()).optional(),
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
            onSubmit={form.handleSubmit(onSubmit)}
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
                            placeholder='Nhập số buổi học'
                            {...field}
                          />
                        </FormControl>
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
                          <Input
                            placeholder='Ví dụ: 45 phút'
                            {...field}
                          />
                        </FormControl>
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
                              const value = e.target.value.replace(/\D/g, "");
                              field.onChange(value ? parseInt(value) : 0);
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Số học viên tối đa{" "}
                          <span className='text-red-500'>*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='Nhập số học viên tối đa'
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
                <CardTitle>Nội dung chi tiết</CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <Accordion
                  type='multiple'
                  className='w-full'
                >
                  {form.watch("detail")?.map((_, index) => (
                    <AccordionItem
                      key={index}
                      value={`detail-${index}`}
                      className='border rounded-lg mb-4'
                    >
                      <AccordionTrigger className='px-4 py-3 hover:no-underline'>
                        <div className='flex items-center justify-between w-full mr-4'>
                          <div className='flex items-center gap-3'>
                            <div className='w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium'>
                              {index + 1}
                            </div>
                            <div className='text-left'>
                              <h4 className='font-semibold text-foreground'>
                                Nội dung {index + 1}
                              </h4>
                              {form.watch(`detail.${index}.title`) && (
                                <p className='text-sm text-muted-foreground'>
                                  {form.watch(`detail.${index}.title`)}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            onClick={(e) => {
                              e.stopPropagation();
                              removeDetail(index);
                            }}
                            disabled={form.watch("detail")?.length <= 1}
                            className='h-8 w-8'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className='px-4 pb-4'>
                        <div className='space-y-4 pt-2'>
                          <FormField
                            control={form.control}
                            name={`detail.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tiêu đề {index + 1}</FormLabel>
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
                                <FormLabel>Mô tả {index + 1}</FormLabel>
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

                <Button
                  type='button'
                  variant='outline'
                  onClick={addDetail}
                >
                  <Plus className='mr-2 h-4 w-4' /> Thêm nội dung
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hình ảnh khóa học</CardTitle>
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
