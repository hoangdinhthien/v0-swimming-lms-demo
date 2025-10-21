"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  BookOpen,
  User,
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { fetchStaffData } from "@/api/staff-data/staff-data-api";
import { getMediaDetails } from "@/api/media-api";

function UserAvatar({
  user,
  className = "h-12 w-12",
}: {
  user: any;
  className?: string;
}) {
  const [avatarSrc, setAvatarSrc] = useState("/placeholder.svg");
  useEffect(() => {
    const loadAvatar = async () => {
      const userData = user?.user || user;
      const featuredImage = userData?.featured_image;
      if (featuredImage) {
        let imagePath = null;

        // Handle different featured_image structures (same as staff student detail)
        if (Array.isArray(featuredImage) && featuredImage.length > 0) {
          const firstImage = featuredImage[0];
          if (firstImage?.path) {
            if (Array.isArray(firstImage.path) && firstImage.path.length > 0) {
              imagePath = firstImage.path[0];
            } else if (typeof firstImage.path === "string") {
              imagePath = firstImage.path;
            }
          }
        } else if (typeof featuredImage === "object" && featuredImage.path) {
          if (
            Array.isArray(featuredImage.path) &&
            featuredImage.path.length > 0
          ) {
            imagePath = featuredImage.path[0];
          } else if (typeof featuredImage.path === "string") {
            imagePath = featuredImage.path;
          }
        } else if (typeof featuredImage === "string") {
          // Only try getMediaDetails if it's a string (media ID) and we have permission
          try {
            const mediaPath = await getMediaDetails(featuredImage);
            if (mediaPath) {
              imagePath = mediaPath;
            }
          } catch (error) {
            console.warn("Cannot fetch media details for staff user:", error);
          }
        }

        // If we found a valid image path, use it
        if (imagePath && imagePath.startsWith("http")) {
          setAvatarSrc(imagePath);
        }
      }
    };
    loadAvatar();
  }, [user]);
  return (
    <div
      className={`rounded-full overflow-hidden bg-muted flex items-center justify-center ${className}`}
    >
      <img
        src={avatarSrc}
        alt='avatar'
        className='object-cover w-full h-full'
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/placeholder.svg";
        }}
      />
    </div>
  );
}

