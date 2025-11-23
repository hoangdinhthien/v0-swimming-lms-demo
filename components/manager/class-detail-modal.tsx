"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Card,
  Row,
  Col,
  Tag,
  Avatar,
  Typography,
  Space,
  Divider,
  Button,
  Descriptions,
  Alert,
  Spin,
  Empty,
} from "antd";
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

const { Title, Text } = Typography;

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
    <Modal
      title={
        <div className='flex items-center gap-3'>
          <InfoCircleOutlined className='text-blue-500' />
          <div>
            <div className='text-lg font-semibold'>Chi tiết buổi học</div>
            <div className='text-sm text-gray-500 font-normal'>
              Thông tin chi tiết về buổi học
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button
          key='close'
          onClick={onClose}
        >
          Đóng
        </Button>,
        <Button
          key='edit'
          type='default'
          icon={<EditOutlined />}
          onClick={handleEdit}
        >
          Chỉnh sửa
        </Button>,
        <Button
          key='delete'
          type='primary'
          danger
          icon={<DeleteOutlined />}
          onClick={handleDelete}
        >
          Xóa lớp học
        </Button>,
      ]}
      width={720}
      className='class-detail-modal'
    >
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <Spin size='large' />
          <span className='ml-3'>Đang tải thông tin chi tiết...</span>
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Header Card */}
          <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-4'>
                <Avatar
                  size={48}
                  style={{ backgroundColor: "#1890ff" }}
                  icon={<TeamOutlined />}
                />
                <div>
                  <Title
                    level={3}
                    className='!mb-1'
                  >
                    {detailedSchedule?.classroom?.name || "Không xác định"}
                  </Title>
                  <Text
                    type='secondary'
                    className='text-base'
                  >
                    {slotDetail?.title || "Không xác định"}
                  </Text>
                </div>
              </div>
              <Tag
                color='blue'
                className='text-base px-3 py-1'
              >
                {getTimeRange()}
              </Tag>
            </div>
          </Card>

          {/* Basic Information */}
          <Card
            title='Thông tin cơ bản'
            size='small'
          >
            <Descriptions
              column={1}
              bordered
            >
              <Descriptions.Item
                label={
                  <span className='flex items-center gap-2'>
                    <CalendarOutlined /> Ngày học
                  </span>
                }
              >
                <Text strong>{getFormattedDate()}</Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span className='flex items-center gap-2'>
                    <ClockCircleOutlined /> Thời gian
                  </span>
                }
              >
                <Text strong>{getTimeRange()}</Text>
                {slotDetail?.duration && (
                  <Text
                    type='secondary'
                    className='ml-2'
                  >
                    (Thời lượng: {slotDetail.duration})
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span className='flex items-center gap-2'>
                    <BookOutlined /> Khóa học
                  </span>
                }
              >
                <div>
                  <Text strong>
                    {courseDetail?.title ||
                      detailedSchedule?.classroom?.name ||
                      "Đang tải..."}
                  </Text>
                  {courseDetail?.description && (
                    <div className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                      {courseDetail.description}
                    </div>
                  )}
                  {courseDetail?.level && (
                    <Tag
                      color='green'
                      className='mt-1'
                    >
                      {courseDetail.level}
                    </Tag>
                  )}
                  {!courseDetail && (
                    <div className='text-sm text-yellow-600 mt-1'>
                      🔍 Debug: Course ID ={" "}
                      {detailedSchedule?.classroom?.course}
                    </div>
                  )}
                </div>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span className='flex items-center gap-2'>
                    <EnvironmentOutlined /> Hồ bơi
                  </span>
                }
              >
                <div>
                  <Text strong>
                    {detailedSchedule?.pool?.title || "Không xác định"}
                  </Text>
                  {detailedSchedule?.pool && (
                    <div className='text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1'>
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
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <span className='flex items-center gap-2'>
                    <UserOutlined /> Giáo viên
                  </span>
                }
              >
                <div className='space-y-3'>
                  {/* Giáo viên cố định của lớp */}
                  {classInstructor && (
                    <div>
                      <div className='text-sm text-gray-500 mb-2'>
                        <BookOutlined className='mr-1' />
                        Giáo viên phụ trách lớp học:
                      </div>
                      <div className='flex items-center gap-3'>
                        <Avatar
                          size={32}
                          src={classInstructorAvatar || null}
                          icon={<UserOutlined />}
                        />
                        <div>
                          <Text strong>{classInstructor.username}</Text>
                          {classInstructor.email && (
                            <div className='text-sm text-gray-600 dark:text-gray-400'>
                              {classInstructor.email}
                            </div>
                          )}
                          {classInstructor.phone && (
                            <div className='text-sm text-gray-600 dark:text-gray-400'>
                              {classInstructor.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Giáo viên được phân công cho slot (nếu khác với giáo viên cố định) */}
                  {slotInstructor &&
                    slotInstructor._id !== classInstructor?._id && (
                      <div>
                        <div className='text-sm text-gray-500 mb-2'>
                          <ClockCircleOutlined className='mr-1' />
                          Giáo viên phân công cho slot này:
                        </div>
                        <div className='flex items-center gap-3'>
                          <Avatar
                            size={32}
                            src={slotInstructorAvatar || null}
                            icon={<UserOutlined />}
                          />
                          <div>
                            <Text strong>{slotInstructor.username}</Text>
                            {slotInstructor.email && (
                              <div className='text-sm text-gray-600 dark:text-gray-400'>
                                {slotInstructor.email}
                              </div>
                            )}
                            {slotInstructor.phone && (
                              <div className='text-sm text-gray-600 dark:text-gray-400'>
                                {slotInstructor.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Không có giáo viên nào */}
                  {!classInstructor && !slotInstructor && (
                    <Text type='secondary'>
                      Chưa có giáo viên được phân công
                    </Text>
                  )}
                </div>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Class Members */}
          {detailedSchedule?.classroom?.member &&
            detailedSchedule.classroom.member.length > 0 && (
              <Card
                title='Danh sách học viên'
                size='small'
              >
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 mb-4'>
                    <TeamOutlined />
                    <Text strong>
                      Sĩ số: {detailedSchedule.classroom.member.length}
                      {courseDetail?.capacity &&
                        ` / ${courseDetail.capacity}`}{" "}
                      học viên
                    </Text>
                  </div>

                  {studentsDetails.length > 0 ? (
                    <div className='grid grid-cols-2 gap-2'>
                      {studentsDetails.map((student, index) => {
                        return (
                          <div
                            key={student._id}
                            className='flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded'
                          >
                            <Avatar
                              size={24}
                              src={studentsAvatars[student._id] || null}
                              icon={<UserOutlined />}
                            />
                            <div className='flex-1'>
                              <Text className='text-sm font-medium'>
                                {student.username}
                              </Text>
                              {student.email && (
                                <div className='text-xs text-gray-500'>
                                  {student.email}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div>
                      <div className='mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded'>
                        <Text className='text-sm text-yellow-800'>
                          🔍 Debug: studentsDetails.length ={" "}
                          {studentsDetails.length}
                          <br />
                          Raw member IDs:{" "}
                          {detailedSchedule.classroom.member.join(", ")}
                        </Text>
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        {detailedSchedule.classroom.member.map(
                          (memberId, index) => (
                            <div
                              key={memberId}
                              className='flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded'
                            >
                              <Avatar
                                size={24}
                                icon={<UserOutlined />}
                              />
                              <Text className='text-sm'>
                                ID: {memberId.substring(0, 8)}...
                              </Text>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

          {/* Additional Info */}
          {slotDetail?.schedules && slotDetail.schedules.length > 1 && (
            <Card
              title='Thông tin bổ sung'
              size='small'
            >
              <Alert
                message={`Khung giờ này có ${slotDetail.schedules.length} lớp học khác trong cùng ngày`}
                type='info'
                showIcon
              />
            </Card>
          )}
        </div>
      )}
    </Modal>
  );
}
