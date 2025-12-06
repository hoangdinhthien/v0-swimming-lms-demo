"use client";

import React from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

interface AutoScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: AutoScheduleModalProps) {
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

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            Tự động xếp lịch học
          </DialogTitle>
          <DialogDescription>
            Chọn lớp học và thiết lập thời gian cho từng lớp
          </DialogDescription>
        </DialogHeader>

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
                const isFullyScheduled = isClassFullyScheduled(classItem);
                const isSelected = selectedClassIds.includes(classItem._id);
                const config = classScheduleConfigs[classItem._id];
                const remainingSessions = getRemainingSessionsCount(classItem);

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
