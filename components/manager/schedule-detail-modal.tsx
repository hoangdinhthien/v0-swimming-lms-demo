"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  Info,
  Calendar,
  Clock,
  MapPin,
  User,
  Edit,
  Trash2,
} from "lucide-react";
import dayjs from "dayjs";
import { fetchScheduleById } from "@/api/manager/schedule-api";
import { fetchClassNotes } from "@/api/manager/class-api";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";
import PermissionGuard from "@/components/permission-guard";

// Set Vietnamese locale for dayjs
dayjs.locale("vi");

interface ScheduleDetailModalProps {
  open: boolean;
  onClose: () => void;
  scheduleId: string | null;
  onEdit?: (schedule: any) => void;
  onDelete?: (schedule: any) => void;
}

interface ClassNote {
  _id: string;
  member: {
    _id: string;
    username: string;
    email?: string;
    role_front?: string[];
    parent_id?: string[];
    is_active?: boolean;
    birthday?: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    featured_image?: string[];
    role?: string[];
  };
  class: {
    _id: string;
    name: string;
    course: string;
    instructor: string;
    show_on_regist_course?: boolean;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    tenant_id?: string;
    member?: string[];
    member_passed?: string[];
  };
  schedule?: {
    _id: string;
    slot: string;
    date: string;
    classroom: string;
    pool: string;
    instructor: string;
    created_at?: string;
    created_by?: string;
    updated_at?: string;
    updated_by?: string;
    tenant_id?: string;
  };
  note: string; // JSON string that needs to be parsed
  created_at: string;
  created_by: {
    _id: string;
    username: string;
    email?: string;
    role_front?: string[];
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    featured_image?: string[];
    role?: string[];
  };
  updated_at: string;
  updated_by: {
    _id: string;
    username: string;
    email?: string;
    role_front?: string[];
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    featured_image?: string[];
    role?: string[];
  };
  tenant_id: string;
}

export default function ScheduleDetailModal({
  open,
  onClose,
  scheduleId,
  onEdit,
  onDelete,
}: ScheduleDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [scheduleDetail, setScheduleDetail] = useState<any>(null);

  // Class notes
  const [classNotes, setClassNotes] = useState<ClassNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Load schedule details when modal opens
  useEffect(() => {
    if (open && scheduleId) {
      loadScheduleDetails();
    } else if (!open) {
      resetState();
    }
  }, [open, scheduleId]);

  const resetState = () => {
    setScheduleDetail(null);
    setClassNotes([]);
    setLoadingNotes(false);
  };

  const loadScheduleDetails = async () => {
    if (!scheduleId) return;

    setLoading(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        console.error("Missing tenant or token");
        return;
      }

      // Fetch schedule details
      const scheduleData = await fetchScheduleById(scheduleId, tenantId, token);

      // Extract the schedule from the processed response
      const schedule = scheduleData?.events?.[0];

      if (schedule) {
        setScheduleDetail(schedule);

        // Fetch class notes using schedule ID
        try {
          setLoadingNotes(true);
          const notes = await fetchClassNotes(scheduleId, tenantId, token);
          setClassNotes(notes);
        } catch (error) {
          console.warn("❌ Failed to fetch class notes:", error);
          setClassNotes([]);
        } finally {
          setLoadingNotes(false);
        }
      }
    } catch (error) {
      console.error("❌ Error loading schedule details:", error);
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
    if (!scheduleDetail?.slot) return "";
    const { start_time, end_time, start_minute, end_minute } =
      scheduleDetail.slot;
    return `${formatTime(start_time, start_minute)} - ${formatTime(
      end_time,
      end_minute
    )}`;
  };

  const getFormattedDate = (): string => {
    if (!scheduleDetail?.date) return "";
    return dayjs(scheduleDetail.date).format("dddd, DD/MM/YYYY");
  };

  const handleEdit = () => {
    if (scheduleDetail && onEdit) {
      onEdit(scheduleDetail);
      onClose();
    }
  };

  const handleDelete = () => {
    if (scheduleDetail && onDelete) {
      onDelete(scheduleDetail);
      onClose();
    }
  };

  if (!scheduleId) {
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
        ) : scheduleDetail ? (
          <Tabs
            defaultValue='schedule-info'
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-2'>
              <TabsTrigger value='schedule-info'>
                Thông tin buổi học
              </TabsTrigger>
              <TabsTrigger value='class-notes'>Ghi chú học viên</TabsTrigger>
            </TabsList>

            <TabsContent
              value='schedule-info'
              className='space-y-4 mt-4'
            >
              {/* Header Card */}
              <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h3 className='font-semibold text-lg text-blue-900 dark:text-blue-100'>
                        {scheduleDetail.classroom?.name}
                      </h3>
                      <p className='text-blue-700 dark:text-blue-300 text-sm'>
                        {scheduleDetail.classroom?.course?.title}
                      </p>
                    </div>
                    <Badge
                      variant='outline'
                      className='bg-blue-100 text-blue-800 border-blue-300'
                    >
                      {getTimeRange()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Info className='h-4 w-4' />
                    Thông tin cơ bản
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Date */}
                  <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
                    <Calendar className='h-4 w-4 text-primary' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Ngày học</p>
                      <p className='font-medium'>{getFormattedDate()}</p>
                    </div>
                  </div>

                  {/* Time */}
                  <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
                    <Clock className='h-4 w-4 text-primary' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Thời gian</p>
                      <p className='font-medium'>{getTimeRange()}</p>
                    </div>
                  </div>

                  {/* Pool */}
                  <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
                    <MapPin className='h-4 w-4 text-primary' />
                    <div>
                      <p className='text-sm text-muted-foreground'>Hồ bơi</p>
                      <p className='font-medium'>
                        {scheduleDetail.pool?.title}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {scheduleDetail.pool?.dimensions} • Sức chứa:{" "}
                        {scheduleDetail.pool?.capacity} người
                      </p>
                    </div>
                  </div>

                  {/* Instructor */}
                  <div className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
                    <User className='h-4 w-4 text-primary' />
                    <div>
                      <p className='text-sm text-muted-foreground'>
                        Huấn luyện viên
                      </p>
                      <p className='font-medium'>
                        {scheduleDetail.instructor?.username ||
                          "Chưa phân công"}
                      </p>
                      {scheduleDetail.instructor?.email && (
                        <p className='text-xs text-muted-foreground'>
                          {scheduleDetail.instructor.email}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent
              value='class-notes'
              className='space-y-4 mt-4'
            >
              {loadingNotes ? (
                <div className='flex flex-col items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground mb-2' />
                  <p className='text-muted-foreground text-sm'>
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
                            <div className='p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
                              <p className='text-sm whitespace-pre-wrap'>
                                {note.note}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <User className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <p className='text-muted-foreground'>
                    Chưa có ghi chú nào cho buổi học này
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className='flex flex-col items-center justify-center py-12'>
            <p className='text-muted-foreground'>
              Không thể tải thông tin buổi học
            </p>
          </div>
        )}

        {/* <DialogFooter className='gap-2'>
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
              Xóa lịch học
            </Button>
          </PermissionGuard>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
