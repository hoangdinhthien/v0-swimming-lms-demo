"use client";

import { useState, useEffect } from "react";
import { Avatar as AntAvatar } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  InfoCircleOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Info, Edit, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { fetchSlotDetail, type SlotDetail } from "@/api/manager/slot-api";
import { fetchCourseById } from "@/api/manager/courses-api";
import { fetchClassNotes, type ClassNote } from "@/api/manager/class-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import type { ScheduleEvent } from "@/api/manager/schedule-api";
import PermissionGuard from "@/components/permission-guard";

// Set Vietnamese locale for dayjs
dayjs.locale("vi");

interface ClassDetailModalProps {
  open: boolean;
  onClose: () => void;
  scheduleEvent: ScheduleEvent | null;
  onEdit?: (event: ScheduleEvent) => void;
  onDelete?: (event: ScheduleEvent) => void;
}

interface CourseDetail {
  _id: string;
  title: string;
  description?: string;
  level?: string;
  duration?: string;
  capacity?: number;
}

// Interface phù hợp với response thực tế từ fetchSlotDetail
interface ActualClassroom {
  _id: string;
  name: string;
  course: string;
  member?: string[];
  instructor?: string; // Huấn luyện viên cố định của lớp
}

interface ActualPool {
  _id: string;
  title: string;
  type?: string;
  dimensions?: string;
  depth?: string;
  capacity?: number;
  maintance_status?: string;
}

interface ActualSchedule {
  _id: string;
  classroom: ActualClassroom;
  pool: ActualPool; // Từ response data thì pool là single object, không phải array
  instructor?: {
    _id: string;
    username: string;
    email?: string;
    phone?: string;
    featured_image?: string[];
  }; // Full instructor object from response
  date: string;
}

