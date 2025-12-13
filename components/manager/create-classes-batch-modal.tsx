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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Check,
  ChevronsUpDown,
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
  max_member?: number;
  category?: Array<{
    _id: string;
    title: string;
  }>;
  type?: string[];
  type_of_age?: Array<{
    _id: string;
    title: string;
    age_range?: number[];
  }>;
}

interface Instructor {
  _id: string;
  username: string;
}

interface InstructorSpecialist {
  _id: string;
  user: string | { _id: string; username: string };
  category: Array<{ _id: string; title: string }> | string[];
  age_types: Array<{ _id: string; title: string }> | string[];
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
    description: "Chọn khóa học và cấu hình thời gian học",
  },
  {
    id: "generate-validate",
    title: "Tạo & Kiểm tra",
    description: "Tạo lớp và kiểm tra hợp lệ huấn luyện viên",
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
  const [courseSearchKey, setCourseSearchKey] = React.useState("");
  const [openCoursePopover, setOpenCoursePopover] = React.useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = React.useState<string[]>([]);
  const [selectedDays, setSelectedDays] = React.useState<number[]>([]);
  const [classCount, setClassCount] = React.useState(1);
  const [allSlots, setAllSlots] = React.useState<SlotDetail[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  // API-based course search
  const [searchedCourses, setSearchedCourses] = React.useState<Course[]>([]);
  const [isSearchingCourses, setIsSearchingCourses] = React.useState(false);

  // Step 2: Generated Classes
  const [newClasses, setNewClasses] = React.useState<NewClassItem[]>([]);

  // Step 2 (merged): Validation
  const [validationWarnings, setValidationWarnings] = React.useState<
    ValidationWarning[]
  >([]);
  const [instructorSpecialists, setInstructorSpecialists] = React.useState<
    Map<string, InstructorSpecialist>
  >(new Map());
  const [allInstructorSpecialists, setAllInstructorSpecialists] =
    React.useState<InstructorSpecialist[]>([]);
  const [ageRules, setAgeRules] = React.useState<AgeRule[]>([]);
  const [ageRulesTitles, setAgeRulesTitles] = React.useState<
    Map<string, string>
  >(new Map());
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

  // Load all instructor specialists when modal opens
  React.useEffect(() => {
    if (
      open &&
      availableInstructors.length > 0 &&
      allInstructorSpecialists.length === 0
    ) {
      loadAllInstructorSpecialists();
    }
  }, [open, availableInstructors]);

  // Load all instructor specialists when modal opens
  React.useEffect(() => {
    if (
      open &&
      availableInstructors.length > 0 &&
      allInstructorSpecialists.length === 0
    ) {
      loadAllInstructorSpecialists();
    }
  }, [open, availableInstructors]);

  // Search courses by API when courseSearchKey changes
  React.useEffect(() => {
    const searchCourses = async () => {
      if (!courseSearchKey.trim()) {
        setSearchedCourses([]);
        return;
      }

      setIsSearchingCourses(true);
      try {
        const { fetchCourses } = await import("@/api/manager/courses-api");
        const { getSelectedTenant } = await import("@/utils/tenant-utils");
        const { getAuthToken } = await import("@/api/auth-utils");

        const tenantId = getSelectedTenant();
        const token = getAuthToken();

        if (!tenantId || !token) {
          throw new Error("Vui lòng đăng nhập lại");
        }

        const result = await fetchCourses({
          tenantId,
          token,
          searchKey: courseSearchKey,
          limit: 50, // Show more results when searching
        });

        setSearchedCourses(result.data);
      } catch (error: any) {
        console.error("Failed to search courses:", error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tìm kiếm khóa học",
        });
      } finally {
        setIsSearchingCourses(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchCourses, 300);
    return () => clearTimeout(timeoutId);
  }, [courseSearchKey, toast]);

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

  const loadAgeRules = async (searchParams?: Record<string, string>) => {
    try {
      const { fetchAgeRules } = await import("@/api/manager/age-types");
      const rules = await fetchAgeRules(searchParams); // Pass searchParams for filtering

      if (!searchParams) {
        // Only set state when loading all rules initially
        setAgeRules(rules);
        // Create mapping from ID to title for easy lookup
        const titlesMap = new Map(rules.map((rule) => [rule._id, rule.title]));
        setAgeRulesTitles(titlesMap);
      }

      return rules;
    } catch (error: any) {
      console.error("Failed to load age rules:", error);
      return [];
    }
  };

  const loadAllInstructorSpecialists = async () => {
    try {
      const { fetchInstructorSpecialist } = await import(
        "@/api/manager/instructors-api"
      );
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) return;

      const specialists = await fetchInstructorSpecialist({
        tenantId,
        token,
      });

      setAllInstructorSpecialists(specialists);

      // Build a map for quick lookup
      const newMap = new Map<string, InstructorSpecialist>();
      specialists.forEach((spec) => {
        const userId =
          typeof spec.user === "object" ? spec.user._id : spec.user;
        newMap.set(userId, spec);
      });
      setInstructorSpecialists(newMap);
    } catch (error: any) {
      console.error("Failed to load instructor specialists:", error);
    }
  };

  const handleSlotToggle = (slotId: string) => {
    setSelectedSlotIds((prev) => {
      if (prev.includes(slotId)) {
        // Removing slot
        return prev.filter((id) => id !== slotId);
      } else {
        // Adding slot - check limit
        if (prev.length >= 2) {
          toast({
            variant: "destructive",
            title: "Đã đạt giới hạn",
            description: "Chỉ được chọn tối đa 2 ca học",
          });
          return prev;
        }
        return [...prev, slotId];
      }
    });
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

    // Fix: max_time = end_time + (end_minute / 100), NOT / 60!
    // Example: 7h45 = 7 + (45/100) = 7.45
    const maxSlot = selectedSlots.reduce((max, slot) =>
      slot.end_time > max.end_time ||
      (slot.end_time === max.end_time && slot.end_minute > max.end_minute)
        ? slot
        : max
    );
    const maxTime = maxSlot.end_time + maxSlot.end_minute / 100;

    return { min_time: minTime, max_time: maxTime };
  };

  const generateClassName = (course: Course, classNumber: number): string => {
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

    return `${course.title} - ${slotTitles} - ${dayLabels} - Lớp ${classNumber}`;
  };

  const handleGenerateClasses = async () => {
    const course = availableCourses.find((c) => c._id === selectedCourseId);
    if (!course) return;

    // Fetch all existing classes to check for name conflicts
    try {
      const { fetchClasses } = await import("@/api/manager/class-api");
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Thiếu thông tin xác thực",
        });
        return;
      }

      // Fetch all classes (with high limit to get all)
      const { data: existingClasses } = await fetchClasses(
        tenantId,
        token,
        1,
        1000
      );

      // Extract existing class names
      const existingNames = new Set(existingClasses.map((c: any) => c.name));

      // Find a unique class number
      let classNumber = 1;
      let className = generateClassName(course, classNumber);

      while (existingNames.has(className)) {
        classNumber++;
        className = generateClassName(course, classNumber);
      }

      // Create only 1 class
      const newClass: NewClassItem = {
        id: `temp-${Date.now()}`,
        name: className,
        instructor: "",
        show_on_regist_course: false,
      };

      setNewClasses([newClass]);
      setCurrentStep(1);
    } catch (error: any) {
      console.error("Failed to validate class names:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể kiểm tra tên lớp học",
      });
    }
  };

  const handleUpdateClass = (
    id: string,
    field: keyof NewClassItem,
    value: any
  ) => {
    setNewClasses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );

    // Auto-validate when instructor changes
    if (field === "instructor" && value) {
      validateSingleClass(id, value);
    } else if (field === "instructor" && !value) {
      // Clear warnings for this class when instructor is removed
      setValidationWarnings((prev) => prev.filter((w) => w.classId !== id));
    }
  };

  const validateSingleClass = async (classId: string, instructorId: string) => {
    try {
      const { fetchInstructorSpecialist } = await import(
        "@/api/manager/instructors-api"
      );
      const { getSelectedTenant } = await import("@/utils/tenant-utils");
      const { getAuthToken } = await import("@/api/auth-utils");

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) return;

      const course = availableCourses.find((c) => c._id === selectedCourseId);
      if (!course) return;

      // Fetch specialist info for this instructor
      const specialistsResponse = await fetchInstructorSpecialist({
        searchParams: {
          "search[user._id:in]": instructorId,
        },
        tenantId,
        token,
      });

      const specialist = specialistsResponse[0];
      if (specialist) {
        setInstructorSpecialists((prev) => {
          const newMap = new Map(prev);
          newMap.set(instructorId, specialist);
          return newMap;
        });
      }

      // Clear previous warnings for this class
      setValidationWarnings((prev) =>
        prev.filter((w) => w.classId !== classId)
      );

      const warnings: ValidationWarning[] = [];

      // Missing specialist
      if (!specialist) {
        warnings.push({
          classId,
          type: "missing_specialist",
          severity: "warning",
          message: "Huấn luyện viên chưa có thông tin chuyên môn",
          details:
            "Cần cập nhật Danh mục và Loại độ tuổi cho Huấn luyện viên này",
        });
        setValidationWarnings((prev) => [...prev, ...warnings]);
        return;
      }

      // Parse specialist data
      const specialistCategories = Array.isArray(specialist.category)
        ? specialist.category.map((cat: any) =>
            typeof cat === "object" ? cat._id : cat
          )
        : [];
      const specialistAgeTypes = Array.isArray(specialist.age_types)
        ? specialist.age_types.map((age: any) =>
            typeof age === "object" ? age._id : age
          )
        : [];

      const courseCategories = course.category?.map((cat) => cat._id) || [];
      const courseAgeTypes = course.type_of_age?.map((age) => age._id) || [];

      // Validate category match
      const categoryMatch = courseCategories.some((catId) =>
        specialistCategories.includes(catId)
      );

      if (
        !categoryMatch &&
        courseCategories.length > 0 &&
        specialistCategories.length > 0
      ) {
        const courseCategoryTitles =
          course.category?.map((cat) => cat.title).join(", ") || "";
        const specialistCategoryTitles = specialist.category
          .map((cat: any) => (typeof cat === "object" ? cat.title : ""))
          .filter(Boolean)
          .join(", ");

        warnings.push({
          classId,
          type: "category",
          severity: "warning",
          message: "Danh mục không phù hợp",
          details: `Khóa học: [${courseCategoryTitles}] ≠ Huấn luyện viên: [${specialistCategoryTitles}]`,
        });
      }

      // Validate age_type match
      const ageTypeMatch = courseAgeTypes.some((ageId) =>
        specialistAgeTypes.includes(ageId)
      );

      if (
        !ageTypeMatch &&
        courseAgeTypes.length > 0 &&
        specialistAgeTypes.length > 0
      ) {
        // Use populated course.type_of_age objects for titles
        const courseAgeTypeTitles =
          course.type_of_age?.map((age) => age.title).join(", ") || "";
        const specialistAgeTypeTitles = specialist.age_types
          .map((age: any) => (typeof age === "object" ? age.title : ""))
          .filter(Boolean)
          .join(", ");

        warnings.push({
          classId,
          type: "age_type",
          severity: "warning",
          message: "Độ tuổi không phù hợp",
          details: `Khóa học: [${courseAgeTypeTitles}] ≠ Huấn luyện viên: [${specialistAgeTypeTitles}]`,
        });
      }

      setValidationWarnings((prev) => [...prev, ...warnings]);
    } catch (error) {
      console.error("Failed to validate instructor:", error);
    }
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
            message: "Huấn luyện viên chưa có thông tin chuyên môn",
            details:
              "Cần cập nhật category và age_types cho Huấn luyện viên này",
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
            details: `Khóa học: [${courseNames}] ≠ Huấn luyện viên: [${instructorNames}]`,
          });
        }

        // Validation 3: Age type matching
        const courseAgeTypes = course.type_of_age?.map((age) => age._id) || [];
        const courseAgeNames =
          course.type_of_age?.map((age) => age.title) || [];

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
            message: "Độ tuổi không phù hợp",
            details: `Khóa học: [${courseAgeDisplay}] ≠ Huấn luyện viên: [${instructorAgeDisplay}]`,
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
                message: "Huấn luyện viên có lịch trùng",
                details: `${dayName} - ${slot.title}: Huấn luyện viên đã có lịch dạy vào thời gian này`,
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
        description: "Không thể kiểm tra thông tin Huấn luyện viên",
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

      // Move to Step 3 (Complete) to show created classes and options
      setCurrentStep(2);
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

  // Fetch classes when entering Step 3 (Complete) - step index is 2 (3 steps total: 0,1,2)
  React.useEffect(() => {
    if (
      currentStep === 2 &&
      createdClassIds.length > 0 &&
      fetchedClasses.length === 0 &&
      !isCreating
    ) {
      fetchCreatedClasses();
    }
  }, [currentStep, createdClassIds, isCreating]);

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

  // Sort instructors by match score with course
  const getSortedInstructors = (): Instructor[] => {
    if (!selectedCourseId) return availableInstructors;

    const course = availableCourses.find((c) => c._id === selectedCourseId);
    if (!course) return availableInstructors;

    const courseCategories = course.category?.map((cat) => cat._id) || [];
    const courseAgeTypes = course.type_of_age?.map((age) => age._id) || [];

    return [...availableInstructors].sort((a, b) => {
      const specA = instructorSpecialists.get(a._id);
      const specB = instructorSpecialists.get(b._id);

      // Calculate match score for instructor A
      let scoreA = 0;
      if (specA) {
        const categoriesA = Array.isArray(specA.category)
          ? specA.category.map((cat: any) =>
              typeof cat === "object" ? cat._id : cat
            )
          : [];
        const ageTypesA = Array.isArray(specA.age_types)
          ? specA.age_types.map((age: any) =>
              typeof age === "object" ? age._id : age
            )
          : [];

        // +2 for each matching category
        scoreA +=
          courseCategories.filter((c) => categoriesA.includes(c)).length * 2;
        // +1 for each matching age type
        scoreA += courseAgeTypes.filter((a) => ageTypesA.includes(a)).length;
      }

      // Calculate match score for instructor B
      let scoreB = 0;
      if (specB) {
        const categoriesB = Array.isArray(specB.category)
          ? specB.category.map((cat: any) =>
              typeof cat === "object" ? cat._id : cat
            )
          : [];
        const ageTypesB = Array.isArray(specB.age_types)
          ? specB.age_types.map((age: any) =>
              typeof age === "object" ? age._id : age
            )
          : [];

        scoreB +=
          courseCategories.filter((c) => categoriesB.includes(c)).length * 2;
        scoreB += courseAgeTypes.filter((a) => ageTypesB.includes(a)).length;
      }

      // Sort by score descending (higher score first)
      return scoreB - scoreA;
    });
  };

  const selectedCourse = availableCourses.find(
    (c) => c._id === selectedCourseId
  );

  // Use searched courses if searching, otherwise use availableCourses
  const displayedCourses = courseSearchKey.trim()
    ? searchedCourses
    : availableCourses;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Tạo lớp học</DialogTitle>
          <DialogDescription>
            Tạo lớp học và kiểm tra hợp lệ tự động
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
                {/* Course Selection with Search */}
                <div className='space-y-2'>
                  <Label>Chọn khóa học *</Label>
                  <Popover
                    open={openCoursePopover}
                    onOpenChange={setOpenCoursePopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        disabled={loadingCourses}
                        className={cn(
                          "w-full justify-between",
                          !selectedCourseId && "text-muted-foreground"
                        )}
                      >
                        {selectedCourseId
                          ? availableCourses.find(
                              (course) => course._id === selectedCourseId
                            )?.title
                          : "Chọn khóa học..."}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-[--radix-popover-trigger-width] p-0'
                      align='start'
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder='Tìm kiếm khóa học...'
                          value={courseSearchKey}
                          onValueChange={setCourseSearchKey}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isSearchingCourses
                              ? "Đang tìm kiếm..."
                              : "Không tìm thấy khóa học."}
                          </CommandEmpty>
                          <CommandGroup>
                            {loadingCourses || isSearchingCourses ? (
                              <div className='p-2 text-sm text-muted-foreground flex items-center gap-2'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                {isSearchingCourses
                                  ? "Đang tìm kiếm..."
                                  : "Đang tải..."}
                              </div>
                            ) : (
                              displayedCourses.map((course) => (
                                <CommandItem
                                  key={course._id}
                                  value={course.title}
                                  onSelect={() => {
                                    setSelectedCourseId(course._id);
                                    setCourseSearchKey("");
                                    setOpenCoursePopover(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCourseId === course._id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {course.title}
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCourse && (
                    <div className='text-sm text-muted-foreground space-y-1 mt-2'>
                      <div>
                        Số buổi học: {selectedCourse.session_number || "N/A"}
                      </div>
                      <div>
                        Sức chứa tối đa: {selectedCourse.max_member || "N/A"}{" "}
                        học viên
                      </div>
                      {selectedCourse.type_of_age &&
                        selectedCourse.type_of_age.length > 0 && (
                          <div className='flex items-start gap-2'>
                            <span>Độ tuổi:</span>
                            <div className='flex flex-wrap gap-1'>
                              {selectedCourse.type_of_age.map((age) => (
                                <Badge
                                  key={age._id}
                                  variant='secondary'
                                  className='text-xs'
                                >
                                  {age.title}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Slot Selection */}
                <div className='space-y-2'>
                  <Label>Chọn thời gian học *</Label>
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
              </div>
            </StepperStep>

            {/* Step 1: Generate Classes & Validate (MERGED STEP 2 & 3) */}
            <StepperStep step={1}>
              <div className='space-y-4'>
                <div className='flex justify-between items-center'>
                  <div>
                    <h3 className='font-medium'>Danh sách lớp học</h3>
                    <p className='text-sm text-muted-foreground'>
                      Chọn Huấn luyện viên và kiểm tra validation tự động
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

                {/* Warning summary */}
                {validationWarnings.length > 0 && (
                  <Alert
                    variant='destructive'
                    className='bg-amber-50 dark:bg-amber-950/20 border-amber-200'
                  >
                    <AlertTriangle className='h-4 w-4 text-amber-600' />
                    <AlertDescription className='text-amber-800 dark:text-amber-200'>
                      <div className='font-medium'>
                        LƯU Ý: Có {validationWarnings.length} cảnh báo về Huấn
                        luyện viên
                      </div>
                      <div className='text-xs mt-1'>
                        Các cảnh báo không chặn việc tạo lớp, nhưng nên xem xét
                        lại để đảm bảo Huấn luyện viên phù hợp.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

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
                          <TableHead>Huấn luyện viên & Chuyên môn</TableHead>
                          <TableHead className='w-[180px]'>
                            Hiển thị đăng ký
                          </TableHead>
                          <TableHead className='w-[80px]'></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newClasses.map((classItem, index) => {
                          const warnings = getClassWarnings(classItem.id);
                          const specialist = instructorSpecialists.get(
                            classItem.instructor
                          );

                          return (
                            <TableRow
                              key={classItem.id}
                              className={cn(
                                warnings.length > 0 &&
                                  "bg-amber-50/50 dark:bg-amber-950/10"
                              )}
                            >
                              <TableCell className='font-medium align-top pt-4'>
                                {index + 1}
                              </TableCell>
                              <TableCell className='align-top pt-4'>
                                <div className='space-y-2'>
                                  {/* Course Info Display (Task 4) */}
                                  {selectedCourse && (
                                    <div className='p-2 border rounded-md bg-blue-50 dark:bg-blue-950/20 space-y-1.5 text-xs'>
                                      <div className='font-medium text-blue-900 dark:text-blue-100'>
                                        Thông tin khóa học
                                      </div>
                                      {selectedCourse.category &&
                                        selectedCourse.category.length > 0 && (
                                          <div className='flex flex-wrap gap-1 items-center'>
                                            <span className='text-muted-foreground'>
                                              Danh mục:
                                            </span>
                                            {selectedCourse.category.map(
                                              (cat, idx) => (
                                                <Badge
                                                  key={idx}
                                                  variant='secondary'
                                                  className='bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border-blue-200'
                                                >
                                                  {typeof cat === "object" &&
                                                  "title" in cat
                                                    ? cat.title
                                                    : cat}
                                                </Badge>
                                              )
                                            )}
                                          </div>
                                        )}
                                      {selectedCourse.type_of_age &&
                                        selectedCourse.type_of_age.length >
                                          0 && (
                                          <div className='flex flex-wrap gap-1 items-center'>
                                            <span className='text-muted-foreground'>
                                              Độ tuổi:
                                            </span>
                                            {selectedCourse.type_of_age.map(
                                              (age, idx) => (
                                                <Badge
                                                  key={idx}
                                                  variant='secondary'
                                                  className='bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-yellow-200'
                                                >
                                                  {age.title}
                                                </Badge>
                                              )
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  )}

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
                                </div>
                              </TableCell>
                              <TableCell className='align-top pt-4'>
                                <div className='space-y-2'>
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
                                      <SelectValue placeholder='Chọn Huấn luyện viên...' />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {loadingInstructors ? (
                                        <div className='p-2 text-sm text-muted-foreground'>
                                          Đang tải...
                                        </div>
                                      ) : (
                                        getSortedInstructors().map(
                                          (instructor) => {
                                            const spec =
                                              instructorSpecialists.get(
                                                instructor._id
                                              );
                                            return (
                                              <SelectItem
                                                key={instructor._id}
                                                value={instructor._id}
                                              >
                                                <div className='flex items-center gap-2 py-1'>
                                                  <span className='font-medium'>
                                                    {instructor.username}
                                                  </span>
                                                  {spec && (
                                                    <div className='flex items-center gap-1 flex-wrap'>
                                                      {/* Category badges (blue) */}
                                                      {Array.isArray(
                                                        spec.category
                                                      ) &&
                                                        spec.category
                                                          .slice(0, 2)
                                                          .map(
                                                            (
                                                              cat: any,
                                                              idx: number
                                                            ) => {
                                                              const title =
                                                                typeof cat ===
                                                                "object"
                                                                  ? cat.title
                                                                  : ageRulesTitles.get(
                                                                      cat
                                                                    ) || cat;
                                                              return (
                                                                <Badge
                                                                  key={`cat-${idx}`}
                                                                  variant='secondary'
                                                                  className='text-[10px] px-1 py-0 h-4 bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                                                                >
                                                                  {title}
                                                                </Badge>
                                                              );
                                                            }
                                                          )}
                                                      {/* Age type badges (yellow) */}
                                                      {Array.isArray(
                                                        spec.age_types
                                                      ) &&
                                                        spec.age_types
                                                          .slice(0, 2)
                                                          .map(
                                                            (
                                                              age: any,
                                                              idx: number
                                                            ) => {
                                                              const title =
                                                                typeof age ===
                                                                "object"
                                                                  ? age.title
                                                                  : ageRulesTitles.get(
                                                                      age
                                                                    ) || age;
                                                              return (
                                                                <Badge
                                                                  key={`age-${idx}`}
                                                                  variant='secondary'
                                                                  className='text-[10px] px-1 py-0 h-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100'
                                                                >
                                                                  {title}
                                                                </Badge>
                                                              );
                                                            }
                                                          )}
                                                    </div>
                                                  )}
                                                </div>
                                              </SelectItem>
                                            );
                                          }
                                        )
                                      )}
                                    </SelectContent>
                                  </Select>

                                  {/* Specialist info - Badge pills */}
                                  {specialist && classItem.instructor && (
                                    <div className='text-xs space-y-1.5'>
                                      <div className='flex flex-wrap gap-1 items-center'>
                                        <span className='text-muted-foreground'>
                                          Chuyên môn:
                                        </span>
                                        {(() => {
                                          const categories = Array.isArray(
                                            specialist.category
                                          )
                                            ? specialist.category
                                            : [];
                                          return categories.length > 0 ? (
                                            categories.map(
                                              (cat: any, idx: number) => {
                                                const title =
                                                  typeof cat === "object"
                                                    ? cat.title
                                                    : ageRulesTitles.get(cat) ||
                                                      cat;
                                                return (
                                                  <Badge
                                                    key={idx}
                                                    variant='secondary'
                                                    className='text-xs'
                                                  >
                                                    {title}
                                                  </Badge>
                                                );
                                              }
                                            )
                                          ) : (
                                            <span className='text-muted-foreground'>
                                              Chưa có
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <div className='flex flex-wrap gap-1 items-center'>
                                        <span className='text-muted-foreground'>
                                          Độ tuổi:
                                        </span>
                                        {(() => {
                                          const ageTypes = Array.isArray(
                                            specialist.age_types
                                          )
                                            ? specialist.age_types
                                            : [];
                                          return ageTypes.length > 0 ? (
                                            ageTypes.map(
                                              (age: any, idx: number) => {
                                                const title =
                                                  typeof age === "object"
                                                    ? age.title
                                                    : ageRulesTitles.get(age) ||
                                                      age;
                                                return (
                                                  <Badge
                                                    key={idx}
                                                    variant='secondary'
                                                    className='text-xs'
                                                  >
                                                    {title}
                                                  </Badge>
                                                );
                                              }
                                            )
                                          ) : (
                                            <span className='text-muted-foreground'>
                                              Chưa có
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  )}

                                  {/* Validation warnings */}
                                  {warnings.length > 0 && (
                                    <div className='space-y-1'>
                                      {warnings.map((warning, idx) => (
                                        <div
                                          key={idx}
                                          className='flex items-start gap-1.5 text-xs p-2 rounded-md bg-amber-100 dark:bg-amber-900/30 border border-amber-200'
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
                              </TableCell>
                              <TableCell className='align-top pt-4'>
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
                                    <SelectItem value='true'>
                                      Hiển thị
                                    </SelectItem>
                                    <SelectItem value='false'>Ẩn</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className='align-top pt-4'>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  onClick={() =>
                                    handleRemoveClass(classItem.id)
                                  }
                                >
                                  <Trash2 className='h-4 w-4 text-red-500' />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </StepperStep>

            {/* Step 2: Complete */}
            <StepperStep step={2}>
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
                                    Huấn luyện viên:
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
                } else if (currentStep === 2) {
                  // At final step (Complete), back button acts as finish
                  handleFinish();
                } else {
                  setCurrentStep((prev) => prev - 1);
                }
              }}
              disabled={isCreating}
            >
              {currentStep === 0
                ? "Hủy"
                : currentStep === 2
                ? "Đóng"
                : "Quay lại"}
            </Button>
            {currentStep === 0 && (
              <Button
                onClick={handleGenerateClasses}
                disabled={
                  !selectedCourseId ||
                  selectedSlotIds.length === 0 ||
                  selectedDays.length === 0
                }
              >
                Tiếp tục
              </Button>
            )}
            {currentStep === 1 && (
              <Button
                onClick={handleCreateClasses}
                disabled={
                  newClasses.length === 0 ||
                  newClasses.some((c) => !c.name || !c.instructor) ||
                  isCreating
                }
              >
                {isCreating ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang tạo...
                  </>
                ) : (
                  `Tạo ${newClasses.length} lớp học`
                )}
              </Button>
            )}
          </StepperFooter>
        </Stepper>
      </DialogContent>
    </Dialog>
  );
}
