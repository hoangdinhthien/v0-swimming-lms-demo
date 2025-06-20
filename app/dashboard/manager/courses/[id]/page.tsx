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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { fetchCourseById, fetchCourses } from "@/api/courses-api";
import { getAuthToken } from "@/api/auth-utils";

interface CourseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const routeParams = useParams();
  const courseId = routeParams?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(e.message || "Lỗi không xác định");
        setCourse(null);
      }
      setLoading(false);
    }
    if (courseId) loadCourse();
  }, [courseId]);

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
  if (!course) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Card className='max-w-md mx-auto shadow-lg'>
          <CardContent className='p-8 text-center'>
            <div className='w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4'>
              <BookOpen className='h-8 w-8 text-muted-foreground' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              Không tìm thấy khoá học
            </h3>
            <p className='text-muted-foreground mb-4'>
              Khoá học bạn tìm kiếm không tồn tại hoặc đã bị xoá.
            </p>
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
    <div className='min-h-screen bg-background'>
      {/* Header Section */}
      <div className='bg-card shadow-sm border-b border-border'>
        <div className='container mx-auto px-4 py-6'>
          <Link
            href='/dashboard/manager/courses'
            className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Quay về danh sách khoá học
          </Link>

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
                <div className='absolute inset-0 bg-gradient-to-t from-black/50 to-transparent' />
                <div className='absolute bottom-4 left-4 right-4'>
                  <div className='flex items-center gap-2 text-white'>
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                    <Star className='h-5 w-5 fill-gray-300 text-gray-300' />
                    <span className='text-sm font-medium ml-1'>4.0/5</span>
                  </div>
                </div>
              </div>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
