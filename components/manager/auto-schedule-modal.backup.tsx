"use client";

import React, { useState } from "react";
import { Loader2, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassItem {
  _id: string;
  name: string;
  course?: {
    title?: string;
    session_number?: number;
  };
  schedules?: any[];
}

interface ClassScheduleConfig {
  min_time: number;
  max_time: number;
  session_in_week: number;
  array_number_in_week: number[];
}

// Course and Instructor interfaces for Tab 2
interface Course {
  _id: string;
  title: string;
  session_number?: number;
}

interface Instructor {
  _id: string;
  username: string;
}

// New class form for Tab 2
export interface NewClassForm {
  id: string; // temporary ID for form management
  course: string;
  name: string;
  instructor: string;
  show_on_regist_course: boolean;
  min_time: number;
  max_time: number;
  session_in_week: number;
  array_number_in_week: number[];
}

interface AutoScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Tab 1: Existing classes
  availableClasses: ClassItem[];
  selectedClassIds: string[];
  classScheduleConfigs: { [classId: string]: ClassScheduleConfig };
  loading: boolean;
  isScheduling: boolean;
  onClassToggle: (classId: string) => void;
  onDayToggle: (classId: string, jsDay: number) => void;
  onTimeChange: (
    classId: string,
    field: "min_time" | "max_time",
    value: number
  ) => void;
  onSubmit: () => void;
  // Tab 2: Create new classes
  availableCourses: Course[];
  availableInstructors: Instructor[];
  loadingCourses: boolean;
  loadingInstructors: boolean;
  onCreateAndSchedule: (newClasses: NewClassForm[]) => void;
}

