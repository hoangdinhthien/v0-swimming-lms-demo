"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "../../../../styles/calendar-dark-mode.css";
import {
  message,
  Button as AntdButton,
  Select as AntdSelect,
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
  Input as AntdInput,
  TimePicker,
  Radio,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  SearchOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Loader2, RefreshCw } from "lucide-react";
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
  type Course,
  type Instructor as ScheduleInstructor,
  type PoolOverflowWarning,
  convertApiDayToJsDay,
  convertJsDayToApiDay,
} from "@/api/manager/schedule-api";
import { fetchAllSlots, type SlotDetail } from "@/api/manager/slot-api";
import {
  fetchClasses,
  addClassToSchedule,
  type Classroom,
  type ClassItem,
} from "@/api/manager/class-api";
import { autoScheduleClass } from "@/api/manager/schedule-api";
import { fetchPools, type Pool } from "@/api/manager/pools-api";
import { fetchInstructors } from "@/api/manager/instructors-api";
import { getMediaDetails } from "@/api/media-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { useToast } from "@/hooks/use-toast";
import {
  useCachedAPI,
  usePerformanceMonitor,
  apiCache,
} from "@/hooks/use-api-cache";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ClassDetailModal from "@/components/manager/class-detail-modal";
import {
  ScheduleCalendar,
  type CalendarEvent as ScheduleCalendarEvent,
} from "@/components/manager/schedule-calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, CheckCircle2, Settings, CalendarPlus } from "lucide-react";

const { Option } = AntdSelect;
const { Text } = Typography;

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
  classroomId: string; // Add classroom ID for editing
  instructorId: string;
  instructorName: string;
  scheduleId: string;
  slotId: string;
  type: "class" | "event";
  color?: string;
}

