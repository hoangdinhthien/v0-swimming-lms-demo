"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Search,
  X,
  Info,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchSlotDetail,
  normalizePools,
  getSlotTimeRange,
  type SlotDetail,
  type SlotSchedule,
} from "@/api/slot-api";
import { fetchClassrooms, addClassToSchedule } from "@/api/class-api";
import { fetchPools } from "@/api/pools-api";
import { deleteScheduleEvent } from "@/api/schedule-api";
import { fetchCourseById } from "@/api/courses-api";
import { Classroom as ClassroomType } from "@/api/class-api";
import { Pool as PoolType } from "@/api/pools-api";

export default function SlotDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slotDetail, setSlotDetail] = useState<SlotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-class related state
  const [showAddClass, setShowAddClass] = useState(false);
  const [classrooms, setClassrooms] = useState<ClassroomType[]>([]);
  const [pools, setPools] = useState<PoolType[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{
    scheduleId: string;
    className: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Course names cache
  const [courseNames, setCourseNames] = useState<{ [key: string]: string }>({});

  // Get parameters from URL
  const slotId = searchParams.get("slotId");
  const date = searchParams.get("date");
  const slotTitle = searchParams.get("slotTitle");
  const time = searchParams.get("time");

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check if date is in the past
  const isPastDate = (dateString: string | null) => {
    if (!dateString) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    return targetDate < today;
  };

  // Load slot details
  useEffect(() => {
    const loadSlotDetail = async () => {
      if (!slotId || !date) {
        setError("Missing required parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const detail = await fetchSlotDetail(slotId, date);
        setSlotDetail(detail);

        // Fetch course names for schedules
        if (detail.schedules?.length) {
          const coursePromises = detail.schedules.map(async (schedule) => {
            if (schedule.classroom?.course) {
              try {
                const course = await fetchCourseById(schedule.classroom.course);
                return { id: schedule.classroom.course, name: course.title };
              } catch {
                return {
                  id: schedule.classroom.course,
                  name: "Unknown Course",
                };
              }
            }
            return null;
          });

          const courseResults = await Promise.all(coursePromises);
          const courseMap: { [key: string]: string } = {};
          courseResults.forEach((result) => {
            if (result) {
              courseMap[result.id] = result.name;
            }
          });
          setCourseNames(courseMap);
        }
      } catch (err) {
        console.error("Error loading slot detail:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load slot details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSlotDetail();
  }, [slotId, date]);

  // Load add-class data
  const loadAddClassData = async () => {
    try {
      const [classroomsData, poolsData] = await Promise.all([
        fetchClassrooms(),
        fetchPools(),
      ]);
      setClassrooms(classroomsData);
      setPools(poolsData);
    } catch (err) {
      console.error("Error loading add-class data:", err);
    }
  };

  // Handle showing add class form
  const handleShowAddClass = async () => {
    setShowAddClass(true);
    await loadAddClassData();
  };

  // Handle adding class to schedule
  const handleAddClass = async () => {
    if (!selectedClass || !selectedPool || !date || !slotId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await addClassToSchedule({
        date,
        slot: slotId,
        classroom: selectedClass,
        pool: selectedPool,
      });

      // Reload slot details to show new class
      const detail = await fetchSlotDetail(slotId, date);
      setSlotDetail(detail);

      // Reset form
      setShowAddClass(false);
      setSelectedClass("");
      setSelectedPool("");
      setSearchTerm("");
    } catch (err) {
      console.error("Error adding class:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete schedule
  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    try {
      setIsDeleting(true);
      await deleteScheduleEvent(scheduleToDelete.scheduleId);

      // Reload slot details
      if (slotId && date) {
        const detail = await fetchSlotDetail(slotId, date);
        setSlotDetail(detail);
      }

      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (err) {
      console.error("Error deleting schedule:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter classrooms
  const filteredClassrooms = classrooms.filter((classroom) =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className='container mx-auto py-6 space-y-6'>
        <div className='flex items-center gap-3'>
          <Button
            onClick={() => router.back()}
            variant='outline'
            size='sm'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Quay lại
          </Button>
        </div>

        <div className='space-y-4'>
          <div className='h-8 bg-gray-200 rounded animate-pulse'></div>
          <div className='h-32 bg-gray-200 rounded animate-pulse'></div>
          <div className='h-64 bg-gray-200 rounded animate-pulse'></div>
        </div>

        <div className='text-center'>
          <Loader2 className='h-6 w-6 animate-spin mx-auto mb-2' />
          <p className='text-muted-foreground'>Đang tải chi tiết slot...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto py-6'>
        <div className='flex items-center gap-3 mb-6'>
          <Button
            onClick={() => router.back()}
            variant='outline'
            size='sm'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Quay lại
          </Button>
        </div>

        <Card>
          <CardContent className='pt-6'>
            <div className='text-center space-y-4'>
              <AlertTriangle className='h-12 w-12 text-red-500 mx-auto' />
              <div>
                <h3 className='text-lg font-semibold text-red-600'>
                  Không thể tải dữ liệu
                </h3>
                <p className='text-muted-foreground mt-2'>{error}</p>
              </div>
              <Button onClick={() => window.location.reload()}>Thử lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!slotDetail) {
    return (
      <div className='container mx-auto py-6'>
        <div className='flex items-center gap-3 mb-6'>
          <Button
            onClick={() => router.back()}
            variant='outline'
            size='sm'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Quay lại
          </Button>
        </div>

        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <Info className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
              <h3 className='text-lg font-semibold'>Không tìm thấy dữ liệu</h3>
              <p className='text-muted-foreground mt-2'>
                Không có thông tin chi tiết cho slot này.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Navigation */}
      <div className='flex items-center justify-between'>
        <Button
          onClick={() => router.back()}
          variant='outline'
          size='sm'
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Quay lại lịch
        </Button>

        <div className='text-sm text-muted-foreground'>
          {date && formatDate(date)}
        </div>
      </div>

      {/* Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold'>Chi tiết Slot</h1>
        <p className='text-muted-foreground'>
          Thông tin chi tiết về {slotTitle || slotDetail.title} -{" "}
          {time || getSlotTimeRange(slotDetail)}
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        {/* Left Column - Slot Information */}
        <div className='md:col-span-1 space-y-6'>
          {/* Slot Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Thông tin Slot
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Tên Slot:</span>
                  <span className='text-sm'>{slotDetail.title}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Ngày:</span>
                  <span className='text-sm'>{date && formatDate(date)}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Thời gian:</span>
                  <span className='text-sm'>
                    {getSlotTimeRange(slotDetail)}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Thời lượng:</span>
                  <span className='text-sm'>{slotDetail.duration}</span>
                </div>
              </div>

              <Separator />

              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Trạng thái:</span>
                  <Badge variant={isPastDate(date) ? "secondary" : "default"}>
                    {isPastDate(date) ? "Đã qua" : "Hiện tại"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Class Card */}
          {!isPastDate(date) && (
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Plus className='h-5 w-5' />
                  Thêm lớp học
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showAddClass ? (
                  <Button
                    onClick={handleShowAddClass}
                    className='w-full'
                  >
                    <Plus className='h-4 w-4 mr-2' />
                    Thêm lớp học vào slot này
                  </Button>
                ) : (
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Chọn hồ bơi:
                      </label>
                      <Select
                        value={selectedPool}
                        onValueChange={setSelectedPool}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Chọn hồ bơi' />
                        </SelectTrigger>
                        <SelectContent>
                          {pools.map((pool) => (
                            <SelectItem
                              key={pool._id}
                              value={pool._id}
                            >
                              {pool.title} - {pool.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Tìm lớp học:
                      </label>
                      <Input
                        placeholder='Tìm kiếm lớp học...'
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium'>
                        Chọn lớp học:
                      </label>
                      <Select
                        value={selectedClass}
                        onValueChange={setSelectedClass}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder='Chọn lớp học' />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredClassrooms.map((classroom) => (
                            <SelectItem
                              key={classroom._id}
                              value={classroom._id}
                            >
                              {classroom.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='flex gap-2'>
                      <Button
                        onClick={handleAddClass}
                        disabled={
                          !selectedClass || !selectedPool || isSubmitting
                        }
                        className='flex-1'
                      >
                        {isSubmitting ? (
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                        ) : (
                          <Plus className='h-4 w-4 mr-2' />
                        )}
                        Thêm lớp
                      </Button>
                      <Button
                        onClick={() => setShowAddClass(false)}
                        variant='outline'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Classes List */}
        <div className='md:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Lớp học và Hồ bơi ({slotDetail.schedules?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!slotDetail.schedules || slotDetail.schedules.length === 0 ? (
                <div className='text-center py-8'>
                  <Users className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-semibold'>Slot trống</h3>
                  <p className='text-muted-foreground mt-2'>
                    Trong slot này vào ngày {date && formatDate(date)} hiện chưa
                    có lớp học nào được xếp lịch.
                  </p>
                  {!isPastDate(date) && (
                    <Button
                      onClick={handleShowAddClass}
                      className='mt-4'
                      variant='outline'
                    >
                      Thêm lớp học vào slot này
                    </Button>
                  )}
                </div>
              ) : (
                <div className='space-y-4'>
                  {slotDetail.schedules.map((schedule, index) => {
                    const pools = normalizePools(schedule.pool);
                    const courseName = schedule.classroom?.course
                      ? courseNames[schedule.classroom.course] || "Loading..."
                      : "No Course";

                    return (
                      <div
                        key={index}
                        className='border rounded-lg p-4 space-y-3'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='space-y-1'>
                            <h4 className='font-semibold text-lg'>
                              {schedule.classroom?.name || "Unknown Class"}
                            </h4>
                            <p className='text-sm text-muted-foreground'>
                              Khóa học: {courseName}
                            </p>
                          </div>

                          {!isPastDate(date) && (
                            <Button
                              onClick={() => {
                                setScheduleToDelete({
                                  scheduleId: schedule._id,
                                  className:
                                    schedule.classroom?.name || "Unknown",
                                });
                                setDeleteDialogOpen(true);
                              }}
                              variant='outline'
                              size='sm'
                              className='text-red-600 hover:text-red-700 hover:bg-red-50'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          )}
                        </div>

                        <div className='grid gap-3 md:grid-cols-2'>
                          <div className='space-y-2'>
                            <h5 className='font-medium text-sm'>
                              Hồ bơi được sử dụng:
                            </h5>
                            <div className='space-y-1'>
                              {pools.map((pool, poolIndex) => (
                                <div
                                  key={poolIndex}
                                  className='flex items-center gap-2 text-sm'
                                >
                                  <MapPin className='h-4 w-4 text-muted-foreground' />
                                  <span>{pool.title}</span>
                                  <Badge
                                    variant='outline'
                                    className='text-xs'
                                  >
                                    {pool.type}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className='space-y-2'>
                            <h5 className='font-medium text-sm'>
                              Thông tin thêm:
                            </h5>
                            <div className='text-sm text-muted-foreground space-y-1'>
                              <div>
                                Thời gian tạo:{" "}
                                {new Date(schedule.created_at).toLocaleString(
                                  "vi-VN"
                                )}
                              </div>
                              <div>
                                Cập nhật lần cuối:{" "}
                                {new Date(schedule.updated_at).toLocaleString(
                                  "vi-VN"
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lớp học "{scheduleToDelete?.className}"
              khỏi slot này không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSchedule}
              disabled={isDeleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {isDeleting ? (
                <Loader2 className='h-4 w-4 animate-spin mr-2' />
              ) : (
                <Trash2 className='h-4 w-4 mr-2' />
              )}
              Xóa lớp học
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
