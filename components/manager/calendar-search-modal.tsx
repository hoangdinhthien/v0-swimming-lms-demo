"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  BookOpen,
  X,
} from "lucide-react";
import dayjs from "dayjs";

// Interface matching the one in page.tsx
export interface CalendarEvent {
  id: string;
  className: string;
  slotTitle: string;
  slotTime: string;
  course: string;
  poolTitle: string;
  poolId: string;
  classroomId: string; // Add classroom ID for editing
  instructorId: string;
  instructorName: string;
  scheduleId: string;
  slotId: string;
  type: "class" | "event";
  color?: string;
  date?: string;
}

interface CalendarSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
}

export function CalendarSearchModal({
  open,
  onOpenChange,
  events,
  onSelectEvent,
}: CalendarSearchModalProps) {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);
  const [selectedPools, setSelectedPools] = useState<string[]>([]);

  // Derive unique filter options from events
  const filterOptions = useMemo(() => {
    const courses = new Set<string>();
    const instructors = new Set<string>();
    const pools = new Set<string>();

    events.forEach((event) => {
      if (event.course) courses.add(event.course);
      if (event.instructorName) instructors.add(event.instructorName);
      if (event.poolTitle) pools.add(event.poolTitle);
    });

    return {
      courses: Array.from(courses).sort(),
      instructors: Array.from(instructors).sort(),
      pools: Array.from(pools).sort(),
    };
  }, [events]);

  // Filter Logic
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Text Search
      const matchesSearch =
        searchQuery === "" ||
        event.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.course &&
          event.course.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.instructorName &&
          event.instructorName
            .toLowerCase()
            .includes(searchQuery.toLowerCase()));

      // Course Filter
      const matchesCourse =
        selectedCourses.length === 0 ||
        (event.course && selectedCourses.includes(event.course));

      // Instructor Filter
      const matchesInstructor =
        selectedInstructors.length === 0 ||
        (event.instructorName &&
          selectedInstructors.includes(event.instructorName));

      // Pool Filter
      const matchesPool =
        selectedPools.length === 0 ||
        (event.poolTitle && selectedPools.includes(event.poolTitle));

      return matchesSearch && matchesCourse && matchesInstructor && matchesPool;
    });
  }, [
    events,
    searchQuery,
    selectedCourses,
    selectedInstructors,
    selectedPools,
  ]);

  // Handlers for checkboxes
  const toggleFilter = (
    item: string,
    current: string[],
    setter: (val: string[]) => void
  ) => {
    if (current.includes(item)) {
      setter(current.filter((i) => i !== item));
    } else {
      setter([...current, item]);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCourses([]);
    setSelectedInstructors([]);
    setSelectedPools([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <DialogTitle>Tìm kiếm buổi học</DialogTitle>
          </div>
          {/* Close button is handled by DialogPrimitive, but we check if we need custom actions */}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT SIDE: FILTERS */}
          <div className="w-[300px] border-r flex flex-col bg-gray-50/50 dark:bg-gray-900/20 shrink-0">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Bộ lọc
                </h3>
                {(searchQuery ||
                  selectedCourses.length > 0 ||
                  selectedInstructors.length > 0 ||
                  selectedPools.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                  >
                    Xóa tất cả
                  </Button>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tên lớp, HLV..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-white dark:bg-background"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Course Filter */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Khóa học
                  </Label>
                  <div className="space-y-2">
                    {filterOptions.courses.map((course) => (
                      <div key={course} className="flex items-center space-x-2">
                        <Checkbox
                          id={`course-${course}`}
                          checked={selectedCourses.includes(course)}
                          onCheckedChange={() =>
                            toggleFilter(
                              course,
                              selectedCourses,
                              setSelectedCourses
                            )
                          }
                        />
                        <label
                          htmlFor={`course-${course}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer truncate"
                          title={course}
                        >
                          {course}
                        </label>
                      </div>
                    ))}
                    {filterOptions.courses.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Không có dữ liệu
                      </p>
                    )}
                  </div>
                </div>

                {/* Pool Filter */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Hồ bơi
                  </Label>
                  <div className="space-y-2">
                    {filterOptions.pools.map((pool) => (
                      <div key={pool} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pool-${pool}`}
                          checked={selectedPools.includes(pool)}
                          onCheckedChange={() =>
                            toggleFilter(pool, selectedPools, setSelectedPools)
                          }
                        />
                        <label
                          htmlFor={`pool-${pool}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer truncate"
                          title={pool}
                        >
                          {pool}
                        </label>
                      </div>
                    ))}
                    {filterOptions.pools.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Không có dữ liệu
                      </p>
                    )}
                  </div>
                </div>

                {/* Instructor Filter */}
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Huấn luyện viên
                  </Label>
                  <div className="space-y-2">
                    {filterOptions.instructors.map((inst) => (
                      <div key={inst} className="flex items-center space-x-2">
                        <Checkbox
                          id={`inst-${inst}`}
                          checked={selectedInstructors.includes(inst)}
                          onCheckedChange={() =>
                            toggleFilter(
                              inst,
                              selectedInstructors,
                              setSelectedInstructors
                            )
                          }
                        />
                        <label
                          htmlFor={`inst-${inst}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer truncate"
                          title={inst}
                        >
                          {inst}
                        </label>
                      </div>
                    ))}
                    {filterOptions.instructors.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Không có dữ liệu
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT SIDE: RESULTS */}
          <div className="flex-1 flex flex-col bg-background">
            <div className="p-4 border-b bg-muted/10 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Tìm thấy{" "}
                <strong className="text-foreground">
                  {filteredEvents.length}
                </strong>{" "}
                kết quả
              </span>
              {/* Optional sorting could go here */}
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-1 gap-3">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    // Extract date from event (assuming standard format)
                    // event.date is not in CalendarEvent interface above, but page.tsx implementation uses it implicitly via closure or fetching.
                    // Wait, page.tsx local interface DOES NOT have `date`.
                    // BUT scheduleEvents in page.tsx has `date`.
                    // Let's verify how formatScheduleEvent works.
                    // It adds `className`, `slotTitle` etc.
                    // It does NOT add `date` field to the mapped object?
                    // Let's check page.tsx line 406 again.
                    return (
                      <div
                        key={event.id}
                        className="group flex flex-col border rounded-md p-2.5 hover:border-blue-500 hover:shadow-sm hover:bg-accent/5 transition-all cursor-pointer bg-card"
                        onClick={() => onSelectEvent(event)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div
                              className="w-1 h-4 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: event.color || "#3b82f6",
                              }}
                            />
                            <h4 className="font-semibold text-sm text-foreground group-hover:text-blue-600 transition-colors truncate">
                              {event.className}
                            </h4>
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-5 px-2 font-normal text-muted-foreground bg-muted shrink-0 max-w-[40%] truncate"
                          >
                            {event.course}
                          </Badge>
                        </div>

                        <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground ml-3">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Clock className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                            <span className="truncate">
                              {event.date
                                ? dayjs(event.date).format("DD/MM/YYYY")
                                : ""}{" "}
                              - {event.slotTitle}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 min-w-0">
                            <MapPin className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {event.poolTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <User className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {event.instructorName}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 opacity-50" />
                    </div>
                    <p className="font-medium">Không tìm thấy kết quả nào</p>
                    <p className="text-sm mt-1">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
