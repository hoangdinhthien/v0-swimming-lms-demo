"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/locale/vi_VN";
// Note: antd v5 shows a compatibility warning with React 19, but still functions correctly
import {
  ConfigProvider,
  Calendar,
  Card as AntdCard,
  Button as AntdButton,
  Drawer,
  Tabs,
  Empty,
  Alert,
  message,
  Avatar,
  Tag,
  Typography,
  Space,
  Modal,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  BookOutlined,
  UserOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchStaffSchedules } from "@/api/staff-data/staff-data-api";
import { getMediaDetails } from "@/api/media-api";

// Interfaces
interface Instructor {
  _id: string;
  username: string;
  email: string;
  featured_image?: string[];
  is_active?: boolean;
}

interface Slot {
  _id: string;
  title: string;
  start_time: number;
  start_minute: number;
  end_time: number;
  end_minute: number;
}

interface Classroom {
  _id: string;
  name: string;
  course?: {
    title: string;
  };
}

interface Pool {
  _id: string;
  title: string;
  type: string;
  capacity: number;
}

interface ScheduleEvent {
  _id: string;
  date: string;
  slot: Slot;
  classroom: Classroom;
  pool: Pool;
  instructor: Instructor;
}

interface CalendarEvent {
  id: string;
  className: string;
  slotTitle: string;
  slotTime: string;
  course: string;
  poolTitle: string;
  poolId: string;
  classroomId: string;
  instructorId: string;
  instructorName: string;
  scheduleId: string;
  slotId: string;
  type: string;
  color: string;
}

const { Title, Text } = Typography;
const { TabPane } = Tabs;

