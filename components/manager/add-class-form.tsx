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
import { Classroom } from "@/api/manager/class-api";
import { Pool } from "@/api/manager/pools-api";
import { SlotDetail } from "@/api/manager/slot-api";
import { fetchDateRangeSchedule } from "@/api/manager/schedule-api";
import { fetchClasses } from "@/api/manager/class-api";
import { fetchInstructors } from "@/api/manager/instructors-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { cn } from "@/lib/utils";
import {
  validatePools,
  getBestPool,
  PoolValidationInfo,
  formatAgeType,
} from "@/utils/pool-validation";

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

interface AddClassFormProps {
  selectedDate: string; // YYYY-MM-DD
  availableSlots: SlotDetail[];
  availableClassrooms: Classroom[];
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

  // Auto-fill instructor if class has one
  useEffect(() => {
    if (hasClassInstructor && classInstructor._id) {
      setSelectedInstructor(classInstructor._id);
    }
  }, [hasClassInstructor, classInstructor]);

  // Search classrooms by API
  useEffect(() => {
    const searchClassrooms = async () => {
      if (!classroomSearchKey.trim()) {
        setSearchedClassrooms([]);
        return;
      }

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
          classroomSearchKey
        );

        setSearchedClassrooms(result.data as Classroom[]);
      } catch (error: any) {
        console.error("Failed to search classrooms:", error);
      } finally {
        setIsSearchingClassrooms(false);
      }
    };

    const timeoutId = setTimeout(searchClassrooms, 300);
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

  // Validate pools when Slot + Classroom are selected
  useEffect(() => {
    if (selectedSlot && selectedClassroom && selectedClassDetails) {
      validatePoolsForSelection();
    } else {
      setValidatedPools([]);
      setSelectedPool("");
    }
  }, [selectedSlot, selectedClassroom]);

  const validatePoolsForSelection = async () => {
    if (!selectedClassDetails) return;

    setLoadingPools(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Vui lòng đăng nhập lại");
      }

      // Fetch existing schedules for the selected date
      const dateObj = new Date(selectedDate);
      const existingSchedules = await fetchDateRangeSchedule(
        dateObj,
        dateObj,
        tenantId,
        token
      );

      // Get instructor ID (from class or selected)
      const instructorId = hasClassInstructor
        ? classInstructor._id
        : selectedInstructor || "";

      // Validate all pools
      const validatedPoolsData = validatePools({
        allPools: availablePools,
        selectedClass: selectedClassDetails as any,
        selectedDate,
        selectedSlotId: selectedSlot,
        instructorId,
        existingSchedules: existingSchedules.events,
      });

      setValidatedPools(validatedPoolsData);

      // Auto-select best pool
      const bestPool = getBestPool(validatedPoolsData);
      if (bestPool) {
        setSelectedPool(bestPool._id);
      }
    } catch (error) {
      console.error("Pool validation error:", error);
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

  const isFormValid =
    selectedSlot &&
    selectedClassroom &&
    selectedPool &&
    selectedInstructor &&
    availableInstructors.length > 0;

  // Check if Step 1 is completed
  const isStep1Complete = selectedSlot && selectedClassroom;

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
        {/* Step 1: Slot Selection */}
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
            disabled={loading}
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
                {selectedClassroom
                  ? availableClassrooms.find(
                      (classroom) => classroom._id === selectedClassroom
                    )?.name
                  : "Chọn lớp học..."}
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
                      (classroomSearchKey.trim()
                        ? searchedClassrooms
                        : availableClassrooms
                      ).map((classroom) => (
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
                          {classroom.name} -{" "}
                          {(classroom.course as any)?.title ||
                            "Không có khóa học"}
                        </CommandItem>
                      ))
                    )}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
                              {pool.hasInstructorConflict && (
                                <Badge
                                  variant='destructive'
                                  className='text-[10px] px-1.5 py-0 h-5'
                                >
                                  HLV trùng
                                </Badge>
                              )}
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

            {/* Step 3: Instructor Selection */}
            <div className='space-y-2'>
              <Label
                htmlFor='instructor-select'
                className='flex items-center gap-2'
              >
                <User className='h-4 w-4' />
                Huấn luyện viên <span className='text-red-500'>*</span>
              </Label>

              {hasClassInstructor ? (
                <div className='flex items-center gap-3 p-3 border rounded-md bg-muted'>
                  <Avatar className='h-8 w-8'>
                    <AvatarImage src={instructorAvatars[classInstructor._id]} />
                    <AvatarFallback>
                      <User className='h-4 w-4' />
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1'>
                    <div className='font-medium'>
                      {classInstructor.username || "N/A"}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {classInstructor.email || ""}
                    </div>
                  </div>
                  <Badge variant='secondary'>Huấn luyện viên lớp</Badge>
                </div>
              ) : (
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
                        !selectedInstructor && "text-muted-foreground"
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
                            ).map((instructor) => (
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
                                <div className='flex items-center gap-2'>
                                  <Avatar className='h-6 w-6'>
                                    <AvatarImage
                                      src={instructorAvatars[instructor._id]}
                                    />
                                    <AvatarFallback>
                                      <User className='h-3 w-3' />
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className='flex flex-col'>
                                    <span>
                                      {instructor.username} ({instructor.email})
                                    </span>
                                    {instructor.is_active === false && (
                                      <span className='text-xs text-red-500'>
                                        Không hoạt động
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
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
          Hủy
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