export function AutoScheduleModal({
  open,
  onOpenChange,
  availableClasses,
  selectedClassIds,
  classScheduleConfigs,
  loading,
  isScheduling,
  onClassToggle,
  onDayToggle,
  onTimeChange,
  onSubmit,
  availableCourses,
  availableInstructors,
  loadingCourses,
  loadingInstructors,
  onCreateAndSchedule,
}: AutoScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<"existing" | "create">("existing");
  const [newClassForms, setNewClassForms] = useState<NewClassForm[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const dayNames = [
    { label: "T2", value: 1 },
    { label: "T3", value: 2 },
    { label: "T4", value: 3 },
    { label: "T5", value: 4 },
    { label: "T6", value: 5 },
    { label: "T7", value: 6 },
    { label: "CN", value: 0 },
  ];

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

  // Add new class form
  const handleAddNewClass = () => {
    const newForm: NewClassForm = {
      id: `new-${Date.now()}`,
      course: "",
      name: "",
      instructor: "",
      show_on_regist_course: false,
      min_time: 7,
      max_time: 18,
      session_in_week: 0,
      array_number_in_week: [],
    };
    setNewClassForms([...newClassForms, newForm]);
  };

  // Remove new class form
  const handleRemoveNewClass = (id: string) => {
    setNewClassForms(newClassForms.filter((form) => form.id !== id));
  };

  // Update new class form field
  const handleUpdateNewClass = (
    id: string,
    field: keyof NewClassForm,
    value: any
  ) => {
    setNewClassForms(
      newClassForms.map((form) =>
        form.id === id ? { ...form, [field]: value } : form
      )
    );
  };

  // Toggle day for new class
  const handleToggleDayForNewClass = (id: string, jsDay: number) => {
    setNewClassForms(
      newClassForms.map((form) => {
        if (form.id !== id) return form;

        const currentDays = form.array_number_in_week;
        const isSelected = currentDays.includes(jsDay);

        const newDays = isSelected
          ? currentDays.filter((d) => d !== jsDay)
          : [...currentDays, jsDay].sort((a, b) => a - b);

        return {
          ...form,
          array_number_in_week: newDays,
          session_in_week: newDays.length,
        };
      })
    );
  };

  // Handle create and schedule
  const handleCreateAndScheduleSubmit = async () => {
    if (newClassForms.length === 0) return;

    // Validate forms
    for (const form of newClassForms) {
      if (!form.course || !form.name || !form.instructor) {
        alert("Vui lòng điền đầy đủ thông tin cho tất cả các lớp");
        return;
      }
      if (form.array_number_in_week.length === 0) {
        alert("Vui lòng chọn ít nhất một ngày học cho mỗi lớp");
        return;
      }
      if (form.min_time >= form.max_time) {
        alert("Giờ bắt đầu phải nhỏ hơn giờ kết thúc");
        return;
      }
    }

    setIsCreating(true);
    try {
      await onCreateAndSchedule(newClassForms);
      setNewClassForms([]);
      setActiveTab("existing");
    } finally {
      setIsCreating(false);
    }
  };

  // Reset on modal close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNewClassForms([]);
      setActiveTab("existing");
    }
    onOpenChange(open);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Tự động xếp lịch học
          </DialogTitle>
          <DialogDescription>
            Xếp lịch cho lớp có sẵn hoặc tạo lớp mới và xếp lịch cùng lúc
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "existing" | "create")
          }
          className='flex-1 flex flex-col overflow-hidden'
        >
          <TabsList className='w-full'>
            <TabsTrigger
              value='existing'
              className='flex-1'
            >
              Lớp có sẵn
            </TabsTrigger>
            <TabsTrigger
              value='create'
              className='flex-1'
            >
              Tạo lớp mới
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Existing classes */}
          <TabsContent
            value='existing'
            className='flex-1 overflow-hidden mt-4'
          >
            <div className='h-full flex flex-col'>

              <div className='flex-1 overflow-y-auto space-y-6 pr-2'>
                {loading ? (
                  <div className='flex flex-col items-center justify-center py-12'>
                    <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
                    <p className='text-muted-foreground'>
                      Đang tải danh sách lớp học...
                    </p>
                  </div>
                ) : availableClasses.length === 0 ? (
                  <div className='text-center py-12'>
                    <p className='text-muted-foreground'>
                      Không có lớp học nào cần xếp lịch
                    </p>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {availableClasses.map((classItem) => {
                      const isFullyScheduled =
                        isClassFullyScheduled(classItem);
                      const isSelected = selectedClassIds.includes(
                        classItem._id
                      );
                      const config = classScheduleConfigs[classItem._id];
                      const remainingSessions =
                        getRemainingSessionsCount(classItem);

                      return (
                        <div
                          key={classItem._id}
                          className={`border rounded-lg transition-all ${
                            isFullyScheduled
                              ? "opacity-50 bg-muted/20"
                              : isSelected
                              ? "border-primary bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                        >
                          {/* Header: Class selection */}
                          <div
                            className={`p-4 flex items-center gap-3 ${
                              !isFullyScheduled ? "cursor-pointer" : ""
                            }`}
                            onClick={() => {
                              if (!isFullyScheduled) {
                                onClassToggle(classItem._id);
                              }
                            }}
                          >
                      <Checkbox
                        checked={isSelected}
                        disabled={isFullyScheduled}
                        onCheckedChange={() => {
                          if (!isFullyScheduled) {
                            onClassToggle(classItem._id);
                          }
                        }}
                      />
                      <div className='flex-1'>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-semibold'>{classItem.name}</h3>
                          {isFullyScheduled && (
                            <Badge variant='secondary'>Đã đủ lịch</Badge>
                          )}
                          {!isFullyScheduled && (
                            <Badge
                              variant='outline'
                              className='text-orange-600'
                            >
                              Còn {remainingSessions} buổi
                            </Badge>
                          )}
                        </div>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {classItem.course?.title || "Không xác định"} •{" "}
                          {classItem.course?.session_number || 0} buổi học
                        </p>
                      </div>
                    </div>

                    {/* Expanded config when selected */}
                    {isSelected && config && (
                      <>
                        <Separator />
                        <div className='p-4 space-y-4 bg-muted/30'>
                          {/* Time Range */}
                          <div>
                            <Label className='text-sm font-medium mb-3 block'>
                              Khung giờ học
                            </Label>
                            <div className='flex items-center gap-4'>
                              <div className='flex-1'>
                                <Label className='text-xs text-muted-foreground'>
                                  Từ giờ
                                </Label>
                                <Input
                                  type='number'
                                  min={0}
                                  max={23}
                                  value={config.min_time}
                                  onChange={(e) =>
                                    onTimeChange(
                                      classItem._id,
                                      "min_time",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className='mt-1'
                                />
                              </div>
                              <span className='text-muted-foreground mt-6'>
                                →
                              </span>
                              <div className='flex-1'>
                                <Label className='text-xs text-muted-foreground'>
                                  Đến giờ
                                </Label>
                                <Input
                                  type='number'
                                  min={0}
                                  max={23}
                                  value={config.max_time}
                                  onChange={(e) =>
                                    onTimeChange(
                                      classItem._id,
                                      "max_time",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className='mt-1'
                                />
                              </div>
                            </div>
                          </div>

                          {/* Days selection */}
                          <div>
                            <Label className='text-sm font-medium mb-3 block'>
                              Chọn ngày học (
                              {config.array_number_in_week.length} ngày)
                            </Label>
                            <div className='flex gap-2'>
                              {dayNames.map((day) => {
                                const isSelected =
                                  config.array_number_in_week.includes(
                                    day.value
                                  );
                                return (
                                  <Button
                                    key={day.value}
                                    variant={isSelected ? "default" : "outline"}
                                    size='sm'
                                    onClick={() =>
                                      onDayToggle(classItem._id, day.value)
                                    }
                                    className='flex-1'
                                  >
                                    {day.label}
                                  </Button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Summary */}
                          {config.array_number_in_week.length > 0 && (
                            <div className='text-sm text-muted-foreground bg-background p-3 rounded border'>
                              Học {config.session_in_week} buổi/tuần từ{" "}
                              {config.min_time}:00 - {config.max_time}:00
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between pt-4 border-t'>
          <div className='text-sm text-muted-foreground'>
            {selectedClassIds.length > 0
              ? `Đã chọn ${selectedClassIds.length} lớp học`
              : "Chưa chọn lớp học nào"}
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isScheduling}
            >
              Hủy
            </Button>
            <Button
              onClick={onSubmit}
              disabled={selectedClassIds.length === 0 || isScheduling}
            >
              {isScheduling ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang xếp lịch...
                </>
              ) : (
                "Xếp lịch tự động"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
