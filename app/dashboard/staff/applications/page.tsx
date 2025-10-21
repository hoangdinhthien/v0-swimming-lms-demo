"use client";

import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Mail,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchStaffApplications } from "@/api/staff-data/staff-data-api";
import { useRouter } from "next/navigation";

interface Application {
  _id: string;
  title: string;
  content: string;
  type:
    | {
        title: string;
        type: string[];
      }
    | string;
  status: string[];
  created_by: {
    username: string;
    email: string;
  };
  created_at: string;
  reply?: string;
}

interface ApplicationsResponse {
  meta: {
    total: number;
    last_page: number;
    current_page: number;
  };
  data: Application[];
}

export default function StaffApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response: ApplicationsResponse = await fetchStaffApplications(
        page,
        limit
      );
      console.log("Applications response:", response);

      setApplications(response.data || []);
      setTotal(response.meta?.total || 0);

      // Calculate statistics
      const allApplications = response.data || [];
      const totalApps = allApplications.length;
      const pending = allApplications.filter(
        (app) =>
          !app.status ||
          app.status.length === 0 ||
          app.status.includes("pending")
      ).length;
      const approved = allApplications.filter(
        (app) => app.status && app.status.includes("approved")
      ).length;
      const rejected = allApplications.filter(
        (app) => app.status && app.status.includes("rejected")
      ).length;

      setStats({
        total: response.meta?.total || totalApps,
        pending,
        approved,
        rejected,
      });
    } catch (error) {
      console.error("Error loading applications:", error);
      setApplications([]);
      setTotal(0);
      setStats({ total: 0, pending: 0, approved: 0, rejected: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [page]);

  // Filter applications based on search term, status, and type
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      if (typeof app.type === "object" && app.type.type) {
        matchesType = app.type.type.includes(typeFilter);
      } else if (typeof app.type === "string") {
        matchesType = app.type === typeFilter;
      }
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleRowClick = (applicationId: string) => {
    router.push(`/dashboard/staff/applications/${applicationId}`);
  };

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 bg-gray-200 rounded w-1/4'></div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className='h-24 bg-gray-200 rounded'
              ></div>
            ))}
          </div>
          <div className='h-96 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-4 md:p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500'>
      <div className='container mx-auto p-6 space-y-6'>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <h1 className='text-3xl font-bold'>Quản lý đơn từ</h1>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Tổng đơn từ</CardTitle>
              <FileText className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Đang chờ</CardTitle>
              <Clock className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Đã duyệt</CardTitle>
              <CheckCircle className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Từ chối</CardTitle>
              <XCircle className='h-4 w-4' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.rejected}</div>
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

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Danh sách đơn từ ({filteredApplications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => (
                  <TableRow
                    key={app._id}
                    className='cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950 group transition-all duration-200'
                    onClick={() => handleRowClick(app._id)}
                  >
                    <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                      <div className='space-y-1'>
                        <div className='font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                          {app.title}
                        </div>
                        <div className='text-sm text-gray-500 line-clamp-2 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200'>
                          {app.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                      <Badge
                        variant='outline'
                        className='group-hover:bg-blue-100 group-hover:text-blue-700 group-hover:border-blue-300 dark:group-hover:bg-blue-900 dark:group-hover:text-blue-300 dark:group-hover:border-blue-700 transition-all duration-200'
                      >
                        {typeof app.type === "object"
                          ? app.type.title
                          : app.type || "Chưa phân loại"}
                      </Badge>
                    </TableCell>
                    <TableCell className='group-hover:bg-blue-50 dark:group-hover:bg-blue-950 transition-colors duration-200'>
                      <div className='flex flex-wrap gap-1'>
                        {app.status && app.status.length > 0 ? (
                          app.status.map((status, index) => (
                            <Badge
                              key={index}
                              variant={
                                status === "approved"
                                  ? "default"
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
    </div>
  );
}
