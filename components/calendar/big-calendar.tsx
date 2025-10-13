"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";
import "react-big-calendar/lib/css/react-big-calendar.css";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Edit,
  Eye,
  Plus,
  Trash2,
  Settings,
} from "lucide-react";

import { type ScheduleEvent } from "@/api/schedule-api";
import { type SlotDetail } from "@/api/slot-api";

// Configure the localizer for Vietnamese locale
const locales = {
  vi: vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Define custom messages in Vietnamese
const messages = {
  allDay: "Cả ngày",
  previous: "Trước",
  next: "Tiếp",
  today: "Hôm nay",
  month: "Tháng",
  week: "Tuần",
  day: "Ngày",
  agenda: "Lịch trình",
  date: "Ngày",
  time: "Thời gian",
  event: "Sự kiện",
  noEventsInRange: "Không có lớp học nào trong khoảng thời gian này.",
  showMore: (total: number) => `+${total} lớp khác`,
};

interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    scheduleEvent: ScheduleEvent;
    classroom: any;
    slot: any;
    type: "class";
  };
}

interface BigCalendarProps {
  scheduleEvents: ScheduleEvent[];
  allSlots: SlotDetail[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

export default function BigCalendar({
  scheduleEvents,
  allSlots,
  loading,
  onRefresh,
}: BigCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<string>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  // Initialize view and date from URL params
  useEffect(() => {
    const viewFromUrl = searchParams.get("view");
    const dateFromUrl = searchParams.get("date");
    const weekFromUrl = searchParams.get("week");

    if (
      viewFromUrl &&
      [Views.MONTH, Views.WEEK, Views.DAY].includes(viewFromUrl as any)
    ) {
      setView(viewFromUrl);
    }

    if (dateFromUrl) {
      const parsedDate = new Date(dateFromUrl);
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
      }
    } else if (weekFromUrl) {
      // Handle week parameter for backward compatibility with old calendar
      // Format: "2025-W02" -> get the Monday of that week
      const [year, weekStr] = weekFromUrl.split("-W");
      if (year && weekStr) {
        const weekNumber = parseInt(weekStr);
        const weekStart = getWeekStart(parseInt(year), weekNumber);
        setDate(weekStart);
        setView(Views.WEEK); // Force week view when week param is provided
      }
    }
  }, [searchParams]);

  // Update URL when view or date changes
  const updateUrl = (newView: string, newDate: Date) => {
    const url = new URL(window.location.href);
    url.searchParams.set("view", newView);
    url.searchParams.set("date", newDate.toISOString().split("T")[0]);

    // Also maintain week parameter for backward compatibility
    if (newView === Views.WEEK) {
      const year = newDate.getFullYear();
      const weekNumber = getWeekNumber(newDate);
      url.searchParams.set(
        "week",
        `${year}-W${weekNumber.toString().padStart(2, "0")}`
      );
    } else {
      url.searchParams.delete("week");
    }

    window.history.replaceState({}, "", url.toString());
  };

  // Helper function to get week number from date
  const getWeekNumber = (date: Date): number => {
    const target = new Date(date);
    const firstJan = new Date(target.getFullYear(), 0, 1);
    const dayOfYear = (target.getTime() - firstJan.getTime()) / 86400000 + 1;
    return Math.ceil(dayOfYear / 7);
  };

  // Helper function to get week start date from year and week number
  const getWeekStart = (year: number, weekNumber: number): Date => {
    const jan1 = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
    return startOfWeek(
      new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000),
      { locale: vi }
    );
  };

  // Transform schedule events to Big Calendar format
  const calendarEvents: BigCalendarEvent[] = useMemo(() => {
    return scheduleEvents
      .map((scheduleEvent) => {
        // Handle both array and single object cases
        const slots = Array.isArray(scheduleEvent.slot)
          ? scheduleEvent.slot
          : [scheduleEvent.slot];
        const classrooms = Array.isArray(scheduleEvent.classroom)
          ? scheduleEvent.classroom
          : [scheduleEvent.classroom];

        const slot = slots[0];
        const classroom = classrooms[0];

        if (!slot || !classroom) return null;

        // Create start and end times
        const eventDate = new Date(scheduleEvent.date);
        const startTime = new Date(eventDate);
        startTime.setHours(slot.start_time, slot.start_minute, 0, 0);

        const endTime = new Date(eventDate);
        endTime.setHours(slot.end_time, slot.end_minute, 0, 0);

        return {
          id: scheduleEvent._id,
          title: classroom.name,
          start: startTime,
          end: endTime,
          resource: {
            scheduleEvent,
            classroom,
            slot,
            type: "class" as const,
          },
        };
      })
      .filter((event): event is BigCalendarEvent => event !== null);
  }, [scheduleEvents]);

