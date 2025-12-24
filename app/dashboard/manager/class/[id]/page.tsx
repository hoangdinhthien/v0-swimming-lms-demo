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
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  CalendarPlus,
  Settings,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { useInstructorValidation } from "@/hooks/use-instructor-validation";
import PermissionGuard from "@/components/permission-guard";
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchClassDetails,
  updateClass,
  addMemberToClass,
  removeMemberFromClass,
  type ClassDetails,
  type UpdateClassData,
  updateClassGraduates,
} from "@/api/manager/class-api";
import { fetchCourses } from "@/api/manager/courses-api";
import { fetchInstructors } from "@/api/manager/instructors-api";
import { fetchOrdersForCourse, type Order } from "@/api/manager/orders-api";
import { fetchStudentsByCourseOrder } from "@/api/manager/students-api";
import { getMediaDetails } from "@/api/media-api";
// import {
//   autoScheduleClass,
//   type AutoScheduleRequest,
// } from "@/api/manager/schedule-api";
import { SchedulePreviewModal } from "@/components/manager/schedule-preview-modal";
import ScheduleDetailModal from "@/components/manager/schedule-detail-modal";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { getVietnameseDayFromDate } from "@/utils/date-utils";

// Removed UserAvatar component as user images are no longer displayed

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
    show_on_regist_course: false,
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

  // Schedule detail modal state
  const [isScheduleDetailModalOpen, setIsScheduleDetailModalOpen] =
    useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );

  // Schedule preview modal state
  const [isSchedulePreviewModalOpen, setIsSchedulePreviewModalOpen] =
    useState(false);

  // Member management modal state
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isManagingMembers, setIsManagingMembers] = useState(false);
  const [selectedMembersToAdd, setSelectedMembersToAdd] = useState<string[]>(
    []
  );
  const [selectedMembersToRemove, setSelectedMembersToRemove] = useState<
    string[]
  >([]);
  const [selectedGraduates, setSelectedGraduates] = useState<string[]>([]);
  const [isUpdatingGraduates, setIsUpdatingGraduates] = useState(false);

  // Active tab for member management modal
  const [activeTab, setActiveTab] = useState("add");

  // Dropdown data
  const [courses, setCourses] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [ordersWithUsers, setOrdersWithUsers] = useState<Order[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // State for dropdown toggles
  const [showStudentsDropdown, setShowStudentsDropdown] = useState(true);
  const [showInstructorsDropdown, setShowInstructorsDropdown] = useState(true);

  // Auth state for validation hook
  const [tenantId, setTenantId] = useState<string>("");
  const [token, setToken] = useState<string>("");

  const { hasPermission, isManager } = useStaffPermissions();
  const { toast } = useToast();

  // Check if user has full CRUD permissions for both Class and Schedule modules
  const hasFullSchedulePermissions = () => {
    if (isManager) return true;

    const classPermissions = ["GET", "POST", "PUT", "DELETE"].every((action) =>
      hasPermission("Class", action)
    );
    const schedulePermissions = ["GET", "POST", "PUT", "DELETE"].every(
      (action) => hasPermission("Schedule", action)
    );

    return classPermissions && schedulePermissions;
  };

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
          href: "/dashboard/manager/classes",
          text: "Quay về danh sách lớp học",
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

      const currentTenantId = getSelectedTenant();
      const currentToken = getAuthToken();

      if (currentTenantId) setTenantId(currentTenantId);
      if (currentToken) setToken(currentToken);

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
            : firstInstructor.user?._id || firstInstructor._id || "";
      } else if (
        classData.instructor &&
        typeof classData.instructor === "object"
      ) {
        // If it's a single instructor object, get the user ID
        instructorId =
          (classData.instructor as any).user?._id ||
          (classData.instructor as any)._id ||
          "";
      }

      setFormData({
        course: classData.course._id || "",
        name: classData.name || "",
        instructor: instructorId,
        member: Array.isArray(classData.member)
          ? classData.member
              .map((m: any) => (typeof m === "string" ? m : m._id))
              .filter(Boolean)
          : [],
        show_on_regist_course: classData.show_on_regist_course || false,
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

  // Handle form submission - only update basic class info (no member array)
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

      // Only send basic class info (no member array as per API requirement)
      const updateData = {
        course: formData.course,
        name: formData.name,
        instructor: formData.instructor,
        show_on_regist_course: formData.show_on_regist_course,
      };

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
        description: "Thông tin lớp học đã được cập nhật thành công",
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

  // Handle adding members to class
  const handleAddMembers = async (memberIds: string[]) => {
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token || !classroomId) {
        throw new Error("Thiếu thông tin xác thực");
      }

      await addMemberToClass(classroomId, memberIds, tenantId, token);

      // Refresh class data
      const updatedClass = await fetchClassDetails(
        classroomId,
        tenantId,
        token
      );
      setClassData(updatedClass);

      toast({
        title: "Thành công",
        description: `Đã thêm ${memberIds.length} học viên vào lớp`,
      });
    } catch (error: any) {
      console.error("Error adding members:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể thêm học viên vào lớp",
      });
    }
  };

  // Handle removing members from class
  const handleRemoveMembers = async (memberIds: string[]) => {
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token || !classroomId) {
        throw new Error("Thiếu thông tin xác thực");
      }

      await removeMemberFromClass(classroomId, memberIds, tenantId, token);

      // Refresh class data
      const updatedClass = await fetchClassDetails(
        classroomId,
        tenantId,
        token
      );
      setClassData(updatedClass);

      toast({
        title: "Thành công",
        description: `Đã xóa ${memberIds.length} học viên khỏi lớp`,
      });
    } catch (error: any) {
      console.error("Error removing members:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể xóa học viên khỏi lớp",
      });
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

  // Helper function: Convert JavaScript day (0=Sunday, 1=Monday...) to backend array_number_in_week
  // Based on today's day of week using formula: (selectedDay - todayDay + 7) % 7
  const convertJsDayToBackendDay = (jsDay: number): number => {
    const today = new Date();
    const todayDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    // Formula: (selectedDay - todayDay + 7) % 7
    // Examples:
    // Today=Monday(1), Selected=Monday(1): (1-1+7)%7 = 0
    // Today=Monday(1), Selected=Saturday(6): (6-1+7)%7 = 5
    // Today=Monday(1), Selected=Sunday(0): (0-1+7)%7 = 6
    return (jsDay - todayDay + 7) % 7;
  };

  // Handle day selection for auto schedule
  const handleDayToggle = (jsDay: number) => {
    // Convert JS day to backend day based on today
    const backendDay = convertJsDayToBackendDay(jsDay);

    setAutoScheduleData((prev) => {
      const newDays = prev.array_number_in_week.includes(backendDay)
        ? prev.array_number_in_week.filter((day) => day !== backendDay)
        : [...prev.array_number_in_week, backendDay].sort((a, b) => a - b);

      return {
        ...prev,
        array_number_in_week: newDays,
        session_in_week: newDays.length, // Auto update session_in_week to match
      };
    });
  };

  // Get selected course data for validation
  const selectedCourseDetails = courses.find((c) => c._id === formData.course);

  // Instructor Validation for Edit Form
  const { result: validationResult, loading: validatingInstructor } =
    useInstructorValidation({
      instructorId: formData.instructor,
      course: selectedCourseDetails,
      tenantId,
      token,
      skip:
        !isEditModalOpen ||
        !formData.instructor ||
        !selectedCourseDetails ||
        !tenantId ||
        !token,
    });

  const isEditFormValid =
    formData.name.trim() &&
    formData.course &&
    formData.instructor &&
    validationResult.isValid;

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

      const requestData = {
        min_time: autoScheduleData.min_time,
        max_time: autoScheduleData.max_time,
        session_in_week: autoScheduleData.session_in_week,
        array_number_in_week: autoScheduleData.array_number_in_week,
        class_id: classroomId,
      };

      // TODO: Update to use autoScheduleClassPreview + addClassToSchedule
      // const result = await autoScheduleClass(requestData);
      throw new Error(
        "autoScheduleClass API đã bị deprecated. Vui lòng sử dụng flow mới: Tạo lớp hàng loạt > Xếp lịch"
      );

      // UNREACHABLE CODE REMOVED:
      // toast({
      //   title: "Thành công",
      //   description: "Đã tự động xếp lịch học cho lớp thành công",
      // });

      // // Refresh class data to show new schedules
      // const updatedClass = await fetchClassDetails(classroomId);
      // setClassData(updatedClass);

      // setIsAutoScheduleModalOpen(false);
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

  // Handle opening member management modal
  const handleOpenMemberModal = async () => {
    const tenantId = getSelectedTenant();
    const token = getAuthToken();

    if (!tenantId || !token || !classData) return;

    setActiveTab("add");
    setIsMemberModalOpen(true);
    setLoadingData(true);

    try {
      // Fetch students who have paid for the course
      const studentsData = await fetchStudentsByCourseOrder({
        courseId: classData.course._id,
        tenantId,
        token,
      });
      setStudents(studentsData || []);

      // Reset selections
      setSelectedMembersToAdd([]);
      setSelectedMembersToRemove([]);
      setSelectedGraduates(classData.member_passed || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách học viên",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Handle opening schedule detail modal
  const handleScheduleClick = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setIsScheduleDetailModalOpen(true);
  };

  // Handle applying member changes
  const handleApplyMemberChanges = async () => {
    setIsManagingMembers(true);
    try {
      if (activeTab === "add" && selectedMembersToAdd.length > 0) {
        await handleAddMembers(selectedMembersToAdd);
      } else if (activeTab === "remove" && selectedMembersToRemove.length > 0) {
        await handleRemoveMembers(selectedMembersToRemove);
      }

      // Close modal and reset
      setIsMemberModalOpen(false);
      setSelectedMembersToAdd([]);
      setSelectedMembersToRemove([]);

      toast({
        title: "Thành công",
        description:
          activeTab === "add"
            ? "Đã thêm học viên vào lớp"
            : "Đã xóa học viên khỏi lớp",
      });
    } catch (error: any) {
      console.error("Error managing members:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error.message || "Không thể cập nhật học viên",
      });
    } finally {
      setIsManagingMembers(false);
    }
  };

  // Handle updating graduates
  const handleUpdateGraduates = async () => {
    setIsUpdatingGraduates(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token || !classroomId) {
        throw new Error("Thiếu thông tin xác thực");
      }

      await updateClassGraduates(
        classroomId,
        selectedGraduates,
        tenantId,
        token
      );

      // Refresh class data
      const updatedClass = await fetchClassDetails(
        classroomId,
        tenantId,
        token
      );
      setClassData(updatedClass);

      toast({
        title: "Thành công",
        description: "Đã cập nhật trạng thái tốt nghiệp",
      });
      setIsMemberModalOpen(false);
    } catch (error: any) {
      console.error("Error updating graduates:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error.message || "Không thể cập nhật trạng thái tốt nghiệp",
      });
    } finally {
      setIsUpdatingGraduates(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-muted opacity-20 blur-xl animate-pulse"></div>
              <Loader2 className="relative h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Đang tải thông tin lớp học
              </h3>
              <p className="text-muted-foreground">
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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-6 max-w-md">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-destructive/20 opacity-20 blur-xl"></div>
              <div className="relative h-16 w-16 mx-auto bg-destructive rounded-full flex items-center justify-center"></div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-destructive">
                Không thể tải thông tin lớp học
              </h3>
              <p className="text-muted-foreground bg-muted p-3 rounded-lg border">
                {error}
              </p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-6">
            <h3 className="text-xl font-semibold text-foreground">
              Không tìm thấy lớp học
            </h3>
            <p className="text-muted-foreground">
              Lớp học với ID {classroomId} không tồn tại.
            </p>
            <Link href={backLink.href}>
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
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
    <div className="min-h-screen bg-background animate-in fade-in duration-500">
      <div className="max-w-none mx-auto px-6 py-6 space-y-8">
        {/* Back Button */}
        <div className="flex items-center space-x-2 text-sm opacity-80 hover:opacity-100 transition-opacity">
          <Link
            href={backLink.href}
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/10 px-2 py-1 rounded-md"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            {backLink.text}
          </Link>
        </div>

        {/* Header */}
        <div className="relative group/card transition-all duration-500 ease-out hover:-translate-y-1">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[2rem] blur opacity-25 group-hover/card:opacity-75 transition duration-1000 group-hover/card:duration-200"></div>
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between p-8 bg-card/90 backdrop-blur-md border border-primary/10 rounded-2xl shadow-2xl transition-all duration-300 group-hover/card:shadow-primary/5 group-hover/card:border-primary/20">
            <div className="space-y-6 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Lớp học
                </Badge>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full animate-pulse ${
                      classData.course.is_active
                        ? "bg-emerald-500"
                        : "bg-rose-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      classData.course.is_active
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {classData.course.is_active
                      ? "Đang hoạt động"
                      : "Ngừng hoạt động"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.1] transition-all duration-300 group-hover/card:translate-x-1">
                  {classData.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center text-muted-foreground/80 font-medium transition-all duration-300 delay-75 group-hover/card:translate-x-1">
                    <GraduationCap className="h-5 w-5 mr-2 text-primary/60" />
                    <span className="text-lg">{classData.course.title}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-center md:self-start">
              <PermissionGuard module="Class" action="PUT">
                <Button
                  onClick={handleEditClick}
                  variant="outline"
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-xl font-medium border-primary/10 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  <Edit2 className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
              </PermissionGuard>
              <Button
                onClick={handleOpenMemberModal}
                variant="outline"
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl font-medium border-primary/10 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/20 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
              >
                <Users className="h-4 w-4" />
                Quản lý Học viên
              </Button>
              {/* Auto Schedule Button - Show if class has missing sessions or no schedules AND user has full permissions */}
              {((classData.sessions_remaining &&
                classData.sessions_remaining > 0) ||
                (classData.schedules && classData.schedules.length === 0)) &&
                hasFullSchedulePermissions() && (
                  <Button
                    onClick={() => setIsSchedulePreviewModalOpen(true)}
                    className="inline-flex items-center gap-2 h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 rounded-xl font-semibold transition-all duration-200"
                  >
                    <CalendarPlus className="h-4 w-4" />
                    Xếp lịch lớp học
                  </Button>
                )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Course Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Thông tin khóa học
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-primary">
                    {classData.course.title}
                  </h3>
                  <h4 className="text-lg font-semibold mb-2">Mô tả</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {classData.course.description}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-primary rounded-lg">
                      <Clock className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Số buổi học
                      </p>
                      <p className="font-semibold">
                        {classData.course.session_number} buổi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className="p-2 bg-primary rounded-lg">
                      <Calendar className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Thời lượng mỗi buổi
                      </p>
                      <p className="font-semibold">
                        {classData.course.session_number_duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Buổi học đã qua
                      </p>
                      <p className="font-semibold text-blue-600 dark:text-blue-400">
                        {classData.schedule_passed || 0} buổi
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <div className="p-2 bg-amber-600 rounded-lg">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Buổi học còn lại
                      </p>
                      <p className="font-semibold text-amber-600 dark:text-amber-400">
                        {classData.schedule_left || 0} buổi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Schedule Information */}
                <div data-section="schedule">
                  <h3 className="text-lg font-semibold mb-4">
                    Lịch học ({classData.total_schedules || 0} buổi)
                  </h3>
                  {classData.schedules && classData.schedules.length > 0 ? (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {classData.schedules.map((schedule) => (
                        <div
                          key={schedule._id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleScheduleClick(schedule._id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Calendar className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {formatScheduleDate(schedule.date)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Slot: {schedule.slot.length} khung giờ
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
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
                    <p className="text-muted-foreground italic text-center py-4">
                      Chưa có lịch học nào được lên lịch
                    </p>
                  )}
                </div>

                {/* Session Progress */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Tiến độ buổi học
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="p-2 bg-red-600 rounded-lg">
                        <Clock className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Buổi học vượt quá
                        </p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          {classData.sessions_exceeded || 0} buổi
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="p-2 bg-red-600 rounded-lg">
                        <BookOpen className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          Buổi học còn thiếu
                        </p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
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
          <div className="space-y-6">
            <Card className="bg-card/80 backdrop-blur-sm border shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-primary rounded-lg">
                    <Users className="h-5 w-5 text-primary-foreground" />
                  </div>
                  Thông tin lớp học
                </CardTitle>
              </CardHeader>{" "}
              <CardContent className="space-y-4">
                {/* Instructor Section */}
                <div className="space-y-2" data-section="instructors">
                  <div
                    className="flex justify-between items-center p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                    onClick={() =>
                      setShowInstructorsDropdown(!showInstructorsDropdown)
                    }
                  >
                    <span className="text-sm font-medium flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Huấn luyện viên
                    </span>
                    <div className="flex items-center gap-2">
                      {showInstructorsDropdown ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {showInstructorsDropdown && classData.instructor && (
                    <div className="bg-background border rounded-xl p-4 space-y-3 shadow-sm">
                      {Array.isArray(classData.instructor) ? (
                        classData.instructor.map(
                          (instructor: any, index: number) => (
                            <Link
                              key={instructor._id || index}
                              href={`/dashboard/manager/instructors/${instructor._id}`}
                              className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-muted"
                            >
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                                  {instructor.username}
                                </p>
                                <div className="flex flex-col gap-1">
                                  {instructor.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span className="truncate">
                                        {instructor.email}
                                      </span>
                                    </div>
                                  )}
                                  {instructor.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                      <span>{instructor.phone}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                                      instructor.is_active
                                        ? "bg-green-500"
                                        : "bg-gray-400"
                                    }`}
                                  />
                                  <span className="text-xs font-medium text-muted-foreground">
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
                          className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-xl transition-all duration-200 cursor-pointer group border border-transparent hover:border-muted"
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                              {(classData.instructor as any).username}
                            </p>
                            <div className="flex flex-col gap-1">
                              {(classData.instructor as any).email && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span className="truncate">
                                    {(classData.instructor as any).email}
                                  </span>
                                </div>
                              )}
                              {(classData.instructor as any).phone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                                  <span>
                                    {(classData.instructor as any).phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2.5 w-2.5 rounded-full shadow-sm ${
                                  (classData.instructor as any).is_active
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              />
                              <span className="text-xs font-medium text-muted-foreground">
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

                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Tổng số buổi học
                  </span>
                  <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                    {classData.total_schedules || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Buổi học đã học qua
                  </span>
                  <span className="font-bold text-lg text-green-600 dark:text-green-400">
                    {classData.schedule_passed || 0}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Buổi học còn lại
                  </span>
                  <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                    {classData.schedule_left || 0}
                  </span>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Ngày tạo</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(classData.created_at)}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Cập nhật lần cuối</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(classData.updated_at)}
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Quick Actions
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
                        description: "Lớp học này chưa có Huấn luyện viên nào",
                        variant: "default",
                      });
                    }
                  }}
                >
                  <User className='mr-2 h-4 w-4' />
                  Xem Huấn luyện viên
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
            </Card> */}
          </div>
        </div>
      </div>

      {/* Edit Class Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin lớp học</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cơ bản của lớp học (tên lớp, khóa học, giảng
              viên).
              <br />
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Lưu ý: Để quản lý học viên, vui lòng sử dụng phần &quot;Quản lý
                học viên&quot; bên dưới.
              </span>
            </DialogDescription>
          </DialogHeader>

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải dữ liệu...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Class Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Tên lớp học *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Nhập tên lớp học"
                />
              </div>

              {/* Course Selection */}
              <div className="space-y-2">
                <Label htmlFor="course">Khóa học *</Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) => handleInputChange("course", value)}
                  disabled={true}
                >
                  <SelectTrigger disabled className="opacity-70 bg-muted">
                    <SelectValue placeholder="Chọn khóa học" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course._id} value={course._id}>
                        <div className="flex items-center gap-2">
                          <span>{course.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {course.price?.toLocaleString()}₫
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Instructor Selection */}
              <div className="space-y-2">
                <Label htmlFor="instructor">Huấn luyện viên *</Label>
                <Select
                  value={formData.instructor}
                  onValueChange={(value) =>
                    handleInputChange("instructor", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Huấn luyện viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor._id} value={instructor._id}>
                        <div className="flex items-center gap-2">
                          <span>{instructor.username}</span>
                          <span className="text-muted-foreground text-sm">
                            ({instructor.email})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show on Registration Course */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="show_on_regist_course"
                  checked={formData.show_on_regist_course}
                  onCheckedChange={(checked) =>
                    handleInputChange("show_on_regist_course", checked)
                  }
                />
                <Label htmlFor="show_on_regist_course">
                  Mở đăng ký khóa học
                </Label>
              </div>

              {/* Validation Warnings/Errors */}
              {(validationResult.warnings.length > 0 ||
                validationResult.errors.length > 0) && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  {validationResult.errors.map((error, index) => (
                    <Alert key={`error-${index}`} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{error.message}</AlertTitle>
                      <AlertDescription>{error.details}</AlertDescription>
                    </Alert>
                  ))}
                  {validationResult.warnings.map((warning, index) => (
                    <Alert
                      key={`warning-${index}`}
                      className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-200"
                    >
                      <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                        {warning.message}
                      </AlertTitle>
                      <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                        {warning.details}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveClass}
              disabled={isSaving || !isEditFormValid || validatingInstructor}
            >
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

      {/* Auto Schedule Modal */}
      <Dialog
        open={isAutoScheduleModalOpen}
        onOpenChange={setIsAutoScheduleModalOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              Tự động xếp lịch học cho lớp
            </DialogTitle>
            <DialogDescription className="text-base">
              Hệ thống sẽ tự động sắp xếp lịch học dựa trên thời gian và ngày
              bạn chọn
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* BEFORE/AFTER Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* HIỆN TẠI */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-base">HIỆN TẠI</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Khóa học yêu cầu
                    </p>
                    <p className="text-2xl font-bold">
                      {classData?.course.session_number || 0}
                      <span className="text-base text-muted-foreground ml-2">
                        buổi học
                      </span>
                    </p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground mb-1">
                      Đã xếp lịch
                    </p>
                    <p className="text-2xl font-bold">
                      {classData?.total_schedules || 0}
                      <span className="text-base text-muted-foreground ml-2">
                        buổi
                      </span>
                    </p>
                  </div>
                  {classData?.sessions_remaining &&
                    classData.sessions_remaining > 0 && (
                      <div className="bg-muted p-3 rounded-lg border">
                        <p className="text-sm text-muted-foreground font-medium">
                          Còn thiếu
                        </p>
                        <p className="text-xl font-bold">
                          {classData.sessions_remaining} buổi
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* SAU KHI TỰ ĐỘNG XẾP LỊCH */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-base">
                    SAU KHI TỰ ĐỘNG XẾP
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Khóa học yêu cầu
                    </p>
                    <p className="text-2xl font-bold">
                      {classData?.course.session_number || 0}
                      <span className="text-base text-muted-foreground ml-2">
                        buổi học
                      </span>
                    </p>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground mb-1">
                      Sẽ được xếp lịch
                    </p>
                    <p className="text-2xl font-bold">
                      {classData?.course.session_number || 0}
                      <span className="text-base text-muted-foreground ml-2">
                        buổi
                      </span>
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg border">
                    <p className="text-sm text-muted-foreground font-medium">
                      Trạng thái
                    </p>
                    <p className="text-base font-semibold">Đủ lịch học</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">Hệ thống sẽ tự động:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Tìm khung giờ phù hợp trong thời gian bạn chọn</li>

                    <li>• Xếp lịch đều đặn theo các ngày trong tuần</li>
                    <li>• Đảm bảo không trùng lịch với các lớp khác</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Thiết lập thời gian học
              </h3>

              {/* Time Range */}
              <div className="space-y-4">
                <div>
                  <Label className="font-medium mb-2 block">
                    Khung giờ học trong ngày
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Chọn khoảng thời gian trong ngày mà lớp có thể học
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min_time" className="text-sm">
                        Từ giờ
                      </Label>
                      <Select
                        value={autoScheduleData.min_time.toString()}
                        onValueChange={(value) =>
                          handleAutoScheduleChange("min_time", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giờ bắt đầu" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 7).map(
                            (hour) => (
                              <SelectItem key={hour} value={hour.toString()}>
                                {hour}:00
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max_time" className="text-sm">
                        Đến giờ
                      </Label>
                      <Select
                        value={autoScheduleData.max_time.toString()}
                        onValueChange={(value) =>
                          handleAutoScheduleChange("max_time", parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giờ kết thúc" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 7).map(
                            (hour) => (
                              <SelectItem key={hour} value={hour.toString()}>
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
                <div className="pt-4 border-t">
                  <Label className="font-medium mb-2 block">
                    Chọn các ngày trong tuần *
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Chọn những ngày nào trong tuần mà lớp sẽ học
                  </p>
                  <div className="grid grid-cols-7 gap-2">
                    {[
                      { label: "T2", fullLabel: "Thứ 2 (Monday)", jsDay: 1 },
                      { label: "T3", fullLabel: "Thứ 3 (Tuesday)", jsDay: 2 },
                      { label: "T4", fullLabel: "Thứ 4 (Wednesday)", jsDay: 3 },
                      { label: "T5", fullLabel: "Thứ 5 (Thursday)", jsDay: 4 },
                      { label: "T6", fullLabel: "Thứ 6 (Friday)", jsDay: 5 },
                      { label: "T7", fullLabel: "Thứ 7 (Saturday)", jsDay: 6 },
                      { label: "CN", fullLabel: "Chủ nhật (Sunday)", jsDay: 0 },
                    ].map((day) => {
                      // Convert JS day to backend day to check if selected
                      const backendDay = convertJsDayToBackendDay(day.jsDay);
                      const isSelected =
                        autoScheduleData.array_number_in_week.includes(
                          backendDay
                        );

                      return (
                        <div
                          key={day.jsDay}
                          className={`
                            border rounded p-2 cursor-pointer transition-all text-center
                            ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            }
                          `}
                          onClick={() => handleDayToggle(day.jsDay)}
                        >
                          <Label
                            htmlFor={`day-${day.jsDay}`}
                            className="text-sm font-medium block cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    Số buổi học/tuần:{" "}
                    {autoScheduleData.array_number_in_week.length} buổi
                  </p>
                </div>
              </div>
            </div>

            {/* Preview/Summary Box */}
            {autoScheduleData.array_number_in_week.length > 0 && (
              <div className="bg-muted/50 border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Tóm tắt:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[100px]">
                      Khung giờ:
                    </span>
                    <span className="font-medium">
                      {autoScheduleData.min_time}:00 -{" "}
                      {autoScheduleData.max_time}:00
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[100px]">
                      Số buổi/tuần:
                    </span>
                    <span className="font-medium">
                      {autoScheduleData.array_number_in_week.length} buổi
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-[100px]">
                      Ngày học:
                    </span>
                    <span className="font-medium">
                      {autoScheduleData.array_number_in_week
                        .sort((a, b) => a - b)
                        .map((day) => {
                          // TEMPORARY: Using Monday-start mapping for testing
                          // After testing, update this based on actual backend behavior
                          const dayNames = [
                            "Thứ 4", // 0 = Wednesday
                            "Thứ 5", // 1 = Thursday
                            "Thứ 6", // 2 = Friday
                            "Thứ 7", // 3 = Saturday
                            "Chủ nhật", // 4 = Sunday
                            "Thứ 2", // 5 = Monday
                            "Thứ 3", // 6 = Tuesday
                          ];
                          return dayNames[day];
                        })
                        .join(", ")}
                    </span>
                  </div>
                  {classData?.sessions_remaining &&
                    classData.sessions_remaining > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-muted-foreground min-w-[100px]">
                          Số buổi học còn thiếu:
                        </span>
                        <span className="font-medium">
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
              variant="outline"
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
              className="bg-green-600 hover:bg-green-700"
            >
              {isAutoScheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xếp lịch...
                </>
              ) : (
                <>
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Tự động xếp lịch
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Management Modal */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Quản lý học viên</DialogTitle>
            <DialogDescription>
              Thêm hoặc xóa học viên khỏi lớp học. Chỉ có thể thêm học viên đã
              thanh toán khóa học này.
            </DialogDescription>
          </DialogHeader>

          {loadingData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải danh sách học viên...</span>
            </div>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 overflow-hidden"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="add">Học viên có thể thêm</TabsTrigger>
                <TabsTrigger value="remove">Học viên trong lớp</TabsTrigger>
                <TabsTrigger value="graduates">Cập nhật tốt nghiệp</TabsTrigger>
              </TabsList>
              <TabsContent value="add" className="flex-1 overflow-hidden mt-4">
                <div className="flex flex-col border rounded-lg overflow-hidden h-full">
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Học viên có thể thêm (
                          {
                            students.filter(
                              (s) =>
                                !classData?.member?.find(
                                  (m: any) => m._id === s.user._id
                                )
                            ).length
                          }
                          )
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Đã thanh toán khóa học, chưa có trong lớp
                        </p>
                      </div>
                      {students.filter(
                        (s) =>
                          !classData?.member?.find(
                            (m: any) => m._id === s.user._id
                          )
                      ).length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const availableStudents = students.filter(
                                (s) =>
                                  !classData?.member?.find(
                                    (m: any) => m._id === s.user._id
                                  )
                              );
                              setSelectedMembersToAdd(
                                availableStudents.map((s) => s.user._id)
                              );
                            }}
                          >
                            Chọn tất cả
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMembersToAdd([])}
                          >
                            Bỏ chọn
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {students.filter(
                      (student) =>
                        !classData?.member?.find(
                          (m: any) => m._id === student.user._id
                        )
                    ).length > 0 ? (
                      students
                        .filter(
                          (student) =>
                            !classData?.member?.find(
                              (m: any) => m._id === student.user._id
                            )
                        )
                        .map((student) => (
                          <div
                            key={student.user._id}
                            className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg border"
                          >
                            <Checkbox
                              id={`add-${student.user._id}`}
                              checked={selectedMembersToAdd.includes(
                                student.user._id
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedMembersToAdd((prev) => [
                                    ...prev,
                                    student.user._id,
                                  ]);
                                } else {
                                  setSelectedMembersToAdd((prev) =>
                                    prev.filter((id) => id !== student.user._id)
                                  );
                                }
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {student.user.username}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {student.user.email}
                              </p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Tất cả học viên đã thanh toán đều đã có trong lớp
                      </p>
                    )}
                  </div>
                  {selectedMembersToAdd.length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 px-4 py-2 border-t">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Đã chọn {selectedMembersToAdd.length} học viên để thêm
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent
                value="remove"
                className="flex-1 overflow-hidden mt-4"
              >
                <div className="flex flex-col border rounded-lg overflow-hidden h-full">
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Học viên trong lớp ({classData?.member?.length || 0})
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Chọn để xóa khỏi lớp học
                        </p>
                      </div>
                      {classData?.member && classData.member.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedMembersToRemove(
                                classData.member.map((m: any) => m._id)
                              );
                            }}
                          >
                            Chọn tất cả
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMembersToRemove([])}
                          >
                            Bỏ chọn
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {classData?.member && classData.member.length > 0 ? (
                      classData.member.map((member: any) => (
                        <div
                          key={member._id}
                          className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg border"
                        >
                          <Checkbox
                            id={`remove-${member._id}`}
                            checked={selectedMembersToRemove.includes(
                              member._id
                            )}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedMembersToRemove((prev) => [
                                  ...prev,
                                  member._id,
                                ]);
                              } else {
                                setSelectedMembersToRemove((prev) =>
                                  prev.filter((id) => id !== member._id)
                                );
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.username}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Chưa có học viên nào trong lớp
                      </p>
                    )}
                  </div>
                  {selectedMembersToRemove.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 border-t">
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">
                        Đã chọn {selectedMembersToRemove.length} học viên để xóa
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent
                value="graduates"
                className="flex-1 overflow-hidden mt-4"
              >
                <div className="flex flex-col border rounded-lg overflow-hidden h-full">
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Danh sách tốt nghiệp
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Chọn học viên đã hoàn thành khóa học
                        </p>
                      </div>
                      {classData?.member && classData.member.length > 0 && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGraduates(
                                classData.member.map((m: any) => m._id)
                              );
                            }}
                          >
                            Chọn tất cả
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedGraduates([])}
                          >
                            Bỏ chọn
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {classData?.member && classData.member.length > 0 ? (
                      classData.member.map((member: any) => (
                        <div
                          key={member._id}
                          className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg border"
                        >
                          <Checkbox
                            id={`grad-${member._id}`}
                            checked={selectedGraduates.includes(member._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedGraduates((prev) => [
                                  ...prev,
                                  member._id,
                                ]);
                              } else {
                                setSelectedGraduates((prev) =>
                                  prev.filter((id) => id !== member._id)
                                );
                              }
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {member.username}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.email}
                            </p>
                          </div>
                          {selectedGraduates.includes(member._id) && (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-green-700 hover:bg-green-100"
                            >
                              Đã tốt nghiệp
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-8">
                        Chưa có học viên nào trong lớp
                      </p>
                    )}
                  </div>
                  <div className="bg-muted/30 px-4 py-2 border-t">
                    <p className="text-sm font-medium">
                      Đã chọn {selectedGraduates.length} /{" "}
                      {classData?.member?.length || 0} học viên tốt nghiệp
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMemberModalOpen(false)}
              disabled={isManagingMembers}
            >
              Hủy
            </Button>
            <Button
              onClick={handleApplyMemberChanges}
              disabled={
                isManagingMembers ||
                (activeTab === "add" && selectedMembersToAdd.length === 0) ||
                (activeTab === "remove" &&
                  selectedMembersToRemove.length === 0) ||
                activeTab === "graduates" // Hide apply member button on graduates tab
              }
              className={activeTab === "graduates" ? "hidden" : ""}
            >
              {isManagingMembers ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {activeTab === "add"
                    ? "Thêm vào lớp học"
                    : "Xóa khỏi lớp học"}
                </>
              )}
            </Button>
            {activeTab === "graduates" && (
              <Button
                onClick={handleUpdateGraduates}
                disabled={isUpdatingGraduates}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isUpdatingGraduates ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Cập nhật trạng thái
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Preview Modal */}
      <SchedulePreviewModal
        open={isSchedulePreviewModalOpen}
        onOpenChange={setIsSchedulePreviewModalOpen}
        availableClasses={classData ? [classData as any] : []}
        preSelectedClassIds={classData ? [classData._id] : []}
        onScheduleComplete={() => {
          // Refresh class data after scheduling
          if (classroomId) {
            const tenantId = getSelectedTenant();
            const token = getAuthToken();
            if (tenantId && token) {
              fetchClassDetails(classroomId, tenantId, token).then(
                setClassData
              );
            }
          }
          setIsSchedulePreviewModalOpen(false);
        }}
      />

      {/* Schedule Detail Modal */}
      <ScheduleDetailModal
        open={isScheduleDetailModalOpen}
        onClose={() => setIsScheduleDetailModalOpen(false)}
        scheduleId={selectedScheduleId}
        onEdit={(schedule) => {
          // Handle edit schedule - you can implement this later
          console.log("Edit schedule:", schedule);
        }}
        onDelete={(schedule) => {
          // Handle delete schedule - you can implement this later
          console.log("Delete schedule:", schedule);
        }}
      />
    </div>
  );
}
