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
import { getAuthToken } from "@/api/auth-utils";
import { getMediaDetails, uploadMedia, deleteMedia } from "@/api/media-api";
import config from "@/api/config.json";

import ManagerNotFound from "@/components/manager/not-found";

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const routeParams = useParams();
  const courseId = routeParams?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [courseImages, setCourseImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal and form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    session_number: 0,
    session_number_duration: "",
    detail: [{ title: "" }],
    category: [] as string[],
    price: 0,
    is_active: true,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedMediaIds, setUploadedMediaIds] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken() ?? undefined;
        if (!tenantId) throw new Error("Thiếu thông tin tenant");

        let realCourseId = courseId;
        // Try to fetch by id first
        let courseData = await fetchCourseById({
          courseId: realCourseId,
          tenantId,
          token,
        });
        // If not found, try to resolve slug to id
        if (!courseData || courseData.slug === courseId) {
          // If the param is a slug, fetch all courses and find the id
          const allCoursesResult = await fetchCourses({ tenantId, token });
          const found = allCoursesResult.data.find(
            (c: any) => c.slug === courseId
          );
          if (found) {
            realCourseId = found._id;
            courseData = await fetchCourseById({
              courseId: realCourseId,
              tenantId,
              token,
            });
          }
        }
        setCourse(courseData);

        // Extract and set course images from media field
        if (courseData?.media) {
          let imagePaths: string[] = [];

          // Check if media is an object with path field
          if (courseData.media.path && courseData.media.path !== null) {
            imagePaths = [courseData.media.path];
          }
          // Check if media is an array with images
          else if (Array.isArray(courseData.media)) {
            imagePaths = courseData.media
              .filter((item: any) => item?.path && item.path !== null)
              .map((item: any) => item.path);
          }

          setCourseImages(imagePaths);
        }

        // If the URL param is the id, but the course has a slug, update the URL
        if (courseData && courseId === courseData._id && courseData.slug) {
          if (typeof window !== "undefined") {
            window.history.replaceState(
              null,
              "",
              `/dashboard/manager/courses/${courseData.slug}`
            );
          }
        }
      } catch (e: any) {
        console.error("[DEBUG] Error fetching course detail:", e);
        // Check if it's a 404 error (course not found)
        if (
          e.message?.includes("404") ||
          e.message?.includes("không tìm thấy") ||
          e.message?.includes("not found")
        ) {
          setError("404");
        } else {
          setError(e.message || "Lỗi không xác định");
        }
        setCourse(null);
      }
      setLoading(false);
    }
    if (courseId) loadCourse();
  }, [courseId]);

  // Load course categories
  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (tenantId && token) {
          const categoriesData = await fetchAllCourseCategories({
            tenantId,
            token,
          });
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  // Navigation functions for image slider
  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === courseImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? courseImages.length - 1 : prev - 1
    );
  };

  // Set slug in search bar when course is loaded
  useEffect(() => {
    if (course && course.slug) {
      if (typeof window !== "undefined") {
        // Set the search bar value
        const searchInput = document.getElementById("course-search-bar");
        if (searchInput) {
          (searchInput as HTMLInputElement).value = course.slug;
        }
      }
    }
  }, [course, courseId]);

  // Keyboard navigation for image slider
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (courseImages && courseImages.length > 1) {
        if (event.key === "ArrowLeft") {
          prevImage();
        } else if (event.key === "ArrowRight") {
          nextImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [courseImages, currentImageIndex]);

  // Handle opening edit modal
  const handleEditClick = () => {
    if (course) {
      setFormData({
        title: course.title || "",
        description: course.description || "",
        session_number: course.session_number || 0,
        session_number_duration: course.session_number_duration || "",
        detail: course.detail?.length > 0 ? course.detail : [{ title: "" }],
        category: Array.isArray(course.category)
          ? course.category.map((cat: any) => cat._id || cat)
          : course.category?._id
          ? [course.category._id]
          : course.category
          ? [course.category]
          : [],
        price: course.price || 0,
        is_active: course.is_active ?? true,
      });
      setUploadedMediaIds(
        Array.isArray(course.media)
          ? course.media.map((m: any) => m._id || m).filter(Boolean)
          : course.media?._id
          ? [course.media._id]
          : []
      );
      setSelectedFiles([]);
      setImagesToDelete([]);
      setIsEditModalOpen(true);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle detail items
  const addDetailItem = () => {
    setFormData((prev) => ({
      ...prev,
      detail: [...prev.detail, { title: "" }],
    }));
  };

  const removeDetailItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      detail: prev.detail.filter((_, i) => i !== index),
    }));
  };

  const updateDetailItem = (index: number, title: string) => {
    setFormData((prev) => ({
      ...prev,
      detail: prev.detail.map((item, i) => (i === index ? { title } : item)),
    }));
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      category: checked
        ? [...prev.category, categoryId]
        : prev.category.filter((id) => id !== categoryId),
    }));
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Mark current image for deletion
  const markImageForDeletion = (mediaId: string) => {
    setImagesToDelete((prev) => [...prev, mediaId]);
  };

  // Unmark image for deletion
  const unmarkImageForDeletion = (mediaId: string) => {
    setImagesToDelete((prev) => prev.filter((id) => id !== mediaId));
  };

  // Handle form submission
  const handleSaveCourse = async () => {
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
      const updatePayload = {
        title: formData.title,
        description: formData.description,
        session_number: formData.session_number,
        session_number_duration: formData.session_number_duration,
        detail: formData.detail.filter((item) => item.title.trim() !== ""),
        category: formData.category,
        media: remainingMediaIds,
        is_active: formData.is_active,
        price: formData.price,
      };

      // Update course using API function
      await updateCourse({
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
      toast({
        title: "Thành công",
        description: "Khóa học đã được cập nhật thành công",
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
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải chi tiết khoá học...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
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
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Card className='max-w-md mx-auto shadow-lg'>
          <CardContent className='p-8 text-center'>
            <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Info className='h-8 w-8 text-destructive' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              Có lỗi xảy ra
            </h3>
            <p className='text-destructive mb-4'>{error}</p>
            <Link
              href='/dashboard/manager/courses'
              className='inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Quay về danh sách
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className='min-h-screen bg-background animate-in fade-in duration-500'>
      {/* Header Section */}
      <div className='bg-card shadow-sm border-b border-border'>
        <div className='container mx-auto px-4 py-6'>
          {/* Back Button and Edit Button */}
          <div className='flex items-center justify-between mb-4'>
            <Link
              href='/dashboard/manager/courses'
              className='inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/30'
            >
              <ArrowLeft className='h-4 w-4' />
              Quay về danh sách
            </Link>
            <Button
              onClick={handleEditClick}
              className='inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 px-4 py-2 rounded-lg font-medium'
            >
              <Edit className='h-4 w-4' />
              Chỉnh sửa khóa học
            </Button>
          </div>

          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-foreground mb-2'>
                {course.title}
              </h1>
              <div className='flex flex-wrap items-center gap-3'>
                <Badge
                  variant='outline'
                  className={
                    course.is_active
                      ? "bg-green-50 text-green-700 border-green-200 font-medium dark:bg-green-950 dark:text-green-400 dark:border-green-800"
                      : "bg-muted text-muted-foreground border-border font-medium"
                  }
                >
                  {course.is_active ? "🟢 Đang hoạt động" : "⚫ Đã kết thúc"}
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
                        variant='secondary'
                        className='font-medium'
                      >
                        <Tag className='mr-1 h-3 w-3' />
                        {cat.title}
                      </Badge>
                    ))}
              </div>
            </div>

            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Calendar className='h-4 w-4' />
              <span>
                Tạo:{" "}
                {course.created_at
                  ? new Date(course.created_at).toLocaleDateString("vi-VN")
                  : "-"}
              </span>
              {course.updated_at && course.updated_at !== course.created_at && (
                <span className='text-muted-foreground/70'>
                  • Cập nhật:{" "}
                  {new Date(course.updated_at).toLocaleDateString("vi-VN")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>{" "}
      {/* Main Content */}
      <div className='container mx-auto px-4 py-8'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Course Image and Description */}
          <div className='lg:col-span-2 space-y-6'>
            {/* Course Image */}
            <Card className='overflow-hidden shadow-lg border'>
              <div className='aspect-video bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center relative'>
                {courseImages && courseImages.length > 0 ? (
                  <>
                    <img
                      src={courseImages[currentImageIndex]}
                      alt={course.title}
                      className='object-cover w-full h-full'
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
                          className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10'
                          aria-label='Previous image'
                        >
                          <ChevronLeft className='h-5 w-5' />
                        </button>
                        <button
                          onClick={nextImage}
                          className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-10'
                          aria-label='Next image'
                        >
                          <ChevronRight className='h-5 w-5' />
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
                    className='object-cover w-full h-full'
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                )}
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                <div className='absolute bottom-4 left-4 right-4 z-10'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-white'>
                      <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                      <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                      <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                      <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                      <Star className='h-5 w-5 fill-gray-300 text-gray-300' />
                      <span className='text-sm font-medium ml-1'>4.0/5</span>
                    </div>
                    {courseImages && courseImages.length > 0 && (
                      <div className='flex items-center gap-2'>
                        <div className='bg-black/30 text-white text-xs px-2 py-1 rounded'>
                          📷{" "}
                          {courseImages.length > 1
                            ? `${currentImageIndex + 1}/${courseImages.length}`
                            : "Có hình ảnh"}
                        </div>
                        {courseImages.length > 1 && (
                          <div className='flex gap-1'>
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
                <div className='p-4 bg-muted/20 border-t'>
                  <div className='flex gap-2 overflow-x-auto scrollbar-thin'>
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
                          className='w-full h-full object-cover'
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
            <Card className='shadow-lg border'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Info className='h-5 w-5 text-primary' />
                  Mô tả khoá học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-foreground leading-relaxed whitespace-pre-wrap'>
                  {course.description || "Chưa có mô tả cho khoá học này."}
                </div>
              </CardContent>
            </Card>

            {/* Course Details */}
            {Array.isArray(course.detail) && course.detail.length > 0 && (
              <Card className='shadow-lg border'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <BookOpen className='h-5 w-5 text-primary' />
                    Nội dung khoá học
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-3'>
                    {course.detail.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className='flex items-start gap-3 p-3 bg-muted/50 rounded-lg border'
                      >
                        <div className='w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 mt-0.5'>
                          {idx + 1}
                        </div>
                        <div className='flex-1'>
                          <h4 className='font-medium text-foreground'>
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className='text-sm text-muted-foreground mt-1'>
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>{" "}
          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Quick Stats */}
            <Card className='shadow-lg border'>
              <CardHeader>
                <CardTitle className='text-lg'>Thông tin khoá học</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg border dark:bg-green-950/50 dark:border-green-800'>
                  <div className='flex items-center gap-2'>
                    <DollarSign className='h-5 w-5 text-green-600 dark:text-green-400' />
                    <span className='font-medium text-green-900 dark:text-green-200'>
                      Giá
                    </span>
                  </div>
                  <span className='text-lg font-bold text-green-700 dark:text-green-400'>
                    {course.price?.toLocaleString() || 0}₫
                  </span>
                </div>

                <Separator />

                <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border dark:bg-blue-950/50 dark:border-blue-800'>
                  <div className='flex items-center gap-2'>
                    <Calendar className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                    <span className='font-medium text-blue-900 dark:text-blue-200'>
                      Số buổi
                    </span>
                  </div>
                  <span className='text-lg font-bold text-blue-700 dark:text-blue-400'>
                    {course.session_number || 0} buổi
                  </span>
                </div>

                <Separator />

                <div className='flex items-center justify-between p-3 bg-purple-50 rounded-lg border dark:bg-purple-950/50 dark:border-purple-800'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                    <span className='font-medium text-purple-900 dark:text-purple-200'>
                      Thời lượng/buổi
                    </span>
                  </div>
                  <span className='text-lg font-bold text-purple-700 dark:text-purple-400'>
                    {course.session_number_duration || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className='shadow-lg border'>
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
                  <span className='text-sm font-bold text-foreground'>
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
            </Card>
          </div>
        </div>
      </div>
      {/* Edit Course Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa khóa học</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin khóa học. Tất cả thay đổi sẽ được lưu ngay lập
              tức.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Basic Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>Tên khóa học *</Label>
                <Input
                  id='title'
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder='Nhập tên khóa học'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='price'>Giá (VNĐ) *</Label>
                <Input
                  id='price'
                  type='number'
                  value={formData.price}
                  onChange={(e) =>
                    handleInputChange("price", parseInt(e.target.value) || 0)
                  }
                  placeholder='0'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Mô tả</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder='Nhập mô tả khóa học'
                rows={3}
              />
            </div>

            {/* Session Information */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='session_number'>Số buổi học *</Label>
                <Input
                  id='session_number'
                  type='number'
                  value={formData.session_number}
                  onChange={(e) =>
                    handleInputChange(
                      "session_number",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder='0'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='session_duration'>Thời lượng mỗi buổi *</Label>
                <Input
                  id='session_duration'
                  value={formData.session_number_duration}
                  onChange={(e) =>
                    handleInputChange("session_number_duration", e.target.value)
                  }
                  placeholder='VD: 2 giờ, 90 phút'
                />
              </div>
            </div>

            {/* Course Details */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label>Nội dung khóa học</Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addDetailItem}
                >
                  <Plus className='h-4 w-4 mr-1' />
                  Thêm mục
                </Button>
              </div>
              <div className='space-y-2'>
                {formData.detail.map((item, index) => (
                  <div
                    key={index}
                    className='flex gap-2'
                  >
                    <Input
                      value={item.title}
                      onChange={(e) => updateDetailItem(index, e.target.value)}
                      placeholder={`Nội dung ${index + 1}`}
                    />
                    {formData.detail.length > 1 && (
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        onClick={() => removeDetailItem(index)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Course Categories */}
            <div className='space-y-4'>
              <Label>Danh mục khóa học</Label>
              {loadingCategories ? (
                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  Đang tải danh mục...
                </div>
              ) : categories.length === 0 ? (
                <div className='text-sm text-muted-foreground'>
                  Không có danh mục nào
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3'>
                  {categories.map((category) => (
                    <div
                      key={category._id}
                      className='flex items-center space-x-2'
                    >
                      <input
                        type='checkbox'
                        id={`category-${category._id}`}
                        checked={formData.category.includes(category._id)}
                        onChange={(e) =>
                          handleCategoryChange(category._id, e.target.checked)
                        }
                        className='rounded border-gray-300'
                      />
                      <Label
                        htmlFor={`category-${category._id}`}
                        className='text-sm cursor-pointer'
                      >
                        {category.title}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Media Upload */}
            <div className='space-y-4'>
              <Label>Hình ảnh khóa học</Label>

              {/* Current Images */}
              {courseImages.length > 0 && (
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>
                    Hình ảnh hiện tại:
                  </p>
                  <div className='flex gap-2 flex-wrap'>
                    {course.media && Array.isArray(course.media)
                      ? course.media.map((mediaItem: any, index: number) => {
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
                                className='w-full h-full object-cover'
                              />
                              {isMarkedForDeletion ? (
                                <button
                                  type='button'
                                  onClick={() =>
                                    unmarkImageForDeletion(mediaId)
                                  }
                                  className='absolute top-1 right-1 bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-green-600'
                                  title='Khôi phục hình ảnh'
                                >
                                  +
                                </button>
                              ) : (
                                <button
                                  type='button'
                                  onClick={() => markImageForDeletion(mediaId)}
                                  className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600'
                                  title='Xóa hình ảnh'
                                >
                                  <X className='h-3 w-3' />
                                </button>
                              )}
                            </div>
                          );
                        })
                      : course.media &&
                        courseImages[0] && (
                          <div className='relative w-20 h-20 rounded border overflow-hidden'>
                            <img
                              src={courseImages[0]}
                              alt='Current'
                              className='w-full h-full object-cover'
                            />
                            <button
                              type='button'
                              onClick={() =>
                                markImageForDeletion(
                                  course.media._id || course.media
                                )
                              }
                              className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600'
                              title='Xóa hình ảnh'
                            >
                              <X className='h-3 w-3' />
                            </button>
                          </div>
                        )}
                  </div>
                  {imagesToDelete.length > 0 && (
                    <p className='text-sm text-red-600'>
                      {imagesToDelete.length} hình ảnh sẽ bị xóa khi lưu thay
                      đổi
                    </p>
                  )}
                </div>
              )}

              {/* File Upload */}
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <input
                    type='file'
                    accept='image/*'
                    multiple
                    onChange={handleFileSelect}
                    className='hidden'
                    id='media-upload'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() =>
                      document.getElementById("media-upload")?.click()
                    }
                  >
                    <Upload className='h-4 w-4 mr-2' />
                    Thêm hình ảnh
                  </Button>
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className='space-y-2'>
                    <p className='text-sm text-muted-foreground'>
                      Hình ảnh mới:
                    </p>
                    <div className='flex gap-2 flex-wrap'>
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className='relative w-20 h-20 rounded border overflow-hidden'
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`New ${index + 1}`}
                            className='w-full h-full object-cover'
                          />
                          <button
                            type='button'
                            onClick={() => removeSelectedFile(index)}
                            className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Status */}
            <div className='flex items-center space-x-2'>
              <Switch
                id='is_active'
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
              />
              <Label htmlFor='is_active'>Khóa học đang hoạt động</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveCourse}
              disabled={isSaving || !formData.title.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
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
