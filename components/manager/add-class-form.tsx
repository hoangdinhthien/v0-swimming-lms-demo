"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Loader2,
  Save,
  User,
  Users,
  X,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Classroom,
  ClassItem,
  Instructor,
  fetchClasses,
} from "@/api/manager/class-api";
import { Pool } from "@/api/manager/pools-api";
import { SlotDetail } from "@/api/manager/slot-api";
import { fetchAllCourseCategories } from "@/api/manager/course-categories";
import { fetchAgeRules } from "@/api/manager/age-types";
import {
  fetchInstructorSpecialist,
  fetchInstructors,
} from "@/api/manager/instructors-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { cn } from "@/lib/utils";
import {
  validatePools,
  getBestPool,
  PoolValidationInfo,
  formatAgeType,
} from "@/utils/pool-validation";

interface InstructorSpecialist {
  _id: string;
  user: string | { _id: string; username: string };
  category: Array<{ _id: string; title: string }> | string[];
  age_types: Array<{ _id: string; title: string }> | string[];
}

interface ValidationWarning {
  instructorId: string;
  type: "category" | "age_type" | "schedule_conflict";
  severity: "warning" | "error";
  message: string;
  details: string;
}

interface AddClassFormProps {
  selectedDate: string; // YYYY-MM-DD
  availableSlots: SlotDetail[];
  availableClassrooms: ClassItem[];
  availablePools: Pool[];
  availableInstructors: Instructor[];
  instructorAvatars?: { [key: string]: string };
  onSubmit: (data: {
    date: string;
    slot: string;
    classroom: string;
    pool: string;
    instructor: string;
  }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  // Edit mode props
  editMode?: boolean;
  initialValues?: {
    slot?: string;
    classroom?: string;
    pool?: string;
    instructor?: string;
  };
  currentScheduleId?: string;
}

export function AddClassForm({
  selectedDate,
  availableSlots,
  availableClassrooms,
  availablePools,
  availableInstructors,
  instructorAvatars = {},
  onSubmit,
  onCancel,
  loading = false,
  editMode = false,
  initialValues = {},
  currentScheduleId,
}: AddClassFormProps) {
  // Step 1: Slot + Classroom selection
  const [selectedSlot, setSelectedSlot] = useState<string>(
    initialValues.slot || ""
  );
  const [selectedClassroom, setSelectedClassroom] = useState<string>(
    initialValues.classroom || ""
  );

  // Step 2: Pool validation & selection (only after Step 1)
  const [validatedPools, setValidatedPools] = useState<PoolValidationInfo[]>(
    []
  );
  const [selectedPool, setSelectedPool] = useState<string>(
    initialValues.pool || ""
  );
  const [loadingPools, setLoadingPools] = useState(false);

  // Step 3: Instructor (auto-filled if class has instructor)
  const [selectedInstructor, setSelectedInstructor] = useState<string>(
    initialValues.instructor || ""
  );

  // Instructor specialist validation
  const [instructorSpecialists, setInstructorSpecialists] = useState<
    Map<string, InstructorSpecialist>
  >(new Map());
  const [validationWarnings, setValidationWarnings] = useState<
    ValidationWarning[]
  >([]);

  // Category and age type mappings for display
  const [categoryTitles, setCategoryTitles] = useState<Map<string, string>>(
    new Map()
  );
  const [ageTypeTitles, setAgeTypeTitles] = useState<Map<string, string>>(
    new Map()
  );
  const [mappingsLoaded, setMappingsLoaded] = useState(false);

  // Search states for Classroom
  const [classroomSearchKey, setClassroomSearchKey] = useState("");
  const [searchedClassrooms, setSearchedClassrooms] = useState<Classroom[]>([]);
  const [isSearchingClassrooms, setIsSearchingClassrooms] = useState(false);
  const [openClassroomPopover, setOpenClassroomPopover] = useState(false);

  // Search states for Instructor
  const [instructorSearchKey, setInstructorSearchKey] = useState("");
  const [searchedInstructors, setSearchedInstructors] = useState<Instructor[]>(
    []
  );
  const [isSearchingInstructors, setIsSearchingInstructors] = useState(false);
  const [openInstructorPopover, setOpenInstructorPopover] = useState(false);

  // Slot detail for instructor busy status
  const [slotDetail, setSlotDetail] = useState<any>(null);
  const [busyInstructorIds, setBusyInstructorIds] = useState<string[]>([]);
  const [busyClassroomIds, setBusyClassroomIds] = useState<string[]>([]);

  // Get selected classroom details
  const selectedClassDetails = availableClassrooms.find(
    (c) => c._id === selectedClassroom
  );

  // Check if class already has instructor
  const classInstructor = (selectedClassDetails as any)?.instructor;
  const hasClassInstructor = !!(
    classInstructor &&
    typeof classInstructor === "object" &&
    classInstructor._id
  );

  // Check if Step 1 is completed
  const isStep1Complete = selectedSlot && selectedClassroom;

  // Auto-fill instructor if class has one
  useEffect(() => {
    if (hasClassInstructor && classInstructor._id) {
      setSelectedInstructor(classInstructor._id);
    }
  }, [hasClassInstructor, classInstructor]);

  // Load category and age type mappings on mount
  useEffect(() => {
    const loadMappings = async () => {
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();

        if (!tenantId || !token) return;

        // Load categories
        const categories = await fetchAllCourseCategories({
          tenantId,
          token,
        });
        const categoryMap = new Map(
          categories.map((cat) => [cat._id, cat.title])
        );
        setCategoryTitles(categoryMap);

        // Load age types
        const ageTypes = await fetchAgeRules();
        const ageTypeMap = new Map(ageTypes.map((age) => [age._id, age.title]));
        setAgeTypeTitles(ageTypeMap);

        setMappingsLoaded(true);
      } catch (error) {
        console.error("Failed to load category/age type mappings:", error);
        setMappingsLoaded(true); // Still set to true to avoid infinite loading
      }
    };

    loadMappings();
  }, []);

