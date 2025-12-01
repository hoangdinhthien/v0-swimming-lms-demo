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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Info, Edit, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import { fetchSlotDetail, type SlotDetail } from "@/api/manager/slot-api";
import { fetchCourseById } from "@/api/manager/courses-api";
import { getMediaDetails } from "@/api/media-api";
import { fetchStudentDetail } from "@/api/manager/students-api";
import { fetchInstructorDetail } from "@/api/manager/instructors-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import type { ScheduleEvent } from "@/api/manager/schedule-api";

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

interface StudentDetail {
  _id: string;
  username: string;
  email?: string;
  phone?: string;
  featured_image?: string[];
}

interface InstructorDetail {
  _id: string;
  username: string;
  email?: string;
  phone?: string;
  featured_image?: string[];
}

// Interface phù hợp với response thực tế từ fetchSlotDetail
interface ActualClassroom {
  _id: string;
  name: string;
  course: string;
  member?: string[];
  instructor?: string; // Giáo viên cố định của lớp
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
  instructor?: string; // Giáo viên được phân công cho slot
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

  // Students and instructors details
  const [studentsDetails, setStudentsDetails] = useState<StudentDetail[]>([]);
  const [classInstructor, setClassInstructor] =
    useState<InstructorDetail | null>(null); // Giáo viên cố định
  const [slotInstructor, setSlotInstructor] = useState<InstructorDetail | null>(
    null
  ); // Giáo viên slot
  const [classInstructorAvatar, setClassInstructorAvatar] =
    useState<string>("");
  const [slotInstructorAvatar, setSlotInstructorAvatar] = useState<string>("");
  const [studentsAvatars, setStudentsAvatars] = useState<{
    [key: string]: string;
  }>({});

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
    setStudentsDetails([]);
    setClassInstructor(null);
    setSlotInstructor(null);
    setClassInstructorAvatar("");
    setSlotInstructorAvatar("");
    setStudentsAvatars({});
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

            // Fetch students details
            if (
              actualSchedule.classroom?.member &&
              actualSchedule.classroom.member.length > 0
            ) {
              // Test với student ID cụ thể từ response data
              const testStudentId = "68e9111431a4b3bf3e942d56";
              if (actualSchedule.classroom.member.includes(testStudentId)) {
                try {
                  const testStudent = await fetchStudentDetail({
                    studentId: testStudentId,
                    tenantId,
                    token,
                  });
                } catch (testError) {
                  console.error("🧪 Test student failed:", testError);
                }
              }

              try {
                const studentsData = await Promise.all(
                  actualSchedule.classroom.member.map(
                    async (studentId: string) => {
                      try {
                        const studentResponse = await fetchStudentDetail({
                          studentId,
                          tenantId,
                          token,
                        });

                        // Extract user data from the nested response structure
                        const student =
                          studentResponse?.user || studentResponse;

                        // Ensure we have a valid student object
                        if (!student || !student._id) {
                          console.warn(
                            `❌ Invalid student data for ID ${studentId}:`,
                            student
                          );
                          return null;
                        }

                        // Fetch student avatar - handle different featured_image structures
                        let avatarUrl = "";
                        let featuredImagePath = null;

                        if (student.featured_image) {
                          // Handle array of objects with path property: [{path: [...]}]
                          if (
                            Array.isArray(student.featured_image) &&
                            student.featured_image[0]?.path
                          ) {
                            if (Array.isArray(student.featured_image[0].path)) {
                              featuredImagePath =
                                student.featured_image[0].path[0];
                            } else {
                              featuredImagePath =
                                student.featured_image[0].path;
                            }
                          }
                          // Handle object with path property: {path: "..."}
                          else if (student.featured_image.path) {
                            featuredImagePath = student.featured_image.path;
                          }
                          // Handle direct array: ["imageId"]
                          else if (
                            Array.isArray(student.featured_image) &&
                            student.featured_image.length > 0
                          ) {
                            featuredImagePath = student.featured_image[0];
                          }
                        }

                        // If we have a direct URL, use it; otherwise try to fetch media details
                        if (featuredImagePath) {
                          if (featuredImagePath.startsWith("http")) {
                            avatarUrl = featuredImagePath;
                          } else {
                            try {
                              avatarUrl =
                                (await getMediaDetails(featuredImagePath)) ||
                                "";
                            } catch (error) {
                              console.warn(
                                "Failed to fetch student avatar:",
                                error
                              );
                            }
                          }
                        }

                        if (avatarUrl) {
                          setStudentsAvatars((prev) => ({
                            ...prev,
                            [studentId]: avatarUrl,
                          }));
                        }

                        return student;
                      } catch (error) {
                        console.warn(
                          `❌ Failed to fetch student ${studentId}:`,
                          error
                        );
                        return null;
                      }
                    }
                  )
                );

                const validStudents = studentsData.filter(Boolean);

                setStudentsDetails(validStudents);
              } catch (error) {
                console.warn("Failed to fetch students details:", error);
              }
            }

