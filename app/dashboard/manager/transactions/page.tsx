"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
  Plus,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { HighlightText } from "@/components/ui/highlight-text";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../../../../hooks/use-auth";
import {
  fetchOrders,
  formatPrice,
  getStatusName,
  getStatusClass,
  getOrderUserName,
  getOrderUserContact,
  getOrderTypeDisplayName,
  getOrderCourseId,
  getOrderCourseTitle,
  updateOrderStatus,
  deleteOrder,
  Order,
} from "@/api/manager/orders-api";
import { fetchCourseById } from "@/api/manager/courses-api";
import { CreateOrderModal } from "@/components/manager/create-order-modal";

interface CourseInfo {
  title: string;
  price?: number;
}

import { useWithReview } from "@/hooks/use-with-review";

export default function TransactionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { handleResponse } = useWithReview();
  const { token, tenantId, loading: authLoading } = useAuth();
  const [isAdvancedSearch, setIsAdvancedSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseInfo, setCourseInfo] = useState<Record<string, CourseInfo>>({});
  const [loadingCourses, setLoadingCourses] = useState<Record<string, boolean>>(
    {}
  );

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [limit, setLimit] = useState(10);

  // Status Update Dialog states
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Create Order Modal states
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);

  // Debounce timer for search
  // Debounce timer for search
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const memberSearchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const courseSearchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedMemberSearch, setDebouncedMemberSearch] = useState("");
  const [debouncedCourseSearch, setDebouncedCourseSearch] = useState("");

  // Debounce simple search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Debounce member search
  useEffect(() => {
    if (memberSearchTimerRef.current) {
      clearTimeout(memberSearchTimerRef.current);
    }

    memberSearchTimerRef.current = setTimeout(() => {
      setDebouncedMemberSearch(memberSearch);
    }, 300);

    return () => {
      if (memberSearchTimerRef.current) {
        clearTimeout(memberSearchTimerRef.current);
      }
    };
  }, [memberSearch]);

  // Debounce course search
  useEffect(() => {
    if (courseSearchTimerRef.current) {
      clearTimeout(courseSearchTimerRef.current);
    }

    courseSearchTimerRef.current = setTimeout(() => {
      setDebouncedCourseSearch(courseSearch);
    }, 300);

    return () => {
      if (courseSearchTimerRef.current) {
        clearTimeout(courseSearchTimerRef.current);
      }
    };
  }, [courseSearch]);

  useEffect(() => {
    // Wait for auth to complete
    if (authLoading) return;

    async function getOrders() {
      if (!token || !tenantId) {
        console.error(
          "[Transactions] Missing token or tenantId - cannot fetch orders"
        );
        setError("Thiếu thông tin xác thực. Vui lòng đăng nhập lại.");
        setLoading(false);
        return;
      }
      try {
        // Check if any search is active
        const hasAdvancedSearch =
          (debouncedMemberSearch && debouncedMemberSearch.trim()) ||
          (debouncedCourseSearch && debouncedCourseSearch.trim());
        const hasSimpleSearch = debouncedSearch && debouncedSearch.trim();

        if (hasAdvancedSearch || hasSimpleSearch) {
          setIsSearching(true);
        } else {
          setLoading(true);
        }

        // Build search params
        let searchParams: Record<string, string> | undefined = undefined;

        if (isAdvancedSearch) {
          // Advanced Search (AND logic)
          const params: Record<string, string> = {};
          if (debouncedMemberSearch && debouncedMemberSearch.trim()) {
            params["search[user.username:contains]"] =
              debouncedMemberSearch.trim();
          }
          if (debouncedCourseSearch && debouncedCourseSearch.trim()) {
            params["search[course.title:contains]"] =
              debouncedCourseSearch.trim();
          }
          if (Object.keys(params).length > 0) {
            searchParams = params;
          }
        } else {
          // Simple Search (OR logic)
          if (debouncedSearch && debouncedSearch.trim()) {
            searchParams = {
              "searchOr[course.title:contains]": debouncedSearch.trim(),
              "searchOr[user.username:contains]": debouncedSearch.trim(),
            };
          }
        }

        const ordersData = await fetchOrders({
          tenantId,
          token,
          page: currentPage,
          limit,
          searchParams,
        });

        if (!ordersData || !ordersData.orders) {
          throw new Error("API returned invalid data format");
        }

        setOrders(ordersData.orders);
        setTotalOrders(ordersData.total);

        // Prepare for course fetching - extract course IDs and handle embedded course objects
        const courseIds = [
          ...new Set(
            ordersData.orders
              .map((order) => getOrderCourseId(order))
              .filter(Boolean)
          ),
        ];

        // Pre-populate course info for orders that already have course objects embedded
        const embeddedCourseInfo: Record<string, CourseInfo> = {};
        ordersData.orders.forEach((order) => {
          if (
            order.course &&
            typeof order.course === "object" &&
            order.course._id
          ) {
            embeddedCourseInfo[order.course._id] = {
              title: order.course.title || "Không xác định",
              price: order.course.price || 0,
            };
          }
        });

        if (Object.keys(embeddedCourseInfo).length > 0) {
          setCourseInfo(embeddedCourseInfo);
        }

        // Only fetch course details for courses that are not already embedded
        const coursesToFetch = courseIds.filter(
          (courseId) => !embeddedCourseInfo[courseId]
        );

        if (coursesToFetch.length > 0) {
          const initialLoadingState = coursesToFetch.reduce((acc, id) => {
            acc[id] = true;
            return acc;
          }, {} as Record<string, boolean>);
          setLoadingCourses(initialLoadingState);

          // Fetch course details for each unique course ID that's not already embedded
          coursesToFetch.forEach((courseId) => {
            fetchCourseDetails(courseId);
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(`Không thể tải danh sách giao dịch: ${errorMessage}`);
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    }
    getOrders();
  }, [
    token,
    tenantId,
    currentPage,
    limit,
    authLoading,
    debouncedMemberSearch,
    debouncedCourseSearch,
    debouncedSearch,
    isAdvancedSearch,
  ]);

  // Fetch course details for a given course ID
  const fetchCourseDetails = async (courseId: string) => {
    if (!token || !tenantId) return;

    try {
      const course = await fetchCourseById({ courseId, tenantId, token });
      setCourseInfo((prev) => ({
        ...prev,
        [courseId]: {
          title: course.title || "Không xác định",
          price: course.price,
        },
      }));
    } catch (err) {
      console.error(`Error fetching course ${courseId}:`, err);
      setCourseInfo((prev) => ({
        ...prev,
        [courseId]: {
          title: "Không thể tải thông tin",
          price: 0,
        },
      }));
    } finally {
      setLoadingCourses((prev) => ({
        ...prev,
        [courseId]: false,
      }));
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (!token || !tenantId) return;

    setRefreshing(true);
    try {
      // Build search params using separate search fields for AND logic
      // Build search params
      let searchParams: Record<string, string> | undefined = undefined;

      if (isAdvancedSearch) {
        // Advanced Search (AND logic)
        const params: Record<string, string> = {};
        if (debouncedMemberSearch && debouncedMemberSearch.trim()) {
          params["search[user.username:contains]"] =
            debouncedMemberSearch.trim();
        }
        if (debouncedCourseSearch && debouncedCourseSearch.trim()) {
          params["search[course.title:contains]"] =
            debouncedCourseSearch.trim();
        }
        if (Object.keys(params).length > 0) {
          searchParams = params;
        }
      } else {
        // Simple Search (OR logic)
        if (debouncedSearch && debouncedSearch.trim()) {
          searchParams = {
            "searchOr[course.title:contains]": debouncedSearch.trim(),
            "searchOr[user.username:contains]": debouncedSearch.trim(),
          };
        }
      }

      const ordersData = await fetchOrders({
        tenantId,
        token,
        page: currentPage,
        limit,
        searchParams,
      });

      if (ordersData && ordersData.orders) {
        setOrders(ordersData.orders);
        setTotalOrders(ordersData.total);
      }
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setMemberSearch("");
    setCourseSearch("");
    setDebouncedMemberSearch("");
    setDebouncedCourseSearch("");
    setSearchQuery("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCourseFilter("all");
    setDateFilter(undefined);
  };

  // Toggle search mode
  const toggleSearchMode = () => {
    // Only toggle visibility, don't necessarily clear filters unless desired
    // User mockup implies it's just an accordion
    setIsAdvancedSearch(!isAdvancedSearch);
  };

  // Handle delete order
  const handleDeleteOrder = async () => {
    if (!deletingOrder || !token || !tenantId) return;

    setIsDeleting(true);
    try {
      await deleteOrder(deletingOrder._id, tenantId, token);

      // Remove the order from the local state
      setOrders((prev) =>
        prev.filter((order) => order._id !== deletingOrder._id)
      );
      setTotalOrders((prev) => prev - 1);

      toast({
        title: "Thành công",
        description: "Đã xóa giao dịch thành công",
      });

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setDeletingOrder(null);
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
    }
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus || !token || !tenantId) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const response = await updateOrderStatus({
        orderId: selectedOrder._id,
        status: newStatus,
        tenantId,
        token,
      });

      handleResponse(response, {
        onSuccess: () => {
          // Update the order in the local state
          setOrders((prev) =>
            prev.map((order) =>
              order._id === selectedOrder._id
                ? { ...order, status: [newStatus] }
                : order
            )
          );

          toast({
            title: "Thành công",
            description: "Trạng thái giao dịch đã được cập nhật.",
          });

          // Close dialog and reset state
          setStatusUpdateDialogOpen(false);
          setSelectedOrder(null);
          setNewStatus("");
        },
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Lỗi",
        description:
          "Không thể cập nhật trạng thái giao dịch. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Get unique courses for filter
  const courses = Array.from(
    new Set(
      orders.map((order) => {
        const courseId = getOrderCourseId(order);
        return courseInfo[courseId]?.title || getOrderCourseTitle(order);
      })
    )
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

  // Filter transactions based on filters (search is handled by API)
  const filteredTransactions = orders.filter((order) => {
    const orderDate = new Date(order.created_at);
    const formattedDate = format(orderDate, "MMM d, yyyy");
    const courseId = getOrderCourseId(order);
    const courseName =
      courseInfo[courseId]?.title || getOrderCourseTitle(order);

    // Filter by status
    const statusMatch =
      statusFilter === "all" ||
      (order.status &&
        order.status[0].toLowerCase() === statusFilter.toLowerCase());

    // Filter by course
    const courseMatch = courseFilter === "all" || courseName === courseFilter;

    // Filter by date (if a date is selected)
    const dateMatch =
      !dateFilter || formattedDate === format(dateFilter, "MMM d, yyyy");

    // Note: Search filtering is handled by API via searchOr params
    // No need to filter by search query here

    return statusMatch && courseMatch && dateMatch;
  });

  // Calculate pagination values
  const totalPages = Math.ceil(totalOrders / limit);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
    courseFilter,
    dateFilter,
    debouncedMemberSearch,
    debouncedCourseSearch,
    debouncedSearch,
  ]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">
            Đang tải danh sách giao dịch...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-16">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">
            Lỗi tải dữ liệu
          </div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  if (!authLoading && (!token || !tenantId)) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-500 text-lg font-semibold mb-2">
          Thiếu thông tin xác thực hoặc chi nhánh.
        </p>
        <p className="text-muted-foreground mb-4">
          Vui lòng đăng nhập lại hoặc chọn chi nhánh để tiếp tục.
        </p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Đăng nhập lại</Button>
          </Link>
          <Link href="/tenant-selection">
            <Button variant="default">Chọn chi nhánh</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/dashboard/manager"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại Dashboard
        </Link>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Giao dịch & Thanh toán</h1>
          <p className="text-muted-foreground">
            Quản lý tất cả các giao dịch tài chính tại trung tâm bơi lội
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Button onClick={() => setCreateOrderModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo giao dịch mới
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số giao dịch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Đang chờ thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lịch sử giao dịch</h2>
        </div>

        {/* Filter Row */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Simple Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm (tên học viên, tên khóa học)..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && isAdvancedSearch) {
                  setIsAdvancedSearch(false); // Auto-close advanced if typing here? Or just clear advanced inputs?
                  // Let's stick to the plan: switching separates them.
                  // But for better UX, if user types here, we treat it as simple search.
                  setMemberSearch("");
                  setCourseSearch("");
                  setDebouncedMemberSearch("");
                  setDebouncedCourseSearch("");
                }
              }}
              disabled={isAdvancedSearch && (!!memberSearch || !!courseSearch)} // Optional: disable if advanced is active? No, just let them type and switch.
            />
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="expired">Đã hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-[200px]">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFilter ? format(dateFilter, "PPP") : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={handleResetFilters}
            className="whitespace-nowrap"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa bộ lọc
          </Button>
        </div>

        {/* Advanced Search Accordion */}
        <div className="border rounded-md bg-card">
          <button
            onClick={toggleSearchMode}
            className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tìm kiếm nâng cao
            </div>
            {isAdvancedSearch ? (
              <ChevronRight className="h-4 w-4 rotate-90 transition-transform" />
            ) : (
              <ChevronRight className="h-4 w-4 transition-transform" />
            )}
          </button>

          {isAdvancedSearch && (
            <div className="p-4 border-t grid gap-4 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Tên học viên
                  </label>
                  <Input
                    placeholder="Nhập tên học viên..."
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      if (e.target.value) {
                        setSearchQuery(""); // Clear simple search if using advanced
                        setDebouncedSearch("");
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Tên khóa học
                  </label>
                  <Input
                    placeholder="Nhập tên khóa học..."
                    value={courseSearch}
                    onChange={(e) => {
                      setCourseSearch(e.target.value);
                      if (e.target.value) {
                        setSearchQuery("");
                        setDebouncedSearch("");
                      }
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Tìm kiếm với AND logic: Kết quả phải khớp{" "}
                <strong>cả hai</strong> điều kiện (nếu nhập cả hai).
              </div>
            </div>
          )}
        </div>

        {/* Loading Indicator */}
        {isSearching && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <Card className="border-none shadow-none">
        <CardContent className="p-0">
          <div className="rounded-md border overflow-hidden">
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
                  <TableHead className="w-[80px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      <div className="flex justify-center">
                        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((order) => {
                    const orderDate = new Date(order.created_at);
                    const formattedDate = format(orderDate, "dd/MM/yyyy");
                    const userName = getOrderUserName(order);
                    const userContact = getOrderUserContact(order);
                    const courseId = getOrderCourseId(order);
                    const isLoadingCourse = loadingCourses[courseId] || false;
                    const courseName =
                      courseInfo[courseId]?.title || getOrderCourseTitle(order);

                    return (
                      <TableRow
                        key={order._id}
                        className="group hover:bg-muted/50 transition-colors duration-200"
                      >
                        <TableCell className="font-medium group-hover:bg-muted/50 transition-colors duration-200">
                          <Link
                            href={`/dashboard/manager/transactions/${order._id}`}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {order._id.substring(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell className="group-hover:bg-muted/50 transition-colors duration-200">
                          <div className="flex items-start flex-col">
                            <div className="font-medium">
                              <HighlightText
                                text={userName}
                                searchQuery={
                                  isAdvancedSearch
                                    ? debouncedMemberSearch
                                    : debouncedSearch
                                }
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {userContact}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="group-hover:bg-muted/50 transition-colors duration-200">
                          {isLoadingCourse ? (
                            <div className="flex items-center">
                              <span className="animate-pulse bg-muted rounded h-4 w-24 block"></span>
                            </div>
                          ) : (
                            <HighlightText
                              text={courseName}
                              searchQuery={
                                isAdvancedSearch
                                  ? debouncedCourseSearch
                                  : debouncedSearch
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell className="group-hover:bg-muted/50 transition-colors duration-200">
                          <span>{formatPrice(order.price)}</span>
                        </TableCell>
                        <TableCell className="group-hover:bg-muted/50 transition-colors duration-200">
                          <span>{formattedDate}</span>
                        </TableCell>
                        <TableCell className="group-hover:bg-muted/50 transition-colors duration-200">
                          <span>{getOrderTypeDisplayName(order)}</span>
                        </TableCell>
                        <TableCell className="group-hover:bg-muted/50 transition-colors duration-200">
                          <Badge
                            variant="outline"
                            className={`${getStatusClass(
                              order.status
                            )} transition-all duration-200`}
                          >
                            {getStatusName(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className="group-hover:bg-muted/50 transition-colors duration-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeletingOrder(order);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không tìm thấy giao dịch phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Hiển thị {Math.min((currentPage - 1) * limit + 1, totalOrders)}{" "}
                - {Math.min(currentPage * limit, totalOrders)} trong tổng số{" "}
                {totalOrders} giao dịch
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Trang trước</span>
                </Button>
                <div className="text-sm">
                  Trang {currentPage} / {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={!canGoNext}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Trang sau</span>
                </Button>
              </div>
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Hiển thị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 mỗi trang</SelectItem>
                  <SelectItem value="25">25 mỗi trang</SelectItem>
                  <SelectItem value="50">50 mỗi trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog
        open={statusUpdateDialogOpen}
        onOpenChange={setStatusUpdateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái giao dịch</DialogTitle>
            <DialogDescription>
              Chọn trạng thái mới cho giao dịch này.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={newStatus}
              onValueChange={setNewStatus}
              disabled={updatingStatus}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Đã thanh toán</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="expired">Đã hết hạn</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
                <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusUpdateDialogOpen(false)}
              disabled={updatingStatus}
            >
              Hủy
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updatingStatus || !newStatus}
            >
              {updatingStatus ? "Đang xử lý..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Order Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa giao dịch</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch{" "}
              <span className="font-semibold">
                {deletingOrder?._id.substring(0, 8)}...
              </span>{" "}
              không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOrder}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Order Modal */}
      <CreateOrderModal
        open={createOrderModalOpen}
        onOpenChange={setCreateOrderModalOpen}
        onSuccess={handleRefresh}
      />
    </>
  );
}