export default function StaffClassDetailPage() {
  const params = useParams();
  const classId = params?.id as string;
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showStudentsDropdown, setShowStudentsDropdown] = useState(true);
  const [showInstructorsDropdown, setShowInstructorsDropdown] = useState(true);

  useEffect(() => {
    const loadClassDetails = async () => {
      if (!classId) {
        setError("Thiếu mã lớp học");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) throw new Error("Thiếu thông tin xác thực");
        const response = await fetchStaffData({
          module: "Class",
          tenantId,
          token,
          additionalParams: { id: classId },
        });
        const details = response?.data?.data?.[0];
        setClassData(details);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải thông tin lớp học"
        );
        setClassData(null);
      } finally {
        setLoading(false);
      }
    };
    loadClassDetails();
  }, [classId]);

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải chi tiết lớp học...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }
  if (error || !classData) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Card className='max-w-md mx-auto shadow-lg'>
          <CardContent className='p-8 text-center'>
            <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <User className='h-8 w-8 text-destructive' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              Không tìm thấy lớp học
            </h3>
            <p className='text-destructive mb-4'>{error}</p>
            <Link
              href='/dashboard/staff/classes'
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

  // UI giống manager, không có nút chỉnh sửa/lịch tự động
  return (
    <div className='min-h-screen bg-background animate-in fade-in duration-500'>
      <div className='max-w-none mx-auto px-6 py-6 space-y-8'>
        {/* Back Button */}
        <div className='flex items-center space-x-2 text-sm opacity-80 hover:opacity-100 transition-opacity'>
          <Link
            href={"/dashboard/staff/classes"}
            className='inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/10 px-2 py-1 rounded-md'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            Quay về danh sách
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
                {classData.course?.title}
              </p>
            </div>
            <Badge
              variant='default'
              className='bg-primary text-primary-foreground text-sm px-4 py-2'
            >
              {classData.course?.is_active
                ? "Đang hoạt động"
                : "Ngừng hoạt động"}
            </Badge>
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
                  <h3 className='text-xl font-bold mb-3 text-primary'>
                    {classData.course?.title}
                  </h3>
                  <h4 className='text-lg font-semibold mb-2'>Mô tả</h4>
                  <p className='text-muted-foreground leading-relaxed'>
                    {classData.course?.description}
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
                        {classData.course?.session_number} buổi
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
                        {classData.course?.session_number_duration}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Schedule Information */}
                <div data-section='schedule'>
                  <h3 className='text-lg font-semibold mb-4'>
                    Lịch học ({classData.total_schedules || 0} buổi)
                  </h3>
                  {classData.schedules && classData.schedules.length > 0 ? (
                    <div className='space-y-3 max-h-64 overflow-y-auto'>
                      {classData.schedules.map((schedule: any) => (
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
                                Slot: {schedule.slot?.length || 0} khung giờ
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
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Students Section */}
                <div
                  className='space-y-2'
                  data-section='students'
                >
                  <div
                    className='flex justify-between items-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors'
                    onClick={() =>
                      setShowStudentsDropdown(!showStudentsDropdown)
                    }
                  >
                    <span className='text-sm font-medium flex items-center gap-2'>
                      <Users className='h-4 w-4' />
                      Số học viên
                    </span>
                    <div className='flex items-center gap-2'>
                      <span className='font-bold text-lg'>
                        {classData.member?.length || 0}
                      </span>
                      {showStudentsDropdown ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </div>
                  </div>
                  {showStudentsDropdown &&
                    classData.member &&
                    classData.member.length > 0 && (
                      <div className='bg-background border rounded-xl p-4 space-y-3 max-h-80 overflow-y-auto shadow-sm'>
                        {classData.member.map((student: any, index: number) => (
                          <div
                            key={student._id || index}
                            className='flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-muted'
                          >
                            <UserAvatar
                              user={student}
                              className='h-12 w-12 ring-2 ring-background shadow-md'
                            />
                            <div className='flex-1 min-w-0 space-y-1'>
                              <p className='font-semibold text-base truncate group-hover:text-primary transition-colors'>
                                {student.username}
                              </p>
                              <div className='flex flex-col gap-1'>
                                {student.email && (
                                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                    <Mail className='h-3.5 w-3.5 flex-shrink-0' />
                                    <span className='truncate'>
                                      {student.email}
                                    </span>
                                  </div>
                                )}
                                {student.phone && (
                                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                    <Phone className='h-3.5 w-3.5 flex-shrink-0' />
                                    <span>{student.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className='flex flex-col items-end gap-2'>
                              <div className='flex items-center gap-2'>
                                <div
                                  className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                                    student.is_active
                                      ? "bg-green-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                                <span className='text-xs font-medium text-muted-foreground'>
                                  {student.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>

                {/* Instructor Section */}
                <div
                  className='space-y-2'
                  data-section='instructors'
                >
                  <div
                    className='flex justify-between items-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors'
                    onClick={() =>
                      setShowInstructorsDropdown(!showInstructorsDropdown)
                    }
                  >
                    <span className='text-sm font-medium flex items-center gap-2'>
                      <GraduationCap className='h-4 w-4' />
                      Giảng viên
                    </span>
                    <div className='flex items-center gap-2'>
                      <span className='font-bold text-lg'>
                        {Array.isArray(classData.instructor)
                          ? classData.instructor.length
                          : classData.instructor
                          ? 1
                          : 0}
                      </span>
                      {showInstructorsDropdown ? (
                        <ChevronUp className='h-4 w-4' />
                      ) : (
                        <ChevronDown className='h-4 w-4' />
                      )}
                    </div>
                  </div>
                  {showInstructorsDropdown && classData.instructor && (
                    <div className='bg-background border rounded-xl p-4 space-y-3 shadow-sm'>
                      {Array.isArray(classData.instructor) ? (
                        classData.instructor.map(
                          (instructor: any, index: number) => (
                            <div
                              key={instructor._id || index}
                              className='flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-muted'
                            >
                              <UserAvatar
                                user={instructor}
                                className='h-12 w-12 ring-2 ring-background shadow-md'
                              />
                              <div className='flex-1 min-w-0 space-y-1'>
                                <p className='font-semibold text-base truncate group-hover:text-primary transition-colors'>
                                  {instructor.username}
                                </p>
                                <div className='flex flex-col gap-1'>
                                  {instructor.email && (
                                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                      <Mail className='h-3.5 w-3.5 flex-shrink-0' />
                                      <span className='truncate'>
                                        {instructor.email}
                                      </span>
                                    </div>
                                  )}
                                  {instructor.phone && (
                                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                      <Phone className='h-3.5 w-3.5 flex-shrink-0' />
                                      <span>{instructor.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className='flex flex-col items-end gap-2'>
                                <div className='flex items-center gap-2'>
                                  <div
                                    className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                                      instructor.is_active
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                    }`}
                                  />
                                  <span className='text-xs font-medium text-muted-foreground'>
                                    {instructor.is_active
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className='flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-muted'>
                          <UserAvatar
                            user={classData.instructor}
                            className='h-12 w-12 ring-2 ring-background shadow-md'
                          />
                          <div className='flex-1 min-w-0 space-y-1'>
                            <p className='font-semibold text-base truncate group-hover:text-primary transition-colors'>
                              {classData.instructor?.username}
                            </p>
                            <div className='flex flex-col gap-1'>
                              {classData.instructor?.email && (
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                  <Mail className='h-3.5 w-3.5 flex-shrink-0' />
                                  <span className='truncate'>
                                    {classData.instructor.email}
                                  </span>
                                </div>
                              )}
                              {classData.instructor?.phone && (
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                  <Phone className='h-3.5 w-3.5 flex-shrink-0' />
                                  <span>{classData.instructor.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className='flex flex-col items-end gap-2'>
                            <div className='flex items-center gap-2'>
                              <div
                                className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                                  classData.instructor?.is_active
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />
                              <span className='text-xs font-medium text-muted-foreground'>
                                {classData.instructor?.is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                    Buổi học đã học qua
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
                    {classData.created_at
                      ? new Date(classData.created_at).toLocaleDateString(
                          "vi-VN",
                          { year: "numeric", month: "long", day: "numeric" }
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <h4 className='font-semibold mb-2'>Cập nhật lần cuối</h4>
                  <p className='text-sm text-muted-foreground'>
                    {classData.updated_at
                      ? new Date(classData.updated_at).toLocaleDateString(
                          "vi-VN",
                          { year: "numeric", month: "long", day: "numeric" }
                        )
                      : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
