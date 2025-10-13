"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { type ScheduleEvent } from "@/api/schedule-api";
import { type SlotDetail } from "@/api/slot-api";
import {
  useCachedAPI,
  usePerformanceMonitor,
  apiCache,
} from "@/hooks/use-api-cache";

// Types for unified calendar
interface CalendarClass {
  id: string;
  name: string;
  course: string;
  students: number;
  pool: string;
  instructor?: string;
  color: string;
  scheduleId: string;
}

interface CalendarSlot {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  date: Date;
  classes: CalendarClass[];
  isEmpty: boolean;
  isPast: boolean;
  capacity: number;
}

interface UnifiedCalendarProps {
  scheduleEvents: ScheduleEvent[];
  allSlots: SlotDetail[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

// Color palette for classes
const CLASS_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-red-500",
  "bg-teal-500",
];

export default function UnifiedCalendar({
  scheduleEvents,
  allSlots,
  loading,
  onRefresh,
}: UnifiedCalendarProps) {
  usePerformanceMonitor("UnifiedCalendar");

  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPool, setFilterPool] = useState<string>("all");
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [quickEditClass, setQuickEditClass] = useState<CalendarClass | null>(
    null
  );

  // Generate week dates
  const weekDates = useMemo(() => {
    const start = startOfWeek(currentWeek, { locale: vi });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentWeek]);

  // Transform data to unified format
  const calendarSlots = useMemo(() => {
    if (!allSlots || allSlots.length === 0) return [];

    const slots: CalendarSlot[] = [];

    // For each day of the week
    weekDates.forEach((date) => {
      // For each time slot
      allSlots.forEach((slot) => {
        const dateStr = format(date, "yyyy-MM-dd");

        // Find schedule events for this date and slot
        const slotEvents = scheduleEvents.filter((event) => {
          const eventDate = format(new Date(event.date), "yyyy-MM-dd");
          const eventSlots = Array.isArray(event.slot)
            ? event.slot
            : [event.slot];
          return (
            eventDate === dateStr &&
            eventSlots.some((s) => s && s._id === slot._id)
          );
        });

        // Transform events to calendar classes
        const classes: CalendarClass[] = slotEvents.map((event, index) => {
          const classrooms = Array.isArray(event.classroom)
            ? event.classroom
            : [event.classroom];
          const classroom = classrooms[0];

          return {
            id: `${event._id}-${index}`,
            name: classroom?.name || "Unknown Class",
            course: classroom?.course || "",
            students: 0, // Would need to fetch from API
            pool: "Pool 1", // Would need to determine from data
            instructor: "", // Would need to fetch from API
            color: CLASS_COLORS[index % CLASS_COLORS.length],
            scheduleId: event._id,
          };
        });

        slots.push({
          id: `${dateStr}-${slot._id}`,
          title: slot.title,
          startTime: `${slot.start_time
            .toString()
            .padStart(2, "0")}:${slot.start_minute
            .toString()
            .padStart(2, "0")}`,
          endTime: `${slot.end_time
            .toString()
            .padStart(2, "0")}:${slot.end_minute.toString().padStart(2, "0")}`,
          duration: slot.duration
            ? parseInt(slot.duration.replace(" phút", ""))
            : 45,
          date,
          classes,
          isEmpty: classes.length === 0,
          isPast: date < new Date() && !isSameDay(date, new Date()),
          capacity: 3, // Max classes per slot
        });
      });
    });

    return slots;
  }, [scheduleEvents, allSlots, weekDates]);

  // Filter slots based on search and filters
  const filteredSlots = useMemo(() => {
    return calendarSlots.filter((slot) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const hasMatchingClass = slot.classes.some(
          (cls) =>
            cls.name.toLowerCase().includes(searchLower) ||
            cls.course.toLowerCase().includes(searchLower)
        );
        if (
          !hasMatchingClass &&
          !slot.title.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      if (filterPool !== "all") {
        const hasMatchingPool = slot.classes.some(
          (cls) => cls.pool === filterPool
        );
        if (!hasMatchingPool && slot.isEmpty) {
          return false;
        }
      }

      return true;
    });
  }, [calendarSlots, searchTerm, filterPool]);

  // Handle drag and drop
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      // Extract class ID and slot IDs
      const classId = draggableId;
      const sourceSlotId = source.droppableId;
      const destSlotId = destination.droppableId;

