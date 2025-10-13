"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Badge as AntdBadge,
  message,
  Modal,
  Button as AntdButton,
  Select as AntdSelect,
  Card as AntdCard,
  Drawer,
  List,
  Avatar,
  Typography,
  Space,
  Divider,
  ConfigProvider,
  Tag,
  Tooltip,
  Row,
  Col,
  Segmented,
  Empty,
  Alert,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
} from "@ant-design/icons";
import type { CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import locale from "antd/locale/vi_VN";
import {
  fetchMonthSchedule,
  fetchWeekSchedule,
  fetchDateRangeSchedule,
  getWeeksInYear,
  deleteScheduleEvent,
  type ScheduleEvent,
  convertApiDayToJsDay,
  convertJsDayToApiDay,
} from "@/api/schedule-api";
import { fetchAllSlots, type SlotDetail } from "@/api/slot-api";
import { fetchCourseById } from "@/api/courses-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  useCachedAPI,
  usePerformanceMonitor,
  apiCache,
} from "@/hooks/use-api-cache";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const { Option } = AntdSelect;
const { Text, Title } = Typography;

// Set Vietnamese locale for dayjs
dayjs.locale("vi");

interface CalendarEvent {
  id: string;
  className: string;
  slotTitle: string;
  slotTime: string;
  course: string;
  poolTitle: string;
  scheduleId: string;
  slotId: string;
  type: "class" | "event";
  color?: string;
}

