"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Filter,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useStaffOrders } from "@/hooks/useStaffData";
import { parseApiResponse } from "@/utils/api-response-parser";

interface OrderItem {
  _id: string;
  price?: number;
  amount?: number;
  status?: string[] | string;
  created_at?: string;
  type?: string[];
  course?: {
    _id: string;
    title: string;
    price: number;
    [key: string]: any;
  };
  user?: {
    _id: string;
    email: string;
    username: string;
    [key: string]: any;
  };
  payment?: {
    url?: string;
    app_trans_id?: string;
    zp_trans_id?: number;
  };
  [key: string]: any;
}

export default function StaffOrdersPage() {
  const {
    data: staffOrdersData,
    loading: isLoading,
    error,
    refetch,
    hasPermission,
  } = useStaffOrders();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (staffOrdersData) {
      // Use flexible API response parser
      const parsedResponse = parseApiResponse<OrderItem>(staffOrdersData);
      setOrders(parsedResponse.data);
    }
  }, [staffOrdersData]);

  // Filter orders based on search and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      (order._id &&
        order._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      getStatusString(order.status).includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      getStatusString(order.status) === statusFilter.toLowerCase() ||
      (statusFilter === "completed" &&
        getStatusString(order.status) === "paid"); // Include "paid" as completed

    return matchesSearch && matchesStatus;
  });

  // Helper function to get status as string
  const getStatusString = (status: any): string => {
    if (Array.isArray(status)) {
      return status[0]?.toLowerCase() || "";
    }
    return typeof status === "string" ? status.toLowerCase() : "";
  };

  // Calculate stats
  const totalOrders = orders.length;
  const completedOrders = orders.filter(
    (order) =>
      getStatusString(order.status) === "completed" ||
      getStatusString(order.status) === "paid"
  ).length;
  const pendingOrders = orders.filter(
    (order) => getStatusString(order.status) === "pending"
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getStatusColor = (status: any) => {
    const statusString = getStatusString(status);
    switch (statusString) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800";
      case "cancelled":
      case "expired":
        return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800";
    }
  };

  // Calculate pagination values
  const totalPages = Math.ceil(totalOrders / limit);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  if (!hasPermission) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <Alert>
          <AlertDescription>
            Bạn không có quyền xem đơn hàng. Vui lòng liên hệ quản lý.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>
            Lỗi tải dữ liệu
          </div>
          <p className='text-muted-foreground'>{error}</p>
          <Button onClick={refetch}>Thử lại</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/staff'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay lại Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Đơn hàng & Thanh toán</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả các đơn hàng tại trung tâm bơi lội
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Xuất dữ liệu
          </Button>
          <Button onClick={refetch}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Làm mới
          </Button>
        </div>
      </div>

      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng số đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{completedOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {formatCurrency(
                orders
                  .filter((order) => getStatusString(order.status) === "paid")
                  .reduce(
                    (sum, order) => sum + (order.price || order.amount || 0),
                    0
                  )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Đang chờ thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pendingOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Lịch sử đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm theo mã đơn hàng, tên học viên...'
                className='pl-8'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-1 gap-4'>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='completed'>Hoàn thành</SelectItem>
                  <SelectItem value='paid'>Đã thanh toán</SelectItem>
                  <SelectItem value='pending'>Đang xử lý</SelectItem>
                  <SelectItem value='expired'>Hết hạn</SelectItem>
                  <SelectItem value='cancelled'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-center py-10'
                    >
                      <div className='flex justify-center'>
                        <div className='animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full'></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const orderDate = order.created_at
                      ? new Date(order.created_at)
                      : new Date();
                    const formattedDate = formatDate(order.created_at || "");
                    const userName =
                      order.user?.username ||
                      order.user?.email ||
                      "Không xác định";
                    const userContact =
                      order.user?.email || order.user?.phone || "N/A";
                    const courseName = order.course?.title || "Không xác định";
                    const orderType = Array.isArray(order.type)
                      ? order.type[0]
                      : "member";

                    return (
                      <TableRow
                        key={order._id}
                        className='cursor-pointer hover:bg-muted/50 transition-colors'
                      >
                        <TableCell className='font-medium'>
                          {order._id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <div className='flex items-start flex-col'>
                            <div className='font-medium'>{userName}</div>
                            <div className='text-xs text-muted-foreground'>
                              {userContact}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{courseName}</TableCell>
                        <TableCell>
                          {formatCurrency(order.price || order.amount || 0)}
                        </TableCell>
                        <TableCell>{formattedDate}</TableCell>
                        <TableCell className='capitalize'>
                          {orderType}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant='outline'
                            className={getStatusColor(order.status)}
                          >
                            {Array.isArray(order.status)
                              ? order.status[0]
                              : order.status || "Không xác định"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-center py-8 text-muted-foreground'
                    >
                      Không tìm thấy đơn hàng phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-muted-foreground'>
                Hiển thị {Math.min((currentPage - 1) * limit + 1, totalOrders)}{" "}
                - {Math.min(currentPage * limit, totalOrders)} trong tổng số{" "}
                {totalOrders} đơn hàng
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className='h-4 w-4' />
                  <span className='sr-only'>Trang trước</span>
                </Button>
                <div className='text-sm'>
                  Trang {currentPage} / {totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={!canGoNext}
                >
                  <ChevronRight className='h-4 w-4' />
                  <span className='sr-only'>Trang sau</span>
                </Button>
              </div>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className='w-[120px]'>
                  <SelectValue placeholder='Hiển thị' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>10 mỗi trang</SelectItem>
                  <SelectItem value='25'>25 mỗi trang</SelectItem>
                  <SelectItem value='50'>50 mỗi trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