            // Fetch class instructor (giáo viên cố định của lớp)
            if (actualSchedule.classroom?.instructor) {
              try {
                const instructorResponse = await fetchInstructorDetail({
                  instructorId: actualSchedule.classroom.instructor,
                  tenantId,
                  token,
                });

                // Extract user data from the nested response structure
                const instructor =
                  instructorResponse?.user || instructorResponse;

                // Ensure we have a valid instructor object
                if (instructor && instructor._id) {
                  setClassInstructor(instructor);

                  // Fetch class instructor avatar - handle different featured_image structures
                  let avatarUrl = "";
                  let featuredImagePath = null;

                  if (instructor.featured_image) {
                    // Handle array of objects with path property: [{path: [...]}]
                    if (
                      Array.isArray(instructor.featured_image) &&
                      instructor.featured_image[0]?.path
                    ) {
                      if (Array.isArray(instructor.featured_image[0].path)) {
                        featuredImagePath =
                          instructor.featured_image[0].path[0];
                      } else {
                        featuredImagePath = instructor.featured_image[0].path;
                      }
                    }
                    // Handle object with path property: {path: "..."}
                    else if (instructor.featured_image.path) {
                      featuredImagePath = instructor.featured_image.path;
                    }
                    // Handle direct array: ["imageId"]
                    else if (
                      Array.isArray(instructor.featured_image) &&
                      instructor.featured_image.length > 0
                    ) {
                      featuredImagePath = instructor.featured_image[0];
                    }
                  }

                  // If we have a direct URL, use it; otherwise try to fetch media details
                  if (featuredImagePath) {
                    if (featuredImagePath.startsWith("http")) {
                      avatarUrl = featuredImagePath;
                    } else {
                      try {
                        avatarUrl =
                          (await getMediaDetails(featuredImagePath)) || "";
                      } catch (error) {
                        console.warn(
                          "Failed to fetch class instructor avatar:",
                          error
                        );
                      }
                    }
                  }

                  setClassInstructorAvatar(avatarUrl);
                } else {
                  console.warn("❌ Invalid class instructor data:", instructor);
                }
              } catch (error) {
                console.warn(
                  "❌ Failed to fetch class instructor details:",
                  error
                );
              }
            }