  // Custom event component with dropdown
  const EventComponent = ({ event }: { event: BigCalendarEvent }) => {
    const { classroom, slot, scheduleEvent } = event.resource;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className='group text-xs p-1 h-full flex flex-col justify-between bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 dark:hover:from-slate-600 dark:hover:via-slate-500 dark:hover:to-slate-600 rounded border border-blue-200/60 hover:border-blue-300/80 dark:border-slate-600/60 dark:hover:border-slate-500/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer relative overflow-hidden'>
            <div className='font-medium text-blue-800 dark:text-blue-100 truncate relative z-10'>
              {classroom.name}
            </div>
            <div className='text-blue-600 dark:text-blue-200 text-[10px] relative z-10'>
              {slot.title}
            </div>

            {/* Hover shimmer effect */}
            <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out'></div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200/60 dark:border-slate-700/60 shadow-2xl rounded-2xl p-2 animate-in fade-in-0 zoom-in-95 duration-200'>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Navigate to class detail page
              if (classroom._id) {
                router.push(
                  `/dashboard/manager/class/${classroom._id}?from=calendar`
                );
              }
            }}
            className='cursor-pointer group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-slate-800/50 dark:hover:to-slate-700/50 transition-all duration-300 hover:shadow-md border-0 focus:bg-gradient-to-r focus:from-blue-50 focus:to-indigo-50 dark:focus:from-slate-800/50 dark:focus:to-slate-700/50'
          >
            <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110'>
              <Eye className='w-4 h-4 text-white' />
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-gray-700 dark:text-gray-200 group-hover:text-blue-700 dark:group-hover:text-gray-100 transition-colors duration-200'>
                Xem lớp học
              </span>
              <span className='text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-gray-300'>
                Chi tiết thông tin lớp
              </span>
            </div>
          </DropdownMenuItem>

          <div className='h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-2'></div>

          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Navigate to slot details page
              const eventDate = new Date(scheduleEvent.date);
              const dateStr = eventDate.toISOString().split("T")[0];

              router.push(
                `/dashboard/manager/schedule/slot-details?scheduleId=${
                  scheduleEvent._id
                }&slotId=${
                  slot._id
                }&date=${dateStr}&slotTitle=${encodeURIComponent(slot.title)}`
              );
            }}
            className='cursor-pointer group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300 hover:shadow-md border-0 focus:bg-slate-100 dark:focus:bg-slate-800/50'
          >
            <div className='w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110'>
              <Clock className='w-4 h-4 text-slate-600 dark:text-slate-300' />
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-200'>
                Chi tiết slot
              </span>
              <span className='text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'>
                Xem thông tin khung giờ
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Handle event selection
  const handleSelectEvent = (event: BigCalendarEvent) => {
    const { scheduleEvent, classroom } = event.resource;

    // Navigate to class detail page
    if (classroom._id) {
      router.push(`/dashboard/manager/class/${classroom._id}?from=calendar`);
    }
  };

  // Handle slot selection (empty time slot)
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    // Check if the selected slot is in the past or current date
    const now = new Date();
    const selectedDate = new Date(start);
    selectedDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    if (selectedDate <= now) {
      console.log("Cannot add class to past or current date");
      return;
    }

    // Find the slot that matches this time
    const matchingSlot = allSlots?.find((slot) => {
      // Create a date with the slot's time
      const slotHour = slot.start_time;
      const slotMinute = slot.start_minute;

      const slotTime = new Date(start);
      slotTime.setHours(slotHour, slotMinute, 0, 0);

      // Compare with a tolerance of 15 minutes to account for calendar rounding
      const timeDiff = Math.abs(slotTime.getTime() - start.getTime());
      return timeDiff < 15 * 60 * 1000; // 15 minutes in milliseconds
    });

    if (matchingSlot) {
      const dateStr = start.toISOString().split("T")[0];
      console.log(`Adding class to slot ${matchingSlot.title} on ${dateStr}`);

      router.push(
        `/dashboard/manager/schedule/slot-details?slotId=${
          matchingSlot._id
        }&date=${dateStr}&slotTitle=${encodeURIComponent(
          matchingSlot.title
        )}&mode=add-class`
      );
    } else {
      console.log("No matching slot found for selected time", start);
    }
  };

  // Handle navigation
  const handleNavigate = (newDate: Date, newView: string) => {
    setDate(newDate);
    updateUrl(newView, newDate);
  };

  // Handle view change
  const handleViewChange = (newView: string) => {
    setView(newView);
    updateUrl(newView, date);
  };

  // Custom toolbar
  const CustomToolbar = ({
    date,
    view,
    onNavigate,
    onView,
  }: {
    date: Date;
    view: string;
    onNavigate: (action: string) => void;
    onView: (view: string) => void;
  }) => {
    return (
      <div className='flex items-center justify-between p-4 bg-card border-b'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onNavigate("PREV")}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onNavigate("TODAY")}
            >
              Hôm nay
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => onNavigate("NEXT")}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>

          <div className='text-lg font-semibold'>
            {format(date, view === Views.MONTH ? "MMMM yyyy" : "dd MMMM yyyy", {
              locale: vi,
            })}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant={view === Views.MONTH ? "default" : "outline"}
            onClick={() => onView(Views.MONTH)}
          >
            Tháng
          </Button>
          <Button
            size='sm'
            variant={view === Views.WEEK ? "default" : "outline"}
            onClick={() => onView(Views.WEEK)}
          >
            Tuần
          </Button>
          <Button
            size='sm'
            variant={view === Views.DAY ? "default" : "outline"}
            onClick={() => onView(Views.DAY)}
          >
            Ngày
          </Button>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Card className='w-full h-[600px]'>
        <CardContent className='p-6 flex items-center justify-center h-full'>
          <div className='text-center'>
            <CalendarIcon className='h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse' />
            <div className='text-lg font-medium'>Đang tải lịch...</div>
            <div className='text-sm text-muted-foreground'>
              Vui lòng đợi trong giây lát
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardContent className='p-0'>
        <div
          className='calendar-container'
          style={{ height: "600px" }}
        >
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor='start'
            endAccessor='end'
            style={{ height: "100%" }}
            messages={messages}
            view={view}
            date={date}
            min={new Date(2024, 0, 1, 7, 0)} // Start at 7:00 AM
            max={new Date(2024, 0, 1, 19, 0)} // End at 7:00 PM
            step={45} // 45-minute slots to match our slot system
            timeslots={1} // One timeslot per step
            onNavigate={(newDate: Date, newView?: string) =>
              handleNavigate(newDate, newView || view)
            }
            onView={handleViewChange}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            popup
            components={{
              toolbar: CustomToolbar,
              event: EventComponent,
            }}
            formats={{
              dayHeaderFormat: (date: Date) =>
                format(date, "EEEE, dd/MM", { locale: vi }),
              dayRangeHeaderFormat: ({
                start,
                end,
              }: {
                start: Date;
                end: Date;
              }) =>
                `${format(start, "dd/MM", { locale: vi })} - ${format(
                  end,
                  "dd/MM",
                  { locale: vi }
                )}`,
              monthHeaderFormat: (date: Date) =>
                format(date, "MMMM yyyy", { locale: vi }),
              timeGutterFormat: (date: Date) =>
                format(date, "HH:mm", { locale: vi }),
              eventTimeRangeFormat: ({
                start,
                end,
              }: {
                start: Date;
                end: Date;
              }) =>
                `${format(start, "HH:mm", { locale: vi })} - ${format(
                  end,
                  "HH:mm",
                  { locale: vi }
                )}`,
            }}
            eventPropGetter={() => ({
              className: "cursor-pointer hover:opacity-80 transition-opacity",
            })}
            dayPropGetter={(date: Date) => {
              const today = new Date();
              const isToday = date.toDateString() === today.toDateString();
              const isPast = date < today && !isToday;

              return {
                className: `${isToday ? "rbc-today-bg" : ""} ${
                  isPast ? "rbc-past-bg" : ""
                }`,
              };
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
