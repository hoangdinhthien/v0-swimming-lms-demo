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
} from "@ant-design/icons";
import type { CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";
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

export default function AntdCalendarPage() {
  usePerformanceMonitor("AntdCalendarPage");

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
      } finally {
        setLoading(false);
      }
    };

    loadScheduleData();
  }, [currentDate, viewMode, selectedWeek, availableWeeks]);

  // Get events for a specific date
  const getEventsForDate = (date: Dayjs) => {
    const dateStr = date.format("YYYY-MM-DD");
    return scheduleEvents.filter((event) => {
      const eventDateStr = event.date.split("T")[0];
      return eventDateStr === dateStr;
    });
  };

  // Transform schedule event to display format
  const formatScheduleEvent = (scheduleEvent: ScheduleEvent) => {
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
      date: scheduleEvent.date,
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
      className: classroom?.name || "Không xác định",
      course: classroom?.course || "Không xác định",
      poolTitle: scheduleEvent.pool?.[0]?.title || "Không xác định",
      scheduleId: scheduleEvent._id,
      slotId: slot?._id || "",
    };
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

  // Get list data for calendar cell
  const getListData = (value: Dayjs) => {
    const events = getEventsForDate(value);
    return events.map((event) => {
      const formatted = formatScheduleEvent(event);
      return {
        type: "success" as const,
        content: formatted.className,
        time: formatted.slotTime,
        id: formatted.id,
        slotTitle: formatted.slotTitle,
        course: formatted.course,
        poolTitle: formatted.poolTitle,
      };
    });
  };

  // Custom date cell renderer
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    const isToday = value.isSame(dayjs(), "day");
    const isPast = value.isBefore(dayjs(), "day");

    return (
      <div className={`h-full ${isPast ? "opacity-60" : ""}`}>
        {listData.length > 0 && (
          <div className='space-y-1'>
            {listData.slice(0, 2).map((item, index) => (
              <div
                key={index}
                className={`text-xs p-1 rounded truncate ${
                  isToday
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
                title={`${item.content} - ${item.slotTitle} (${item.time})`}
              >
                {item.content}
              </div>
            ))}
            {listData.length > 2 && (
              <div className='text-xs text-gray-500'>
                +{listData.length - 2} khác
              </div>
            )}
          </div>
        )}
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

      // Refresh data
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

  // Handle cell click to show events
  const handleCellClick = (date: Dayjs) => {
    setSelectedDate(date);
    const events = getEventsForDate(date);

    if (events.length === 0) {
      // Navigate to add class page for empty slots
      const formattedDate = date.format("YYYY-MM-DD");
      router.push(
        `/dashboard/manager/schedule/add-class?date=${formattedDate}&slotKey=slot1`
      );
    }
  };

  // Render event details in popover
  const renderEventPopover = (events: any[], date: Dayjs) => {
    const formattedEvents = events.map(formatScheduleEvent);

    return (
      <div className='w-80 max-h-96 overflow-y-auto'>
        <div className='mb-3'>
          <Title
            level={5}
            className='!mb-1'
          >
            Lịch học - {date.format("DD/MM/YYYY")}
          </Title>
          <Text type='secondary'>{date.format("dddd")}</Text>
        </div>

        <List
          size='small'
          dataSource={formattedEvents}
          renderItem={(event) => (
            <List.Item
              actions={[
                <AntdButton
                  type='text'
                  size='small'
                  icon={<EyeOutlined />}
                  onClick={() =>
                    router.push(
                      `/dashboard/manager/schedule/slot-details?slotId=${
                        event.slotId
                      }&date=${
                        event.date.split("T")[0]
                      }&slotTitle=${encodeURIComponent(
                        event.slotTitle
                      )}&time=${encodeURIComponent(event.slotTime)}`
                    )
                  }
                />,
                <AntdButton
                  type='text'
                  size='small'
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => {
                    setScheduleToDelete({
                      scheduleId: event.scheduleId,
                      className: event.className,
                      date: event.date.split("T")[0],
                      slotTitle: event.slotTitle,
                    });
                    setDeleteDialogOpen(true);
                  }}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    size='small'
                  />
                }
                title={
                  <Space>
                    <Text strong>{event.className}</Text>
                    <AntdBadge
                      color='blue'
                      text={event.slotTitle}
                    />
                  </Space>
                }
                description={
                  <Space
                    direction='vertical'
                    size='small'
                  >
                    <Space size='small'>
                      <ClockCircleOutlined />
                      <Text type='secondary'>{event.slotTime}</Text>
                    </Space>
                    <Space size='small'>
                      <EnvironmentOutlined />
                      <Text type='secondary'>{event.poolTitle}</Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />

        <Divider />

        <div className='flex justify-between'>
          <AntdButton
            type='dashed'
            icon={<PlusOutlined />}
            onClick={() => {
              const formattedDate = date.format("YYYY-MM-DD");
              router.push(
                `/dashboard/manager/schedule/add-class?date=${formattedDate}&slotKey=slot1`
              );
            }}
          >
            Thêm lớp học
          </AntdButton>
        </div>
      </div>
    );
  };

  // Enhanced date cell with popover
  const enhancedDateCellRender = (value: Dayjs) => {
    const events = getEventsForDate(value);

    if (events.length === 0) {
      return dateCellRender(value);
    }

    return (
      <Popover
        content={renderEventPopover(events, value)}
        title={null}
        trigger='click'
        placement='bottomLeft'
      >
        <div className='cursor-pointer h-full'>{dateCellRender(value)}</div>
      </Popover>
    );
  };

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
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-red-500 mb-4'>
                Đã xảy ra lỗi khi tải dữ liệu lịch học
              </div>
              <p className='text-muted-foreground mb-4'>
                {error || slotsError}
              </p>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
            <h1 className='text-3xl font-bold tracking-tight'>Lịch học</h1>
          </div>
          <p className='text-muted-foreground'>
            Quản lý và xem lịch học của trung tâm
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <AntdSelect
            value={viewMode}
            onChange={setViewMode}
            className='w-32'
          >
            <Option value='month'>Tháng</Option>
            <Option value='week'>Tuần</Option>
          </AntdSelect>

          <AntdButton
            type='primary'
            icon={<PlusOutlined />}
            onClick={() => {
              const today = dayjs().format("YYYY-MM-DD");
              router.push(
                `/dashboard/manager/schedule/add-class?date=${today}&slotKey=slot1`
              );
            }}
          >
            Thêm lớp học
          </AntdButton>
        </div>
      </div>

      {/* Statistics Cards */}
      {scheduleEvents.length > 0 && (
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <AntdCard size='small'>
            <div className='flex justify-between items-center'>
              <div>
                <Text type='secondary'>Tổng sự kiện</Text>
                <div className='text-2xl font-bold text-blue-600'>
                  {scheduleEvents.length}
                </div>
              </div>
            </div>
          </AntdCard>

          <AntdCard size='small'>
            <div className='flex justify-between items-center'>
              <div>
                <Text type='secondary'>Lớp học</Text>
                <div className='text-2xl font-bold text-green-600'>
                  {scheduleEvents.length}
                </div>
              </div>
            </div>
          </AntdCard>

          <AntdCard size='small'>
            <div className='flex justify-between items-center'>
              <div>
                <Text type='secondary'>Số slot</Text>
                <div className='text-2xl font-bold text-amber-600'>
                  {scheduleEvents.reduce(
                    (total, event) => total + (event.slot?.length || 0),
                    0
                  )}
                </div>
              </div>
            </div>
          </AntdCard>
        </div>
      )}

      {/* Main Calendar */}
      <AntdCard className='shadow-lg'>
        <Calendar
          value={currentDate}
          onSelect={onSelect}
          onPanelChange={onPanelChange}
          dateCellRender={enhancedDateCellRender}
          mode={viewMode === "week" ? "month" : "month"} // Antd doesn't have week mode, use month
          locale={{
            lang: {
              locale: "vi_VN",
              monthFormat: "MMMM",
              today: "Hôm nay",
              now: "Bây giờ",
              backToToday: "Về hôm nay",
              ok: "OK",
              clear: "Xóa",
              month: "Tháng",
              year: "Năm",
              timeSelect: "Chọn giờ",
              dateSelect: "Chọn ngày",
              monthSelect: "Chọn tháng",
              yearSelect: "Chọn năm",
              decadeSelect: "Chọn thập kỷ",
              previousMonth: "Tháng trước",
              nextMonth: "Tháng sau",
              previousYear: "Năm trước",
              nextYear: "Năm sau",
              previousDecade: "Thập kỷ trước",
              nextDecade: "Thập kỷ sau",
              previousCentury: "Thế kỷ trước",
              nextCentury: "Thế kỷ sau",
            },
          }}
        />
      </AntdCard>

      {/* Delete Confirmation Modal */}
      <Modal
        title='Xác nhận xóa'
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
            Xóa
          </AntdButton>,
        ]}
      >
        {scheduleToDelete && (
          <div>
            <p>Bạn có chắc chắn muốn xóa lớp học sau khỏi lịch?</p>
            <div className='mt-4 p-3 bg-gray-50 rounded'>
              <p>
                <strong>Lớp học:</strong> {scheduleToDelete.className}
              </p>
              <p>
                <strong>Ngày:</strong>{" "}
                {new Date(scheduleToDelete.date).toLocaleDateString("vi-VN")}
              </p>
              <p>
                <strong>Khung giờ:</strong> {scheduleToDelete.slotTitle}
              </p>
            </div>
            <p className='mt-3 text-red-600'>
              <strong>Lưu ý:</strong> Hành động này không thể hoàn tác!
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
