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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../../../hooks/use-auth";
import {
  Order,
  formatPrice,
  getStatusName,
  getStatusClass,
  getOrderUserName,
  getOrderUserContact,
  updateOrderStatus,
} from "../../../../../api/orders-api";
import { fetchCourseById } from "../../../../../api/courses-api";
import ManagerNotFound from "@/components/manager/not-found";

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

  // Fetch order details and related course
  useEffect(() => {
    async function getOrderDetails() {
      if (!token || !tenantId || !orderId) return;

      try {
        setLoading(true);

        // Fetch order by ID - we'll use the orders API and filter by ID
        // In a real app, you'd have a specific endpoint for getting a single order
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/workflow-process/manager/orders`,
          {
            headers: {
              "x-tenant-id": tenantId,
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );
        if (!response.ok) {
          // Check if it's a 404 error
          if (response.status === 404) {
            throw new Error("404");
          }
          throw new Error("Không thể tải thông tin giao dịch");
        }

        const data = await response.json();
        const orders = data.data?.[0]?.[0]?.data || [];
        const foundOrder = orders.find((o: Order) => o._id === orderId);

        if (!foundOrder) {
          throw new Error("Không tìm thấy giao dịch");
        }

        setOrder(foundOrder);
        setNewStatus(foundOrder.status?.[0] || "");

        // Now fetch course details
        if (foundOrder.course) {
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

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p>Đang tải thông tin giao dịch...</p>
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
          <Button variant='outline'>
            <FileText className='mr-2 h-4 w-4' />
            In hóa đơn
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
                    {order.type === "guest"
                      ? "Đăng ký từ Khách"
                      : order.type === "member"
                      ? "Đăng ký từ Thành viên"
                      : order.type}
                  </div>
                </div>
                <div className='space-y-1'>
                  <div className='text-sm text-muted-foreground'>
                    Phương thức thanh toán
                  </div>
                  <div className='font-medium flex items-center gap-1'>
                    <CreditCard className='h-3.5 w-3.5 text-muted-foreground' />
                    {order.payment?.zp_trans_id ? "ZaloPay" : "Chưa xác định"}
                  </div>
                </div>
              </div>

              <Separator className='my-6' />

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
                    <div className='space-y-1'>
                      <div className='text-sm text-muted-foreground'>
                        Liên hệ
                      </div>
                      <div className='font-medium'>{userContact}</div>
                    </div>
                    {order.guest?.email && (
                      <div className='space-y-1'>
                        <div className='text-sm text-muted-foreground'>
                          Email
                        </div>
                        <div className='font-medium'>{order.guest.email}</div>
                      </div>
                    )}
                    {order.guest?.phone && (
                      <div className='space-y-1'>
                        <div className='text-sm text-muted-foreground'>
                          Điện thoại
                        </div>
                        <div className='font-medium'>{order.guest.phone}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
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

              <Separator />

              <div className='space-y-2'>
                <div className='text-sm text-muted-foreground'>
                  Thao tác nhanh
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => {
                      setNewStatus("paid");
                      setTimeout(() => handleStatusUpdate(), 0);
                    }}
                    disabled={updatingStatus || order.status?.[0] === "paid"}
                  >
                    <Check className='mr-1 h-4 w-4' />
                    Xác nhận
                  </Button>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => {
                      setNewStatus("cancelled");
                      setTimeout(() => handleStatusUpdate(), 0);
                    }}
                    disabled={
                      updatingStatus || order.status?.[0] === "cancelled"
                    }
                  >
                    <X className='mr-1 h-4 w-4' />
                    Hủy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  </div>
                </div>

                {/* This would be populated from real activity logs in a production app */}
                <div className='flex items-start gap-2'>
                  <div className='h-2 w-2 mt-1.5 rounded-full bg-blue-500' />
                  <div className='flex-1'>
                    <p className='font-medium'>
                      Trạng thái đặt thành {getStatusName(order.status)}
                    </p>
                    <div className='flex items-center text-sm text-muted-foreground'>
                      <Clock className='mr-1 h-3.5 w-3.5' />
                      <time dateTime={order.created_at}>
                        {format(new Date(order.created_at), "dd/MM/yyyy HH:mm")}
                      </time>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
