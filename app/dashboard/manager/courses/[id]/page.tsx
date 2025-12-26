"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSelectedTenant } from "@/utils/tenant-utils";
import {
  Loader2,
  ArrowLeft,
  Calendar,
  Tag,
  Clock,
  DollarSign,
  Users,
  BookOpen,
  Star,
  Info,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Trash2,
  Upload,
  X,
  Settings2,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  Layout,
  Pencil,
  ImagePlus,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MultiSelect from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  fetchCourseById,
  fetchCourses,
  updateCourse,
} from "@/api/manager/courses-api";
import { fetchAllCourseCategories } from "@/api/manager/course-categories";
import { fetchAgeRules } from "@/api/manager/age-types";
import { getAuthToken } from "@/api/auth-utils";
import { getMediaDetails, uploadMedia, deleteMedia } from "@/api/media-api";
import { fetchStudents } from "@/api/manager/students-api";
import config from "@/api/config.json";
import {
  FormJudgeBuilder,
  type FormJudgeSchema,
  convertFormJudgeSchema,
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import PermissionGuard from "@/components/permission-guard";

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
    .min(1, " Số buổi học phải từ 1 đến 100")
    .max(100, " Số buổi học không được vượt quá 100"),
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
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

import ManagerNotFound from "@/components/manager/not-found";

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

import { useWithReview } from "@/hooks/use-with-review";

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  // ... existing code ...
  const { handleResponse } = useWithReview();

  // ... existing code ...

  // Handle form submission
  const handleSaveCourse = async (values: CourseFormValues) => {
    try {
      setIsSaving(true);
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      // Delete marked images first
      if (imagesToDelete.length > 0) {
        await deleteMedia({
          mediaIds: imagesToDelete,
          tenantId,
          token,
        });
      }

      // Remove deleted images from uploadedMediaIds
      let remainingMediaIds = uploadedMediaIds.filter(
        (id) => !imagesToDelete.includes(id)
      );

      // Upload new files
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadResult = await uploadMedia({
            file,
            title: file.name,
            alt: file.name,
            tenantId,
            token,
          });
          remainingMediaIds.push(uploadResult.data._id);
        }
      }

      // Prepare update payload
      const detailWithFormJudge = values.detail
        .filter((item) => item.title.trim() !== "")
        .map((item, index) => ({
          ...item,
          form_judge: convertFormJudgeSchemaToAPI(
            detailFormJudges[index] || {
              type: "object" as const,
              items: [],
            }
          ),
        }));

      const updatePayload = {
        title: values.title,
        description: values.description,
        session_number: values.session_number,
        session_number_duration: values.session_number_duration,
        detail: detailWithFormJudge,
        category: values.category,
        type: [values.type], // Convert string to array as required by API
        type_of_age: values.type_of_age,
        member_custom: values.member_custom || [],
        media: remainingMediaIds,
        is_active: values.is_active,
        price: values.price,
        max_member: values.max_member,
      };

      // Update course using API function
      const response = await updateCourse({
        courseId: course._id,
        courseData: updatePayload,
        tenantId,
        token,
      });

      // Refresh course data
      const updatedCourse = await fetchCourseById({
        courseId: course._id,
        tenantId,
        token,
      });

      setCourse(updatedCourse);

      // Update images
      if (updatedCourse?.media) {
        let imagePaths: string[] = [];
        if (updatedCourse.media.path && updatedCourse.media.path !== null) {
          imagePaths = [updatedCourse.media.path];
        } else if (Array.isArray(updatedCourse.media)) {
          imagePaths = updatedCourse.media
            .filter((item: any) => item?.path && item.path !== null)
            .map((item: any) => item.path);
        }
        setCourseImages(imagePaths);
      }

      setIsEditModalOpen(false);

      handleResponse(response, {
        onSuccess: () => {
          toast({
            title: "Thành công",
            description: "Khóa học đã được cập nhật thành công",
          });
        },
      });
    } catch (error: any) {
      console.error("Error updating course:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật khóa học",
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">
            Đang tải chi tiết khoá học...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }
  if (error === "404" || !course) {
    return <ManagerNotFound />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Có lỗi xảy ra
            </h3>
            <p className="text-destructive mb-4">{error}</p>
            <Link
              href="/dashboard/manager/courses"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay về danh sách
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-6">
          {/* Back Button and Edit Button */}
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/dashboard/manager/courses"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/30"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay về danh sách
            </Link>
            <PermissionGuard module="Course" action="PUT">
              <Button
                onClick={handleEditClick}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa khóa học
              </Button>
            </PermissionGuard>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {course.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className={
                    course.is_active
                      ? "bg-green-50 text-green-700 border-green-200 font-medium dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                      : "bg-muted text-muted-foreground border-border font-medium"
                  }
                >
                  {course.is_active ? "Đang hoạt động" : "Đã kết thúc"}
                </Badge>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 font-medium dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
                >
                  <Settings className="mr-1 h-3 w-3" />
                  {Array.isArray(course.type) && course.type.length > 0
                    ? course.type[0] === "global"
                      ? "Toàn hệ thống"
                      : "Tùy chỉnh"
                    : "Toàn hệ thống"}
                </Badge>
                {Array.isArray(course.category) &&
                  course.category
                    .map((catId: string) =>
                      categories.find((cat) => cat._id === catId)
                    )
                    .filter(Boolean)
                    .map((cat: any) => (
                      <Badge
                        key={cat._id}
                        variant="secondary"
                        className="font-medium"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {cat.title}
                      </Badge>
                    ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                Tạo:{" "}
                {course.created_at
                  ? new Date(course.created_at).toLocaleDateString("vi-VN")
                  : "-"}
              </span>
              {course.updated_at && course.updated_at !== course.created_at && (
                <span className="text-muted-foreground/70">
                  • Cập nhật:{" "}
                  {new Date(course.updated_at).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Image and Description */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Image */}
            <Card className="overflow-hidden shadow-lg border">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center relative">
                {courseImages && courseImages.length > 0 ? (
                  <>
                    <img
                      src={courseImages[currentImageIndex]}
                      alt={course.title}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                    {/* Navigation buttons - only show if more than 1 image */}
                    {courseImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10"
                          aria-label="Next image"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <img
                    src={`/placeholder.svg?height=400&width=800&text=${encodeURIComponent(
                      course.title
                    )}`}
                    alt={course.title}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <div className="flex items-center justify-between">
                    {courseImages && courseImages.length > 0 && (
                      <div className="flex items-center gap-2">
                        {courseImages.length > 1 && (
                          <div className="flex gap-1">
                            {courseImages.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  index === currentImageIndex
                                    ? "bg-white"
                                    : "bg-white/50"
                                }`}
                                aria-label={`Go to image ${index + 1}`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Thumbnail strip for multiple images */}
              {courseImages && courseImages.length > 1 && (
                <div className="p-4 bg-muted/20 border-t">
                  <div className="flex gap-2 overflow-x-auto scrollbar-thin">
                    {courseImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-12 rounded border-2 overflow-hidden transition-all ${
                          index === currentImageIndex
                            ? "border-primary ring-2 ring-primary/30"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${course.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Description */}
            <Card className="shadow-lg border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Mô tả khoá học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {course.description || "Chưa có mô tả cho khoá học này."}
                </div>
              </CardContent>
            </Card>

            {/* Course Details */}
            {Array.isArray(course.detail) && course.detail.length > 0 && (
              <Card className="shadow-lg border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Nội dung khoá học
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {course.detail.map((item: any, idx: number) => (
                      <Card key={idx} className="border-2 bg-card">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground text-lg">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        {/* Form Judge Information */}
                        {item.form_judge &&
                          item.form_judge.items &&
                          Object.keys(item.form_judge.items).length > 0 && (
                            <CardContent className="pt-0">
                              <Separator className="mb-4" />
                              <div className="bg-muted/50 rounded-lg p-4 border">
                                <div className="flex items-center gap-2 mb-3">
                                  <Settings2 className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-semibold text-foreground">
                                    Biểu mẫu đánh giá học viên
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {Object.keys(item.form_judge.items).length}{" "}
                                    trường
                                  </Badge>
                                </div>

                                <div className="space-y-2.5">
                                  {(() => {
                                    const typeTranslations: {
                                      [key: string]: string;
                                    } = {
                                      string: "Văn bản",
                                      number: "Số",
                                      boolean: "Đúng/Sai",
                                      select: "Lựa chọn từ danh sách",
                                      relation: "Đính kèm tập tin",
                                      array: "Mảng",
                                    };
                                    return Object.entries(item.form_judge.items)
                                      .sort(
                                        (
                                          [, a]: [any, any],
                                          [, b]: [any, any]
                                        ) => (a.stt || 0) - (b.stt || 0)
                                      )
                                      .map(
                                        (
                                          [fieldName, fieldConfig]: [
                                            string,
                                            any
                                          ],
                                          idx2: number
                                        ) => (
                                          <div
                                            key={fieldName}
                                            className="bg-background rounded-md p-3 border"
                                          >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                              <div className="flex items-center gap-2 flex-1">
                                                <span className="font-medium text-sm text-foreground">
                                                  {idx2 + 1}. {fieldName}
                                                </span>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {typeTranslations[
                                                    fieldConfig.type
                                                  ] || fieldConfig.type}
                                                </Badge>
                                              </div>
                                              <div className="flex gap-1.5">
                                                {fieldConfig.required && (
                                                  <Badge
                                                    variant="outline"
                                                    className="h-5 px-1.5 text-[10px] bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400"
                                                  >
                                                    Yêu cầu
                                                  </Badge>
                                                )}
                                                {fieldConfig.is_filter && (
                                                  <Badge
                                                    variant="outline"
                                                    className="h-5 px-1.5 text-[10px] bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400"
                                                  >
                                                    Bộ lọc
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>

                                            {/* Type-specific info */}
                                            <div className="text-xs text-muted-foreground space-y-1">
                                              {fieldConfig.type === "string" &&
                                                fieldConfig.text_type && (
                                                  <div>
                                                    Loại:{" "}
                                                    {fieldConfig.text_type}
                                                  </div>
                                                )}
                                              {fieldConfig.type === "number" &&
                                                fieldConfig.is_array && (
                                                  <div>
                                                    Mảng{" "}
                                                    {fieldConfig.number_type ===
                                                      "coordinates" &&
                                                      "(Tọa độ)"}
                                                  </div>
                                                )}
                                              {fieldConfig.type === "select" &&
                                                fieldConfig.select_values && (
                                                  <div>
                                                    Tùy chọn:{" "}
                                                    {
                                                      fieldConfig.select_values.split(
                                                        ","
                                                      ).length
                                                    }{" "}
                                                    lựa chọn
                                                  </div>
                                                )}
                                              {fieldConfig.type ===
                                                "relation" &&
                                                fieldConfig.entity && (
                                                  <div>
                                                    Thực thể:{" "}
                                                    {fieldConfig.entity} (
                                                    {fieldConfig.relation_type})
                                                  </div>
                                                )}
                                              {(fieldConfig.min !== undefined ||
                                                fieldConfig.max !==
                                                  undefined) && (
                                                <div>
                                                  📏 Phạm vi:{" "}
                                                  {fieldConfig.min ?? "N/A"} -{" "}
                                                  {fieldConfig.max ?? "N/A"}
                                                </div>
                                              )}
                                              {/* REMOVED: Dependencies display - not needed anymore */}
                                            </div>
                                          </div>
                                        )
                                      );
                                  })()}
                                </div>
                              </div>
                            </CardContent>
                          )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>{" "}
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="shadow-lg border">
              <CardHeader>
                <CardTitle className="text-lg">Thông tin khoá học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border dark:bg-green-950/50 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-green-900 dark:text-green-200">
                      Giá
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-700 dark:text-green-400">
                    {course.price?.toLocaleString() || 0}₫
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border dark:bg-blue-950/50 dark:border-blue-800">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-blue-900 dark:text-blue-200">
                      Số buổi
                    </span>
                  </div>
                  <span className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    {course.session_number || 0} buổi
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border dark:bg-purple-950/50 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-purple-900 dark:text-purple-200">
                      Thời lượng/buổi
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    {course.session_number_duration || "-"}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border dark:bg-orange-950/50 dark:border-orange-800">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                    <span className="font-medium text-orange-900 dark:text-orange-200">
                      Số học viên tối đa
                    </span>
                  </div>
                  <span className="text-lg font-bold text-orange-700 dark:text-orange-400">
                    {course.max_member || 0} học viên
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Course Type Info */}
            <Card className="shadow-lg border">
              <CardHeader>
                <CardTitle className="text-lg">Loại khóa học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border dark:bg-purple-950/50 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                    <span className="font-medium text-purple-900 dark:text-purple-200">
                      Loại
                    </span>
                  </div>
                  <span className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    {Array.isArray(course.type) && course.type.length > 0
                      ? course.type[0] === "global"
                        ? "Toàn hệ thống"
                        : "Tùy chỉnh"
                      : "Toàn hệ thống"}
                  </span>
                </div>

                {Array.isArray(course.type) &&
                  course.type[0] === "custom" &&
                  course.member_custom &&
                  course.member_custom.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground">
                          Học viên đã chọn:
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {course.member_custom.map(
                            (student: any, index: number) => (
                              <div
                                key={student._id || index}
                                className="flex items-center gap-2 p-2 bg-gray-50 rounded border dark:bg-gray-800 dark:border-gray-700"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {student.username ||
                                      student.email ||
                                      "Unknown"}
                                  </p>
                                  {student.email && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {student.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </>
                  )}
              </CardContent>
            </Card>
            {/* <Card className='shadow-lg border'>
              <CardHeader>
                <CardTitle className='text-lg'>Thống kê</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm font-medium'>
                      Học viên đăng ký
                    </span>
                  </div>
                  <span className='text-sm font-bold text-foreground'>--</span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <BookOpen className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm font-medium'>Bài học</span>
                  </div>
                  <span className='text-sm font-bold text-foreground'>
                    {Array.isArray(course.detail) ? course.detail.length : 0}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Star className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm font-medium'>Đánh giá</span>
                  </div>
                  <span className='text-sm font-bold text-foresground'>
                    4.0/5
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='h-4 w-4 text-muted-foreground'>📷</div>
                    <span className='text-sm font-medium'>Hình ảnh</span>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      courseImages && courseImages.length > 0
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {courseImages && courseImages.length > 0
                      ? `${courseImages.length} ảnh`
                      : "Chưa có"}
                  </span>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
      {/* Edit Course Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin khóa học. Tất cả thay đổi sẽ được lưu ngay lập
              tức.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <Form {...form}>
              <form
                id="edit-course-form"
                onSubmit={form.handleSubmit(handleSaveCourse, (errors) => {
                  console.error("Form validation errors:", errors);
                  toast({
                    title: "Lỗi nhập liệu",
                    description:
                      "Vui lòng kiểm tra lại các trường thông tin còn thiếu hoặc sai định dạng",
                    variant: "destructive",
                  });
                })}
                className="space-y-8"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cơ bản</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Tên khóa học <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập tên khóa học" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Mô tả khóa học{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Nhập mô tả chi tiết về khóa học"
                              className="resize-none min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="session_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Số buổi học{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Nhập số buổi học"
                                {...field}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "") {
                                    field.onChange(undefined);
                                    return;
                                  }
                                  const num = parseInt(val);
                                  if (!isNaN(num)) {
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
                        name="session_number_duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Thời lượng mỗi buổi{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="Ví dụ: 45"
                                  {...field}
                                  onChange={(e) => {
                                    const valString = e.target.value.replace(
                                      /\D/g,
                                      ""
                                    );
                                    let num = valString
                                      ? parseInt(valString)
                                      : 0;
                                    // Cap at 300 minutes (5 hours)
                                    if (num > 300) {
                                      num = 300;
                                    }
                                    field.onChange(
                                      num === 0 ? "" : num.toString()
                                    );
                                  }}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
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
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Giá khóa học (VNĐ){" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="text"
                                placeholder="Nhập giá khóa học"
                                value={
                                  field.value
                                    ? field.value.toLocaleString("vi-VN")
                                    : ""
                                }
                                onChange={(e) => {
                                  let valString = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  let num = valString ? parseInt(valString) : 0;
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
                        name="max_member"
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
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
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
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Phân loại khóa học</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Danh mục khóa học{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          {loadingCategories ? (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang tải danh mục...
                            </div>
                          ) : categories.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground border rounded-md">
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
                            Chọn một hoặc nhiều danh mục phù hợp cho khóa học
                            này. Giữ Ctrl (Windows) / Cmd (Mac) để chọn nhiều
                            mục.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>
                            Loại khóa học{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="global"
                                  id="edit-global"
                                />
                                <Label htmlFor="edit-global">
                                  Toàn hệ thống
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value="custom"
                                  id="edit-custom"
                                />
                                <Label htmlFor="edit-custom">Tùy chỉnh</Label>
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
                        name="member_custom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Chọn học viên cho loại tùy chỉnh
                            </FormLabel>
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
                              Chọn một hoặc nhiều học viên cho khóa học tùy
                              chỉnh.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="type_of_age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Độ tuổi phù hợp{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          {loadingAgeRules ? (
                            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground border rounded-md">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Đang tải độ tuổi...
                            </div>
                          ) : ageRules.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground border rounded-md">
                              Không có độ tuổi nào
                            </div>
                          ) : (
                            <div>
                              <MultiSelect
                                options={ageRules.map((rule) => {
                                  // Prefer `age_range` array [min, max] from API; fallback to min_age/max_age
                                  const ageRange = Array.isArray(rule.age_range)
                                    ? rule.age_range
                                    : [rule.min_age || 0, rule.max_age || 99];
                                  const ageLabel = `${rule.title} (${ageRange[0]} - ${ageRange[1]} tuổi)`;
                                  return {
                                    id: rule._id,
                                    label: ageLabel,
                                  };
                                })}
                                value={field.value || []}
                                onChange={(vals) => field.onChange(vals)}
                              />
                            </div>
                          )}
                          <FormDescription>
                            Chọn độ tuổi phù hợp cho khóa học.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Nội dung khóa học <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>
                        Nội dung chi tiết{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ title: "", description: "" })}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Thêm mục
                      </Button>
                    </div>
                    <Accordion type="multiple" className="w-full">
                      {fields.map((item, index) => (
                        <AccordionItem
                          key={item.id}
                          value={`detail-${index}`}
                          className="border rounded-lg mb-4"
                        >
                          <AccordionTrigger className="px-4 py-3 hover:no-underline group">
                            <div className="flex items-center justify-between w-full mr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div className="text-left flex items-center gap-2">
                                  <div>
                                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                                      Nội dung {index + 1}
                                    </h4>
                                    {form.watch(`detail.${index}.title`) && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {form.watch(`detail.${index}.title`)}
                                      </p>
                                    )}
                                  </div>
                                  {form.formState.errors.detail?.[index] && (
                                    <div className="flex items-center gap-2 text-destructive animate-pulse ml-2">
                                      <AlertCircle className="h-5 w-5" />
                                      <span className="text-xs font-medium hidden sm:inline">
                                        Có lỗi
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {form.watch("detail").length > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    remove(index);

                                    // Remove form_judge for this detail
                                    const newFormJudges = {
                                      ...detailFormJudges,
                                    };
                                    delete newFormJudges[index];
                                    // Re-index remaining form_judges
                                    const reindexed: Record<
                                      number,
                                      FormJudgeSchema
                                    > = {};
                                    Object.keys(newFormJudges).forEach(
                                      (key) => {
                                        const oldIndex = parseInt(key);
                                        const newIndex =
                                          oldIndex > index
                                            ? oldIndex - 1
                                            : oldIndex;
                                        reindexed[newIndex] =
                                          newFormJudges[oldIndex];
                                      }
                                    );
                                    setDetailFormJudges(reindexed);
                                  }}
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-4 pt-2">
                              <FormField
                                control={form.control}
                                name={`detail.${index}.title`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>
                                      Tiêu đề {index + 1}{" "}
                                      <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder={`Tiêu đề ${index + 1}`}
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
                                      <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder={`Mô tả ${index + 1}`}
                                        className="resize-none min-h-[80px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* FormJudge Builder */}
                              <div className="mt-4">
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

                    <div className="mt-4 flex flex-col gap-2 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Hiện tại có {fields.length} mục chi tiết cho{" "}
                        {form.watch("session_number")} buổi học.
                      </p>
                      {form.formState.errors.detail && (
                        <p className="text-sm font-medium text-destructive">
                          {form.formState.errors.detail.message ||
                            (typeof form.formState.errors.detail === "object" &&
                              "root" in form.formState.errors.detail &&
                              (form.formState.errors.detail.root as any)
                                ?.message)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>
                      Hình ảnh khóa học <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Current Images */}
                    {courseImages.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Hình ảnh hiện tại:
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {course.media && Array.isArray(course.media)
                            ? course.media.map(
                                (mediaItem: any, index: number) => {
                                  const mediaId = mediaItem._id || mediaItem;
                                  const imagePath = courseImages[index];
                                  const isMarkedForDeletion =
                                    imagesToDelete.includes(mediaId);

                                  return (
                                    <div
                                      key={mediaId}
                                      className={`relative w-20 h-20 rounded border overflow-hidden ${
                                        isMarkedForDeletion
                                          ? "opacity-50 bg-red-100 border-red-300"
                                          : ""
                                      }`}
                                    >
                                      <img
                                        src={imagePath}
                                        alt={`Current ${index + 1}`}
                                        className="w-full h-full object-cover"
                                      />
                                      {isMarkedForDeletion ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setImagesToDelete((prev) =>
                                              prev.filter(
                                                (id) => id !== mediaId
                                              )
                                            )
                                          }
                                          className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-green-600"
                                          title="Khôi phục hình ảnh"
                                        >
                                          +
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setImagesToDelete((prev) => [
                                              ...prev,
                                              mediaId,
                                            ])
                                          }
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                          title="Xóa hình ảnh"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                }
                              )
                            : course.media &&
                              courseImages[0] && (
                                <div className="relative w-20 h-20 rounded border overflow-hidden">
                                  <img
                                    src={courseImages[0]}
                                    alt="Current"
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setImagesToDelete((prev) => [
                                        ...prev,
                                        course.media._id || course.media,
                                      ])
                                    }
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                    title="Xóa hình ảnh"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                        </div>
                        {imagesToDelete.length > 0 && (
                          <p className="text-sm text-red-600">
                            {imagesToDelete.length} hình ảnh sẽ bị xóa khi lưu
                            thay đổi
                          </p>
                        )}
                      </div>
                    )}

                    {/* File Upload */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          id="media-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("media-upload")?.click()
                          }
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Thêm hình ảnh
                        </Button>
                      </div>

                      {/* Selected Files Preview */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Hình ảnh mới:
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {selectedFiles.map((file, index) => (
                              <div
                                key={index}
                                className="relative w-20 h-20 rounded border overflow-hidden"
                              >
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`New ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSelectedFile(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {!form.formState.errors.media ? null : (
                      <p className="text-sm font-medium text-destructive mt-2">
                        {form.formState.errors.media.message}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Khóa học đang hoạt động</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          </div>

          <DialogFooter className="p-6 pt-2 border-t bg-muted/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button type="submit" form="edit-course-form" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