export default function StaffCalendarPage() {
  const router = useRouter();

  // Set dayjs locale
  dayjs.locale("vi");

  // State management
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<Dayjs | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedScheduleEvent, setSelectedScheduleEvent] =
    useState<ScheduleEvent | null>(null);

  // Load schedule data
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      try {
        const startDate = currentDate.startOf("month").format("YYYY-MM-DD");
        const endDate = currentDate.endOf("month").format("YYYY-MM-DD");

        console.log(
          "📅 Loading schedule for month:",
          currentDate.format("YYYY-MM")
        );
        console.log("📅 Date range:", startDate, "to", endDate);

        const events: ScheduleEvent[] = await fetchStaffSchedules(
          startDate,
          endDate
        );

        console.log("📅 Loaded schedule events:", {
          count: events.length,
          currentDate: currentDate.format("YYYY-MM-DD"),
          events: events.slice(0, 3).map((e) => ({
            id: e._id,
            date: e.date,
            slotTitle: e.slot?.title || "N/A",
            classroomName: e.classroom?.name || "N/A",
          })),
        });

        setScheduleEvents(events);

        // Log data structure for debugging
        if (events.length > 0) {
          console.log("📊 First event structure:", {
            _id: events[0]._id,
            date: events[0].date,
            slot: events[0].slot,
            classroom: events[0].classroom,
            pool: events[0].pool,
          });
        }
      } catch (err) {
        console.error("❌ Error loading schedule data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load schedule data"
        );
        message.error("Không thể tải dữ liệu lịch học");
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, [currentDate]);

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    const dateStr = date.format("YYYY-MM-DD");
    const dayEvents = scheduleEvents.filter((event) => {
      const eventDateStr = event.date.split("T")[0];
      return eventDateStr === dateStr;
    });

    return dayEvents.map(formatScheduleEvent);
  };

  // Get course name from course object
  const getCourseName = (course: any): string => {
    if (course && typeof course === "object" && course.title) {
      return course.title;
    }
    if (typeof course === "string") {
      return course; // Fallback for old format
    }
    return "Không xác định";
  };

  // Transform schedule event to display format
  const formatScheduleEvent = (scheduleEvent: ScheduleEvent): CalendarEvent => {
    const slot = scheduleEvent.slot;
    const classroom = scheduleEvent.classroom;
    const pool = scheduleEvent.pool;
    const instructor = scheduleEvent.instructor; // Get instructor object directly

    return {
      id: scheduleEvent._id,
      className: classroom?.name || "Không xác định",
      slotTitle: slot?.title || "Không xác định",
      slotTime: slot
        ? `${Math.floor(slot.start_time)
            .toString()
            .padStart(2, "0")}:${slot.start_minute
            .toString()
            .padStart(2, "0")} - ${Math.floor(slot.end_time)
            .toString()
            .padStart(2, "0")}:${slot.end_minute.toString().padStart(2, "0")}`
        : "",
      course: getCourseName(classroom?.course), // Resolve course name
      poolTitle:
        (Array.isArray(pool) ? pool[0]?.title : pool?.title) ||
        "Không xác định",
      poolId: (Array.isArray(pool) ? pool[0]?._id : pool?._id) || "",
      classroomId: classroom?._id || "", // Add classroom ID for editing
      instructorId: instructor?._id || "",
      instructorName: instructor?.username || "Không xác định",
      scheduleId: scheduleEvent._id,
      slotId: slot?._id || "",
      type: "class",
      color: getEventColor(classroom?.course),
    };
  };

  // Get color for event based on course type
  const getEventColor = (course: any): string => {
    const courseName = getCourseName(course);
    const colorMap: { [key: string]: string } = {
      "Khóa bơi phụ huynh và bé": "#52c41a",
      "Khóa bơi nâng cao cho thiếu niên": "#1890ff",
      "Khóa bơi cho người lớn mới bắt đầu": "#fa8c16",
      "Bơi cơ bản": "#52c41a",
      "Bơi nâng cao": "#1890ff",
      "Bơi trẻ em": "#fa8c16",
      Aerobic: "#eb2f96",
      "Bơi người lớn": "#722ed1",
      "Bơi tự do": "#13c2c2",
    };

    // Try to match by course name first, then fallback to a hash-based color
    if (colorMap[courseName]) {
      return colorMap[courseName];
    }

    // Generate consistent color based on course name or ID
    const colors = [
      "#1890ff",
      "#52c41a",
      "#fa8c16",
      "#eb2f96",
      "#722ed1",
      "#13c2c2",
      "#f5222d",
      "#fa541c",
    ];
    const courseId = course?._id || courseName || "default";
    const hash = courseId.split("").reduce((a: number, b: string) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Find original ScheduleEvent by schedule ID
  const findScheduleEventById = (scheduleId: string): ScheduleEvent | null => {
    return scheduleEvents.find((event) => event._id === scheduleId) || null;
  };

  // Handle opening class detail modal
  const handleOpenDetailModal = (event: CalendarEvent) => {
    const scheduleEvent = findScheduleEventById(event.scheduleId);
    if (scheduleEvent) {
      setSelectedScheduleEvent(scheduleEvent);
      setDetailModalOpen(true);
    }
  };

  // Handle date select from calendar
  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  // Handle panel change (month/year navigation)
  const onPanelChange = (date: Dayjs, mode: any) => {
    setCurrentDate(date);
  };

  // Custom date cell renderer
  const dateCellRender = (value: Dayjs) => {
    const events = getEventsForDate(value);
    const isToday = value.isSame(dayjs(), "day");
    const isPast = value.isBefore(dayjs(), "day");
    const isFuture = value.isAfter(dayjs(), "day");

    if (events.length === 0) {
      return (
        <div
          className={`h-full min-h-[80px] p-1 ${
            isPast ? "opacity-60" : ""
          } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDrawerDate(value);
            setDrawerOpen(true);
          }}
        >
          <div className='text-center'>
            <div className='text-xs text-gray-400 dark:text-gray-600'>
              Chưa có lớp học
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`h-full min-h-[80px] p-1 ${
          isPast ? "opacity-60" : ""
        } flex items-center justify-center`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDrawerDate(value);
          setDrawerOpen(true);
        }}
      >
        <div className='text-center'>
          <div className='inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm mb-1 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors'>
            {events.length}
          </div>
          <div className='text-xs text-gray-600 dark:text-gray-400 font-medium'>
            lớp học
          </div>
        </div>
      </div>
    );
  };

  // Get statistics
  const getStatistics = () => {
    const totalEvents = scheduleEvents.length;
    const totalSlots = scheduleEvents.length; // Each event has one slot
    const uniquePools = new Set(
      scheduleEvents
        .map((event) => {
          const pool = event.pool;
          return Array.isArray(pool) ? pool[0]?.title : pool?.title;
        })
        .filter(Boolean)
    ).size;

    return { totalEvents, totalSlots, uniquePools };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải lịch học...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>
            Lỗi tải dữ liệu
          </div>
          <p className='text-muted-foreground'>{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <ConfigProvider locale={locale}>
      <div className='container mx-auto py-8 space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
          <div className='space-y-2'>
            <div className='flex items-center gap-3'>
              <Button
                onClick={() => router.back()}
                variant='outline'
                size='sm'
              >
                <ArrowLeftOutlined className='mr-2' />
                Quay lại
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {scheduleEvents.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              sm={8}
            >
              <AntdCard
                size='small'
                className='text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1'>
                    {stats.totalEvents}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1 text-gray-600 dark:text-gray-400'
                  >
                    <TeamOutlined /> Tổng lớp học
                  </Text>
                </div>
              </AntdCard>
            </Col>

            <Col
              xs={24}
              sm={8}
            >
              <AntdCard
                size='small'
                className='text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1'>
                    {stats.totalSlots}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1 text-gray-600 dark:text-gray-400'
                  >
                    <ClockCircleOutlined /> Tổng khung giờ
                  </Text>
                </div>
              </AntdCard>
            </Col>

            <Col
              xs={24}
              sm={8}
            >
              <AntdCard
                size='small'
                className='text-center bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-gray-700 dark:text-gray-300 mb-1'>
                    {stats.uniquePools}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1 text-gray-600 dark:text-gray-400'
                  >
                    <EnvironmentOutlined /> Hồ bơi sử dụng
                  </Text>
                </div>
              </AntdCard>
            </Col>
          </Row>
        )}

        {/* Main Calendar */}
        <AntdCard className='shadow-lg calendar-container'>
          <Calendar
            value={currentDate}
            onSelect={onSelect}
            onPanelChange={onPanelChange}
            cellRender={dateCellRender}
          />
        </AntdCard>

        {/* Date Details Drawer */}
        <Drawer
          title={
            <div className='flex items-center gap-3'>
              <CalendarOutlined className='text-blue-500' />
              <div>
                <div className='text-lg font-semibold'>
                  {drawerDate
                    ? drawerDate.format("DD/MM/YYYY")
                    : "Chi tiết lịch học"}
                </div>
                <div className='text-sm text-gray-500 dark:text-gray-400'>
                  {drawerDate ? drawerDate.format("dddd") : ""}
                </div>
              </div>
            </div>
          }
          placement='right'
          width={480}
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
          }}
          className='calendar-drawer'
        >
          {drawerLoading ? (
            <div className='flex flex-col items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
              <p className='text-muted-foreground'>Đang tải chi tiết...</p>
            </div>
          ) : (
            drawerDate && (
              <div className='space-y-6'>
                <Tabs
                  activeKey='view'
                  items={[
                    {
                      key: "view",
                      label: "Xem lịch học",
                      children: (
                        <div className='space-y-4'>
                          {(() => {
                            const events = getEventsForDate(drawerDate);

                            if (events.length === 0) {
                              const isPast = drawerDate.isBefore(
                                dayjs(),
                                "day"
                              );
                              const isToday = drawerDate.isSame(dayjs(), "day");
                              const isFuture = drawerDate.isAfter(
                                dayjs(),
                                "day"
                              );

                              let message = "";
                              let showAddButton = false;

                              if (isPast) {
                                message = "Không có lớp học nào trong ngày này";
                              } else if (isToday) {
                                message = "Chưa có lớp học nào trong hôm nay";
                              } else if (isFuture) {
                                message =
                                  "Chưa có lớp học nào được lên lịch cho ngày này";
                              }

                              return (
                                <div className='text-center py-12'>
                                  <Empty
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    description={
                                      <div>
                                        <div className='text-gray-500 dark:text-gray-400 mb-4'>
                                          {message}
                                        </div>
                                      </div>
                                    }
                                  />
                                </div>
                              );
                            }

                            return (
                              <div>
                                {/* Summary */}
                                <div className='mb-6'>
                                  <AntdCard
                                    size='small'
                                    className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                  >
                                    <div className='flex items-center justify-between'>
                                      <div className='flex items-center gap-2'>
                                        <TeamOutlined className='text-blue-600 dark:text-blue-400' />
                                        <span className='font-medium'>
                                          Tổng số lớp học:
                                        </span>
                                      </div>
                                      <div className='text-xl font-bold text-blue-600 dark:text-blue-400'>
                                        {events.length}
                                      </div>
                                    </div>
                                  </AntdCard>
                                </div>

                                {/* Events List */}
                                <div className='space-y-4'>
                                  <div className='flex items-center justify-between'>
                                    <Title
                                      level={5}
                                      className='!mb-0'
                                    >
                                      Danh sách lớp học
                                    </Title>
                                  </div>

                                  <div className='space-y-3'>
                                    {events.map((event, index) => (
                                      <AntdCard
                                        key={index}
                                        size='small'
                                        className='hover:shadow-md transition-all'
                                      >
                                        <div className='flex items-start justify-between'>
                                          <div className='flex items-start gap-3 flex-1'>
                                            <Avatar
                                              style={{
                                                backgroundColor: event.color,
                                              }}
                                              icon={<EnvironmentOutlined />}
                                              size='default'
                                            />
                                            <div className='flex-1'>
                                              <div className='flex items-center gap-2 mb-2'>
                                                <Text
                                                  strong
                                                  className='text-lg'
                                                >
                                                  {event.className}
                                                </Text>
                                                <Tag color={event.color}>
                                                  {event.slotTitle}
                                                </Tag>
                                              </div>

                                              <div className='space-y-1'>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <ClockCircleOutlined />
                                                  <span>{event.slotTime}</span>
                                                </div>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <BookOutlined />
                                                  <span>{event.course}</span>
                                                </div>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <EnvironmentOutlined />
                                                  <span>{event.poolTitle}</span>
                                                </div>
                                                <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                                  <UserOutlined />
                                                  <div className='flex items-center gap-2'>
                                                    <span>
                                                      {event.instructorName}
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className='flex flex-col gap-1'>
                                            <Tooltip title='Xem chi tiết'>
                                              <AntdButton
                                                type='text'
                                                size='small'
                                                icon={<EyeOutlined />}
                                                onClick={(e) => {
                                                  e.preventDefault();
                                                  e.stopPropagation();
                                                  handleOpenDetailModal(event);
                                                }}
                                              />
                                            </Tooltip>
                                          </div>
                                        </div>
                                      </AntdCard>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            )
          )}
        </Drawer>

        {/* Class Detail Modal - Placeholder for now */}
        <Modal
          title='Chi tiết lớp học'
          open={detailModalOpen}
          onCancel={() => {
            setDetailModalOpen(false);
            setSelectedScheduleEvent(null);
          }}
          footer={[
            <AntdButton
              key='close'
              onClick={() => {
                setDetailModalOpen(false);
                setSelectedScheduleEvent(null);
              }}
            >
              Đóng
            </AntdButton>,
          ]}
          width={600}
        >
          {selectedScheduleEvent && (
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <Avatar
                  style={{
                    backgroundColor: getEventColor(
                      selectedScheduleEvent.classroom?.course
                    ),
                  }}
                  icon={<EnvironmentOutlined />}
                  size='large'
                />
                <div>
                  <Title
                    level={4}
                    className='!mb-1'
                  >
                    {selectedScheduleEvent.classroom?.name || "Không xác định"}
                  </Title>
                  <Text type='secondary'>
                    {selectedScheduleEvent.slot?.title || "Không xác định"}
                  </Text>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Text strong>Khóa học:</Text>
                  <div>
                    {getCourseName(selectedScheduleEvent.classroom?.course)}
                  </div>
                </div>
                <div>
                  <Text strong>Hồ bơi:</Text>
                  <div>
                    {selectedScheduleEvent.pool?.title || "Không xác định"}
                  </div>
                </div>
                <div>
                  <Text strong>Giáo viên:</Text>
                  <div>
                    {selectedScheduleEvent.instructor?.username ||
                      "Không xác định"}
                  </div>
                </div>
                <div>
                  <Text strong>Thời gian:</Text>
                  <div>
                    {selectedScheduleEvent.slot
                      ? `${Math.floor(selectedScheduleEvent.slot.start_time)
                          .toString()
                          .padStart(
                            2,
                            "0"
                          )}:${selectedScheduleEvent.slot.start_minute
                          .toString()
                          .padStart(2, "0")} - ${Math.floor(
                          selectedScheduleEvent.slot.end_time
                        )
                          .toString()
                          .padStart(
                            2,
                            "0"
                          )}:${selectedScheduleEvent.slot.end_minute
                          .toString()
                          .padStart(2, "0")}`
                      : "Không xác định"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
}
