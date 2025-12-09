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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Stepper,
  StepperContent,
  StepperFooter,
  StepperHeader,
  StepperStep,
} from "@/components/ui/stepper";

interface Course {
  _id: string;
  title: string;
  session_number?: number;
  capacity?: number;
  category?: Array<{
    _id: string;
    title: string;
  }>;
  type_of_age?: string[];
}

interface Instructor {
  _id: string;
  username: string;
}

interface InstructorSpecialist {
  _id: string;
  user: string;
  category: string[];
  age_types: string[];
}

interface AgeRule {
  _id: string;
  title: string;
  min_age?: number;
  max_age?: number;
}

interface SlotDetail {
  _id: string;
  title: string;
  start_time: number;
  start_minute: number;
  end_time: number;
  end_minute: number;
}

interface NewClassItem {
  id: string; // Temporary ID for UI
  name: string;
  instructor: string;
  show_on_regist_course: boolean;
}

interface ValidationWarning {
  classId: string;
  type: "category" | "age_type" | "missing_specialist" | "schedule_conflict";
  severity: "error" | "warning" | "info";
  message: string;
  details?: string;
}

interface CreateClassesBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableCourses: Course[];
  availableInstructors: Instructor[];
  loadingCourses: boolean;
  loadingInstructors: boolean;
  onCreateComplete: (insertedIds: string[], scheduleConfig?: any) => void;
}

