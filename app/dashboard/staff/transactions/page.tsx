"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchStaffOrders } from "@/api/staff-data/staff-data-api";

interface Order {
  _id: string;
  type: string[];
  course: {
    _id: string;
    title: string;
    price: number;
    description?: string;
  };
  price: number;
  user: {
    _id: string;
    email: string;
    username: string;
    phone?: string;
  };
  created_at: string;
  created_by: {
    _id: string;
    username: string;
    email: string;
  };
  status: string[];
  payment?: {
    url?: string;
    app_trans_id?: string;
    zp_trans_id?: number;
  };
}

interface OrdersResponse {
  meta: {
    total: number;
    last_page: number;
    current_page: number;
  };
  data: Order[];
}

// Helper functions
const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const getStatusBadge = (status: string[]) => {
  const primaryStatus = status[0] || "unknown";

  switch (primaryStatus) {
    case "paid":
      return (
        <Badge
          variant='default'
          className='bg-green-100 text-green-800 hover:bg-green-200'
        >
          Đã thanh toán
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant='secondary'
          className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        >
          Đang chờ
        </Badge>
      );
    case "expired":
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 text-red-800 hover:bg-red-200'
        >
          Đã hết hạn
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant='outline'
          className='bg-gray-100 text-gray-800 hover:bg-gray-200'
        >
          Đã hủy
        </Badge>
      );
    default:
      return <Badge variant='outline'>{primaryStatus}</Badge>;
  }
};

const getTypeDisplayName = (type: string[]) => {
  const primaryType = type[0] || "unknown";
  switch (primaryType) {
    case "member":
      return "Học viên";
    case "guest":
      return "Khách";
    default:
      return primaryType;
  }
};

export default function StaffTransactionsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const limit = 10;

  // Fetch orders from API
  useEffect(() => {
    async function getOrders() {
      setLoading(true);
      setError(null);
      try {
        const response: OrdersResponse = await fetchStaffOrders(
          currentPage,
          limit
        );
        console.log("Orders response:", response);

        setOrders(response.data || []);
        setTotalOrders(response.meta?.total || 0);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Không thể tải danh sách giao dịch: ${errorMessage}`);
        console.error("Error fetching orders:", err);
        setOrders([]);
        setTotalOrders(0);
      } finally {
        setLoading(false);
      }
    }
    getOrders();
  }, [currentPage]);

  // Get unique courses for filter
  const courses = Array.from(
    new Set(orders.map((order) => order.course?.title).filter(Boolean))
  );

  // Calculate totals
  const totalTransactions = totalOrders;
  const totalCompleted = orders.filter(
    (order) => order.status && order.status[0] === "paid"
  ).length;
  const totalAmount = orders.reduce((sum, order) => {
    if (order.status && order.status[0] === "paid") {
      return sum + (order.price || 0);
    }
    return sum;
  }, 0);
  const totalPending = orders.filter(
    (order) => order.status && order.status[0] === "pending"
  ).length;

  // Filter transactions based on search and filters
  const filteredTransactions = orders.filter((order) => {
    const orderDate = new Date(order.created_at);

    // Search filter
    const matchesSearch =
      searchQuery === "" ||
      order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.course?.title?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (order.status && order.status.includes(statusFilter));

    // Course filter
    const matchesCourse =
      courseFilter === "all" || order.course?.title === courseFilter;

    // Date filter
    const matchesDate =
      !dateFilter ||
      format(orderDate, "yyyy-MM-dd") === format(dateFilter, "yyyy-MM-dd");

    return matchesSearch && matchesStatus && matchesCourse && matchesDate;
  });

  const handleRowClick = (orderId: string) => {
    router.push(`/dashboard/staff/transactions/${orderId}`);
  };

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách giao dịch...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>
            Lỗi tải dữ liệu
          </div>
          <p className='text-muted-foreground'>{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý giao dịch</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả các giao dịch tài chính tại trung tâm bơi lội
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Xuất dữ liệu
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng số giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{formatPrice(totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Đang chờ thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalPending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm theo mã giao dịch, tên học viên...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Trạng thái' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                  <SelectItem value='paid'>Đã thanh toán</SelectItem>
                  <SelectItem value='pending'>Đang chờ</SelectItem>
                  <SelectItem value='expired'>Đã hết hạn</SelectItem>
                  <SelectItem value='cancelled'>Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={courseFilter}
                onValueChange={setCourseFilter}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Khóa học' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả khóa học</SelectItem>
                  {courses.map((course) => (
                    <SelectItem
                      key={course}
                      value={course}
                    >
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateFilter ? format(dateFilter, "PPP") : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Khóa học</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((order) => {
                    const orderDate = new Date(order.created_at);
                    const formattedDate = format(orderDate, "dd/MM/yyyy");

                    return (
                      <TableRow
                        key={order._id}
                        className='cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200'
                        onClick={() => handleRowClick(order._id)}
                      >
                        <TableCell className='font-medium group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {order._id.substring(0, 8)}...
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-start flex-col'>
                            <div className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {order.user?.username || "-"}
                            </div>
                            <div className='text-xs text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {order.user?.email || "-"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <div className='flex items-start flex-col'>
                            <div className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {order.course?.title || "Không xác định"}
                            </div>
                            <div className='text-xs text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                              {formatPrice(order.course?.price || 0)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {formatPrice(order.price)}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {formattedDate}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                            {getTypeDisplayName(order.type)}
                          </span>
                        </TableCell>
                        <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                          {getStatusBadge(order.status)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-center py-12'
                    >
                      <CreditCard className='mx-auto h-12 w-12 text-muted-foreground mb-4' />
                      <h3 className='text-lg font-semibold mb-2'>
                        Không có giao dịch
                      </h3>
                      <p className='text-muted-foreground'>
                        {orders.length === 0
                          ? "Chưa có giao dịch nào trong hệ thống."
                          : "Không tìm thấy giao dịch phù hợp với bộ lọc."}
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalOrders > limit && (
            <div className='flex justify-center mt-6'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      aria-disabled={currentPage === 1}
                    />
                  </PaginationItem>
                  {Array.from(
                    { length: Math.ceil(totalOrders / limit) },
                    (_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href='#'
                          isActive={currentPage === i + 1}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i + 1);
                          }}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href='#'
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < Math.ceil(totalOrders / limit))
                          setCurrentPage(currentPage + 1);
                      }}
                      aria-disabled={
                        currentPage === Math.ceil(totalOrders / limit)
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
