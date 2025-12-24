"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "../../../../styles/calendar-dark-mode.css";
import {
  message,
  Button as AntdButton,
  Select as AntdSelect,
  List,
  Typography,
  Space,
  Divider,
  ConfigProvider,
  Row,
  Col,
  Segmented,
  Alert,
  TimePicker,
  Radio,
  Tag,
} from "antd";
import {
  PlusOutlined,
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
import { AutoScheduleModal } from "@/components/manager/auto-schedule-modal";
import { SchedulePreviewModal } from "@/components/manager/schedule-preview-modal";
import { CreateClassesBatchModal } from "@/components/manager/create-classes-batch-modal";
import { AddClassForm } from "@/components/manager/add-class-form";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle2,
  Settings,
  CalendarPlus,
  ChevronDown,
  Eye,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { CalendarSearchModal } from "@/components/manager/calendar-search-modal";

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
  date?: string;
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
  const [availableClassrooms, setAvailableClassrooms] = useState<ClassItem[]>(
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

  // Search filter states
  const [searchClassroom, setSearchClassroom] = useState<string | undefined>(
    undefined
  );
  const [searchSlot, setSearchSlot] = useState<string | undefined>(undefined);
  const [allClassrooms, setAllClassrooms] = useState<ClassItem[]>([]);
  const [allSlots, setAllSlots] = useState<SlotDetail[]>([]);
  const [classroomSearchQuery, setClassroomSearchQuery] = useState<string>("");
  const [filteredClassrooms, setFilteredClassrooms] = useState<ClassItem[]>([]);
  const [isSearchingClassrooms, setIsSearchingClassrooms] = useState(false);
  const [openClassroomPopover, setOpenClassroomPopover] = useState(false);

  // Auto schedule from calendar modal states - REFACTORED for multiple classes
  const [isCalendarAutoScheduleModalOpen, setIsCalendarAutoScheduleModalOpen] =
    useState(false);

  // New schedule preview modal with stepper (CASE 1)
  const [isSchedulePreviewModalOpen, setIsSchedulePreviewModalOpen] =
    useState(false);
  const [availableClassesForAutoSchedule, setAvailableClassesForAutoSchedule] =
    useState<ClassItem[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]); // Multiple selection
  const [loadingClassesForAutoSchedule, setLoadingClassesForAutoSchedule] =
    useState(false);
  const [isAutoScheduling, setIsAutoScheduling] = useState(false);

  // Create classes modal (CASE 2)
  const [isCreateClassesModalOpen, setIsCreateClassesModalOpen] =
    useState(false);
  const [newlyCreatedClassIds, setNewlyCreatedClassIds] = useState<string[]>(
    []
  );

  // Search Modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Each class has its own schedule configuration
  const [classScheduleConfigs, setClassScheduleConfigs] = useState<{
    [classId: string]: {
      min_time: number;
      max_time: number;
      session_in_week: number;
      array_number_in_week: number[];
    };
  }>({});

  // Each class has its own selected slots (for pre-filling from CASE 2)
  const [classSelectedSlots, setClassSelectedSlots] = useState<{
    [classId: string]: string[];
  }>({});

  // Tab 2: Create new classes states
  const [availableCoursesForCreate, setAvailableCoursesForCreate] = useState<
    Array<{ _id: string; title: string; session_number?: number }>
  >([]);
  const [availableInstructorsForCreate, setAvailableInstructorsForCreate] =
    useState<Array<{ _id: string; username: string }>>([]);
  const [loadingCoursesForCreate, setLoadingCoursesForCreate] = useState(false);
  const [loadingInstructorsForCreate, setLoadingInstructorsForCreate] =
    useState(false);

  // NOTE: defer loading slots/classrooms/pools until manager opens drawer to add/edit
  // This reduces initial page load time. Data will be fetched by `loadClassManagementData()`
  // which is triggered when user opens the Add/Edit UI.
  const slotsLoading = false;
  const slotsError = null;

  // Load all classrooms and slots for search filters
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();

        if (tenantId && token) {
          // Load all classrooms (with high limit for client-side filtering)
          const classroomsData = await fetchClasses(
            tenantId,
            token,
            1,
            1000 // Load more classrooms for client-side filtering
          );
          setAllClassrooms(classroomsData.data);
          // Set initial filtered classrooms (first 20)
          setFilteredClassrooms(classroomsData.data.slice(0, 20));

          // Load all slots
          const slotsData = await fetchAllSlots();
          setAllSlots(slotsData);
        }
      } catch (error) {
        console.error("Error loading search data:", error);
      }
    };

    loadSearchData();
  }, []);

  // Effect to fetch data when component mounts or current date changes
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch schedule for the full calendar grid (include adjacent-month days)
        const { start, end } = getCalendarRange(currentDate);
        const result = await fetchDateRangeSchedule(
          start,
          end,
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
      date: scheduleEvent.date,
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

  // Get all calendar events (for ScheduleCalendar component) - filtered by search criteria
  const calendarEvents = useMemo(() => {
    // Filter events based on search criteria
    let filteredEvents = scheduleEvents;
    if (searchClassroom) {
      filteredEvents = filteredEvents.filter(
        (event) => event.classroom?._id === searchClassroom
      );
    }
    if (searchSlot) {
      filteredEvents = filteredEvents.filter(
        (event) => event.slot?._id === searchSlot
      );
    }

    return filteredEvents.map((scheduleEvent) => {
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
  }, [scheduleEvents, searchClassroom, searchSlot]);

  // Find original ScheduleEvent by schedule ID
  const findScheduleEventById = (scheduleId: string): ScheduleEvent | null => {
    return scheduleEvents.find((event) => event._id === scheduleId) || null;
  };

  // Compute calendar grid start/end (Monday..Sunday) for a given month date
  const getCalendarRange = (date: Dayjs) => {
    const startOfMonth = date.startOf("month");
    const startDay = startOfMonth.day(); // 0=Sun,1=Mon,...
    const daysFromMonday = startDay === 0 ? 6 : startDay - 1; // distance from Monday
    const startDate = startOfMonth
      .subtract(daysFromMonday, "day")
      .startOf("day");

    const endOfMonth = date.endOf("month");
    const endDay = endOfMonth.day();
    const daysToSunday = endDay === 0 ? 0 : 7 - endDay;
    const endDate = endOfMonth.add(daysToSunday, "day").endOf("day");

    return { start: startDate.toDate(), end: endDate.toDate() };
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
          <div className="text-xs text-gray-400 dark:text-gray-600 text-center py-2">
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
        <ul className="events-list max-h-[135px] overflow-y-auto overflow-x-auto space-y-2 pr-1 pb-2">
          {events.map((event, index) => (
            <li key={index} className="event-item">
              <div
                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-2 py-1.5 transition-colors text-xs whitespace-nowrap inline-block min-w-full"
                style={{
                  backgroundColor: `${event.color}15`,
                  borderLeft: `3px solid ${event.color}`,
                }}
              >
                <span className="font-medium">{event.slotTitle}</span>
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

      // Refresh data for full calendar grid
      const { start, end } = getCalendarRange(currentDate);
      const result = await fetchDateRangeSchedule(
        start,
        end,
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
      setAvailableClassrooms(classroomsData);
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
  const handleAddNewClass = async (formData?: {
    date: string;
    slot: string;
    classroom: string;
    pool: string;
    instructor: string;
  }) => {
    // If formData provided (from AddClassForm), use it; otherwise use state
    const dataToUse = formData || {
      date: drawerDate?.format("YYYY-MM-DD") || "",
      slot: selectedSlot,
      classroom: selectedClassroom,
      pool: selectedPool,
      instructor: selectedInstructor,
    };

    if (
      !dataToUse.slot ||
      !dataToUse.classroom ||
      !dataToUse.pool ||
      !dataToUse.instructor ||
      !drawerDate
    ) {
      message.error(
        "Vui lòng chọn đầy đủ thông tin (khung giờ, lớp học, hồ bơi, huấn luyện viên)"
      );
      return;
    }

    setClassManagementLoading(true);
    try {
      await addClassToSchedule(dataToUse);

      message.success("Đã thêm lớp học vào lịch thành công");

      // Refresh schedule data for calendar grid
      const { start, end } = getCalendarRange(currentDate);
      const result = await fetchDateRangeSchedule(
        start,
        end,
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
  const handleUpdateClass = async (formData?: {
    slot: string;
    classroom: string;
    pool: string;
    instructor: string;
  }) => {
    // Use formData if provided (from AddClassForm), otherwise use state (legacy support)
    const slotToUse = formData?.slot || selectedSlot;
    const classroomToUse = formData?.classroom || selectedClassroom;
    const poolToUse = formData?.pool || selectedPool;
    const instructorToUse = formData?.instructor || selectedInstructor;

    if (
      !editingEvent ||
      !slotToUse ||
      !classroomToUse ||
      !poolToUse ||
      !instructorToUse
    ) {
      message.error(
        "Vui lòng chọn đầy đủ thông tin (khung giờ, lớp học, hồ bơi, huấn luyện viên)"
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
        slot: slotToUse,
        classroom: classroomToUse,
        pool: poolToUse,
        instructor: instructorToUse,
      };

      await addClassToSchedule(newClassData);

      message.success("Đã cập nhật lớp học thành công");

      // Refresh schedule data for calendar grid
      const { start, end } = getCalendarRange(currentDate);
      const result = await fetchDateRangeSchedule(
        start,
        end,
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
      setSelectedSlot(availableSlots[0]?._id || "");
      setSelectedClassroom("");
      setSelectedPool(availablePools[0]?._id || "");
      setSelectedInstructor(availableInstructors[0]?._id || "");
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

  // Handle opening calendar auto schedule modal (old modal)
  const handleOpenCalendarAutoSchedule = async () => {
    setIsCalendarAutoScheduleModalOpen(true);
    setSelectedClassIds([]);
    setClassScheduleConfigs({});
    // Load data for both tabs
    await loadClassesForAutoSchedule(); // Tab 1
    await loadDataForCreateTab(); // Tab 2
  };

  // Handle opening new schedule preview modal (CASE 1 with stepper)
  const handleOpenSchedulePreviewModal = async () => {
    setIsSchedulePreviewModalOpen(true);
    // Load classes for selection
    await loadClassesForAutoSchedule();
  };

  // Handle opening create classes modal (CASE 2)
  const handleOpenCreateClassesModal = async () => {
    setIsCreateClassesModalOpen(true);
    // Load courses and instructors
    await loadDataForCreateTab();
  };

  // Handle create classes complete - optionally proceed to CASE 1
  const handleCreateClassesComplete = async (
    insertedIds: string[],
    scheduleConfig?: any
  ) => {
    if (insertedIds.length === 0) return;

    setNewlyCreatedClassIds(insertedIds);

    // If scheduleConfig is provided, user chose to continue to CASE 1
    if (scheduleConfig) {
      // Fetch newly created classes
      const { fetchClassesByIds } = await import("@/api/manager/class-api");
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) return;

      try {
        const newClasses = await fetchClassesByIds(
          insertedIds,
          tenantId,
          token
        );

        // Pre-select all newly created classes
        setSelectedClassIds(insertedIds);

        // Pre-fill schedule config for all classes
        const configs: Record<string, any> = {};
        insertedIds.forEach((id) => {
          configs[id] = scheduleConfig;
        });
        setClassScheduleConfigs(configs);

        // Pre-fill selected slots for all classes (if available in scheduleConfig)
        if (
          scheduleConfig.selectedSlotIds &&
          Array.isArray(scheduleConfig.selectedSlotIds)
        ) {
          const slots: Record<string, string[]> = {};
          insertedIds.forEach((id) => {
            slots[id] = scheduleConfig.selectedSlotIds;
          });
          setClassSelectedSlots(slots);
        }

        // Open CASE 1 modal with pre-filled data
        setAvailableClassesForAutoSchedule(newClasses);
        setIsSchedulePreviewModalOpen(true);
      } catch (error) {
        console.error("Failed to fetch newly created classes:", error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải thông tin các lớp vừa tạo",
        });
      }
    } else {
      // User chose to finish - just refresh calendar
      handleRefresh();
    }
  };

  // Handle class selection toggle (multiple selection)
  const handleClassToggle = (classId: string) => {
    setSelectedClassIds((prev) => {
      const isSelected = prev.includes(classId);

      if (isSelected) {
        // Remove class and its config
        setClassScheduleConfigs((configs) => {
          const newConfigs = { ...configs };
          delete newConfigs[classId];
          return newConfigs;
        });
        return prev.filter((id) => id !== classId);
      } else {
        // Add class with default config
        setClassScheduleConfigs((configs) => ({
          ...configs,
          [classId]: {
            min_time: 7,
            max_time: 18,
            session_in_week: 0,
            array_number_in_week: [],
          },
        }));
        return [...prev, classId];
      }
    });
  };

  // Helper function: Convert JavaScript day (0=Sunday, 1=Monday...) to backend array_number_in_week
  // Uses leader's formula: diff = date - dayOfWeek; if (diff < 0) diff += 7;
  const convertJsDayToBackendDay = (jsDay: number): number => {
    const today = new Date();
    const todayDay = today.getDay();
    let diff = jsDay - todayDay;
    if (diff < 0) {
      diff += 7;
    }
    return diff;
  };

  // Handle day selection for specific class
  const handleDayToggleForClass = (classId: string, jsDay: number) => {
    const backendDay = convertJsDayToBackendDay(jsDay);

    setClassScheduleConfigs((prev) => {
      const classConfig = prev[classId];
      if (!classConfig) return prev;

      const newArrayNumberInWeek = classConfig.array_number_in_week.includes(
        backendDay
      )
        ? classConfig.array_number_in_week.filter((d) => d !== backendDay)
        : [...classConfig.array_number_in_week, backendDay].sort(
            (a, b) => a - b
          );

      // Automatically update session_in_week to match selected days count
      const newSessionInWeek = newArrayNumberInWeek.length;

      console.log("🎯 handleDayToggleForClass:", {
        classId,
        jsDay,
        backendDay,
        newArrayNumberInWeek,
        newSessionInWeek,
      });

      return {
        ...prev,
        [classId]: {
          ...classConfig,
          array_number_in_week: newArrayNumberInWeek,
          session_in_week: newSessionInWeek,
        },
      };
    });
  };

  // Handle time change for specific class
  const handleTimeChangeForClass = (
    classId: string,
    field: "min_time" | "max_time",
    value: number
  ) => {
    setClassScheduleConfigs((prev) => {
      const classConfig = prev[classId];
      if (!classConfig) return prev;

      return {
        ...prev,
        [classId]: {
          ...classConfig,
          [field]: value,
        },
      };
    });
  };

  // Handle auto schedule submission
  const handleCalendarAutoSchedule = async () => {
    // Validation
    if (selectedClassIds.length === 0) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Vui lòng chọn ít nhất một lớp học",
      });
      return;
    }

    // Validate each selected class has configuration
    for (const classId of selectedClassIds) {
      const config = classScheduleConfigs[classId];
      if (!config || config.array_number_in_week.length === 0) {
        const className =
          availableClassesForAutoSchedule.find((c) => c._id === classId)
            ?.name || "Lớp không xác định";
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: `${className}: Vui lòng chọn ít nhất một ngày trong tuần`,
        });
        return;
      }
    }

    try {
      setIsAutoScheduling(true);
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) return;

      // Build request data array
      const requestData = selectedClassIds.map((classId) => {
        const config = classScheduleConfigs[classId];
        return {
          class_id: classId,
          min_time: config.min_time,
          max_time: config.max_time,
          session_in_week: config.session_in_week,
          array_number_in_week: config.array_number_in_week,
        };
      });

      console.log("📤 Auto Schedule Request (Multiple Classes):", requestData);

      // TODO: API autoScheduleClass đã deprecated, cần update sang flow mới
      // await autoScheduleClass(requestData, tenantId, token);
      throw new Error(
        "autoScheduleClass API đã bị deprecated. Vui lòng sử dụng 'Tạo lớp hàng loạt' để xếp lịch."
      );

      toast({
        title: "Thành công",
        description: `Đã tự động xếp lịch thành công cho ${selectedClassIds.length} lớp học`,
      });

      // Reload schedule data for calendar grid
      const { start, end } = getCalendarRange(currentDate);
      const { events, poolOverflowWarnings } = await fetchDateRangeSchedule(
        start,
        end,
        tenantId || undefined,
        token || undefined
      );
      setScheduleEvents(events);
      setPoolOverflowWarnings(poolOverflowWarnings);

      // Reset and close modal
      setIsCalendarAutoScheduleModalOpen(false);
      setSelectedClassIds([]);
      setClassScheduleConfigs({});
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

  // Load courses and instructors for Tab 2 (Create new classes)
  const loadDataForCreateTab = async () => {
    const tenantId = getSelectedTenant();
    const token = getAuthToken();

    if (!tenantId || !token) return;

    try {
      // Load courses
      setLoadingCoursesForCreate(true);
      const { fetchCourses } = await import("@/api/manager/courses-api");
      const coursesResult = await fetchCourses({
        tenantId,
        token,
        page: 1,
        limit: 100,
      });
      setAvailableCoursesForCreate(coursesResult.data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
    } finally {
      setLoadingCoursesForCreate(false);
    }

    try {
      // Load instructors
      setLoadingInstructorsForCreate(true);
      const instructors = await fetchInstructors({
        tenantId,
        token,
        role: "instructor",
      });
      setAvailableInstructorsForCreate(instructors || []);
    } catch (error) {
      console.error("Error loading instructors:", error);
    } finally {
      setLoadingInstructorsForCreate(false);
    }
  };

  // Handle create and auto-schedule submission
  const handleCreateAndAutoSchedule = async (
    newClasses: Array<{
      id: string;
      course: string;
      name: string;
      instructor: string;
      show_on_regist_course: boolean;
      min_time: number;
      max_time: number;
      session_in_week: number;
      array_number_in_week: number[];
    }>
  ) => {
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) return;

      // Import the new API function (DEPRECATED)
      // const { createAndAutoScheduleClasses } = await import(
      //   "@/api/manager/class-api"
      // );

      // Remove temporary 'id' field and prepare request
      const requestData = newClasses.map(({ id, ...rest }) => rest);

      console.log("📤 Create & Auto Schedule Request:", requestData);

      // TODO: API createAndAutoScheduleClasses đã deprecated
      // await createAndAutoScheduleClasses(requestData, tenantId, token);
      throw new Error(
        "createAndAutoScheduleClasses API đã bị deprecated. Vui lòng sử dụng modal 'Tạo lớp hàng loạt'."
      );

      toast({
        title: "Thành công",
        description: `Đã tạo và xếp lịch thành công cho ${newClasses.length} lớp học`,
      });

      // Reload schedule data for calendar grid
      const { start, end } = getCalendarRange(currentDate);
      const { events, poolOverflowWarnings } = await fetchDateRangeSchedule(
        start,
        end,
        tenantId || undefined,
        token || undefined
      );
      setScheduleEvents(events);
      setPoolOverflowWarnings(poolOverflowWarnings);

      // Close modal
      setIsCalendarAutoScheduleModalOpen(false);
    } catch (error: any) {
      console.error("Create and auto-schedule error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error?.message ||
          "Không thể tạo và xếp lịch. Vui lòng kiểm tra lại thông tin",
      });
      throw error; // Re-throw to let modal handle loading state
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh data for full calendar grid (include adjacent month days)
      const { start, end } = getCalendarRange(currentDate);
      const result = await fetchDateRangeSchedule(
        start,
        end,
        undefined,
        undefined,
        isStaff ? "Schedule" : undefined
      );

      setScheduleEvents(result.events);
      setPoolOverflowWarnings(result.poolOverflowWarnings);
    } catch (err) {
      console.error("Error refreshing calendar:", err);
      toast({
        title: "Lỗi",
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
      <div className="flex flex-col items-center justify-center min-h-screen py-16">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Đang tải lịch học...</p>
      </div>
    );
  }

  if (error || slotsError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-16">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">
            Lỗi tải dữ liệu
          </div>
          <p className="text-muted-foreground">{error || slotsError}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider locale={locale}>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header with Auto Schedule and Refresh Buttons */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold">Lịch học</h1>
            <p className="text-muted-foreground">
              Quản lý và xếp lịch học cho các lớp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button
              onClick={() => setSearchModalOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <SearchOutlined />
              Tìm kiếm
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="gap-2">
                  Quản lý lớp học
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={handleOpenCreateClassesModal}
                  className="cursor-pointer"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  <span>Tạo lớp học</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleOpenSchedulePreviewModal}
                  className="cursor-pointer"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Xếp lịch cho lớp có sẵn</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Pool Overflow Warning Alert */}
        {poolOverflowWarnings.length > 0 && (
          <Accordion type="single" collapsible className="w-full mb-4">
            <AccordionItem value="pool-warnings" className="border-0">
              <AccordionTrigger className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg hover:no-underline hover:bg-yellow-100 dark:hover:bg-yellow-900/30">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                      Cảnh báo: Hồ bơi vượt sức chứa
                    </span>
                    <span className="text-sm text-yellow-700 dark:text-yellow-300 ml-2">
                      ({poolOverflowWarnings.length} cảnh báo)
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 pt-2 bg-yellow-50 dark:bg-yellow-900/20 border-x border-b border-yellow-200 dark:border-yellow-700 rounded-b-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                  Các hồ bơi sau đang vượt quá sức chứa. Vui lòng xem xét điều
                  chỉnh lịch học:
                </p>

                <div className="space-y-2">
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
                          className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800"
                        >
                          <div className="px-4 py-3 bg-yellow-100 dark:bg-yellow-900/30">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <span className="font-semibold text-yellow-900 dark:text-yellow-100">
                                  {poolData.pool.title}
                                </span>
                                <span className="text-sm text-yellow-700 dark:text-yellow-300 ml-2">
                                  - Sức chứa: {poolData.poolCapacity}, Đang sử
                                  dụng: {poolData.totalMembers}
                                </span>
                                <span className="text-red-600 dark:text-red-400 font-semibold ml-2">
                                  (Vượt {poolData.maxOverCapacity})
                                </span>
                              </div>
                              <Tag color="orange" className="ml-2">
                                {poolData.details.length} khung giờ
                              </Tag>
                            </div>
                          </div>
                          <div className="px-4 py-3 bg-white dark:bg-gray-900">
                            <div className="space-y-2">
                              {poolData.details.map((detail, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-2 px-3 rounded bg-gray-50 dark:bg-gray-800"
                                >
                                  <span className="font-medium">
                                    {dayjs(detail.date).format(
                                      "DD/MM/YYYY (dddd)"
                                    )}
                                  </span>
                                  <span className="text-gray-400">-</span>
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
            <Col xs={24} sm={8}>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold mb-1">
                      {stats.totalEvents}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <TeamOutlined /> Tổng lớp học
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold mb-1">
                      {stats.totalSlots}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <ClockCircleOutlined /> Tổng khung giờ
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Col>

            <Col xs={24} sm={8}>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold mb-1">
                      {stats.uniquePools}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <EnvironmentOutlined /> Hồ bơi sử dụng
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Col>
          </Row>
        )}
        {/* Search Filters */}
        <Accordion type="single" collapsible className="w-full mb-4">
          <AccordionItem value="search-filters" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <SearchOutlined className="text-blue-500" />
                <span className="font-medium">Tìm kiếm lịch học</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <div className="flex-1">
                  <Label>Lớp học</Label>
                  <Popover
                    open={openClassroomPopover}
                    onOpenChange={setOpenClassroomPopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between ${
                          !searchClassroom && "text-muted-foreground"
                        }`}
                      >
                        {searchClassroom
                          ? allClassrooms.find(
                              (classroom) => classroom._id === searchClassroom
                            )?.name
                          : "Chọn lớp học..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Tìm kiếm lớp học..."
                          value={classroomSearchQuery}
                          onValueChange={(value) => {
                            setClassroomSearchQuery(value);
                            // Filter classrooms based on search
                            if (value.trim()) {
                              const filtered = allClassrooms.filter(
                                (classroom) =>
                                  classroom.name
                                    .toLowerCase()
                                    .includes(value.toLowerCase())
                              );
                              setFilteredClassrooms(filtered.slice(0, 50));
                            } else {
                              setFilteredClassrooms(allClassrooms.slice(0, 20));
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isSearchingClassrooms
                              ? "Đang tìm kiếm..."
                              : classroomSearchQuery
                              ? `Không tìm thấy lớp học phù hợp với "${classroomSearchQuery}"`
                              : "Không có lớp học nào"}
                          </CommandEmpty>
                          <CommandGroup>
                            {isSearchingClassrooms ? (
                              <div className="p-2 text-sm text-muted-foreground flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang tìm kiếm...
                              </div>
                            ) : (
                              <>
                                {/* Show all classrooms option when no search */}
                                {!classroomSearchQuery && (
                                  <CommandItem
                                    value="all"
                                    onSelect={() => {
                                      setSearchClassroom(undefined);
                                      setClassroomSearchQuery("");
                                      setOpenClassroomPopover(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        !searchClassroom
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    Tất cả lớp học
                                  </CommandItem>
                                )}
                                {filteredClassrooms.map((classroom) => (
                                  <CommandItem
                                    key={classroom._id}
                                    value={classroom.name}
                                    onSelect={() => {
                                      setSearchClassroom(classroom._id);
                                      setClassroomSearchQuery("");
                                      setOpenClassroomPopover(false);
                                    }}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        searchClassroom === classroom._id
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }`}
                                    />
                                    {classroom.name}
                                  </CommandItem>
                                ))}
                                {allClassrooms.length >
                                  (classroomSearchQuery ? 50 : 20) && (
                                  <div className="p-2 text-xs text-muted-foreground border-t">
                                    Hiển thị {filteredClassrooms.length}/
                                    {allClassrooms.length} lớp học
                                    {classroomSearchQuery &&
                                      ". Gõ để tìm kiếm thêm."}
                                  </div>
                                )}
                              </>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1">
                  <Label htmlFor="search-slot">Khung giờ</Label>
                  <Select value={searchSlot} onValueChange={setSearchSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khung giờ..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allSlots.map((slot) => (
                        <SelectItem key={slot._id} value={slot._id}>
                          {slot.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchClassroom(undefined);
                      setSearchSlot(undefined);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        {/* Main Calendar */}
        <Card className="shadow-lg">
          <ScheduleCalendar
            currentDate={currentDate}
            selectedDate={selectedDate || undefined}
            events={calendarEvents}
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
                  <div className="text-xs text-muted-foreground text-center py-2">
                    Chưa có lớp học
                  </div>
                );
              }

              return (
                <ul className="space-y-1 max-h-[80px] overflow-y-auto">
                  {events.map((event, index) => (
                    <li key={index}>
                      <div
                        className="text-xs px-2 py-1 rounded truncate hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                        style={{
                          backgroundColor: `${event.color}15`,
                          borderLeft: `3px solid ${event.color}`,
                        }}
                      >
                        <span className="font-medium">{event.slotTitle}</span>
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
              setSelectedDate(null); // Reset selected date to remove highlight
            }
          }}
        >
          <SheetContent
            side="right"
            className="w-[480px] sm:max-w-[480px] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-3">
                <CalendarOutlined className="text-blue-500" />
                <div>
                  <div className="text-lg font-semibold">
                    {drawerDate
                      ? drawerDate.format("DD/MM/YYYY")
                      : "Chi tiết lịch học"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {drawerDate ? drawerDate.format("dddd") : ""}
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>
            {drawerLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Đang tải chi tiết...</p>
              </div>
            ) : (
              drawerDate && (
                <div className="space-y-6">
                  <Tabs
                    value={classManagementMode}
                    onValueChange={(value) => {
                      const mode = value as "view" | "add" | "edit";
                      setClassManagementMode(mode);
                      if (mode === "add" || mode === "edit") {
                        loadClassManagementData(false);
                      }
                    }}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="view">Xem lịch học</TabsTrigger>
                      {!drawerDate.isBefore(dayjs(), "day") && (
                        <TabsTrigger value="add">Thêm lớp học</TabsTrigger>
                      )}
                      {editingEvent && (
                        <TabsTrigger value="edit">
                          Chỉnh sửa buổi học
                        </TabsTrigger>
                      )}
                    </TabsList>

                    <TabsContent value="view" className="mt-4">
                      <div className="space-y-4">
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
                              <div className="text-center py-12">
                                <div className="flex flex-col items-center gap-4">
                                  <div className="text-gray-500 dark:text-gray-400 mb-4">
                                    {message}
                                  </div>
                                  {showAddButton && (
                                    <Button
                                      onClick={() => {
                                        setClassManagementMode("add");
                                        loadClassManagementData(false);
                                      }}
                                      className="gap-2"
                                    >
                                      <PlusOutlined />
                                      {isToday
                                        ? "Thêm lớp học cho hôm nay"
                                        : "Thêm lớp học mới"}
                                    </Button>
                                  )}
                                  {isPast && (
                                    <div className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                                      Không thể thêm lớp học cho ngày trong quá
                                      khứ
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div>
                              {/* Search Bar */}
                              <div className="mb-4 relative">
                                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                  placeholder="Tìm kiếm theo lớp học, hồ bơi, huấn luyện viên, khóa học..."
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  className="pl-10"
                                />
                              </div>

                              {/* Summary */}
                              <div className="mb-4">
                                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <TeamOutlined className="text-blue-600 dark:text-blue-400" />
                                        <span className="font-medium">
                                          Tổng số lớp học:
                                        </span>
                                      </div>
                                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                        {filterEvents(events).length}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Add Class Button */}
                              <div className="mb-4 flex justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setClassManagementMode("add");
                                    loadClassManagementData(false);
                                  }}
                                  className="gap-2"
                                >
                                  <PlusOutlined />
                                  Thêm lớp
                                </Button>
                              </div>

                              {/* Events List by Slot (Accordion) */}
                              <div className="space-y-2">
                                {(() => {
                                  const filteredEvents = filterEvents(events);
                                  const groupedEvents =
                                    groupEventsBySlot(filteredEvents);

                                  if (filteredEvents.length === 0) {
                                    return (
                                      <div className="text-center py-8">
                                        <p className="text-gray-500 dark:text-gray-400">
                                          {searchQuery
                                            ? "Không tìm thấy lớp học nào phù hợp"
                                            : "Không có lớp học nào"}
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <Accordion
                                      type="multiple"
                                      defaultValue={groupedEvents.map(
                                        (_, index) => `slot-${index}`
                                      )}
                                      className="w-full"
                                    >
                                      {groupedEvents.map(
                                        ([slotTitle, slotEvents], index) => (
                                          <AccordionItem
                                            key={`slot-${index}`}
                                            value={`slot-${index}`}
                                            className="border rounded-lg mb-2 overflow-hidden"
                                          >
                                            <AccordionTrigger className="px-4 hover:no-underline bg-gray-50 dark:bg-gray-800">
                                              <div className="flex items-center gap-3 w-full">
                                                <ClockCircleOutlined className="text-blue-600 dark:text-blue-400" />
                                                <div className="flex-1 text-left">
                                                  <span className="font-semibold">
                                                    {slotTitle}
                                                  </span>
                                                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                                    ({slotEvents[0]?.slotTime})
                                                  </span>
                                                </div>
                                                <Badge variant="secondary">
                                                  {slotEvents.length} lớp
                                                </Badge>
                                              </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-0 pb-0">
                                              <div className="space-y-2 p-2">
                                                {slotEvents.map(
                                                  (event, eventIndex) => (
                                                    <Card
                                                      key={eventIndex}
                                                      className="hover:shadow-md transition-all"
                                                    >
                                                      <CardContent className="p-4">
                                                        <div className="flex items-start justify-between">
                                                          <div className="flex items-start gap-3 flex-1">
                                                            <Avatar className="h-8 w-8">
                                                              <AvatarFallback
                                                                style={{
                                                                  backgroundColor:
                                                                    event.color,
                                                                }}
                                                              >
                                                                <EnvironmentOutlined className="text-white" />
                                                              </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                              <div className="flex items-center gap-2 mb-2">
                                                                <span className="font-semibold text-base">
                                                                  {
                                                                    event.className
                                                                  }
                                                                </span>
                                                              </div>
                                                              <Badge
                                                                style={{
                                                                  backgroundColor:
                                                                    event.color,
                                                                  color:
                                                                    "white",
                                                                }}
                                                                className="text-xs mb-2"
                                                              >
                                                                {event.course}
                                                              </Badge>

                                                              <div className="space-y-1 mt-2">
                                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                                  <EnvironmentOutlined />
                                                                  <span>
                                                                    {
                                                                      event.poolTitle
                                                                    }
                                                                  </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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

                                                          <TooltipProvider>
                                                            <div className="flex flex-col gap-1">
                                                              <Tooltip>
                                                                <TooltipTrigger
                                                                  asChild
                                                                >
                                                                  <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={(
                                                                      e
                                                                    ) => {
                                                                      e.preventDefault();
                                                                      e.stopPropagation();
                                                                      handleOpenDetailModal(
                                                                        event
                                                                      );
                                                                    }}
                                                                  >
                                                                    <Eye className="h-4 w-4" />
                                                                  </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                  <p>
                                                                    Xem chi tiết
                                                                  </p>
                                                                </TooltipContent>
                                                              </Tooltip>
                                                              <Tooltip>
                                                                <TooltipTrigger
                                                                  asChild
                                                                >
                                                                  <Button
                                                                    variant="ghost"
                                                                    size="icon"
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
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                  >
                                                                    <Trash2 className="h-4 w-4" />
                                                                  </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                  <p>
                                                                    Xóa lớp học
                                                                  </p>
                                                                </TooltipContent>
                                                              </Tooltip>
                                                            </div>
                                                          </TooltipProvider>
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
                      <TabsContent value="add" className="mt-4">
                        {classManagementLoading ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                              Đang tải dữ liệu...
                            </p>
                          </div>
                        ) : (
                          <AddClassForm
                            selectedDate={drawerDate.format("YYYY-MM-DD")}
                            availableSlots={availableSlots}
                            availableClassrooms={availableClassrooms}
                            availablePools={availablePools}
                            availableInstructors={availableInstructors}
                            instructorAvatars={instructorAvatars}
                            onSubmit={async (data) => {
                              await handleAddNewClass(data);
                            }}
                            onCancel={resetClassManagementForm}
                            loading={classManagementLoading}
                          />
                        )}
                      </TabsContent>
                    )}

                    {editingEvent && (
                      <TabsContent value="edit" className="mt-4">
                        {classManagementLoading ? (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                              Đang tải dữ liệu...
                            </p>
                          </div>
                        ) : (
                          <AddClassForm
                            selectedDate={drawerDate.format("YYYY-MM-DD")}
                            availableSlots={availableSlots}
                            availableClassrooms={availableClassrooms}
                            availablePools={availablePools}
                            availableInstructors={availableInstructors}
                            instructorAvatars={instructorAvatars}
                            editMode={true}
                            initialValues={{
                              slot: selectedSlot,
                              classroom: selectedClassroom,
                              pool: selectedPool,
                              instructor: selectedInstructor,
                            }}
                            currentScheduleId={editingEvent?.scheduleId}
                            onSubmit={async (data) => {
                              await handleUpdateClass(data);
                            }}
                            onCancel={resetClassManagementForm}
                            loading={classManagementLoading}
                          />
                        )}
                      </TabsContent>
                    )}
                  </Tabs>
                </div>
              )
            )}
          </SheetContent>
        </Sheet>
        {/* Delete Confirmation AlertDialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <DeleteOutlined className="text-red-500" />
                Xác nhận xóa lớp học
              </AlertDialogTitle>
              <AlertDialogDescription>
                {scheduleToDelete && (
                  <div className="space-y-4">
                    <Alert
                      message="Bạn đang xóa lớp học khỏi lịch"
                      type="warning"
                      showIcon
                      className="mb-4"
                    />
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lớp học:</span>
                        <span className="font-semibold">
                          {scheduleToDelete.className}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ngày:</span>
                        <span>
                          {dayjs(scheduleToDelete.date).format(
                            "DD/MM/YYYY dddd"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Khung giờ:
                        </span>
                        <Badge variant="outline">
                          {scheduleToDelete.slotTitle}
                        </Badge>
                      </div>
                    </div>
                    <Alert
                      message="Lưu ý: Hành động này không thể hoàn tác!"
                      type="error"
                      showIcon
                      className="mt-4"
                    />
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeleting}
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteScheduleEvent();
                }}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
        {/* Auto Schedule Modal - NEW COMPONENT with 2 Tabs */}
        <AutoScheduleModal
          open={isCalendarAutoScheduleModalOpen}
          onOpenChange={setIsCalendarAutoScheduleModalOpen}
          // Tab 1: Existing classes props
          availableClasses={availableClassesForAutoSchedule}
          selectedClassIds={selectedClassIds}
          classScheduleConfigs={classScheduleConfigs}
          loading={loadingClassesForAutoSchedule}
          isScheduling={isAutoScheduling}
          onClassToggle={handleClassToggle}
          onDayToggle={handleDayToggleForClass}
          onTimeChange={handleTimeChangeForClass}
          onSubmit={handleCalendarAutoSchedule}
          // Tab 2: Create new classes props
          availableCourses={availableCoursesForCreate}
          availableInstructors={availableInstructorsForCreate}
          loadingCourses={loadingCoursesForCreate}
          loadingInstructors={loadingInstructorsForCreate}
          onCreateAndSchedule={handleCreateAndAutoSchedule}
        />
        {/* Advanced Search Modal */}
        <CalendarSearchModal
          open={searchModalOpen}
          onOpenChange={setSearchModalOpen}
          events={scheduleEvents.map(formatScheduleEvent)}
          onSelectEvent={(event) => {
            setSearchModalOpen(false);
            if (event.date) {
              const eventDate = dayjs(event.date);
              // If the event is in a different month, switch to it
              if (!eventDate.isSame(currentDate, "month")) {
                setCurrentDate(eventDate);
              }
              // Open the drawer for this date
              onSelect(eventDate);
            }
          }}
        />
        {/* New Schedule Preview Modal with Stepper (CASE 1) */}
        <SchedulePreviewModal
          open={isSchedulePreviewModalOpen}
          onOpenChange={(open) => {
            setIsSchedulePreviewModalOpen(open);
            // Clear pre-selected data when modal closes
            if (!open) {
              setSelectedClassIds([]);
              setClassSelectedSlots({});
              setClassScheduleConfigs({});
            }
          }}
          availableClasses={availableClassesForAutoSchedule}
          loading={loadingClassesForAutoSchedule}
          preSelectedClassIds={selectedClassIds}
          preSelectedSlots={classSelectedSlots}
          preScheduleConfigs={classScheduleConfigs}
          onScheduleComplete={() => {
            setIsSchedulePreviewModalOpen(false);
            // Clear pre-selected data after completion
            setSelectedClassIds([]);
            setClassSelectedSlots({});
            setClassScheduleConfigs({});
            handleRefresh();
          }}
        />
        {/* Create Classes Modal (CASE 2) */}
        <CreateClassesBatchModal
          open={isCreateClassesModalOpen}
          onOpenChange={setIsCreateClassesModalOpen}
          availableCourses={availableCoursesForCreate}
          availableInstructors={availableInstructorsForCreate}
          loadingCourses={loadingCoursesForCreate}
          loadingInstructors={loadingInstructorsForCreate}
          onCreateComplete={handleCreateClassesComplete}
        />
      </div>
    </ConfigProvider>
  );
}