export default function ImprovedAntdCalendarPage() {
  usePerformanceMonitor("ImprovedAntdCalendarPage");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<Dayjs | null>(null);
  const [courseCache, setCourseCache] = useState<{[key: string]: any}>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{
    scheduleId: string;
    className: string;
    date: string;
    slotTitle: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use cached API for slots (they don't change often)
  const {
    data: allSlots,
    loading: slotsLoading,
    error: slotsError,
  } = useCachedAPI(
    "all-slots",
    fetchAllSlots,
    [],
    10 * 60 * 1000 // Cache for 10 minutes
  );

  // Effect to fetch data when component mounts or current date changes
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(
          "🗓️ Fetching month schedule for:",
          currentDate.format("YYYY-MM-DD")
        );
        const events = await fetchMonthSchedule(currentDate.toDate());

        console.log(" Loaded schedule events:", {
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

  // Effect to fetch course details when scheduleEvents change
  useEffect(() => {
    const fetchCourseDetails = async () => {
      const courseIds = new Set<string>();
      
      // Collect all unique course IDs
      scheduleEvents.forEach(event => {
        if (event.classroom?.course && !courseCache[event.classroom.course]) {
          courseIds.add(event.classroom.course);
        }
      });

      // Fetch course details for missing courses
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      
      if (!tenantId || !token) {
        console.warn("Missing tenant or token for course fetch");
        return;
      }

      for (const courseId of courseIds) {
        try {
          const course = await fetchCourseById({ 
            courseId, 
            tenantId, 
            token 
          });
          setCourseCache(prev => ({
            ...prev,
            [courseId]: course
          }));
        } catch (error) {
          console.error(`Failed to fetch course ${courseId}:`, error);
          // Set a fallback name for failed fetches
          setCourseCache(prev => ({
            ...prev,
            [courseId]: { title: `Khóa học ${courseId.slice(-4)}` }
          }));
        }
      }
    };

    if (scheduleEvents.length > 0) {
      fetchCourseDetails();
    }
  }, [scheduleEvents, courseCache]);

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    const dateStr = date.format("YYYY-MM-DD");
    const dayEvents = scheduleEvents.filter((event) => {
      const eventDateStr = event.date.split("T")[0];
      return eventDateStr === dateStr;
    });

    return dayEvents.map(formatScheduleEvent);
  };

  // Get course name from cache or return course ID
  const getCourseName = (courseId: string): string => {
    if (courseCache[courseId]) {
      return courseCache[courseId].title || courseId;
    }
    return courseId; // Return ID if not cached yet
  };

  // Transform schedule event to display format
  const formatScheduleEvent = (scheduleEvent: ScheduleEvent): CalendarEvent => {
    const slot = scheduleEvent.slot;
    const classroom = scheduleEvent.classroom;
    const pool = scheduleEvent.pool;

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
            .padStart(2, "0")}:${slot.end_minute
            .toString()
            .padStart(2, "0")}`
        : "",
      course: getCourseName(classroom?.course || ""), // Resolve course name
      poolTitle: pool?.title || "Không xác định",
      scheduleId: scheduleEvent._id,
      slotId: slot?._id || "",
      type: "class",
      color: getEventColor(classroom?.course || ""),
    };
  };

  // Get color for event based on course type
  const getEventColor = (courseId: string): string => {
    const courseName = getCourseName(courseId);
    const colorMap: { [key: string]: string } = {
      "Bơi cơ bản": "#52c41a",
      "Bơi nâng cao": "#1890ff",
      "Bơi trẻ em": "#fa8c16",
      "Aerobic": "#eb2f96",
      "Bơi người lớn": "#722ed1",
      "Bơi tự do": "#13c2c2",
    };
    
    // Try to match by course name first, then fallback to a hash-based color
    if (colorMap[courseName]) {
      return colorMap[courseName];
    }
    
    // Generate consistent color based on courseId
    const colors = ["#1890ff", "#52c41a", "#fa8c16", "#eb2f96", "#722ed1", "#13c2c2", "#f5222d", "#fa541c"];
    const hash = courseId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Handle date select from calendar
  const onSelect = (date: Dayjs) => {
    setSelectedDate(date);
    setCurrentDate(date);
  };

  // Handle panel change (month/year navigation)
  const onPanelChange = (date: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    setCurrentDate(date);
  };

  // Custom date cell renderer
  const dateCellRender = (value: Dayjs) => {
    const events = getEventsForDate(value);
    const isToday = value.isSame(dayjs(), "day");
    const isPast = value.isBefore(dayjs(), "day");

    if (events.length === 0) {
      return (
        <div
          className={`h-full min-h-[80px] p-1 ${isPast ? "opacity-60" : ""}`}
        >
          {/* Empty cell for dates without events */}
        </div>
      );
    }

    return (
      <div
        className={`h-full min-h-[80px] p-1 ${
          isPast ? "opacity-60" : ""
        } flex items-center justify-center`}
        onClick={() => {
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

  // Handle delete schedule event
  const handleDeleteScheduleEvent = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteScheduleEvent(scheduleToDelete.scheduleId);
      message.success(`Đã xóa lớp ${scheduleToDelete.className} khỏi lịch`);

      // Refresh data without changing page
      const events = await fetchMonthSchedule(currentDate.toDate());

      setScheduleEvents(events);
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (err) {
      console.error("Error deleting schedule event:", err);
      message.error("Có lỗi xảy ra khi xóa lịch học");
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle quick add class
  const handleQuickAddClass = (date?: Dayjs) => {
    const targetDate = date || dayjs();
    const formattedDate = targetDate.format("YYYY-MM-DD");
    router.push(
      `/dashboard/manager/schedule/add-class?date=${formattedDate}&slotKey=slot1`
    );
  };

  // Enhanced date cell with drawer trigger
  const enhancedDateCellRender = (value: Dayjs) => {
    return dateCellRender(value);
  };

  // Get statistics
  const getStatistics = () => {
    const totalEvents = scheduleEvents.length;
    const totalSlots = scheduleEvents.length; // Each event has one slot
    const uniquePools = new Set(
      scheduleEvents.map((event) => event.pool?.title).filter(Boolean)
    ).size;

    return { totalEvents, totalSlots, uniquePools };
  };

  const stats = getStatistics();

  if (loading || slotsLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400'></div>
          <p className='mt-4 text-gray-600 dark:text-gray-300'>
            Đang tải lịch học...
          </p>
        </div>
      </div>
    );
  }

  if (error || slotsError) {
    return (
      <div className='container mx-auto py-8'>
        <Alert
          message='Lỗi tải dữ liệu'
          description={error || slotsError}
          type='error'
          action={
            <AntdButton
              size='small'
              onClick={() => window.location.reload()}
            >
              Thử lại
            </AntdButton>
          }
        />
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
              <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
                <CalendarOutlined className='text-blue-500' />
                Lịch học
              </h1>
            </div>
            <p className='text-muted-foreground'>
              Quản lý và xem lịch học của trung tâm với giao diện Ant Design
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <AntdButton
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => handleQuickAddClass()}
            >
              Thêm lớp học
            </AntdButton>
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
            cellRender={enhancedDateCellRender}
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
          onClose={() => setDrawerOpen(false)}
          className='calendar-drawer'
        >
          {drawerDate && (
            <div className='space-y-6'>
              {(() => {
                const events = getEventsForDate(drawerDate);

                if (events.length === 0) {
                  return (
                    <div className='text-center py-12'>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div>
                            <div className='text-gray-500 dark:text-gray-400 mb-4'>
                              Chưa có lớp học nào trong ngày này
                            </div>
                            <AntdButton
                              type='primary'
                              icon={<PlusOutlined />}
                              onClick={() => handleQuickAddClass(drawerDate)}
                            >
                              Thêm lớp học mới
                            </AntdButton>
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
                        <AntdButton
                          type='dashed'
                          icon={<PlusOutlined />}
                          onClick={() => handleQuickAddClass(drawerDate)}
                        >
                          Thêm lớp
                        </AntdButton>
                      </div>

                      <div className='space-y-3'>
                        {events.map((event, index) => (
                          <AntdCard
                            key={index}
                            size='small'
                            className='hover:shadow-md transition-all cursor-pointer'
                            onClick={() => {
                              router.push(
                                `/dashboard/manager/schedule/slot-details?slotId=${
                                  event.slotId
                                }&date=${drawerDate.format(
                                  "YYYY-MM-DD"
                                )}&slotTitle=${encodeURIComponent(
                                  event.slotTitle
                                )}&time=${encodeURIComponent(event.slotTime)}`
                              );
                            }}
                          >
                            <div className='flex items-start justify-between'>
                              <div className='flex items-start gap-3 flex-1'>
                                <Avatar
                                  style={{ backgroundColor: event.color }}
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
                                      e.stopPropagation();
                                      router.push(
                                        `/dashboard/manager/schedule/slot-details?slotId=${
                                          event.slotId
                                        }&date=${drawerDate.format(
                                          "YYYY-MM-DD"
                                        )}&slotTitle=${encodeURIComponent(
                                          event.slotTitle
                                        )}&time=${encodeURIComponent(
                                          event.slotTime
                                        )}`
                                      );
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title='Xóa lớp học'>
                                  <AntdButton
                                    type='text'
                                    size='small'
                                    icon={<DeleteOutlined />}
                                    danger
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setScheduleToDelete({
                                        scheduleId: event.scheduleId,
                                        className: event.className,
                                        date: drawerDate.format("YYYY-MM-DD"),
                                        slotTitle: event.slotTitle,
                                      });
                                      setDeleteDialogOpen(true);
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
          )}
        </Drawer>

        {/* Delete Confirmation Modal */}
        <Modal
          title={
            <Space>
              <DeleteOutlined className='text-red-500' />
              Xác nhận xóa lớp học
            </Space>
          }
          open={deleteDialogOpen}
          onCancel={() => setDeleteDialogOpen(false)}
          footer={[
            <AntdButton
              key='cancel'
              onClick={() => setDeleteDialogOpen(false)}
            >
              Hủy
            </AntdButton>,
            <AntdButton
              key='delete'
              type='primary'
              danger
              loading={isDeleting}
              onClick={handleDeleteScheduleEvent}
            >
              Xóa lớp học
            </AntdButton>,
          ]}
        >
          {scheduleToDelete && (
            <div>
              <Alert
                message='Bạn đang xóa lớp học khỏi lịch'
                type='warning'
                showIcon
                className='mb-4'
              />
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <Text type='secondary'>Lớp học:</Text>
                  <Text strong>{scheduleToDelete.className}</Text>
                </div>
                <div className='flex justify-between'>
                  <Text type='secondary'>Ngày:</Text>
                  <Text>
                    {dayjs(scheduleToDelete.date).format("DD/MM/YYYY dddd")}
                  </Text>
                </div>
                <div className='flex justify-between'>
                  <Text type='secondary'>Khung giờ:</Text>
                  <Tag>{scheduleToDelete.slotTitle}</Tag>
                </div>
              </div>
              <Alert
                message='Lưu ý: Hành động này không thể hoàn tác!'
                type='error'
                showIcon
                className='mt-4'
              />
            </div>
          )}
        </Modal>
      </div>
    </ConfigProvider>
  );
}
