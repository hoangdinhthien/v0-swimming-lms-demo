"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Users,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Mock calendar events data
  const events = [
    {
      id: 1,
      title: "Lớp Bơi Cơ Bản A1",
      time: "08:00 - 09:00",
      instructor: "Nguyễn Văn A",
      students: 8,
      pool: "Hồ bơi chính",
      date: new Date(2024, 11, 20), // December 20, 2024
      type: "class",
    },
    {
      id: 2,
      title: "Lớp Bơi Nâng Cao B2",
      time: "09:30 - 10:30",
      instructor: "Trần Thị B",
      students: 6,
      pool: "Hồ bơi phụ",
      date: new Date(2024, 11, 20),
      type: "class",
    },
    {
      id: 3,
      title: "Họp Giáo Viên",
      time: "14:00 - 15:00",
      instructor: "Ban Quản Lý",
      students: 0,
      pool: "Phòng họp",
      date: new Date(2024, 11, 21),
      type: "meeting",
    },
    {
      id: 4,
      title: "Lớp Bơi Trẻ Em C1",
      time: "16:00 - 17:00",
      instructor: "Lê Văn C",
      students: 12,
      pool: "Hồ bơi trẻ em",
      date: new Date(2024, 11, 22),
      type: "class",
    },
  ];

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

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
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
          className='h-24 p-1'
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

      days.push(
        <div
          key={day}
          className={`h-24 p-1 border border-border cursor-pointer hover:bg-muted/50 transition-colors ${
            isToday(date) ? "bg-primary/10 border-primary" : ""
          } ${isSelected ? "bg-primary/20" : ""}`}
          onClick={() => setSelectedDate(date)}
        >
          <div
            className={`text-sm font-medium mb-1 ${
              isToday(date) ? "text-primary" : ""
            }`}
          >
            {day}
          </div>
          <div className='space-y-1'>
            {dayEvents.slice(0, 2).map((event) => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded truncate ${
                  event.type === "class"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                }`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className='text-xs text-muted-foreground'>
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className='space-y-6'>
      {/* Breadcrumb */}
      <div className='flex items-center space-x-2 text-sm'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-muted-foreground hover:text-foreground transition-colors'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Lịch Quản Lý</h1>
          <p className='text-muted-foreground'>
            Quản lý lịch học, lịch họp và các sự kiện
          </p>
        </div>
        <div className='flex gap-2'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Thêm Sự Kiện
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        {/* Calendar */}
        <div className='lg:col-span-3'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <CalendarIcon className='h-5 w-5' />
                  {formatMonthYear(currentDate)}
                </CardTitle>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigateMonth("prev")}
                  >
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Hôm nay
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => navigateMonth("next")}
                  >
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className='grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden'>
                {/* Day headers */}
                {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
                  <div
                    key={day}
                    className='p-2 text-center text-sm font-medium bg-muted border-b border-border'
                  >
                    {day}
                  </div>
                ))}
                {/* Calendar days */}
                {renderCalendarDays()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Selected Date Events */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `Sự kiện ngày ${selectedDate.getDate()}/${
                      selectedDate.getMonth() + 1
                    }`
                  : "Chọn ngày để xem sự kiện"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length > 0 ? (
                <div className='space-y-3'>
                  {selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className='p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                    >
                      <div className='flex items-start justify-between mb-2'>
                        <h4 className='font-medium text-sm'>{event.title}</h4>
                        <Badge
                          variant={
                            event.type === "class" ? "default" : "secondary"
                          }
                        >
                          {event.type === "class" ? "Lớp học" : "Họp"}
                        </Badge>
                      </div>
                      <div className='space-y-1 text-xs text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3' />
                          {event.time}
                        </div>
                        <div className='flex items-center gap-1'>
                          <Users className='h-3 w-3' />
                          {event.instructor}
                        </div>
                        <div className='flex items-center gap-1'>
                          <MapPin className='h-3 w-3' />
                          {event.pool}
                        </div>
                        {event.students > 0 && (
                          <div className='flex items-center gap-1'>
                            <Users className='h-3 w-3' />
                            {event.students} học viên
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : selectedDate ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <CalendarIcon className='h-8 w-8 mx-auto mb-2 opacity-50' />
                  <p>Không có sự kiện nào trong ngày này</p>
                </div>
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  <CalendarIcon className='h-8 w-8 mx-auto mb-2 opacity-50' />
                  <p>Chọn một ngày để xem chi tiết</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Thống Kê Nhanh</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Tổng sự kiện tháng này
                </span>
                <span className='font-medium'>{events.length}</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Lớp học</span>
                <span className='font-medium'>
                  {events.filter((e) => e.type === "class").length}
                </span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>Cuộc họp</span>
                <span className='font-medium'>
                  {events.filter((e) => e.type === "meeting").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
