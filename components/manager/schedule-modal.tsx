"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2, Calendar, Clock, User, MapPin, Users } from "lucide-react";
import { fetchUserSchedule } from "@/api/manager/schedule-api";
import { format, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
import { vi } from "date-fns/locale";

interface ScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
  userType: "student" | "instructor";
}

export function ScheduleModal({
  open,
  onOpenChange,
  userId,
  userName,
  userType,
}: ScheduleModalProps) {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && userId) {
      loadSchedule();
    }
  }, [open, userId]);

  const loadSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchUserSchedule(userId);
      console.log("Schedule API Response:", response);

      // API returns data in format: { data: [[[schedules], []]] }
      // Extract schedules from data[0][0]
      if (
        response?.data &&
        Array.isArray(response.data) &&
        response.data[0] &&
        Array.isArray(response.data[0]) &&
        response.data[0][0]
      ) {
        const scheduleData = response.data[0][0];
        console.log("Extracted schedule data:", scheduleData);

        // Sort by date, newest first
        const sortedSchedules = scheduleData.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setSchedules(sortedSchedules);
      } else {
        console.log("No schedule data found in response");
        setSchedules([]);
      }
    } catch (err: any) {
      console.error("Error loading schedule:", err);
      setError(err?.message || "Không thể tải lịch học/dạy");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "EEEE, dd/MM/yyyy", { locale: vi });
    } catch {
      return dateString;
    }
  };

  const formatTime = (slot: any) => {
    if (!slot) return "";
    const startHour = slot.start_time || 0;
    const startMinute = slot.start_minute || 0;
    const endHour = slot.end_time || 0;
    const endMinute = slot.end_minute || 0;
    return `${startHour.toString().padStart(2, "0")}:${startMinute
      .toString()
      .padStart(2, "0")} - ${endHour.toString().padStart(2, "0")}:${endMinute
      .toString()
      .padStart(2, "0")}`;
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const getAttendanceStatus = (schedule: any) => {
    if (!schedule.attendees || !Array.isArray(schedule.attendees)) {
      return null;
    }
    const hasAttended = schedule.attendees.includes(userId);
    return hasAttended;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl'>
            {userType === "student" ? "Lịch học" : "Lịch dạy"} của {userName}
          </DialogTitle>
          <DialogDescription>
            Danh sách tất cả các buổi học{" "}
            {userType === "student" ? "của học viên" : "giảng viên phụ trách"}
          </DialogDescription>
        </DialogHeader>

        <div className='mt-4'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-primary mb-4' />
              <p className='text-muted-foreground'>Đang tải lịch...</p>
            </div>
          ) : error ? (
            <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center'>
              <p className='text-red-600 dark:text-red-400'>{error}</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className='bg-muted/50 border border-muted rounded-lg p-12 text-center'>
              <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-lg font-medium text-muted-foreground'>
                Chưa có lịch {userType === "student" ? "học" : "dạy"}
              </p>
              <p className='text-sm text-muted-foreground mt-2'>
                {userType === "student"
                  ? "Học viên chưa có buổi học nào được xếp lịch"
                  : "Giảng viên chưa có buổi dạy nào được xếp lịch"}
              </p>
            </div>
          ) : (
            <Accordion
              type='multiple'
              defaultValue={[format(new Date(), "yyyy-MM")]}
              className='space-y-2'
            >
              {(() => {
                // Group schedules by month
                const groupedByMonth = schedules.reduce(
                  (acc: any, schedule: any) => {
                    const monthKey = format(new Date(schedule.date), "yyyy-MM");
                    if (!acc[monthKey]) {
                      acc[monthKey] = [];
                    }
                    acc[monthKey].push(schedule);
                    return acc;
                  },
                  {}
                );

                // Sort months (newest first)
                const sortedMonths = Object.keys(groupedByMonth).sort((a, b) =>
                  b.localeCompare(a)
                );

                return sortedMonths.map((monthKey) => {
                  const monthSchedules = groupedByMonth[monthKey];
                  const monthDate = new Date(monthKey + "-01");
                  const monthLabel = format(monthDate, "MMMM yyyy", {
                    locale: vi,
                  });
                  const isCurrentMonth = isSameMonth(monthDate, new Date());

                  return (
                    <AccordionItem
                      key={monthKey}
                      value={monthKey}
                      className='border rounded-lg overflow-hidden'
                    >
                      <AccordionTrigger className='px-4 py-3 bg-muted/50 hover:bg-muted hover:no-underline'>
                        <div className='flex items-center gap-3 w-full'>
                          <Calendar className='h-5 w-5 text-primary' />
                          <span className='font-semibold capitalize'>
                            {monthLabel}
                          </span>
                          <Badge
                            variant='secondary'
                            className='ml-auto mr-2'
                          >
                            {monthSchedules.length} buổi
                          </Badge>
                          {isCurrentMonth && (
                            <Badge
                              variant='outline'
                              className='bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300'
                            >
                              Tháng này
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className='px-4 pt-4 pb-2'>
                        <div className='space-y-3'>
                          {monthSchedules.map(
                            (schedule: any, index: number) => {
                              const upcoming = isUpcoming(schedule.date);
                              const attended = getAttendanceStatus(schedule);
                              const course =
                                typeof schedule.classroom?.course === "object"
                                  ? schedule.classroom.course
                                  : null;

                              return (
                                <Card
                                  key={schedule._id || index}
                                  className={`p-4 transition-all hover:shadow-md ${
                                    upcoming
                                      ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                                      : "border-l-4 border-l-gray-300 dark:border-l-gray-700"
                                  }`}
                                >
                                  <div className='flex items-start justify-between gap-4'>
                                    <div className='flex-1 space-y-3'>
                                      {/* Date and Time */}
                                      <div className='flex items-center gap-4 flex-wrap'>
                                        <div className='flex items-center gap-2'>
                                          <Calendar className='h-4 w-4 text-muted-foreground' />
                                          <span className='font-medium'>
                                            {formatDate(schedule.date)}
                                          </span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                          <Clock className='h-4 w-4 text-muted-foreground' />
                                          <span className='text-sm'>
                                            {schedule.slot?.title} -{" "}
                                            {formatTime(schedule.slot)}
                                          </span>
                                        </div>
                                        {upcoming && (
                                          <Badge
                                            variant='outline'
                                            className='bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300'
                                          >
                                            Sắp diễn ra
                                          </Badge>
                                        )}
                                        {attended !== null && (
                                          <Badge
                                            variant='outline'
                                            className={
                                              attended
                                                ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/50 dark:text-green-300"
                                                : "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/50 dark:text-gray-300"
                                            }
                                          >
                                            {attended ? "Đã điểm danh" : "Vắng"}
                                          </Badge>
                                        )}
                                      </div>

                                      {/* Class and Course Info */}
                                      <div className='space-y-1'>
                                        <div className='flex items-center gap-2'>
                                          <Users className='h-4 w-4 text-muted-foreground' />
                                          <span className='font-semibold'>
                                            {schedule.classroom?.name ||
                                              "Lớp học"}
                                          </span>
                                        </div>
                                        {course && (
                                          <p className='text-sm text-muted-foreground pl-6'>
                                            Khóa học: {course.title}
                                          </p>
                                        )}
                                      </div>

                                      {/* Instructor Info (for students) or Pool Info */}
                                      <div className='flex items-start gap-4 flex-wrap text-sm'>
                                        {userType === "student" &&
                                          schedule.instructor && (
                                            <div className='flex items-center gap-2'>
                                              <User className='h-4 w-4 text-muted-foreground' />
                                              <span>
                                                GV:{" "}
                                                {schedule.instructor.username ||
                                                  "N/A"}
                                              </span>
                                            </div>
                                          )}
                                        {/* Pool can be an object or an array */}
                                        {(() => {
                                          const poolData = Array.isArray(
                                            schedule.pool
                                          )
                                            ? schedule.pool[0]
                                            : schedule.pool;

                                          if (poolData && poolData.title) {
                                            return (
                                              <div className='flex items-center gap-2'>
                                                <MapPin className='h-4 w-4 text-muted-foreground' />
                                                <span>{poolData.title}</span>
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              );
                            }
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                });
              })()}
            </Accordion>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
