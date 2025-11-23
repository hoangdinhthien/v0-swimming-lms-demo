"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  User,
  CreditCard,
  School,
  FileText,
  Clock,
  Check,
  X,
  UserPlus,
  UserCheck,
  Search,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../../../../hooks/use-auth";
import {
  Order,
  formatPrice,
  getStatusName,
  getStatusClass,
  getOrderUserName,
  getOrderUserContact,
  getOrderTypeDisplayName,
  getOrderCourseId,
  getOrderCourseTitle,
  updateOrderStatus,
  updateOrderWithUser,
  fetchOrderById,
  addMemberToClass,
  deleteOrder,
  updateOrder,
} from "@/api/manager/orders-api";
import { fetchCourseById } from "@/api/manager/courses-api";
import {
  fetchClassroomsByCourse,
  fetchClassroomsByCourseAndSchedule,
  addUserToClass,
} from "@/api/manager/class-api";
import { fetchInstructorDetail } from "@/api/manager/instructors-api";
import ManagerNotFound from "@/components/manager/not-found";
import CreateStudentModal from "@/components/create-student-modal";
import { EditOrderModal } from "@/components/manager/edit-order-modal";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { token, tenantId } = useAuth();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [courseDetails, setCourseDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // New state for class selection modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [addingToClass, setAddingToClass] = useState(false);
  const [instructorDetails, setInstructorDetails] = useState<{
    [key: string]: any;
  }>({});

  // Search functionality for class modal
  const [searchKey, setSearchKey] = useState<string>("");
  const [haveSchedule, setHaveSchedule] = useState<boolean>(false);

  // New state for create student modal
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);

  // State for assigned class details
  const [assignedClassDetails, setAssignedClassDetails] = useState<any>(null);
  const [loadingClassDetails, setLoadingClassDetails] = useState(false);

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Fetch order details and related course
  useEffect(() => {
    async function getOrderDetails() {
      if (!token || !tenantId || !orderId) return;

      try {
        setLoading(true);

        // Fetch order by ID using the dedicated API function
        const foundOrder = await fetchOrderById({
          orderId,
          tenantId,
          token,
        });

        setOrder(foundOrder);
        setNewStatus(foundOrder.status?.[0] || "");

        // Handle course details - check if course is already embedded or needs to be fetched
        if (typeof foundOrder.course === "object") {
          // Course details are already embedded in the order
          setCourseDetails(foundOrder.course);
        } else if (foundOrder.course) {
          // Course is just an ID, need to fetch details
          const courseData = await fetchCourseById({
            courseId: foundOrder.course,
            tenantId,
            token,
          });
          setCourseDetails(courseData);
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        // Check if it's a 404 error
        if (
          err instanceof Error &&
          (err.message === "404" ||
            err.message.includes("404") ||
            err.message.includes("không tìm thấy") ||
            err.message.includes("not found"))
        ) {
          setError("404");
        } else {
          setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
        }
      } finally {
        setLoading(false);
      }
    }

    getOrderDetails();
  }, [token, tenantId, orderId]);

  // Check for newly created user from guest account creation flow
  useEffect(() => {
    const newUserDataStr = sessionStorage.getItem("newUserData");
    if (newUserDataStr && order) {
      try {
        const newUserData = JSON.parse(newUserDataStr);
        if (newUserData.showClassModal && newUserData.userId) {
          // Update the order with the new user ID so we can add them to class
          setOrder((prevOrder) => {
            if (!prevOrder) return null;

            // Create a basic user object with the new user ID
            const newUser = {
              _id: newUserData.userId,
              username: prevOrder.guest?.username || "Học viên mới",
              email: prevOrder.guest?.email || "",
              password: "",
              role_front: ["member"],
              parent_id: [],
              phone: prevOrder.guest?.phone || "",
              is_active: true,
              birthday: "",
              address: "",
              created_at: new Date().toISOString(),
              created_by: "",
              updated_at: new Date().toISOString(),
              updated_by: "",
            };

            return {
              ...prevOrder,
              user: newUser,
              type: ["member"], // Change type from guest to member
            };
          });

          // Show the class selection modal after a small delay to ensure state is updated
          setTimeout(() => {
            setShowClassModal(true);
            // Load classrooms directly here since we have all the needed values
            if (token && tenantId) {
              (async () => {
                try {
                  setLoadingClassrooms(true);
                  const courseId = getOrderCourseId(order);
                  if (courseId) {
                    const classroomsData =
                      await fetchClassroomsByCourseAndSchedule(
                        courseId,
                        haveSchedule,
                        searchKey,
                        tenantId,
                        token
                      );
                    setClassrooms(classroomsData);
                  }
                } catch (err) {
                  console.error("Error loading classrooms:", err);
                  toast({
                    variant: "destructive",
                    title: "Lỗi",
                    description: "Không thể tải danh sách lớp học",
                  });
                } finally {
                  setLoadingClassrooms(false);
                }
              })();
            }
          }, 100);

          // Clear the session storage
          sessionStorage.removeItem("newUserData");

          // Show success message
          toast({
            title: "Tài khoản đã được tạo",
            description: "Vui lòng chọn lớp học để thêm học viên vào.",
          });
        }
      } catch (error) {
        console.error("Error parsing new user data:", error);
        sessionStorage.removeItem("newUserData");
      }
    }
  }, [order, toast, token, tenantId]); // Depend on order so this runs after order is loaded

  // Fetch assigned class details when order has a class field
  useEffect(() => {
    async function fetchAssignedClassDetails() {
      if (!order?.class || !token || !tenantId || !courseDetails) return;

      try {
        setLoadingClassDetails(true);
        const courseId = getOrderCourseId(order);
        if (courseId) {
          // Use fetchClassroomsByCourseAndSchedule to get all classes for this course
          const classroomsData = await fetchClassroomsByCourseAndSchedule(
            courseId,
            false, // don't filter by schedule
            "", // no search key
            tenantId,
            token
          );

          // Find the specific class that matches the order's class ID
          const classId =
            typeof order.class === "string" ? order.class : order.class?._id;
          const assignedClass = classroomsData.find(
            (classroom: any) => classroom._id === classId
          );

          if (assignedClass) {
            setAssignedClassDetails(assignedClass);
          }
        }
      } catch (err) {
        console.error("Error fetching assigned class details:", err);
        // Don't show error to user, just log it
      } finally {
        setLoadingClassDetails(false);
      }
    }

    fetchAssignedClassDetails();
  }, [order?.class, token, tenantId, courseDetails, order]);

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!order || !token || !tenantId) return;

    setIsDeleting(true);
    try {
      await deleteOrder(order._id, tenantId, token);

      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch thành công",
      });

      // Redirect to transactions list
      router.push("/dashboard/manager/transactions");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể xóa giao dịch. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!order || !newStatus || !token || !tenantId) return;

    try {
      setUpdatingStatus(true);

      await updateOrderStatus({
        orderId: order._id,
        status: newStatus,
        tenantId,
        token,
      });

      // Update the local order data
      setOrder((prevOrder) => {
        if (!prevOrder) return null;
        return { ...prevOrder, status: [newStatus] };
      });

      toast({
        title: "Cập nhật thành công",
        description: "Trạng thái giao dịch đã được cập nhật",
      });
    } catch (err) {
      console.error("Error updating order status:", err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái giao dịch",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Check if this is a paid member order (scenario 1)
  // Show this if the order has user data (regardless of guest data) AND no class assigned yet
  const isPaidMemberOrder = () => {
    if (!order) return false;
    // Check if user exists and is not an empty array
    const hasUser =
      order.user && (!Array.isArray(order.user) || order.user.length > 0);
    return (
      order.status?.includes("paid") &&
      hasUser && // Has user data (converted from guest or original member)
      !order.class // Has NOT been assigned to a class yet
    );
  };

  // Check if this is a paid guest order (scenario 2)
  // Show this only if it has guest data but NO user data AND no class assigned yet
  const isPaidGuestOrder = () => {
    if (!order) return false;
    // Check if user is missing or is an empty array
    const hasNoUser =
      !order.user || (Array.isArray(order.user) && order.user.length === 0);

    const result =
      order.status?.includes("paid") &&
      (order.type?.includes("guest") || order.type?.includes("cash")) &&
      order.guest && // Has guest data
      hasNoUser && // Does NOT have user data yet (or empty array)
      !order.class; // Has NOT been assigned to a class yet

    return result;
  };

  // Check if student has already been assigned to a class
  const isAlreadyAssignedToClass = () => {
    if (!order) return false;
    // Check if class exists and is not an empty array
    const hasClass =
      order.class && (!Array.isArray(order.class) || order.class.length > 0);
    return order.status?.includes("paid") && hasClass;
  };

  // Handle adding member to class
  const handleAddToClass = async () => {
    if (!order || !selectedClassId || !token || !tenantId) return;

    try {
      setAddingToClass(true);

      const userId = order.user?._id;
      if (!userId) {
        throw new Error("Không tìm thấy thông tin người dùng");
      }

      await addMemberToClass(selectedClassId, userId, tenantId, token);

      toast({
        title: "Thành công",
        description: "Đã thêm học viên vào lớp học",
      });

      // Refresh the order data to get the updated class field
      try {
        const updatedOrder = await fetchOrderById({
          orderId: order._id,
          tenantId,
          token,
        });
        setOrder(updatedOrder);
      } catch (err) {
        console.error("Error refreshing order data:", err);
        // Don't show error to user, just log it
      }

      handleCloseClassModal();
    } catch (err) {
      console.error("Error adding user to class:", err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể thêm học viên vào lớp học",
      });
    } finally {
      setAddingToClass(false);
    }
  };

  // Load classrooms for the course
  const loadClassrooms = async () => {
    if (!order || !token || !tenantId) return;

    try {
      setLoadingClassrooms(true);

      const courseId = getOrderCourseId(order);
      if (!courseId) {
        throw new Error("Không tìm thấy thông tin khóa học");
      }

      const classroomsData = await fetchClassroomsByCourseAndSchedule(
        courseId,
        haveSchedule,
        searchKey,
        tenantId,
        token
      );

      setClassrooms(classroomsData);

      // Fetch instructor details for each classroom
      const instructorDetailsMap: { [key: string]: any } = {};
      for (const classroom of classroomsData) {
        if (classroom.instructor && typeof classroom.instructor === "string") {
          try {
            const instructorDetail = await fetchInstructorDetail({
              instructorId: classroom.instructor,
              tenantId,
              token,
            });
            if (instructorDetail) {
              instructorDetailsMap[classroom.instructor] = instructorDetail;
            }
          } catch (err) {
            console.error(
              `Error fetching instructor ${classroom.instructor}:`,
              err
            );
            // Continue with other instructors even if one fails
          }
        }
      }
      setInstructorDetails(instructorDetailsMap);
    } catch (err) {
      console.error("Error loading classrooms:", err);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách lớp học",
      });
    } finally {
      setLoadingClassrooms(false);
    }
  };

  // Auto-reload classrooms when search parameters change
  useEffect(() => {
    if (showClassModal && order && token && tenantId) {
      loadClassrooms();
    }
  }, [searchKey, haveSchedule, showClassModal]);

  // Handle showing class selection modal
  const handleShowClassModal = () => {
    setShowClassModal(true);
    // Reset search when opening modal
    setSearchKey("");
    setHaveSchedule(false);
    setSelectedClassId("");
    loadClassrooms();
  };

  // Handle closing class selection modal
  const handleCloseClassModal = () => {
    setShowClassModal(false);
    setSearchKey("");
    setSelectedClassId("");
  };

  // Handle showing create student modal
  const handleCreateStudentAccount = () => {
    if (!order?.guest) return;
    setShowCreateStudentModal(true);
  };

  // Handle successful student creation
  const handleStudentCreated = async (studentId: string) => {
    if (!order || !token || !tenantId) return;

    try {
      // Update the order with the new user ID
      await updateOrderWithUser({
        orderId: order._id,
        userId: studentId,
        tenantId,
        token,
      });

      // Show success notification
      toast({
        title: "Tài khoản đã được tạo thành công",
        description: `Đã tạo tài khoản và cập nhật đơn hàng cho ${
          order.guest?.username || "học viên"
        }.`,
      });

      // Refresh the order data to reflect the changes
      const updatedOrder = await fetchOrderById({
        orderId: order._id,
        tenantId,
        token,
      });

      setOrder(updatedOrder);

      // Automatically show the class selection modal if the updated order has user data
      if (updatedOrder.user) {
        setTimeout(() => {
          setShowClassModal(true);
          loadClassrooms();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error updating order with user:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description:
          error.message ||
          "Không thể cập nhật đơn hàng với thông tin người dùng",
      });
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải thông tin giao dịch...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error === "404" || (!order && !loading)) {
    return <ManagerNotFound />;
  }

  if (error || !order) {
    return (
      <div className='flex flex-col items-center justify-center h-64'>
        <p className='text-red-500'>
          {error || "Không thể tải thông tin giao dịch"}
        </p>
        <div className='flex gap-4 mt-4'>
          <Button
            variant='outline'
            onClick={() => router.refresh()}
          >
            Thử lại
          </Button>
          <Button
            onClick={() => router.push("/dashboard/manager/transactions")}
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.created_at);
  const formattedDate = format(orderDate, "dd/MM/yyyy HH:mm:ss");
  const userName = getOrderUserName(order);
  const userContact = getOrderUserContact(order);

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager/transactions'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay lại danh sách giao dịch
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold'>Chi tiết giao dịch</h1>
          <p className='text-muted-foreground'>Mã giao dịch: {order._id}</p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={() => setEditModalOpen(true)}
          >
            <Pencil className='mr-2 h-4 w-4' />
            Chỉnh sửa
          </Button>
          <Button
            variant='outline'
            className='text-destructive hover:text-destructive'
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Xóa giao dịch
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='md:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin giao dịch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <div className='text-sm text-muted-foreground'>
                    Mã giao dịch
                  </div>
                  <div className='font-medium'>{order._id}</div>
                </div>
                <div className='space-y-1'>
                  <div className='text-sm text-muted-foreground'>
                    Trạng thái
                  </div>
                  <div>
                    <Badge
                      variant='outline'
                      className={getStatusClass(order.status)}
                    >
                      {getStatusName(order.status)}
                    </Badge>
                  </div>
                </div>
                <div className='space-y-1'>
                  <div className='text-sm text-muted-foreground'>Thời gian</div>
                  <div className='font-medium flex items-center gap-1'>
                    <CalendarDays className='h-3.5 w-3.5 text-muted-foreground' />
                    {formattedDate}
                  </div>
                </div>
                <div className='space-y-1'>
                  <div className='text-sm text-muted-foreground'>Số tiền</div>
                  <div className='font-medium'>{formatPrice(order.price)}</div>
                </div>
                <div className='space-y-1'>
                  <div className='text-sm text-muted-foreground'>
                    Loại giao dịch
                  </div>
                  <div className='font-medium'>
                    {getOrderTypeDisplayName(order)}
                  </div>
                </div>
              </div>

              <Separator className='my-6' />

              {/* Payment Information */}
              {order.payment && (
                <div className='space-y-6'>
                  <div>
                    <h3 className='text-lg font-medium mb-4'>
                      Thông tin thanh toán
                    </h3>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='space-y-1'>
                        <div className='text-sm text-muted-foreground'>
                          Phương thức
                        </div>
                        <div className='font-medium flex items-center gap-1'>
                          <CreditCard className='h-3.5 w-3.5 text-muted-foreground' />
                          {order.payment.zp_trans_id
                            ? "ZaloPay"
                            : "Chưa xác định"}
                        </div>
                      </div>
                      {order.payment.app_trans_id && (
                        <div className='space-y-1'>
                          <div className='text-sm text-muted-foreground'>
                            Mã giao dịch ứng dụng
                          </div>
                          <div className='font-medium font-mono text-sm'>
                            {order.payment.app_trans_id}
                          </div>
                        </div>
                      )}
                      {order.payment.zp_trans_id && (
                        <div className='space-y-1'>
                          <div className='text-sm text-muted-foreground'>
                            Mã giao dịch ZaloPay
                          </div>
                          <div className='font-medium font-mono text-sm'>
                            {order.payment.zp_trans_id}
                          </div>
                        </div>
                      )}
                      {order.payment.url && (
                        <div className='space-y-1 sm:col-span-2'>
                          <div className='text-sm text-muted-foreground'>
                            Link thanh toán
                          </div>
                          <div className='font-medium text-blue-600 text-sm break-all'>
                            {order.payment.url}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </div>
              )}

              <div className='space-y-6'>
                <div>
                  <h3 className='text-lg font-medium mb-4'>
                    Thông tin khóa học
                  </h3>
                  {courseDetails ? (
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <div className='space-y-1'>
                        <div className='text-sm text-muted-foreground'>
                          Khóa học
                        </div>
                        <div className='font-medium'>{courseDetails.title}</div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-sm text-muted-foreground'>
                          Giá gốc
                        </div>
                        <div className='font-medium'>
                          {formatPrice(courseDetails.price || 0)}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-sm text-muted-foreground'>
                          Số buổi học
                        </div>
                        <div className='font-medium'>
                          {courseDetails.session_number || "N/A"}
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <div className='text-sm text-muted-foreground'>
                          Thời lượng mỗi buổi
                        </div>
                        <div className='font-medium'>
                          {courseDetails.session_number_duration || "N/A"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className='text-muted-foreground'>
                      Không thể tải thông tin khóa học
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h3 className='text-lg font-medium mb-4'>
                    Thông tin học viên
                  </h3>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                      <div className='text-sm text-muted-foreground'>
                        Tên học viên
                      </div>
                      <div className='font-medium flex items-center gap-1'>
                        <User className='h-3.5 w-3.5 text-muted-foreground' />
                        {userName}
                      </div>
                    </div>
                    {/* <div className='space-y-1'>
                      <div className='text-sm text-muted-foreground'>
                        Loại khách hàng
                      </div>
                      <div className='font-medium'>
                        <Badge variant='outline'>
                          {getOrderTypeDisplayName(order)}
                        </Badge>
                      </div>
                    </div> */}

                    {/* Guest Information */}
                    {order.guest && (
                      <>
                        {order.guest.email && (
                          <div className='space-y-1'>
                            <div className='text-sm text-muted-foreground'>
                              Email (Khách)
                            </div>
                            <div className='font-medium'>
                              {order.guest.email}
                            </div>
                          </div>
                        )}
                        {order.guest.phone && (
                          <div className='space-y-1'>
                            <div className='text-sm text-muted-foreground'>
                              Điện thoại (Khách)
                            </div>
                            <div className='font-medium'>
                              {order.guest.phone}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Member Information */}
                    {order.user && (
                      <>
                        <div className='space-y-1'>
                          <div className='text-sm text-muted-foreground'>
                            ID Thành viên
                          </div>
                          <div className='font-medium font-mono text-sm'>
                            {order.user._id}
                          </div>
                        </div>
                        {order.user.email && (
                          <div className='space-y-1'>
                            <div className='text-sm text-muted-foreground'>
                              Email (Thành viên)
                            </div>
                            <div className='font-medium'>
                              {order.user.email}
                            </div>
                          </div>
                        )}
                        {order.user.phone && (
                          <div className='space-y-1'>
                            <div className='text-sm text-muted-foreground'>
                              Điện thoại (Thành viên)
                            </div>
                            <div className='font-medium'>
                              {order.user.phone}
                            </div>
                          </div>
                        )}
                        {order.user.birthday && (
                          <div className='space-y-1'>
                            <div className='text-sm text-muted-foreground'>
                              Ngày sinh
                            </div>
                            <div className='font-medium'>
                              {format(
                                new Date(order.user.birthday),
                                "dd/MM/yyyy"
                              )}
                            </div>
                          </div>
                        )}
                        {order.user.address && (
                          <div className='space-y-1 sm:col-span-2'>
                            <div className='text-sm text-muted-foreground'>
                              Địa chỉ
                            </div>
                            <div className='font-medium'>
                              {order.user.address}
                            </div>
                          </div>
                        )}
                        {order.user.parent_id &&
                          order.user.parent_id.length > 0 && (
                            <div className='space-y-1'>
                              <div className='text-sm text-muted-foreground'>
                                ID Phụ huynh
                              </div>
                              <div className='font-medium font-mono text-sm'>
                                {order.user.parent_id.join(", ")}
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>

                {/* Already Assigned to Class Scenario */}
                {isAlreadyAssignedToClass() && (
                  <div className='mt-6'>
                    <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <Check className='h-5 w-5 text-gray-600 mt-0.5' />
                        <div className='flex-1'>
                          <h4 className='text-sm font-medium text-gray-800'>
                            Đã được thêm vào lớp học
                          </h4>
                          <p className='text-sm text-gray-700 mt-1'>
                            Học viên {userName} đã được thêm vào lớp học cho
                            khóa học{" "}
                            <b>
                              <u>{courseDetails?.title}.</u>
                            </b>
                          </p>
                          {loadingClassDetails ? (
                            <div className='mt-2 text-sm text-gray-600'>
                              <span className='animate-pulse'>
                                Đang tải thông tin lớp học...
                              </span>
                            </div>
                          ) : assignedClassDetails ? (
                            <div className='mt-2 space-y-1'>
                              <div className='text-sm text-gray-600'>
                                <span className='font-medium'>
                                  Tên lớp học:
                                </span>{" "}
                                <span className='font-medium'>
                                  {assignedClassDetails.name}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className='mt-2 text-sm text-gray-600'>
                              Mã lớp học:{" "}
                              <span className='font-mono'>
                                {typeof order.class === "string"
                                  ? order.class
                                  : order.class?._id || "N/A"}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paid Member Order Scenario */}
                {false && isPaidMemberOrder() && (
                  <div className='mt-6'>
                    <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <UserCheck className='h-5 w-5 text-green-600 mt-0.5' />
                        <div className='flex-1'>
                          <h4 className='text-sm font-medium text-green-800'>
                            Thành viên đã thanh toán
                          </h4>
                          <p className='text-sm text-green-700 mt-1'>
                            Học viên {userName} đã thanh toán thành công cho
                            khóa học{" "}
                            <b>
                              <u>{courseDetails.title}.</u>
                            </b>{" "}
                            Bạn có thể thêm học viên vào lớp học.
                          </p>
                          <div className='mt-3'>
                            <Button
                              size='sm'
                              onClick={handleShowClassModal}
                              className='bg-green-600 hover:bg-green-700'
                            >
                              <UserPlus className='mr-2 h-4 w-4' />
                              Thêm vào lớp học
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paid Guest Order Scenario */}
                {isPaidGuestOrder() && (
                  <div className='mt-6'>
                    <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
                      <div className='flex items-start gap-3'>
                        <User className='h-5 w-5 text-blue-600 mt-0.5' />
                        <div className='flex-1'>
                          <h4 className='text-sm font-medium text-blue-800'>
                            Khách hàng đã thanh toán
                          </h4>
                          <p className='text-sm text-blue-700 mt-1'>
                            Khách hàng {order.guest?.username || "Không rõ tên"}{" "}
                            đã thanh toán thành công cho khóa học{" "}
                            <u>
                              <b>{courseDetails.title}.</b>
                            </u>{" "}
                            Cần tạo tài khoản để thêm vào lớp học.
                          </p>
                          <div className='mt-3'>
                            <Button
                              size='sm'
                              onClick={handleCreateStudentAccount}
                              className='bg-blue-600 hover:bg-blue-700'
                            >
                              <UserPlus className='mr-2 h-4 w-4' />
                              Tạo tài khoản
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          {/* <Card>
            <CardHeader>
              <CardTitle>Quản lý trạng thái</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='text-sm text-muted-foreground'>
                  Trạng thái hiện tại
                </div>
                <Badge
                  variant='outline'
                  className={getStatusClass(order.status)}
                >
                  {getStatusName(order.status)}
                </Badge>
              </div>

              <div className='space-y-2'>
                <div className='text-sm text-muted-foreground'>
                  Cập nhật trạng thái
                </div>
                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                  disabled={updatingStatus}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='Chọn trạng thái' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='paid'>Đã thanh toán</SelectItem>
                    <SelectItem value='pending'>Đang chờ</SelectItem>
                    <SelectItem value='expired'>Đã hết hạn</SelectItem>
                    <SelectItem value='cancelled'>Đã hủy</SelectItem>
                    <SelectItem value='refunded'>Đã hoàn tiền</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className='w-full'
                onClick={handleStatusUpdate}
                disabled={updatingStatus || newStatus === order.status?.[0]}
              >
                {updatingStatus ? "Đang xử lý..." : "Cập nhật"}
              </Button>
            </CardContent>
          </Card> */}

          {/* Transaction Timeline */}
          <Card className='mt-4'>
            <CardHeader>
              <CardTitle>Lịch sử hoạt động</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-start gap-2'>
                  <div className='h-2 w-2 mt-1.5 rounded-full bg-green-500' />
                  <div className='flex-1'>
                    <p className='font-medium'>Tạo giao dịch</p>
                    <div className='flex items-center text-sm text-muted-foreground'>
                      <Clock className='mr-1 h-3.5 w-3.5' />
                      <time dateTime={order.created_at}>
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                      </time>
                    </div>
                    {/* {order.created_by && (
                      <p className='text-xs text-muted-foreground mt-1'>
                        Tạo bởi: {order.created_by}
                      </p>
                    )} */}
                  </div>
                </div>

                {order.updated_at && order.updated_at !== order.created_at && (
                  <div className='flex items-start gap-2'>
                    <div className='h-2 w-2 mt-1.5 rounded-full bg-blue-500' />
                    <div className='flex-1'>
                      <p className='font-medium'>Cập nhật gần nhất</p>
                      <div className='flex items-center text-sm text-muted-foreground'>
                        <Clock className='mr-1 h-3.5 w-3.5' />
                        <time dateTime={order.updated_at}>
                          {format(
                            new Date(order.updated_at),
                            "dd/MM/yyyy HH:mm"
                          )}
                        </time>
                      </div>
                      {order.updated_by && (
                        <p className='text-xs text-muted-foreground mt-1'>
                          Cập nhật bởi: {order.updated_by}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className='flex items-start gap-2'>
                  <div
                    className={`h-2 w-2 mt-1.5 rounded-full ${
                      order.status[0] === "paid"
                        ? "bg-green-500"
                        : order.status[0] === "pending"
                        ? "bg-amber-500"
                        : order.status[0] === "cancelled"
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                  />
                  <div className='flex-1'>
                    <p className='font-medium'>
                      Trạng thái: {getStatusName(order.status)}
                    </p>
                    <div className='flex items-center text-sm text-muted-foreground'>
                      <Clock className='mr-1 h-3.5 w-3.5' />
                      <time dateTime={order.updated_at || order.created_at}>
                        {format(
                          new Date(order.updated_at || order.created_at),
                          "dd/MM/yyyy HH:mm"
                        )}
                      </time>
                    </div>
                  </div>
                </div>

                {order.payment?.zp_trans_id && (
                  <div className='flex items-start gap-2'>
                    <div className='h-2 w-2 mt-1.5 rounded-full bg-purple-500' />
                    <div className='flex-1'>
                      <p className='font-medium'>Thanh toán ZaloPay</p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Mã GD: {order.payment.zp_trans_id}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Class Selection Modal */}
      {false && (
        <Dialog
          open={showClassModal}
          onOpenChange={(open) => {
            if (!open) {
              handleCloseClassModal();
            }
          }}
        >
          <DialogContent className='sm:max-w-[625px]'>
            <DialogHeader>
              <DialogTitle>Chọn lớp học</DialogTitle>
              <DialogDescription>
                Chọn lớp học để thêm {userName} vào khóa học{" "}
                <u>
                  <b>{courseDetails.title}.</b>
                </u>
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* Search Controls */}
              <div className='space-y-4 p-4 bg-muted/30 rounded-lg border'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Tìm kiếm lớp học:
                  </label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Nhập tên lớp học...'
                      value={searchKey}
                      onChange={(e) => setSearchKey(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Lọc theo lịch học:
                  </label>
                  <Select
                    value={haveSchedule.toString()}
                    onValueChange={(value) => setHaveSchedule(value === "true")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn loại lớp học' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='true'>Có lịch học</SelectItem>
                      <SelectItem value='false'>Chưa có lịch học</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingClassrooms ? (
                <div className='flex justify-center py-8'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
                </div>
              ) : classrooms.length === 0 ? (
                <div className='text-center py-8'>
                  <p className='text-muted-foreground'>
                    {searchKey
                      ? `Không tìm thấy lớp học nào với từ khóa "${searchKey}"`
                      : "Chưa có lớp học nào cho khóa học này"}
                  </p>
                </div>
              ) : (
                <>
                  <div className='space-y-3'>
                    <label className='text-sm font-medium'>
                      Danh sách lớp học:
                    </label>
                    <div className='space-y-2 max-h-64 overflow-y-auto'>
                      {classrooms.map((classroom) => (
                        <div
                          key={classroom._id}
                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedClassId === classroom._id
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedClassId(classroom._id)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex-1'>
                              <div className='flex items-center gap-2'>
                                <div
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                    selectedClassId === classroom._id
                                      ? "border-primary bg-primary"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {selectedClassId === classroom._id && (
                                    <div className='w-2 h-2 rounded-full bg-white'></div>
                                  )}
                                </div>
                                <span className='font-medium text-base'>
                                  {classroom.name}
                                </span>
                              </div>
                              <div className='mt-1 ml-6 space-y-1'>
                                <div className='text-sm text-muted-foreground'>
                                  Giảng viên:{" "}
                                  {(() => {
                                    if (
                                      typeof classroom.instructor ===
                                        "object" &&
                                      classroom.instructor?.name
                                    ) {
                                      return classroom.instructor.name;
                                    } else if (
                                      typeof classroom.instructor ===
                                        "string" &&
                                      instructorDetails[classroom.instructor]
                                    ) {
                                      return (
                                        instructorDetails[classroom.instructor]
                                          .user?.username ||
                                        instructorDetails[classroom.instructor]
                                          .user?.name ||
                                        "Không rõ tên"
                                      );
                                    } else {
                                      return "Chưa phân công";
                                    }
                                  })()}
                                </div>
                                {classroom.schedules &&
                                classroom.schedules.length > 0 ? (
                                  <div className='text-xs text-green-600 font-medium'>
                                    ✓ {classroom.schedules.length} lịch học đã
                                    có
                                  </div>
                                ) : (
                                  <div className='text-xs text-orange-600 font-medium'>
                                    Chưa có lịch học
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className='flex justify-end gap-2 pt-4'>
                    <Button
                      variant='outline'
                      onClick={handleCloseClassModal}
                      disabled={addingToClass}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleAddToClass}
                      disabled={!selectedClassId || addingToClass}
                    >
                      {addingToClass ? "Đang thêm..." : "Thêm vào lớp"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Student Modal */}
      <CreateStudentModal
        open={showCreateStudentModal}
        onOpenChange={setShowCreateStudentModal}
        onSuccess={handleStudentCreated}
        guestData={order?.guest}
      />

      {/* Delete Order Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa giao dịch</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch{" "}
              <span className='font-semibold'>
                {order?._id.substring(0, 8)}...
              </span>{" "}
              không? Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu
              liên quan đến giao dịch này.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Order Modal */}
      <EditOrderModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        order={order}
        onSuccess={async () => {
          // Refresh order data after successful update
          if (!token || !tenantId || !order) return;

          try {
            const updatedOrder = await fetchOrderById({
              orderId: order._id,
              tenantId,
              token,
            });
            setOrder(updatedOrder);

            // Also refresh course details if course changed
            if (typeof updatedOrder.course === "object") {
              setCourseDetails(updatedOrder.course);
            } else if (updatedOrder.course) {
              const courseData = await fetchCourseById({
                courseId: updatedOrder.course,
                tenantId,
                token,
              });
              setCourseDetails(courseData);
            }
          } catch (err) {
            console.error("Error refreshing order data:", err);
          }
        }}
      />
    </>
  );
}