export default function ClassDetailModal({
  open,
  onClose,
  scheduleEvent,
  onEdit,
  onDelete,
}: ClassDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [slotDetail, setSlotDetail] = useState<SlotDetail | null>(null);
  const [detailedSchedule, setDetailedSchedule] =
    useState<ActualSchedule | null>(null);

  // Class notes
  const [classNotes, setClassNotes] = useState<ClassNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Load additional details when modal opens
  useEffect(() => {
    if (open && scheduleEvent) {
      loadDetailedInformation();
    } else if (!open) {
      // Reset state when modal closes
      resetState();
    }
  }, [open, scheduleEvent]);

  const resetState = () => {
    setCourseDetail(null);
    setSlotDetail(null);
    setDetailedSchedule(null);
    setClassNotes([]);
    setLoadingNotes(false);
  };

  const loadDetailedInformation = async () => {
    if (!scheduleEvent) return;

    setLoading(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        console.error("Missing tenant or token");
        return;
      }

      // Fetch slot details để lấy thông tin chi tiết về schedule
      if (scheduleEvent.slot?._id && scheduleEvent.date) {
        try {
          const slot = await fetchSlotDetail(
            scheduleEvent.slot._id,
            scheduleEvent.date.split("T")[0]
          );
          setSlotDetail(slot);

          // Tìm schedule tương ứng với ngày hiện tại
          const currentSchedule = slot.schedules.find(
            (schedule) =>
              schedule.date.split("T")[0] === scheduleEvent.date.split("T")[0]
          );

          if (currentSchedule) {
            // Cast schedule để phù hợp với structure thực tế
            const actualSchedule: ActualSchedule = {
              _id: currentSchedule._id,
              classroom: currentSchedule.classroom as ActualClassroom,
              pool: Array.isArray(currentSchedule.pool)
                ? currentSchedule.pool[0]
                : currentSchedule.pool,
              instructor: (currentSchedule as any).instructor, // Cast vì interface chưa có field này
              date: currentSchedule.date,
            };
            setDetailedSchedule(actualSchedule);

            // Fetch class notes using schedule ID
            if (actualSchedule._id) {
              try {
                setLoadingNotes(true);
                const notes = await fetchClassNotes(
                  actualSchedule._id,
                  tenantId,
                  token
                );
                setClassNotes(notes);
              } catch (error) {
                console.warn("❌ Failed to fetch class notes:", error);
                setClassNotes([]);
              } finally {
                setLoadingNotes(false);
              }
            }

            // Fetch course details
            if (actualSchedule.classroom?.course) {
              try {
                const course = await fetchCourseById({
                  courseId: actualSchedule.classroom.course,
                  tenantId,
                  token,
                });
                setCourseDetail(course);
              } catch (error) {
                console.warn("❌ Failed to fetch course details:", error);
              }
            }
          }
        } catch (error) {
          console.warn("Failed to fetch slot details:", error);
        }
      }
    } catch (error) {
      console.error("❌ Error loading detailed information:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const getTimeRange = (): string => {
    if (!slotDetail) return "";
    const { start_time, end_time, start_minute, end_minute } = slotDetail;
    return `${formatTime(start_time, start_minute)} - ${formatTime(
      end_time,
      end_minute
    )}`;
  };

  const getFormattedDate = (): string => {
    if (!scheduleEvent?.date) return "";
    return dayjs(scheduleEvent.date).format("dddd, DD/MM/YYYY");
  };

  const handleEdit = () => {
    if (scheduleEvent && onEdit) {
      onEdit(scheduleEvent);
      onClose();
    }
  };

  const handleDelete = () => {
    if (scheduleEvent && onDelete) {
      onDelete(scheduleEvent);
      onClose();
    }
  };

  if (!scheduleEvent) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onClose}
    >
      <DialogContent className='max-w-3xl max-h-[85vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-3 text-xl'>
            <Info className='h-5 w-5 text-blue-500' />
            <div>
              <div>Chi tiết buổi học</div>
              <DialogDescription className='text-sm mt-1'>
                Thông tin chi tiết về buổi học
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground mb-4' />
            <p className='text-muted-foreground'>
              Đang tải thông tin chi tiết...
            </p>
          </div>
        ) : (
          <Tabs
            defaultValue='slot-info'
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='slot-info'>Thông tin slot</TabsTrigger>
              <TabsTrigger value='class-notes'>Ghi chú học viên</TabsTrigger>
            </TabsList>

            <TabsContent
              value='slot-info'
              className='space-y-4 mt-4'
            >
              {/* Header Card */}
              <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <Avatar className='h-12 w-12'>
                        <AvatarFallback className='bg-blue-500 text-white'>
                          <TeamOutlined className='text-xl' />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className='text-xl font-semibold mb-1'>
                          {detailedSchedule?.classroom?.name ||
                            "Không xác định"}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          {slotDetail?.title || "Không xác định"}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant='secondary'
                      className='text-sm px-3 py-1'
                    >
                      {getTimeRange()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='text-base'>Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Ngày học */}
                  <div className='flex items-start gap-3 p-3 bg-muted/30 rounded-lg'>
                    <CalendarOutlined className='text-lg text-blue-500 mt-0.5' />
                    <div className='flex-1'>
                      <div className='text-sm text-muted-foreground mb-1'>
                        Ngày học
                      </div>
                      <div className='font-semibold'>{getFormattedDate()}</div>
                    </div>
                  </div>

                  {/* Thời gian */}
                  <div className='flex items-start gap-3 p-3 bg-muted/30 rounded-lg'>
                    <ClockCircleOutlined className='text-lg text-blue-500 mt-0.5' />
                    <div className='flex-1'>
                      <div className='text-sm text-muted-foreground mb-1'>
                        Thời gian
                      </div>
                      <div className='font-semibold'>{getTimeRange()}</div>
                      {slotDetail?.duration && (
                        <div className='text-sm text-muted-foreground mt-1'>
                          Thời lượng: {slotDetail.duration}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Khóa học */}
                  <div className='flex items-start gap-3 p-3 bg-muted/30 rounded-lg'>
                    <BookOutlined className='text-lg text-blue-500 mt-0.5' />
                    <div className='flex-1'>
                      <div className='text-sm text-muted-foreground mb-1'>
                        Khóa học
                      </div>
                      <div className='font-semibold'>
                        {courseDetail?.title ||
                          detailedSchedule?.classroom?.name ||
                          "Đang tải..."}
                      </div>
                      {courseDetail?.description && (
                        <div className='text-sm text-muted-foreground mt-1'>
                          {courseDetail.description}
                        </div>
                      )}
                      {courseDetail?.level && (
                        <Badge
                          variant='secondary'
                          className='mt-2'
                        >
                          {courseDetail.level}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Hồ bơi */}
                  <div className='flex items-start gap-3 p-3 bg-muted/30 rounded-lg'>
                    <EnvironmentOutlined className='text-lg text-blue-500 mt-0.5' />
                    <div className='flex-1'>
                      <div className='text-sm text-muted-foreground mb-1'>
                        Hồ bơi
                      </div>
                      <div className='font-semibold'>
                        {detailedSchedule?.pool?.title || "Không xác định"}
                      </div>
                      {detailedSchedule?.pool && (
                        <div className='text-sm text-muted-foreground mt-2 space-y-1'>
                          {detailedSchedule.pool.type && (
                            <div>Loại: {detailedSchedule.pool.type}</div>
                          )}
                          {detailedSchedule.pool.dimensions && (
                            <div>
                              Kích thước: {detailedSchedule.pool.dimensions}
                            </div>
                          )}
                          {detailedSchedule.pool.depth && (
                            <div>Độ sâu: {detailedSchedule.pool.depth}</div>
                          )}
                          {detailedSchedule.pool.capacity && (
                            <div>
                              Sức chứa: {detailedSchedule.pool.capacity} người
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <UserOutlined className='text-muted-foreground' />
                    <span className='font-medium'>Huấn luyện viên:</span>
                    <div className='flex items-center gap-2'>
                      <b>
                        {detailedSchedule?.instructor?.username ||
                          "Đang tải..."}
                      </b>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              {slotDetail?.schedules && slotDetail.schedules.length > 1 && (
                <Card className='bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'>
                  <CardContent className='p-4'>
                    <div className='flex items-center gap-2 text-sm'>
                      <Info className='h-4 w-4 text-blue-500' />
                      <span>
                        Khung giờ này có {slotDetail.schedules.length} lớp học
                        khác trong cùng ngày
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent
              value='class-notes'
              className='space-y-4 mt-4'
            >
              {loadingNotes ? (
                <div className='flex flex-col items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground mb-2' />
                  <p className='text-sm text-muted-foreground'>
                    Đang tải ghi chú...
                  </p>
                </div>
              ) : classNotes.length > 0 ? (
                <div className='space-y-4'>
                  {classNotes.map((note) => {
                    let parsedNote = null;
                    try {
                      parsedNote = JSON.parse(note.note);
                    } catch (error) {
                      console.warn("Failed to parse note:", error);
                    }

                    return (
                      <Card key={note._id}>
                        <CardHeader className='pb-3'>
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-8 w-8'>
                                <AvatarImage
                                  src={note.member.featured_image?.[0]}
                                />
                                <AvatarFallback>
                                  {note.member.username
                                    ?.charAt(0)
                                    ?.toUpperCase() || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className='font-medium'>
                                  {note.member.username}
                                </h4>
                                <p className='text-sm text-muted-foreground'>
                                  {note.member.email}
                                </p>
                              </div>
                            </div>
                            <div className='text-xs text-muted-foreground'>
                              {dayjs(note.created_at).format(
                                "DD/MM/YYYY HH:mm"
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {parsedNote ? (
                            <div className='space-y-4'>
                              {parsedNote.text && (
                                <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
                                  <span className='font-medium text-blue-700 dark:text-blue-300'>
                                    Ghi chú:{" "}
                                  </span>
                                  <span className='text-sm text-blue-600 dark:text-blue-400'>
                                    {parsedNote.text}
                                  </span>
                                </div>
                              )}
                              {parsedNote.evaluation &&
                                parsedNote.evaluationCriteria && (
                                  <div className='space-y-3'>
                                    <span className='font-medium'>
                                      Đánh giá chi tiết:
                                    </span>
                                    {parsedNote.evaluationCriteria.map(
                                      (
                                        criteria: any,
                                        criteriaIndex: number
                                      ) => {
                                        const criteriaKey = `${criteriaIndex}_`;
                                        const relevantEvaluations =
                                          Object.entries(parsedNote.evaluation)
                                            .filter(([key]) =>
                                              key.startsWith(criteriaKey)
                                            )
                                            .map(([key, value]) => ({
                                              field: key.replace(
                                                criteriaKey,
                                                ""
                                              ),
                                              value,
                                            }));

                                        return (
                                          <div
                                            key={criteria._id}
                                            className='border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50'
                                          >
                                            <h5 className='font-medium text-sm mb-2'>
                                              {criteria.title}
                                            </h5>
                                            <div className='space-y-1'>
                                              {relevantEvaluations.map(
                                                ({ field, value }) => (
                                                  <div
                                                    key={field}
                                                    className='flex justify-between items-center text-sm'
                                                  >
                                                    <span className='text-muted-foreground'>
                                                      {field}:
                                                    </span>
                                                    <span
                                                      className={`font-medium ${
                                                        value === 1
                                                          ? "text-green-600"
                                                          : value === 0
                                                          ? "text-red-600"
                                                          : typeof value ===
                                                              "number" &&
                                                            value > 0
                                                          ? "text-blue-600"
                                                          : ""
                                                      }`}
                                                    >
                                                      {value === 1
                                                        ? "✓ Đạt"
                                                        : value === 0
                                                        ? "✗ Không đạt"
                                                        : typeof value ===
                                                          "number"
                                                        ? value
                                                        : String(value)}
                                                    </span>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                )}
                              {!parsedNote.evaluationCriteria &&
                                parsedNote.evaluation && (
                                  <div className='p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700'>
                                    <span className='font-medium text-yellow-700 dark:text-yellow-300'>
                                      Đánh giá:{" "}
                                    </span>
                                    <div className='text-sm mt-1 space-y-1'>
                                      {Object.entries(
                                        parsedNote.evaluation
                                      ).map(([key, value]) => (
                                        <div
                                          key={key}
                                          className='flex justify-between'
                                        >
                                          <span className='text-muted-foreground'>
                                            {key}:
                                          </span>
                                          <span
                                            className={`font-medium ${
                                              value === 1
                                                ? "text-green-600"
                                                : value === 0
                                                ? "text-red-600"
                                                : typeof value === "number" &&
                                                  value > 0
                                                ? "text-blue-600"
                                                : ""
                                            }`}
                                          >
                                            {value === 1
                                              ? "✓ Đạt"
                                              : value === 0
                                              ? "✗ Không đạt"
                                              : typeof value === "number"
                                              ? value
                                              : String(value)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                            </div>
                          ) : (
                            <div className='text-sm text-muted-foreground text-center py-4'>
                              Không thể hiển thị ghi chú
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <p className='text-sm text-muted-foreground'>
                    Chưa có ghi chú nào cho lớp học này
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className='gap-2'>
          <Button
            variant='outline'
            onClick={onClose}
          >
            Đóng
          </Button>
          <PermissionGuard
            module='Class'
            action='PUT'
          >
            <Button
              variant='secondary'
              onClick={handleEdit}
            >
              <Edit className='h-4 w-4 mr-2' />
              Chỉnh sửa
            </Button>
          </PermissionGuard>
          <PermissionGuard
            module='Class'
            action='DELETE'
          >
            <Button
              variant='destructive'
              onClick={handleDelete}
            >
              <Trash2 className='h-4 w-4 mr-2' />
              Xóa lớp học
            </Button>
          </PermissionGuard>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
