"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

export interface CalendarEvent {
  scheduleId: string;
  classroomId: string;
  className: string;
  slotId: string;
  slotTitle: string;
  slotTime: string;
  date: string; // YYYY-MM-DD format for easier filtering
  course: string;
  courseId: string;
  poolId: string;
  poolTitle: string;
  instructorId: string;
  instructorName: string;
  color: string;
}

interface ScheduleCalendarProps {
  currentDate: Dayjs;
  selectedDate?: Dayjs;
  events: CalendarEvent[];
  onDateSelect: (date: Dayjs) => void;
  onMonthChange: (date: Dayjs) => void;
  dateCellRender?: (date: Dayjs, events: CalendarEvent[]) => React.ReactNode;
  className?: string;
}

export function ScheduleCalendar({
  currentDate,
  selectedDate,
  events,
  onDateSelect,
  onMonthChange,
  dateCellRender,
  className,
}: ScheduleCalendarProps) {
  const today = dayjs();

  // Get calendar grid (6 weeks x 7 days)
  const getCalendarGrid = () => {
    const startOfMonth = currentDate.startOf("month");
    const endOfMonth = currentDate.endOf("month");

    // Start from Monday instead of Sunday
    let startDate = startOfMonth.startOf("week");
    // If startDate is Sunday, move to Monday
    if (startDate.day() === 0) {
      startDate = startDate.add(1, "day");
    }

    // Get the Monday of the week containing the start of month
    const startDay = startOfMonth.day(); // 0=Sun, 1=Mon, 2=Tue, ...
    const daysFromMonday = startDay === 0 ? 6 : startDay - 1; // Distance from Monday
    startDate = startOfMonth.subtract(daysFromMonday, "day");

    // End on Sunday (last day of the week containing end of month)
    const endDay = endOfMonth.day();
    const daysToSunday = endDay === 0 ? 0 : 7 - endDay;
    const endDate = endOfMonth.add(daysToSunday, "day");

    const weeks: Dayjs[][] = [];
    let currentWeek: Dayjs[] = [];
    let day = startDate;

    while (day.isBefore(endDate) || day.isSame(endDate, "day")) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      day = day.add(1, "day");
    }

    return weeks;
  };

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    const dateStr = date.format("YYYY-MM-DD");
    return events.filter((event) => {
      return event.date === dateStr;
    });
  };

  // Handle previous month
  const handlePrevMonth = () => {
    onMonthChange(currentDate.subtract(1, "month"));
  };

  // Handle next month
  const handleNextMonth = () => {
    onMonthChange(currentDate.add(1, "month"));
  };

  // Handle month select
  const handleMonthSelect = (monthStr: string) => {
    const month = parseInt(monthStr);
    onMonthChange(currentDate.month(month));
  };

  // Handle year select
  const handleYearSelect = (yearStr: string) => {
    const year = parseInt(yearStr);
    onMonthChange(currentDate.year(year));
  };

  // Generate year options (current year ± 5 years)
  const getYearOptions = () => {
    const currentYear = dayjs().year();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  };

  // Month names in Vietnamese
  const monthNames = [
    "Tháng 1",
    "Tháng 2",
    "Tháng 3",
    "Tháng 4",
    "Tháng 5",
    "Tháng 6",
    "Tháng 7",
    "Tháng 8",
    "Tháng 9",
    "Tháng 10",
    "Tháng 11",
    "Tháng 12",
  ];

  // Day names in Vietnamese (start from Monday)
  const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  const weeks = getCalendarGrid();

  return (
    <div className={cn("w-full", className)}>
      {/* Header with navigation */}
      <div className='flex items-center justify-between mb-6 px-2 py-2'>
        <Button
          variant='outline'
          size='icon'
          onClick={handlePrevMonth}
          className='h-8 w-8'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        <div className='flex items-center gap-2'>
          <Select
            value={currentDate.month().toString()}
            onValueChange={handleMonthSelect}
          >
            <SelectTrigger className='w-[130px] h-8'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((name, index) => (
                <SelectItem
                  key={index}
                  value={index.toString()}
                >
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentDate.year().toString()}
            onValueChange={handleYearSelect}
          >
            <SelectTrigger className='w-[100px] h-8'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((year) => (
                <SelectItem
                  key={year}
                  value={year.toString()}
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant='outline'
          size='icon'
          onClick={handleNextMonth}
          className='h-8 w-8'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Calendar grid */}
      <div className='border rounded-lg overflow-hidden bg-card'>
        {/* Day headers */}
        <div className='grid grid-cols-7 border-b bg-muted/50'>
          {dayNames.map((day, index) => (
            <div
              key={index}
              className='text-center py-3 text-sm font-medium text-muted-foreground'
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        {weeks.map((week, weekIndex) => (
          <div
            key={weekIndex}
            className='grid grid-cols-7'
          >
            {week.map((date, dayIndex) => {
              const isToday = date.isSame(today, "day");
              const isSelected =
                selectedDate && date.isSame(selectedDate, "day");
              const isCurrentMonth = date.month() === currentDate.month();
              const isPast = date.isBefore(today, "day");
              const dateEvents = getEventsForDate(date);

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "min-h-[140px] border-b border-r last:border-r-0",
                    weekIndex === weeks.length - 1 && "border-b-0"
                  )}
                >
                  <button
                    onClick={() => onDateSelect(date)}
                    className={cn(
                      "w-full h-full p-3 text-left transition-colors hover:bg-accent",
                      !isCurrentMonth && "text-muted-foreground/50",
                      isPast && "opacity-60",
                      isSelected && "bg-accent"
                    )}
                  >
                    {/* Date number */}
                    <div className='flex items-center justify-between mb-1'>
                      <span
                        className={cn(
                          "text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                          isToday &&
                            "bg-primary text-primary-foreground font-semibold"
                        )}
                      >
                        {date.date()}
                      </span>
                    </div>

                    {/* Custom render or default event list */}
                    {dateCellRender ? (
                      dateCellRender(date, dateEvents)
                    ) : (
                      <div className='space-y-1'>
                        {dateEvents.length === 0 ? (
                          <div className='text-xs text-muted-foreground text-center py-2'>
                            Chưa có lớp học
                          </div>
                        ) : (
                          <ul className='space-y-1 max-h-[90px] overflow-y-auto'>
                            {dateEvents.map((event, index) => (
                              <li key={index}>
                                <div
                                  className='text-xs px-2 py-1 rounded truncate'
                                  style={{
                                    backgroundColor: `${event.color}15`,
                                    borderLeft: `3px solid ${event.color}`,
                                  }}
                                >
                                  <span className='font-medium'>
                                    {event.slotTitle}
                                  </span>
                                  {" - "}
                                  <span>{event.className}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