  // Trigger pool validation when Step 1 is completed
  useEffect(() => {
    if (isStep1Complete) {
      validatePoolsForSelection();
    } else {
      // Reset when step 1 is not complete
      setValidatedPools([]);
      setSelectedPool("");
      setLoadingPools(false);
    }
  }, [isStep1Complete, selectedDate, selectedSlot, selectedClassroom]);

  // Load classrooms by API (always use API for search and initial load)
  useEffect(() => {
    const loadClassrooms = async () => {
      setIsSearchingClassrooms(true);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();

        if (!tenantId || !token) {
          throw new Error("Vui lòng đăng nhập lại");
        }

        const result = await fetchClasses(
          tenantId,
          token,
          1,
          50,
          classroomSearchKey.trim() ? classroomSearchKey : undefined
        );

        setSearchedClassrooms(result.data as Classroom[]);
      } catch (error: any) {
        console.error("Failed to load classrooms:", error);
        setSearchedClassrooms([]);
      } finally {
        setIsSearchingClassrooms(false);
      }
    };

    const timeoutId = setTimeout(
      loadClassrooms,
      classroomSearchKey.trim() ? 300 : 0
    );
    return () => clearTimeout(timeoutId);
  }, [classroomSearchKey]);

  // Search instructors by API
  useEffect(() => {
    const searchInstructors = async () => {
      if (!instructorSearchKey.trim()) {
        setSearchedInstructors([]);
        return;
      }

      setIsSearchingInstructors(true);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();

        if (!tenantId || !token) {
          throw new Error("Vui lòng đăng nhập lại");
        }

        const result = await fetchInstructors({
          tenantId,
          token,
          role: "instructor",
          searchKey: instructorSearchKey,
        });

        setSearchedInstructors(result);
      } catch (error: any) {
        console.error("Failed to search instructors:", error);
      } finally {
        setIsSearchingInstructors(false);
      }
    };

    const timeoutId = setTimeout(searchInstructors, 300);
    return () => clearTimeout(timeoutId);
  }, [instructorSearchKey]);

  // Fetch slot detail when slot is selected (to get busy instructors)
  useEffect(() => {
    const fetchSlotDetailData = async () => {
      if (!selectedSlot || !selectedDate) {
        setSlotDetail(null);
        setBusyInstructorIds([]);
        return;
      }

      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();

        if (!tenantId || !token) {
          throw new Error("Vui lòng đăng nhập lại");
        }

        const { fetchSlotDetail } = await import("@/api/manager/slot-api");
        const result = await fetchSlotDetail(
          selectedSlot,
          selectedDate,
          tenantId,
          token
        );

        setSlotDetail(result);

        // Extract busy instructor IDs from schedules
        const busyIds = (result.schedules || [])
          .filter((s: any) => s._id !== currentScheduleId) // Exclude current schedule if provided
          .map((schedule: any) => schedule.instructor?._id)
          .filter(Boolean);
        setBusyInstructorIds(busyIds);

        // Extract busy classroom IDs from schedules
        const busyClassroomIds = (result.schedules || [])
          .filter((s: any) => s._id !== currentScheduleId) // Exclude current schedule if provided
          .map((schedule: any) => schedule.classroom?._id)
          .filter(Boolean);
        setBusyClassroomIds(busyClassroomIds);

        // Manually re-validate instructor if already selected
        // This is needed because the state update is async and might not trigger the effect immediately with new data
        if (selectedInstructor) {
          // We need to pass the busyIds directly because state update hasn't propagated yet
          validateInstructorSpecialist(selectedInstructor, busyIds);
        }
      } catch (error: any) {
        console.error("Failed to fetch slot detail:", error);
        setSlotDetail(null);
        setBusyInstructorIds([]);
        setBusyClassroomIds([]);
      }
    };

    fetchSlotDetailData();
  }, [selectedSlot, selectedDate]);

  // Validate instructor specialist when instructor is selected
  useEffect(() => {
    if (
      selectedInstructor &&
      selectedClassDetails &&
      isStep1Complete &&
      mappingsLoaded
    ) {
      validateInstructorSpecialist(selectedInstructor);
    }
  }, [
    selectedInstructor,
    selectedClassDetails,
    isStep1Complete,
    mappingsLoaded,
    busyInstructorIds,
  ]);

  const validateInstructorSpecialist = async (
    instructorId: string,
    currentBusyInstructorIds?: string[]
  ) => {
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token || !selectedClassDetails) return;

      const course = (selectedClassDetails as any).course;
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

      // Clear previous warnings for this instructor
      setValidationWarnings((prev) =>
        prev.filter((w) => w.instructorId !== instructorId)
      );

      const warnings: ValidationWarning[] = [];

      // Missing specialist
      if (!specialist) {
        warnings.push({
          instructorId,
          type: "schedule_conflict",
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

      const courseCategories: string[] = course.category || [];
      const courseAgeTypes: string[] = course.type_of_age || [];

      // Validate category match
      const categoryMatch = courseCategories.some((catId) =>
        specialistCategories.includes(catId)
      );

      if (
        !categoryMatch &&
        courseCategories.length > 0 &&
        specialistCategories.length > 0
      ) {
        const courseCategoryTitles = courseCategories
          .map((catId) => categoryTitles.get(catId) || catId)
          .join(", ");
        const specialistCategoryTitles = specialist.category
          .map((cat: any) => (typeof cat === "object" ? cat.title : ""))
          .filter(Boolean)
          .join(", ");

        warnings.push({
          instructorId,
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
        const courseAgeTypeTitles = courseAgeTypes
          .map((ageId) => ageTypeTitles.get(ageId) || ageId)
          .join(", ");
        const specialistAgeTypeTitles = specialist.age_types
          .map((age: any) => (typeof age === "object" ? age.title : ""))
          .filter(Boolean)
          .join(", ");

        warnings.push({
          instructorId,
          type: "age_type",
          severity: "warning",
          message: "Độ tuổi không phù hợp",
          details: `Khóa học: [${courseAgeTypeTitles}] ≠ Huấn luyện viên: [${specialistAgeTypeTitles}]`,
        });
      }

      // Check schedule conflict
      const busyIdsToCheck = currentBusyInstructorIds || busyInstructorIds;
      const hasScheduleConflict = busyIdsToCheck.includes(instructorId);
      if (hasScheduleConflict) {
        warnings.push({
          instructorId,
          type: "schedule_conflict",
          severity: "error",
          message: "Huấn luyện viên đã bận trong khung giờ này",
          details: "Vui lòng chọn Huấn luyện viên khác hoặc khung giờ khác",
        });
      }

      setValidationWarnings((prev) => [...prev, ...warnings]);
    } catch (error) {
      console.error("Failed to validate instructor:", error);
    }
  };

  const validatePoolsForSelection = async () => {
    if (!selectedClassDetails || !selectedSlot || !selectedDate) return;

    setLoadingPools(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Use fetchAvailablePools API
      const { fetchAvailablePools } = await import("@/api/manager/pools-api");
      const availablePoolsResult = await fetchAvailablePools(
        [
          {
            date: selectedDate,
            slot: { _id: selectedSlot },
          },
        ],
        tenantId,
        token
      );

      // availablePoolsResult is AvailablePool[][]
      // We only sent 1 date+slot combo, so we get availablePoolsResult[0]
      const poolsForSelectedSlot = availablePoolsResult[0] || [];

      // Get course details for validation
      const course = (selectedClassDetails as any).course;
      const courseMaxMember = course?.max_member || 0;

      // Map to PoolValidationInfo format with enhanced validation
      const validatedPoolsData: PoolValidationInfo[] = poolsForSelectedSlot.map(
        (pool: any) => {
          // Validation 1: Check age type matching (from schedule-preview-modal.tsx)
          const courseTypeOfAge = course?.type_of_age;
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

          // Validation 2: Check capacity warning (from schedule-preview-modal.tsx)
          const hasCapacityWarning =
            courseMaxMember > 0 && pool.remaining_capacity < courseMaxMember;

          return {
            ...pool,
            isAvailable: pool.remaining_capacity > 0,
            hasCapacityWarning,
            hasAgeWarning,
            hasInstructorConflict: false, // Will be checked when instructor is selected
            capacity_remain: pool.remaining_capacity,
          };
        }
      );

      setValidatedPools(validatedPoolsData);

      // Auto-select best pool with scoring algorithm (from schedule-preview-modal.tsx)
      if (validatedPoolsData.length > 0) {
        const scoredPools = validatedPoolsData.map((pool) => {
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

          // Priority 2: No capacity warning - +30 points
          if (!pool.hasCapacityWarning) {
            score += 30;
          }

          // Priority 3: Higher remaining capacity - proportional score (0-30 points)
          if (pool.capacity > 0 && pool.capacity_remain > 0) {
            const capacityRatio = pool.capacity_remain / pool.capacity;
            score += capacityRatio * 30;
          }

          return { ...pool, score };
        });

        // Select pool with highest score
        const bestPool = scoredPools.reduce((best, current) =>
          current.score > best.score ? current : best
        );

        setSelectedPool(bestPool._id);
      }
    } catch (error) {
      console.error("Pool validation error:", error);
      setValidatedPools([]);
    } finally {
      setLoadingPools(false);
    }
  };

  const handleSubmit = async () => {
    if (
      !selectedSlot ||
      !selectedClassroom ||
      !selectedPool ||
      !selectedInstructor
    ) {
      return;
    }

    await onSubmit({
      date: selectedDate,
      slot: selectedSlot,
      classroom: selectedClassroom,
      pool: selectedPool,
      instructor: selectedInstructor,
    });
  };

  // Get warnings for selected instructor
  const selectedInstructorWarnings = validationWarnings.filter(
    (w) => w.instructorId === selectedInstructor
  );

  // Check if selected instructor has blocking errors
  const hasBlockingErrors = selectedInstructorWarnings.some(
    (w) => w.severity === "error"
  );

  const isFormValid =
    selectedSlot &&
    selectedClassroom &&
    selectedPool &&
    selectedInstructor &&
    availableInstructors.length > 0 &&
    !hasBlockingErrors &&
    !loadingPools &&
    !busyClassroomIds.includes(selectedClassroom);

  // Check for classroom conflict
  const hasClassroomConflict = busyClassroomIds.includes(selectedClassroom);

  return (
    <div className='space-y-6'>
      {/* Header Alert */}
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          {editMode ? "Chỉnh sửa" : "Thêm"} lớp học cho ngày{" "}
          <span className='font-semibold'>
            {new Date(selectedDate).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </AlertDescription>
      </Alert>

      {availableInstructors.length === 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Không có Huấn luyện viên nào. Vui lòng thêm Huấn luyện viên vào hệ
            thống trước khi tạo lớp học.
          </AlertDescription>
        </Alert>
      )}

      <div className='space-y-4'>
        {/* Step 1: Classroom Selection */}
        <div className='space-y-2'>
          <Label
            htmlFor='classroom-select'
            className='flex items-center gap-2'
          >
            <Users className='h-4 w-4' />
            Lớp học <span className='text-red-500'>*</span>
          </Label>
          <Popover
            open={openClassroomPopover}
            onOpenChange={setOpenClassroomPopover}
          >
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                disabled={loading}
                className={cn(
                  "w-full justify-between",
                  !selectedClassroom && "text-muted-foreground"
                )}
              >
                <span className='truncate flex-1 text-left'>
                  {selectedClassroom
                    ? availableClassrooms.find(
                        (classroom) => classroom._id === selectedClassroom
                      )?.name
                    : "Chọn lớp học..."}
                </span>
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-[--radix-popover-trigger-width] p-0'
              align='start'
            >
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder='Tìm kiếm lớp học...'
                  value={classroomSearchKey}
                  onValueChange={setClassroomSearchKey}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearchingClassrooms
                      ? "Đang tìm kiếm..."
                      : "Không tìm thấy lớp học."}
                  </CommandEmpty>
                  <CommandGroup>
                    {isSearchingClassrooms ? (
                      <div className='p-2 text-sm text-muted-foreground flex items-center gap-2'>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        Đang tìm kiếm...
                      </div>
                    ) : (
                      searchedClassrooms.map((classroom) => {
                        const isBusy = busyClassroomIds.includes(classroom._id);
                        return (
                          <CommandItem
                            key={classroom._id}
                            value={classroom.name}
                            onSelect={() => {
                              setSelectedClassroom(classroom._id);
                              setClassroomSearchKey("");
                              setOpenClassroomPopover(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedClassroom === classroom._id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <div className='flex items-center gap-2 flex-1'>
                              <span>
                                {classroom.name} -{" "}
                                {(classroom.course as any)?.title ||
                                  "Không có khóa học"}
                              </span>
                              {isBusy && (
                                <Badge
                                  variant='destructive'
                                  className='text-[10px] px-1.5 py-0 h-5'
                                >
                                  Đang học
                                </Badge>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {hasClassroomConflict && (
            <Alert
              variant='destructive'
              className='mt-2'
            >
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Lớp học này đã có lịch trong khung giờ được chọn.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Step 2: Slot Selection */}
        <div className='space-y-2'>
          <Label
            htmlFor='slot-select'
            className='flex items-center gap-2'
          >
            <Clock className='h-4 w-4' />
            Khung giờ <span className='text-red-500'>*</span>
          </Label>
          <Select
            value={selectedSlot}
            onValueChange={setSelectedSlot}
            disabled={loading || !selectedClassroom}
          >
            <SelectTrigger id='slot-select'>
              <SelectValue placeholder='Chọn khung giờ' />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.map((slot) => (
                <SelectItem
                  key={slot._id}
                  value={slot._id}
                >
                  {slot.title} (
                  {Math.floor(slot.start_time).toString().padStart(2, "0")}:
                  {slot.start_minute.toString().padStart(2, "0")} -{" "}
                  {Math.floor(slot.end_time).toString().padStart(2, "0")}:
                  {slot.end_minute.toString().padStart(2, "0")})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator className='my-4' />

        {/* Step 2: Pool Selection (only shown after Step 1) */}
        {isStep1Complete && (
          <>
            <div className='space-y-2'>
              <Label
                htmlFor='pool-select'
                className='flex items-center gap-2'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  className='h-4 w-4'
                >
                  <path d='M2 12h20' />
                  <path d='M12 2v20' />
                  <circle
                    cx='12'
                    cy='12'
                    r='10'
                  />
                </svg>
                Hồ bơi <span className='text-red-500'>*</span>
              </Label>

              {loadingPools ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  <span className='ml-2'>Đang tải danh sách hồ bơi...</span>
                </div>
              ) : (
                <Select
                  value={selectedPool}
                  onValueChange={setSelectedPool}
                  disabled={loading}
                >
                  <SelectTrigger id='pool-select'>
                    <SelectValue placeholder='Chọn hồ bơi' />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className='h-[300px]'>
                      {validatedPools.map((pool) => (
                        <SelectItem
                          key={pool._id}
                          value={pool._id}
                          disabled={!pool.isAvailable}
                        >
                          <div className='flex items-center justify-between gap-2 py-1'>
                            {/* Pool name and details */}
                            <div className='flex items-center gap-2'>
                              <span className='font-medium'>{pool.title}</span>
                              <span className='text-xs text-muted-foreground'>
                                {pool.capacity_remain}/{pool.capacity} chỗ
                                {pool.type_of_age && (
                                  <> • {formatAgeType(pool.type_of_age)}</>
                                )}
                              </span>
                            </div>

                            {/* Status badges */}
                            <div className='flex items-center gap-1 flex-shrink-0'>
                              {pool.hasAgeWarning &&
                                !pool.hasInstructorConflict && (
                                  <Badge
                                    variant='outline'
                                    className='text-[10px] px-1.5 py-0 h-5 border-yellow-500 text-yellow-700'
                                  >
                                    Tuổi
                                  </Badge>
                                )}
                              {pool.hasCapacityWarning &&
                                !pool.hasInstructorConflict && (
                                  <Badge
                                    variant='secondary'
                                    className='text-[10px] px-1.5 py-0 h-5'
                                  >
                                    Gần đầy
                                  </Badge>
                                )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator className='my-4' />

            {/* Step 3: Instructor Selection (only shown after pools loaded) */}
            {!loadingPools && validatedPools.length > 0 && (
              <div className='space-y-2'>
                <Label
                  htmlFor='instructor-select'
                  className='flex items-center gap-2'
                >
                  <User className='h-4 w-4' />
                  Huấn luyện viên <span className='text-red-500'>*</span>
                </Label>

                {hasClassInstructor && (
                  <div className='mb-2'>
                    <div className='flex items-center gap-3 p-3 border rounded-md bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage
                          src={instructorAvatars[classInstructor._id]}
                        />
                        <AvatarFallback>
                          <User className='h-4 w-4' />
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1'>
                        <div className='font-medium text-blue-900 dark:text-blue-100'>
                          {classInstructor.username || "N/A"}
                        </div>
                        <div className='text-xs text-blue-700 dark:text-blue-300'>
                          Huấn luyện viên hiện tại của lớp
                        </div>
                      </div>
                      <Badge
                        variant='default'
                        className='bg-blue-500 hover:bg-blue-600'
                      >
                        Huấn luyện viên lớp
                      </Badge>
                    </div>
                    <div className='text-xs text-muted-foreground mt-1'>
                      Bạn có thể chọn huấn luyện viên khác nếu cần thay đổi
                    </div>
                  </div>
                )}

                <div className='space-y-2'>
                  <Popover
                    open={openInstructorPopover}
                    onOpenChange={setOpenInstructorPopover}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        role='combobox'
                        disabled={loading}
                        className={cn(
                          "w-full justify-between",
                          !selectedInstructor && "text-muted-foreground",
                          hasBlockingErrors &&
                            "border-red-500 bg-red-50 dark:bg-red-900/20"
                        )}
                      >
                        {selectedInstructor
                          ? (() => {
                              const instructor = availableInstructors.find(
                                (i) => i._id === selectedInstructor
                              );
                              return instructor ? (
                                <div className='flex items-center gap-2'>
                                  <Avatar className='h-6 w-6'>
                                    <AvatarImage
                                      src={instructorAvatars[instructor._id]}
                                    />
                                    <AvatarFallback>
                                      <User className='h-3 w-3' />
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{instructor.username}</span>
                                </div>
                              ) : (
                                "Chọn Huấn luyện viên..."
                              );
                            })()
                          : "Chọn Huấn luyện viên..."}
                        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className='w-[--radix-popover-trigger-width] p-0'
                      align='start'
                    >
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder='Tìm kiếm Huấn luyện viên...'
                          value={instructorSearchKey}
                          onValueChange={setInstructorSearchKey}
                        />
                        <CommandList>
                          <CommandEmpty>
                            {isSearchingInstructors
                              ? "Đang tìm kiếm..."
                              : "Không tìm thấy Huấn luyện viên."}
                          </CommandEmpty>
                          <CommandGroup>
                            {isSearchingInstructors ? (
                              <div className='p-2 text-sm text-muted-foreground flex items-center gap-2'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                                Đang tìm kiếm...
                              </div>
                            ) : (
                              (instructorSearchKey.trim()
                                ? searchedInstructors
                                : availableInstructors
                              )
                                .sort((a, b) => {
                                  // Sort: Free instructors first, then busy ones
                                  const aIsBusy = busyInstructorIds.includes(
                                    a._id
                                  );
                                  const bIsBusy = busyInstructorIds.includes(
                                    b._id
                                  );
                                  if (aIsBusy === bIsBusy) return 0;
                                  return aIsBusy ? 1 : -1;
                                })
                                .map((instructor) => {
                                  const isBusy = busyInstructorIds.includes(
                                    instructor._id
                                  );
                                  const instructorWarnings =
                                    validationWarnings.filter(
                                      (w) => w.instructorId === instructor._id
                                    );
                                  const hasErrors = instructorWarnings.some(
                                    (w) => w.severity === "error"
                                  );
                                  return (
                                    <CommandItem
                                      key={instructor._id}
                                      value={instructor.username}
                                      disabled={instructor.is_active === false}
                                      onSelect={() => {
                                        setSelectedInstructor(instructor._id);
                                        setInstructorSearchKey("");
                                        setOpenInstructorPopover(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedInstructor === instructor._id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className='flex items-center gap-2 flex-1'>
                                        <Avatar className='h-6 w-6'>
                                          <AvatarImage
                                            src={
                                              instructorAvatars[instructor._id]
                                            }
                                          />
                                          <AvatarFallback>
                                            <User className='h-3 w-3' />
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className='flex flex-col flex-1'>
                                          <div className='flex items-center gap-2'>
                                            <span>
                                              {instructor.username} (
                                              {instructor.email})
                                            </span>
                                            {isBusy ? (
                                              <Badge
                                                variant='destructive'
                                                className='text-[10px] px-1.5 py-0 h-5'
                                              >
                                                Bận
                                              </Badge>
                                            ) : (
                                              <Badge
                                                variant='default'
                                                className='text-[10px] px-1.5 py-0 h-5 bg-green-500 hover:bg-green-600'
                                              >
                                                Rảnh
                                              </Badge>
                                            )}
                                            {hasErrors && (
                                              <Badge
                                                variant='destructive'
                                                className='text-[10px] px-1.5 py-0 h-5'
                                              >
                                                Lỗi
                                              </Badge>
                                            )}
                                          </div>
                                          {instructor.is_active === false && (
                                            <span className='text-xs text-red-500'>
                                              Không hoạt động
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Show warnings for selected instructor */}
                {selectedInstructorWarnings.length > 0 && (
                  <div className='space-y-1'>
                    {selectedInstructorWarnings.map((warning, index) => (
                      <Alert
                        key={index}
                        variant={
                          warning.severity === "error"
                            ? "destructive"
                            : "default"
                        }
                        className={
                          warning.severity === "warning"
                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                            : ""
                        }
                      >
                        <AlertCircle className='h-4 w-4' />
                        <AlertDescription className='text-sm'>
                          <div className='font-medium'>{warning.message}</div>
                          <div className='text-xs opacity-80'>
                            {warning.details}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className='flex gap-2 pt-4'>
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className='flex-1'
        >
          {loading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              {editMode ? "Đang cập nhật..." : "Đang thêm..."}
            </>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' />
              {editMode ? "Cập nhật" : "Thêm lớp học"}
            </>
          )}
        </Button>
        <Button
          variant='outline'
          onClick={onCancel}
          disabled={loading}
        >
          <X className='mr-2 h-4 w-4' />
          Hủy cmm
        </Button>
      </div>

      {/* Info Alert */}
      {isStep1Complete && !loadingPools && validatedPools.length === 0 && (
        <Alert>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>
            Không tìm thấy hồ bơi phù hợp. Vui lòng kiểm tra lại khung giờ và
            lớp học.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