export default function ImprovedAntdCalendarPage() {
  usePerformanceMonitor("ImprovedAntdCalendarPage");

  const { toast } = useToast();

  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [poolOverflowWarnings, setPoolOverflowWarnings] = useState<
    PoolOverflowWarning[]
  >([]);
  const [isAlertExpanded, setIsAlertExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<Dayjs | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);

  // Performance optimization: Track last load time to avoid redundant calls
  const [lastClassDataLoad, setLastClassDataLoad] = useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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

  // staff/manager permission helper
  const { isStaff } = useStaffPermissions();

  // Auto schedule from calendar modal states
  const [isCalendarAutoScheduleModalOpen, setIsCalendarAutoScheduleModalOpen] =
    useState(false);
  const [availableClassesForAutoSchedule, setAvailableClassesForAutoSchedule] =
    useState<ClassItem[]>([]);
  const [selectedClassForAutoSchedule, setSelectedClassForAutoSchedule] =
    useState<string>("");
  const [loadingClassesForAutoSchedule, setLoadingClassesForAutoSchedule] =
    useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);
  const [autoScheduleData, setAutoScheduleData] = useState({
    min_time: 7,
    max_time: 18,
    session_in_week: 3,
    array_number_in_week: [] as number[],
  });
  const [showAutoScheduleForm, setShowAutoScheduleForm] = useState(false);

  // NOTE: defer loading slots/classrooms/pools until manager opens drawer to add/edit
  // This reduces initial page load time. Data will be fetched by `loadClassManagementData()`
  // which is triggered when user opens the Add/Edit UI.
  const allSlots = undefined;
  const slotsLoading = false;
  const slotsError = null;

  // NOTE: we intentionally DO NOT pre-load class management data on mount.
  // That prevents extra API calls and speeds up initial calendar rendering.
  // loadClassManagementData(false) is called when manager opens Add/Edit in the drawer.

  // Effect to fetch data when component mounts or current date changes
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      setError(null);

      try {
        // If the current user is staff, the API requires a 'service: Schedule' header
        const result = await fetchMonthSchedule(
          currentDate.toDate(),
          undefined,
          undefined,
          isStaff ? "Schedule" : undefined
        );

        setScheduleEvents(result.events);
        setPoolOverflowWarnings(result.poolOverflowWarnings);

        // Show warning toast if there are pool capacity overflows
        if (result.poolOverflowWarnings.length > 0) {
          message.warning({
            content: ` -  Có ${result.poolOverflowWarnings.length} hồ bơi vượt quá sức chứa!`,
            duration: 5,
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

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    const dateStr = date.format("YYYY-MM-DD");
    const dayEvents = scheduleEvents.filter((event) => {
      const eventDateStr = event.date.split("T")[0];
      return eventDateStr === dateStr;
    });

    return dayEvents.map(formatScheduleEvent);
  };

  // Get all calendar events (for ScheduleCalendar component)
  const getAllCalendarEvents = (): ScheduleCalendarEvent[] => {
    return scheduleEvents.map((scheduleEvent) => {
      const slot = scheduleEvent.slot;
      const classroom = scheduleEvent.classroom;
      const pool = scheduleEvent.pool;
      const instructor = scheduleEvent.instructor;
      const eventDate = dayjs(scheduleEvent.date.split("T")[0]);
      const course = classroom?.course;

      return {
        scheduleId: scheduleEvent._id,
        classroomId: classroom?._id || "",
        className: classroom?.name || "Không xác định",
        slotId: slot?._id || "",
        slotTitle: slot?.title || "Không xác định",
        slotTime: `${eventDate.format("DD/MM/YYYY")} - ${
          slot
            ? `${Math.floor(slot.start_time)
                .toString()
                .padStart(2, "0")}:${slot.start_minute
                .toString()
                .padStart(2, "0")} - ${Math.floor(slot.end_time)
                .toString()
                .padStart(2, "0")}:${slot.end_minute
                .toString()
                .padStart(2, "0")}`
            : ""
        }`,
        date: eventDate.format("YYYY-MM-DD"), // Add date field for easier filtering
        course: getCourseName(course),
        courseId: typeof course === "object" && course?._id ? course._id : "",
        poolId: pool?._id || "",
        poolTitle: pool?.title || "Không xác định",
        instructorId: instructor?._id || "",
        instructorName: instructor?.username || "Không xác định",
        color: getEventColor(course),
      };
    });
  };

  // Get course name from course object
  const getCourseName = (course: any): string => {
    if (course && typeof course === "object" && course.title) {
      return course.title;
    }
    if (typeof course === "string") {
      return course; // Fallback for old format
    }
    return "Không xác định";
  };

  // Transform schedule event to display format
  const formatScheduleEvent = (scheduleEvent: ScheduleEvent): CalendarEvent => {
    const slot = scheduleEvent.slot;
    const classroom = scheduleEvent.classroom;
    const pool = scheduleEvent.pool;
    const instructor = scheduleEvent.instructor; // Get instructor object directly

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
      course: getCourseName(classroom?.course), // Resolve course name
      poolTitle: pool?.title || "Không xác định",
      poolId: pool?._id || "",
      classroomId: classroom?._id || "", // Add classroom ID for editing
      instructorId: instructor?._id || "",
      instructorName: instructor?.username || "Không xác định",
      scheduleId: scheduleEvent._id,
      slotId: slot?._id || "",
      type: "class",
      color: getEventColor(classroom?.course),
    };
  };

  // Get color for event based on course type
  const getEventColor = (course: any): string => {
    const courseName = getCourseName(course);
    const colorMap: { [key: string]: string } = {
      "Khóa bơi phụ huynh và bé": "#52c41a",
      "Khóa bơi nâng cao cho thiếu niên": "#1890ff",
      "Khóa bơi cho người lớn mới bắt đầu": "#fa8c16",
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

    // Generate consistent color based on course name or ID
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
    const courseId = course?._id || courseName || "default";
    const hash = courseId.split("").reduce((a: number, b: string) => {
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

  // Handle date select from calendar - open drawer but prevent month navigation
  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    // Open drawer when clicking a date
    setDrawerDate(date);
    setDrawerOpen(true);
    // Don't update currentDate to prevent automatic month navigation
  };

  // Custom date cell renderer (kept for backward compatibility but not used directly)
  const dateCellRender = (value: Dayjs) => {
    const events = getEventsForDate(value);
    const isToday = value.isSame(dayjs(), "day");
    const isPast = value.isBefore(dayjs(), "day");
    const isFuture = value.isAfter(dayjs(), "day");

    // No need for handleCellClick - onSelect handles drawer opening

    if (events.length === 0) {
      return (
        <div
          className={`h-full min-h-[120px] p-2 ${
            isPast ? "opacity-60" : ""
          } hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
        >
          <div className='text-xs text-gray-400 dark:text-gray-600 text-center py-2'>
            Chưa có lớp học
          </div>
        </div>
      );
    }

    return (
      <div
        className={`h-full min-h-[120px] p-1 ${
          isPast ? "opacity-60" : ""
        } hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
      >
        <ul className='events-list max-h-[135px] overflow-y-auto overflow-x-auto space-y-2 pr-1 pb-2'>
          {events.map((event, index) => (
            <li
              key={index}
              className='event-item'
            >
              <div
                className='cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-1.5 transition-colors text-xs whitespace-nowrap inline-block min-w-full'
                style={{
                  backgroundColor: `${event.color}15`,
                  borderLeft: `3px solid ${event.color}`,
                }}
              >
                <span className='font-medium'>{event.slotTitle}</span>
                {" - "}
                <span>{event.className}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Filter events based on search query
  const filterEvents = (events: CalendarEvent[]): CalendarEvent[] => {
    if (!searchQuery.trim()) return events;

    const query = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.className.toLowerCase().includes(query) ||
        event.slotTitle.toLowerCase().includes(query) ||
        event.course.toLowerCase().includes(query) ||
        event.poolTitle.toLowerCase().includes(query) ||
        event.instructorName.toLowerCase().includes(query)
    );
  };

  // Group events by slot
  const groupEventsBySlot = (events: CalendarEvent[]) => {
    const grouped: { [slotTitle: string]: CalendarEvent[] } = {};

    events.forEach((event) => {
      const slotTitle = event.slotTitle;
      if (!grouped[slotTitle]) {
        grouped[slotTitle] = [];
      }
      grouped[slotTitle].push(event);
    });

    // Sort slots by time (extract start time from slotTime)
    return Object.entries(grouped).sort((a, b) => {
      const timeA = a[1][0]?.slotTime.split(" - ")[0] || "";
      const timeB = b[1][0]?.slotTime.split(" - ")[0] || "";
      return timeA.localeCompare(timeB);
    });
  };

  // Handle delete schedule event
  const handleDeleteScheduleEvent = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteScheduleEvent(scheduleToDelete.scheduleId);
      message.success(`Đã xóa lớp ${scheduleToDelete.className} khỏi lịch`);

      // Refresh data without changing page
      const result = await fetchMonthSchedule(
        currentDate.toDate(),
        undefined,
        undefined,
        isStaff ? "Schedule" : undefined
      );

      setScheduleEvents(result.events);
      setPoolOverflowWarnings(result.poolOverflowWarnings);
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (err) {
      console.error("Error deleting schedule event:", err);
      message.error("Có lỗi xảy ra khi xóa lịch học");
    } finally {
      setIsDeleting(false);
    }
  };

  // Load instructor avatars in parallel (optimized)
  const loadInstructorAvatarsOptimized = async (instructors: Instructor[]) => {
    try {
      // Process all avatars in parallel instead of sequential
      const avatarPromises = instructors.map(async (instructor) => {
        try {
          if (
            instructor.featured_image &&
            instructor.featured_image.length > 0
          ) {
            const imageData = instructor.featured_image[0];
            if (imageData.path && imageData.path.length > 0) {
              if (imageData.path[0].startsWith("http")) {
                return { [instructor._id]: imageData.path[0] };
              } else {
                const mediaPath = await getMediaDetails(imageData.path[0]);
                if (mediaPath) {
                  return { [instructor._id]: mediaPath };
                }
              }
            }
          }
          return null;
        } catch (error) {
          console.error(
            `Error loading avatar for instructor ${instructor.username}:`,
            error
          );
          return null;
        }
      });

      // Wait for all avatar requests to complete
      const avatarResults = await Promise.all(avatarPromises);

      // Merge all results into single object
      const avatarMap = avatarResults
        .filter((result) => result !== null)
        .reduce((acc, result) => ({ ...acc, ...result }), {});

      setInstructorAvatars(avatarMap);
    } catch (error) {
      console.error("Error loading instructor avatars:", error);
    }
  };

  // Load instructor avatars (old sequential version - keeping for fallback)
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

  // Load data for class management with caching and performance optimization
  const loadClassManagementData = async (forceReload = false) => {
    const now = Date.now();

    // Check cache duration and existing data
    if (
      !forceReload &&
      now - lastClassDataLoad < CACHE_DURATION &&
      availableSlots.length > 0 &&
      availableClassrooms.length > 0 &&
      availablePools.length > 0 &&
      availableInstructors.length > 0
    ) {
      return;
    }

    setClassManagementLoading(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      const [slotsData, classesResponse, poolsData, instructorsData] =
        await Promise.all([
          fetchAllSlots(),
          // fetchClasses returns { data: ClassItem[], meta_data }
          fetchClasses(tenantId || undefined, token || undefined, 1, 200),
          fetchPools(),
          fetchInstructors({
            tenantId: tenantId || undefined,
            token: token || undefined,
            role: "instructor",
          }).catch(() =>
            fetchInstructors({
              tenantId: tenantId || undefined,
              token: token || undefined,
            }).catch(() => [])
          ),
        ]);

      const classroomsData = Array.isArray(classesResponse?.data)
        ? classesResponse.data
        : [];

      setAvailableSlots(slotsData);
      setAvailableClassrooms(classroomsData as Classroom[]);
      setAvailablePools(poolsData.pools);
      setAvailableInstructors(instructorsData);
      setLastClassDataLoad(now); // Update last load time

      // Load instructor avatars in parallel (optimized)
      if (instructorsData.length > 0) {
        loadInstructorAvatarsOptimized(instructorsData);
      }

      // Set default selections only if not already set
      if (!selectedSlot && slotsData.length > 0)
        setSelectedSlot(slotsData[0]._id);
      if (!selectedPool && poolsData.pools.length > 0)
        setSelectedPool(poolsData.pools[0]._id);
      if (!selectedInstructor && instructorsData.length > 0)
        setSelectedInstructor(instructorsData[0]._id);
    } catch (error) {
      console.error("Error loading class management data:", error);
      message.error("Không thể tải dữ liệu quản lý lớp học");
    } finally {
      setClassManagementLoading(false);
    }
  };

  // Handle add new class
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
      const newClassData = {
        date: drawerDate.format("YYYY-MM-DD"),
        slot: selectedSlot,
        classroom: selectedClassroom,
        pool: selectedPool,
        instructor: selectedInstructor,
      };

      await addClassToSchedule(newClassData);

      message.success("Đã thêm lớp học vào lịch thành công");

      // Refresh schedule data
      const result = await fetchMonthSchedule(
        currentDate.toDate(),
        undefined,
        undefined,
        isStaff ? "Schedule" : undefined
      );
      setScheduleEvents(result.events);
      setPoolOverflowWarnings(result.poolOverflowWarnings);

      // Show warning if pools are over capacity
      if (result.poolOverflowWarnings.length > 0) {
        message.warning({
          content: ` -  Có ${result.poolOverflowWarnings.length} hồ bơi vượt quá sức chứa!`,
          duration: 5,
        });
      }

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

    // Load current values using proper IDs
    setSelectedSlot(event.slotId);
    setSelectedClassroom(event.classroomId); // Use classroomId instead of id
    setSelectedPool(event.poolId);
    setSelectedInstructor(event.instructorId);

    // Only load class management data if not already loaded (optimized)
    loadClassManagementData(false); // false = don't force reload, use cache if available
  }; // Handle update class
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
      const newClassData = {
        date: drawerDate!.format("YYYY-MM-DD"),
        slot: selectedSlot,
        classroom: selectedClassroom,
        pool: selectedPool,
        instructor: selectedInstructor,
      };

      await addClassToSchedule(newClassData);

      message.success("Đã cập nhật lớp học thành công");

      // Refresh schedule data
      const result = await fetchMonthSchedule(
        currentDate.toDate(),
        undefined,
        undefined,
        isStaff ? "Schedule" : undefined
      );
      setScheduleEvents(result.events);
      setPoolOverflowWarnings(result.poolOverflowWarnings);

      // Show warning if pools are over capacity
      if (result.poolOverflowWarnings.length > 0) {
        message.warning({
          content: ` -  Có ${result.poolOverflowWarnings.length} hồ bơi vượt quá sức chứa!`,
          duration: 5,
        });
      }

      // Reset form
      setClassManagementMode("view");
      setEditingEvent(null);
    } catch (error) {
      console.error("❌ Error updating class:", error);
      message.error(
        `Có lỗi xảy ra khi cập nhật lớp học: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`
      );
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

  // Load classes for auto schedule - fetch all classes, disable those with full schedules
  const loadClassesForAutoSchedule = async () => {
    setLoadingClassesForAutoSchedule(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) return;

      // Fetch all classes (much faster than fetching details for each)
      const classesData = await fetchClasses(tenantId, token, 1, 1000);

      setAvailableClassesForAutoSchedule(classesData.data);
    } catch (error) {
      console.error("Error loading classes for auto schedule:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách lớp học",
      });
    } finally {
      setLoadingClassesForAutoSchedule(false);
    }
  };

  // Helper function to check if a class has full schedules
  const isClassFullyScheduled = (classItem: ClassItem): boolean => {
    const sessionNumber = classItem.course?.session_number || 0;
    const schedulesCount = classItem.schedules?.length || 0;
    return schedulesCount >= sessionNumber;
  };

  // Helper function to get remaining sessions for a class
  const getRemainingSessionsCount = (classItem: ClassItem): number => {
    const sessionNumber = classItem.course?.session_number || 0;
    const schedulesCount = classItem.schedules?.length || 0;
    return Math.max(0, sessionNumber - schedulesCount);
  };

  // Handle opening calendar auto schedule modal
  const handleOpenCalendarAutoSchedule = async () => {
    setIsCalendarAutoScheduleModalOpen(true);
    setSelectedClassForAutoSchedule("");
    setShowAutoScheduleForm(false);
    setAutoScheduleData({
      min_time: 7,
      max_time: 18,
      session_in_week: 3,
      array_number_in_week: [],
    });
    await loadClassesForAutoSchedule();
  };

  // Handle class selection for auto schedule
  const handleClassSelectionForAutoSchedule = (classId: string) => {
    setSelectedClassForAutoSchedule(classId);
    setShowAutoScheduleForm(true);
    setAutoScheduleData({
      min_time: 7,
      max_time: 18,
      session_in_week: 3,
      array_number_in_week: [],
    });
  };

  // Helper function: Convert JavaScript day (0=Sunday, 1=Monday...) to backend array_number_in_week
  const convertJsDayToBackendDay = (jsDay: number): number => {
    const today = new Date();
    const todayDay = today.getDay();
    return (jsDay - todayDay + 7) % 7;
  };

  // Handle day selection for auto schedule
  const handleDayToggleForAutoSchedule = (jsDay: number) => {
    const backendDay = convertJsDayToBackendDay(jsDay);

    setAutoScheduleData((prev) => ({
      ...prev,
      array_number_in_week: prev.array_number_in_week.includes(backendDay)
        ? prev.array_number_in_week.filter((d) => d !== backendDay)
        : [...prev.array_number_in_week, backendDay].sort((a, b) => a - b),
    }));
  };

  // Handle auto schedule form changes
  const handleAutoScheduleChange = (
    field: keyof typeof autoScheduleData,
    value: any
  ) => {
    setAutoScheduleData((prev) => ({ ...prev, [field]: value }));
  };

  // Handle auto schedule submission
  const handleCalendarAutoSchedule = async () => {
    if (!selectedClassForAutoSchedule) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn lớp học",
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

    try {
      setIsAutoScheduling(true);
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) return;

      const requestData = {
        class_id: selectedClassForAutoSchedule,
        ...autoScheduleData,
      };

      await autoScheduleClass(requestData, tenantId, token);

      toast({
        title: "Thành công",
        description: "Đã tự động xếp lịch học thành công",
      });

      // Reload schedule data
      const { events, poolOverflowWarnings } = await fetchMonthSchedule(
        currentDate.toDate(),
        tenantId,
        token
      );
      setScheduleEvents(events);
      setPoolOverflowWarnings(poolOverflowWarnings);

      // Reset and close modal
      setIsCalendarAutoScheduleModalOpen(false);
      setSelectedClassForAutoSchedule("");
      setShowAutoScheduleForm(false);
      setAutoScheduleData({
        min_time: 7,
        max_time: 18,
        session_in_week: 3,
        array_number_in_week: [],
      });
    } catch (error: any) {
      console.error("Auto schedule error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error?.message || "Không thể tự động xếp lịch học. Vui lòng thử lại",
      });
    } finally {
      setIsAutoScheduling(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await fetchMonthSchedule(
        currentDate.toDate(),
        undefined,
        undefined,
        isStaff ? "Schedule" : undefined
      );

      setScheduleEvents(result.events);
      setPoolOverflowWarnings(result.poolOverflowWarnings);

      toast({
        title: "Đã làm mới",
        description: "Lịch học đã được cập nhật",
      });
    } catch (err) {
      console.error("Error refreshing calendar:", err);
      toast({
        title: "❌ Lỗi",
        description: "Không thể làm mới lịch học",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
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
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải lịch học...</p>
      </div>
    );
  }

  if (error || slotsError) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>
            Lỗi tải dữ liệu
          </div>
          <p className='text-muted-foreground'>{error || slotsError}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider locale={locale}>
      <div className='container mx-auto py-8 space-y-6'>
        {/* Header with Auto Schedule and Refresh Buttons */}
        <div className='flex justify-between items-center mb-4'>
          <div>
            <h1 className='text-2xl font-bold'>Lịch học</h1>
            <p className='text-muted-foreground'>
              Quản lý và xếp lịch học cho các lớp
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <AntdButton
              onClick={handleRefresh}
              disabled={refreshing}
              size='large'
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </AntdButton>
            <AntdButton
              type='primary'
              size='large'
              onClick={handleOpenCalendarAutoSchedule}
            >
              Tự động xếp lịch học
            </AntdButton>
          </div>
        </div>
        {/* Pool Overflow Warning Alert */}
        {poolOverflowWarnings.length > 0 && (
          <Accordion
            type='single'
            collapsible
            className='w-full mb-4'
          >
            <AccordionItem
              value='pool-warnings'
              className='border-0'
            >
              <AccordionTrigger className='px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:no-underline hover:bg-yellow-100 dark:hover:bg-yellow-900/30'>
                <div className='flex items-center gap-3 w-full'>
                  <div className='flex-1 text-left'>
                    <span className='font-semibold text-yellow-800 dark:text-yellow-200'>
                      Cảnh báo: Hồ bơi vượt sức chứa
                    </span>
                    <span className='text-sm text-yellow-700 dark:text-yellow-300 ml-2'>
                      ({poolOverflowWarnings.length} cảnh báo)
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className='px-6 pb-4 pt-2 bg-yellow-50 dark:bg-yellow-900/20 border-x border-b border-yellow-200 dark:border-yellow-700 rounded-b-lg'>
                <p className='text-sm text-yellow-700 dark:text-yellow-300 mb-4'>
                  Các hồ bơi sau đang vượt quá sức chứa. Vui lòng xem xét điều
                  chỉnh lịch học:
                </p>

                <div className='space-y-2'>
                  {(() => {
                    // Group warnings by pool ID with details
                    const uniquePools = new Map<
                      string,
                      {
                        pool: (typeof poolOverflowWarnings)[0]["pool"];
                        maxOverCapacity: number;
                        totalMembers: number;
                        poolCapacity: number;
                        details: Array<{
                          date: string;
                          slot: (typeof poolOverflowWarnings)[0]["slot"];
                        }>;
                      }
                    >();

                    poolOverflowWarnings.forEach((warning) => {
                      const poolId = warning.pool._id;
                      const existing = uniquePools.get(poolId);

                      if (existing) {
                        if (warning.overCapacity > existing.maxOverCapacity) {
                          existing.maxOverCapacity = warning.overCapacity;
                        }
                        existing.details.push({
                          date: warning.date,
                          slot: warning.slot,
                        });
                      } else {
                        uniquePools.set(poolId, {
                          pool: warning.pool,
                          maxOverCapacity: warning.overCapacity,
                          totalMembers: warning.totalMembers,
                          poolCapacity: warning.poolCapacity,
                          details: [
                            {
                              date: warning.date,
                              slot: warning.slot,
                            },
                          ],
                        });
                      }
                    });

                    return Array.from(uniquePools.values()).map(
                      (poolData, index) => (
                        <div
                          key={poolData.pool._id}
                          className='border rounded-lg overflow-hidden bg-white dark:bg-gray-800'
                        >
                          <div className='px-4 py-3 bg-yellow-100 dark:bg-yellow-900/30'>
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <span className='font-semibold text-yellow-900 dark:text-yellow-100'>
                                  {poolData.pool.title}
                                </span>
                                <span className='text-sm text-yellow-700 dark:text-yellow-300 ml-2'>
                                  - Sức chứa: {poolData.poolCapacity}, Đang sử
                                  dụng: {poolData.totalMembers}
                                </span>
                                <span className='text-red-600 dark:text-red-400 font-semibold ml-2'>
                                  (Vượt {poolData.maxOverCapacity})
                                </span>
                              </div>
                              <Tag
                                color='orange'
                                className='ml-2'
                              >
                                {poolData.details.length} khung giờ
                              </Tag>
                            </div>
                          </div>
                          <div className='px-4 py-3 bg-white dark:bg-gray-900'>
                            <div className='space-y-2'>
                              {poolData.details.map((detail, idx) => (
                                <div
                                  key={idx}
                                  className='flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-2 px-3 rounded bg-gray-50 dark:bg-gray-800'
                                >
                                  <span className='font-medium'>
                                    {dayjs(detail.date).format(
                                      "DD/MM/YYYY (dddd)"
                                    )}
                                  </span>
                                  <span className='text-gray-400'>-</span>
                                  <span>
                                    {detail.slot.title} (
                                    {Math.floor(detail.slot.start_time)
                                      .toString()
                                      .padStart(2, "0")}
                                    :
                                    {detail.slot.start_minute
                                      .toString()
                                      .padStart(2, "0")}{" "}
                                    -
                                    {Math.floor(detail.slot.end_time)
                                      .toString()
                                      .padStart(2, "0")}
                                    :
                                    {detail.slot.end_minute
                                      .toString()
                                      .padStart(2, "0")}
                                    )
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    );
                  })()}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}{" "}
        {/* Statistics Cards */}
        {scheduleEvents.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              sm={8}
            >
              <Card className='text-center'>
                <CardContent className='pt-6'>
                  <div className='flex flex-col items-center'>
                    <div className='text-2xl font-bold mb-1'>
                      {stats.totalEvents}
                    </div>
                    <p className='text-sm text-muted-foreground flex items-center gap-1'>
                      <TeamOutlined /> Tổng lớp học
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Col>

            <Col
              xs={24}
              sm={8}
            >
              <Card className='text-center'>
                <CardContent className='pt-6'>
                  <div className='flex flex-col items-center'>
                    <div className='text-2xl font-bold mb-1'>
                      {stats.totalSlots}
                    </div>
                    <p className='text-sm text-muted-foreground flex items-center gap-1'>
                      <ClockCircleOutlined /> Tổng khung giờ
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Col>

            <Col
              xs={24}
              sm={8}
            >
              <Card className='text-center'>
                <CardContent className='pt-6'>
                  <div className='flex flex-col items-center'>
                    <div className='text-2xl font-bold mb-1'>
                      {stats.uniquePools}
                    </div>
                    <p className='text-sm text-muted-foreground flex items-center gap-1'>
                      <EnvironmentOutlined /> Hồ bơi sử dụng
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Col>
          </Row>
        )}
        {/* Main Calendar */}
        <Card className='shadow-lg'>
          <ScheduleCalendar
            currentDate={currentDate}
            selectedDate={selectedDate || undefined}
            events={getAllCalendarEvents()}
            onDateSelect={onSelect}
            onMonthChange={(date) => {
              // Only update if it's a genuine month change
              if (!date.isSame(currentDate, "month")) {
                setCurrentDate(date);
              }
            }}
            dateCellRender={(date, events) => {
              // Use existing dateCellRender logic
              const isPast = date.isBefore(dayjs(), "day");

              if (events.length === 0) {
                return (
                  <div className='text-xs text-muted-foreground text-center py-2'>
                    Chưa có lớp học
                  </div>
                );
              }

              return (
                <ul className='space-y-1 max-h-[80px] overflow-y-auto'>
                  {events.map((event, index) => (
                    <li key={index}>
                      <div
                        className='text-xs px-2 py-1 rounded truncate hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors'
                        style={{
                          backgroundColor: `${event.color}15`,
                          borderLeft: `3px solid ${event.color}`,
                        }}
                      >
                        <span className='font-medium'>{event.slotTitle}</span>
                        {" - "}
                        <span>{event.className}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              );
            }}
          />
        </Card>
        {/* Date Details Sheet */}
        <Sheet
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open);
            if (!open) {
              setSearchQuery(""); // Reset search query
              resetClassManagementForm();
              setSelectedDate(undefined); // Reset selected date to remove highlight
            }
          }}
        >
          <SheetContent
            side='right'
            className='w-[480px] sm:max-w-[480px] overflow-y-auto'
          >
            <SheetHeader>
              <SheetTitle className='flex items-center gap-3'>
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
              </SheetTitle>
            </SheetHeader>
            {drawerLoading ? (
              <div className='flex flex-col items-center justify-center py-12'>
                <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
                <p className='text-muted-foreground'>Đang tải chi tiết...</p>
              </div>
            ) : (
              drawerDate && (
                <div className='space-y-6'>
                  <Tabs
                    value={classManagementMode}
                    onValueChange={(value) =>
                      setClassManagementMode(value as "view" | "add" | "edit")
                    }
                  >
                    <TabsList className='grid w-full grid-cols-3'>
                      <TabsTrigger value='view'>Xem lịch học</TabsTrigger>
                      {!drawerDate.isBefore(dayjs(), "day") && (
                        <TabsTrigger value='add'>Thêm lớp học</TabsTrigger>
                      )}
                      {editingEvent && (
                        <TabsTrigger value='edit'>
                          Chỉnh sửa buổi học
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent
                      value='view'
                      className='mt-4'
                    >
                      <div className='space-y-4'>
                        {(() => {
                          const events = getEventsForDate(drawerDate);

                          if (events.length === 0) {
                            const isPast = drawerDate.isBefore(dayjs(), "day");
                            const isToday = drawerDate.isSame(dayjs(), "day");
                            const isFuture = drawerDate.isAfter(dayjs(), "day");

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
                                            loadClassManagementData(false); // Use cache
                                          }}
                                        >
                                          {isToday
                                            ? "Thêm lớp học cho hôm nay"
                                            : "Thêm lớp học mới"}
                                        </AntdButton>
                                      )}
                                      {isPast && (
                                        <div className='text-xs text-gray-400 dark:text-gray-600 mt-2'>
                                          Không thể thêm lớp học cho ngày trong
                                          quá khứ
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
                              {/* Search Bar */}
                              <div className='mb-4'>
                                <AntdInput
                                  placeholder='Tìm kiếm theo lớp học, hồ bơi, giáo viên, khóa học...'
                                  prefix={<SearchOutlined />}
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  allowClear
                                  size='large'
                                />
                              </div>

                              {/* Summary */}
                              <div className='mb-4'>
                                <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'>
                                  <CardContent className='p-4'>
                                    <div className='flex items-center justify-between'>
                                      <div className='flex items-center gap-2'>
                                        <TeamOutlined className='text-blue-600 dark:text-blue-400' />
                                        <span className='font-medium'>
                                          Tổng số lớp học:
                                        </span>
                                      </div>
                                      <div className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                                        {filterEvents(events).length}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Add Class Button */}
                              <div className='mb-4 flex justify-end'>
                                <AntdButton
                                  type='dashed'
                                  icon={<PlusOutlined />}
                                  onClick={() => {
                                    setClassManagementMode("add");
                                    loadClassManagementData(false);
                                  }}
                                >
                                  Thêm lớp
                                </AntdButton>
                              </div>

                              {/* Events List by Slot (Accordion) */}
                              <div className='space-y-2'>
                                {(() => {
                                  const filteredEvents = filterEvents(events);
                                  const groupedEvents =
                                    groupEventsBySlot(filteredEvents);

                                  if (filteredEvents.length === 0) {
                                    return (
                                      <div className='text-center py-8'>
                                        <Empty
                                          image={Empty.PRESENTED_IMAGE_SIMPLE}
                                          description={
                                            <span className='text-gray-500 dark:text-gray-400'>
                                              {searchQuery
                                                ? "Không tìm thấy lớp học nào phù hợp"
                                                : "Không có lớp học nào"}
                                            </span>
                                          }
                                        />
                                      </div>
                                    );
                                  }

                                  return (
                                    <Accordion
                                      type='multiple'
                                      defaultValue={groupedEvents.map(
                                        (_, index) => `slot-${index}`
                                      )}
                                      className='w-full'
                                    >
                                      {groupedEvents.map(
                                        ([slotTitle, slotEvents], index) => (
                                          <AccordionItem
                                            key={`slot-${index}`}
                                            value={`slot-${index}`}
                                            className='border rounded-lg mb-2 overflow-hidden'
                                          >
                                            <AccordionTrigger className='px-4 hover:no-underline bg-gray-50 dark:bg-gray-800'>
                                              <div className='flex items-center gap-3 w-full'>
                                                <ClockCircleOutlined className='text-blue-600 dark:text-blue-400' />
                                                <div className='flex-1 text-left'>
                                                  <span className='font-semibold'>
                                                    {slotTitle}
                                                  </span>
                                                  <span className='text-sm text-gray-500 dark:text-gray-400 ml-2'>
                                                    ({slotEvents[0]?.slotTime})
                                                  </span>
                                                </div>
                                                <Tag color='blue'>
                                                  {slotEvents.length} lớp
                                                </Tag>
                                              </div>
                                            </AccordionTrigger>
                                            <AccordionContent className='px-0 pb-0'>
                                              <div className='space-y-2 p-2'>
                                                {slotEvents.map(
                                                  (event, eventIndex) => (
                                                    <Card
                                                      key={eventIndex}
                                                      className='hover:shadow-md transition-all'
                                                    >
                                                      <CardContent className='p-4'>
                                                        <div className='flex items-start justify-between'>
                                                          <div className='flex items-start gap-3 flex-1'>
                                                            <Avatar
                                                              style={{
                                                                backgroundColor:
                                                                  event.color,
                                                              }}
                                                              icon={
                                                                <EnvironmentOutlined />
                                                              }
                                                              size='small'
                                                            />
                                                            <div className='flex-1'>
                                                              <div className='flex items-center gap-2 mb-2'>
                                                                <span className='font-semibold text-base'>
                                                                  {
                                                                    event.className
                                                                  }
                                                                </span>
                                                              </div>
                                                              <Tag
                                                                color={
                                                                  event.color
                                                                }
                                                                className='text-xs'
                                                              >
                                                                {event.course}
                                                              </Tag>

                                                              <div className='space-y-1'>
                                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                                  <EnvironmentOutlined />
                                                                  <span>
                                                                    {
                                                                      event.poolTitle
                                                                    }
                                                                  </span>
                                                                </div>
                                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                                  <UserOutlined />
                                                                  <span>
                                                                    {
                                                                      event.instructorName
                                                                    }
                                                                  </span>
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>

                                                          <div className='flex flex-col gap-1'>
                                                            <Tooltip title='Xem chi tiết'>
                                                              <AntdButton
                                                                type='text'
                                                                size='small'
                                                                icon={
                                                                  <EyeOutlined />
                                                                }
                                                                onClick={(
                                                                  e
                                                                ) => {
                                                                  e.preventDefault();
                                                                  e.stopPropagation();
                                                                  handleOpenDetailModal(
                                                                    event
                                                                  );
                                                                }}
                                                              />
                                                            </Tooltip>
                                                            <Tooltip title='Xóa lớp học'>
                                                              <AntdButton
                                                                type='text'
                                                                size='small'
                                                                icon={
                                                                  <DeleteOutlined />
                                                                }
                                                                danger
                                                                onClick={(
                                                                  e
                                                                ) => {
                                                                  e.preventDefault();
                                                                  e.stopPropagation();
                                                                  setScheduleToDelete(
                                                                    {
                                                                      scheduleId:
                                                                        event.scheduleId,
                                                                      className:
                                                                        event.className,
                                                                      date: drawerDate.format(
                                                                        "YYYY-MM-DD"
                                                                      ),
                                                                      slotTitle:
                                                                        event.slotTitle,
                                                                    }
                                                                  );
                                                                  setDeleteDialogOpen(
                                                                    true
                                                                  );
                                                                }}
                                                              />
                                                            </Tooltip>
                                                          </div>
                                                        </div>
                                                      </CardContent>
                                                    </Card>
                                                  )
                                                )}
                                              </div>
                                            </AccordionContent>
                                          </AccordionItem>
                                        )
                                      )}
                                    </Accordion>
                                  );
                                })()}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </TabsContent>

                    {!drawerDate.isBefore(dayjs(), "day") && (
                      <TabsContent
                        value='add'
                        className='mt-4'
                      >
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
                            <div className='flex flex-col items-center justify-center py-8'>
                              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
                              <p className='text-muted-foreground'>
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
                                  {availableClassrooms.map((classroom) => (
                                    <Option
                                      key={classroom._id}
                                      value={classroom._id}
                                    >
                                      {classroom.name} -{" "}
                                      {classroom.course?.title ||
                                        "Không có khóa học"}
                                    </Option>
                                  ))}
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
                                  {availablePools.map((pool) => {
                                    const isOverCapacity =
                                      poolOverflowWarnings.some(
                                        (w) => w.pool._id === pool._id
                                      );
                                    const warningInfo =
                                      poolOverflowWarnings.find(
                                        (w) => w.pool._id === pool._id
                                      );
                                    return (
                                      <Option
                                        key={pool._id}
                                        value={pool._id}
                                        disabled={isOverCapacity}
                                      >
                                        {pool.title} ({pool.type}) - Sức chứa:{" "}
                                        {pool.capacity}
                                        {isOverCapacity && warningInfo && (
                                          <span className='text-red-600 font-semibold'>
                                            {" "}
                                            - Vượt {warningInfo.overCapacity}
                                          </span>
                                        )}
                                      </Option>
                                    );
                                  })}
                                </AntdSelect>
                                {/* {poolOverflowWarnings.length > 0 && (
                                        <div className='text-xs text-yellow-600 mt-1'>
                                          Có hồ bơi vượt sức chứa
                                        </div>
                                      )} */}
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
                                  {availableInstructors.map((instructor) => (
                                    <Option
                                      key={instructor._id}
                                      value={instructor._id}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <Avatar
                                          size={24}
                                          src={
                                            instructorAvatars[instructor._id]
                                          }
                                          icon={<UserOutlined />}
                                        />
                                        <span>
                                          {instructor.username} (
                                          {instructor.email})
                                          {instructor.is_active === false && (
                                            <span className='text-red-500'>
                                              {" "}
                                              - Không hoạt động
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </Option>
                                  ))}
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
                      </TabsContent>
                    )}

                    {editingEvent && (
                      <TabsContent
                        value='edit'
                        className='mt-4'
                      >
                        <div className='space-y-4'>
                          {classManagementLoading ? (
                            <div className='flex flex-col items-center justify-center py-8'>
                              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
                              <p className='text-muted-foreground'>
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
                                  getPopupContainer={(trigger) =>
                                    trigger.parentElement || document.body
                                  }
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
                                  getPopupContainer={(trigger) =>
                                    trigger.parentElement || document.body
                                  }
                                >
                                  {availableClassrooms.map((classroom) => (
                                    <Option
                                      key={classroom._id}
                                      value={classroom._id}
                                    >
                                      {classroom.name} -{" "}
                                      {classroom.course?.title ||
                                        "Không có khóa học"}
                                    </Option>
                                  ))}
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
                                  getPopupContainer={(trigger) =>
                                    trigger.parentElement || document.body
                                  }
                                >
                                  {availablePools.map((pool) => {
                                    const isOverCapacity =
                                      poolOverflowWarnings.some(
                                        (w) => w.pool._id === pool._id
                                      );
                                    const warningInfo =
                                      poolOverflowWarnings.find(
                                        (w) => w.pool._id === pool._id
                                      );
                                    return (
                                      <Option
                                        key={pool._id}
                                        value={pool._id}
                                        disabled={isOverCapacity}
                                      >
                                        {pool.title} ({pool.type}) - Sức chứa:{" "}
                                        {pool.capacity}
                                        {isOverCapacity && warningInfo && (
                                          <span className='text-red-600 font-semibold'>
                                            {" "}
                                            - Vượt {warningInfo.overCapacity}
                                          </span>
                                        )}
                                      </Option>
                                    );
                                  })}
                                </AntdSelect>
                                {/* {poolOverflowWarnings.length > 0 && (
                                        <div className='text-xs text-yellow-600 mt-1'>
                                          Có hồ bơi vượt sức chứa
                                        </div>
                                      )} */}
                              </Form.Item>

                              <Form.Item
                                label='Giáo viên phụ trách buổi học'
                                required
                              >
                                <AntdSelect
                                  value={selectedInstructor}
                                  onChange={setSelectedInstructor}
                                  placeholder='Chọn giáo viên'
                                  showSearch
                                  optionFilterProp='children'
                                  getPopupContainer={(trigger) =>
                                    trigger.parentElement || document.body
                                  }
                                >
                                  {availableInstructors.map((instructor) => (
                                    <Option
                                      key={instructor._id}
                                      value={instructor._id}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <Avatar
                                          size={24}
                                          src={
                                            instructorAvatars[instructor._id]
                                          }
                                          icon={<UserOutlined />}
                                        />
                                        <span>
                                          {instructor.username} (
                                          {instructor.email})
                                          {instructor.is_active === false && (
                                            <span className='text-red-500'>
                                              {" "}
                                              - Không hoạt động
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    </Option>
                                  ))}
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
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              )
            )}
          </SheetContent>
        </Sheet>
        {/* Delete Confirmation AlertDialog */}
        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='flex items-center gap-2'>
                <DeleteOutlined className='text-red-500' />
                Xác nhận xóa lớp học
              </AlertDialogTitle>
              <AlertDialogDescription>
                {scheduleToDelete && (
                  <div className='space-y-4'>
                    <Alert
                      message='Bạn đang xóa lớp học khỏi lịch'
                      type='warning'
                      showIcon
                      className='mb-4'
                    />
                    <div className='space-y-2 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Lớp học:</span>
                        <span className='font-semibold'>
                          {scheduleToDelete.className}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>Ngày:</span>
                        <span>
                          {dayjs(scheduleToDelete.date).format(
                            "DD/MM/YYYY dddd"
                          )}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground'>
                          Khung giờ:
                        </span>
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
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteScheduleEvent();
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang xóa...
                  </>
                ) : (
                  "Xóa lớp học"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

            // Set drawer date to the event date for editing
            setDrawerDate(dayjs(event.date));

            // Use handleEditClass to properly pre-fill form data
            handleEditClass(calendarEvent);

            // Open drawer if it's not already open
            if (!drawerOpen) {
              setDrawerOpen(true);
            }

            // Close the modal after switching to edit mode
            setDetailModalOpen(false);
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
        {/* Auto Schedule Modal */}
        <Dialog
          open={isCalendarAutoScheduleModalOpen}
          onOpenChange={(open) => {
            setIsCalendarAutoScheduleModalOpen(open);
            if (!open) {
              setSelectedClassForAutoSchedule("");
              setShowAutoScheduleForm(false);
            }
          }}
        >
          <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-2xl'>
                Tự động xếp lịch học
              </DialogTitle>
              <DialogDescription className='text-base'>
                {!showAutoScheduleForm
                  ? "Chọn lớp học cần xếp lịch tự động. Chỉ hiển thị các lớp còn buổi học chưa được xếp lịch."
                  : "Hệ thống sẽ tự động sắp xếp lịch học dựa trên thời gian và ngày bạn chọn"}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-6'>
              {!showAutoScheduleForm ? (
                <>
                  {loadingClassesForAutoSchedule ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                      <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
                      <p className='text-muted-foreground'>
                        Đang tải danh sách lớp học...
                      </p>
                    </div>
                  ) : availableClassesForAutoSchedule.length === 0 ? (
                    <div className='text-center py-12'>
                      <p className='text-muted-foreground'>
                        Không có lớp học nào cần xếp lịch
                      </p>
                    </div>
                  ) : (
                    <div className='space-y-3 max-h-96 overflow-y-auto'>
                      {availableClassesForAutoSchedule.map((classItem) => {
                        const isFullyScheduled =
                          isClassFullyScheduled(classItem);
                        const remainingSessions =
                          getRemainingSessionsCount(classItem);
                        const schedulesCount = classItem.schedules?.length || 0;

                        return (
                          <div
                            key={classItem._id}
                            className={`p-4 border rounded-lg transition-all ${
                              isFullyScheduled
                                ? "opacity-50 cursor-not-allowed bg-muted/20"
                                : "cursor-pointer hover:shadow-md"
                            } ${
                              selectedClassForAutoSchedule === classItem._id
                                ? "border-primary bg-primary/5"
                                : isFullyScheduled
                                ? "border-muted"
                                : "hover:border-primary/50"
                            }`}
                            onClick={() => {
                              if (!isFullyScheduled) {
                                handleClassSelectionForAutoSchedule(
                                  classItem._id
                                );
                              }
                            }}
                          >
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                  <h3 className='font-semibold text-lg'>
                                    {classItem.name}
                                  </h3>
                                  {isFullyScheduled && (
                                    <Tag color='green'>Đã đủ lịch</Tag>
                                  )}
                                </div>
                                <p className='text-sm text-muted-foreground mt-1'>
                                  {classItem.course?.title || "Không xác định"}
                                </p>
                                <div className='mt-2 flex items-center gap-4 text-sm'>
                                  <span>
                                    Tổng:{" "}
                                    <span className='font-semibold'>
                                      {classItem.course?.session_number || 0}
                                    </span>{" "}
                                    buổi
                                  </span>
                                  <span>
                                    Đã xếp:{" "}
                                    <span className='font-semibold'>
                                      {schedulesCount}
                                    </span>
                                  </span>
                                  {!isFullyScheduled && (
                                    <span className='text-orange-600 font-semibold'>
                                      Còn thiếu: {remainingSessions} buổi
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Radio
                                checked={
                                  selectedClassForAutoSchedule === classItem._id
                                }
                                disabled={isFullyScheduled}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {(() => {
                    const selectedClass = availableClassesForAutoSchedule.find(
                      (c) => c._id === selectedClassForAutoSchedule
                    );
                    return (
                      <>
                        {/* BEFORE/AFTER Comparison */}
                        <div className='grid grid-cols-2 gap-4'>
                          {/* HIỆN TẠI */}
                          <div className='border rounded-lg p-4 bg-muted/30'>
                            <div className='flex items-center gap-2 mb-3'>
                              <Clock className='h-4 w-4 text-muted-foreground' />
                              <h3 className='font-semibold text-base'>
                                HIỆN TẠI
                              </h3>
                            </div>
                            <div className='space-y-3'>
                              <div>
                                <p className='text-sm text-muted-foreground mb-1'>
                                  Khóa học yêu cầu
                                </p>
                                <p className='text-2xl font-bold'>
                                  {selectedClass?.course?.session_number || 0}
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
                                  {selectedClass?.schedules?.length || 0}
                                  <span className='text-base text-muted-foreground ml-2'>
                                    buổi
                                  </span>
                                </p>
                              </div>
                              {selectedClass &&
                                getRemainingSessionsCount(selectedClass) >
                                  0 && (
                                  <div className='bg-muted p-3 rounded-lg border'>
                                    <p className='text-sm text-muted-foreground font-medium'>
                                      Còn thiếu
                                    </p>
                                    <p className='text-xl font-bold'>
                                      {getRemainingSessionsCount(selectedClass)}{" "}
                                      buổi
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
                                  {selectedClass?.course?.session_number || 0}
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
                                  {selectedClass?.course?.session_number || 0}
                                  <span className='text-base text-muted-foreground ml-2'>
                                    buổi
                                  </span>
                                </p>
                              </div>
                              <div className='bg-muted p-3 rounded-lg border'>
                                <p className='text-sm text-muted-foreground font-medium'>
                                  Trạng thái
                                </p>
                                <p className='text-base font-semibold'>
                                  Đủ lịch học
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Info Box */}
                        <div className='bg-muted/50 border rounded-lg p-4'>
                          <div className='flex gap-3'>
                            <div className='flex-1'>
                              <h4 className='font-semibold mb-2'>
                                Hệ thống sẽ tự động:
                              </h4>
                              <ul className='space-y-1 text-sm text-muted-foreground'>
                                <li>
                                  • Tìm khung giờ phù hợp trong thời gian bạn
                                  chọn
                                </li>
                                <li>
                                  • Xếp lịch đều đặn theo các ngày trong tuần
                                </li>
                                <li>
                                  • Đảm bảo không trùng lịch với các lớp khác
                                </li>
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

                          <div className='space-y-4'>
                            {/* Time Range */}
                            <div>
                              <Label className='font-medium mb-2 block'>
                                Khung giờ học trong ngày
                              </Label>
                              <p className='text-sm text-muted-foreground mb-3'>
                                Chọn khoảng thời gian trong ngày mà lớp có thể
                                học
                              </p>
                              <div className='grid grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                  <Label htmlFor='min_time'>
                                    Bắt đầu sớm nhất
                                  </Label>
                                  <Select
                                    value={autoScheduleData.min_time.toString()}
                                    onValueChange={(value) =>
                                      handleAutoScheduleChange(
                                        "min_time",
                                        parseInt(value)
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }, (_, i) => (
                                        <SelectItem
                                          key={i}
                                          value={i.toString()}
                                        >
                                          {i.toString().padStart(2, "0")}:00
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className='space-y-2'>
                                  <Label htmlFor='max_time'>
                                    Kết thúc muộn nhất
                                  </Label>
                                  <Select
                                    value={autoScheduleData.max_time.toString()}
                                    onValueChange={(value) =>
                                      handleAutoScheduleChange(
                                        "max_time",
                                        parseInt(value)
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 24 }, (_, i) => (
                                        <SelectItem
                                          key={i}
                                          value={i.toString()}
                                        >
                                          {i.toString().padStart(2, "0")}:00
                                        </SelectItem>
                                      ))}
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
                                  { label: "T2", value: 1 },
                                  { label: "T3", value: 2 },
                                  { label: "T4", value: 3 },
                                  { label: "T5", value: 4 },
                                  { label: "T6", value: 5 },
                                  { label: "T7", value: 6 },
                                  { label: "CN", value: 0 },
                                ].map((day) => {
                                  const backendDay = convertJsDayToBackendDay(
                                    day.value
                                  );
                                  const isSelected =
                                    autoScheduleData.array_number_in_week.includes(
                                      backendDay
                                    );

                                  return (
                                    <Button
                                      key={day.value}
                                      type='button'
                                      variant={
                                        isSelected ? "default" : "outline"
                                      }
                                      onClick={() =>
                                        handleDayToggleForAutoSchedule(
                                          day.value
                                        )
                                      }
                                      className='w-full'
                                    >
                                      {day.label}
                                    </Button>
                                  );
                                })}
                              </div>
                              <div className='text-xs text-muted-foreground mt-2'>
                                Đã chọn:{" "}
                                {autoScheduleData.array_number_in_week.length}{" "}
                                ngày
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preview/Summary Box */}
                        {autoScheduleData.array_number_in_week.length > 0 && (
                          <div className='bg-muted/50 border rounded-lg p-4'>
                            <h4 className='font-semibold mb-3'>Tóm tắt:</h4>
                            <div className='space-y-2 text-sm'>
                              <p>
                                • Lớp học:{" "}
                                <span className='font-semibold'>
                                  {selectedClass?.name}
                                </span>
                              </p>
                              <p>
                                • Thời gian:{" "}
                                <span className='font-semibold'>
                                  {autoScheduleData.min_time
                                    .toString()
                                    .padStart(2, "0")}
                                  :00 -{" "}
                                  {autoScheduleData.max_time
                                    .toString()
                                    .padStart(2, "0")}
                                  :00
                                </span>
                              </p>
                              <p>
                                • Các ngày học:{" "}
                                <span className='font-semibold'>
                                  {autoScheduleData.array_number_in_week
                                    .map((backendDay) => {
                                      const today = new Date();
                                      const todayDay = today.getDay();
                                      const jsDay = (backendDay + todayDay) % 7;
                                      const dayNames = [
                                        "CN",
                                        "T2",
                                        "T3",
                                        "T4",
                                        "T5",
                                        "T6",
                                        "T7",
                                      ];
                                      return dayNames[jsDay];
                                    })
                                    .join(", ")}
                                </span>
                              </p>
                              <p>
                                • Số buổi sẽ xếp:{" "}
                                <span className='font-semibold'>
                                  {selectedClass
                                    ? getRemainingSessionsCount(selectedClass)
                                    : 0}{" "}
                                  buổi
                                </span>
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </div>

            <DialogFooter>
              {!showAutoScheduleForm ? (
                <>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsCalendarAutoScheduleModalOpen(false);
                      setSelectedClassForAutoSchedule("");
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedClassForAutoSchedule) {
                        setShowAutoScheduleForm(true);
                      }
                    }}
                    disabled={!selectedClassForAutoSchedule}
                  >
                    Tiếp tục
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setShowAutoScheduleForm(false);
                      setSelectedClassForAutoSchedule("");
                    }}
                    disabled={isAutoScheduling}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleCalendarAutoSchedule}
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
                        Xếp lịch tự động
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ConfigProvider>
  );
}