      console.log(
        `Moving class ${classId} from ${sourceSlotId} to ${destSlotId}`
      );

      // Optimistic update - update UI immediately
      // In a real app, you would:
      // 1. Update local state optimistically
      // 2. Make API call in background
      // 3. Revert on failure or confirm on success

      try {
        // API call would go here
        // await moveClassToSlot(classId, destSlotId);

        // Refresh data
        await onRefresh();
      } catch (error) {
        console.error("Failed to move class:", error);
        // Revert optimistic update
      }
    },
    [onRefresh]
  );

  // Quick add class
  const handleQuickAddClass = useCallback(async (slotId: string) => {
    console.log(`Quick add class to slot ${slotId}`);
    setSelectedSlot(slotId);
    setIsAddingClass(true);
  }, []);

  // Quick delete class
  const handleQuickDeleteClass = useCallback(
    async (classId: string) => {
      console.log(`Quick delete class ${classId}`);

      // Optimistic update
      try {
        // API call would go here
        // await deleteClass(classId);

        await onRefresh();
      } catch (error) {
        console.error("Failed to delete class:", error);
      }
    },
    [onRefresh]
  );

  // Navigation
  const navigateWeek = useCallback((direction: "prev" | "next") => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      return newDate;
    });
  }, []);

  // Render time slot
  const renderTimeSlot = (slot: CalendarSlot) => {
    return (
      <ContextMenu key={slot.id}>
        <ContextMenuTrigger>
          <Droppable droppableId={slot.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  min-h-[80px] p-2 border rounded-lg transition-all duration-200
                  ${
                    snapshot.isDraggingOver
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-gray-200 dark:border-gray-700"
                  }
                  ${
                    slot.isPast
                      ? "bg-gray-100 dark:bg-gray-900 opacity-60"
                      : "bg-white dark:bg-gray-800"
                  }
                  ${
                    slot.isEmpty
                      ? "hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                      : ""
                  }
                `}
              >
                {/* Slot header */}
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-xs font-medium text-gray-600 dark:text-gray-300'>
                    {slot.startTime} - {slot.endTime}
                  </span>
                  <Badge
                    variant='outline'
                    className='text-xs'
                  >
                    {slot.classes.length}/{slot.capacity}
                  </Badge>
                </div>

                {/* Classes */}
                <div className='space-y-1'>
                  {slot.classes.map((classItem, index) => (
                    <Draggable
                      key={classItem.id}
                      draggableId={classItem.id}
                      index={index}
                      isDragDisabled={slot.isPast}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`
                            ${classItem.color} text-white text-xs p-2 rounded
                            cursor-move hover:opacity-80 transition-all duration-200
                            ${
                              snapshot.isDragging
                                ? "rotate-2 scale-105 shadow-lg"
                                : ""
                            }
                          `}
                          onDoubleClick={() => setQuickEditClass(classItem)}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='font-medium truncate'>
                              {classItem.name}
                            </span>
                            <Users className='h-3 w-3 flex-shrink-0' />
                          </div>
                          <div className='text-xs opacity-80 truncate'>
                            {classItem.pool}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {/* Quick add button */}
                  {slot.isEmpty && !slot.isPast && (
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full h-8 text-xs border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20'
                      onClick={() => handleQuickAddClass(slot.id)}
                    >
                      <Plus className='h-3 w-3 mr-1' />
                      Thêm lớp
                    </Button>
                  )}
                </div>

                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem onClick={() => handleQuickAddClass(slot.id)}>
            <Plus className='h-4 w-4 mr-2' />
            Thêm lớp học
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Copy className='h-4 w-4 mr-2' />
            Copy từ slot khác
          </ContextMenuItem>
          <ContextMenuItem>
            <Settings className='h-4 w-4 mr-2' />
            Cài đặt slot
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <CalendarIcon className='h-12 w-12 mx-auto mb-4 text-gray-400 animate-pulse' />
          <div className='text-lg font-medium'>Đang tải lịch...</div>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className='space-y-6'>
        {/* Header Controls */}
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='flex items-center gap-4'>
            {/* Week Navigation */}
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigateWeek("prev")}
              >
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <div className='text-lg font-semibold min-w-[200px] text-center'>
                {format(weekDates[0], "dd MMM", { locale: vi })} -{" "}
                {format(weekDates[6], "dd MMM yyyy", { locale: vi })}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigateWeek("next")}
              >
                <ChevronRight className='h-4 w-4' />
              </Button>
            </div>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setCurrentWeek(new Date())}
            >
              Hôm nay
            </Button>
          </div>

          {/* Search and Filters */}
          <div className='flex items-center gap-2'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Tìm lớp học...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 w-48'
              />
            </div>

            <Select
              value={filterPool}
              onValueChange={setFilterPool}
            >
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả</SelectItem>
                <SelectItem value='Pool 1'>Pool 1</SelectItem>
                <SelectItem value='Pool 2'>Pool 2</SelectItem>
                <SelectItem value='Pool 3'>Pool 3</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant='outline'
              size='sm'
              onClick={onRefresh}
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card>
          <CardContent className='p-0'>
            <div className='grid grid-cols-8 gap-0 border'>
              {/* Time column header */}
              <div className='p-4 bg-gray-50 dark:bg-gray-900 border-r font-semibold text-center'>
                <Clock className='h-4 w-4 mx-auto mb-1' />
                Giờ
              </div>

              {/* Day headers */}
              {weekDates.map((date) => (
                <div
                  key={date.toISOString()}
                  className={`
                    p-4 border-r text-center
                    ${
                      isSameDay(date, new Date())
                        ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                        : "bg-gray-50 dark:bg-gray-900"
                    }
                  `}
                >
                  <div className='font-semibold'>
                    {format(date, "EEE", { locale: vi })}
                  </div>
                  <div
                    className={`text-sm ${
                      isSameDay(date, new Date())
                        ? "text-blue-600 font-bold"
                        : "text-gray-600"
                    }`}
                  >
                    {format(date, "dd/MM")}
                  </div>
                </div>
              ))}

              {/* Time slots grid */}
              {allSlots?.map((timeSlot) => (
                <React.Fragment key={timeSlot._id}>
                  {/* Time label */}
                  <div className='p-4 border-r border-t bg-gray-50 dark:bg-gray-900 text-center font-medium text-sm'>
                    {timeSlot.title}
                    <div className='text-xs text-gray-500 mt-1'>
                      {timeSlot.start_time.toString().padStart(2, "0")}:
                      {timeSlot.start_minute.toString().padStart(2, "0")} -
                      {timeSlot.end_time.toString().padStart(2, "0")}:
                      {timeSlot.end_minute.toString().padStart(2, "0")}
                    </div>
                  </div>

                  {/* Day slots */}
                  {weekDates.map((date) => {
                    const slotId = `${format(date, "yyyy-MM-dd")}-${
                      timeSlot._id
                    }`;
                    const slot = filteredSlots.find((s) => s.id === slotId);

                    return (
                      <div
                        key={slotId}
                        className='border-r border-t p-2'
                      >
                        {slot ? (
                          renderTimeSlot(slot)
                        ) : (
                          <div className='min-h-[80px] flex items-center justify-center text-gray-400 text-xs'>
                            Không có dữ liệu
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <Users className='h-5 w-5 text-blue-500' />
              <div>
                <div className='text-2xl font-bold'>
                  {calendarSlots.reduce(
                    (sum, slot) => sum + slot.classes.length,
                    0
                  )}
                </div>
                <div className='text-sm text-gray-600'>Tổng lớp học</div>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <Clock className='h-5 w-5 text-green-500' />
              <div>
                <div className='text-2xl font-bold'>
                  {calendarSlots.filter((s) => s.isEmpty).length}
                </div>
                <div className='text-sm text-gray-600'>Slot trống</div>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <CalendarIcon className='h-5 w-5 text-purple-500' />
              <div>
                <div className='text-2xl font-bold'>
                  {allSlots?.length || 0}
                </div>
                <div className='text-sm text-gray-600'>Khung giờ</div>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-2'>
              <Settings className='h-5 w-5 text-orange-500' />
              <div>
                <div className='text-2xl font-bold'>
                  {Math.round(
                    (calendarSlots.filter((s) => !s.isEmpty).length /
                      calendarSlots.length) *
                      100
                  ) || 0}
                  %
                </div>
                <div className='text-sm text-gray-600'>Tỷ lệ sử dụng</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DragDropContext>
  );
}
