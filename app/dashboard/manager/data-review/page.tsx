"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Loader2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { createColumns } from "./components/columns";
import {
  fetchDataReviewList,
  updateDataReviewStatus,
  DataReviewRecord,
} from "@/api/manager/data-review-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

export default function ManagerDataReviewPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<DataReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load data review records
  const loadRecords = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
    }
    setError(null);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");

      const result = await fetchDataReviewList({
        tenantId,
        token,
        page: 1,
        limit: 1000,
      });
      setRecords(result.documents || []);
    } catch (e: any) {
      setError(e?.message || "Lỗi khi tải danh sách data-review");
      setRecords([]);
      toast({
        title: "❌ Lỗi",
        description: e?.message || "Không thể tải danh sách data-review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(true); // Initial load
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecords(false);
    setRefreshing(false);
    toast({
      title: "Đã làm mới",
      description: "Danh sách data-review đã được cập nhật",
    });
  };

  // Handle update status (approve or reject with note)
  const handleUpdateStatus = async (
    id: string,
    service: string,
    status: "approved" | "rejected",
    note: string
  ) => {
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");

      await updateDataReviewStatus({
        id,
        service,
        tenantId,
        token,
        status,
        note,
      });
      await loadRecords(false); // Reload list after update
    } catch (error) {
      throw error; // Re-throw to be handled by ActionsCell
    }
  };

  const columns = createColumns(handleUpdateStatus);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='flex flex-col items-center gap-2'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='text-sm text-muted-foreground'>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <div className='flex items-center gap-2'>
            <FileCheck className='h-6 w-6 text-primary' />
            <h1 className='text-2xl font-semibold'>Data Review</h1>
          </div>
          <p className='text-sm text-muted-foreground mt-1'>
            Danh sách các yêu cầu từ Staff cần Manager phê duyệt
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant='outline'
          size='sm'
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-sm text-destructive'>{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            Danh sách yêu cầu ({records.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={records}
            searchKey='type'
            searchPlaceholder='Tìm kiếm theo loại dữ liệu...'
            emptyMessage='Không có yêu cầu nào cần duyệt'
          />
        </CardContent>
      </Card>
    </div>
  );
}
