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
import { Loader2, AlertCircle, CheckCircle2, Edit2 } from "lucide-react";
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
            ? `${className}\\n${schedule.slot?.title || ""}\\n🏊 ${
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
            const isAvailable = capacityRemain >= classCapacity;

            // Validation 1: Check age type matching (type_of_age)
            const courseTypeOfAge = (classItem?.course as any)?.type_of_age;
            const poolTypeOfAge = (pool as any).type_of_age;

            // Extract IDs if they are objects
            const courseTypeId =
              typeof courseTypeOfAge === "object"
                ? courseTypeOfAge?._id
                : courseTypeOfAge;
            const poolTypeId =
              typeof poolTypeOfAge === "object"
                ? poolTypeOfAge?._id
                : poolTypeOfAge;
            const poolTypeTitle =
              typeof poolTypeOfAge === "object"
                ? poolTypeOfAge?.title?.toLowerCase()
                : poolTypeOfAge?.toLowerCase();

            const hasAgeWarning =
              courseTypeId &&
              poolTypeId &&
              courseTypeId !== poolTypeId &&
              poolTypeTitle !== "mixed" && // Assume 'mixed' pools can accept any age
              poolTypeTitle !== "hỗn hợp"; // Vietnamese for mixed

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
              isAvailable,
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

      // Step 5: Auto-select best pool for each schedule using scoring algorithm
      const autoSelectedPools: { [scheduleKey: string]: string } = {};

      Object.entries(capacityMap).forEach(([scheduleKey, pools]) => {
        // Score each pool
        const scoredPools = pools.map((pool) => {
          let score = 0;

          // Priority 1: Age type match (highest priority) - +100 points
          if (!pool.hasAgeWarning) {
            score += 100;
          }

          // Priority 2: No instructor conflict - +50 points
          if (!pool.hasInstructorConflict) {
            score += 50;
          }

          // Priority 3: Capacity availability - proportional score (0-50 points)
          if (pool.capacity > 0) {
            const capacityRatio = pool.capacity_remain / pool.capacity;
            score += capacityRatio * 50;
          }

          // Penalty: If capacity is not available, heavily penalize
          if (!pool.isAvailable) {
            score -= 200; // Heavy penalty
          }

          return {
            ...pool,
            score,
          };
        });

        // Sort by score descending
        scoredPools.sort((a, b) => b.score - a.score);

        // Select the pool with highest score (if score > 0, meaning some criteria met)
        const bestPool = scoredPools[0];
        if (bestPool && bestPool.score > 0) {
          autoSelectedPools[scheduleKey] = bestPool._id;
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
                                    <input
                                      type='date'
                                      value={config.start_date || ""}
                                      min={
                                        new Date(
                                          new Date().setDate(
                                            new Date().getDate() + 1
                                          )
                                        )
                                          .toISOString()
                                          .split("T")[0]
                                      }
                                      onChange={(e) =>
                                        handleStartDateChange(
                                          classItem._id,
                                          e.target.value
                                        )
                                      }
                                      className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary'
                                    />
                                    {config.start_date && (
                                      <p className='text-xs text-muted-foreground'>
                                        Ngày bắt đầu:{" "}
                                        {new Date(
                                          config.start_date
                                        ).toLocaleDateString("vi-VN", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </p>
                                    )}
                                  </div>

                                  <div className='space-y-2'>
                                    <Label>Chọn ca học *</Label>
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

            {/* Step 2: Preview Schedules */}
            <StepperStep step={1}>
              <div className='space-y-4'>
                <Alert>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>
                    Đây là lịch học được tạo tự động. Hồ bơi sẽ được chọn ở bước
                    tiếp theo.
                  </AlertDescription>
                </Alert>

                {Object.keys(previewSchedules).length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    Không có dữ liệu xem trước
                  </div>
                ) : (
                  <Accordion
                    type='multiple'
                    defaultValue={Object.keys(previewSchedules)}
                    className='space-y-2'
                  >
                    {Object.entries(previewSchedules).map(
                      ([classId, schedules]) => {
                        const classItem = availableClasses.find(
                          (c) => c._id === classId
                        );

                        if (!schedules || schedules.length === 0) {
                          return (
                            <AccordionItem
                              key={classId}
                              value={classId}
                              className='border rounded-lg'
                            >
                              <AccordionTrigger className='px-4 hover:no-underline'>
                                <div className='flex items-center justify-between w-full pr-4'>
                                  <div className='text-left'>
                                    <h4 className='font-medium'>
                                      {classItem?.name}
                                    </h4>
                                    <p className='text-sm text-muted-foreground'>
                                      Không thể tạo lịch
                                    </p>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className='px-4 pb-4'>
                                <p className='text-sm text-muted-foreground'>
                                  Không thể tạo lịch cho lớp này. Vui lòng thử
                                  lại với cấu hình khác.
                                </p>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        }

                        return (
                          <AccordionItem
                            key={classId}
                            value={classId}
                            className='border rounded-lg'
                          >
                            <AccordionTrigger className='px-4 hover:no-underline'>
                              <div className='flex items-center justify-between w-full pr-4'>
                                <div className='text-left'>
                                  <h4 className='font-medium'>
                                    {classItem?.name}
                                  </h4>
                                  <p className='text-sm text-muted-foreground'>
                                    Khóa học: {classItem?.course?.title}
                                  </p>
                                </div>
                                <Badge variant='secondary'>
                                  {schedules.length} buổi học
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className='px-4 pb-4'>
                              <div
                                className='calendar-compact overflow-x-auto'
                                style={{ height: "500px", maxWidth: "100%" }}
                              >
                                <div
                                  style={{ minWidth: "600px", height: "100%" }}
                                >
                                  <BigCalendar
                                    localizer={localizer}
                                    events={convertToCalendarEvents(
                                      classId,
                                      schedules,
                                      classItem?.name || ""
                                    )}
                                    startAccessor='start'
                                    endAccessor='end'
                                    style={{ height: "100%" }}
                                    views={["month"]}
                                    defaultView='month'
                                    messages={{
                                      next: "Sau",
                                      previous: "Trước",
                                      today: "Hôm nay",
                                      month: "Tháng",
                                      week: "Tuần",
                                      day: "Ngày",
                                      agenda: "Lịch trình",
                                      date: "Ngày",
                                      time: "Thời gian",
                                      event: "Sự kiện",
                                      noEventsInRange:
                                        "Không có buổi học nào trong khoảng thời gian này",
                                      showMore: (total) => `+${total} buổi học`,
                                    }}
                                    eventPropGetter={(event) => {
                                      // Color code events by class
                                      const colors = [
                                        "#3b82f6", // blue
                                        "#10b981", // green
                                        "#f59e0b", // amber
                                        "#ef4444", // red
                                        "#8b5cf6", // violet
                                        "#ec4899", // pink
                                      ];
                                      const classIndex = Object.keys(
                                        previewSchedules
                                      ).indexOf(event.resource.classId);
                                      const color =
                                        colors[classIndex % colors.length];

                                      return {
                                        style: {
                                          backgroundColor: color,
                                          borderColor: color,
                                          color: "white",
                                        },
                                      };
                                    }}
                                    tooltipAccessor={(event) =>
                                      `${event.resource.className}\nCa: ${event.resource.slotTitle}\nGiáo viên: ${event.resource.instructorName}`
                                    }
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                    )}
                  </Accordion>
                )}
              </div>
            </StepperStep>

            {/* Step 3: Select Pools */}
            <StepperStep step={2}>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      Click vào từng buổi học trên lịch để chọn hồ bơi phù hợp.
                    </AlertDescription>
                  </Alert>

                  <Alert
                    variant='destructive'
                    className='bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  >
                    <AlertCircle className='h-4 w-4 text-amber-600' />
                    <AlertDescription className='text-amber-800 dark:text-amber-200'>
                      <div className='font-medium mb-1'>Chú thích màu sắc:</div>
                      <ul className='text-xs space-y-0.5 ml-4 list-disc'>
                        <li>🔴 Màu đỏ: Có cảnh báo (độ tuổi/trùng lịch)</li>
                        <li>⚫ Màu xám: Chưa chọn hồ bơi</li>
                        <li>🔵 Màu xanh: Đã chọn hồ bơi</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>

                {Object.keys(previewSchedules).length === 0 ? (
                  <div className='text-center py-8 text-muted-foreground'>
                    Không có dữ liệu lịch học
                  </div>
                ) : (
                  <Accordion
                    type='multiple'
                    defaultValue={Object.keys(previewSchedules)}
                    className='space-y-2'
                  >
                    {Object.entries(previewSchedules).map(
                      ([classId, schedules]) => {
                        const classItem = availableClasses.find(
                          (c) => c._id === classId
                        );

                        // Count unassigned pools
                        const unassignedCount = schedules.filter(
                          (_, idx) => !selectedPools[`${classId}-${idx}`]
                        ).length;

                        // Create calendar events with pool info
                        const calendarEventsWithPool = schedules.map(
                          (schedule, idx) => {
                            const scheduleKey = `${classId}-${idx}`;
                            const selectedPoolId = selectedPools[scheduleKey];
                            const selectedPool = poolCapacities[
                              scheduleKey
                            ]?.find((p) => p._id === selectedPoolId);
                            const hasWarning =
                              selectedPool?.hasAgeWarning ||
                              selectedPool?.hasInstructorConflict;

                            const scheduleDate = new Date(schedule.date);
                            const startHour = schedule.slot?.start_time || 0;
                            const startMinute =
                              schedule.slot?.start_minute || 0;
                            const endHour = schedule.slot?.end_time || 0;
                            const endMinute = schedule.slot?.end_minute || 0;

                            const start = new Date(scheduleDate);
                            start.setHours(startHour, startMinute, 0, 0);

                            const end = new Date(scheduleDate);
                            end.setHours(endHour, endMinute, 0, 0);

                            return {
                              id: scheduleKey,
                              title: `${schedule.slot?.title || ""}`,
                              start,
                              end,
                              resource: {
                                classId,
                                className: classItem?.name || "",
                                slotTitle: schedule.slot?.title || "",
                                instructorName:
                                  schedule.instructor?.username || "",
                                scheduleIndex: idx,
                                scheduleKey,
                                poolId: selectedPoolId,
                                poolName: selectedPool?.title,
                                hasWarning,
                                schedule,
                              },
                            };
                          }
                        );

                        return (
                          <AccordionItem
                            key={classId}
                            value={classId}
                            className='border rounded-lg'
                          >
                            <AccordionTrigger className='px-4 hover:no-underline'>
                              <div className='flex items-center justify-between w-full pr-4'>
                                <div className='text-left'>
                                  <h4 className='font-medium'>
                                    {classItem?.name}
                                  </h4>
                                  <p className='text-sm text-muted-foreground'>
                                    {classItem?.course?.title}
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
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className='px-4 pb-4'>
                              <div
                                className='calendar-compact overflow-x-auto'
                                style={{ height: "500px", maxWidth: "100%" }}
                              >
                                <div
                                  style={{ minWidth: "600px", height: "100%" }}
                                >
                                  <BigCalendar
                                    localizer={localizer}
                                    events={calendarEventsWithPool}
                                    startAccessor='start'
                                    endAccessor='end'
                                    style={{ height: "100%" }}
                                    views={["month"]}
                                    defaultView='month'
                                    selectable={false}
                                    onSelectEvent={(event) => {
                                      setOpenPoolPopover(
                                        openPoolPopover ===
                                          event.resource.scheduleKey
                                          ? null
                                          : event.resource.scheduleKey
                                      );
                                      setSelectedScheduleKey(
                                        event.resource.scheduleKey
                                      );
                                    }}
                                    messages={{
                                      next: "Sau",
                                      previous: "Trước",
                                      today: "Hôm nay",
                                      month: "Tháng",
                                      noEventsInRange: "Không có buổi học nào",
                                      showMore: (total) => `+${total} buổi học`,
                                    }}
                                    eventPropGetter={(event) => {
                                      const hasWarning =
                                        event.resource.hasWarning;
                                      const hasPool = !!event.resource.poolId;
                                      let color = "#3b82f6"; // default blue

                                      if (hasWarning) {
                                        color = "#ef4444"; // red for warnings
                                      } else if (!hasPool) {
                                        color = "#6b7280"; // gray for unassigned
                                      } else {
                                        color = "#10b981"; // green for assigned
                                      }

                                      return {
                                        style: {
                                          backgroundColor: color,
                                          borderColor: color,
                                          color: "white",
                                          cursor: "pointer",
                                          opacity: hasPool ? 1 : 0.7,
                                        },
                                      };
                                    }}
                                    components={{
                                      event: ({ event }) => {
                                        const isOpen =
                                          openPoolPopover ===
                                          event.resource.scheduleKey;
                                        const availablePools =
                                          poolCapacities[
                                            event.resource.scheduleKey
                                          ] || [];

                                        return (
                                          <Popover
                                            open={isOpen}
                                            onOpenChange={(open) => {
                                              if (!open)
                                                setOpenPoolPopover(null);
                                            }}
                                          >
                                            <PopoverTrigger asChild>
                                              <div className='h-full px-1 text-xs cursor-pointer'>
                                                <div className='truncate font-medium'>
                                                  {event.title}
                                                </div>
                                                {event.resource.poolName && (
                                                  <div className='truncate text-[10px] opacity-90'>
                                                    🏊 {event.resource.poolName}
                                                  </div>
                                                )}
                                              </div>
                                            </PopoverTrigger>
                                            <PopoverContent
                                              className='w-72 p-0'
                                              align='start'
                                              side='right'
                                            >
                                              <div className='border-b p-3 bg-muted/50'>
                                                <h4 className='font-medium text-sm'>
                                                  {event.resource.className}
                                                </h4>
                                                <p className='text-xs text-muted-foreground mt-1'>
                                                  Ca: {event.resource.slotTitle}{" "}
                                                  • GV:{" "}
                                                  {
                                                    event.resource
                                                      .instructorName
                                                  }
                                                </p>
                                              </div>
                                              <div className='max-h-[250px] overflow-y-auto p-2'>
                                                {availablePools.length === 0 ? (
                                                  <div className='text-center py-4 text-sm text-muted-foreground'>
                                                    Không có hồ bơi khả dụng
                                                  </div>
                                                ) : (
                                                  <div className='space-y-1.5'>
                                                    {availablePools.map(
                                                      (pool) => {
                                                        const isSelected =
                                                          event.resource
                                                            .poolId ===
                                                          pool._id;
                                                        return (
                                                          <button
                                                            key={pool._id}
                                                            type='button'
                                                            onClick={() => {
                                                              setSelectedPools(
                                                                (prev) => ({
                                                                  ...prev,
                                                                  [event
                                                                    .resource
                                                                    .scheduleKey]:
                                                                    pool._id,
                                                                })
                                                              );
                                                              setOpenPoolPopover(
                                                                null
                                                              );
                                                            }}
                                                            disabled={
                                                              !pool.isAvailable
                                                            }
                                                            className={cn(
                                                              "w-full p-2 rounded border text-left text-xs transition-all",
                                                              isSelected
                                                                ? "border-primary bg-primary/10"
                                                                : "border-border hover:border-primary/50",
                                                              !pool.isAvailable &&
                                                                "opacity-50 cursor-not-allowed"
                                                            )}
                                                          >
                                                            <div className='flex justify-between items-start'>
                                                              <div className='flex-1'>
                                                                <div className='font-medium flex items-center gap-1'>
                                                                  {pool.title}
                                                                  {isSelected && (
                                                                    <CheckCircle2 className='h-3 w-3 text-primary' />
                                                                  )}
                                                                </div>
                                                                <div className='text-muted-foreground mt-0.5'>
                                                                  Sức chứa:{" "}
                                                                  {
                                                                    pool.capacity
                                                                  }
                                                                </div>
                                                              </div>
                                                              <div className='text-right'>
                                                                <div
                                                                  className={cn(
                                                                    "font-semibold",
                                                                    pool.isAvailable
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
                                                                    Độ tuổi
                                                                    không khớp
                                                                  </div>
                                                                )}
                                                                {pool.hasInstructorConflict && (
                                                                  <div className='text-red-600 flex items-center gap-1'>
                                                                    <AlertCircle className='h-3 w-3' />
                                                                    Giáo viên
                                                                    trùng lịch
                                                                  </div>
                                                                )}
                                                              </div>
                                                            )}
                                                          </button>
                                                        );
                                                      }
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        );
                                      },
                                    }}
                                    tooltipAccessor={(event) =>
                                      `${event.resource.className}\nCa: ${
                                        event.resource.slotTitle
                                      }\nGV: ${event.resource.instructorName}${
                                        event.resource.poolName
                                          ? `\nHồ: ${event.resource.poolName}`
                                          : ""
                                      }`
                                    }
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                    )}
                  </Accordion>
                )}
              </div>
            </StepperStep>

            {/* Step 4: Confirm */}
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
                  <Accordion
                    type='multiple'
                    defaultValue={Object.keys(previewSchedules)}
                    className='space-y-2'
                  >
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

                        // Create calendar events for read-only view
                        const calendarEventsReadOnly = schedules.map(
                          (schedule, idx) => {
                            const scheduleKey = `${classId}-${idx}`;
                            const selectedPoolId = selectedPools[scheduleKey];
                            const selectedPool = poolCapacities[
                              scheduleKey
                            ]?.find((p) => p._id === selectedPoolId);
                            const hasWarning =
                              selectedPool?.hasAgeWarning ||
                              selectedPool?.hasInstructorConflict;

                            const scheduleDate = new Date(schedule.date);
                            const startHour = schedule.slot?.start_time || 0;
                            const startMinute =
                              schedule.slot?.start_minute || 0;
                            const endHour = schedule.slot?.end_time || 0;
                            const endMinute = schedule.slot?.end_minute || 0;

                            const start = new Date(scheduleDate);
                            start.setHours(startHour, startMinute, 0, 0);

                            const end = new Date(scheduleDate);
                            end.setHours(endHour, endMinute, 0, 0);

                            return {
                              id: scheduleKey,
                              title: `${schedule.slot?.title || ""} • ${
                                selectedPool?.title || "N/A"
                              }`,
                              start,
                              end,
                              resource: {
                                classId,
                                className: classItem?.name || "",
                                slotTitle: schedule.slot?.title || "",
                                instructorName:
                                  schedule.instructor?.username || "",
                                poolName: selectedPool?.title || "N/A",
                                hasWarning,
                              },
                            };
                          }
                        );

                        return (
                          <AccordionItem
                            key={classId}
                            value={classId}
                            className='border rounded-lg'
                          >
                            <AccordionTrigger className='px-4 hover:no-underline'>
                              <div className='flex items-start justify-between w-full pr-4'>
                                <div className='text-left'>
                                  <h4 className='font-medium'>
                                    {classItem?.name}
                                  </h4>
                                  <p className='text-sm text-muted-foreground'>
                                    Khóa học: {classItem?.course?.title}
                                  </p>
                                </div>
                                <div className='text-right flex items-center gap-2'>
                                  <Badge variant='secondary'>
                                    {schedules.length} buổi học
                                  </Badge>
                                  {schedulesWithWarnings > 0 && (
                                    <Badge
                                      variant='destructive'
                                      className='ml-2 bg-amber-500'
                                    >
                                      <AlertCircle className='h-3 w-3 mr-1' />
                                      {schedulesWithWarnings} cảnh báo
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className='px-4 pb-4 space-y-3'>
                              <div
                                className='calendar-compact overflow-x-auto'
                                style={{ height: "450px", maxWidth: "100%" }}
                              >
                                <div
                                  style={{ minWidth: "600px", height: "100%" }}
                                >
                                  <BigCalendar
                                    localizer={localizer}
                                    events={calendarEventsReadOnly}
                                    startAccessor='start'
                                    endAccessor='end'
                                    style={{ height: "100%" }}
                                    views={["month"]}
                                    defaultView='month'
                                    selectable={false}
                                    messages={{
                                      next: "Sau",
                                      previous: "Trước",
                                      today: "Hôm nay",
                                      month: "Tháng",
                                      noEventsInRange: "Không có buổi học nào",
                                      showMore: (total) => `+${total} buổi học`,
                                    }}
                                    eventPropGetter={(event) => {
                                      const hasWarning =
                                        event.resource.hasWarning;
                                      let color = "#10b981"; // green

                                      if (hasWarning) {
                                        color = "#ef4444"; // red
                                      }

                                      return {
                                        style: {
                                          backgroundColor: color,
                                          borderColor: color,
                                          color: "white",
                                        },
                                      };
                                    }}
                                    tooltipAccessor={(event) =>
                                      `${event.resource.className}\nCa: ${event.resource.slotTitle}\nGV: ${event.resource.instructorName}\nHồ: ${event.resource.poolName}`
                                    }
                                  />
                                </div>
                              </div>

                              {schedulesWithWarnings > 0 && (
                                <Alert
                                  variant='destructive'
                                  className='bg-amber-50 dark:bg-amber-950/20 border-amber-200'
                                >
                                  <AlertCircle className='h-4 w-4 text-amber-600' />
                                  <AlertDescription className='text-xs text-amber-800 dark:text-amber-200'>
                                    Lớp này có {schedulesWithWarnings} buổi học
                                    có cảnh báo. Vui lòng kiểm tra lại ở bước
                                    trước.
                                  </AlertDescription>
                                </Alert>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      }
                    )}
                  </Accordion>
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
