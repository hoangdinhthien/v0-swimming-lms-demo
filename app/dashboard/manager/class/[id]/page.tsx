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
  Edit,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  CalendarPlus,
  Settings,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchClassDetails,
  updateClass,
  type ClassDetails,
  type UpdateClassData,
} from "@/api/manager/class-api";
import { fetchCourses } from "@/api/manager/courses-api";
import { fetchInstructors } from "@/api/manager/instructors-api";
import { fetchOrdersForCourse, type Order } from "@/api/manager/orders-api";
import { fetchStudentsByCourseOrder } from "@/api/manager/students-api";
import { getMediaDetails } from "@/api/media-api";
import {
  autoScheduleClass,
  type AutoScheduleRequest,
} from "@/api/manager/schedule-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getVietnameseDayFromDate } from "@/utils/date-utils";

// User Avatar Component with async image loading
function UserAvatar({
  user,
  className = "h-6 w-6",
}: {
  user: any;
  className?: string;
}) {
  const [avatarSrc, setAvatarSrc] = useState("/placeholder.svg");

  useEffect(() => {
    const loadAvatar = async () => {
      // Handle different user data structures (user.user or direct user)
      const userData = user?.user || user;
      const featuredImage = userData?.featured_image;

      if (featuredImage) {
        let imagePath = null;

        // Handle different featured_image structures
        if (Array.isArray(featuredImage) && featuredImage.length > 0) {
          // Case: [{"path": ["url"]}] or [{"path": "url"}] or ["media_id"]
          const firstImage = featuredImage[0];
          if (typeof firstImage === "string") {
            // It's a media ID
            imagePath = await getMediaDetails(firstImage);
          } else if (firstImage?.path) {
            if (Array.isArray(firstImage.path)) {
              imagePath = firstImage.path[0]; // Get first URL from array
            } else {
              imagePath = firstImage.path; // Direct string URL
            }
          }
        } else if (typeof featuredImage === "string") {
          // Case: "media_id" or direct URL
          if (featuredImage.startsWith("http")) {
            imagePath = featuredImage;
          } else {
            // It's a media ID, fetch the path
            imagePath = await getMediaDetails(featuredImage);
          }
        } else if (
          featuredImage?.path &&
          typeof featuredImage.path === "string"
        ) {
          // Case: {"path": "url"}
          imagePath = featuredImage.path;
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
    <Avatar className={className}>
      <AvatarImage src={avatarSrc} />
      <AvatarFallback>
        {(user?.user?.username || user?.username)?.charAt(0)?.toUpperCase() ||
          "U"}
      </AvatarFallback>
    </Avatar>
  );
}

export default function ClassDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const classroomId = params?.id as string;
  const from = searchParams.get("from"); // Get the 'from' parameter

  const [classData, setClassData] = useState<ClassDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    course: "",
    name: "",
    instructor: "",
    member: [] as string[],
  });

  // Auto schedule modal state
  const [isAutoScheduleModalOpen, setIsAutoScheduleModalOpen] = useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [autoScheduleData, setAutoScheduleData] = useState({
    min_time: 7,
    max_time: 18,
    session_in_week: 3,
    array_number_in_week: [] as number[],
  });

  // Dropdown data
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [ordersWithUsers, setOrdersWithUsers] = useState<Order[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // State for dropdown toggles
  const [showStudentsDropdown, setShowStudentsDropdown] = useState(true);
  const [showInstructorsDropdown, setShowInstructorsDropdown] = useState(true);

  const { toast } = useToast();

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

  // Load dropdown data for edit modal
  const loadEditData = async () => {
    setLoadingData(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token || !classData) return;

      const [coursesData, instructorsData, studentsData] = await Promise.all([
        fetchCourses({ tenantId, token }),
        fetchInstructors({ tenantId, token }),
        fetchStudentsByCourseOrder({
          courseId: classData.course._id,
          tenantId,
          token,
        }),
      ]);

      setCourses(coursesData.data || []);
      setInstructors(instructorsData || []);
      setStudents(studentsData || []);

      console.log("[loadEditData] Students loaded:", studentsData);
      console.log("[loadEditData] Instructors loaded:", instructorsData);
      console.log(
        "[loadEditData] Current formData.instructor:",
        formData.instructor
      );
    } catch (error) {
      console.error("Error loading edit data:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải dữ liệu cho form chỉnh sửa",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Handle opening edit modal
  const handleEditClick = async () => {
    if (classData) {
      // Extract instructor user ID properly
      let instructorId = "";
      if (typeof classData.instructor === "string") {
        instructorId = classData.instructor;
      } else if (
        Array.isArray(classData.instructor) &&
        classData.instructor.length > 0
      ) {
        // If it's an array, get the first instructor's user ID
        const firstInstructor = classData.instructor[0];
        instructorId =
          typeof firstInstructor === "string"
            ? firstInstructor
            : firstInstructor._id || firstInstructor.user?._id || "";
      } else if (
        classData.instructor &&
        typeof classData.instructor === "object"
      ) {
        // If it's a single instructor object, get the user ID
        instructorId =
          (classData.instructor as any)._id ||
          (classData.instructor as any).user?._id ||
          "";
      }

      console.log(
        "[handleEditClick] classData.instructor:",
        classData.instructor
      );
      console.log("[handleEditClick] extracted instructorId:", instructorId);

      setFormData({
        course: classData.course._id || "",
        name: classData.name || "",
        instructor: instructorId,
        member: Array.isArray(classData.member)
          ? classData.member
              .map((m: any) => (typeof m === "string" ? m : m._id))
              .filter(Boolean)
          : [],
      });
      setIsEditModalOpen(true);
      await loadEditData();
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle member selection
  const handleMemberToggle = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      member: prev.member.includes(memberId)
        ? prev.member.filter((id) => id !== memberId)
        : [...prev.member, memberId],
    }));
  };

  // Handle form submission
  const handleSaveClass = async () => {
    try {
      setIsSaving(true);
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      if (!classroomId) {
        throw new Error("Thiếu ID lớp học");
      }

      const updateData: UpdateClassData = {
        course: formData.course,
        name: formData.name,
        instructor: formData.instructor,
        member: formData.member,
      };

      console.log("Sending update data:", updateData);
      console.log("Form data state:", formData);

      await updateClass(classroomId, updateData, tenantId, token);

      // Refresh class data
      const updatedClass = await fetchClassDetails(
        classroomId,
        tenantId,
        token
      );
      setClassData(updatedClass);

      setIsEditModalOpen(false);
      toast({
        title: "Thành công",
        description: "Lớp học đã được cập nhật thành công",
      });
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật lớp học",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle auto schedule modal
  const handleAutoScheduleClick = () => {
    setAutoScheduleData({
      min_time: 7,
      max_time: 18,
      session_in_week: 3,
      array_number_in_week: [],
    });
    setIsAutoScheduleModalOpen(true);
  };

  // Handle auto schedule form changes
  const handleAutoScheduleChange = (
    field: keyof typeof autoScheduleData,
    value: any
  ) => {
    setAutoScheduleData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle day selection for auto schedule
  const handleDayToggle = (dayIndex: number) => {
    setAutoScheduleData((prev) => {
      const newDays = prev.array_number_in_week.includes(dayIndex)
        ? prev.array_number_in_week.filter((day) => day !== dayIndex)
        : [...prev.array_number_in_week, dayIndex].sort((a, b) => a - b);

      return {
        ...prev,
        array_number_in_week: newDays,
        session_in_week: newDays.length, // Auto update session_in_week to match
      };
    });
  };

  // Handle auto schedule submission
  const handleAutoSchedule = async () => {
    try {
      setIsAutoScheduling(true);

      // Validate form data
      if (autoScheduleData.min_time >= autoScheduleData.max_time) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
        });
        return;
      }

      if (autoScheduleData.array_number_in_week.length === 0) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Vui lòng chọn ít nhất một ngày trong tuần",
        });
        return;
      }

      if (
        autoScheduleData.session_in_week !==
        autoScheduleData.array_number_in_week.length
      ) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Số buổi học trong tuần phải bằng với số ngày được chọn",
        });
        return;
      }

      const requestData: AutoScheduleRequest = {
        min_time: autoScheduleData.min_time,
        max_time: autoScheduleData.max_time,
        session_in_week: autoScheduleData.session_in_week,
        array_number_in_week: autoScheduleData.array_number_in_week,
        class_id: classroomId,
      };

      console.log("🔍 Auto Schedule Request Data:", requestData);
      console.log("📅 Selected days breakdown:");
      requestData.array_number_in_week.forEach((day) => {
        const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        const vietnameseDayNames = [
          "Thứ 2",
          "Thứ 3",
          "Thứ 4",
          "Thứ 5",
          "Thứ 6",
          "Thứ 7",
          "Chủ nhật",
        ];
        console.log(`  ${day} = ${dayNames[day]} (${vietnameseDayNames[day]})`);
      });

      const result = await autoScheduleClass(requestData);

      toast({
        title: "Thành công",
        description: "Đã tự động xếp lịch học cho lớp thành công",
      });

      // Refresh class data to show new schedules
      const updatedClass = await fetchClassDetails(classroomId);
      setClassData(updatedClass);

      setIsAutoScheduleModalOpen(false);
    } catch (error: any) {
      console.error("Error auto scheduling class:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể tự động xếp lịch học",
      });
    } finally {
      setIsAutoScheduling(false);
    }
  };

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

  // Format schedule date using UTC to avoid timezone issues
  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth(); // 0-11
    const day = date.getUTCDate();

    // Use UTC date to get Vietnamese day name
    const vietnameseDay = getVietnameseDayFromDate(dateString);

    const monthNames = [
      "thg 1",
      "thg 2",
      "thg 3",
      "thg 4",
      "thg 5",
      "thg 6",
      "thg 7",
      "thg 8",
      "thg 9",
      "thg 10",
      "thg 11",
      "thg 12",
    ];

    return `${vietnameseDay}, ${day} ${monthNames[month]}`;
  };
  return (
    <div className='min-h-screen bg-background animate-in fade-in duration-500'>
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
              <Button
                onClick={handleEditClick}
                variant='outline'
                className='inline-flex items-center gap-2 transition-colors duration-200 px-4 py-2 rounded-lg font-medium'
              >
                <Edit className='h-4 w-4' />
                Chỉnh sửa lớp học
              </Button>
              {/* Auto Schedule Button - Show if class has missing sessions or no schedules */}
              {((classData.sessions_remaining &&
                classData.sessions_remaining > 0) ||
                (classData.schedules && classData.schedules.length === 0)) && (
                <Button
                  onClick={handleAutoScheduleClick}
                  className='inline-flex items-center gap-2 bg-green-600 text-white hover:bg-green-700 transition-colors duration-200 px-4 py-2 rounded-lg font-medium'
                >
                  <CalendarPlus className='h-4 w-4' />
                  Tự động xếp lịch học
                </Button>
              )}
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
                  <h3 className='text-xl font-bold mb-3 text-primary'>
                    {classData.course.title}
                  </h3>
                  <h4 className='text-lg font-semibold mb-2'>Mô tả</h4>
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
                <div data-section='schedule'>
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
                                {formatScheduleDate(schedule.date)}
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

                    <div className='flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg'>
                      <div className='p-2 bg-red-600 rounded-lg'>
                        <BookOpen className='h-4 w-4 text-white' />
                      </div>
                      <div>
                        <p className='text-sm text-red-700 dark:text-red-300'>
                          Buổi học còn thiếu
                        </p>
                        <p className='font-semibold text-red-600 dark:text-red-400'>
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
                          <Link
                            key={student._id || index}
                            href={`/dashboard/manager/students/${student._id}`}
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
                          </Link>
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
                            <Link
                              key={instructor._id || index}
                              href={`/dashboard/manager/instructors/${instructor._id}`}
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
                            </Link>
                          )
                        )
                      ) : (
                        <Link
                          href={`/dashboard/manager/instructors/${
                            (classData.instructor as any)._id
                          }`}
                          className='flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-muted'
                        >
                          <UserAvatar
                            user={classData.instructor}
                            className='h-12 w-12 ring-2 ring-background shadow-md'
                          />
                          <div className='flex-1 min-w-0 space-y-1'>
                            <p className='font-semibold text-base truncate group-hover:text-primary transition-colors'>
                              {(classData.instructor as any).username}
                            </p>
                            <div className='flex flex-col gap-1'>
                              {(classData.instructor as any).email && (
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                  <Mail className='h-3.5 w-3.5 flex-shrink-0' />
                                  <span className='truncate'>
                                    {(classData.instructor as any).email}
                                  </span>
                                </div>
                              )}
                              {(classData.instructor as any).phone && (
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                  <Phone className='h-3.5 w-3.5 flex-shrink-0' />
                                  <span>
                                    {(classData.instructor as any).phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className='flex flex-col items-end gap-2'>
                            <div className='flex items-center gap-2'>
                              <div
                                className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                                  (classData.instructor as any).is_active
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />
                              <span className='text-xs font-medium text-muted-foreground'>
                                {(classData.instructor as any).is_active
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </Link>
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
                  onClick={() => {
                    setShowStudentsDropdown(true);
                    if (classData.member && classData.member.length > 0) {
                      // Scroll to students section after a short delay
                      setTimeout(() => {
                        const element = document.querySelector(
                          '[data-section="students"]'
                        );
                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }, 100);
                    } else {
                      toast({
                        title: "Thông báo",
                        description: "Lớp học này chưa có học viên nào",
                        variant: "default",
                      });
                    }
                  }}
                >
                  <Users className='mr-2 h-4 w-4' />
                  Xem danh sách học viên
                </Button>
                <Button
                  className='w-full'
                  variant='outline'
                  onClick={() => {
                    setShowInstructorsDropdown(true);
                    if (classData.instructor) {
                      // Scroll to instructors section after a short delay
                      setTimeout(() => {
                        const element = document.querySelector(
                          '[data-section="instructors"]'
                        );
                        if (element) {
                          element.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }, 100);
                    } else {
                      toast({
                        title: "Thông báo",
                        description: "Lớp học này chưa có giảng viên nào",
                        variant: "default",
                      });
                    }
                  }}
                >
                  <User className='mr-2 h-4 w-4' />
                  Xem giảng viên
                </Button>
                <Button
                  className='w-full'
                  variant='outline'
                  onClick={() => {
                    // Scroll to schedule section
                    const element = document.querySelector(
                      '[data-section="schedule"]'
                    );
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }}
                >
                  <Calendar className='mr-2 h-4 w-4' />
                  Xem lịch học
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Class Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      >
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lớp học</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin lớp học. Tất cả thay đổi sẽ được lưu ngay lập
              tức.
            </DialogDescription>
          </DialogHeader>

          {loadingData ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-8 w-8 animate-spin' />
              <span className='ml-2'>Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Class Name */}
              <div className='space-y-2'>
                <Label htmlFor='name'>Tên lớp học *</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder='Nhập tên lớp học'
                />
              </div>

              {/* Course Selection */}
              <div className='space-y-2'>
                <Label htmlFor='course'>Khóa học *</Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) => handleInputChange("course", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn khóa học' />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem
                        key={course._id}
                        value={course._id}
                      >
                        <div className='flex items-center gap-2'>
                          <span>{course.title}</span>
                          <Badge
                            variant='outline'
                            className='text-xs'
                          >
                            {course.price?.toLocaleString()}₫
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Instructor Selection */}
              <div className='space-y-2'>
                <Label htmlFor='instructor'>Giảng viên *</Label>
                <Select
                  value={formData.instructor}
                  onValueChange={(value) =>
                    handleInputChange("instructor", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn giảng viên' />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem
                        key={instructor._id}
                        value={instructor._id}
                      >
                        <div className='flex items-center gap-2'>
                          <UserAvatar
                            user={instructor}
                            className='h-6 w-6'
                          />
                          <span>{instructor.username}</span>
                          <span className='text-muted-foreground text-sm'>
                            ({instructor.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Students Selection */}
              <div className='space-y-4'>
                <Label>Học viên ({formData.member.length} đã chọn)</Label>
                <div className='border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2'>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <div
                        key={student._id}
                        className='flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-lg'
                      >
                        <Checkbox
                          id={student.user._id}
                          checked={formData.member.includes(student.user._id)}
                          onCheckedChange={() =>
                            handleMemberToggle(student.user._id)
                          }
                        />
                        <UserAvatar
                          user={student.user}
                          className='h-8 w-8'
                        />
                        <div className='flex-1'>
                          <p className='font-medium'>{student.user.username}</p>
                          <p className='text-sm text-muted-foreground'>
                            {student.user.email}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className='text-muted-foreground text-center py-4'>
                      Không có học viên nào đã thanh toán khóa học này
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveClass}
              disabled={
                isSaving ||
                !formData.name.trim() ||
                !formData.course ||
                !formData.instructor
              }
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

      {/* Auto Schedule Modal */}
      <Dialog
        open={isAutoScheduleModalOpen}
        onOpenChange={setIsAutoScheduleModalOpen}
      >
        <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-2xl'>
              <CalendarPlus className='h-6 w-6 text-green-600' />
              Tự động xếp lịch học cho lớp
            </DialogTitle>
            <DialogDescription className='text-base'>
              Hệ thống sẽ tự động sắp xếp lịch học dựa trên thời gian và ngày
              bạn chọn
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* BEFORE/AFTER Comparison */}
            <div className='grid grid-cols-2 gap-4'>
              {/* HIỆN TẠI */}
              <div className='border rounded-lg p-4 bg-muted/30'>
                <div className='flex items-center gap-2 mb-3'>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                  <h3 className='font-semibold text-base'>HIỆN TẠI</h3>
                </div>
                <div className='space-y-3'>
                  <div>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Khóa học yêu cầu
                    </p>
                    <p className='text-2xl font-bold'>
                      {classData?.course.session_number || 0}
                      <span className='text-base text-muted-foreground ml-2'>
                        buổi học
                      </span>
                    </p>
                  </div>
                  <div className='border-t pt-3'>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Đã xếp lịch
                    </p>
                    <p className='text-2xl font-bold'>
                      {classData?.total_schedules || 0}
                      <span className='text-base text-muted-foreground ml-2'>
                        buổi
                      </span>
                    </p>
                  </div>
                  {classData?.sessions_remaining &&
                    classData.sessions_remaining > 0 && (
                      <div className='bg-muted p-3 rounded-lg border'>
                        <p className='text-sm text-muted-foreground font-medium'>
                          ⚠️ Còn thiếu
                        </p>
                        <p className='text-xl font-bold'>
                          {classData.sessions_remaining} buổi
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* SAU KHI TỰ ĐỘNG XẾP LỊCH */}
              <div className='border rounded-lg p-4 bg-muted/30'>
                <div className='flex items-center gap-2 mb-3'>
                  <CheckCircle2 className='h-4 w-4 text-muted-foreground' />
                  <h3 className='font-semibold text-base'>
                    SAU KHI TỰ ĐỘNG XẾP
                  </h3>
                </div>
                <div className='space-y-3'>
                  <div>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Khóa học yêu cầu
                    </p>
                    <p className='text-2xl font-bold'>
                      {classData?.course.session_number || 0}
                      <span className='text-base text-muted-foreground ml-2'>
                        buổi học
                      </span>
                    </p>
                  </div>
                  <div className='border-t pt-3'>
                    <p className='text-sm text-muted-foreground mb-1'>
                      Sẽ được xếp lịch
                    </p>
                    <p className='text-2xl font-bold'>
                      {classData?.course.session_number || 0}
                      <span className='text-base text-muted-foreground ml-2'>
                        buổi
                      </span>
                    </p>
                  </div>
                  <div className='bg-muted p-3 rounded-lg border'>
                    <p className='text-sm text-muted-foreground font-medium'>
                      ✅ Trạng thái
                    </p>
                    <p className='text-base font-semibold'>Đủ lịch học</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className='bg-muted/50 border rounded-lg p-4'>
              <div className='flex gap-3'>
                <Settings className='h-5 w-5 text-muted-foreground mt-0.5' />
                <div className='flex-1'>
                  <h4 className='font-semibold mb-2'>Hệ thống sẽ tự động:</h4>
                  <ul className='space-y-1 text-sm text-muted-foreground'>
                    <li>• Tìm khung giờ phù hợp trong thời gian bạn chọn</li>

                    <li>• Xếp lịch đều đặn theo các ngày trong tuần</li>
                    <li>• Đảm bảo không trùng lịch với các lớp khác</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className='border rounded-lg p-4'>
              <h3 className='font-semibold text-base mb-4 flex items-center gap-2'>
                <Settings className='h-4 w-4' />
                Thiết lập thời gian học
              </h3>

              {/* Time Range */}
              <div className='space-y-4'>
                <div>
                  <Label className='font-medium mb-2 block'>
                    🕐 Khung giờ học trong ngày
                  </Label>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Chọn khoảng thời gian trong ngày mà lớp có thể học
                  </p>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label
                        htmlFor='min_time'
                        className='text-sm'
                      >
                        Từ giờ
                      </Label>
                      <Select
                        value={autoScheduleData.min_time.toString()}
                        onValueChange={(value) =>
                          handleAutoScheduleChange("min_time", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Chọn giờ bắt đầu' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 7).map(
                            (hour) => (
                              <SelectItem
                                key={hour}
                                value={hour.toString()}
                              >
                                {hour}:00
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <Label
                        htmlFor='max_time'
                        className='text-sm'
                      >
                        Đến giờ
                      </Label>
                      <Select
                        value={autoScheduleData.max_time.toString()}
                        onValueChange={(value) =>
                          handleAutoScheduleChange("max_time", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Chọn giờ kết thúc' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 7).map(
                            (hour) => (
                              <SelectItem
                                key={hour}
                                value={hour.toString()}
                              >
                                {hour}:00
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Days of Week Selection */}
                <div className='pt-4 border-t'>
                  <Label className='font-medium mb-2 block'>
                    Chọn các ngày trong tuần *
                  </Label>
                  <p className='text-sm text-muted-foreground mb-3'>
                    Chọn những ngày nào trong tuần mà lớp sẽ học
                  </p>
                  <div className='grid grid-cols-7 gap-2'>
                    {[
                      { label: "T2", fullLabel: "Thứ 2 (Monday)", value: 0 },
                      { label: "T3", fullLabel: "Thứ 3 (Tuesday)", value: 1 },
                      { label: "T4", fullLabel: "Thứ 4 (Wednesday)", value: 2 },
                      { label: "T5", fullLabel: "Thứ 5 (Thursday)", value: 3 },
                      { label: "T6", fullLabel: "Thứ 6 (Friday)", value: 4 },
                      { label: "T7", fullLabel: "Thứ 7 (Saturday)", value: 5 },
                      { label: "CN", fullLabel: "Chủ nhật (Sunday)", value: 6 },
                    ].map((day) => (
                      <div
                        key={day.value}
                        className={`
                          border rounded p-2 cursor-pointer transition-all text-center
                          ${
                            autoScheduleData.array_number_in_week.includes(
                              day.value
                            )
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }
                        `}
                        onClick={() => handleDayToggle(day.value)}
                      >
                        <Checkbox
                          id={`day-${day.value}`}
                          checked={autoScheduleData.array_number_in_week.includes(
                            day.value
                          )}
                          onCheckedChange={() => handleDayToggle(day.value)}
                          className='mx-auto mb-1'
                        />
                        <Label
                          htmlFor={`day-${day.value}`}
                          className='text-sm font-medium block cursor-pointer'
                        >
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className='text-sm text-muted-foreground mt-3'>
                    Số buổi học/tuần:{" "}
                    {autoScheduleData.array_number_in_week.length} buổi
                  </p>
                </div>
              </div>
            </div>

            {/* Preview/Summary Box */}
            {autoScheduleData.array_number_in_week.length > 0 && (
              <div className='bg-muted/50 border rounded-lg p-4'>
                <h4 className='font-semibold mb-3'>Tóm tắt:</h4>
                <div className='space-y-2 text-sm'>
                  <div className='flex items-start gap-2'>
                    <span className='text-muted-foreground min-w-[100px]'>
                      Khung giờ:
                    </span>
                    <span className='font-medium'>
                      {autoScheduleData.min_time}:00 -{" "}
                      {autoScheduleData.max_time}:00
                    </span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <span className='text-muted-foreground min-w-[100px]'>
                      Số buổi/tuần:
                    </span>
                    <span className='font-medium'>
                      {autoScheduleData.array_number_in_week.length} buổi
                    </span>
                  </div>
                  <div className='flex items-start gap-2'>
                    <span className='text-muted-foreground min-w-[100px]'>
                      Ngày học:
                    </span>
                    <span className='font-medium'>
                      {autoScheduleData.array_number_in_week
                        .sort((a, b) => a - b)
                        .map((day) => {
                          const dayNames = [
                            "Thứ 2", // 0 = Monday
                            "Thứ 3", // 1 = Tuesday
                            "Thứ 4", // 2 = Wednesday
                            "Thứ 5", // 3 = Thursday
                            "Thứ 6", // 4 = Friday
                            "Thứ 7", // 5 = Saturday
                            "Chủ nhật", // 6 = Sunday
                          ];
                          return dayNames[day];
                        })
                        .join(", ")}
                    </span>
                  </div>
                  {classData?.sessions_remaining &&
                    classData.sessions_remaining > 0 && (
                      <div className='flex items-start gap-2'>
                        <span className='text-muted-foreground min-w-[100px]'>
                          Số buổi học còn thiếu:
                        </span>
                        <span className='font-medium'>
                          {classData.sessions_remaining} buổi
                        </span>
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsAutoScheduleModalOpen(false)}
              disabled={isAutoScheduling}
            >
              Hủy
            </Button>
            <Button
              onClick={handleAutoSchedule}
              disabled={
                isAutoScheduling ||
                autoScheduleData.array_number_in_week.length === 0 ||
                autoScheduleData.min_time >= autoScheduleData.max_time
              }
              className='bg-green-600 hover:bg-green-700'
            >
              {isAutoScheduling ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Đang xếp lịch...
                </>
              ) : (
                <>
                  <CalendarPlus className='h-4 w-4 mr-2' />
                  Tự động xếp lịch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
