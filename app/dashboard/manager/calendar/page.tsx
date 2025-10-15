"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Badge as AntdBadge,
  message,
  Modal,
  Button as AntdButton,
  Select as AntdSelect,
  Card as AntdCard,
  Drawer,
  List,
  Avatar,
  Typography,
  Space,
  Divider,
  ConfigProvider,
  Tag,
  Tooltip,
  Row,
  Col,
  Segmented,
  Empty,
  Alert,
  Form,
  Input,
  TimePicker,
  Tabs,
  Radio,
  Spin,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/locale/vi_VN";
import {
  fetchMonthSchedule,
  fetchWeekSchedule,
  fetchDateRangeSchedule,
  getWeeksInYear,
  deleteScheduleEvent,
  type ScheduleEvent,
  convertApiDayToJsDay,
  convertJsDayToApiDay,
} from "@/api/schedule-api";
import { fetchAllSlots, type SlotDetail } from "@/api/slot-api";
import { fetchCourseById } from "@/api/courses-api";
import {
  fetchClassrooms,
  addClassToSchedule,
  type Classroom,
} from "@/api/class-api";
import { fetchPools, type Pool } from "@/api/pools-api";
import { fetchInstructors } from "@/api/instructors-api";
import { getMediaDetails } from "@/api/media-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  useCachedAPI,
  usePerformanceMonitor,
  apiCache,
} from "@/hooks/use-api-cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ClassDetailModal from "@/components/manager/class-detail-modal";

const { Option } = AntdSelect;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

// Set Vietnamese locale for dayjs
dayjs.locale("vi");

interface Instructor {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  is_active?: boolean;
  role_front?: string[];
  featured_image?: any[];
  birthday?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}

interface CalendarEvent {
  id: string;
  className: string;
  slotTitle: string;
  slotTime: string;
  course: string;
  poolTitle: string;
  poolId: string;
  instructorId: string;
  instructorName: string;
  scheduleId: string;
  slotId: string;
  type: "class" | "event";
  color?: string;
}

