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
import { Mail, User, Loader2 } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  getApplications,
  getApplicationDetail,
  Application,
  PaginatedApplicationsResponse,
} from "@/api/applications-api";
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

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Pagination state (matching courses page pattern)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const router = useRouter();

  const handleRowClick = (applicationId: string) => {
    router.push(`/dashboard/manager/applications/${applicationId}`);
  };

  useEffect(() => {
    async function fetchApplications() {
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
      }
      setLoading(false);
    }

    // Add request deduplication like courses page
    const timeoutId = setTimeout(fetchApplications, 100);
    return () => clearTimeout(timeoutId);
  }, [page, limit]);

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

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách đơn từ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
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

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Danh sách đơn từ</CardTitle>
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
              {applications.map((app) => (
                <TableRow
                  key={app._id}
                  className='cursor-pointer hover:bg-muted/50 transition-colors'
                  onClick={() => handleRowClick(app._id)}
                >
                  <TableCell className='font-medium'>{app.title}</TableCell>
                  <TableCell>
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
                              className='text-xs'
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
                              className='text-xs'
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
                              className='text-xs'
                            >
                              Không xác định
                            </Badge>
                          );
                        }
                      })()}
                    </div>
                  </TableCell>
                  <TableCell>
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
                            className='text-xs'
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
                          className='text-xs'
                        >
                          Chưa xử lý
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <User className='h-4 w-4' />
                      <span>
                        {app.created_by?.username || app.created_by?.email}
                      </span>
                      <Mail className='h-4 w-4 ml-2' />
                      <span>{app.created_by?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(app.created_at).toLocaleString("vi-VN")}
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
