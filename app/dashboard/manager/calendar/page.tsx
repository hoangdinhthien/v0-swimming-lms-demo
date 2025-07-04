"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
  Loader2,
  Settings,
  Edit,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fetchMonthSchedule,
  fetchWeekSchedule,
  fetchDateRangeSchedule,
  getWeeksInYear,
  type ScheduleEvent,
  convertApiDayToJsDay,
  convertJsDayToApiDay,
} from "@/api/schedule-api";

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("week");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [availableWeeks, setAvailableWeeks] = useState<any[]>([]);

  // Initialize with current week on component mount
  useEffect(() => {
    const today = new Date();
    const weeks = getWeeksInYear(today);
    setAvailableWeeks(weeks);

    // Find and set the current week that contains today
    const currentWeek = weeks.find((week) => {
      if (week.start && week.end) {
        return today >= week.start && today <= week.end;
      }
      return false;
    });

    if (currentWeek) {
      setSelectedWeek(currentWeek.value);
    } else if (weeks.length > 0) {
      // Fallback to first week if no matching week found
      setSelectedWeek(weeks[0].value);
    }
  }, []); // Run only on component mount

  // Effect to fetch data when component mounts or current date changes
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      setError(null);

      try {
        let events: ScheduleEvent[];
        if (viewMode === "week" && selectedWeek) {
          // Use the selected week object for correct start/end
          const weekObj = availableWeeks.find((w) => w.value === selectedWeek);
          if (weekObj && weekObj.start && weekObj.end) {
            console.log("📅 Fetching week schedule for:", {
              selectedWeek,
              weekStart: weekObj.start,
              weekEnd: weekObj.end,
              weekStartFormatted: weekObj.start.toISOString().split("T")[0],
              weekEndFormatted: weekObj.end.toISOString().split("T")[0],
              weekDates: getCurrentWeekDates().map(
                (d) => d.toISOString().split("T")[0]
              ),
            });
            events = await fetchDateRangeSchedule(weekObj.start, weekObj.end);
          } else {
            console.log("⚠️ Week object not found or missing start/end:", {
              selectedWeek,
              weekObj,
              availableWeeksCount: availableWeeks.length,
            });
            events = [];
          }
        } else {
          // Fetch month data (default)
          events = await fetchMonthSchedule(currentDate);
        }

        console.log("📅 Schedule events received:", {
          eventsCount: events.length,
          events: events.map((e) => ({
            id: e._id,
            date: e.date,
            day_of_week: e.day_of_week,
            classroom: Array.isArray(e.classroom)
              ? e.classroom.map((c) => c.name)
              : [(e.classroom as any)?.name || "Unknown"],
            slot: Array.isArray(e.slot)
              ? e.slot.map((s) => s.title)
              : [(e.slot as any)?.title || "Unknown"],
          })),
        });

        setScheduleEvents(events);
      } catch (err) {
        console.error("Error fetching schedule:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch schedule data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, [currentDate, viewMode, selectedWeek, availableWeeks]); // Effect to update available weeks when current date changes
  useEffect(() => {
    const weeks = getWeeksInYear(currentDate);
    setAvailableWeeks(weeks);

    console.log(
      "🗓️ Available weeks:",
      weeks.slice(0, 5).map((w) => ({
        label: w.label,
        value: w.value,
        start: w.start?.toLocaleDateString("vi-VN"),
        end: w.end?.toLocaleDateString("vi-VN"),
      }))
    ); // Set the current week as default if no week is selected or if the current selected week is not in the new year
    if (
      weeks.length > 0 &&
      (!selectedWeek || !weeks.find((w) => w.value === selectedWeek))
    ) {
      // Try to find the current week that contains today
      const today = new Date();
      const currentWeek = weeks.find((week) => {
        if (week.start && week.end) {
          return today >= week.start && today <= week.end;
        }
        return false;
      });

      if (currentWeek) {
        console.log("🎯 Setting current week:", currentWeek.value);
        setSelectedWeek(currentWeek.value);
      } else {
        console.log("🎯 Setting default week (first):", weeks[0].value);
        setSelectedWeek(weeks[0].value);
      }
    }
  }, [currentDate, selectedWeek]);
  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  };

  // Debug function for week selection
  const handleWeekChange = (weekValue: string) => {
    console.log("📝 Week selection changed:", {
      previousWeek: selectedWeek,
      newWeek: weekValue,
      selectedWeekObject: availableWeeks.find((w) => w.value === weekValue),
    });
    setSelectedWeek(weekValue);
  };

  // Handle view mode change
  const handleViewModeChange = (mode: "month" | "week") => {
    setViewMode(mode);

    // If switching to week view and no week is selected, set current week
    if (mode === "week" && !selectedWeek && availableWeeks.length > 0) {
      const today = new Date();
      const currentWeek = availableWeeks.find((week) => {
        if (week.start && week.end) {
          return today >= week.start && today <= week.end;
        }
        return false;
      });

      if (currentWeek) {
        setSelectedWeek(currentWeek.value);
      } else {
        setSelectedWeek(availableWeeks[0].value);
      }
    }
  };

  // Get current week dates for weekly view
  const getCurrentWeekDates = () => {
    if (!selectedWeek) return [];

    // Find the selected week object from availableWeeks
    const weekObj = availableWeeks.find((w) => w.value === selectedWeek);
    if (weekObj && weekObj.start && weekObj.end) {
      // Return an array of dates from start to end (7 days)
      const weekDates = [];
      let current = new Date(weekObj.start);
      for (let i = 0; i < 7; i++) {
        weekDates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      // Debug log to see the week dates and their day_of_week values
      console.log(
        "[DEBUG] Week dates generated:",
        weekDates.map((d) => ({
          date: d.toISOString().split("T")[0],
          dayOfWeek: d.getDay(), // 0=Sunday, 1=Monday, etc.
          displayName: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()],
        }))
      );

      console.log("[DEBUG] Selected week object:", weekObj);
      console.log(
        "[DEBUG] Available schedule events:",
        scheduleEvents.map((e) => ({
          date: e.date.split("T")[0],
          day_of_week: e.day_of_week,
          classroom: e.classroom[0]?.name,
          slot: e.slot[0]?.title,
        }))
      );

      return weekDates;
    }
    return [];
  }; // Get all unique slots from schedule events, or return default slots if no data
  const getAllSlots = () => {
    // Define all 11 default slots that should always be displayed
    const defaultSlots = [
      {
        _id: "slot1",
        title: "Slot 1",
        start_time: 7,
        start_minute: 0,
        end_time: 7,
        end_minute: 45,
        sortOrder: 420,
        duration: "45 phút",
      },
      {
        _id: "slot2",
        title: "Slot 2",
        start_time: 8,
        start_minute: 0,
        end_time: 8,
        end_minute: 45,
        sortOrder: 480,
        duration: "45 phút",
      },
      {
        _id: "slot3",
        title: "Slot 3",
        start_time: 9,
        start_minute: 0,
        end_time: 9,
        end_minute: 45,
        sortOrder: 540,
        duration: "45 phút",
      },
      {
        _id: "slot4",
        title: "Slot 4",
        start_time: 10,
        start_minute: 0,
        end_time: 10,
        end_minute: 45,
        sortOrder: 600,
        duration: "45 phút",
      },
      {
        _id: "slot5",
        title: "Slot 5",
        start_time: 11,
        start_minute: 0,
        end_time: 11,
        end_minute: 45,
        sortOrder: 660,
        duration: "45 phút",
      },
      {
        _id: "slot6",
        title: "Slot 6",
        start_time: 13,
        start_minute: 0,
        end_time: 13,
        end_minute: 45,
        sortOrder: 780,
        duration: "45 phút",
      },
      {
        _id: "slot7",
        title: "Slot 7",
        start_time: 14,
        start_minute: 0,
        end_time: 14,
        end_minute: 45,
        sortOrder: 840,
        duration: "45 phút",
      },
      {
        _id: "slot8",
        title: "Slot 8",
        start_time: 15,
        start_minute: 0,
        end_time: 15,
        end_minute: 45,
        sortOrder: 900,
        duration: "45 phút",
      },
      {
        _id: "slot9",
        title: "Slot 9",
        start_time: 16,
        start_minute: 0,
        end_time: 16,
        end_minute: 45,
        sortOrder: 960,
        duration: "45 phút",
      },
      {
        _id: "slot10",
        title: "Slot 10",
        start_time: 17,
        start_minute: 0,
        end_time: 17,
        end_minute: 45,
        sortOrder: 1020,
        duration: "45 phút",
      },
      {
        _id: "slot11",
        title: "Slot 11",
        start_time: 18,
        start_minute: 0,
        end_time: 18,
        end_minute: 45,
        sortOrder: 1080,
        duration: "45 phút",
      },
    ];

    // Create a map of actual slots from schedule events
    const actualSlotsMap = new Map();
    scheduleEvents.forEach((event) => {
      const slots = Array.isArray(event.slot) ? event.slot : [event.slot];
      slots.forEach((slot) => {
        if (slot && !actualSlotsMap.has(slot._id)) {
          actualSlotsMap.set(slot._id, {
            ...slot,
            sortOrder: slot.start_time * 60 + slot.start_minute, // For sorting by time
          });
        }
      });
    }); // Just return the default slots - since we always want to show all 11 slots
    // The actual slot data from API will be used when rendering events, not for defining the grid
    return defaultSlots.sort((a, b) => a.sortOrder - b.sortOrder);
  }; // Get events for a specific date and slot
  const getEventsForDateAndSlot = (date: Date, slotId: string) => {
    // Compare only the date part (YYYY-MM-DD) to avoid timezone issues
    const targetDateStr = date.toISOString().split("T")[0];

    // For default slot IDs like "slot1", we need to match by slot title
    const isDefaultSlotId = slotId.startsWith("slot");
    const slotNumber = isDefaultSlotId
      ? parseInt(slotId.replace("slot", ""))
      : null;
    const slotTitle = slotNumber ? `Slot ${slotNumber}` : null;

    console.log(
      `[DEBUG] Looking for events on date ${targetDateStr} for slot ${
        isDefaultSlotId ? `${slotTitle} (${slotId})` : slotId
      }`
    );

    const filtered = scheduleEvents.filter((event) => {
      const eventDateStr = event.date.split("T")[0];
      const slots = Array.isArray(event.slot) ? event.slot : [event.slot];

      // Match either by slot ID or by slot title if it's a default slot
      const hasMatchingSlot = slots.some((slot) => {
        if (!slot) return false;

        if (isDefaultSlotId && slotTitle) {
          return slot.title === slotTitle;
        } else {
          return slot._id === slotId;
        }
      });

      // Debug log for checking event matching
      console.log("[DEBUG] Checking event:", {
        eventDate: eventDateStr,
        targetDate: targetDateStr,
        dateMatch: eventDateStr === targetDateStr,
        eventSlotIds: slots.map((s) => s?._id).filter(Boolean),
        eventSlotTitles: slots.map((s) => s?.title).filter(Boolean),
        targetSlotId: slotId,
        isDefaultSlot: isDefaultSlotId,
        slotTitle: slotTitle,
        slotMatch: hasMatchingSlot,
        finalMatch: eventDateStr === targetDateStr && hasMatchingSlot,
      });

      return eventDateStr === targetDateStr && hasMatchingSlot;
    });

    console.log(
      "[DEBUG] Final filtered events for",
      targetDateStr,
      "slot",
      slotId,
      ":",
      filtered.length,
      filtered.map((e) => ({
        id: e._id,
        date: e.date,
        slotIds: Array.isArray(e.slot)
          ? e.slot.map((s) => (s ? s._id : "undefined"))
          : [(e.slot as any)?._id || "undefined"],
        slotTitles: Array.isArray(e.slot)
          ? e.slot.map((s) => (s ? s.title : "undefined"))
          : [(e.slot as any)?.title || "undefined"],
      }))
    );
    return filtered;
  };

  // Format time display
  const formatSlotTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }

      // If year changed, clear the selected week to reset to first week of new year
      if (newDate.getFullYear() !== prev.getFullYear()) {
        setSelectedWeek("");
      }

      return newDate;
    });
    // Data will be refetched automatically due to the useEffect dependency on currentDate
  };

  // Week navigation function
  const navigateWeek = (direction: "prev" | "next") => {
    if (!selectedWeek || availableWeeks.length === 0) return;

    const currentWeekIndex = availableWeeks.findIndex(
      (w) => w.value === selectedWeek
    );
    if (currentWeekIndex === -1) return;

    let newWeekIndex;
    if (direction === "prev") {
      newWeekIndex = currentWeekIndex - 1;
    } else {
      newWeekIndex = currentWeekIndex + 1;
    }

    // Check if we need to navigate to a different year
    if (newWeekIndex < 0) {
      // Go to previous year, last week
      const prevYear = new Date(currentDate.getFullYear() - 1, 0, 1);
      const prevYearWeeks = getWeeksInYear(prevYear);
      if (prevYearWeeks.length > 0) {
        setCurrentDate(prevYear);
        setSelectedWeek(prevYearWeeks[prevYearWeeks.length - 1].value);
      }
    } else if (newWeekIndex >= availableWeeks.length) {
      // Go to next year, first week
      const nextYear = new Date(currentDate.getFullYear() + 1, 0, 1);
      const nextYearWeeks = getWeeksInYear(nextYear);
      if (nextYearWeeks.length > 0) {
        setCurrentDate(nextYear);
        setSelectedWeek(nextYearWeeks[0].value);
      }
    } else {
      // Stay in same year, just change week
      setSelectedWeek(availableWeeks[newWeekIndex].value);
    }
  };

  // Combined navigation function that works for both month and week views
  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      navigateWeek(direction);
    } else {
      navigateMonth(direction);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };
  const getEventsForDate = (date: Date) => {
    return scheduleEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  // Transform schedule event to display format
  const formatScheduleEvent = (scheduleEvent: ScheduleEvent) => {
    // Handle both array and single object cases
    const slots = Array.isArray(scheduleEvent.slot)
      ? scheduleEvent.slot
      : [scheduleEvent.slot];
    const classrooms = Array.isArray(scheduleEvent.classroom)
      ? scheduleEvent.classroom
      : [scheduleEvent.classroom];

    const slot = slots[0]; // Assuming one slot per event for now
    const classroom = classrooms[0]; // Assuming one classroom per event

    if (!slot || !classroom) return null;

    // Format time display
    const formatTime = (hour: number, minute: number) => {
      return `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
    };

    const startTime = formatTime(slot.start_time, slot.start_minute);
    const endTime = formatTime(slot.end_time, slot.end_minute);

    return {
      id: scheduleEvent._id,
      title: classroom.name,
      time: `${startTime} - ${endTime}`,
      duration: slot.duration,
      slotTitle: slot.title,
      classroom: classroom.name,
      date: new Date(scheduleEvent.date),
      type: "class", // All schedule events are classes
      dayOfWeek: scheduleEvent.day_of_week,
    };
  };
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className='h-32 p-2 bg-muted/30'
        ></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day
      );
      const dayEvents = getEventsForDate(date);
      const isSelected = selectedDate && isSameDay(date, selectedDate);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      days.push(
        <div
          key={day}
          className={`h-32 p-2 border-r border-b border-border cursor-pointer group transition-all duration-200 hover:scale-[1.02] hover:z-10 relative ${
            isToday(date)
              ? "bg-accent border-primary shadow-lg"
              : isSelected
              ? "bg-muted border-primary shadow-md"
              : isWeekend
              ? "bg-muted/50 hover:bg-muted"
              : "bg-card hover:bg-muted/50"
          }`}
          onClick={() => setSelectedDate(date)}
        >
          <div
            className={`text-sm font-semibold mb-2 flex items-center justify-between ${
              isToday(date)
                ? "text-primary"
                : isWeekend
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            <span
              className={
                isToday(date)
                  ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  : ""
              }
            >
              {day}
            </span>
            {dayEvents.length > 0 && (
              <div className='flex items-center gap-1'>
                <div className='w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse'></div>
                <span className='text-xs text-green-600 dark:text-green-400 font-medium'>
                  {dayEvents.length}
                </span>
              </div>
            )}
          </div>
          <div className='space-y-1 overflow-hidden'>
            {dayEvents.slice(0, 3).map((event, index) => {
              const formattedEvent = formatScheduleEvent(event);
              if (!formattedEvent) return null;
              return (
                <div
                  key={formattedEvent.id}
                  className={`text-xs p-2 rounded-md truncate transition-all duration-200 hover:scale-105 shadow-sm ${
                    index === 0
                      ? "bg-muted text-muted-foreground border border-border"
                      : index === 1
                      ? "bg-accent text-accent-foreground border border-border"
                      : "bg-secondary text-secondary-foreground border border-border"
                  }`}
                >
                  <div className='font-medium'>{formattedEvent.title}</div>
                  <div className='text-xs opacity-75'>
                    {formattedEvent.time}
                  </div>
                </div>
              );
            })}
            {dayEvents.length > 3 && (
              <div className='text-xs text-center p-1 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 text-orange-700 dark:text-orange-300 rounded font-medium border border-orange-200 dark:border-orange-700'>
                +{dayEvents.length - 3} sự kiện
              </div>
            )}
          </div>{" "}
          {/* Hover effect overlay */}
          <div className='absolute inset-0 bg-muted/0 group-hover:bg-muted/20 rounded transition-all duration-200 pointer-events-none'></div>
        </div>
      );
    }

    return days;
  }; // Render weekly slot-based calendar view - FINAL: match by date only, weekDates = [start, ..., end]
  const renderWeeklySlotView = () => {
    if (!selectedWeek || availableWeeks.length === 0) return null;

    // Find the selected week object to get correct start/end dates
    const weekObj = availableWeeks.find((w) => w.value === selectedWeek);
    if (!weekObj || !weekObj.start || !weekObj.end) return null;

    // Generate the 7 days of the week (from start to end, inclusive)
    const weekDates: Date[] = [];
    let d = new Date(weekObj.start);
    while (d <= weekObj.end) {
      weekDates.push(new Date(d));
      d = new Date(d);
      d.setDate(d.getDate() + 1);
    }

    // Get all unique slots from the schedule events
    const slots = getAllSlots(); // Helper function: match events by date and slot time
    const getEventsForCell = (date: Date, slotId: string) => {
      const targetDateStr = date.toISOString().split("T")[0];

      // Get the slot information from our default slots
      const targetSlot = getAllSlots().find((s) => s._id === slotId);
      if (!targetSlot) return [];

      const matchedEvents = scheduleEvents.filter((event) => {
        const eventDateStr = event.date.split("T")[0];
        // Match by time and/or title since API slot IDs don't match our default IDs
        const slots = Array.isArray(event.slot) ? event.slot : [event.slot];
        const hasMatchingSlot = slots.some((slot) => {
          if (!slot) return false;

          // Match by exact time values
          const timeMatch =
            slot.start_time === targetSlot.start_time &&
            slot.start_minute === targetSlot.start_minute &&
            slot.end_time === targetSlot.end_time &&
            slot.end_minute === targetSlot.end_minute;

          // Also try to match by slot title (Slot 1, Slot 2, etc.)
          const titleMatch =
            targetSlot.title &&
            slot.title &&
            slot.title.toLowerCase() === targetSlot.title.toLowerCase();

          return (timeMatch || titleMatch) && eventDateStr === targetDateStr;
        });
        return eventDateStr === targetDateStr && hasMatchingSlot;
      });

      // Log what was found for debugging
      if (matchedEvents.length > 0) {
        console.log(
          `[DEBUG] Found ${matchedEvents.length} events for cell on ${targetDateStr}, slot ${targetSlot.title}`,
          matchedEvents.map((e) => ({
            eventId: e._id,
            date: e.date,
            slotInfo: Array.isArray(e.slot) ? e.slot[0] : e.slot,
            actualSlotId:
              Array.isArray(e.slot) && e.slot[0] ? e.slot[0]._id : "unknown",
          }))
        );
      }

      return matchedEvents;
    };

    const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"]; // Monday to Sunday

    return (
      <div className='overflow-x-auto rounded-xl border shadow-inner'>
        <table className='w-full border-collapse bg-card'>
          {/* Header Row */}
          <thead>
            <tr>
              <th className='w-40 p-4 border-r bg-muted text-left font-bold text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-muted-foreground' />
                  Khung Giờ
                </div>
              </th>
              {weekDates.map((date, index) => {
                const isToday =
                  new Date().toDateString() === date.toDateString();
                const isWeekend = index === 6; // Sunday
                return (
                  <th
                    key={index}
                    className={`p-4 border-r text-center font-semibold transition-all duration-200 ${
                      isToday
                        ? "bg-accent text-accent-foreground"
                        : isWeekend
                        ? "bg-muted text-destructive"
                        : "bg-card text-card-foreground"
                    }`}
                  >
                    <div className='flex flex-col space-y-1'>
                      <span
                        className={`text-sm font-bold ${
                          isToday ? "text-primary" : ""
                        }`}
                      >
                        {dayNames[index]}
                      </span>
                      <span
                        className={`text-xs ${
                          isToday
                            ? "bg-primary text-primary-foreground px-2 py-1 rounded-full font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {date.getDate().toString().padStart(2, "0")}/
                        {(date.getMonth() + 1).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          {/* Slots Rows */}
          <tbody>
            {slots.map((slot) => (
              <tr
                key={slot._id}
                className='hover:bg-muted/50 transition-colors duration-200'
              >
                {/* Slot Info Column */}
                <td className='p-4 border-r border-b bg-muted/30'>
                  <div className='space-y-2'>
                    <div className='text-sm font-bold text-foreground'>
                      {slot.title}
                    </div>
                    <div className='text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full text-center border'>
                      {formatSlotTime(slot.start_time, slot.start_minute)} -{" "}
                      {formatSlotTime(slot.end_time, slot.end_minute)}
                    </div>
                  </div>
                </td>
                {/* Days Columns */}
                {weekDates.map((date, dayIndex) => {
                  const eventsInCell = getEventsForCell(date, slot._id);
                  const isToday =
                    new Date().toDateString() === date.toDateString();
                  return (
                    <td
                      key={dayIndex}
                      className={`p-2 border-r border-b h-40 align-top transition-all duration-200 hover:bg-muted/30 ${
                        isToday ? "bg-muted/20" : "bg-background"
                      }`}
                    >
                      <div className='h-full flex flex-col relative'>
                        {/* Settings Icon - Top Right */}
                        <div className='absolute top-0 right-0 z-10'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                className='w-6 h-6 p-0 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700 hover:text-emerald-800 transition-all duration-200 rounded-full opacity-70 hover:opacity-100'
                              >
                                <Edit className='h-3 w-3' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className='w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200/60 dark:border-slate-700/60 shadow-2xl rounded-2xl p-2 animate-in fade-in-0 zoom-in-95 duration-200'>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Find schedule events for this date and slot
                                  const scheduleDate = date
                                    .toISOString()
                                    .split("T")[0];
                                  const eventsForThisSlot = getEventsForCell(
                                    date,
                                    slot._id
                                  );

                                  if (eventsForThisSlot.length > 0) {
                                    // If there are events, use the first event's ID
                                    const scheduleId = eventsForThisSlot[0]._id;
                                    console.log(
                                      "Navigating to schedule details with ID:",
                                      scheduleId
                                    );
                                    router.push(
                                      `/dashboard/manager/schedule/slot-details?scheduleId=${scheduleId}&slotId=${
                                        slot._id
                                      }&date=${scheduleDate}&slotTitle=${encodeURIComponent(
                                        slot.title
                                      )}`
                                    );
                                  } else {
                                    // If no events, navigate with slot information only
                                    console.log(
                                      "No events found for this slot, showing slot info only"
                                    );
                                    router.push(
                                      `/dashboard/manager/schedule/slot-details?slotId=${
                                        slot._id
                                      }&date=${scheduleDate}&slotTitle=${encodeURIComponent(
                                        slot.title
                                      )}`
                                    );
                                  }
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

                              <div className='h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent my-2'></div>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Get formatted date for URL
                                  const formattedDate = date
                                    .toISOString()
                                    .split("T")[0];

                                  // Find the real slot ID from schedule events for this date and slot
                                  // We need to match by slot title since our default slot IDs don't match the API
                                  const targetSlotTitle = slot.title; // e.g., "Slot 1"

                                  console.log(
                                    `Looking for slot "${targetSlotTitle}" on date ${formattedDate}`
                                  );
                                  console.log(
                                    `Available schedule events: ${scheduleEvents.length}`
                                  );

                                  // Find events for this specific date
                                  const eventsForDate = scheduleEvents.filter(
                                    (event) => {
                                      const eventDateStr =
                                        event.date.split("T")[0];
                                      return eventDateStr === formattedDate;
                                    }
                                  );

                                  console.log(
                                    `Found ${eventsForDate.length} events for date ${formattedDate}`
                                  );

                                  // Find the event that matches our slot title
                                  const matchingEvent = eventsForDate.find(
                                    (event) => {
                                      const slots = Array.isArray(event.slot)
                                        ? event.slot
                                        : [event.slot];
                                      return slots.some(
                                        (eventSlot) =>
                                          eventSlot &&
                                          eventSlot.title === targetSlotTitle
                                      );
                                    }
                                  );

                                  let actualSlotId = slot._id; // Default fallback

                                  if (matchingEvent) {
                                    // Get the actual slot ID from the matching event
                                    const slots = Array.isArray(
                                      matchingEvent.slot
                                    )
                                      ? matchingEvent.slot
                                      : [matchingEvent.slot];
                                    const matchingSlot = slots.find(
                                      (eventSlot) =>
                                        eventSlot &&
                                        eventSlot.title === targetSlotTitle
                                    );

                                    if (matchingSlot && matchingSlot._id) {
                                      actualSlotId = matchingSlot._id;
                                      console.log(
                                        `✅ Found real slot ID: ${actualSlotId} for slot "${targetSlotTitle}"`
                                      );
                                    } else {
                                      console.warn(
                                        `⚠️ Matching event found but no valid slot ID for "${targetSlotTitle}"`
                                      );
                                    }
                                  } else {
                                    console.warn(
                                      `⚠️ No matching event found for slot "${targetSlotTitle}" on ${formattedDate}`
                                    );
                                    console.log(
                                      "Available events:",
                                      eventsForDate.map((e) => ({
                                        id: e._id,
                                        date: e.date,
                                        slots: Array.isArray(e.slot)
                                          ? e.slot.map((s) =>
                                              s ? s.title : "undefined"
                                            )
                                          : [
                                              (e.slot as any)?.title ||
                                                "undefined",
                                            ],
                                      }))
                                    );

                                    // Try to find a slot ID from ANY event on ANY date that matches this slot title
                                    // This is a fallback when there's no event for this specific date/slot combination
                                    const anyEventWithMatchingSlot =
                                      scheduleEvents.find((event) => {
                                        const slots = Array.isArray(event.slot)
                                          ? event.slot
                                          : [event.slot];
                                        return slots.some(
                                          (eventSlot) =>
                                            eventSlot &&
                                            eventSlot.title === targetSlotTitle
                                        );
                                      });

                                    if (anyEventWithMatchingSlot) {
                                      const slots = Array.isArray(
                                        anyEventWithMatchingSlot.slot
                                      )
                                        ? anyEventWithMatchingSlot.slot
                                        : [anyEventWithMatchingSlot.slot];
                                      const matchingSlot = slots.find(
                                        (eventSlot) =>
                                          eventSlot &&
                                          eventSlot.title === targetSlotTitle
                                      );

                                      if (matchingSlot && matchingSlot._id) {
                                        actualSlotId = matchingSlot._id;
                                        console.log(
                                          `✅ Found slot ID from other date: ${actualSlotId} for slot "${targetSlotTitle}"`
                                        );
                                      }
                                    } else {
                                      console.error(
                                        `❌ No slot ID found anywhere for "${targetSlotTitle}". The add-class API call may fail.`
                                      );
                                    }
                                  }

                                  // Navigate to the class selection page with the actual slot ID
                                  router.push(
                                    `/dashboard/manager/schedule/add-class?date=${formattedDate}&slotId=${actualSlotId}&slotKey=${
                                      slot._id
                                    }&slotTitle=${encodeURIComponent(
                                      slot.title
                                    )}&time=${encodeURIComponent(
                                      `${formatSlotTime(
                                        slot.start_time,
                                        slot.start_minute
                                      )} - ${formatSlotTime(
                                        slot.end_time,
                                        slot.end_minute
                                      )}`
                                    )}`
                                  );
                                }}
                                className='cursor-pointer group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300 hover:shadow-md border-0 focus:bg-slate-100 dark:focus:bg-slate-800/50'
                              >
                                <div className='w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110'>
                                  <Plus className='w-4 h-4 text-slate-600 dark:text-slate-300' />
                                </div>
                                <div className='flex flex-col'>
                                  <span className='font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-200'>
                                    Thêm lớp học
                                  </span>
                                  <span className='text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'>
                                    Tạo lớp học mới
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Content Area */}
                        <div className='flex-1 flex items-start justify-center ml-4 mr-4 mt-6'>
                          {eventsInCell.length > 0 ? (
                            <div className='w-full max-w-full flex flex-col items-center justify-start gap-2'>
                              {eventsInCell.map((event, eventIndex) => {
                                const classrooms = Array.isArray(
                                  event.classroom
                                )
                                  ? event.classroom
                                  : [event.classroom];
                                const classroom = classrooms[0];
                                if (!classroom) return null;
                                return (
                                  <div
                                    key={eventIndex}
                                    className='w-full'
                                  >
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <div className='group/trigger bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:from-blue-100 hover:via-indigo-100 hover:to-purple-100 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 dark:hover:from-slate-700 dark:hover:via-slate-600 dark:hover:to-slate-700 text-blue-700 hover:text-blue-800 dark:text-gray-200 dark:hover:text-gray-100 px-2 py-1.5 rounded-xl text-center border border-blue-200/60 hover:border-blue-300/80 dark:border-slate-600/60 dark:hover:border-slate-500/80 shadow-sm hover:shadow-lg dark:shadow-slate-900/20 dark:hover:shadow-slate-900/40 transition-all duration-300 hover:scale-105 w-full cursor-pointer backdrop-blur-sm relative overflow-hidden'>
                                          <div className='font-semibold text-xs truncate relative z-10'>
                                            {classroom.name}
                                          </div>
                                          {/* Shimmer effect */}
                                          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover/trigger:translate-x-full transition-transform duration-1000 ease-out'></div>
                                          {/* Corner accent */}
                                          <div className='absolute top-0 right-0 w-0 h-0 border-l-8 border-l-transparent border-t-8 border-t-blue-300/50 dark:border-t-slate-500/50 opacity-0 group-hover/trigger:opacity-100 transition-opacity duration-300'></div>
                                        </div>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className='w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-slate-200/60 dark:border-slate-700/60 shadow-2xl rounded-2xl p-2 animate-in fade-in-0 zoom-in-95 duration-200'>
                                        <DropdownMenuItem
                                          onClick={() => {
                                            // Navigate to class detail page
                                            const classroomId = classroom._id;
                                            if (classroomId) {
                                              router.push(
                                                `/dashboard/manager/class/${classroomId}`
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
                                          onClick={() => {
                                            // Handle remove class logic here
                                            console.log(
                                              "Remove class:",
                                              classroom._id,
                                              "from date:",
                                              date.toISOString().split("T")[0],
                                              "slot:",
                                              slot.title
                                            );
                                            // You can add remove class API call here
                                          }}
                                          className='cursor-pointer group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-950/50 dark:hover:to-pink-950/50 transition-all duration-300 hover:shadow-md border-0 focus:bg-gradient-to-r focus:from-red-50 focus:to-pink-50 dark:focus:from-red-950/50 dark:focus:to-pink-950/50'
                                        >
                                          <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 dark:from-red-400 dark:to-pink-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-110'>
                                            <Trash2 className='w-4 h-4 text-white' />
                                          </div>
                                          <div className='flex flex-col'>
                                            <span className='font-semibold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors duration-200'>
                                              Gỡ lớp học
                                            </span>
                                            <span className='text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'>
                                              Xóa khỏi lịch học
                                            </span>
                                          </div>
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className='text-center text-muted-foreground w-full h-full flex flex-col items-center justify-center'>
                              <div className='w-8 h-8 mx-auto mb-1 rounded-full bg-muted/50 flex items-center justify-center'>
                                <span className='text-xs font-medium'>—</span>
                              </div>
                              <span className='text-xs font-medium'>Trống</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []; // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-4'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-muted opacity-20 blur-xl animate-pulse'></div>
              <Loader2 className='relative h-12 w-12 animate-spin mx-auto text-muted-foreground' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold text-foreground'>
                Đang tải lịch học
              </h3>
              <p className='text-muted-foreground'>
                Vui lòng chờ trong giây lát...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  } // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-6 max-w-md'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-destructive/20 opacity-20 blur-xl'></div>
              <div className='relative h-16 w-16 mx-auto bg-destructive rounded-full flex items-center justify-center'>
                <span className='text-2xl'>⚠️</span>
              </div>
            </div>
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold text-destructive'>
                Không thể tải dữ liệu
              </h3>
              <p className='text-muted-foreground bg-muted p-3 rounded-lg border'>
                {error}
              </p>
              <Button
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const events = await fetchMonthSchedule(currentDate);
                    setScheduleEvents(events);
                  } catch (err) {
                    console.error("Error fetching schedule:", err);
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Failed to fetch schedule data"
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                className='bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-200'
              >
                <svg
                  className='mr-2 h-4 w-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
                  />
                </svg>
                Thử lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <TooltipProvider>
      <div className='min-h-screen bg-background'>
        <div className='max-w-none mx-auto px-6 py-6 space-y-8'>
          {/* Breadcrumb */}
          <div className='flex items-center space-x-2 text-sm opacity-80 hover:opacity-100 transition-opacity'>
            <Link
              href='/dashboard/manager'
              className='inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/10 px-2 py-1 rounded-md'
            >
              <ArrowLeft className='mr-1 h-4 w-4' />
              Quay về Dashboard
            </Link>
          </div>{" "}
          {/* Header */}
          <div className='relative'>
            <div className='absolute inset-0 bg-muted/5 rounded-3xl blur-3xl'></div>
            <div className='relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-8 bg-card/80 backdrop-blur-sm border rounded-2xl shadow-xl'>
              <div className='space-y-2'>
                <h1 className='text-4xl font-bold text-foreground'>
                  Lịch Quản Lý
                </h1>
                <p className='text-muted-foreground text-lg'>
                  Quản lý lịch học, lịch họp và các sự kiện một cách hiệu quả
                </p>
              </div>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                {/* View Mode Toggle */}
                <div className='flex items-center gap-1 p-1 bg-muted rounded-xl'>
                  <Button
                    variant={viewMode === "month" ? "default" : "ghost"}
                    size='sm'
                    onClick={() => handleViewModeChange("month")}
                    className={`relative px-6 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === "month"
                        ? "bg-background shadow-md text-foreground border"
                        : "hover:bg-background/50"
                    }`}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    Tháng
                  </Button>{" "}
                  <Button
                    variant={viewMode === "week" ? "default" : "ghost"}
                    size='sm'
                    onClick={() => handleViewModeChange("week")}
                    className={`relative px-6 py-2 rounded-lg transition-all duration-200 ${
                      viewMode === "week"
                        ? "bg-background shadow-md text-foreground border"
                        : "hover:bg-background/50"
                    }`}
                  >
                    <svg
                      className='mr-2 h-4 w-4'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                      />
                    </svg>
                    Tuần
                  </Button>
                </div>{" "}
                {/* Week Selector (only show in week mode) */}
                {viewMode === "week" && (
                  <div className='relative'>
                    <Select
                      value={selectedWeek}
                      onValueChange={handleWeekChange}
                    >
                      <SelectTrigger className='w-[320px] bg-gradient-to-r from-background to-muted/20 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 shadow-lg hover:shadow-xl transition-all duration-300 text-foreground font-medium'>
                        <div className='flex items-center gap-3'>
                          <div className='p-1.5 bg-primary/10 rounded-md'>
                            <CalendarIcon className='h-4 w-4 text-primary' />
                          </div>
                          <SelectValue
                            placeholder='Chọn tuần trong năm...'
                            className='text-sm font-medium'
                          />
                        </div>
                      </SelectTrigger>
                      <SelectContent className='w-[320px] bg-background/95 backdrop-blur-md border-2 border-primary/20 shadow-2xl rounded-xl'>
                        <div className='p-2 border-b border-border/50'>
                          <p className='text-xs text-muted-foreground font-medium px-2 py-1'>
                            Chọn tuần để xem lịch
                          </p>
                        </div>
                        {availableWeeks.map((week, index) => (
                          <SelectItem
                            key={week.value}
                            value={week.value}
                            className='mx-1 my-0.5 rounded-lg hover:bg-primary/10 focus:bg-primary/10 transition-all duration-200 cursor-pointer'
                          >
                            <div className='flex items-center justify-between w-full gap-3'>
                              <div className='flex items-center gap-2'>
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    selectedWeek === week.value
                                      ? "bg-primary animate-pulse"
                                      : "bg-muted-foreground/30"
                                  }`}
                                />
                                <span className='font-medium text-sm'>
                                  {week.label}
                                </span>
                              </div>
                              <div className='text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md'>
                                Tuần {index + 1}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>{" "}
          {/* Main Content Grid */}
          <div
            className={`grid gap-8 ${
              viewMode === "week" ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-4"
            }`}
          >
            {" "}
            {/* Calendar */}
            <div
              className={viewMode === "week" ? "col-span-1" : "xl:col-span-3"}
            >
              <Card className='bg-card/80 backdrop-blur-sm border shadow-xl hover:shadow-2xl transition-all duration-300'>
                <CardHeader className='pb-4'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-3 text-xl'>
                      <div className='p-2 bg-primary rounded-lg'>
                        <CalendarIcon className='h-5 w-5 text-primary-foreground' />
                      </div>
                      <span className='text-foreground'>
                        {viewMode === "week" && selectedWeek
                          ? `Tuần từ ${getCurrentWeekDates()[0]?.toLocaleDateString(
                              "vi-VN"
                            )} - ${getCurrentWeekDates()[6]?.toLocaleDateString(
                              "vi-VN"
                            )}`
                          : formatMonthYear(currentDate)}
                      </span>
                    </CardTitle>
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => navigate("prev")}
                        className='hover:bg-muted hover:border-border transition-all duration-200'
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          const today = new Date();
                          const currentYear = currentDate.getFullYear();
                          const todayYear = today.getFullYear();

                          setCurrentDate(today);
                          setSelectedDate(null);

                          // If in week view, find and select the week that contains today
                          if (viewMode === "week") {
                            // Get weeks for the current year (today's year)
                            const todayWeeks = getWeeksInYear(today);

                            // Find the week that contains today
                            const currentWeek = todayWeeks.find((week) => {
                              if (week.start && week.end) {
                                return today >= week.start && today <= week.end;
                              }
                              return false;
                            });

                            if (currentWeek) {
                              setSelectedWeek(currentWeek.value);
                            } else if (todayWeeks.length > 0) {
                              // Fallback to first week if no matching week found
                              setSelectedWeek(todayWeeks[0].value);
                            }
                          } else if (currentYear !== todayYear) {
                            // For month view, only clear selected week if year changed
                            setSelectedWeek("");
                          }
                        }}
                        className='hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-700 transition-all duration-200 text-emerald-600 dark:text-emerald-400'
                      >
                        Hôm nay
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => navigate("next")}
                        className='hover:bg-muted hover:border-border transition-all duration-200'
                      >
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {viewMode === "week" ? (
                    renderWeeklySlotView()
                  ) : (
                    <div className='grid grid-cols-7 gap-0 border rounded-xl overflow-hidden shadow-inner'>
                      {" "}
                      {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(
                        (day, index) => (
                          <div
                            key={day}
                            className={`p-4 text-center text-sm font-semibold border-b ${
                              index === 0 || index === 6
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {day}
                          </div>
                        )
                      )}
                      {renderCalendarDays()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>{" "}
            {/* Sidebar */}
            {viewMode === "month" && (
              <div className='space-y-6'>
                <Card className='bg-card/80 backdrop-blur-sm border shadow-xl hover:shadow-2xl transition-all duration-300'>
                  <CardHeader className='pb-4'>
                    <CardTitle className='flex items-center gap-3'>
                      <div className='p-2 bg-primary rounded-lg'>
                        <CalendarIcon className='h-4 w-4 text-primary-foreground' />
                      </div>
                      <span className='text-lg text-foreground'>
                        {selectedDate
                          ? `Sự kiện ngày ${selectedDate.getDate()}/${
                              selectedDate.getMonth() + 1
                            }`
                          : "Chọn ngày để xem sự kiện"}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {selectedDateEvents.length > 0 ? (
                      <div className='space-y-4'>
                        {selectedDateEvents.map((event, index) => {
                          const formattedEvent = formatScheduleEvent(event);
                          if (!formattedEvent) return null;

                          return (
                            <div
                              key={formattedEvent.id}
                              className='group p-4 border rounded-xl hover:bg-muted/50 transition-all duration-300 hover:shadow-lg bg-card'
                            >
                              <div className='flex items-start justify-between mb-3'>
                                <h4 className='font-semibold text-base text-foreground group-hover:text-foreground/80 transition-colors'>
                                  {formattedEvent.title}
                                </h4>
                                <Badge
                                  variant='default'
                                  className='bg-primary text-primary-foreground border-0 shadow-sm'
                                >
                                  Lớp học
                                </Badge>
                              </div>{" "}
                              <div className='space-y-3 text-sm'>
                                <div className='flex items-center gap-3 p-2 bg-muted/50 rounded-lg'>
                                  <div className='p-1 bg-foreground rounded'>
                                    <Clock className='h-3 w-3 text-background' />
                                  </div>
                                  <span className='text-foreground font-medium'>
                                    {formattedEvent.time}
                                  </span>
                                </div>
                                <div className='flex items-center gap-3 p-2 bg-muted/50 rounded-lg'>
                                  <div className='p-1 bg-foreground rounded'>
                                    <Users className='h-3 w-3 text-background' />
                                  </div>
                                  <span className='text-foreground font-medium'>
                                    {formattedEvent.slotTitle}
                                  </span>
                                </div>
                                <div className='flex items-center gap-3 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg'>
                                  <div className='p-1 bg-emerald-600 dark:bg-emerald-500 rounded'>
                                    <MapPin className='h-3 w-3 text-white' />
                                  </div>
                                  <span className='text-emerald-700 dark:text-emerald-300 font-medium'>
                                    {formattedEvent.classroom}
                                  </span>
                                </div>
                                <div className='flex items-center gap-3 p-2 bg-muted/50 rounded-lg'>
                                  <div className='p-1 bg-foreground rounded'>
                                    <Clock className='h-3 w-3 text-background' />
                                  </div>
                                  <span className='text-foreground font-medium'>
                                    Thời lượng: {formattedEvent.duration}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : selectedDate ? (
                      <div className='text-center py-12 space-y-4'>
                        <div className='relative'>
                          <div className='absolute inset-0 bg-muted/20 rounded-full blur-xl'></div>
                          <div className='relative w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center'>
                            <CalendarIcon className='h-8 w-8 text-muted-foreground' />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <h3 className='text-lg font-semibold text-foreground'>
                            Ngày trống
                          </h3>
                          <p className='text-muted-foreground'>
                            Không có sự kiện nào trong ngày này
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-12 space-y-4'>
                        <div className='relative'>
                          <div className='absolute inset-0 bg-muted/20 rounded-full blur-xl'></div>
                          <div className='relative w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center'>
                            <CalendarIcon className='h-8 w-8 text-muted-foreground' />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <h3 className='text-lg font-semibold text-foreground'>
                            Chọn ngày
                          </h3>
                          <p className='text-muted-foreground'>
                            Nhấp vào một ngày để xem chi tiết sự kiện
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>{" "}
                {/* Quick Stats */}
                <Card className='bg-card/80 backdrop-blur-sm border shadow-xl hover:shadow-2xl transition-all duration-300'>
                  <CardHeader className='pb-4'>
                    <CardTitle className='flex items-center gap-3'>
                      <div className='p-2 bg-primary rounded-lg'>
                        <svg
                          className='h-4 w-4 text-primary-foreground'
                          fill='none'
                          viewBox='0 0 24 24'
                          stroke='currentColor'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                          />
                        </svg>
                      </div>{" "}
                      <span className='text-lg text-foreground'>
                        Thống Kê Nhanh
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className='space-y-4'>
                    <div className='flex justify-between items-center p-3 bg-muted/50 rounded-lg border'>
                      <span className='text-sm font-medium text-foreground'>
                        {" "}
                        Tổng sự kiện tháng này
                      </span>
                      <span className='font-bold text-xl text-foreground bg-background px-3 py-1 rounded-full'>
                        {scheduleEvents.length}
                      </span>
                    </div>
                    <div className='flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700'>
                      <span className='text-sm font-medium text-emerald-700 dark:text-emerald-300'>
                        Lớp học
                      </span>
                      <span className='font-bold text-xl text-emerald-600 dark:text-emerald-400 bg-background px-3 py-1 rounded-full'>
                        {scheduleEvents.length}
                      </span>
                    </div>
                    <div className='flex justify-between items-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700'>
                      <span className='text-sm font-medium text-amber-700 dark:text-amber-300'>
                        {" "}
                        Số slot
                      </span>
                      <span className='font-bold text-xl text-amber-600 dark:text-amber-400 bg-background px-3 py-1 rounded-full'>
                        {scheduleEvents.reduce(
                          (total, event) => total + event.slot.length,
                          0
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