export default function ImprovedAntdCalendarPage() {
  usePerformanceMonitor("ImprovedAntdCalendarPage");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<Dayjs | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [courseCache, setCourseCache] = useState<{ [key: string]: any }>({});

  // Class management states
  const [classManagementMode, setClassManagementMode] = useState<
    "view" | "add" | "edit"
  >("view");
  const [availableSlots, setAvailableSlots] = useState<SlotDetail[]>([]);
  const [availableClassrooms, setAvailableClassrooms] = useState<Classroom[]>(
    []
  );
  const [availablePools, setAvailablePools] = useState<Pool[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<
    Instructor[]
  >([]);
  const [instructorAvatars, setInstructorAvatars] = useState<{
    [key: string]: string;
  }>({});
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [selectedClassroom, setSelectedClassroom] = useState<string>("");
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");
  const [classManagementLoading, setClassManagementLoading] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Class detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedScheduleEvent, setSelectedScheduleEvent] =
    useState<ScheduleEvent | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{
    scheduleId: string;
    className: string;
    date: string;
    slotTitle: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use cached API for slots (they don't change often)
  const {
    data: allSlots,
    loading: slotsLoading,
    error: slotsError,
  } = useCachedAPI(
    "all-slots",
    fetchAllSlots,
    [],
    10 * 60 * 1000 // Cache for 10 minutes
  );

  // Effect to fetch data when component mounts or current date changes
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          "🗓️ Fetching month schedule for:",
          currentDate.format("YYYY-MM-DD")
        );
        const events = await fetchMonthSchedule(currentDate.toDate());

        console.log(" Loaded schedule events:", {
          count: events.length,
          currentDate: currentDate.format("YYYY-MM-DD"),
          events: events.slice(0, 3).map((e) => ({
            id: e._id,
            date: e.date,
            slotTitle: e.slot?.title || "N/A",
            classroomName: e.classroom?.name || "N/A",
          })),
        });

        setScheduleEvents(events);

        // Log data structure for debugging
        if (events.length > 0) {
          console.log("📊 First event structure:", {
            _id: events[0]._id,
            date: events[0].date,
            slot: events[0].slot,
            classroom: events[0].classroom,
            pool: events[0].pool,
          });
        }
      } catch (err) {
        console.error("❌ Error loading schedule data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load schedule data"
        );
        message.error("Không thể tải dữ liệu lịch học");
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, [currentDate]);

  // Effect to fetch course details when scheduleEvents change
  useEffect(() => {
    const fetchCourseDetails = async () => {
      const courseIds = new Set<string>();

      // Collect all unique course IDs
      scheduleEvents.forEach((event) => {
        if (event.classroom?.course && !courseCache[event.classroom.course]) {
          courseIds.add(event.classroom.course);
        }
      });

      // Fetch course details for missing courses
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        console.warn("Missing tenant or token for course fetch");
        return;
      }

      for (const courseId of courseIds) {
        try {
          const course = await fetchCourseById({
            courseId,
            tenantId,
            token,
          });
          setCourseCache((prev) => ({
            ...prev,
            [courseId]: course,
          }));
        } catch (error) {
          console.error(`Failed to fetch course ${courseId}:`, error);
          // Set a fallback name for failed fetches
          setCourseCache((prev) => ({
            ...prev,
            [courseId]: { title: `Khóa học ${courseId.slice(-4)}` },
          }));
        }
      }
    };

    if (scheduleEvents.length > 0) {
      fetchCourseDetails();
    }
  }, [scheduleEvents, courseCache]);

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    const dateStr = date.format("YYYY-MM-DD");
    const dayEvents = scheduleEvents.filter((event) => {
      const eventDateStr = event.date.split("T")[0];
      return eventDateStr === dateStr;
    });

    return dayEvents.map(formatScheduleEvent);
  };

  // Get course name from cache or return course ID
  const getCourseName = (courseId: string): string => {
    if (courseCache[courseId]) {
      return courseCache[courseId].title || courseId;
    }
    return courseId; // Return ID if not cached yet
  };

  // Transform schedule event to display format
  const formatScheduleEvent = (scheduleEvent: ScheduleEvent): CalendarEvent => {
    const slot = scheduleEvent.slot;
    const classroom = scheduleEvent.classroom;
    const pool = scheduleEvent.pool;
    const instructor = scheduleEvent.instructor?.[0]; // Get first instructor

    return {
      id: scheduleEvent._id,
      className: classroom?.name || "Không xác định",
      slotTitle: slot?.title || "Không xác định",
      slotTime: slot
        ? `${Math.floor(slot.start_time)
            .toString()
            .padStart(2, "0")}:${slot.start_minute
            .toString()
            .padStart(2, "0")} - ${Math.floor(slot.end_time)
            .toString()
            .padStart(2, "0")}:${slot.end_minute.toString().padStart(2, "0")}`
        : "",
      course: getCourseName(classroom?.course || ""), // Resolve course name
      poolTitle: pool?.title || "Không xác định",
      poolId: pool?._id || "",
      instructorId: instructor?._id || "",
      instructorName:
        instructor?.username || instructor?.name || "Không xác định",
      scheduleId: scheduleEvent._id,
      slotId: slot?._id || "",
      type: "class",
      color: getEventColor(classroom?.course || ""),
    };
  };

  // Get color for event based on course type
  const getEventColor = (courseId: string): string => {
    const courseName = getCourseName(courseId);
    const colorMap: { [key: string]: string } = {
      "Bơi cơ bản": "#52c41a",
      "Bơi nâng cao": "#1890ff",
      "Bơi trẻ em": "#fa8c16",
      Aerobic: "#eb2f96",
      "Bơi người lớn": "#722ed1",
      "Bơi tự do": "#13c2c2",
    };

    // Try to match by course name first, then fallback to a hash-based color
    if (colorMap[courseName]) {
      return colorMap[courseName];
    }

    // Generate consistent color based on courseId
    const colors = [
      "#1890ff",
      "#52c41a",
      "#fa8c16",
      "#eb2f96",
      "#722ed1",
      "#13c2c2",
      "#f5222d",
      "#fa541c",
    ];
    const hash = courseId.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Find original ScheduleEvent by schedule ID
  const findScheduleEventById = (scheduleId: string): ScheduleEvent | null => {
    return scheduleEvents.find((event) => event._id === scheduleId) || null;
  };

  // Handle opening class detail modal
  const handleOpenDetailModal = (event: CalendarEvent) => {
    const scheduleEvent = findScheduleEventById(event.scheduleId);
    if (scheduleEvent) {
      setSelectedScheduleEvent(scheduleEvent);
      setDetailModalOpen(true);
    }
  };

  // Handle date select from calendar
  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  // Handle panel change (month/year navigation)
  const onPanelChange = (date: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    setCurrentDate(date);
  };

  // Custom date cell renderer
  const dateCellRender = (value: Dayjs) => {
    const events = getEventsForDate(value);
    const isToday = value.isSame(dayjs(), "day");
    const isPast = value.isBefore(dayjs(), "day");
    const isFuture = value.isAfter(dayjs(), "day");

    if (events.length === 0) {
      return (
        <div
          className={`h-full min-h-[80px] p-1 ${
            isPast ? "opacity-60" : ""
          } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDrawerDate(value);
            setDrawerOpen(true);
          }}
        >
          <div className='text-center'>
            <div className='text-xs text-gray-400 dark:text-gray-600'>
              Chưa có lớp học
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`h-full min-h-[80px] p-1 ${
          isPast ? "opacity-60" : ""
        } flex items-center justify-center`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrawerDate(value);
          setDrawerOpen(true);
        }}
      >
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'>
            {events.length}
          </div>
          <div className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
            lớp học
          </div>
        </div>
      </div>
    );
  };

  // Handle delete schedule event
  const handleDeleteScheduleEvent = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteScheduleEvent(scheduleToDelete.scheduleId);
      message.success(`Đã xóa lớp ${scheduleToDelete.className} khỏi lịch`);

      // Refresh data without changing page
      const events = await fetchMonthSchedule(currentDate.toDate());

      setScheduleEvents(events);
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (err) {
      console.error("Error deleting schedule event:", err);
      message.error("Có lỗi xảy ra khi xóa lịch học");
    } finally {
      setIsDeleting(false);
    }
  };

  // Load instructor avatars
  const loadInstructorAvatars = async (instructors: Instructor[]) => {
    const avatarMap: { [key: string]: string } = {};

    for (const instructor of instructors) {
      try {
        // Check if instructor has featured_image
        if (instructor.featured_image && instructor.featured_image.length > 0) {
          const imageData = instructor.featured_image[0];
          if (imageData.path && imageData.path.length > 0) {
            // If path is already a URL, use it directly
            if (imageData.path[0].startsWith("http")) {
              avatarMap[instructor._id] = imageData.path[0];
            } else {
              // Otherwise, fetch media details
              const mediaPath = await getMediaDetails(imageData.path[0]);
              if (mediaPath) {
                avatarMap[instructor._id] = mediaPath;
              }
            }
          }
        }
      } catch (error) {
        console.error(
          `Error loading avatar for instructor ${instructor.username}:`,
          error
        );
      }
    }

    setInstructorAvatars(avatarMap);
  };

  // Handle quick add class
  const handleQuickAddClass = (date?: Dayjs) => {
    const targetDate = date || dayjs();
    const formattedDate = targetDate.format("YYYY-MM-DD");
    router.push(
      `/dashboard/manager/schedule/add-class?date=${formattedDate}&slotKey=slot1`
    );
  };

  // Load data for class management
  const loadClassManagementData = async () => {
    setClassManagementLoading(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      console.log("🔍 Loading class management data...");
      console.log("🔍 Tenant ID:", tenantId);
      console.log("🔍 Token:", token ? "Present" : "Missing");

      const [slotsData, classroomsData, poolsData, instructorsData] =
        await Promise.all([
          fetchAllSlots(),
          fetchClassrooms(),
          fetchPools(),
          fetchInstructors({
            tenantId: tenantId || undefined,
            token: token || undefined,
            role: "instructor", // Try with explicit role first
          }).catch(async (error) => {
            console.warn(
              "Failed to fetch with role 'instructor', trying without role filter:",
              error
            );
            // Fallback: try without role filter or with different roles
            return fetchInstructors({
              tenantId: tenantId || undefined,
              token: token || undefined,
            }).catch(() => []);
          }),
        ]);

      console.log("🔍 Slots loaded:", slotsData.length);
      console.log("🔍 Classrooms loaded:", classroomsData.length);
      console.log("🔍 Pools loaded:", poolsData.length);
      console.log("🔍 Instructors loaded:", instructorsData.length);
      console.log("🔍 Instructors data:", instructorsData);

      setAvailableSlots(slotsData);
      setAvailableClassrooms(classroomsData);
      setAvailablePools(poolsData);
      setAvailableInstructors(instructorsData);

      // Load instructor avatars
      if (instructorsData.length > 0) {
        await loadInstructorAvatars(instructorsData);
      }

      // Set default selections
      if (slotsData.length > 0) setSelectedSlot(slotsData[0]._id);
      if (poolsData.length > 0) setSelectedPool(poolsData[0]._id);
      if (instructorsData.length > 0)
        setSelectedInstructor(instructorsData[0]._id);
    } catch (error) {
      console.error("Error loading class management data:", error);
      message.error("Không thể tải dữ liệu quản lý lớp học");
    } finally {
      setClassManagementLoading(false);
    }
  }; // Handle add new class
  const handleAddNewClass = async () => {
    if (
      !selectedSlot ||
      !selectedClassroom ||
      !selectedPool ||
      !selectedInstructor ||
      !drawerDate
    ) {
      message.error(
        "Vui lòng chọn đầy đủ thông tin (khung giờ, lớp học, hồ bơi, giáo viên)"
      );
      return;
    }

    setClassManagementLoading(true);
    try {
      await addClassToSchedule({
        date: drawerDate.format("YYYY-MM-DD"),
        slot: selectedSlot,
        classroom: selectedClassroom,
        pool: selectedPool,
        instructor: selectedInstructor,
      });

      message.success("Đã thêm lớp học vào lịch thành công");

      // Refresh schedule data
      const events = await fetchMonthSchedule(currentDate.toDate());
      setScheduleEvents(events);

      // Reset form
      setClassManagementMode("view");
      setSelectedSlot(availableSlots[0]?._id || "");
      setSelectedClassroom("");
      setSelectedPool(availablePools[0]?._id || "");
      setSelectedInstructor(availableInstructors[0]?._id || "");
      setSelectedPool(availablePools[0]?._id || "");
    } catch (error) {
      console.error("Error adding class:", error);
      message.error("Có lỗi xảy ra khi thêm lớp học");
    } finally {
      setClassManagementLoading(false);
    }
  };

  // Handle edit class
  const handleEditClass = (event: CalendarEvent) => {
    setEditingEvent(event);
    setClassManagementMode("edit");
    // Load current values
    setSelectedSlot(event.slotId);
    setSelectedClassroom(event.id); // Assuming this maps to classroom ID
    setSelectedPool(event.poolId);
    setSelectedInstructor(event.instructorId);
    // Load class management data if not loaded
    if (availableSlots.length === 0) {
      loadClassManagementData();
    }
  };

  // Handle update class
  const handleUpdateClass = async () => {
    if (
      !editingEvent ||
      !selectedSlot ||
      !selectedClassroom ||
      !selectedPool ||
      !selectedInstructor
    ) {
      message.error(
        "Vui lòng chọn đầy đủ thông tin (khung giờ, lớp học, hồ bơi, giáo viên)"
      );
      return;
    }

    setClassManagementLoading(true);
    try {
      // First delete the old one
      await deleteScheduleEvent(editingEvent.scheduleId);

      // Then add the new one
      await addClassToSchedule({
        date: drawerDate!.format("YYYY-MM-DD"),
        slot: selectedSlot,
        classroom: selectedClassroom,
        pool: selectedPool,
        instructor: selectedInstructor,
      });

      message.success("Đã cập nhật lớp học thành công");

      // Refresh schedule data
      const events = await fetchMonthSchedule(currentDate.toDate());
      setScheduleEvents(events);

      // Reset form
      setClassManagementMode("view");
      setEditingEvent(null);
    } catch (error) {
      console.error("Error updating class:", error);
      message.error("Có lỗi xảy ra khi cập nhật lớp học");
    } finally {
      setClassManagementLoading(false);
    }
  };

  // Reset class management form
  const resetClassManagementForm = () => {
    setClassManagementMode("view");
    setEditingEvent(null);
    setSelectedSlot(availableSlots[0]?._id || "");
    setSelectedClassroom("");
    setSelectedPool(availablePools[0]?._id || "");
    setSelectedInstructor(availableInstructors[0]?._id || "");
  };

  // Enhanced date cell with drawer trigger
  const enhancedDateCellRender = (value: Dayjs) => {
    return dateCellRender(value);
  };

  // Get statistics
  const getStatistics = () => {
    const totalEvents = scheduleEvents.length;
    const totalSlots = scheduleEvents.length; // Each event has one slot
    const uniquePools = new Set(
      scheduleEvents.map((event) => event.pool?.title).filter(Boolean)
    ).size;

    return { totalEvents, totalSlots, uniquePools };
  };

  const stats = getStatistics();

  if (loading || slotsLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400'></div>
          <p className='mt-4 text-gray-600 dark:text-gray-300'>
            Đang tải lịch học...
          </p>
        </div>
      </div>
    );
  }

  if (error || slotsError) {
    return (
      <div className='container mx-auto py-8'>
        <Alert
          message='Lỗi tải dữ liệu'
          description={error || slotsError}
          type='error'
          action={
            <AntdButton
              size='small'
              onClick={() => window.location.reload()}
            >
              Thử lại
            </AntdButton>
          }
        />
      </div>
    );
  }

  return (
    <ConfigProvider locale={locale}>
      <div className='container mx-auto py-8 space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <Button
                onClick={() => router.back()}
                variant='outline'
                size='sm'
              >
                <ArrowLeftOutlined className='mr-2' />
                Quay lại
              </Button>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <AntdButton
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => handleQuickAddClass()}
            >
              Thêm lớp học
            </AntdButton>
          </div>
        </div>

        {/* Statistics Cards */}
        {scheduleEvents.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              sm={8}
            >
              <AntdCard
                size='small'
                className='text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1'>
                    {stats.totalEvents}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1 text-gray-600 dark:text-gray-400'
                  >
                    <TeamOutlined /> Tổng lớp học
                  </Text>
                </div>
              </AntdCard>
            </Col>

            <Col
              xs={24}
              sm={8}
            >
              <AntdCard
                size='small'
                className='text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1'>
                    {stats.totalSlots}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1 text-gray-600 dark:text-gray-400'
                  >
                    <ClockCircleOutlined /> Tổng khung giờ
                  </Text>
                </div>
              </AntdCard>
            </Col>

            <Col
              xs={24}
              sm={8}
            >
              <AntdCard
                size='small'
                className='text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1'>
                    {stats.uniquePools}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1 text-gray-600 dark:text-gray-400'
                  >
                    <EnvironmentOutlined /> Hồ bơi sử dụng
                  </Text>
                </div>
              </AntdCard>
            </Col>
          </Row>
        )}

        {/* Main Calendar */}
        <AntdCard className='shadow-lg calendar-container'>
          <Calendar
            value={currentDate}
            onSelect={onSelect}
            onPanelChange={onPanelChange}
            cellRender={enhancedDateCellRender}
          />
        </AntdCard>

        {/* Date Details Drawer */}
        <Drawer
          title={
            <div className='flex items-center gap-3'>
              <CalendarOutlined className='text-blue-500' />
              <div>
                <div className='text-lg font-semibold'>
                  {drawerDate
                    ? drawerDate.format("DD/MM/YYYY")
                    : "Chi tiết lịch học"}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  {drawerDate ? drawerDate.format("dddd") : ""}
                </div>
              </div>
            </div>
          }
          placement='right'
          width={480}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            resetClassManagementForm();
          }}
          className='calendar-drawer'
        >
          {drawerLoading ? (
            <div className='flex items-center justify-center py-12'>
              <div className='text-center'>
                <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400'></div>
                <p className='mt-4 text-gray-600 dark:text-gray-300'>
                  Đang tải chi tiết...
                </p>
              </div>
            </div>
          ) : (
            drawerDate && (
              <div className='space-y-6'>
                <Tabs
                  activeKey={classManagementMode}
                  onChange={(key) =>
                    setClassManagementMode(key as "view" | "add" | "edit")
                  }
                  items={[
                    {
                      key: "view",
                      label: "Xem lịch học",
                      children: (
                        <div className='space-y-4'>
                          {(() => {
                            const events = getEventsForDate(drawerDate);

                            if (events.length === 0) {
                              const isPast = drawerDate.isBefore(
                                dayjs(),
                                "day"
                              );
                              const isToday = drawerDate.isSame(dayjs(), "day");
                              const isFuture = drawerDate.isAfter(
                                dayjs(),
                                "day"
                              );

                              let message = "";
                              let showAddButton = false;

                              if (isPast) {
                                message = "Không có lớp học nào trong ngày này";
                              } else if (isToday) {
                                message = "Chưa có lớp học nào trong hôm nay";
                                showAddButton = true;
                              } else if (isFuture) {
                                message =
                                  "Chưa có lớp học nào được lên lịch cho ngày này";
                                showAddButton = true;
                              }

                              return (
                                <div className='text-center py-12'>
                                  <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                      <div>
                                        <div className='text-gray-500 dark:text-gray-400 mb-4'>
                                          {message}
                                        </div>
                                        {showAddButton && (
                                          <AntdButton
                                            type='primary'
                                            icon={<PlusOutlined />}
                                            onClick={() => {
                                              setClassManagementMode("add");
                                              loadClassManagementData();
                                            }}
                                          >
                                            {isToday
                                              ? "Thêm lớp học cho hôm nay"
                                              : "Thêm lớp học mới"}
                                          </AntdButton>
                                        )}
                                        {isPast && (
                                          <div className='text-xs text-gray-400 dark:text-gray-600 mt-2'>
                                            Không thể thêm lớp học cho ngày
                                            trong quá khứ
                                          </div>
                                        )}
                                      </div>
                                    }
                                  />
                                </div>
                              );
                            }

                            return (
                              <div>
                                {/* Summary */}
                                <div className='mb-6'>
                                  <AntdCard
                                    size='small'
                                    className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                  >
                                    <div className='flex items-center justify-between'>
                                      <div className='flex items-center gap-2'>
                                        <TeamOutlined className='text-blue-600 dark:text-blue-400' />
                                        <span className='font-medium'>
                                          Tổng số lớp học:
                                        </span>
                                      </div>
                                      <div className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                                        {events.length}
                                      </div>
                                    </div>
                                  </AntdCard>
                                </div>

                                {/* Events List */}
                                <div className='space-y-4'>
                                  <div className='flex items-center justify-between'>
                                    <Title
                                      level={5}
                                      className='!mb-0'
                                    >
                                      Danh sách lớp học
                                    </Title>
                                    <AntdButton
                                      type='dashed'
                                      icon={<PlusOutlined />}
                                      onClick={() => {
                                        setClassManagementMode("add");
                                        loadClassManagementData();
                                      }}
                                    >
                                      Thêm lớp
                                    </AntdButton>
                                  </div>

                                  <div className='space-y-3'>
                                    {events.map((event, index) => (
                                      <AntdCard
                                        key={index}
                                        size='small'
                                        className='hover:shadow-md transition-all'
                                      >
                                        <div className='flex items-start justify-between'>
                                          <div className='flex items-start gap-3 flex-1'>
                                            <Avatar
                                              style={{
                                                backgroundColor: event.color,
                                              }}
                                              icon={<EnvironmentOutlined />}
                                              size='default'
                                            />
                                            <div className='flex-1'>
                                              <div className='flex items-center gap-2 mb-2'>
                                                <Text
                                                  strong
                                                  className='text-lg'
                                                >
                                                  {event.className}
                                                </Text>
                                                <Tag color={event.color}>
                                                  {event.slotTitle}
                                                </Tag>
                                              </div>

                                              <div className='space-y-1'>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <ClockCircleOutlined />
                                                  <span>{event.slotTime}</span>
                                                </div>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <BookOutlined />
                                                  <span>{event.course}</span>
                                                </div>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <EnvironmentOutlined />
                                                  <span>{event.poolTitle}</span>
                                                </div>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <UserOutlined />
                                                  <div className='flex items-center gap-2'>
                                                    <Avatar
                                                      size={16}
                                                      src={
                                                        instructorAvatars[
                                                          event.instructorId
                                                        ]
                                                      }
                                                      icon={<UserOutlined />}
                                                    />
                                                    <span>
                                                      {event.instructorName}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className='flex flex-col gap-1'>
                                            <Tooltip title='Xem chi tiết'>
                                              <AntdButton
                                                type='text'
                                                size='small'
                                                icon={<EyeOutlined />}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleOpenDetailModal(event);
                                                }}
                                              />
                                            </Tooltip>
                                            <Tooltip title='Xóa lớp học'>
                                              <AntdButton
                                                type='text'
                                                size='small'
                                                icon={<DeleteOutlined />}
                                                danger
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  setScheduleToDelete({
                                                    scheduleId:
                                                      event.scheduleId,
                                                    className: event.className,
                                                    date: drawerDate.format(
                                                      "YYYY-MM-DD"
                                                    ),
                                                    slotTitle: event.slotTitle,
                                                  });
                                                  setDeleteDialogOpen(true);
                                                }}
                                              />
                                            </Tooltip>
                                          </div>
                                        </div>
                                      </AntdCard>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ),
                    },
                    ...(!drawerDate.isBefore(dayjs(), "day")
                      ? [
                          {
                            key: "add",
                            label: "Thêm lớp học",
                            children: (
                              <div className='space-y-4'>
                                <Alert
                                  message={`Thêm lớp học cho ngày ${drawerDate.format(
                                    "DD/MM/YYYY"
                                  )}`}
                                  type='info'
                                  showIcon
                                  className='mb-4'
                                />

                                {availableInstructors.length === 0 && (
                                  <Alert
                                    message='Không có giáo viên nào'
                                    description='Vui lòng thêm giáo viên vào hệ thống trước khi tạo lớp học.'
                                    type='warning'
                                    showIcon
                                    className='mb-4'
                                  />
                                )}

                                {classManagementLoading ? (
                                  <div className='text-center py-8'>
                                    <Spin size='large' />
                                    <p className='mt-4 text-gray-600'>
                                      Đang tải dữ liệu...
                                    </p>
                                  </div>
                                ) : (
                                  <Form layout='vertical'>
                                    <Form.Item
                                      label='Khung giờ'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedSlot}
                                        onChange={setSelectedSlot}
                                        placeholder='Chọn khung giờ'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availableSlots.map((slot) => (
                                          <Option
                                            key={slot._id}
                                            value={slot._id}
                                          >
                                            {slot.title} (
                                            {Math.floor(slot.start_time)
                                              .toString()
                                              .padStart(2, "0")}
                                            :
                                            {slot.start_minute
                                              .toString()
                                              .padStart(2, "0")}{" "}
                                            -
                                            {Math.floor(slot.end_time)
                                              .toString()
                                              .padStart(2, "0")}
                                            :
                                            {slot.end_minute
                                              .toString()
                                              .padStart(2, "0")}
                                            )
                                          </Option>
                                        ))}
                                      </AntdSelect>
                                    </Form.Item>

                                    <Form.Item
                                      label='Lớp học'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedClassroom}
                                        onChange={setSelectedClassroom}
                                        placeholder='Chọn lớp học'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availableClassrooms.map(
                                          (classroom) => (
                                            <Option
                                              key={classroom._id}
                                              value={classroom._id}
                                            >
                                              {classroom.name} -{" "}
                                              {classroom.course?.title ||
                                                "Không có khóa học"}
                                            </Option>
                                          )
                                        )}
                                      </AntdSelect>
                                    </Form.Item>

                                    <Form.Item
                                      label='Hồ bơi'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedPool}
                                        onChange={setSelectedPool}
                                        placeholder='Chọn hồ bơi'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availablePools.map((pool) => (
                                          <Option
                                            key={pool._id}
                                            value={pool._id}
                                          >
                                            {pool.title} ({pool.type}) - Sức
                                            chứa: {pool.capacity}
                                          </Option>
                                        ))}
                                      </AntdSelect>
                                    </Form.Item>

                                    <Form.Item
                                      label='Giáo viên'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedInstructor}
                                        onChange={setSelectedInstructor}
                                        placeholder='Chọn giáo viên'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availableInstructors.map(
                                          (instructor) => (
                                            <Option
                                              key={instructor._id}
                                              value={instructor._id}
                                            >
                                              <div className='flex items-center gap-2'>
                                                <Avatar
                                                  size={24}
                                                  src={
                                                    instructorAvatars[
                                                      instructor._id
                                                    ]
                                                  }
                                                  icon={<UserOutlined />}
                                                />
                                                <span>
                                                  {instructor.username} (
                                                  {instructor.email})
                                                  {instructor.is_active ===
                                                    false && (
                                                    <span className='text-red-500'>
                                                      {" "}
                                                      - Không hoạt động
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            </Option>
                                          )
                                        )}
                                      </AntdSelect>
                                    </Form.Item>

                                    <div className='flex gap-2 pt-4'>
                                      <AntdButton
                                        type='primary'
                                        icon={<SaveOutlined />}
                                        loading={classManagementLoading}
                                        onClick={handleAddNewClass}
                                        disabled={
                                          !selectedSlot ||
                                          !selectedClassroom ||
                                          !selectedPool ||
                                          !selectedInstructor ||
                                          availableInstructors.length === 0
                                        }
                                        title={
                                          availableInstructors.length === 0
                                            ? "Không thể thêm lớp học: Không có giáo viên nào"
                                            : ""
                                        }
                                      >
                                        Thêm lớp học
                                      </AntdButton>
                                      <AntdButton
                                        icon={<CloseOutlined />}
                                        onClick={resetClassManagementForm}
                                      >
                                        Hủy
                                      </AntdButton>
                                    </div>
                                  </Form>
                                )}
                              </div>
                            ),
                          },
                        ]
                      : []),
                    ...(editingEvent
                      ? [
                          {
                            key: "edit",
                            label: "Chỉnh sửa lớp học",
                            children: (
                              <div className='space-y-4'>
                                <Alert
                                  message={`Chỉnh sửa lớp học: ${editingEvent.className}`}
                                  type='warning'
                                  showIcon
                                  className='mb-4'
                                />

                                {availableInstructors.length === 0 && (
                                  <Alert
                                    message='Không có giáo viên nào'
                                    description='Vui lòng thêm giáo viên vào hệ thống trước khi chỉnh sửa lớp học.'
                                    type='error'
                                    showIcon
                                    className='mb-4'
                                  />
                                )}

                                {classManagementLoading ? (
                                  <div className='text-center py-8'>
                                    <Spin size='large' />
                                    <p className='mt-4 text-gray-600'>
                                      Đang tải dữ liệu...
                                    </p>
                                  </div>
                                ) : (
                                  <Form layout='vertical'>
                                    <Form.Item
                                      label='Khung giờ'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedSlot}
                                        onChange={setSelectedSlot}
                                        placeholder='Chọn khung giờ'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availableSlots.map((slot) => (
                                          <Option
                                            key={slot._id}
                                            value={slot._id}
                                          >
                                            {slot.title} (
                                            {Math.floor(slot.start_time)
                                              .toString()
                                              .padStart(2, "0")}
                                            :
                                            {slot.start_minute
                                              .toString()
                                              .padStart(2, "0")}{" "}
                                            -
                                            {Math.floor(slot.end_time)
                                              .toString()
                                              .padStart(2, "0")}
                                            :
                                            {slot.end_minute
                                              .toString()
                                              .padStart(2, "0")}
                                            )
                                          </Option>
                                        ))}
                                      </AntdSelect>
                                    </Form.Item>

                                    <Form.Item
                                      label='Lớp học'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedClassroom}
                                        onChange={setSelectedClassroom}
                                        placeholder='Chọn lớp học'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availableClassrooms.map(
                                          (classroom) => (
                                            <Option
                                              key={classroom._id}
                                              value={classroom._id}
                                            >
                                              {classroom.name} -{" "}
                                              {classroom.course?.title ||
                                                "Không có khóa học"}
                                            </Option>
                                          )
                                        )}
                                      </AntdSelect>
                                    </Form.Item>

                                    <Form.Item
                                      label='Hồ bơi'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedPool}
                                        onChange={setSelectedPool}
                                        placeholder='Chọn hồ bơi'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availablePools.map((pool) => (
                                          <Option
                                            key={pool._id}
                                            value={pool._id}
                                          >
                                            {pool.title} ({pool.type}) - Sức
                                            chứa: {pool.capacity}
                                          </Option>
                                        ))}
                                      </AntdSelect>
                                    </Form.Item>

                                    <Form.Item
                                      label='Giáo viên'
                                      required
                                    >
                                      <AntdSelect
                                        value={selectedInstructor}
                                        onChange={setSelectedInstructor}
                                        placeholder='Chọn giáo viên'
                                        showSearch
                                        optionFilterProp='children'
                                      >
                                        {availableInstructors.map(
                                          (instructor) => (
                                            <Option
                                              key={instructor._id}
                                              value={instructor._id}
                                            >
                                              <div className='flex items-center gap-2'>
                                                <Avatar
                                                  size={24}
                                                  src={
                                                    instructorAvatars[
                                                      instructor._id
                                                    ]
                                                  }
                                                  icon={<UserOutlined />}
                                                />
                                                <span>
                                                  {instructor.username} (
                                                  {instructor.email})
                                                  {instructor.is_active ===
                                                    false && (
                                                    <span className='text-red-500'>
                                                      {" "}
                                                      - Không hoạt động
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            </Option>
                                          )
                                        )}
                                      </AntdSelect>
                                    </Form.Item>

                                    <div className='flex gap-2 pt-4'>
                                      <AntdButton
                                        type='primary'
                                        icon={<SaveOutlined />}
                                        loading={classManagementLoading}
                                        onClick={handleUpdateClass}
                                        disabled={
                                          !selectedSlot ||
                                          !selectedClassroom ||
                                          !selectedPool ||
                                          !selectedInstructor ||
                                          availableInstructors.length === 0
                                        }
                                        title={
                                          availableInstructors.length === 0
                                            ? "Không thể cập nhật lớp học: Không có giáo viên nào"
                                            : ""
                                        }
                                      >
                                        Cập nhật
                                      </AntdButton>
                                      <AntdButton
                                        icon={<CloseOutlined />}
                                        onClick={resetClassManagementForm}
                                      >
                                        Hủy
                                      </AntdButton>
                                    </div>
                                  </Form>
                                )}
                              </div>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            )
          )}
        </Drawer>

        {/* Delete Confirmation Modal */}
        <Modal
          title={
            <Space>
              <DeleteOutlined className='text-red-500' />
              Xác nhận xóa lớp học
            </Space>
          }
          open={deleteDialogOpen}
          onCancel={() => setDeleteDialogOpen(false)}
          footer={[
            <AntdButton
              key='cancel'
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </AntdButton>,
            <AntdButton
              key='delete'
              type='primary'
              danger
              loading={isDeleting}
              onClick={handleDeleteScheduleEvent}
            >
              Xóa lớp học
            </AntdButton>,
          ]}
        >
          {scheduleToDelete && (
            <div>
              <Alert
                message='Bạn đang xóa lớp học khỏi lịch'
                type='warning'
                showIcon
                className='mb-4'
              />
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <Text type='secondary'>Lớp học:</Text>
                  <Text strong>{scheduleToDelete.className}</Text>
                </div>
                <div className='flex justify-between'>
                  <Text type='secondary'>Ngày:</Text>
                  <Text>
                    {dayjs(scheduleToDelete.date).format("DD/MM/YYYY dddd")}
                  </Text>
                </div>
                <div className='flex justify-between'>
                  <Text type='secondary'>Khung giờ:</Text>
                  <Tag>{scheduleToDelete.slotTitle}</Tag>
                </div>
              </div>
              <Alert
                message='Lưu ý: Hành động này không thể hoàn tác!'
                type='error'
                showIcon
                className='mt-4'
              />
            </div>
          )}
        </Modal>

        {/* Class Detail Modal */}
        <ClassDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedScheduleEvent(null);
          }}
          scheduleEvent={selectedScheduleEvent}
          onEdit={(event) => {
            // Convert ScheduleEvent back to CalendarEvent format if needed for editing
            const calendarEvent = formatScheduleEvent(event);
            setEditingEvent(calendarEvent);
            setClassManagementMode("edit");
            loadClassManagementData();
          }}
          onDelete={(event) => {
            setScheduleToDelete({
              scheduleId: event._id,
              className: event.classroom?.name || "Không xác định",
              date: event.date.split("T")[0],
              slotTitle: event.slot?.title || "Không xác định",
            });
            setDeleteDialogOpen(true);
          }}
        />
      </div>
    </ConfigProvider>
  );
}
