"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  BookOpen,
  DollarSign,
  User,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchClassDetails, type ClassDetails } from "@/api/class-api";

export default function ClassDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classroomId = params?.id as string;
  const from = searchParams.get("from"); // Get the 'from' parameter

  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine the back link and text based on 'from' parameter
  const getBackLink = () => {
    switch (from) {
      case "classes":
        return {
          href: "/dashboard/manager/classes",
          text: "Quay về danh sách lớp học",
        };
      case "calendar":
        return {
          href: "/dashboard/manager/calendar",
          text: "Quay về lịch",
        };
      default:
        return {
          href: "/dashboard/manager/calendar",
          text: "Quay về lịch",
        };
    }
  };

  const backLink = getBackLink();

  useEffect(() => {
    const loadClassDetails = async () => {
      if (!classroomId) {
        setError("Classroom ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const details = await fetchClassDetails(classroomId);
        setClassData(details);
      } catch (err) {
        console.error("Error fetching class details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch class details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadClassDetails();
  }, [classroomId]);

  // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-4'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-muted opacity-20 blur-xl animate-pulse'></div>
              <Loader2 className='relative h-12 w-12 animate-spin mx-auto text-muted-foreground' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold text-foreground'>
                Đang tải thông tin lớp học
              </h3>
              <p className='text-muted-foreground'>
                Vui lòng chờ trong giây lát...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-6 max-w-md'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-destructive/20 opacity-20 blur-xl'></div>
              <div className='relative h-16 w-16 mx-auto bg-destructive rounded-full flex items-center justify-center'>
                <span className='text-2xl'>⚠️</span>
              </div>
            </div>
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold text-destructive'>
                Không thể tải thông tin lớp học
              </h3>
              <p className='text-muted-foreground bg-muted p-3 rounded-lg border'>
                {error}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
              >
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!classData) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-6'>
            <h3 className='text-xl font-semibold text-foreground'>
              Không tìm thấy lớp học
            </h3>
            <p className='text-muted-foreground'>
              Lớp học với ID {classroomId} không tồn tại.
            </p>
            <Link href={backLink.href}>
              <Button>
                <ArrowLeft className='mr-2 h-4 w-4' />
                {backLink.text}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-none mx-auto px-6 py-6 space-y-8'>
        {/* Back Button */}
        <div className='flex items-center space-x-2 text-sm opacity-80 hover:opacity-100 transition-opacity'>
          <Link
            href={backLink.href}
            className='inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/10 px-2 py-1 rounded-md'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            {backLink.text}
          </Link>
        </div>

        {/* Header */}
        <div className='relative'>
          <div className='absolute inset-0 bg-muted/5 rounded-3xl blur-3xl'></div>
          <div className='relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-8 bg-card/80 backdrop-blur-sm border rounded-2xl shadow-xl'>
            <div className='space-y-2'>
              <h1 className='text-4xl font-bold text-foreground'>
                {classData.name}
              </h1>
              <p className='text-muted-foreground text-lg'>
                {classData.course.title}
              </p>
            </div>{" "}
            <div className='flex items-center gap-4'>
              <Badge
                variant='default'
                className='bg-primary text-primary-foreground text-sm px-4 py-2'
              >
                {classData.course.is_active
                  ? "Đang hoạt động"
                  : "Ngừng hoạt động"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid gap-8 lg:grid-cols-3'>
          {/* Course Information */}
          <div className='lg:col-span-2 space-y-6'>
            <Card className='bg-card/80 backdrop-blur-sm border shadow-xl'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <BookOpen className='h-5 w-5 text-primary-foreground' />
                  </div>
                  Thông tin khóa học
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <h3 className='text-lg font-semibold mb-2'>Mô tả</h3>
                  <p className='text-muted-foreground leading-relaxed'>
                    {classData.course.description}
                  </p>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex items-center gap-3 p-4 bg-muted/50 rounded-lg'>
                    <div className='p-2 bg-primary rounded-lg'>
                      <Clock className='h-4 w-4 text-primary-foreground' />
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>
                        Số buổi học
                      </p>
                      <p className='font-semibold'>
                        {classData.course.session_number} buổi
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 p-4 bg-muted/50 rounded-lg'>
                    <div className='p-2 bg-primary rounded-lg'>
                      <Calendar className='h-4 w-4 text-primary-foreground' />
                    </div>
                    <div>
                      <p className='text-sm text-muted-foreground'>
                        Thời lượng mỗi buổi
                      </p>
                      <p className='font-semibold'>
                        {classData.course.session_number_duration}
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
                    <div className='p-2 bg-emerald-600 rounded-lg'>
                      <DollarSign className='h-4 w-4 text-white' />
                    </div>
                    <div>
                      <p className='text-sm text-emerald-700 dark:text-emerald-300'>
                        Học phí
                      </p>
                      <p className='font-semibold text-emerald-600 dark:text-emerald-400'>
                        {formatPrice(classData.course.price)}
                      </p>
                    </div>
                  </div>{" "}
                  <div className='flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                    <div className='p-2 bg-blue-600 rounded-lg'>
                      <Calendar className='h-4 w-4 text-white' />
                    </div>
                    <div>
                      <p className='text-sm text-blue-700 dark:text-blue-300'>
                        Buổi học đã qua
                      </p>
                      <p className='font-semibold text-blue-600 dark:text-blue-400'>
                        {classData.schedule_passed || 0} buổi
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
                    <div className='p-2 bg-amber-600 rounded-lg'>
                      <Clock className='h-4 w-4 text-white' />
                    </div>
                    <div>
                      <p className='text-sm text-amber-700 dark:text-amber-300'>
                        Buổi học còn lại
                      </p>
                      <p className='font-semibold text-amber-600 dark:text-amber-400'>
                        {classData.schedule_left || 0} buổi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule Information */}
                <div>
                  <h3 className='text-lg font-semibold mb-4'>
                    Lịch học ({classData.total_schedules || 0} buổi)
                  </h3>
                  {classData.schedules && classData.schedules.length > 0 ? (
                    <div className='space-y-3 max-h-64 overflow-y-auto'>
                      {classData.schedules.map((schedule) => (
                        <div
                          key={schedule._id}
                          className='flex items-center justify-between p-3 bg-muted/50 rounded-lg border'
                        >
                          <div className='flex items-center gap-3'>
                            <div className='p-2 bg-primary/10 rounded-lg'>
                              <Calendar className='h-4 w-4 text-primary' />
                            </div>
                            <div>
                              <p className='font-medium'>
                                {new Date(schedule.date).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </p>
                              <p className='text-sm text-muted-foreground'>
                                Slot: {schedule.slot.length} khung giờ
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant='outline'
                            className={
                              new Date(schedule.date) < new Date()
                                ? "bg-gray-50 text-gray-600"
                                : "bg-green-50 text-green-600"
                            }
                          >
                            {new Date(schedule.date) < new Date()
                              ? "Đã qua"
                              : "Sắp tới"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-muted-foreground italic text-center py-4'>
                      Chưa có lịch học nào được lên lịch
                    </p>
                  )}
                </div>

                {/* Session Progress */}
                <div className='border-t pt-4'>
                  <h3 className='text-lg font-semibold mb-4'>
                    Tiến độ buổi học
                  </h3>
                  <div className='grid gap-3 md:grid-cols-2'>
                    <div className='flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                      <div className='p-2 bg-red-600 rounded-lg'>
                        <Clock className='h-4 w-4 text-white' />
                      </div>
                      <div>
                        <p className='text-sm text-red-700 dark:text-red-300'>
                          Buổi học vượt quá
                        </p>
                        <p className='font-semibold text-red-600 dark:text-red-400'>
                          {classData.sessions_exceeded || 0} buổi
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                      <div className='p-2 bg-green-600 rounded-lg'>
                        <BookOpen className='h-4 w-4 text-white' />
                      </div>
                      <div>
                        <p className='text-sm text-green-700 dark:text-green-300'>
                          Buổi học còn lại
                        </p>
                        <p className='font-semibold text-green-600 dark:text-green-400'>
                          {classData.sessions_remaining || 0} buổi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Class Details Sidebar */}
          <div className='space-y-6'>
            <Card className='bg-card/80 backdrop-blur-sm border shadow-xl'>
              <CardHeader>
                <CardTitle className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <Users className='h-5 w-5 text-primary-foreground' />
                  </div>
                  Thông tin lớp học
                </CardTitle>
              </CardHeader>{" "}
              <CardContent className='space-y-4'>
                <div className='flex justify-between items-center p-3 bg-muted/50 rounded-lg'>
                  <span className='text-sm font-medium'>Số học viên</span>
                  <span className='font-bold text-lg'>
                    {classData.member?.length || 0}
                  </span>
                </div>

                <div className='flex justify-between items-center p-3 bg-muted/50 rounded-lg'>
                  <span className='text-sm font-medium'>Số giảng viên</span>
                  <span className='font-bold text-lg'>
                    {classData.instructor?.length || 0}
                  </span>
                </div>

                <div className='flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                  <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                    Tổng số buổi học
                  </span>
                  <span className='font-bold text-lg text-blue-600 dark:text-blue-400'>
                    {classData.total_schedules || 0}
                  </span>
                </div>

                <div className='flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg'>
                  <span className='text-sm font-medium text-green-700 dark:text-green-300'>
                    Buổi học đã qua
                  </span>
                  <span className='font-bold text-lg text-green-600 dark:text-green-400'>
                    {classData.schedule_passed || 0}
                  </span>
                </div>

                <div className='flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg'>
                  <span className='text-sm font-medium text-amber-700 dark:text-amber-300'>
                    Buổi học còn lại
                  </span>
                  <span className='font-bold text-lg text-amber-600 dark:text-amber-400'>
                    {classData.schedule_left || 0}
                  </span>
                </div>

                <div className='border-t pt-4'>
                  <h4 className='font-semibold mb-2'>Ngày tạo</h4>
                  <p className='text-sm text-muted-foreground'>
                    {formatDate(classData.created_at)}
                  </p>
                </div>

                <div>
                  <h4 className='font-semibold mb-2'>Cập nhật lần cuối</h4>
                  <p className='text-sm text-muted-foreground'>
                    {formatDate(classData.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className='bg-card/80 backdrop-blur-sm border shadow-xl'>
              <CardHeader>
                <CardTitle className='text-lg'>Thao tác nhanh</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <Button
                  className='w-full'
                  variant='outline'
                >
                  <Users className='mr-2 h-4 w-4' />
                  Xem danh sách học viên
                </Button>
                <Button
                  className='w-full'
                  variant='outline'
                >
                  <User className='mr-2 h-4 w-4' />
                  Xem giảng viên
                </Button>
                <Button
                  className='w-full'
                  variant='outline'
                >
                  <Calendar className='mr-2 h-4 w-4' />
                  Xem lịch học
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
