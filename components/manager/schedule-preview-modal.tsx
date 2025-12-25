"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Stepper,
  StepperHeader,
  StepperContent,
  StepperStep,
  StepperFooter,
  useStepper,
} from "@/components/ui/stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Circle,
  Edit2,
  Calendar as CalendarLucide,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ClassItem } from "@/api/manager/class-api";
import { fetchClasses, fetchClassesByIds } from "@/api/manager/class-api";
import type { SlotDetail } from "@/api/manager/slot-api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  View,
} from "react-big-calendar";
import moment from "moment";
import "moment/locale/vi";
import "@/styles/react-big-calendar.css";

// Setup moment localizer for Vietnamese
moment.locale("vi");
const localizer = momentLocalizer(moment);

interface ClassScheduleConfig {
  min_time: number;
  max_time: number;
  session_in_week: number;
  array_number_in_week: number[];
  start_date?: string; // YYYY-MM-DD format
}

interface PreviewSchedule {
  date: string;
  slot: {
    _id: string;
    title: string;
    start_time: number;
    start_minute: number;
    end_time: number;
    end_minute: number;
  };
  classroom: {
    _id: string;
    name: string;
  };
  instructor: {
    _id: string;
    username: string;
  };
  pool?: {
    _id: string;
    title: string;
  };
}

interface PoolCapacityInfo {
  _id: string;
  title: string;
  capacity: number;
  capacity_remain: number;
  isAvailable: boolean;
  schedulesUsed: any[];
  type_of_age?: any; // Changed from string to any to match API response
  hasAgeWarning?: boolean;
  hasInstructorConflict?: boolean;
  current_usage?: number; // Number of classes currently using this pool
  hasCapacityWarning?: boolean; // Warning when remaining_capacity < max_member
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    classId: string;
    className: string;
    slotTitle: string;
    instructorName: string;
    scheduleIndex: number;
  };
}

interface SchedulePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableClasses: ClassItem[];
  loading?: boolean;
  onScheduleComplete: () => void;
  preSelectedClassIds?: string[];
  preSelectedSlots?: { [classId: string]: string[] };
  preScheduleConfigs?: { [classId: string]: any };
}

const STEPS = [
  {
    id: "select",
    title: "Chọn lớp",
    description: "Chọn lớp học để xếp lịch",
  },
  {
    id: "preview-pools",
    title: "Xem trước & Chọn hồ bơi",
    description: "Xem lịch đề xuất và chọn hồ bơi",
  },
  {
    id: "confirm",
    title: "Xác nhận",
    description: "Kiểm tra và tạo lịch",
  },
];

const DAY_NAMES = [
  { label: "T2", value: 1 },
  { label: "T3", value: 2 },
  { label: "T4", value: 3 },
  { label: "T5", value: 4 },
  { label: "T6", value: 5 },
  { label: "T7", value: 6 },
  { label: "CN", value: 0 },
];

/**
 * Convert JavaScript day (0=Sunday, 1=Monday, ..., 6=Saturday)
 * to Backend array_number_in_week based on START_DATE's day of week
 * Formula: diff = jsDay - startDateDay; if (diff < 0) diff += 7;
 *
 * Example: If start_date is Friday (5):
 * - Monday (1): 1-5 = -4 → -4+7 = 3
 * - Saturday (6): 6-5 = 1
 * - Sunday (0): 0-5 = -5 → -5+7 = 2
 */
const convertJsDayToBackendDay = (jsDay: number, startDate: Date): number => {
  const startDateDay = startDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  let diff = jsDay - startDateDay;
  if (diff < 0) {
    diff += 7;
  }
  return diff;
};

