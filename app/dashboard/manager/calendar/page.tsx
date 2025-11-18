"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "../../../../styles/calendar-dark-mode.css";
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
  SearchOutlined,
} from "@ant-design/icons";
import { Loader2 } from "lucide-react";
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
} from "@/api/manager/class-api";
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
        console.log(
          "🗓️ Fetching month schedule for:",
          currentDate.format("YYYY-MM-DD")
        );
        // If the current user is staff, the API requires a 'service: Schedule' header
        const result = await fetchMonthSchedule(
          currentDate.toDate(),
          undefined,
          undefined,
          isStaff ? "Schedule" : undefined
        );

        console.log(" Loaded schedule data:", {
          eventsCount: result.events.length,
          overflowWarningsCount: result.poolOverflowWarnings.length,
          currentDate: currentDate.format("YYYY-MM-DD"),
          events: result.events.slice(0, 3).map((e) => ({
            id: e._id,
            date: e.date,
            slotTitle: e.slot?.title || "N/A",
            classroomName: e.classroom?.name || "N/A",
          })),
        });

        setScheduleEvents(result.events);
        setPoolOverflowWarnings(result.poolOverflowWarnings);

        // Show warning toast if there are pool capacity overflows
        if (result.poolOverflowWarnings.length > 0) {
          message.warning({
            content: ` -  Có ${result.poolOverflowWarnings.length} hồ bơi vượt quá sức chứa!`,
            duration: 5,
          });
        }

        // Log data structure for debugging
        if (result.events.length > 0) {
          console.log("📊 First event structure:", {
            _id: result.events[0]._id,
            date: result.events[0].date,
            slot: result.events[0].slot,
            classroom: result.events[0].classroom,
            pool: result.events[0].pool,
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

    const handleCellClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDrawerDate(value);
      setDrawerOpen(true);
    };

    if (events.length === 0) {
      return (
        <div
          className={`h-full min-h-[120px] p-2 ${
            isPast ? "opacity-60" : ""
          } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
          onClick={handleCellClick}
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
        } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors`}
        onClick={handleCellClick}
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
      console.log(
        "🖼️ Loaded avatars for",
        Object.keys(avatarMap).length,
        "instructors"
      );
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
      console.log(
        "🚀 Using cached class management data (",
        Math.round((now - lastClassDataLoad) / 1000),
        "s ago)"
      );
      return;
    }

    setClassManagementLoading(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      console.log("🔍 Loading class management data...");

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

      console.log("🔍 Data loaded:", {
        slots: slotsData.length,
        classrooms: classroomsData.length,
        pools: poolsData.pools.length,
        instructors: instructorsData.length,
      });

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
      console.log("➕ Adding new class with data:", newClassData);

      await addClassToSchedule(newClassData);
      console.log("✅ New class added successfully");

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
    console.log("🔧 handleEditClass called with event:", event);

    setEditingEvent(event);
    setClassManagementMode("edit");

    // Load current values using proper IDs
    setSelectedSlot(event.slotId);
    setSelectedClassroom(event.classroomId); // Use classroomId instead of id
    setSelectedPool(event.poolId);
    setSelectedInstructor(event.instructorId);

    console.log("🔧 Pre-filled form with:", {
      slot: event.slotId,
      classroom: event.classroomId,
      pool: event.poolId,
      instructor: event.instructorId,
    });

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
      console.log("🔄 Starting class update process...");

      // First delete the old one
      console.log("🗑️ Deleting old schedule event:", editingEvent.scheduleId);
      await deleteScheduleEvent(editingEvent.scheduleId);
      console.log("✅ Old schedule event deleted successfully");

      // Then add the new one
      const newClassData = {
        date: drawerDate!.format("YYYY-MM-DD"),
        slot: selectedSlot,
        classroom: selectedClassroom,
        pool: selectedPool,
        instructor: selectedInstructor,
      };
      console.log("➕ Adding new class with data:", newClassData);

      await addClassToSchedule(newClassData);
      console.log("✅ New class added successfully");

      message.success("Đã cập nhật lớp học thành công");

      // Refresh schedule data
      console.log("🔄 Refreshing schedule data...");
      const result = await fetchMonthSchedule(
        currentDate.toDate(),
        undefined,
        undefined,
        isStaff ? "Schedule" : undefined
      );
      setScheduleEvents(result.events);
      setPoolOverflowWarnings(result.poolOverflowWarnings);
      console.log("✅ Schedule data refreshed");

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
            setSearchQuery(""); // Reset search query
            resetClassManagementForm();
          }}
          className='calendar-drawer'
        >
          {drawerLoading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
              <p className='text-muted-foreground'>Đang tải chi tiết...</p>
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
                                {/* Search Bar */}
                                <div className='mb-4'>
                                  <Input
                                    placeholder='Tìm kiếm theo lớp học, hồ bơi, giảng viên, khóa học...'
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
                                        {filterEvents(events).length}
                                      </div>
                                    </div>
                                  </AntdCard>
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
                                                      ({slotEvents[0]?.slotTime}
                                                      )
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
                                                      <AntdCard
                                                        key={eventIndex}
                                                        size='small'
                                                        className='hover:shadow-md transition-all'
                                                      >
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
                                                                <Text
                                                                  strong
                                                                  className='text-base'
                                                                >
                                                                  {
                                                                    event.className
                                                                  }
                                                                </Text>
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
                                                      </AntdCard>
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
                                              {pool.title} ({pool.type}) - Sức
                                              chứa: {pool.capacity}
                                              {isOverCapacity &&
                                                warningInfo && (
                                                  <span className='text-red-600 font-semibold'>
                                                    {" "}
                                                    - Vượt{" "}
                                                    {warningInfo.overCapacity}
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
                            label: "Chỉnh sửa buổi học",
                            children: (
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
                                              {pool.title} ({pool.type}) - Sức
                                              chứa: {pool.capacity}
                                              {isOverCapacity &&
                                                warningInfo && (
                                                  <span className='text-red-600 font-semibold'>
                                                    {" "}
                                                    - Vượt{" "}
                                                    {warningInfo.overCapacity}
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
            console.log("🔧 Editing event - CalendarEvent:", calendarEvent);
            console.log("🔧 Original ScheduleEvent:", event);

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
      </div>
    </ConfigProvider>
  );
}
