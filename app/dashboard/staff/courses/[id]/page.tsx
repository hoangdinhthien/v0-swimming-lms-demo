"use client";
// --- STAFF UI: COPY MANAGER UI, CHỈ ĐỔI API ---
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { fetchStaffCourseDetail } from "@/api/staff-data/staff-data-api";

export default function StaffCourseDetailPage() {
  const routeParams = useParams();
  const courseId = routeParams?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [courseImages, setCourseImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken() || "";
        if (!tenantId) throw new Error("Thiếu thông tin tenant");
        if (!courseId) throw new Error("Thiếu mã khoá học");
        const courseData = await fetchStaffCourseDetail({
          courseId,
          tenantId,
          token,
        });
        setCourse(courseData);
        if (courseData?.media) {
          let imagePaths: string[] = [];
          if (courseData.media.path && courseData.media.path !== null) {
            imagePaths = [courseData.media.path];
          } else if (Array.isArray(courseData.media)) {
            imagePaths = courseData.media
              .filter((item: any) => item?.path && item.path !== null)
              .map((item: any) => item.path);
          }
          setCourseImages(imagePaths);
        }
      } catch (e: any) {
        console.error("[DEBUG] Error fetching course detail:", e);
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
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Card className='max-w-md mx-auto shadow-lg'>
          <CardContent className='p-8 text-center'>
            <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Info className='h-8 w-8 text-destructive' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              Không tìm thấy khoá học
            </h3>
            <p className='text-destructive mb-4'>{error}</p>
            <Link
              href='/dashboard/staff/courses'
              className='inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Quay lại danh sách
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- UI MANAGER COPY ---
  return (
    <div className='min-h-screen bg-background animate-in fade-in duration-500'>
      {/* Header Section */}
      <div className='bg-card shadow-sm border-b border-border'>
        <div className='container mx-auto px-4 py-6'>
          {/* Back Button */}
          <div className='flex items-center justify-between mb-4'>
            <Link
              href='/dashboard/staff/courses'
              className='inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/30'
            >
              <ArrowLeft className='h-4 w-4' />
              Quay về danh sách
            </Link>
            {/* Không có nút chỉnh sửa cho staff */}
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
                  course.category.map((cat: any) => (
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
    </div>
  );
}
