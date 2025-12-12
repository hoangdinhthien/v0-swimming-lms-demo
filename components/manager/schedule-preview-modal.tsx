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
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassItem } from "@/api/manager/class-api";
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
  type_of_age?: string;
  hasAgeWarning?: boolean;
  hasInstructorConflict?: boolean;
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
    description: "Chọn các lớp cần xếp lịch",
  },
  {
    id: "preview",
    title: "Xem trước",
    description: "Xem lịch đề xuất",
  },
  {
    id: "pools",
    title: "Chọn hồ",
    description: "Chọn hồ bơi cho lịch học",
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
  const [selectedClassIds, setSelectedClassIds] = React.useState<string[]>([]);
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

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setSelectedClassIds([]);
      setClassScheduleConfigs({});
      setClassSelectedSlots({});
      setPreviewSchedules({});
      setPoolCapacities({});
      setSelectedPools({});
      setSelectedScheduleKey(null);
      setError(null);
    }
  }, [open]);

  // Load slots when modal opens
  React.useEffect(() => {
    if (open && allSlots.length === 0) {
      loadSlots();
    }
  }, [open]);

  // Pre-fill data when modal opens with pre-selected values from CASE 2
  React.useEffect(() => {
    if (open && preSelectedClassIds && preSelectedClassIds.length > 0) {
      // Filter out classes that are already fully scheduled
      const validClassIds = preSelectedClassIds.filter((classId) => {
        const classItem = availableClasses.find((c) => c._id === classId);
        if (!classItem) return false;
        return !isClassFullyScheduled(classItem);
      });

      // Only set selected class IDs if there are valid ones
      if (validClassIds.length > 0) {
        setSelectedClassIds(validClassIds);

        // Set selected slots only for valid classes
        if (preSelectedSlots) {
          const validSlots: { [classId: string]: string[] } = {};
          validClassIds.forEach((classId) => {
            if (preSelectedSlots[classId]) {
              validSlots[classId] = preSelectedSlots[classId];
            }
          });
          setClassSelectedSlots(validSlots);
        }

        // Set schedule configs only for valid classes
        if (preScheduleConfigs) {
          const convertedConfigs: { [classId: string]: ClassScheduleConfig } =
            {};
          validClassIds.forEach((classId) => {
            const config = preScheduleConfigs[classId];
            if (config) {
              convertedConfigs[classId] = {
                min_time: config.min_time,
                max_time: config.max_time,
                session_in_week: config.session_in_week,
                array_number_in_week:
                  config.selectedDays || config.array_number_in_week,
                start_date: config.start_date,
              };
            }
          });
          setClassScheduleConfigs(convertedConfigs);
        }
      }
    }
  }, [
    open,
    preSelectedClassIds,
    preSelectedSlots,
    preScheduleConfigs,
    availableClasses,
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

  // Initialize default config for selected classes
  React.useEffect(() => {
    const newConfigs = { ...classScheduleConfigs };
    const newSlots = { ...classSelectedSlots };

    // Get tomorrow's date as default start_date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultStartDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD

    selectedClassIds.forEach((classId) => {
      if (!newConfigs[classId]) {
        newConfigs[classId] = {
          min_time: 7,
          max_time: 18,
          session_in_week: 0,
          array_number_in_week: [],
          start_date: defaultStartDate,
        };
      }
      if (!newSlots[classId]) {
        newSlots[classId] = [];
      }
    });
    setClassScheduleConfigs(newConfigs);
    setClassSelectedSlots(newSlots);
  }, [selectedClassIds]);

  const handleClassToggle = (classId: string) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId)
        ? prev.filter((id) => id !== classId)
        : [...prev, classId]
    );
  };

  const handleSlotToggle = (classId: string, slotId: string) => {
    setClassSelectedSlots((prev) => {
      const currentSlots = prev[classId] || [];
      const newSlots = currentSlots.includes(slotId)
        ? currentSlots.filter((id) => id !== slotId)
        : [...currentSlots, slotId];

      // Auto-calculate min_time and max_time when slots change
      const selectedSlots = allSlots.filter((slot) =>
        newSlots.includes(slot._id)
      );
      let minTime = 7;
      let maxTime = 18;

      if (selectedSlots.length > 0) {
        minTime = Math.min(...selectedSlots.map((s) => s.start_time));
        maxTime = Math.max(...selectedSlots.map((s) => s.end_time));
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
    if (selectedClassIds.length === 0) {
      return { valid: false, message: "Vui lòng chọn ít nhất một lớp học" };
    }

    for (const classId of selectedClassIds) {
      const config = classScheduleConfigs[classId];
      const slots = classSelectedSlots[classId] || [];
      const classItem = availableClasses.find((c) => c._id === classId);
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

      // Build request array for selected classes
      const requestData = selectedClassIds.map((classId) => {
        const config = classScheduleConfigs[classId];
        const startDate = config.start_date
          ? new Date(config.start_date)
          : new Date();

        return {
          class_id: classId,
          min_time: config.min_time,
          max_time: config.max_time,
          session_in_week: config.session_in_week,
          start_date: config.start_date, // Add start_date to request
          array_number_in_week: config.array_number_in_week.map((jsDay) =>
            convertJsDayToBackendDay(jsDay, startDate)
          ),
        };
      });

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
        const classId = selectedClassIds[index];
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

          parsedPreview[classId] = enrichedSchedules;
        }
      });

      setPreviewSchedules(parsedPreview);
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
    try {
      const { fetchDateRangeSchedule } = await import(
        "@/api/manager/schedule-api"
      );
      const { fetchPools } = await import("@/api/manager/pools-api");
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Step 1: Get all pools
      const poolsResponse = await fetchPools({}, tenantId, token);
      const allPools = poolsResponse.pools || [];

      // Step 2: Find date range from all preview schedules
      let minDate: Date | null = null;
      let maxDate: Date | null = null;

      Object.values(previewSchedules).forEach((schedules) => {
        schedules.forEach((schedule) => {
          const date = new Date(schedule.date);
          if (!minDate || date < minDate) minDate = date;
          if (!maxDate || date > maxDate) maxDate = date;
        });
      });

      if (!minDate || !maxDate) {
        throw new Error("Không tìm thấy ngày trong lịch xem trước");
      }

      // Step 3: Fetch existing schedules in date range
      const existingSchedules = await fetchDateRangeSchedule(
        minDate,
        maxDate,
        tenantId,
        token
      );

      // Step 4: Calculate pool capacity for each preview schedule
      const capacityMap: { [scheduleKey: string]: PoolCapacityInfo[] } = {};

      Object.entries(previewSchedules).forEach(([classId, schedules]) => {
        const classItem = availableClasses.find((c) => c._id === classId);
        const classCapacity =
          (classItem?.course as any)?.capacity ||
          (classItem?.course as any)?.max_member ||
          0;

        schedules.forEach((schedule, scheduleIndex) => {
          const scheduleKey = `${classId}-${scheduleIndex}`;
          const slotId = schedule.slot._id;
          const date = schedule.date;

          // Calculate capacity for each pool
          const poolCapacities: PoolCapacityInfo[] = allPools.map((pool) => {
            let capacityUsed = 0;

            // Count from existing DB schedules (events)
            existingSchedules.events.forEach((existingEvent: any) => {
              if (
                existingEvent.date === date &&
                existingEvent.slot?._id === slotId &&
                existingEvent.pool?._id === pool._id
              ) {
                capacityUsed += existingEvent.classroom?.capacity || 0;
              }
            });

            // Count from other preview schedules (already selected)
            Object.entries(previewSchedules).forEach(
              ([otherClassId, otherSchedules]) => {
                otherSchedules.forEach((otherSchedule, otherIndex) => {
                  const otherKey = `${otherClassId}-${otherIndex}`;
                  const selectedPoolId = selectedPools[otherKey];

                  if (
                    selectedPoolId === pool._id &&
                    otherSchedule.date === date &&
                    otherSchedule.slot._id === slotId &&
                    otherKey !== scheduleKey
                  ) {
                    const otherClass = availableClasses.find(
                      (c) => c._id === otherClassId
                    );
                    capacityUsed +=
                      (otherClass?.course as any)?.capacity ||
                      (otherClass?.course as any)?.max_member ||
                      0;
                  }
                });
              }
            );

            const capacityRemain = (pool.capacity || 0) - capacityUsed;
            // Changed: isAvailable now only checks if pool has any remaining capacity (> 0)
            const isAvailable = capacityRemain > 0;

            // Validation 1: Check age type matching (type_of_age)
            const courseTypeOfAge = (classItem?.course as any)?.type_of_age;
            const poolTypeOfAge = (pool as any).type_of_age;

            // Handle array of type_of_age (pool can have multiple age types)
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
                  ? poolTypeOfAge?._id
                  : poolTypeOfAge;
              const poolTypeTitle =
                typeof poolTypeOfAge === "object"
                  ? poolTypeOfAge?.title?.toLowerCase()
                  : poolTypeOfAge?.toLowerCase();
              if (poolTypeId) poolTypeIds.push(poolTypeId);
              if (poolTypeTitle) poolTypeTitles.push(poolTypeTitle);
            }

            // Handle course type_of_age (can also be array)
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

            // Check if pool is "mixed" type (accepts any age)
            const isMixedPool = poolTypeTitles.some(
              (t) => t === "mixed" || t === "hỗn hợp"
            );

            // Has warning if course has type_of_age but pool doesn't match any
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
                  existingEvent.date === date &&
                  existingEvent.slot?._id === slotId &&
                  existingEvent.instructor?._id === instructorId
                );
              }
            );

            return {
              _id: pool._id,
              title: pool.title,
              capacity: pool.capacity || 0,
              capacity_remain: capacityRemain,
              isAvailable, // Now true if capacity_remain > 0
              schedulesUsed: [],
              type_of_age: poolTypeOfAge,
              hasAgeWarning,
              hasInstructorConflict,
            };
          });

          capacityMap[scheduleKey] = poolCapacities;
        });
      });

      setPoolCapacities(capacityMap);

      // Step 5: Auto-select best pool for each schedule using NEW scoring algorithm
      const autoSelectedPools: { [scheduleKey: string]: string } = {};

      Object.entries(capacityMap).forEach(([scheduleKey, pools]) => {
        // Score each pool - NEW LOGIC: Always select a pool if any available
        const scoredPools = pools.map((pool) => {
          let score = 0;

          // Base score: Pool must have remaining capacity
          if (pool.capacity_remain > 0) {
            score += 50; // Base points for having capacity
          }

          // Priority 1: Age type match (highest priority) - +100 points
          if (!pool.hasAgeWarning) {
            score += 100;
          } else {
            score += 20; // Still give some points even with warning (allow selection)
          }

          // Priority 2: No instructor conflict - +50 points
          if (!pool.hasInstructorConflict) {
            score += 50;
          }

          // Priority 3: Higher remaining capacity is better - proportional score (0-30 points)
          if (pool.capacity > 0 && pool.capacity_remain > 0) {
            const capacityRatio = pool.capacity_remain / pool.capacity;
            score += capacityRatio * 30;
          }

          // Small penalty if capacity is 0, but don't make it impossible to select
          if (pool.capacity_remain <= 0) {
            score -= 50;
          }

          return {
            ...pool,
            score,
          };
        });

        // Sort by score descending
        scoredPools.sort((a, b) => b.score - a.score);

        // NEW: Always select best pool if it has any positive score (even with warnings)
        const bestPool = scoredPools[0];
        if (bestPool && bestPool.score > 0) {
          autoSelectedPools[scheduleKey] = bestPool._id;
        } else if (bestPool && pools.some((p) => p.capacity_remain > 0)) {
          // Fallback: if no pool with positive score, pick the one with most capacity
          const poolWithMostCapacity = [...pools].sort(
            (a, b) => b.capacity_remain - a.capacity_remain
          )[0];
          if (
            poolWithMostCapacity &&
            poolWithMostCapacity.capacity_remain > 0
          ) {
            autoSelectedPools[scheduleKey] = poolWithMostCapacity._id;
          }
        }
      });

      // Apply auto-selected pools
      setSelectedPools(autoSelectedPools);
      setAutoSelectedPools(autoSelectedPools); // Save initial auto-selections

      setCurrentStep(2);
    } catch (err: any) {
      console.error("Pool capacity calculation error:", err);
      setError(err.message || "Không thể tính toán sức chứa hồ bơi");
    } finally {
      setIsCalculatingCapacity(false);
    }
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Xếp lịch cho lớp có sẵn</DialogTitle>
          <DialogDescription>
            Chọn các lớp học và thiết lập thời gian để xếp lịch tự động
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

                {loading ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
                    <p className='text-muted-foreground'>
                      Đang tải danh sách lớp học...
                    </p>
                  </div>
                ) : availableClasses.length === 0 ? (
                  <div className='text-center py-12'>
                    <p className='text-muted-foreground'>
                      Không có lớp học nào để xếp lịch
                    </p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {availableClasses.map((classItem) => {
                      const isSelected = selectedClassIds.includes(
                        classItem._id
                      );
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
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleClassToggle(classItem._id)
                              }
                              disabled={isFullyScheduled}
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
                                      <div className='grid grid-cols-3 gap-2'>
                                        {allSlots.map((slot) => {
                                          const isSlotSelected = (
                                            classSelectedSlots[classItem._id] ||
                                            []
                                          ).includes(slot._id);
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
                                                "p-2 rounded-md border transition-all text-left",
                                                isSlotSelected
                                                  ? "border-primary bg-primary/5"
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
                                    )}
                                    {(classSelectedSlots[classItem._id] || [])
                                      .length > 0 && (
                                      <Alert>
                                        <AlertCircle className='h-4 w-4' />
                                        <AlertDescription className='text-xs'>
                                          Khung giờ tự động: {config.min_time}h
                                          - {config.max_time}h
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
                  </div>
                )}
              </div>
            </StepperStep>

            {/* Step 2: Preview Schedules - Summary View */}
            <StepperStep step={1}>
              <div className='space-y-4'>
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Đây là tổng quan lịch học được tạo tự động. Hồ bơi sẽ được
                    chọn ở bước tiếp theo.
                  </AlertDescription>
                </Alert>

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
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </StepperStep>

            {/* Step 3: Select Pools - Summary Style */}
            <StepperStep step={2}>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      Click vào nút "Chọn hồ" để chọn hồ bơi cho từng buổi học.
                    </AlertDescription>
                  </Alert>

                  <Alert
                    variant='destructive'
                    className='bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  >
                    <AlertCircle className='h-4 w-4 text-amber-600' />
                    <AlertDescription className='text-amber-800 dark:text-amber-200'>
                      <div className='font-medium mb-1'>Chú thích màu sắc:</div>
                      <ul className='text-xs space-y-1 ml-0'>
                        <li className='flex items-center gap-2'>
                          <Circle className='h-3 w-3 text-green-600 flex-shrink-0' />
                          <span>Xanh lá: Đã chọn hồ bơi</span>
                        </li>
                        <li className='flex items-center gap-2'>
                          <Circle className='h-3 w-3 text-amber-500 flex-shrink-0' />
                          <span>Vàng: Có cảnh báo (độ tuổi không khớp)</span>
                        </li>
                        <li className='flex items-center gap-2'>
                          <Circle className='h-3 w-3 text-red-600 flex-shrink-0' />
                          <span>
                            Đỏ: Có xung đột (Huấn luyện viên trùng lịch)
                          </span>
                        </li>
                        <li className='flex items-center gap-2'>
                          <Circle className='h-3 w-3 text-gray-600 flex-shrink-0' />
                          <span>Xám: Chưa chọn hồ bơi</span>
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>

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

                        // Count stats
                        const assignedCount = schedules.filter(
                          (_, idx) => selectedPools[`${classId}-${idx}`]
                        ).length;
                        const unassignedCount =
                          schedules.length - assignedCount;
                        const warningCount = schedules.filter((_, idx) => {
                          const scheduleKey = `${classId}-${idx}`;
                          const selectedPoolId = selectedPools[scheduleKey];
                          const selectedPool = poolCapacities[
                            scheduleKey
                          ]?.find((p) => p._id === selectedPoolId);
                          return (
                            selectedPool?.hasAgeWarning ||
                            selectedPool?.hasInstructorConflict
                          );
                        }).length;

                        // Generate summary: group by day of week and slot
                        const daySlotMap: { [dayName: string]: Set<string> } =
                          {};
                        schedules.forEach((schedule) => {
                          const date = new Date(schedule.date);
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
                                  {unassignedCount > 0 && (
                                    <Badge variant='destructive'>
                                      {unassignedCount} chưa chọn hồ
                                    </Badge>
                                  )}
                                  {warningCount > 0 && (
                                    <Badge
                                      variant='outline'
                                      className='border-amber-500 text-amber-600'
                                    >
                                      {warningCount} cảnh báo
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Summary */}
                            <div className='px-4 py-3 bg-muted/20 border-b'>
                              <div className='text-sm font-medium text-muted-foreground mb-2'>
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
                                      ({Array.from(daySlotMap[day]).join(", ")})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Schedule List */}
                            <div className='p-4'>
                              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'>
                                {schedules.map((schedule, idx) => {
                                  const scheduleKey = `${classId}-${idx}`;
                                  const selectedPoolId =
                                    selectedPools[scheduleKey];
                                  const selectedPool = poolCapacities[
                                    scheduleKey
                                  ]?.find((p) => p._id === selectedPoolId);
                                  const availablePools =
                                    poolCapacities[scheduleKey] || [];
                                  const hasWarning =
                                    selectedPool?.hasAgeWarning;
                                  const hasConflict =
                                    selectedPool?.hasInstructorConflict;
                                  const isOpen =
                                    openPoolPopover === scheduleKey;

                                  // Determine card color
                                  let cardBorderColor = "border-border";
                                  let cardBgColor = "bg-muted/30";
                                  if (selectedPoolId) {
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
                                      {/* Date & Slot */}
                                      <div className='flex items-center justify-between mb-2'>
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
                                        <Badge
                                          variant='outline'
                                          className='text-xs'
                                        >
                                          {schedule.slot?.title}
                                        </Badge>
                                      </div>

                                      {/* Instructor */}
                                      <div className='text-xs text-muted-foreground mb-2'>
                                        HLV:{" "}
                                        {schedule.instructor?.username || "N/A"}
                                      </div>

                                      {/* Pool Selection */}
                                      <Popover
                                        open={isOpen}
                                        onOpenChange={(open) => {
                                          if (open) {
                                            setOpenPoolPopover(scheduleKey);
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
                                          >
                                            <span className='truncate'>
                                              {selectedPool
                                                ? `${selectedPool.title}`
                                                : "Chọn hồ bơi..."}
                                            </span>
                                            <Edit2 className='h-3 w-3 ml-1 flex-shrink-0' />
                                          </Button>
                                        </PopoverTrigger>
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
                                          <div className='max-h-[250px] overflow-y-auto p-2'>
                                            {availablePools.length === 0 ? (
                                              <div className='text-center py-4 text-sm text-muted-foreground'>
                                                Không có hồ bơi khả dụng
                                              </div>
                                            ) : (
                                              <div className='space-y-1.5'>
                                                {availablePools.map((pool) => {
                                                  const isPoolSelected =
                                                    selectedPoolId === pool._id;
                                                  const poolHasWarnings =
                                                    pool.hasAgeWarning ||
                                                    pool.hasInstructorConflict;
                                                  const noCapacity =
                                                    pool.capacity_remain <= 0;

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
                                                      disabled={noCapacity}
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
                                                            {pool.title}
                                                            {isPoolSelected && (
                                                              <CheckCircle2 className='h-3 w-3 text-primary' />
                                                            )}
                                                          </div>
                                                          <div className='text-muted-foreground mt-0.5'>
                                                            Sức chứa:{" "}
                                                            {pool.capacity}
                                                          </div>
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
                                                        pool.hasInstructorConflict) && (
                                                        <div className='mt-1.5 pt-1.5 border-t space-y-0.5'>
                                                          {pool.hasAgeWarning && (
                                                            <div className='text-amber-600 flex items-center gap-1'>
                                                              <AlertCircle className='h-3 w-3' />
                                                              Độ tuổi không khớp
                                                            </div>
                                                          )}
                                                          {pool.hasInstructorConflict && (
                                                            <div className='text-red-600 flex items-center gap-1'>
                                                              <AlertCircle className='h-3 w-3' />
                                                              Huấn luyện viên
                                                              trùng lịch
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
                                        </PopoverContent>
                                      </Popover>

                                      {/* Warnings */}
                                      {selectedPoolId &&
                                        (hasWarning || hasConflict) && (
                                          <div className='mt-2 text-xs space-y-0.5'>
                                            {hasWarning && (
                                              <div className='text-amber-600 flex items-center gap-1'>
                                                <AlertCircle className='h-3 w-3' />
                                                Độ tuổi không khớp
                                              </div>
                                            )}
                                            {hasConflict && (
                                              <div className='text-red-600 flex items-center gap-1'>
                                                <AlertCircle className='h-3 w-3' />
                                                HLV trùng lịch
                                              </div>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  );
                                })}
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

            {/* Step 4: Confirm - Table View */}
            <StepperStep step={3}>
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
            <Button
              onClick={() => {
                if (currentStep === 0) {
                  handleGeneratePreview();
                } else if (currentStep === 1) {
                  handleCalculatePoolCapacity();
                } else if (currentStep === 2) {
                  setCurrentStep((prev) => prev + 1);
                } else if (currentStep === 3) {
                  // Final submit - create schedules
                  handleCreateSchedules();
                }
              }}
              disabled={
                (currentStep === 0 && selectedClassIds.length === 0) ||
                (currentStep === 1 &&
                  Object.keys(previewSchedules).length === 0) ||
                (currentStep === 2 &&
                  Object.entries(previewSchedules).some(
                    ([classId, schedules]) =>
                      schedules.some(
                        (_, idx) => !selectedPools[`${classId}-${idx}`]
                      )
                  )) ||
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
                "Xem trước lịch"
              ) : currentStep === 1 ? (
                "Chọn hồ bơi"
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