            // Fetch slot instructor (giáo viên được phân công cho slot)
            if (
              actualSchedule.instructor &&
              actualSchedule.instructor !== actualSchedule.classroom?.instructor
            ) {
              try {
                const instructorResponse = await fetchInstructorDetail({
                  instructorId: actualSchedule.instructor,
                  tenantId,
                  token,
                });

                // Extract user data from the nested response structure
                const instructor =
                  instructorResponse?.user || instructorResponse;

                // Ensure we have a valid instructor object
                if (instructor && instructor._id) {
                  setSlotInstructor(instructor);

                  // Fetch slot instructor avatar - handle different featured_image structures
                  let avatarUrl = "";
                  let featuredImagePath = null;

                  if (instructor.featured_image) {
                    // Handle array of objects with path property: [{path: [...]}]
                    if (
                      Array.isArray(instructor.featured_image) &&
                      instructor.featured_image[0]?.path
                    ) {
                      if (Array.isArray(instructor.featured_image[0].path)) {
                        featuredImagePath =
                          instructor.featured_image[0].path[0];
                      } else {
                        featuredImagePath = instructor.featured_image[0].path;
                      }
                    }
                    // Handle object with path property: {path: "..."}
                    else if (instructor.featured_image.path) {
                      featuredImagePath = instructor.featured_image.path;
                    }
                    // Handle direct array: ["imageId"]
                    else if (
                      Array.isArray(instructor.featured_image) &&
                      instructor.featured_image.length > 0
                    ) {
                      featuredImagePath = instructor.featured_image[0];
                    }
                  }

                  // If we have a direct URL, use it; otherwise try to fetch media details
                  if (featuredImagePath) {
                    if (featuredImagePath.startsWith("http")) {
                      avatarUrl = featuredImagePath;
                    } else {
                      try {
                        avatarUrl =
                          (await getMediaDetails(featuredImagePath)) || "";
                      } catch (error) {
                        console.warn(
                          "Failed to fetch slot instructor avatar:",
                          error
                        );
                      }
                    }
                  }

                  setSlotInstructorAvatar(avatarUrl);
                } else {
                  console.warn("❌ Invalid slot instructor data:", instructor);
                }
              } catch (error) {
                console.warn(
                  "❌ Failed to fetch slot instructor details:",
                  error
                );
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
          <div className='space-y-4'>
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
                        {detailedSchedule?.classroom?.name || "Không xác định"}
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

                {/* Giáo viên */}
                <div className='flex items-start gap-3 p-3 bg-muted/30 rounded-lg'>
                  <UserOutlined className='text-lg text-blue-500 mt-0.5' />
                  <div className='flex-1'>
                    <div className='text-sm text-muted-foreground mb-2'>
                      Giáo viên
                    </div>
                    <div className='space-y-3'>
                      {/* Giáo viên cố định của lớp */}
                      {classInstructor && (
                        <div>
                          <div className='text-xs text-muted-foreground mb-2 flex items-center gap-1'>
                            <BookOutlined />
                            Giáo viên phụ trách lớp học:
                          </div>
                          <div className='flex items-center gap-3'>
                            <Avatar>
                              <AvatarImage src={classInstructorAvatar} />
                              <AvatarFallback>
                                <UserOutlined />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className='font-semibold'>
                                {classInstructor.username}
                              </div>
                              {classInstructor.email && (
                                <div className='text-sm text-muted-foreground'>
                                  {classInstructor.email}
                                </div>
                              )}
                              {classInstructor.phone && (
                                <div className='text-sm text-muted-foreground'>
                                  {classInstructor.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Giáo viên được phân công cho slot */}
                      {slotInstructor &&
                        slotInstructor._id !== classInstructor?._id && (
                          <div>
                            <Separator className='my-2' />
                            <div className='text-xs text-muted-foreground mb-2 flex items-center gap-1'>
                              <ClockCircleOutlined />
                              Giáo viên phân công cho slot này:
                            </div>
                            <div className='flex items-center gap-3'>
                              <Avatar>
                                <AvatarImage src={slotInstructorAvatar} />
                                <AvatarFallback>
                                  <UserOutlined />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className='font-semibold'>
                                  {slotInstructor.username}
                                </div>
                                {slotInstructor.email && (
                                  <div className='text-sm text-muted-foreground'>
                                    {slotInstructor.email}
                                  </div>
                                )}
                                {slotInstructor.phone && (
                                  <div className='text-sm text-muted-foreground'>
                                    {slotInstructor.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Không có giáo viên nào */}
                      {!classInstructor && !slotInstructor && (
                        <div className='text-sm text-muted-foreground'>
                          Chưa có giáo viên được phân công
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class Members */}
            {detailedSchedule?.classroom?.member &&
              detailedSchedule.classroom.member.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='text-base flex items-center gap-2'>
                      <TeamOutlined />
                      Danh sách học viên
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex items-center gap-2 text-sm'>
                        <span className='font-semibold'>Sĩ số:</span>
                        <Badge variant='secondary'>
                          {detailedSchedule.classroom.member.length}
                          {courseDetail?.capacity &&
                            ` / ${courseDetail.capacity}`}{" "}
                          học viên
                        </Badge>
                      </div>

                      {studentsDetails.length > 0 ? (
                        <div className='grid grid-cols-2 gap-2'>
                          {studentsDetails.map((student) => (
                            <div
                              key={student._id}
                              className='flex items-center gap-2 p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors'
                            >
                              <Avatar className='h-8 w-8'>
                                <AvatarImage
                                  src={studentsAvatars[student._id]}
                                />
                                <AvatarFallback>
                                  <UserOutlined />
                                </AvatarFallback>
                              </Avatar>
                              <div className='flex-1 min-w-0'>
                                <div className='text-sm font-medium truncate'>
                                  {student.username}
                                </div>
                                {student.email && (
                                  <div className='text-xs text-muted-foreground truncate'>
                                    {student.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='text-sm text-muted-foreground text-center py-4'>
                          Không có thông tin học viên
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

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
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button
            variant='outline'
            onClick={onClose}
          >
            Đóng
          </Button>
          <Button
            variant='secondary'
            onClick={handleEdit}
          >
            <Edit className='h-4 w-4 mr-2' />
            Chỉnh sửa
          </Button>
          <Button
            variant='destructive'
            onClick={handleDelete}
          >
            <Trash2 className='h-4 w-4 mr-2' />
            Xóa lớp học
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