const STEPS = [
  {
    id: "course-config",
    title: "Chọn khóa học",
    description: "Chọn khóa học và cấu hình thời gian",
  },
  {
    id: "generate-classes",
    title: "Tạo lớp học",
    description: "Tạo và chọn giáo viên",
  },
  {
    id: "preview",
    title: "Xem trước",
    description: "Kiểm tra validation",
  },
  {
    id: "create",
    title: "Tạo lớp",
    description: "Tạo các lớp học",
  },
  {
    id: "complete",
    title: "Hoàn tất",
    description: "Xếp lịch (tùy chọn)",
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
 * to Backend array_number_in_week based on TODAY's day of week
 * Formula: diff = jsDay - todayDay; if (diff < 0) diff += 7;
 */
const convertJsDayToBackendDay = (jsDay: number): number => {
  const today = new Date();
  const todayDay = today.getDay();
  let diff = jsDay - todayDay;
  if (diff < 0) {
    diff += 7;
  }
  return diff;
};

export function CreateClassesBatchModal({
  open,
  onOpenChange,
  availableCourses,
  availableInstructors,
  loadingCourses,
  loadingInstructors,
  onCreateComplete,
}: CreateClassesBatchModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const { toast } = useToast();

  // Step 1: Course & Config
  const [selectedCourseId, setSelectedCourseId] = React.useState("");
  const [selectedSlotIds, setSelectedSlotIds] = React.useState<string[]>([]);
  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);
  const [classCount, setClassCount] = React.useState(1);
  const [allSlots, setAllSlots] = React.useState<SlotDetail[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  // Step 2: Generated Classes
  const [newClasses, setNewClasses] = React.useState<NewClassItem[]>([]);

  // Step 3: Validation
  const [validationWarnings, setValidationWarnings] = React.useState<
    ValidationWarning[]
  >([]);
  const [instructorSpecialists, setInstructorSpecialists] = React.useState<
    Map<string, InstructorSpecialist>
  >(new Map());
  const [ageRules, setAgeRules] = React.useState<AgeRule[]>([]);
  const [isValidating, setIsValidating] = React.useState(false);

  // Step 4: Creating
  const [isCreating, setIsCreating] = React.useState(false);
  const [createdClassIds, setCreatedClassIds] = React.useState<string[]>([]);

  // Step 5: Complete - Fetched class details
  const [fetchedClasses, setFetchedClasses] = React.useState<any[]>([]);
  const [loadingClasses, setLoadingClasses] = React.useState(false);

  // Reset when modal closes
  React.useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setSelectedCourseId("");
      setSelectedSlotIds([]);
      setSelectedDays([]);
      setClassCount(1);
      setNewClasses([]);
      setValidationWarnings([]);
      setCreatedClassIds([]);
    }
  }, [open]);

  // Load slots when modal opens
  React.useEffect(() => {
    if (open && allSlots.length === 0) {
      loadSlots();
    }
  }, [open]);

  // Load age rules when modal opens
  React.useEffect(() => {
    if (open && ageRules.length === 0) {
      loadAgeRules();
    }
  }, [open]);

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

  const loadAgeRules = async () => {
    try {
      const { fetchAgeRules } = await import("@/api/manager/age-types");
      const rules = await fetchAgeRules();
      setAgeRules(rules);
    } catch (error: any) {
      console.error("Failed to load age rules:", error);
    }
  };

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId)
        ? prev.filter((id) => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleDayToggle = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const calculateMinMaxTime = () => {
    if (selectedSlotIds.length === 0) return { min_time: 7, max_time: 18 };

    const selectedSlots = allSlots.filter((slot) =>
      selectedSlotIds.includes(slot._id)
    );

    const minTime = Math.min(...selectedSlots.map((s) => s.start_time));
    const maxTime = Math.max(...selectedSlots.map((s) => s.end_time));

    return { min_time: minTime, max_time: maxTime };
  };

  const generateClassName = (course: Course, index: number): string => {
    const slotTitles = allSlots
      .filter((slot) => selectedSlotIds.includes(slot._id))
      .map((slot) => {
        // Extract slot number from title (e.g., "Slot 1" -> "S1")
        const match = slot.title.match(/\d+/);
        return match ? `S${match[0]}` : slot.title.substring(0, 2);
      })
      .join(",");

    const dayLabels = selectedDays
      .map((day) => DAY_NAMES.find((d) => d.value === day)?.label)
      .join(",");

    return `${course.title} - ${slotTitles} - ${dayLabels} - Lớp ${index + 1}`;
  };

  const handleGenerateClasses = () => {
    const course = availableCourses.find((c) => c._id === selectedCourseId);
    if (!course) return;

    const classes: NewClassItem[] = [];
    for (let i = 0; i < classCount; i++) {
      classes.push({
        id: `temp-${Date.now()}-${i}`,
        name: generateClassName(course, i),
        instructor: "",
        show_on_regist_course: false,
      });
    }

    setNewClasses(classes);
    setCurrentStep(1);
  };

  const handleUpdateClass = (
    id: string,
    field: keyof NewClassItem,
    value: any
  ) => {
    setNewClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleRemoveClass = (id: string) => {
    setNewClasses((prev) => prev.filter((c) => c.id !== id));
    setValidationWarnings((prev) => prev.filter((w) => w.classId !== id));
  };

  const handleAddClass = () => {
    const course = availableCourses.find((c) => c._id === selectedCourseId);
    if (!course) return;

    const newClass: NewClassItem = {
      id: `temp-${Date.now()}`,
      name: generateClassName(course, newClasses.length),
      instructor: "",
      show_on_regist_course: false,
    };

    setNewClasses((prev) => [...prev, newClass]);
  };

  const validateClasses = async () => {
    setIsValidating(true);
    setValidationWarnings([]);

    try {
      const { fetchInstructorSpecialist } = await import(
        "@/api/manager/instructors-api"
      );
      const { fetchDateRangeSchedule } = await import(
        "@/api/manager/schedule-api"
      );
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      const course = availableCourses.find((c) => c._id === selectedCourseId);
      if (!course) return;

      // Get unique instructor IDs
      const instructorIds = [
        ...new Set(newClasses.map((c) => c.instructor).filter(Boolean)),
      ];

      // Fetch all instructor specialists
      const specialistsResponse = await fetchInstructorSpecialist({
        searchParams: {
          "search[user._id:in]": instructorIds.join(","),
        },
        tenantId,
        token,
      });

      const specialistsMap = new Map(
        specialistsResponse.map((spec) => {
          const userId =
            typeof spec.user === "string" ? spec.user : spec.user._id;
          return [userId, spec];
        })
      );
      setInstructorSpecialists(specialistsMap);

      // Calculate date range for schedule conflict check
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setMonth(futureDate.getMonth() + 3); // Check 3 months ahead

      // Fetch existing schedules for conflict detection
      const existingSchedules = await fetchDateRangeSchedule(
        today,
        futureDate,
        tenantId,
        token
      );

      // Validate each class
      const warnings: ValidationWarning[] = [];

      newClasses.forEach((classItem) => {
        if (!classItem.instructor) return;

        const specialist = specialistsMap.get(classItem.instructor);

        // Validation 1: Missing specialist
        if (!specialist) {
          warnings.push({
            classId: classItem.id,
            type: "missing_specialist",
            severity: "warning",
            message: "Giáo viên chưa có thông tin chuyên môn",
            details: "Cần cập nhật category và age_types cho giáo viên này",
          });
          return;
        }

        // Parse specialist data (handle both nested objects and ID arrays)
        const specialistCategories = Array.isArray(specialist.category)
          ? specialist.category
          : [];
        const specialistAgeTypes = Array.isArray(specialist.age_types)
          ? specialist.age_types
          : [];

        // Get category IDs and titles from specialist
        const specialistCategoryIds = specialistCategories.map((cat: any) =>
          typeof cat === "string" ? cat : cat._id
        );
        const specialistCategoryTitles = specialistCategories
          .map((cat: any) => (typeof cat === "object" ? cat.title : null))
          .filter(Boolean);

        // Get age type IDs and titles from specialist
        const specialistAgeTypeIds = specialistAgeTypes.map((age: any) =>
          typeof age === "string" ? age : age._id
        );
        const specialistAgeTypeTitles = specialistAgeTypes
          .map((age: any) => (typeof age === "object" ? age.title : null))
          .filter(Boolean);

        // Validation 2: Category matching
        const courseCategories = course.category?.map((cat) => cat._id) || [];
        const courseCategoryTitles =
          course.category?.map((cat) => cat.title) || [];

        const hasMatchingCategory =
          courseCategories.length === 0 ||
          specialistCategoryIds.length === 0 ||
          courseCategories.some((catId) =>
            specialistCategoryIds.includes(catId)
          );

        if (!hasMatchingCategory) {
          const courseNames = courseCategoryTitles.join(", ") || "N/A";
          const instructorNames =
            specialistCategoryTitles.length > 0
              ? specialistCategoryTitles.join(", ")
              : "Chưa có";
          warnings.push({
            classId: classItem.id,
            type: "category",
            severity: "warning",
            message: "Category không khớp",
            details: `Khóa học: [${courseNames}] ≠ Giáo viên: [${instructorNames}]`,
          });
        }

        // Validation 3: Age type matching
        const courseAgeTypes = course.type_of_age || [];
        const courseAgeNames = courseAgeTypes
          .map((ageId) => {
            const ageRule = ageRules.find((rule) => rule._id === ageId);
            return ageRule?.title || null;
          })
          .filter(Boolean);

        const hasMatchingAge =
          courseAgeTypes.length === 0 ||
          specialistAgeTypeIds.length === 0 ||
          courseAgeTypes.some((ageId) => specialistAgeTypeIds.includes(ageId));

        if (!hasMatchingAge) {
          const courseAgeDisplay = courseAgeNames.join(", ") || "N/A";
          const instructorAgeDisplay =
            specialistAgeTypeTitles.length > 0
              ? specialistAgeTypeTitles.join(", ")
              : "Chưa có";
          warnings.push({
            classId: classItem.id,
            type: "age_type",
            severity: "warning",
            message: "Độ tuổi không khớp",
            details: `Khóa học: [${courseAgeDisplay}] ≠ Giáo viên: [${instructorAgeDisplay}]`,
          });
        }

        // Validation 4: Schedule conflict
        const selectedSlots = allSlots.filter((slot) =>
          selectedSlotIds.includes(slot._id)
        );

        selectedSlots.forEach((slot) => {
          selectedDays.forEach((day) => {
            // Check if instructor has existing schedule at this slot/day
            const hasConflict = existingSchedules.events.some((event: any) => {
              // Convert event day to JS day for comparison
              const eventDayOfWeek = new Date(event.date).getDay();
              return (
                event.instructor?._id === classItem.instructor &&
                event.slot?._id === slot._id &&
                eventDayOfWeek === day
              );
            });

            if (hasConflict) {
              const dayName = DAY_NAMES.find((d) => d.value === day)?.label;
              warnings.push({
                classId: classItem.id,
                type: "schedule_conflict",
                severity: "warning",
                message: "Giáo viên có lịch trùng",
                details: `${dayName} - ${slot.title}: Giáo viên đã có lịch dạy vào thời gian này`,
              });
            }
          });
        });
      });

      setValidationWarnings(warnings);
      setCurrentStep(2);
    } catch (error: any) {
      console.error("Validation error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể kiểm tra thông tin giáo viên",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateClasses = async () => {
    setIsCreating(true);
    try {
      const { createClass } = await import("@/api/manager/class-api");
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Prepare request data (remove temporary id)
      const classesToCreate = newClasses.map(({ id, ...rest }) => ({
        course: selectedCourseId,
        ...rest,
      }));

      // Call API to create classes
      const response = await createClass(classesToCreate, tenantId, token);

      // Extract insertedIds from response
      // Handle different response structures:
      // - Single class: data[0][0][0].insertedId
      // - Multiple classes: data[0][0][0].insertedIds or data[N][0][0].insertedId
      let insertedIds: string[] = [];

      if (response.data && Array.isArray(response.data)) {
        // Check if it's array of arrays (multiple classes)
        if (response.data.length > 1) {
          // Multiple classes: each element is [[[{insertedId}]]]
          insertedIds = response.data
            .map((item: any) => item?.[0]?.[0]?.insertedId)
            .filter(Boolean);
        } else if (response.data[0]?.[0]?.[0]) {
          // Single or batch response
          const firstItem = response.data[0][0][0];
          if (firstItem.insertedIds && Array.isArray(firstItem.insertedIds)) {
            // Batch create with insertedIds array
            insertedIds = firstItem.insertedIds;
          } else if (firstItem.insertedId) {
            // Single create with insertedId
            insertedIds = [firstItem.insertedId];
          }
        }
      }

      if (insertedIds.length === 0) {
        throw new Error("Không nhận được ID các lớp học vừa tạo");
      }

      setCreatedClassIds(insertedIds);

      toast({
        title: "Thành công",
        description: `Đã tạo ${insertedIds.length} lớp học thành công`,
      });

      // Move to Step 5 (Complete) to fetch and display created classes
      setCurrentStep(4);
    } catch (error: any) {
      console.error("Create classes error:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error?.message || "Không thể tạo lớp học. Vui lòng thử lại",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Fetch created classes by IDs for Step 5
  const fetchCreatedClasses = async () => {
    if (createdClassIds.length === 0) return;

    setLoadingClasses(true);
    try {
      const { fetchClassesByIds } = await import("@/api/manager/class-api");
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      const classes = await fetchClassesByIds(createdClassIds, tenantId, token);
      setFetchedClasses(classes);
    } catch (error: any) {
      console.error("Failed to fetch created classes:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải thông tin các lớp vừa tạo",
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  // Fetch classes when entering Step 5
  React.useEffect(() => {
    if (
      currentStep === 4 &&
      createdClassIds.length > 0 &&
      fetchedClasses.length === 0
    ) {
      fetchCreatedClasses();
    }
  }, [currentStep, createdClassIds]);

  const handleContinueToSchedule = () => {
    const { min_time, max_time } = calculateMinMaxTime();
    const scheduleConfig = {
      min_time,
      max_time,
      array_number_in_week: selectedDays.map(convertJsDayToBackendDay),
      session_in_week: selectedDays.length,
      selectedSlotIds: selectedSlotIds, // Pass selected slot IDs for pre-filling
      selectedDays: selectedDays, // Pass selected days (JS days) for pre-filling
    };

    onCreateComplete(createdClassIds, scheduleConfig);
    onOpenChange(false);
  };

  const handleFinish = () => {
    onCreateComplete(createdClassIds);
    onOpenChange(false);
  };

  const getClassWarnings = (classId: string) => {
    return validationWarnings.filter((w) => w.classId === classId);
  };

  const selectedCourse = availableCourses.find(
    (c) => c._id === selectedCourseId
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Tạo lớp học hàng loạt</DialogTitle>
          <DialogDescription>
            Tạo nhiều lớp học cùng lúc với validation tự động
          </DialogDescription>
        </DialogHeader>

        <Stepper
          steps={STEPS}
          currentStep={currentStep}
        >
          <StepperHeader className='mb-6' />
          <StepperContent>
            {/* Step 1: Course & Config */}
            <StepperStep step={0}>
              <div className='space-y-6'>
                {/* Course Selection */}
                <div className='space-y-2'>
                  <Label>Chọn khóa học *</Label>
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                    disabled={loadingCourses}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn khóa học...' />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCourses ? (
                        <div className='p-2 text-sm text-muted-foreground'>
                          Đang tải...
                        </div>
                      ) : (
                        availableCourses.map((course) => (
                          <SelectItem
                            key={course._id}
                            value={course._id}
                          >
                            {course.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedCourse && (
                    <div className='text-sm text-muted-foreground space-y-1 mt-2'>
                      <div>
                        Số buổi học: {selectedCourse.session_number || "N/A"}
                      </div>
                      <div>
                        Sức chứa: {selectedCourse.capacity || "N/A"} học viên
                      </div>
                    </div>
                  )}
                </div>

                {/* Slot Selection */}
                <div className='space-y-2'>
                  <Label>Chọn ca học *</Label>
                  {loadingSlots ? (
                    <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang tải ca học...
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                      {allSlots.map((slot) => {
                        const isSelected = selectedSlotIds.includes(slot._id);
                        const formatTime = (hour: number, minute: number) =>
                          `${hour.toString().padStart(2, "0")}:${minute
                            .toString()
                            .padStart(2, "0")}`;

                        return (
                          <button
                            key={slot._id}
                            type='button'
                            onClick={() => handleSlotToggle(slot._id)}
                            className={cn(
                              "p-3 rounded-md border transition-all text-left",
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            <div className='flex items-start justify-between'>
                              <div>
                                <div className='font-medium text-sm'>
                                  {slot.title}
                                </div>
                                <div className='text-xs text-muted-foreground mt-1'>
                                  {formatTime(
                                    slot.start_time,
                                    slot.start_minute
                                  )}{" "}
                                  - {formatTime(slot.end_time, slot.end_minute)}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className='h-4 w-4 text-primary flex-shrink-0' />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {selectedSlotIds.length > 0 && (
                    <Alert>
                      <Info className='h-4 w-4' />
                      <AlertDescription className='text-xs'>
                        Đã chọn {selectedSlotIds.length} ca học. Khung giờ:{" "}
                        {calculateMinMaxTime().min_time}h -{" "}
                        {calculateMinMaxTime().max_time}h
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Day Selection */}
                <div className='space-y-2'>
                  <Label>Chọn ngày học trong tuần *</Label>
                  <div className='flex gap-2'>
                    {DAY_NAMES.map((day) => (
                      <Button
                        key={day.value}
                        type='button'
                        variant={
                          selectedDays.includes(day.value)
                            ? "default"
                            : "outline"
                        }
                        size='sm'
                        onClick={() => handleDayToggle(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Class Count */}
                <div className='space-y-2'>
                  <Label>Số lượng lớp *</Label>
                  <Input
                    type='number'
                    min={1}
                    max={10}
                    value={classCount}
                    onChange={(e) =>
                      setClassCount(parseInt(e.target.value) || 1)
                    }
                  />
                </div>
              </div>
            </StepperStep>

            {/* Step 2: Generate Classes & Select Instructors */}
            <StepperStep step={1}>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <div>
                    <h3 className='font-medium'>Danh sách lớp học</h3>
                    <p className='text-sm text-muted-foreground'>
                      Chọn giáo viên cho từng lớp học
                    </p>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleAddClass}
                    className='gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    Thêm lớp
                  </Button>
                </div>

                {newClasses.length === 0 ? (
                  <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription>
                      Chưa có lớp học nào. Nhấn "Thêm lớp" để bắt đầu.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className='border rounded-lg overflow-hidden'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className='w-[50px]'>#</TableHead>
                          <TableHead>Tên lớp</TableHead>
                          <TableHead>Giáo viên</TableHead>
                          <TableHead className='w-[180px]'>
                            Hiển thị đăng ký
                          </TableHead>
                          <TableHead className='w-[80px]'></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newClasses.map((classItem, index) => (
                          <TableRow key={classItem.id}>
                            <TableCell className='font-medium'>
                              {index + 1}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={classItem.name}
                                onChange={(e) =>
                                  handleUpdateClass(
                                    classItem.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder='Tên lớp học...'
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={classItem.instructor}
                                onValueChange={(value) =>
                                  handleUpdateClass(
                                    classItem.id,
                                    "instructor",
                                    value
                                  )
                                }
                                disabled={loadingInstructors}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder='Chọn giáo viên...' />
                                </SelectTrigger>
                                <SelectContent>
                                  {loadingInstructors ? (
                                    <div className='p-2 text-sm text-muted-foreground'>
                                      Đang tải...
                                    </div>
                                  ) : (
                                    availableInstructors.map((instructor) => (
                                      <SelectItem
                                        key={instructor._id}
                                        value={instructor._id}
                                      >
                                        {instructor.username}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={classItem.show_on_regist_course.toString()}
                                onValueChange={(value) =>
                                  handleUpdateClass(
                                    classItem.id,
                                    "show_on_regist_course",
                                    value === "true"
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value='true'>Hiển thị</SelectItem>
                                  <SelectItem value='false'>Ẩn</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleRemoveClass(classItem.id)}
                              >
                                <Trash2 className='h-4 w-4 text-red-500' />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </StepperStep>

            {/* Step 3: Preview & Validation */}
            <StepperStep step={2}>
              <div className='space-y-4'>
                <Alert>
                  <Info className='h-4 w-4' />
                  <AlertDescription>
                    Kiểm tra thông tin giáo viên và validation. Các cảnh báo
                    không chặn việc tạo lớp.
                  </AlertDescription>
                </Alert>

                {validationWarnings.length > 0 && (
                  <Alert
                    variant='destructive'
                    className='bg-amber-50 dark:bg-amber-950/20 border-amber-200'
                  >
                    <AlertTriangle className='h-4 w-4 text-amber-600' />
                    <AlertDescription className='text-amber-800 dark:text-amber-200'>
                      <div className='font-medium mb-1'>
                        Có {validationWarnings.length} cảnh báo
                      </div>
                      <div className='text-xs'>
                        Vui lòng xem lại thông tin bên dưới. Bạn vẫn có thể tiếp
                        tục tạo lớp.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className='space-y-3'>
                  {newClasses.map((classItem, index) => {
                    const warnings = getClassWarnings(classItem.id);
                    const instructor = availableInstructors.find(
                      (i) => i._id === classItem.instructor
                    );
                    const specialist = instructorSpecialists.get(
                      classItem.instructor
                    );

                    return (
                      <div
                        key={classItem.id}
                        className={cn(
                          "border rounded-lg p-4",
                          warnings.length > 0 &&
                            "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10"
                        )}
                      >
                        <div className='flex items-start justify-between mb-3'>
                          <div>
                            <h4 className='font-medium'>
                              {index + 1}. {classItem.name}
                            </h4>
                            <p className='text-sm text-muted-foreground'>
                              Giáo viên: {instructor?.username || "N/A"}
                            </p>
                          </div>
                          {warnings.length > 0 && (
                            <Badge
                              variant='destructive'
                              className='bg-amber-500'
                            >
                              <AlertTriangle className='h-3 w-3 mr-1' />
                              {warnings.length} cảnh báo
                            </Badge>
                          )}
                        </div>

                        {specialist && (
                          <div className='bg-muted/50 rounded-md p-3 mb-3 text-sm'>
                            <div className='font-medium mb-2'>
                              Thông tin chuyên môn:
                            </div>
                            <div className='space-y-1 text-xs'>
                              <div>
                                <span className='text-muted-foreground'>
                                  Category:
                                </span>{" "}
                                {(() => {
                                  const categories = Array.isArray(
                                    specialist.category
                                  )
                                    ? specialist.category
                                    : [];
                                  const titles = categories
                                    .map((cat: any) =>
                                      typeof cat === "object" ? cat.title : null
                                    )
                                    .filter(Boolean);
                                  return titles.length > 0
                                    ? titles.join(", ")
                                    : "Chưa có";
                                })()}
                              </div>
                              <div>
                                <span className='text-muted-foreground'>
                                  Age types:
                                </span>{" "}
                                {(() => {
                                  const ageTypes = Array.isArray(
                                    specialist.age_types
                                  )
                                    ? specialist.age_types
                                    : [];
                                  const titles = ageTypes
                                    .map((age: any) =>
                                      typeof age === "object" ? age.title : null
                                    )
                                    .filter(Boolean);
                                  return titles.length > 0
                                    ? titles.join(", ")
                                    : "Chưa có";
                                })()}
                              </div>
                            </div>
                          </div>
                        )}

                        {warnings.length > 0 && (
                          <div className='space-y-2'>
                            {warnings.map((warning, idx) => (
                              <div
                                key={idx}
                                className='flex items-start gap-2 text-xs p-2 rounded-md bg-amber-100/50 dark:bg-amber-900/20'
                              >
                                <AlertCircle className='h-3 w-3 text-amber-600 mt-0.5 flex-shrink-0' />
                                <div>
                                  <div className='font-medium text-amber-900 dark:text-amber-100'>
                                    {warning.message}
                                  </div>
                                  {warning.details && (
                                    <div className='text-amber-700 dark:text-amber-300 mt-0.5'>
                                      {warning.details}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </StepperStep>

            {/* Step 4: Creating */}
            <StepperStep step={3}>
              <div className='space-y-4'>
                {isCreating ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <Loader2 className='h-12 w-12 animate-spin text-primary mb-4' />
                    <p className='text-lg font-medium'>Đang tạo lớp học...</p>
                    <p className='text-sm text-muted-foreground'>
                      Vui lòng đợi trong giây lát
                    </p>
                  </div>
                ) : createdClassIds.length > 0 ? (
                  <div className='text-center py-8'>
                    <div className='mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4'>
                      <CheckCircle2 className='h-8 w-8 text-green-600' />
                    </div>
                    <h3 className='text-lg font-medium mb-2'>
                      Tạo lớp học thành công!
                    </h3>
                    <p className='text-sm text-muted-foreground'>
                      Đã tạo {createdClassIds.length} lớp học mới
                    </p>
                  </div>
                ) : null}
              </div>
            </StepperStep>

            {/* Step 5: Complete */}
            <StepperStep step={4}>
              <div className='space-y-4'>
                <Alert>
                  <CheckCircle2 className='h-4 w-4' />
                  <AlertDescription>
                    Các lớp học đã được tạo thành công. Bạn có muốn tiếp tục xếp
                    lịch cho các lớp này không?
                  </AlertDescription>
                </Alert>

                {/* Display fetched classes */}
                {loadingClasses ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary mr-3' />
                    <span className='text-muted-foreground'>
                      Đang tải thông tin lớp học...
                    </span>
                  </div>
                ) : fetchedClasses.length > 0 ? (
                  <div className='border rounded-lg overflow-hidden'>
                    <div className='bg-muted/50 px-4 py-2 font-medium text-sm'>
                      Danh sách {fetchedClasses.length} lớp học vừa tạo:
                    </div>
                    <div className='divide-y'>
                      {fetchedClasses.map((classItem, index) => (
                        <div
                          key={classItem._id}
                          className='p-4'
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2 mb-2'>
                                <Badge variant='outline'>{index + 1}</Badge>
                                <h4 className='font-medium'>
                                  {classItem.name}
                                </h4>
                              </div>
                              <div className='space-y-1 text-sm text-muted-foreground'>
                                <div className='flex items-center gap-2'>
                                  <span className='font-medium'>Khóa học:</span>
                                  <span>
                                    {classItem.course?.title || "N/A"}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <span className='font-medium'>
                                    Giáo viên:
                                  </span>
                                  <span>
                                    {typeof classItem.instructor === "object"
                                      ? classItem.instructor?.username
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                  <span className='font-medium'>
                                    Hiển thị đăng ký:
                                  </span>
                                  <Badge
                                    variant={
                                      classItem.show_on_regist_course
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {classItem.show_on_regist_course
                                      ? "Có"
                                      : "Không"}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <CheckCircle2 className='h-5 w-5 text-green-600 flex-shrink-0' />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className='grid grid-cols-2 gap-4 py-4'>
                  <Button
                    variant='outline'
                    size='lg'
                    onClick={handleFinish}
                    className='h-24'
                  >
                    <div className='text-center'>
                      <div className='font-medium'>Hoàn tất</div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        Đóng và quay về trang lịch
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant='default'
                    size='lg'
                    onClick={handleContinueToSchedule}
                    className='h-24'
                  >
                    <div className='text-center'>
                      <div className='font-medium'>Tiếp tục xếp lịch</div>
                      <div className='text-xs opacity-90 mt-1'>
                        Chuyển sang bước xếp lịch tự động
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </StepperStep>
          </StepperContent>

          <StepperFooter>
            <Button
              variant='outline'
              onClick={() => {
                if (currentStep === 0) {
                  onOpenChange(false);
                } else if (currentStep === 4) {
                  // At final step, back button acts as finish
                  handleFinish();
                } else {
                  setCurrentStep((prev) => prev - 1);
                }
              }}
              disabled={isValidating || isCreating}
            >
              {currentStep === 0
                ? "Hủy"
                : currentStep === 4
                ? "Đóng"
                : "Quay lại"}
            </Button>
            {currentStep < 4 && (
              <Button
                onClick={() => {
                  if (currentStep === 0) {
                    handleGenerateClasses();
                  } else if (currentStep === 1) {
                    validateClasses();
                  } else if (currentStep === 2) {
                    handleCreateClasses();
                  }
                }}
                disabled={
                  (currentStep === 0 &&
                    (!selectedCourseId ||
                      selectedSlotIds.length === 0 ||
                      selectedDays.length === 0)) ||
                  (currentStep === 1 &&
                    (newClasses.length === 0 ||
                      newClasses.some((c) => !c.name || !c.instructor))) ||
                  isValidating ||
                  isCreating
                }
              >
                {isValidating || isCreating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {isValidating && "Đang kiểm tra..."}
                    {isCreating && "Đang tạo..."}
                  </>
                ) : currentStep === 0 ? (
                  "Tạo lớp học"
                ) : currentStep === 1 ? (
                  "Kiểm tra validation"
                ) : currentStep === 2 ? (
                  `Tạo ${newClasses.length} lớp học`
                ) : (
                  "Tiếp tục"
                )}
              </Button>
            )}
          </StepperFooter>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
