"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  Badge as AntdBadge,
  Spin,
  message,
  Modal,
  Button as AntdButton,
  Select as AntdSelect,
  Card as AntdCard,
  Popover,
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
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [availableWeeks, setAvailableWeeks] = useState<any[]>([]);
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

  // Function to update URL with current state
  const updateUrl = (week: string) => {
    const url = new URL(window.location.href);
    if (week) {
      url.searchParams.set("week", week);
    } else {
      url.searchParams.delete("week");
    }
    window.history.replaceState({}, "", url.toString());
  };

  // Function to handle week selection with URL update
  const handleWeekChange = (weekValue: string) => {
    setSelectedWeek(weekValue);
    updateUrl(weekValue);
  };

  // Initialize with current date
  useEffect(() => {
    const today = new Date();
    const weeks = getWeeksInYear(today);
    setAvailableWeeks(weeks);

    // Check if there's a week in URL params
    const weekFromUrl = searchParams.get("week");

    if (weekFromUrl && weeks.find((w) => w.value === weekFromUrl)) {
      setSelectedWeek(weekFromUrl);
      handleWeekChange(weekFromUrl);
    } else {
      // Find current week
      const currentWeek = weeks.find((week) => {
        const weekStart = new Date(week.start);
        const weekEnd = new Date(week.end);
        return today >= weekStart && today <= weekEnd;
      });

      if (currentWeek) {
        setSelectedWeek(currentWeek.value);
        handleWeekChange(currentWeek.value);
      } else if (weeks.length > 0) {
        setSelectedWeek(weeks[0].value);
        handleWeekChange(weeks[0].value);
      }
    }
  }, [searchParams]);

  // Effect to fetch data when component mounts or current date changes
  useEffect(() => {
    const loadScheduleData = async () => {
      setLoading(true);
      setError(null);

      try {
        let events: ScheduleEvent[] = [];

        if (viewMode === "month") {
          console.log(
            "🗓️ Fetching month schedule for:",
            currentDate.format("YYYY-MM-DD")
          );
          events = await fetchMonthSchedule(currentDate.toDate());
        } else if (viewMode === "week" && selectedWeek) {
          const weekObj = availableWeeks.find((w) => w.value === selectedWeek);
          if (weekObj && weekObj.start && weekObj.end) {
            console.log(
              "📅 Fetching week schedule from",
              weekObj.start,
              "to",
              weekObj.end
            );
            events = await fetchDateRangeSchedule(weekObj.start, weekObj.end);
          }
        }

        console.log("📊 Loaded schedule events:", {
          count: events.length,
          viewMode,
          selectedWeek: selectedWeek || "none",
          currentDate: currentDate.format("YYYY-MM-DD"),
          events: events.slice(0, 3).map((e) => ({
            id: e._id,
            date: e.date,
            slotCount: e.slot?.length || 0,
            classroomCount: e.classroom?.length || 0,
          })),
        });

        setScheduleEvents(events);
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
  }, [currentDate, viewMode, selectedWeek, availableWeeks]);

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    const dateStr = date.format("YYYY-MM-DD");
    const dayEvents = scheduleEvents.filter((event) => {
      const eventDateStr = event.date.split("T")[0];
      return eventDateStr === dateStr;
    });

    return dayEvents.map(formatScheduleEvent);
  };

  // Transform schedule event to display format
  const formatScheduleEvent = (scheduleEvent: ScheduleEvent): CalendarEvent => {
    // Handle both array and single object cases
    const slots =
      scheduleEvent.slot && Array.isArray(scheduleEvent.slot)
        ? scheduleEvent.slot
        : scheduleEvent.slot
        ? [scheduleEvent.slot]
        : [];
    const classrooms = Array.isArray(scheduleEvent.classroom)
      ? scheduleEvent.classroom
      : [scheduleEvent.classroom];

    const slot = slots[0]; // Assuming one slot per event for now
    const classroom = classrooms[0];

    return {
      id: scheduleEvent._id,
      className: classroom?.name || "Không xác định",
      slotTitle: slot?.title || "Không xác định",
      slotTime: slot
        ? `${Math.floor(slot.start_time / 60)
            .toString()
            .padStart(2, "0")}:${(slot.start_time % 60)
            .toString()
            .padStart(2, "0")} - ${Math.floor(slot.end_time / 60)
            .toString()
            .padStart(2, "0")}:${(slot.end_time % 60)
            .toString()
            .padStart(2, "0")}`
        : "",
      course: classroom?.course || "Không xác định",
      poolTitle: scheduleEvent.pool?.[0]?.title || "Không xác định",
      scheduleId: scheduleEvent._id,
      slotId: slot?._id || "",
      type: "class",
      color: getEventColor(classroom?.course),
    };
  };

  // Get color for event based on course type
  const getEventColor = (course: string): string => {
    const colorMap: { [key: string]: string } = {
      "Bơi cơ bản": "#52c41a",
      "Bơi nâng cao": "#1890ff",
      "Bơi trẻ em": "#fa8c16",
      Aerobic: "#eb2f96",
      "Bơi người lớn": "#722ed1",
      "Bơi tự do": "#13c2c2",
    };
    return colorMap[course] || "#1890ff";
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
      <div className={`h-full min-h-[80px] p-1 ${isPast ? "opacity-60" : ""}`}>
        <div className='space-y-1'>
          {events.slice(0, 3).map((event, index) => (
            <div
              key={index}
              className={`text-xs p-1 rounded truncate cursor-pointer transition-all hover:scale-105 ${
                isToday ? "shadow-md" : "shadow-sm"
              }`}
              style={{
                backgroundColor: event.color + "20",
                borderLeft: `3px solid ${event.color}`,
                color: event.color,
              }}
              title={`${event.className} - ${event.slotTitle} (${event.slotTime})`}
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/dashboard/manager/schedule/slot-details?slotId=${
                    event.slotId
                  }&date=${value.format(
                    "YYYY-MM-DD"
                  )}&slotTitle=${encodeURIComponent(
                    event.slotTitle
                  )}&time=${encodeURIComponent(event.slotTime)}`
                );
              }}
            >
              <div className='font-medium'>{event.className}</div>
              <div className='text-xs opacity-75'>{event.slotTime}</div>
            </div>
          ))}
          {events.length > 3 && (
            <div className='text-xs text-gray-500 px-1'>
              +{events.length - 3} lớp khác
            </div>
          )}
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
      const events =
        viewMode === "month"
          ? await fetchMonthSchedule(currentDate.toDate())
          : selectedWeek
          ? await fetchDateRangeSchedule(
              availableWeeks.find((w) => w.value === selectedWeek)?.start,
              availableWeeks.find((w) => w.value === selectedWeek)?.end
            )
          : [];

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

  // Render event details in popover
  const renderEventPopover = (events: CalendarEvent[], date: Dayjs) => {
    if (events.length === 0) {
      return (
        <div className='w-80'>
          <div className='mb-3'>
            <Title
              level={5}
              className='!mb-1'
            >
              {date.format("DD/MM/YYYY")}
            </Title>
            <Text type='secondary'>{date.format("dddd")}</Text>
          </div>

          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description='Chưa có lớp học nào'
            className='my-4'
          />

          <AntdButton
            type='primary'
            icon={<PlusOutlined />}
            block
            onClick={() => handleQuickAddClass(date)}
          >
            Thêm lớp học
          </AntdButton>
        </div>
      );
    }

    return (
      <div className='w-80 max-h-96 overflow-y-auto'>
        <div className='mb-3'>
          <Title
            level={5}
            className='!mb-1'
          >
            Lịch học - {date.format("DD/MM/YYYY")}
          </Title>
          <Text type='secondary'>
            {date.format("dddd")} • {events.length} lớp học
          </Text>
        </div>

        <List
          size='small'
          dataSource={events}
          renderItem={(event) => (
            <List.Item
              className='!px-0 hover:bg-gray-50 rounded p-2 cursor-pointer transition-all'
              onClick={() => {
                router.push(
                  `/dashboard/manager/schedule/slot-details?slotId=${
                    event.slotId
                  }&date=${date.format(
                    "YYYY-MM-DD"
                  )}&slotTitle=${encodeURIComponent(
                    event.slotTitle
                  )}&time=${encodeURIComponent(event.slotTime)}`
                );
              }}
              actions={[
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
                        }&date=${date.format(
                          "YYYY-MM-DD"
                        )}&slotTitle=${encodeURIComponent(
                          event.slotTitle
                        )}&time=${encodeURIComponent(event.slotTime)}`
                      );
                    }}
                  />
                </Tooltip>,
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
                        date: date.format("YYYY-MM-DD"),
                        slotTitle: event.slotTitle,
                      });
                      setDeleteDialogOpen(true);
                    }}
                  />
                </Tooltip>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{ backgroundColor: event.color }}
                    icon={<EnvironmentOutlined />}
                    size='small'
                  />
                }
                title={
                  <Space>
                    <Text strong>{event.className}</Text>
                    <Tag color={event.color}>{event.slotTitle}</Tag>
                  </Space>
                }
                description={
                  <Space
                    direction='vertical'
                    size={1}
                  >
                    <Space size='small'>
                      <ClockCircleOutlined />
                      <Text
                        type='secondary'
                        className='text-xs'
                      >
                        {event.slotTime}
                      </Text>
                    </Space>
                    <Space size='small'>
                      <BookOutlined />
                      <Text
                        type='secondary'
                        className='text-xs'
                      >
                        {event.course}
                      </Text>
                    </Space>
                    <Space size='small'>
                      <EnvironmentOutlined />
                      <Text
                        type='secondary'
                        className='text-xs'
                      >
                        {event.poolTitle}
                      </Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />

        <Divider className='my-3' />

        <AntdButton
          type='dashed'
          icon={<PlusOutlined />}
          block
          onClick={() => handleQuickAddClass(date)}
        >
          Thêm lớp học mới
        </AntdButton>
      </div>
    );
  };

  // Enhanced date cell with popover
  const enhancedDateCellRender = (value: Dayjs) => {
    const events = getEventsForDate(value);

    return (
      <Popover
        content={renderEventPopover(events, value)}
        title={null}
        trigger='click'
        placement='bottomLeft'
        overlayClassName='calendar-popover'
      >
        {dateCellRender(value)}
      </Popover>
    );
  };

  // Get statistics
  const getStatistics = () => {
    const totalEvents = scheduleEvents.length;
    const totalSlots = scheduleEvents.reduce(
      (total, event) => total + (event.slot?.length || 0),
      0
    );
    const uniquePools = new Set(
      scheduleEvents.map((event) => event.pool?.[0]?.title).filter(Boolean)
    ).size;

    return { totalEvents, totalSlots, uniquePools };
  };

  const stats = getStatistics();

  if (loading || slotsLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Spin
          size='large'
          tip='Đang tải lịch học...'
        />
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
            <Segmented
              value={viewMode}
              onChange={setViewMode}
              options={[
                { label: "Tháng", value: "month", icon: <CalendarOutlined /> },
                { label: "Tuần", value: "week", icon: <ClockCircleOutlined /> },
              ]}
            />

            <AntdButton
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => handleQuickAddClass()}
            >
              Thêm lớp học
            </AntdButton>
          </div>
        </div>

        {/* Week selector for week view */}
        {viewMode === "week" && (
          <AntdCard size='small'>
            <div className='flex items-center gap-3'>
              <Text strong>Chọn tuần:</Text>
              <AntdSelect
                value={selectedWeek}
                onChange={handleWeekChange}
                className='min-w-[200px]'
                placeholder='Chọn tuần'
              >
                {availableWeeks.map((week) => (
                  <Option
                    key={week.value}
                    value={week.value}
                  >
                    {week.label}
                  </Option>
                ))}
              </AntdSelect>
            </div>
          </AntdCard>
        )}

        {/* Statistics Cards */}
        {scheduleEvents.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col
              xs={24}
              sm={8}
            >
              <AntdCard
                size='small'
                className='text-center'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-blue-600 mb-1'>
                    {stats.totalEvents}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1'
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
                className='text-center'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-green-600 mb-1'>
                    {stats.totalSlots}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1'
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
                className='text-center'
              >
                <div className='flex flex-col items-center'>
                  <div className='text-2xl font-bold text-amber-600 mb-1'>
                    {stats.uniquePools}
                  </div>
                  <Text
                    type='secondary'
                    className='flex items-center gap-1'
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
            dateCellRender={enhancedDateCellRender}
            mode='month'
          />
        </AntdCard>

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
