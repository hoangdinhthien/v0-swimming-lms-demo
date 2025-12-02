"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Loader2, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/data-table";
import { columns, Application } from "./components/columns";
import {
  getApplications,
  PaginatedApplicationsResponse,
} from "@/api/manager/applications-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { useToast } from "@/hooks/use-toast";

export default function ApplicationsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Pagination state (for API calls)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(1000); // Fetch all for client-side filtering
  const [total, setTotal] = useState(0);

  const handleRowClick = (application: Application) => {
    router.push(`/dashboard/manager/applications/${application._id}`);
  };

  // Extract fetch logic with optional search
  const fetchApplications = async (
    searchValue?: string,
    isInitialLoad = false
  ) => {
    if (isInitialLoad) {
      setLoading(true);
    } else if (searchValue !== undefined) {
      setIsSearching(true);
    }
    setError(null);

    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");

      const response = await getApplications(
        tenantId,
        token,
        page,
        limit,
        searchValue?.trim()
      );
      setApplications(response.applications);
      setTotal(response.totalCount);
    } catch (e: any) {
      setError(e.message || "Failed to fetch applications");
      setApplications([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    // Add request deduplication
    const timeoutId = setTimeout(() => fetchApplications(undefined, true), 100);
    return () => clearTimeout(timeoutId);
  }, [page, limit]);

  // Handler for server-side search
  const handleServerSearch = (value: string) => {
    fetchApplications(value, false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchApplications();
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

  const pendingCount = applications.filter(
    (app) =>
      !app.status ||
      app.status.length === 0 ||
      app.status.some(
        (s) =>
          s.toLowerCase().includes("pending") || s.toLowerCase().includes("chờ")
      )
  ).length;

  const approvedCount = applications.filter(
    (app) =>
      app.status &&
      app.status.some(
        (s) =>
          s.toLowerCase().includes("approved") ||
          s.toLowerCase().includes("duyệt") ||
          s.toLowerCase().includes("đồng ý")
      )
  ).length;

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải đơn đăng ký...
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
    <>
      <div className='mb-6'>
        <Button
          variant='ghost'
          asChild
        >
          <a
            href='/dashboard/manager'
            className='inline-flex items-center text-sm font-medium'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            Quay lại Dashboard
          </a>
        </Button>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Đơn Đăng Ký</h1>
          <p className='text-muted-foreground'>
            Quản lý các đơn đăng ký từ học viên và phụ huynh
          </p>
        </div>
        <div className='flex gap-2'>
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
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3 mt-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng số đơn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <FileText className='h-8 w-8 text-primary' />
              <div className='text-2xl font-bold'>{applications.length}</div>
            </div>
            <p className='text-xs text-muted-foreground'>Tổng số đơn đăng ký</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Chờ xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pendingCount}</div>
            <p className='text-xs text-muted-foreground'>Đơn chờ phê duyệt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Đã duyệt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{approvedCount}</div>
            <p className='text-xs text-muted-foreground'>
              Đơn đã được phê duyệt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách đơn đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={applications}
            searchKey='title'
            searchPlaceholder='Tìm kiếm theo tiêu đề...'
            onServerSearch={handleServerSearch}
            filterOptions={[
              {
                columnId: "status",
                title: "Trạng thái",
                options: [
                  { label: "Chờ xử lý", value: "pending" },
                  { label: "Đã duyệt", value: "approved" },
                  { label: "Từ chối", value: "rejected" },
                ],
              },
            ]}
            emptyMessage='Không tìm thấy đơn đăng ký nào.'
          />
        </CardContent>
      </Card>
    </>
  );
}