// Helper function to format decimal time to HHhMM format
const formatTimeDisplay = (decimalTime: number): string => {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 100);
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h${minutes.toString().padStart(2, "0")}`;
};

export function SchedulePreviewModal({
  open,
  onOpenChange,
  availableClasses,
  loading = false,
  onScheduleComplete,
  preSelectedClassIds,
  preSelectedSlots,
  preScheduleConfigs,
}: SchedulePreviewModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [selectedClassId, setSelectedClassId] = React.useState<string | null>(
    null
  );
  const [classes, setClasses] = React.useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [classScheduleConfigs, setClassScheduleConfigs] = React.useState<{
    [classId: string]: ClassScheduleConfig;
  }>({});
  const [classSelectedSlots, setClassSelectedSlots] = React.useState<{
    [classId: string]: string[];
  }>({});
  const [allSlots, setAllSlots] = React.useState<SlotDetail[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [previewSchedules, setPreviewSchedules] = React.useState<{
    [classId: string]: PreviewSchedule[];
  }>({});
  // Track duplicate conflicts: scheduleKey -> true when duplicate (same date+slot+instructor)
  const [duplicateConflicts, setDuplicateConflicts] = React.useState<{
    [scheduleKey: string]: boolean;
  }>({});
  const [poolCapacities, setPoolCapacities] = React.useState<{
    [scheduleKey: string]: PoolCapacityInfo[];
  }>({});
  const [selectedPools, setSelectedPools] = React.useState<{
    [scheduleKey: string]: string;
  }>({});
  const [autoSelectedPools, setAutoSelectedPools] = React.useState<{
    [scheduleKey: string]: string;
  }>({}); // Track initial auto-selections
  const [selectedScheduleKey, setSelectedScheduleKey] = React.useState<
    string | null
  >(null);
  const [openPoolPopover, setOpenPoolPopover] = React.useState<string | null>(
    null
  );
  const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false);
  const [isCalculatingCapacity, setIsCalculatingCapacity] =
    React.useState(false);
  const [isCreatingSchedules, setIsCreatingSchedules] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  // New state for editing schedules in step 2
  const [editingSchedules, setEditingSchedules] = React.useState<{
    [scheduleKey: string]: boolean;
  }>({});
  const [availableInstructors, setAvailableInstructors] = React.useState<any[]>(
    []
  );
  const [loadingInstructors, setLoadingInstructors] = React.useState(false);
  const [legendAccordionOpen, setLegendAccordionOpen] = React.useState(false);

  // When previewSchedules change, detect duplicates (same date + slot + instructor)
  React.useEffect(() => {
    const conflicts: { [k: string]: boolean } = {};

    // Build map from signature -> array of scheduleKeys
    const signatureMap: { [sig: string]: string[] } = {};

    Object.entries(previewSchedules).forEach(([classId, schedules]) => {
      schedules.forEach((schedule, idx) => {
        // Normalize date to YYYY-MM-DD
        const rawDate = schedule?.date || "";
        const dateOnly = rawDate.split("T")[0];

        // Normalize slot identifier: prefer _id then id then title+time
        const slotId =
          schedule?.slot?._id ||
          (schedule?.slot as any)?.id ||
          `${schedule?.slot?.title || ""}_${schedule?.slot?.start_time || ""}`;

        // Normalize instructor identifier: prefer _id then id then username
        const instrId =
          schedule?.instructor?._id ||
          (schedule?.instructor as any)?.id ||
          schedule?.instructor?.username ||
          String(schedule?.instructor || "");

        const sig = `${dateOnly}::${slotId}::${instrId}`;
        const key = `${classId}-${idx}`;
        if (!signatureMap[sig]) signatureMap[sig] = [];
        signatureMap[sig].push(key);
      });
    });

    Object.values(signatureMap).forEach((keys) => {
      if (keys.length > 1) {
        keys.forEach((k) => (conflicts[k] = true));
      }
    });

    setDuplicateConflicts(conflicts);
  }, [previewSchedules]);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setSelectedClassId(null);
      setClasses([]);
      setSearchQuery("");
      setClassScheduleConfigs({});
      setClassSelectedSlots({});
      setPreviewSchedules({});
      setPoolCapacities({});
      setSelectedPools({});
      setSelectedScheduleKey(null);
      setEditingSchedules({});
      setAvailableInstructors([]);
      setLegendAccordionOpen(false);
      setError(null);
    }
  }, [open]);

  // Load slots and classes when modal opens
  React.useEffect(() => {
    if (open) {
      if (allSlots.length === 0) {
        loadSlots();
      }
      if (classes.length === 0) {
        if (preSelectedClassIds && preSelectedClassIds.length > 0) {
          fetchClassesForModal(undefined, preSelectedClassIds);
        } else {
          fetchClassesForModal();
        }
      }
    }
  }, [open]);

  // Pre-fill data when modal opens with pre-selected values from CASE 2
  React.useEffect(() => {
    if (open && preSelectedClassIds && preSelectedClassIds.length > 0) {
      // Filter out classes that are already fully scheduled
      const validClassIds = preSelectedClassIds.filter((classId) => {
        const classItem = classes.find((c) => c._id === classId);
        if (!classItem) return false;
        return !isClassFullyScheduled(classItem);
      });

      // Only set selected class ID if there are valid ones
      if (validClassIds.length > 0) {
        const first = validClassIds[0];
        setSelectedClassId(first);

        // If preSelectedSlots provided, set for this class
        if (preSelectedSlots && preSelectedSlots[first]) {
          setClassSelectedSlots((prev) => ({
            ...prev,
            [first]: preSelectedSlots[first],
          }));
        }

        // If preScheduleConfigs provided, set for this class
        if (preScheduleConfigs && preScheduleConfigs[first]) {
          const cfg = preScheduleConfigs[first];
          setClassScheduleConfigs((prev) => ({
            ...prev,
            [first]: {
              min_time: cfg.min_time,
              max_time: cfg.max_time,
              session_in_week: cfg.session_in_week,
              array_number_in_week:
                cfg.selectedDays || cfg.array_number_in_week,
              start_date: cfg.start_date,
            },
          }));
        }
      }
    }
  }, [
    open,
    preSelectedClassIds,
    preSelectedSlots,
    preScheduleConfigs,
    classes,
  ]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const { fetchAllSlots } = await import("@/api/manager/slot-api");
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      const slots = await fetchAllSlots(tenantId, token);
      setAllSlots(slots);
    } catch (error: any) {
      console.error("Failed to load slots:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách ca học",
      });
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchClassesForModal = async (
    searchKey?: string,
    classIds?: string[]
  ) => {
    setLoadingClasses(true);
    try {
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin tenant hoặc token");
      }

      if (classIds && classIds.length > 0) {
        // Fetch only the specified classes by IDs
        const result = await fetchClassesByIds(classIds, tenantId, token);
        setClasses(result || []);
      } else {
        const result = await fetchClasses(tenantId, token, 1, 1000, searchKey);
        setClasses(result.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch classes:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách lớp học",
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  // Initialize default config for selected class
  React.useEffect(() => {
    const newConfigs = { ...classScheduleConfigs };
    const newSlots = { ...classSelectedSlots };

    // Get tomorrow's date as default start_date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultStartDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    if (selectedClassId) {
      if (!newConfigs[selectedClassId]) {
        newConfigs[selectedClassId] = {
          min_time: 7,
          max_time: 18,
          session_in_week: 0,
          array_number_in_week: [],
          start_date: defaultStartDate,
        };
      }
      if (!newSlots[selectedClassId]) {
        newSlots[selectedClassId] = [];
      }
    }
    setClassScheduleConfigs(newConfigs);
    setClassSelectedSlots(newSlots);
  }, [selectedClassId]);

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
  };

  const handleSlotToggle = (classId: string, slotId: string) => {
    setClassSelectedSlots((prev) => {
      const currentSlots = prev[classId] || [];

      // Limit: Min 1 slot, Max 2 slots
      let newSlots: string[];
      if (currentSlots.includes(slotId)) {
        // Removing slot
        newSlots = currentSlots.filter((id) => id !== slotId);
      } else {
        // Adding slot
        if (currentSlots.length >= 2) {
          // Already have 2 slots, show toast and return
          toast({
            variant: "destructive",
            title: "Đã đạt giới hạn",
            description: "Chỉ được chọn tối đa 2 ca học",
          });
          return prev;
        }
        newSlots = [...currentSlots, slotId];
      }

      // Auto-calculate min_time and max_time when slots change
      const selectedSlots = allSlots.filter((slot) =>
        newSlots.includes(slot._id)
      );
      let minTime = 7;
      let maxTime = 18;

      if (selectedSlots.length > 0) {
        minTime = Math.min(...selectedSlots.map((s) => s.start_time));
        // Fix: max_time = end_time + (end_minute / 100), NOT / 60!
        // Example: 7h45 = 7 + (45/100) = 7.45
        const maxSlot = selectedSlots.reduce((max, slot) =>
          slot.end_time > max.end_time ||
          (slot.end_time === max.end_time && slot.end_minute > max.end_minute)
            ? slot
            : max
        );
        maxTime = maxSlot.end_time + maxSlot.end_minute / 100;
      }

      // Update config with new times
      setClassScheduleConfigs((prevConfigs) => ({
        ...prevConfigs,
        [classId]: {
          ...prevConfigs[classId],
          min_time: minTime,
          max_time: maxTime,
        },
      }));

      return {
        ...prev,
        [classId]: newSlots,
      };
    });
  };

  const handleDayToggle = (classId: string, jsDay: number) => {
    setClassScheduleConfigs((prev) => {
      const config = prev[classId] || {
        min_time: 7,
        max_time: 18,
        session_in_week: 0,
        array_number_in_week: [],
      };
      const days = config.array_number_in_week.includes(jsDay)
        ? config.array_number_in_week.filter((d) => d !== jsDay)
        : [...config.array_number_in_week, jsDay];
      return {
        ...prev,
        [classId]: {
          ...config,
          array_number_in_week: days,
          session_in_week: days.length,
        },
      };
    });
  };

  const handleStartDateChange = (classId: string, dateString: string) => {
    setClassScheduleConfigs((prev) => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        start_date: dateString,
      },
    }));
  };

  // Removed handleTimeChange - now using automatic calculation from selected slots

  // Validate Step 1 data
  const validateStep1 = (): { valid: boolean; message?: string } => {
    if (!selectedClassId) {
      return { valid: false, message: "Vui lòng chọn một lớp học" };
    }

    const config = classScheduleConfigs[selectedClassId];
    const slots = classSelectedSlots[selectedClassId] || [];
    const classItem = classes.find((c) => c._id === selectedClassId);
    const className = classItem?.name || "Lớp học";

    if (!config?.start_date) {
      return {
        valid: false,
        message: `${className}: Vui lòng chọn ngày bắt đầu xếp lịch`,
      };
    }

    if (slots.length === 0) {
      return {
        valid: false,
        message: `${className}: Vui lòng chọn ít nhất một ca học`,
      };
    }

    if (
      !config?.array_number_in_week ||
      config.array_number_in_week.length === 0
    ) {
      return {
        valid: false,
        message: `${className}: Vui lòng chọn ít nhất một ngày học trong tuần`,
      };
    }

    return { valid: true };
  };

  const handleGeneratePreview = async () => {
    // Validate before generating
    const validation = validateStep1();
    if (!validation.valid) {
      setError(validation.message || "Vui lòng điền đầy đủ thông tin");
      toast({
        variant: "destructive",
        title: "Thiếu thông tin",
        description: validation.message,
      });
      return;
    }

    setIsGeneratingPreview(true);
    setError(null);
    try {
      // Import API functions
      const { autoScheduleClassPreview } = await import(
        "@/api/manager/schedule-api"
      );
      const { fetchAllSlots } = await import("@/api/manager/slot-api");
      const { fetchInstructors } = await import(
        "@/api/manager/instructors-api"
      );
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Build request array for selected class
      const requestData = selectedClassId
        ? [
            {
              class_id: selectedClassId,
              min_time: classScheduleConfigs[selectedClassId].min_time,
              max_time: classScheduleConfigs[selectedClassId].max_time,
              session_in_week:
                classScheduleConfigs[selectedClassId].session_in_week,
              start_date: classScheduleConfigs[selectedClassId].start_date, // Add start_date to request
              array_number_in_week: classScheduleConfigs[
                selectedClassId
              ].array_number_in_week.map((jsDay) =>
                convertJsDayToBackendDay(
                  jsDay,
                  new Date(
                    classScheduleConfigs[selectedClassId].start_date ||
                      new Date()
                  )
                )
              ),
            },
          ]
        : [];

      // Call preview API
      const response = await autoScheduleClassPreview(
        requestData,
        tenantId,
        token
      );

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Dữ liệu phản hồi không hợp lệ");
      }

      // Fetch slots and instructors to enrich data
      const [allSlots, allInstructors] = await Promise.all([
        fetchAllSlots(tenantId, token),
        fetchInstructors({ tenantId, token, role: "instructor" }),
      ]);

      // Create lookup maps
      const slotsMap = new Map(allSlots.map((slot) => [slot._id, slot]));
      const instructorsMap = new Map(
        allInstructors.map((inst: any) => [inst._id, inst])
      );

      // Parse and enrich response data
      const parsedPreview: { [classId: string]: PreviewSchedule[] } = {};

      response.data.forEach((classSchedules: any[], index: number) => {
        const classId = selectedClassId;
        if (classId && Array.isArray(classSchedules)) {
          // Enrich each schedule with full slot and instructor details
          const enrichedSchedules = classSchedules.map((schedule: any) => {
            const slotId =
              typeof schedule.slot === "string"
                ? schedule.slot
                : schedule.slot?._id;
            const instructorId =
              typeof schedule.instructor === "string"
                ? schedule.instructor
                : schedule.instructor?._id;

            const slotDetail = slotsMap.get(slotId);
            const instructorDetail = instructorsMap.get(instructorId);

            return {
              ...schedule,
              slot: slotDetail
                ? {
                    _id: slotDetail._id,
                    title: slotDetail.title,
                    start_time: slotDetail.start_time,
                    start_minute: slotDetail.start_minute,
                    end_time: slotDetail.end_time,
                    end_minute: slotDetail.end_minute,
                  }
                : {
                    _id: slotId || "",
                    title: "N/A",
                    start_time: 0,
                    start_minute: 0,
                    end_time: 0,
                    end_minute: 0,
                  },
              instructor: instructorDetail
                ? {
                    _id: instructorDetail._id,
                    username: instructorDetail.username,
                  }
                : {
                    _id: instructorId || "",
                    username: "N/A",
                  },
            };
          });

          // Ensure schedules are in chronological order (oldest -> newest)
          const sortedEnriched = enrichedSchedules
            .slice()
            .sort(
              (a: any, b: any) =>
                new Date(a.date).getTime() - new Date(b.date).getTime()
            );

          parsedPreview[classId] = sortedEnriched;
        }
      });

      setPreviewSchedules(parsedPreview);

      // Auto-calculate pool capacity after generating preview (Task 5)
      await calculatePoolCapacityAfterPreview(parsedPreview);

      setCurrentStep(1);
    } catch (err: any) {
      console.error("Preview generation error:", err);
      setError(err.message || "Không thể tạo lịch xem trước");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const isClassFullyScheduled = (classItem: ClassItem): boolean => {
    const sessionNumber = classItem.course?.session_number || 0;
    const schedulesCount = classItem.schedules?.length || 0;
    return schedulesCount >= sessionNumber;
  };

  const getRemainingSessionsCount = (classItem: ClassItem): number => {
    const sessionNumber = classItem.course?.session_number || 0;
    const schedulesCount = classItem.schedules?.length || 0;
    return Math.max(0, sessionNumber - schedulesCount);
  };

  // Convert preview schedules to calendar events for a specific class
  const convertToCalendarEvents = (
    classId: string,
    schedules: PreviewSchedule[],
    className: string
  ): CalendarEvent[] => {
    return schedules.map((schedule, idx) => {
      const scheduleDate = new Date(schedule.date);
      const startHour = schedule.slot?.start_time || 0;
      const startMinute = schedule.slot?.start_minute || 0;
      const endHour = schedule.slot?.end_time || 0;
      const endMinute = schedule.slot?.end_minute || 0;

      const start = new Date(scheduleDate);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(scheduleDate);
      end.setHours(endHour, endMinute, 0, 0);

      return {
        id: `${classId}-${idx}`,
        title: `${className} - ${schedule.slot?.title || ""}`,
        start,
        end,
        resource: {
          classId,
          className,
          slotTitle: schedule.slot?.title || "",
          instructorName: schedule.instructor?.username || "N/A",
          scheduleIndex: idx,
        },
      };
    });
  };

  // Convert schedules with pool info for Step 3 & 4
  const convertToCalendarEventsWithPool = (
    classId: string,
    schedules: PreviewSchedule[],
    className: string,
    withPoolInfo: boolean = false
  ) => {
    return schedules.map((schedule, idx) => {
      const scheduleKey = `${classId}-${idx}`;
      const selectedPoolId = selectedPools[scheduleKey];
      const selectedPool = poolCapacities[scheduleKey]?.find(
        (p) => p._id === selectedPoolId
      );

      const scheduleDate = new Date(schedule.date);
      const startHour = schedule.slot?.start_time || 0;
      const startMinute = schedule.slot?.start_minute || 0;
      const endHour = schedule.slot?.end_time || 0;
      const endMinute = schedule.slot?.end_minute || 0;

      const start = new Date(scheduleDate);
      start.setHours(startHour, startMinute, 0, 0);

      const end = new Date(scheduleDate);
      end.setHours(endHour, endMinute, 0, 0);

      const hasWarning =
        selectedPool?.hasAgeWarning || selectedPool?.hasInstructorConflict;

      return {
        id: scheduleKey,
        title:
          withPoolInfo && selectedPool
            ? `${className}\\n${schedule.slot?.title || ""}\\n ${
                selectedPool.title
              }`
            : `${className}\\n${schedule.slot?.title || ""}`,
        start,
        end,
        resource: {
          classId,
          className,
          slotTitle: schedule.slot?.title || "",
          instructorName: schedule.instructor?.username || "",
          scheduleIndex: idx,
          scheduleKey,
          poolId: selectedPoolId,
          poolName: selectedPool?.title,
          hasWarning,
          hasAgeWarning: selectedPool?.hasAgeWarning,
          hasInstructorConflict: selectedPool?.hasInstructorConflict,
        },
      };
    });
  };

  const handleCalculatePoolCapacity = async () => {
    setIsCalculatingCapacity(true);
    setError(null);
    await calculatePoolCapacityAfterPreview(previewSchedules);
    setIsCalculatingCapacity(false);
  };

  const calculatePoolCapacityAfterPreview = async (schedulesToProcess: {
    [classId: string]: PreviewSchedule[];
  }) => {
    try {
      const { fetchDateRangeSchedule } = await import(
        "@/api/manager/schedule-api"
      );
      const { fetchAvailablePools } = await import("@/api/manager/pools-api");
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Step 1: Build array of all schedules for API call
      const allSchedulesForApi: Array<{ date: string; slot: { _id: string } }> =
        [];
      const scheduleKeyMap: string[] = []; // To map API response index to scheduleKey

      Object.entries(schedulesToProcess).forEach(([classId, schedules]) => {
        schedules.forEach((schedule, scheduleIndex) => {
          allSchedulesForApi.push({
            date: schedule.date,
            slot: { _id: schedule.slot._id },
          });
          scheduleKeyMap.push(`${classId}-${scheduleIndex}`);
        });
      });

      // Step 2: Call new API to get available pools
      const availablePoolsArrays = await fetchAvailablePools(
        allSchedulesForApi,
        tenantId,
        token
      );

      // Step 3: Get date range for instructor conflict check
      let minDate: Date | null = null;
      let maxDate: Date | null = null;

      Object.values(schedulesToProcess).forEach((schedules) => {
        schedules.forEach((schedule) => {
          const date = new Date(schedule.date);
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;
        });
      });

      if (!minDate || !maxDate) {
        throw new Error("Không tìm thấy ngày trong lịch xem trước");
      }

      // Step 4: Fetch existing schedules for instructor conflict check
      const existingSchedules = await fetchDateRangeSchedule(
        minDate,
        maxDate,
        tenantId,
        token
      );

      // Step 5: Process available pools and add validations
      const capacityMap: { [scheduleKey: string]: PoolCapacityInfo[] } = {};
      let scheduleApiIndex = 0;

      Object.entries(schedulesToProcess).forEach(([classId, schedules]) => {
        const classItem = availableClasses.find((c) => c._id === classId);
        const courseMaxMember = (classItem?.course as any)?.max_member || 0;

        schedules.forEach((schedule, scheduleIndex) => {
          const scheduleKey = `${classId}-${scheduleIndex}`;
          const availablePools = availablePoolsArrays[scheduleApiIndex] || [];
          scheduleApiIndex++;

          // Map API pools to PoolCapacityInfo with validations
          const poolCapacities: PoolCapacityInfo[] = availablePools.map(
            (pool) => {
              // Validation 1: Check age type matching
              const courseTypeOfAge = (classItem?.course as any)?.type_of_age;
              const poolTypeOfAge = pool.type_of_age;

              let poolTypeIds: string[] = [];
              let poolTypeTitles: string[] = [];

              if (Array.isArray(poolTypeOfAge)) {
                poolTypeOfAge.forEach((t: any) => {
                  if (typeof t === "object" && t?._id) {
                    poolTypeIds.push(t._id);
                    poolTypeTitles.push(t?.title?.toLowerCase() || "");
                  } else if (typeof t === "string") {
                    poolTypeIds.push(t);
                  }
                });
              } else if (poolTypeOfAge) {
                const poolTypeId =
                  typeof poolTypeOfAge === "object"
                    ? (poolTypeOfAge as any)?._id
                    : poolTypeOfAge;
                const poolTypeTitle =
                  typeof poolTypeOfAge === "object"
                    ? (poolTypeOfAge as any)?.title?.toLowerCase()
                    : (poolTypeOfAge as any)?.toLowerCase();
                if (poolTypeId) poolTypeIds.push(poolTypeId);
                if (poolTypeTitle) poolTypeTitles.push(poolTypeTitle);
              }

              let courseTypeIds: string[] = [];
              if (Array.isArray(courseTypeOfAge)) {
                courseTypeOfAge.forEach((t: any) => {
                  if (typeof t === "object" && t?._id) {
                    courseTypeIds.push(t._id);
                  } else if (typeof t === "string") {
                    courseTypeIds.push(t);
                  }
                });
              } else if (courseTypeOfAge) {
                const courseTypeId =
                  typeof courseTypeOfAge === "object"
                    ? courseTypeOfAge?._id
                    : courseTypeOfAge;
                if (courseTypeId) courseTypeIds.push(courseTypeId);
              }

              const isMixedPool = poolTypeTitles.some(
                (t) => t === "mixed" || t === "hỗn hợp"
              );

              const hasAgeWarning =
                courseTypeIds.length > 0 &&
                poolTypeIds.length > 0 &&
                !isMixedPool &&
                !courseTypeIds.some((cId) => poolTypeIds.includes(cId));

              // Validation 2: Check instructor conflict
              const instructorId = schedule.instructor._id;
              const hasInstructorConflict = existingSchedules.events.some(
                (existingEvent: any) => {
                  return (
                    existingEvent.date === schedule.date &&
                    existingEvent.slot?._id === schedule.slot._id &&
                    existingEvent.instructor?._id === instructorId
                  );
                }
              );

              // Validation 3: Check if remaining_capacity < max_member
              const hasCapacityWarning =
                courseMaxMember > 0 &&
                pool.remaining_capacity < courseMaxMember;

              return {
                _id: pool._id,
                title: pool.title,
                capacity: pool.capacity,
                capacity_remain: pool.remaining_capacity, // Map API field
                isAvailable: pool.remaining_capacity > 0,
                schedulesUsed: [],
                type_of_age: poolTypeOfAge,
                hasAgeWarning,
                hasInstructorConflict,
                current_usage: pool.current_usage, // Add current_usage from API
                hasCapacityWarning, // Add new validation
              };
            }
          );

          capacityMap[scheduleKey] = poolCapacities;
        });
      });

      setPoolCapacities(capacityMap);

      // Step 6: Auto-select pools - prioritize first pool, then apply scoring
      const autoSelectedPools: { [scheduleKey: string]: string } = {};

      Object.entries(capacityMap).forEach(([scheduleKey, pools]) => {
        if (pools.length === 0) return;

        // Priority 1: Select first pool from API response (backend already optimized order)
        const firstPool = pools[0];
        if (firstPool && firstPool.capacity_remain > 0) {
          autoSelectedPools[scheduleKey] = firstPool._id;
          return;
        }

        // Fallback: If first pool has no capacity, use scoring algorithm
        const scoredPools = pools.map((pool) => {
          let score = 0;

          // Base score: Pool must have remaining capacity
          if (pool.capacity_remain > 0) {
            score += 50;
          }

          // Priority 1: Age type match - +100 points
          if (!pool.hasAgeWarning) {
            score += 100;
          } else {
            score += 20; // Still allow selection with warning
          }

          // Priority 2: No instructor conflict - +50 points
          if (!pool.hasInstructorConflict) {
            score += 50;
          }

          // Priority 3: No capacity warning - +30 points
          if (!pool.hasCapacityWarning) {
            score += 30;
          }

          // Priority 4: Higher remaining capacity - proportional score (0-30 points)
          if (pool.capacity > 0 && pool.capacity_remain > 0) {
            const capacityRatio = pool.capacity_remain / pool.capacity;
            score += capacityRatio * 30;
          }

          return { ...pool, score };
        });

        scoredPools.sort((a, b) => b.score - a.score);

        const bestPool = scoredPools[0];
        if (bestPool) {
          autoSelectedPools[scheduleKey] = bestPool._id;
        }
      });

      // Apply auto-selected pools
      setSelectedPools(autoSelectedPools);
      setAutoSelectedPools(autoSelectedPools);
    } catch (err: any) {
      console.error("Pool capacity calculation error:", err);
      setError(err.message || "Không thể tính toán sức chứa hồ bơi");
      throw err;
    }
  };

  // Load available instructors for editing
  const loadAvailableInstructors = async () => {
    if (availableInstructors.length > 0) return; // Already loaded

    setLoadingInstructors(true);
    try {
      const { fetchInstructors } = await import(
        "@/api/manager/instructors-api"
      );
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      const instructors = await fetchInstructors({
        tenantId,
        token,
        role: "instructor",
      });
      setAvailableInstructors(instructors);
    } catch (error: any) {
      console.error("Failed to load instructors:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách huấn luyện viên",
      });
    } finally {
      setLoadingInstructors(false);
    }
  };

  // Handle editing a schedule (change instructor, date, and slot)
  const handleEditSchedule = async (
    scheduleKey: string,
    newInstructorId: string,
    newDate: string,
    newSlotId: string
  ) => {
    const [classId, scheduleIndexStr] = scheduleKey.split("-");
    const scheduleIndex = parseInt(scheduleIndexStr);

    if (!classId || isNaN(scheduleIndex)) return;

    const currentSchedules = previewSchedules[classId];
    if (!currentSchedules || !currentSchedules[scheduleIndex]) return;

    // Find the selected slot details
    const selectedSlotDetail = allSlots.find((slot) => slot._id === newSlotId);
    if (!selectedSlotDetail) return;

    const updatedSchedule = {
      ...currentSchedules[scheduleIndex],
      date: newDate,
      slot: {
        _id: selectedSlotDetail._id,
        title: selectedSlotDetail.title,
        start_time: selectedSlotDetail.start_time,
        start_minute: selectedSlotDetail.start_minute,
        end_time: selectedSlotDetail.end_time,
        end_minute: selectedSlotDetail.end_minute,
      },
      instructor:
        availableInstructors.find((inst) => inst._id === newInstructorId) ||
        currentSchedules[scheduleIndex].instructor,
    };

    // Update the schedule
    const updatedSchedules = [...currentSchedules];
    updatedSchedules[scheduleIndex] = updatedSchedule;

    // Re-sort schedules by date
    const sortedSchedules = updatedSchedules.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Update preview schedules
    setPreviewSchedules((prev) => ({
      ...prev,
      [classId]: sortedSchedules,
    }));

    // Clear selected pools and editing state for this class, then re-calculate
    const newSelectedPools = { ...selectedPools };
    const newEditingSchedules = { ...editingSchedules };

    // Clear old keys
    updatedSchedules.forEach((_, idx) => {
      const oldKey = `${classId}-${idx}`;
      delete newSelectedPools[oldKey];
      delete newEditingSchedules[oldKey];
    });

    setSelectedPools(newSelectedPools);
    setEditingSchedules(newEditingSchedules);

    // Re-calculate pool capacities with updated schedules
    await calculatePoolCapacityAfterPreview({ [classId]: sortedSchedules });

    toast({
      title: "Đã cập nhật",
      description: "Lịch học đã được cập nhật và sắp xếp lại theo ngày.",
    });
  };

  // Check if a schedule needs editing (cases 1, 2, or 3)
  const needsEditing = (scheduleKey: string): boolean => {
    const pools = poolCapacities[scheduleKey] || [];
    const selectedPoolId = selectedPools[scheduleKey];
    const selectedPool = pools.find((p) => p._id === selectedPoolId);

    const noPoolsAvailable = pools.length === 0;
    const hasInstructorConflict = selectedPool?.hasInstructorConflict;

    return noPoolsAvailable || hasInstructorConflict;
  };

  const handleCreateSchedules = async () => {
    setIsCreatingSchedules(true);
    setError(null);
    try {
      const { addClassToSchedule } = await import("@/api/manager/schedule-api");
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Prepare schedules for API
      const schedulesToCreate: any[] = [];

      Object.entries(previewSchedules).forEach(([classId, schedules]) => {
        schedules.forEach((schedule, scheduleIndex) => {
          const scheduleKey = `${classId}-${scheduleIndex}`;
          const selectedPoolId = selectedPools[scheduleKey];

          if (!selectedPoolId) {
            throw new Error(
              `Chưa chọn hồ bơi cho buổi học ngày ${schedule.date}`
            );
          }

          // Convert preview schedule to addClassToSchedule format
          // Only include fields defined in AddScheduleRequest interface

          // Format date to YYYY-MM-DD
          const formatDateToYYYYMMDD = (dateStr: string) => {
            const date = new Date(dateStr);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");
            return `${year}-${month}-${day}`;
          };

          const scheduleData = {
            date: formatDateToYYYYMMDD(schedule.date),
            slot: schedule.slot._id,
            classroom: classId, // Use classId directly - this is the classroom ID
            instructor: schedule.instructor._id,
            pool: selectedPoolId,
          };

          schedulesToCreate.push(scheduleData);
        });
      });

      // Call API to create schedules
      await addClassToSchedule(schedulesToCreate, tenantId, token);

      // Show success toast
      toast({
        title: "Tạo lịch thành công",
        description: `Đã tạo ${schedulesToCreate.length} buổi học cho ${
          Object.keys(previewSchedules).length
        } lớp học.`,
      });

      // Success - close modal and refresh
      onScheduleComplete();
      onOpenChange(false);
    } catch (err: any) {
      console.error("Schedule creation error:", err);
      setError(err.message || "Không thể tạo lịch học");
    } finally {
      setIsCreatingSchedules(false);
    }
  };

  // Check that every preview schedule has a selected pool and no warnings
  const allPreviewCardsGreen =
    Object.keys(previewSchedules).length > 0 &&
    Object.entries(previewSchedules).every(([classId, schedules]) =>
      schedules.every((_, idx) => {
        const scheduleKey = `${classId}-${idx}`;
        const selectedPoolId = selectedPools[scheduleKey];
        if (!selectedPoolId) return false;
        const selectedPool = poolCapacities[scheduleKey]?.find(
          (p) => p._id === selectedPoolId
        );
        if (!selectedPool) return false;
        // No age warning, no instructor conflict, no capacity warning
        // Also require no duplicate conflicts
        const hasDuplicate = !!duplicateConflicts[scheduleKey];
        return (
          !selectedPool.hasAgeWarning &&
          !selectedPool.hasInstructorConflict &&
          !selectedPool.hasCapacityWarning &&
          !hasDuplicate
        );
      })
    );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Xếp lịch cho lớp có sẵn</DialogTitle>
          <DialogDescription>
            Chọn lớp học và thiết lập thời gian để xếp lịch tự động
          </DialogDescription>
        </DialogHeader>

        <Stepper
          steps={STEPS}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        >
          <StepperHeader className='mb-6' />
          <StepperContent>
            {/* Step 1: Select Classes & Config */}
            <StepperStep step={0}>
              <div className='space-y-4'>
                {error && (
                  <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className='space-y-2'>
                  <Label>Tìm kiếm lớp học</Label>
                  <Input
                    placeholder='Tìm kiếm lớp học (tên, khóa học, huấn luyện viên)...'
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      fetchClassesForModal(e.target.value);
                    }}
                  />
                </div>

                {loadingClasses ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
                    <p className='text-muted-foreground'>
                      Đang tìm kiếm lớp học...
                    </p>
                  </div>
                ) : loading ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
                    <p className='text-muted-foreground'>
                      Đang tải danh sách lớp học...
                    </p>
                  </div>
                ) : classes.length === 0 ? (
                  <div className='text-center py-12'>
                    <p className='text-muted-foreground'>
                      {searchQuery
                        ? "Không tìm thấy lớp học nào"
                        : "Không có lớp học nào để xếp lịch"}
                    </p>
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedClassId || ""}
                    onValueChange={handleClassSelect}
                  >
                    {classes.map((classItem) => {
                      const isSelected = selectedClassId === classItem._id;
                      const isFullyScheduled = isClassFullyScheduled(classItem);
                      const remainingSessions =
                        getRemainingSessionsCount(classItem);
                      const config = classScheduleConfigs[classItem._id];

                      return (
                        <div
                          key={classItem._id}
                          className={cn(
                            "border rounded-lg p-4 transition-colors",
                            isSelected && "border-primary bg-primary/5",
                            isFullyScheduled && "opacity-50"
                          )}
                        >
                          <div className='flex items-start gap-4'>
                            <RadioGroupItem
                              value={classItem._id}
                              disabled={isFullyScheduled}
                              className='mt-1'
                            />
                            <div className='flex-1 space-y-3'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <h4 className='font-medium'>
                                    {classItem.name}
                                  </h4>
                                  <p className='text-sm text-muted-foreground'>
                                    Khóa học: {classItem.course?.title || "N/A"}
                                  </p>
                                </div>
                                <div className='flex gap-2'>
                                  {isFullyScheduled ? (
                                    <Badge variant='secondary'>
                                      <CheckCircle2 className='h-3 w-3 mr-1' />
                                      Đã xếp đủ lịch
                                    </Badge>
                                  ) : (
                                    <Badge variant='outline'>
                                      Còn {remainingSessions} buổi
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {isSelected && config && (
                                <div className='space-y-3 pt-3 border-t'>
                                  <div className='space-y-2'>
                                    <Label>Ngày bắt đầu xếp lịch *</Label>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant='outline'
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !config.start_date &&
                                              "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarLucide className='mr-2 h-4 w-4' />
                                          {config.start_date ? (
                                            format(
                                              new Date(
                                                config.start_date + "T00:00:00"
                                              ),
                                              "EEEE, dd/MM/yyyy",
                                              { locale: vi }
                                            )
                                          ) : (
                                            <span>Chọn ngày bắt đầu</span>
                                          )}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        className='w-auto p-0'
                                        align='start'
                                      >
                                        <Calendar
                                          mode='single'
                                          selected={
                                            config.start_date
                                              ? new Date(
                                                  config.start_date +
                                                    "T00:00:00"
                                                )
                                              : undefined
                                          }
                                          onSelect={(date) => {
                                            if (date) {
                                              const dateStr = format(
                                                date,
                                                "yyyy-MM-dd"
                                              );
                                              handleStartDateChange(
                                                classItem._id,
                                                dateStr
                                              );
                                            }
                                          }}
                                          disabled={(date) => {
                                            const tomorrow = new Date();
                                            tomorrow.setDate(
                                              tomorrow.getDate() + 1
                                            );
                                            tomorrow.setHours(0, 0, 0, 0);
                                            return date < tomorrow;
                                          }}
                                          initialFocus
                                          locale={vi}
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </div>

                                  <div className='space-y-2'>
                                    <Label>Chọn thời gian học *</Label>
                                    {loadingSlots ? (
                                      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Đang tải ca học...
                                      </div>
                                    ) : (
                                      <div className='relative'>
                                        <div className='grid grid-cols-3 gap-2 relative z-10'>
                                          {allSlots.map((slot) => {
                                            const isSlotSelected = (
                                              classSelectedSlots[
                                                classItem._id
                                              ] || []
                                            ).includes(slot._id);

                                            // Check if slot is in range for highlighting
                                            let isInRange = false;
                                            const selectedSlotIds =
                                              classSelectedSlots[
                                                classItem._id
                                              ] || [];
                                            if (selectedSlotIds.length === 2) {
                                              const sortedSlots = [
                                                ...allSlots,
                                              ].sort(
                                                (a, b) =>
                                                  a.start_time - b.start_time ||
                                                  a.start_minute -
                                                    b.start_minute
                                              );
                                              const selectedIndices =
                                                selectedSlotIds
                                                  .map((id) =>
                                                    sortedSlots.findIndex(
                                                      (s) => s._id === id
                                                    )
                                                  )
                                                  .filter((i) => i !== -1)
                                                  .sort((a, b) => a - b);

                                              if (
                                                selectedIndices.length === 2
                                              ) {
                                                const [minIdx, maxIdx] =
                                                  selectedIndices;
                                                const currentIdx =
                                                  sortedSlots.findIndex(
                                                    (s) => s._id === slot._id
                                                  );
                                                isInRange =
                                                  currentIdx >= minIdx &&
                                                  currentIdx <= maxIdx;
                                              }
                                            }

                                            const formatTime = (
                                              hour: number,
                                              minute: number
                                            ) =>
                                              `${hour
                                                .toString()
                                                .padStart(2, "0")}:${minute
                                                .toString()
                                                .padStart(2, "0")}`;

                                            return (
                                              <button
                                                key={slot._id}
                                                type='button'
                                                onClick={() =>
                                                  handleSlotToggle(
                                                    classItem._id,
                                                    slot._id
                                                  )
                                                }
                                                className={cn(
                                                  "p-2 rounded-md border transition-all text-left relative",
                                                  isSlotSelected
                                                    ? "border-primary bg-primary/10 shadow-sm"
                                                    : isInRange
                                                    ? "border-primary/50 bg-primary/5"
                                                    : "border-border hover:border-primary/50"
                                                )}
                                              >
                                                <div className='flex items-start justify-between'>
                                                  <div>
                                                    <div className='font-medium text-xs'>
                                                      {slot.title}
                                                    </div>
                                                    <div className='text-xs text-muted-foreground mt-0.5'>
                                                      {formatTime(
                                                        slot.start_time,
                                                        slot.start_minute
                                                      )}
                                                      {" - "}
                                                      {formatTime(
                                                        slot.end_time,
                                                        slot.end_minute
                                                      )}
                                                    </div>
                                                  </div>
                                                  {isSlotSelected && (
                                                    <CheckCircle2 className='h-3 w-3 text-primary flex-shrink-0' />
                                                  )}
                                                </div>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                    {(classSelectedSlots[classItem._id] || [])
                                      .length > 0 && (
                                      <Alert>
                                        <AlertCircle className='h-4 w-4' />
                                        <AlertDescription className='text-xs'>
                                          Khung giờ tự động:{" "}
                                          {formatTimeDisplay(config.min_time)}-{" "}
                                          {formatTimeDisplay(config.max_time)}
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>

                                  <div className='space-y-2'>
                                    <Label>Chọn ngày học trong tuần</Label>
                                    <div className='flex gap-2'>
                                      {DAY_NAMES.map((day) => (
                                        <Button
                                          key={day.value}
                                          type='button'
                                          variant={
                                            config.array_number_in_week.includes(
                                              day.value
                                            )
                                              ? "default"
                                              : "outline"
                                          }
                                          size='sm'
                                          onClick={() =>
                                            handleDayToggle(
                                              classItem._id,
                                              day.value
                                            )
                                          }
                                        >
                                          {day.label}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>
            </StepperStep>

            {/* Step 2: Preview & Select Pools (MERGED) */}
            <StepperStep step={1}>
              <div className='space-y-4'>
                {/* Info Alert */}
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Đây là tổng quan lịch học được tạo tự động. Bạn có thể chỉnh
                    sửa từng buổi học bằng cách nhấn nút edit trên mỗi thẻ. Chọn
                    hồ bơi cho từng buổi học sau khi chỉnh sửa xong.
                  </AlertDescription>
                </Alert>

                {/* Color Legend */}
                <Accordion
                  type='single'
                  collapsible
                  value={legendAccordionOpen ? "legend" : ""}
                  onValueChange={(value) =>
                    setLegendAccordionOpen(value === "legend")
                  }
                >
                  <AccordionItem
                    value='legend'
                    className='border-amber-200'
                  >
                    <AccordionTrigger className='text-sm font-medium text-amber-800 dark:text-amber-200 hover:no-underline'>
                      Chú thích màu sắc
                    </AccordionTrigger>
                    <AccordionContent>
                      <Alert
                        variant='destructive'
                        className='bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 border-0'
                      >
                        <AlertCircle className='h-4 w-4 text-amber-600' />
                        <AlertDescription className='text-amber-800 dark:text-amber-200'>
                          <ul className='text-xs space-y-1 ml-0'>
                            <li className='flex items-center gap-2'>
                              <Circle className='h-3 w-3 text-green-600 flex-shrink-0' />
                              <span>Xanh lá: Đã chọn hồ bơi</span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Circle className='h-3 w-3 text-amber-500 flex-shrink-0' />
                              <span>
                                Vàng: Có cảnh báo (Độ tuổi không phù hợp)
                              </span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Circle className='h-3 w-3 text-red-600 flex-shrink-0' />
                              <span>
                                Đỏ: Có xung đột (Huấn luyện viên trùng lịch)
                              </span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Circle className='h-3 w-3 text-orange-500 flex-shrink-0' />
                              <span>
                                Cam: Có vấn đề cần chỉnh sửa (không có hồ bơi
                                hoặc HLV trùng lịch)
                              </span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Circle className='h-3 w-3 text-blue-500 flex-shrink-0' />
                              <span>
                                Xanh dương: Có thể chỉnh sửa (ấn nút edit)
                              </span>
                            </li>
                            <li className='flex items-center gap-2'>
                              <Circle className='h-3 w-3 text-gray-600 flex-shrink-0' />
                              <span>Xám: Chưa chọn hồ bơi</span>
                            </li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {Object.keys(previewSchedules).length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    Không có dữ liệu xem trước
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {Object.entries(previewSchedules).map(
                      ([classId, schedules]) => {
                        const classItem = availableClasses.find(
                          (c) => c._id === classId
                        );

                        if (!schedules || schedules.length === 0) {
                          return (
                            <div
                              key={classId}
                              className='border rounded-lg p-4'
                            >
                              <h4 className='font-medium'>{classItem?.name}</h4>
                              <p className='text-sm text-muted-foreground'>
                                Không thể tạo lịch cho lớp này.
                              </p>
                            </div>
                          );
                        }

                        // Generate summary: group by day of week and slot
                        const daySlotMap: { [dayName: string]: Set<string> } =
                          {};
                        const scheduledDates: Date[] = [];

                        schedules.forEach((schedule) => {
                          const date = new Date(schedule.date);
                          scheduledDates.push(date);
                          const dayName = date.toLocaleDateString("vi-VN", {
                            weekday: "long",
                          });
                          const capitalizedDay =
                            dayName.charAt(0).toUpperCase() + dayName.slice(1);
                          if (!daySlotMap[capitalizedDay]) {
                            daySlotMap[capitalizedDay] = new Set();
                          }
                          daySlotMap[capitalizedDay].add(
                            schedule.slot?.title || ""
                          );
                        });

                        // Sort days in week order
                        const dayOrder = [
                          "Thứ hai",
                          "Thứ ba",
                          "Thứ tư",
                          "Thứ năm",
                          "Thứ sáu",
                          "Thứ bảy",
                          "Chủ nhật",
                        ];
                        const sortedDays = Object.keys(daySlotMap).sort(
                          (a, b) => {
                            const aIdx = dayOrder.findIndex((d) =>
                              a.toLowerCase().includes(d.toLowerCase())
                            );
                            const bIdx = dayOrder.findIndex((d) =>
                              b.toLowerCase().includes(d.toLowerCase())
                            );
                            return aIdx - bIdx;
                          }
                        );

                        // Find date range
                        const minDate = new Date(
                          Math.min(...scheduledDates.map((d) => d.getTime()))
                        );
                        const maxDate = new Date(
                          Math.max(...scheduledDates.map((d) => d.getTime()))
                        );

                        return (
                          <div
                            key={classId}
                            className='border rounded-lg overflow-hidden'
                          >
                            {/* Header */}
                            <div className='bg-muted/50 px-4 py-3 border-b'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <h4 className='font-medium'>
                                    {classItem?.name}
                                  </h4>
                                  <p className='text-sm text-muted-foreground'>
                                    Khóa học: {classItem?.course?.title}
                                  </p>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Badge variant='secondary'>
                                    {schedules.length} buổi học
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Summary Content */}
                            <div className='p-4 space-y-4'>
                              {/* Text Summary */}
                              <div className='space-y-2'>
                                <div className='text-sm font-medium text-muted-foreground'>
                                  Lịch học hàng tuần:
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                  {sortedDays.map((day) => (
                                    <div
                                      key={day}
                                      className='bg-primary/10 rounded-md px-3 py-1.5'
                                    >
                                      <span className='font-medium text-sm'>
                                        {day}
                                      </span>
                                      <span className='text-xs text-muted-foreground ml-2'>
                                        (
                                        {Array.from(daySlotMap[day]).join(", ")}
                                        )
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Date Range */}
                              <div className='text-sm text-muted-foreground'>
                                <span className='font-medium'>Thời gian:</span>{" "}
                                {format(minDate, "dd/MM/yyyy", { locale: vi })}{" "}
                                -{" "}
                                {format(maxDate, "dd/MM/yyyy", { locale: vi })}
                              </div>

                              {/* Simple Calendar Preview - highlight scheduled dates */}
                              <div className='border rounded-md p-3 bg-muted/20'>
                                <div className='text-xs font-medium text-muted-foreground mb-2'>
                                  Các ngày có lịch học:
                                </div>
                                <div className='flex flex-wrap gap-1.5'>
                                  {scheduledDates
                                    .sort((a, b) => a.getTime() - b.getTime())
                                    .map((date, idx) => (
                                      <div
                                        key={idx}
                                        className='bg-primary text-primary-foreground text-xs px-2 py-1 rounded'
                                        title={format(
                                          date,
                                          "EEEE, dd/MM/yyyy",
                                          { locale: vi }
                                        )}
                                      >
                                        {format(date, "dd/MM")}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* Pool Selection Section - CARDS Grid Layout */}
                              <div className='border-t pt-4 mt-4'>
                                <div className='text-sm font-medium mb-3'>
                                  Xem trước lịch các buổi học:
                                </div>
                                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                                  {schedules.map((schedule, scheduleIndex) => {
                                    const scheduleKey = `${classId}-${scheduleIndex}`;
                                    const selectedPoolId =
                                      selectedPools[scheduleKey];
                                    const pools =
                                      poolCapacities[scheduleKey] || [];
                                    const selectedPool = pools.find(
                                      (p) => p._id === selectedPoolId
                                    );
                                    const hasWarning =
                                      selectedPool?.hasAgeWarning;
                                    const hasConflict =
                                      selectedPool?.hasInstructorConflict;
                                    const isOpen =
                                      openPoolPopover === scheduleKey;
                                    const isEditing =
                                      editingSchedules[scheduleKey];
                                    const hasDuplicate =
                                      !!duplicateConflicts[scheduleKey];
                                    const requiresEditing =
                                      needsEditing(scheduleKey) || hasDuplicate;

                                    // Determine card color
                                    let cardBorderColor = "border-border";
                                    let cardBgColor = "bg-muted/30";

                                    // Duplicate conflicts should take highest priority
                                    if (hasDuplicate) {
                                      cardBorderColor = "border-red-500";
                                      cardBgColor =
                                        "bg-red-50 dark:bg-red-950/20";
                                    } else if (selectedPoolId) {
                                      if (hasConflict) {
                                        cardBorderColor = "border-red-400";
                                        cardBgColor =
                                          "bg-red-50 dark:bg-red-950/20";
                                      } else if (hasWarning) {
                                        cardBorderColor = "border-amber-400";
                                        cardBgColor =
                                          "bg-amber-50 dark:bg-amber-950/20";
                                      } else {
                                        cardBorderColor = "border-green-400";
                                        cardBgColor =
                                          "bg-green-50 dark:bg-green-950/20";
                                      }
                                    } else if (requiresEditing) {
                                      cardBorderColor = "border-orange-400";
                                      cardBgColor =
                                        "bg-orange-50 dark:bg-orange-950/20";
                                    }

                                    return (
                                      <div
                                        key={scheduleKey}
                                        className={cn(
                                          "rounded-lg border-2 p-3 transition-all",
                                          cardBorderColor,
                                          cardBgColor
                                        )}
                                      >
                                        {/* Date & Slot with sequence number */}
                                        <div className='flex items-center justify-between mb-2'>
                                          <div className='flex items-center'>
                                            <div className='flex-shrink-0 mr-3'>
                                              <div className='w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm'>
                                                {scheduleIndex + 1}
                                              </div>
                                            </div>
                                            <div>
                                              <div className='font-medium text-sm'>
                                                {format(
                                                  new Date(schedule.date),
                                                  "EEEE",
                                                  { locale: vi }
                                                )}
                                              </div>
                                              <div className='text-xs text-muted-foreground'>
                                                {format(
                                                  new Date(schedule.date),
                                                  "dd/MM/yyyy",
                                                  { locale: vi }
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <div className='flex gap-1'>
                                            <Badge
                                              variant='outline'
                                              className='text-xs'
                                            >
                                              {schedule.slot?.title}
                                            </Badge>
                                            {!isEditing && (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button
                                                    variant='ghost'
                                                    size='sm'
                                                    className='h-6 w-8 px-1 text-xs'
                                                  >
                                                    <MoreHorizontal className='h-4 w-4' />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                  align='end'
                                                  className='w-44'
                                                >
                                                  <DropdownMenuItem
                                                    onClick={() => {
                                                      loadAvailableInstructors();
                                                      setEditingSchedules(
                                                        (prev) => ({
                                                          ...prev,
                                                          [scheduleKey]: true,
                                                        })
                                                      );
                                                    }}
                                                  >
                                                    Chỉnh sửa buổi học
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem
                                                    onClick={() => {
                                                      setOpenPoolPopover(
                                                        scheduleKey
                                                      );
                                                    }}
                                                  >
                                                    Chọn hồ bơi
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            )}
                                          </div>
                                        </div>

                                        {/* Instructor */}
                                        <div className='text-xs text-muted-foreground mb-2'>
                                          Huấn luyện viên:{" "}
                                          {schedule.instructor?.username ||
                                            "N/A"}
                                        </div>

                                        {/* Editing Interface */}
                                        {isEditing ? (
                                          <div className='space-y-2 border-t pt-2'>
                                            <div className='text-xs font-medium text-blue-600'>
                                              Chỉnh sửa buổi học:
                                            </div>

                                            {/* Slot Selection */}
                                            <Select
                                              value={schedule.slot._id}
                                              onValueChange={(slotId) => {
                                                const selectedSlotDetail =
                                                  allSlots.find(
                                                    (slot) =>
                                                      slot._id === slotId
                                                  );
                                                if (selectedSlotDetail) {
                                                  const updatedSchedule = {
                                                    ...schedule,
                                                    slot: {
                                                      _id: selectedSlotDetail._id,
                                                      title:
                                                        selectedSlotDetail.title,
                                                      start_time:
                                                        selectedSlotDetail.start_time,
                                                      start_minute:
                                                        selectedSlotDetail.start_minute,
                                                      end_time:
                                                        selectedSlotDetail.end_time,
                                                      end_minute:
                                                        selectedSlotDetail.end_minute,
                                                    },
                                                  };
                                                  const updatedSchedules = [
                                                    ...schedules,
                                                  ];
                                                  updatedSchedules[
                                                    scheduleIndex
                                                  ] = updatedSchedule;
                                                  setPreviewSchedules(
                                                    (prev) => ({
                                                      ...prev,
                                                      [classId]:
                                                        updatedSchedules,
                                                    })
                                                  );
                                                }
                                              }}
                                            >
                                              <SelectTrigger className='h-7 text-xs'>
                                                <SelectValue placeholder='Chọn ca học' />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {allSlots.map((slot) => (
                                                  <SelectItem
                                                    key={slot._id}
                                                    value={slot._id}
                                                    className='text-xs'
                                                  >
                                                    {slot.title} (
                                                    {formatTimeDisplay(
                                                      slot.start_time
                                                    )}{" "}
                                                    -{" "}
                                                    {formatTimeDisplay(
                                                      slot.end_time
                                                    )}
                                                    )
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>

                                            {/* Instructor Selection */}
                                            <Select
                                              value={schedule.instructor._id}
                                              onValueChange={(instructorId) => {
                                                const updatedSchedule = {
                                                  ...schedule,
                                                  instructor:
                                                    availableInstructors.find(
                                                      (inst) =>
                                                        inst._id ===
                                                        instructorId
                                                    ) || schedule.instructor,
                                                };
                                                const updatedSchedules = [
                                                  ...schedules,
                                                ];
                                                updatedSchedules[
                                                  scheduleIndex
                                                ] = updatedSchedule;
                                                setPreviewSchedules((prev) => ({
                                                  ...prev,
                                                  [classId]: updatedSchedules,
                                                }));
                                              }}
                                            >
                                              <SelectTrigger className='h-7 text-xs'>
                                                <SelectValue placeholder='Chọn HLV' />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {loadingInstructors ? (
                                                  <div className='flex items-center justify-center py-2'>
                                                    <Loader2 className='h-4 w-4 animate-spin' />
                                                  </div>
                                                ) : (
                                                  availableInstructors.map(
                                                    (inst) => (
                                                      <SelectItem
                                                        key={inst._id}
                                                        value={inst._id}
                                                        className='text-xs'
                                                      >
                                                        {inst.username}
                                                      </SelectItem>
                                                    )
                                                  )
                                                )}
                                              </SelectContent>
                                            </Select>

                                            {/* Date Selection */}
                                            <Popover>
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant='outline'
                                                  className='w-full justify-start text-left font-normal h-7 text-xs'
                                                >
                                                  <CalendarLucide className='mr-1 h-3 w-3' />
                                                  {format(
                                                    new Date(schedule.date),
                                                    "dd/MM/yyyy",
                                                    { locale: vi }
                                                  )}
                                                </Button>
                                              </PopoverTrigger>
                                              <PopoverContent
                                                className='w-auto p-0'
                                                align='start'
                                              >
                                                <Calendar
                                                  mode='single'
                                                  selected={
                                                    new Date(schedule.date)
                                                  }
                                                  onSelect={(date) => {
                                                    if (date) {
                                                      const dateStr = format(
                                                        date,
                                                        "yyyy-MM-dd"
                                                      );
                                                      const updatedSchedule = {
                                                        ...schedule,
                                                        date: dateStr,
                                                      };
                                                      const updatedSchedules = [
                                                        ...schedules,
                                                      ];
                                                      updatedSchedules[
                                                        scheduleIndex
                                                      ] = updatedSchedule;
                                                      setPreviewSchedules(
                                                        (prev) => ({
                                                          ...prev,
                                                          [classId]:
                                                            updatedSchedules,
                                                        })
                                                      );
                                                    }
                                                  }}
                                                  disabled={(date) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    return date <= today; // Disable today and past dates
                                                  }}
                                                  initialFocus
                                                  locale={vi}
                                                />
                                              </PopoverContent>
                                            </Popover>

                                            {/* Action Buttons */}
                                            <div className='flex gap-1'>
                                              <Button
                                                size='sm'
                                                className='h-6 px-2 text-xs flex-1'
                                                onClick={async () => {
                                                  await handleEditSchedule(
                                                    scheduleKey,
                                                    schedule.instructor._id,
                                                    schedule.date,
                                                    schedule.slot._id
                                                  );
                                                }}
                                              >
                                                <CheckCircle2 className='h-3 w-3 mr-1' />
                                                Xác nhận
                                              </Button>
                                              <Button
                                                variant='outline'
                                                size='sm'
                                                className='h-6 px-2 text-xs'
                                                onClick={() => {
                                                  setEditingSchedules(
                                                    (prev) => ({
                                                      ...prev,
                                                      [scheduleKey]: false,
                                                    })
                                                  );
                                                }}
                                              >
                                                Hủy
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            {/* Pool Selection */}
                                            <Popover
                                              open={isOpen}
                                              onOpenChange={(open) => {
                                                if (open) {
                                                  setOpenPoolPopover(
                                                    scheduleKey
                                                  );
                                                } else {
                                                  setOpenPoolPopover(null);
                                                }
                                              }}
                                            >
                                              <PopoverTrigger asChild>
                                                <Button
                                                  variant={
                                                    selectedPoolId
                                                      ? "outline"
                                                      : "secondary"
                                                  }
                                                  size='sm'
                                                  className={cn(
                                                    "w-full justify-between text-xs h-8",
                                                    !selectedPoolId &&
                                                      "text-muted-foreground"
                                                  )}
                                                  disabled={isEditing}
                                                >
                                                  <span className='truncate'>
                                                    {selectedPool
                                                      ? `${selectedPool.title}`
                                                      : isEditing
                                                      ? "Đang chỉnh sửa..."
                                                      : "Chọn hồ bơi..."}
                                                  </span>
                                                  {/* icon removed to avoid duplicate edit controls; use overflow menu */}
                                                </Button>
                                              </PopoverTrigger>
                                              {!isEditing && (
                                                <PopoverContent
                                                  className='w-72 p-0'
                                                  align='start'
                                                >
                                                  <div className='border-b p-3 bg-muted/50'>
                                                    <h4 className='font-medium text-sm'>
                                                      Chọn hồ bơi
                                                    </h4>
                                                    <p className='text-xs text-muted-foreground mt-1'>
                                                      {format(
                                                        new Date(schedule.date),
                                                        "EEEE, dd/MM/yyyy",
                                                        { locale: vi }
                                                      )}{" "}
                                                      • {schedule.slot?.title}
                                                    </p>
                                                  </div>
                                                  <ScrollArea className='h-[400px]'>
                                                    <div className='p-2'>
                                                      {pools.length === 0 ? (
                                                        <div className='text-center py-4 text-sm text-muted-foreground'>
                                                          Không có hồ bơi khả
                                                          dụng
                                                        </div>
                                                      ) : (
                                                        <div className='space-y-1.5'>
                                                          {pools.map((pool) => {
                                                            const isPoolSelected =
                                                              selectedPoolId ===
                                                              pool._id;
                                                            const poolHasWarnings =
                                                              pool.hasAgeWarning ||
                                                              pool.hasInstructorConflict;
                                                            const noCapacity =
                                                              pool.capacity_remain <=
                                                              0;

                                                            return (
                                                              <button
                                                                key={pool._id}
                                                                type='button'
                                                                onClick={() => {
                                                                  setSelectedPools(
                                                                    (prev) => ({
                                                                      ...prev,
                                                                      [scheduleKey]:
                                                                        pool._id,
                                                                    })
                                                                  );
                                                                  setOpenPoolPopover(
                                                                    null
                                                                  );
                                                                }}
                                                                disabled={
                                                                  noCapacity
                                                                }
                                                                className={cn(
                                                                  "w-full p-2 rounded border text-left text-xs transition-all",
                                                                  isPoolSelected
                                                                    ? "border-primary bg-primary/10"
                                                                    : "border-border hover:border-primary/50",
                                                                  poolHasWarnings &&
                                                                    !isPoolSelected &&
                                                                    "border-amber-300 bg-amber-50/50",
                                                                  noCapacity &&
                                                                    "opacity-50 cursor-not-allowed"
                                                                )}
                                                              >
                                                                <div className='flex justify-between items-start'>
                                                                  <div className='flex-1'>
                                                                    <div className='font-medium flex items-center gap-1'>
                                                                      {
                                                                        pool.title
                                                                      }
                                                                      {isPoolSelected && (
                                                                        <CheckCircle2 className='h-3 w-3 text-primary' />
                                                                      )}
                                                                    </div>
                                                                    <div className='text-muted-foreground mt-0.5'>
                                                                      Sức chứa:{" "}
                                                                      {
                                                                        pool.capacity
                                                                      }
                                                                    </div>
                                                                    {pool.current_usage !==
                                                                      undefined && (
                                                                      <div className='text-muted-foreground mt-0.5'>
                                                                        Đang sử
                                                                        dụng:{" "}
                                                                        {
                                                                          pool.current_usage
                                                                        }
                                                                        /
                                                                        {
                                                                          pool.capacity
                                                                        }
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                  <div className='text-right'>
                                                                    <div
                                                                      className={cn(
                                                                        "font-semibold",
                                                                        pool.capacity_remain >
                                                                          0
                                                                          ? "text-green-600"
                                                                          : "text-red-600"
                                                                      )}
                                                                    >
                                                                      {
                                                                        pool.capacity_remain
                                                                      }
                                                                    </div>
                                                                    <div className='text-muted-foreground'>
                                                                      còn
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                                {(pool.hasAgeWarning ||
                                                                  pool.hasInstructorConflict ||
                                                                  pool.hasCapacityWarning) && (
                                                                  <div className='mt-1.5 pt-1.5 border-t space-y-0.5'>
                                                                    {pool.hasAgeWarning && (
                                                                      <div className='text-amber-600 flex items-center gap-1'>
                                                                        <AlertCircle className='h-3 w-3' />
                                                                        Độ tuổi
                                                                        không
                                                                        phù hợp
                                                                      </div>
                                                                    )}
                                                                    {pool.hasInstructorConflict && (
                                                                      <div className='text-red-600 flex items-center gap-1'>
                                                                        <AlertCircle className='h-3 w-3' />
                                                                        Huấn
                                                                        luyện
                                                                        viên
                                                                        trùng
                                                                        lịch
                                                                      </div>
                                                                    )}
                                                                    {pool.hasCapacityWarning && (
                                                                      <div className='text-amber-600 flex items-center gap-1'>
                                                                        <AlertCircle className='h-3 w-3' />
                                                                        Sức chứa
                                                                        hồ bơi (
                                                                        {
                                                                          pool.capacity_remain
                                                                        }
                                                                        ) nhỏ
                                                                        hơn số
                                                                        học viên
                                                                        tối đa (
                                                                        {(
                                                                          classItem?.course as any
                                                                        )
                                                                          ?.max_member ||
                                                                          0}
                                                                        )
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )}
                                                              </button>
                                                            );
                                                          })}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </ScrollArea>
                                                </PopoverContent>
                                              )}
                                            </Popover>

                                            {/* Warnings */}
                                            {(hasDuplicate ||
                                              (selectedPoolId &&
                                                (hasWarning ||
                                                  selectedPool?.hasCapacityWarning))) && (
                                              <div className='mt-2 text-xs space-y-0.5'>
                                                {hasDuplicate && (
                                                  <div className='text-red-600 flex items-center gap-1'>
                                                    <AlertCircle className='h-3 w-3' />
                                                    Trùng buổi học
                                                  </div>
                                                )}
                                                {hasWarning && (
                                                  <div className='text-amber-600 flex items-center gap-1'>
                                                    <AlertCircle className='h-3 w-3' />
                                                    Độ tuổi không phù hợp
                                                  </div>
                                                )}
                                                {selectedPool?.hasCapacityWarning && (
                                                  <div className='text-amber-600 flex items-center gap-1'>
                                                    <AlertCircle className='h-3 w-3' />
                                                    Sức chứa hồ bơi nhỏ hơn số
                                                    học viên tối đa
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {/* Edit prompt for cases that need editing */}
                                            {requiresEditing && (
                                              <div className='mt-2 text-xs text-orange-600 flex items-center gap-1'>
                                                <AlertCircle className='h-3 w-3' />
                                                {pools.length === 0
                                                  ? "Không có hồ bơi khả dụng - cần chỉnh sửa"
                                                  : "Huấn luyện viên trùng lịch - cần chỉnh sửa"}
                                              </div>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </StepperStep>

            {/* Step 2: Select Pools with Cards (Merged from old step 3) - REMOVED DUPLICATE */}
            {/* This duplicate step has been removed - pool selection is now in Step 1 */}

            {/* Step 3: Confirm with Table View */}
            <StepperStep step={2}>
              <div className='space-y-4'>
                {error && (
                  <Alert variant='destructive'>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <CheckCircle2 className='h-4 w-4' />
                  <AlertDescription>
                    Xem lại lịch học trước khi tạo. Nếu cần sửa đổi, vui lòng
                    quay lại bước trước.
                  </AlertDescription>
                </Alert>

                {Object.keys(previewSchedules).length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    Không có dữ liệu lịch học
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {Object.entries(previewSchedules).map(
                      ([classId, schedules]) => {
                        const classItem = availableClasses.find(
                          (c) => c._id === classId
                        );

                        // Count schedules with warnings
                        const schedulesWithWarnings = schedules.filter(
                          (_, scheduleIndex) => {
                            const scheduleKey = `${classId}-${scheduleIndex}`;
                            const selectedPoolId = selectedPools[scheduleKey];
                            const selectedPool = poolCapacities[
                              scheduleKey
                            ]?.find((p) => p._id === selectedPoolId);
                            return (
                              selectedPool?.hasAgeWarning ||
                              selectedPool?.hasInstructorConflict
                            );
                          }
                        ).length;

                        return (
                          <div
                            key={classId}
                            className='border rounded-lg overflow-hidden'
                          >
                            {/* Header */}
                            <div className='bg-muted/50 px-4 py-3 border-b'>
                              <div className='flex items-center justify-between'>
                                <div>
                                  <h4 className='font-medium'>
                                    {classItem?.name}
                                  </h4>
                                  <p className='text-sm text-muted-foreground'>
                                    Khóa học: {classItem?.course?.title}
                                  </p>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <Badge variant='secondary'>
                                    {schedules.length} buổi học
                                  </Badge>
                                  {schedulesWithWarnings > 0 && (
                                    <Badge
                                      variant='destructive'
                                      className='bg-amber-500'
                                    >
                                      <AlertCircle className='h-3 w-3 mr-1' />
                                      {schedulesWithWarnings} cảnh báo
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Table */}
                            <div className='max-h-[400px] overflow-y-auto'>
                              <Table>
                                <TableHeader className='sticky top-0 bg-background'>
                                  <TableRow>
                                    <TableHead className='w-12 text-center'>
                                      STT
                                    </TableHead>
                                    <TableHead className='min-w-[150px]'>
                                      Ngày
                                    </TableHead>
                                    <TableHead className='min-w-[80px]'>
                                      Ca học
                                    </TableHead>
                                    <TableHead className='min-w-[120px]'>
                                      Huấn luyện viên
                                    </TableHead>
                                    <TableHead className='min-w-[120px]'>
                                      Hồ bơi
                                    </TableHead>
                                    <TableHead className='w-24 text-center'>
                                      Trạng thái
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {schedules.map((schedule, idx) => {
                                    const scheduleKey = `${classId}-${idx}`;
                                    const selectedPoolId =
                                      selectedPools[scheduleKey];
                                    const selectedPool = poolCapacities[
                                      scheduleKey
                                    ]?.find((p) => p._id === selectedPoolId);
                                    const hasAgeWarning =
                                      selectedPool?.hasAgeWarning;
                                    const hasConflict =
                                      selectedPool?.hasInstructorConflict;
                                    const hasAnyWarning =
                                      hasAgeWarning || hasConflict;

                                    return (
                                      <TableRow
                                        key={scheduleKey}
                                        className={cn(
                                          hasConflict &&
                                            "bg-red-50 dark:bg-red-950/20",
                                          hasAgeWarning &&
                                            !hasConflict &&
                                            "bg-amber-50 dark:bg-amber-950/20"
                                        )}
                                      >
                                        <TableCell className='text-center font-medium'>
                                          {idx + 1}
                                        </TableCell>
                                        <TableCell>
                                          <div className='font-medium'>
                                            {format(
                                              new Date(schedule.date),
                                              "EEEE",
                                              { locale: vi }
                                            )}
                                          </div>
                                          <div className='text-xs text-muted-foreground'>
                                            {format(
                                              new Date(schedule.date),
                                              "dd/MM/yyyy",
                                              { locale: vi }
                                            )}
                                          </div>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant='outline'>
                                            {schedule.slot?.title}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className='text-sm'>
                                          {schedule.instructor?.username ||
                                            "N/A"}
                                        </TableCell>
                                        <TableCell>
                                          <div className='flex items-center gap-1'>
                                            <span className='text-sm font-medium'>
                                              {selectedPool?.title || "N/A"}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className='text-center'>
                                          {hasAnyWarning ? (
                                            <div className='flex flex-col items-center gap-0.5'>
                                              {hasConflict && (
                                                <Badge
                                                  variant='destructive'
                                                  className='text-xs px-1.5 py-0'
                                                >
                                                  Trùng lịch
                                                </Badge>
                                              )}
                                              {hasAgeWarning && (
                                                <Badge
                                                  variant='outline'
                                                  className='text-xs px-1.5 py-0 border-amber-400 text-amber-600'
                                                >
                                                  Độ tuổi
                                                </Badge>
                                              )}
                                            </div>
                                          ) : (
                                            <CheckCircle2 className='h-5 w-5 text-green-500 mx-auto' />
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </div>

                            {/* Warning Alert */}
                            {schedulesWithWarnings > 0 && (
                              <div className='px-4 py-3 border-t bg-amber-50 dark:bg-amber-950/20'>
                                <div className='flex items-start gap-2 text-xs text-amber-800 dark:text-amber-200'>
                                  <AlertCircle className='h-4 w-4 flex-shrink-0 mt-0.5' />
                                  <span>
                                    Lớp này có {schedulesWithWarnings} buổi học
                                    có cảnh báo. Vui lòng kiểm tra lại ở bước
                                    trước nếu cần sửa đổi.
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </StepperStep>
          </StepperContent>

          <StepperFooter>
            <Button
              variant='outline'
              onClick={() => {
                if (currentStep === 0) {
                  onOpenChange(false);
                } else {
                  setCurrentStep((prev) => prev - 1);
                }
              }}
              disabled={
                isGeneratingPreview ||
                isCalculatingCapacity ||
                isCreatingSchedules
              }
            >
              {currentStep === 0 ? "Hủy" : "Quay lại"}
            </Button>
            {/* Inline hint shown when user is blocked from proceeding */}
            {currentStep === 1 && !allPreviewCardsGreen && (
              <div className='text-xs text-amber-600 mr-3 flex items-center'>
                Chưa thể tiếp tục — vui lòng xử lý các cảnh báo.
              </div>
            )}

            <Button
              onClick={() => {
                if (currentStep === 0) {
                  handleGeneratePreview(); // Auto-calculates pools
                } else if (currentStep === 1) {
                  // Go to confirm step
                  setCurrentStep((prev) => prev + 1);
                } else if (currentStep === 2) {
                  // Final submit - create schedules
                  handleCreateSchedules();
                }
              }}
              disabled={
                (currentStep === 0 && !selectedClassId) ||
                // Only allow moving from step 1 -> 2 if all preview cards are green
                (currentStep === 1 && !allPreviewCardsGreen) ||
                isGeneratingPreview ||
                isCalculatingCapacity ||
                isCreatingSchedules
              }
            >
              {isGeneratingPreview ||
              isCalculatingCapacity ||
              isCreatingSchedules ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {isGeneratingPreview && "Đang tạo lịch..."}
                  {isCalculatingCapacity && "Đang tính toán..."}
                  {isCreatingSchedules && "Đang tạo lịch..."}
                </>
              ) : currentStep === STEPS.length - 1 ? (
                "Tạo lịch"
              ) : currentStep === 0 ? (
                "Xem trước & Chọn hồ bơi"
              ) : (
                "Tiếp tục"
              )}
            </Button>
          </StepperFooter>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
