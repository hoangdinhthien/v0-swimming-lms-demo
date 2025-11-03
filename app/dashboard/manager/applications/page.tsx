"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  User,
  Loader2,
  ChevronRight,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getApplications,
  getApplicationDetail,
  Application,
  PaginatedApplicationsResponse,
} from "@/api/manager/applications-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function ApplicationsPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Pagination state (matching courses page pattern)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const router = useRouter();

  const handleRowClick = (applicationId: string) => {
    router.push(`/dashboard/manager/applications/${applicationId}`);
  };

  // Extract fetch logic
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");
      const response = await getApplications(tenantId, token, page, limit);
      console.log("[ApplicationsPage] Loaded applications:", response);
      console.log(
        "[ApplicationsPage] Applications array:",
        response.applications
      );
      if (response.applications.length > 0) {
        console.log(
          "[ApplicationsPage] First app structure:",
          response.applications[0]
        );
        console.log(
          "[ApplicationsPage] First app type:",
          response.applications[0].type,
          typeof response.applications[0].type
        );
      }
      setApplications(response.applications);
      setTotal(response.totalCount);
    } catch (e: any) {
      setError(e.message || "Failed to fetch applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Add request deduplication like courses page
    const timeoutId = setTimeout(fetchApplications, 100);
    return () => clearTimeout(timeoutId);
  }, [page, limit]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchApplications();
      toast({
        title: "Đã làm mới",
        description: "Dữ liệu đơn đăng ký đã được cập nhật",
      });
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

  async function handleShowDetail(id: string) {
    setDetailLoading(true);
    setDialogOpen(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");
      const detail = await getApplicationDetail(id, tenantId, token);
      setSelectedApp(detail);
    } catch {
      setSelectedApp(null);
    }
    setDetailLoading(false);
  }

  // Calculate totals for summary cards
  const totalApplications = total;
  const totalPending = applications.filter(
    (app) => app.status && app.status.includes("pending")
  ).length;
  const totalApproved = applications.filter(
    (app) => app.status && app.status.includes("approved")
  ).length;
  const totalRejected = applications.filter(
    (app) => app.status && app.status.includes("rejected")
  ).length;

  // Filter applications based on search term, status, and type
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.content &&
        app.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
      app.created_by?.username
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.created_by?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" &&
        (!app.status ||
          app.status.length === 0 ||
          app.status.includes("pending"))) ||
      (statusFilter === "approved" &&
        app.status &&
        app.status.includes("approved")) ||
      (statusFilter === "rejected" &&
        app.status &&
        app.status.includes("rejected")) ||
      (statusFilter === "completed" &&
        app.status &&
        app.status.includes("completed"));

    let matchesType = true;
    if (typeFilter !== "all") {
      if (
        typeof app.type === "object" &&
        app.type &&
        "type" in app.type &&
        app.type.type
      ) {
        matchesType =
          Array.isArray(app.type.type) && app.type.type.includes(typeFilter);
      } else if (Array.isArray(app.type)) {
        matchesType = app.type.includes(typeFilter);
      }
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách đơn từ...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
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
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Đơn từ</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả các đơn từ gửi lên trong hệ thống
          </p>
        </div>
        <Button
          variant='outline'
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng số đơn từ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalApplications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Đang chờ xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalPending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Đã duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalApproved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Đã từ chối</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalRejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  placeholder='Tìm kiếm theo tiêu đề, nội dung, người gửi...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className='w-full md:w-[200px]'>
                <SelectValue placeholder='Trạng thái' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả trạng thái</SelectItem>
                <SelectItem value='pending'>Đang chờ</SelectItem>
                <SelectItem value='approved'>Đã duyệt</SelectItem>
                <SelectItem value='rejected'>Từ chối</SelectItem>
                <SelectItem value='completed'>Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
            >
              <SelectTrigger className='w-full md:w-[200px]'>
                <SelectValue placeholder='Loại đơn' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Tất cả loại</SelectItem>
                <SelectItem value='leave'>Xin nghỉ</SelectItem>
                <SelectItem value='overtime'>Tăng ca</SelectItem>
                <SelectItem value='expense'>Chi phí</SelectItem>
                <SelectItem value='other'>Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>
              Danh sách đơn từ ({filteredApplications.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className='relative'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Loại đơn từ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người gửi</TableHead>
                <TableHead>Ngày gửi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.map((app) => (
                <TableRow
                  key={app._id}
                  className='cursor-pointer group hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors duration-200'
                  onClick={() => handleRowClick(app._id)}
                >
                  <TableCell className='font-medium group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                    <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                      {app.title}
                    </span>
                  </TableCell>
                  <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                    <div className='flex flex-wrap gap-1'>
                      {(() => {
                        // Handle different type structures
                        if (
                          app.type &&
                          typeof app.type === "object" &&
                          "_id" in app.type
                        ) {
                          // Type is an object with title and nested type array
                          const typeObj = app.type as any;
                          return (
                            <Badge
                              variant='outline'
                              className='text-xs group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300 dark:group-hover:border-blue-700 transition-all duration-200'
                            >
                              {typeObj.title || "Đơn từ tùy chỉnh"}
                            </Badge>
                          );
                        } else if (
                          Array.isArray(app.type) &&
                          app.type.length > 0
                        ) {
                          // Type is an array
                          return app.type.map((t: string) => (
                            <Badge
                              key={t}
                              variant='outline'
                              className='text-xs group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300 dark:group-hover:border-blue-700 transition-all duration-200'
                            >
                              {t === "instructor"
                                ? "Giảng viên"
                                : t === "member"
                                ? "Thành viên"
                                : t === "staff"
                                ? "Nhân viên"
                                : t}
                            </Badge>
                          ));
                        } else {
                          return (
                            <Badge
                              variant='outline'
                              className='text-xs group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300 dark:group-hover:border-blue-700 transition-all duration-200'
                            >
                              Không xác định
                            </Badge>
                          );
                        }
                      })()}
                    </div>
                  </TableCell>
                  <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                    <div className='flex flex-wrap gap-1'>
                      {app.status &&
                      Array.isArray(app.status) &&
                      app.status.length > 0 ? (
                        app.status.map((status: string) => (
                          <Badge
                            key={status}
                            variant={
                              status === "approved" || status === "completed"
                                ? "default"
                                : status === "rejected"
                                ? "destructive"
                                : status === "pending"
                                ? "secondary"
                                : "outline"
                            }
                            className='text-xs transition-all duration-200'
                          >
                            {status === "pending"
                              ? "Đang chờ"
                              : status === "approved"
                              ? "Đã duyệt"
                              : status === "rejected"
                              ? "Từ chối"
                              : status === "completed"
                              ? "Hoàn thành"
                              : status}
                          </Badge>
                        ))
                      ) : (
                        <Badge
                          variant='outline'
                          className='text-xs group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300 dark:group-hover:border-blue-700 transition-all duration-200'
                        >
                          Chưa xử lý
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                      <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                        {app.created_by?.username || app.created_by?.email}
                      </span>
                      <Mail className='h-4 w-4 ml-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                      <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                        {app.created_by?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                    <div className='flex items-center justify-between'>
                      <span className='group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                        {new Date(app.created_at).toLocaleString("vi-VN")}
                      </span>
                      <ChevronRight className='h-4 w-4 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200' />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination Controls (same style as courses page) */}
          <div className='flex justify-center mt-6'>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    aria-disabled={page === 1}
                  />
                </PaginationItem>
                {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href='#'
                      isActive={page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href='#'
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < Math.ceil(total / limit)) setPage(page + 1);
                    }}
                    aria-disabled={page === Math.ceil(total / limit)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
