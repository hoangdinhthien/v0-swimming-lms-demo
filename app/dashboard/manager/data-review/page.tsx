"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Define modules that can appear in data-review
const MODULES = [
  { value: "all", label: "Tất cả", key: "all" },
  { value: "User", label: "Người dùng", key: "User" },
  { value: "Class", label: "Lớp học", key: "Class" },
  { value: "Course", label: "Khóa học", key: "Course" },
  { value: "Order", label: "Đơn hàng", key: "Order" },
  { value: "Pool", label: "Hồ bơi", key: "Pool" },
  { value: "Schedule", label: "Lịch học", key: "Schedule" },
  { value: "News", label: "Tin tức", key: "News" },
  { value: "Application", label: "Đơn từ", key: "Application" },
] as const;

export default function ManagerDataReviewPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<DataReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

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

  // Filter records by active tab
  const getFilteredRecords = () => {
    if (activeTab === "all") return records;
    return records.filter((record) => {
      const type = Array.isArray(record.type) ? record.type[0] : record.type;
      return type === activeTab;
    });
  };

  // Count records by module
  const getModuleCounts = () => {
    const counts: Record<string, number> = { all: records.length };
    MODULES.forEach((module) => {
      if (module.value !== "all") {
        counts[module.value] = records.filter((record) => {
          const type = Array.isArray(record.type)
            ? record.type[0]
            : record.type;
          return type === module.value;
        }).length;
      }
    });
    return counts;
  };

  const columns = createColumns(handleUpdateStatus);
  const filteredRecords = getFilteredRecords();
  const moduleCounts = getModuleCounts();

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
          <h1 className='text-2xl font-semibold'>
            Phê Duyệt Các Cập Nhật Từ Nhân Viên
          </h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Danh sách các yêu cầu từ Nhân viên cần Quản lý phê duyệt
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

      {/* Tabs with filtered data - Browser-style tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-0'
      >
        <div className='border-b'>
          <TabsList className='inline-flex h-auto flex-wrap gap-1 bg-transparent p-0 w-full justify-start'>
            {MODULES.map((module) => {
              const count = moduleCounts[module.value] || 0;
              return (
                <TabsTrigger
                  key={module.value}
                  value={module.value}
                  className='relative rounded-b-none border-b-2 border-transparent bg-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none'
                >
                  {module.label}
                  {count > 0 && (
                    <Badge
                      variant='secondary'
                      className='ml-2 h-5 min-w-5 px-1.5 text-xs'
                    >
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {MODULES.map((module) => (
          <TabsContent
            key={module.value}
            value={module.value}
            className='mt-0'
          >
            <Card className='rounded-tl-none border-t-0'>
              <CardHeader>
                <CardTitle className='text-lg'>
                  {module.label} ({moduleCounts[module.value] || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={
                    module.value === "all"
                      ? records
                      : records.filter((record) => {
                          const type = Array.isArray(record.type)
                            ? record.type[0]
                            : record.type;
                          return type === module.value;
                        })
                  }
                  searchKey='type'
                  searchPlaceholder='Tìm kiếm...'
                  emptyMessage={`Không có yêu cầu ${module.label.toLowerCase()} nào cần duyệt`}
                  filterOptions={[
                    {
                      columnId: "type",
                      title: "Loại dữ liệu",
                      options: MODULES.filter((m) => m.value !== "all").map(
                        (m) => ({
                          label: m.label,
                          value: m.key,
                        })
                      ),
                    },
                    {
                      columnId: "method",
                      title: "Hành động",
                      options: [
                        { label: "Tạo mới", value: "POST" },
                        { label: "Cập nhật", value: "PUT" },
                      ],
                    },
                    {
                      columnId: "status",
                      title: "Trạng thái",
                      options: [
                        { label: "Chờ duyệt", value: "pending" },
                        { label: "Đã duyệt", value: "approved" },
                        { label: "Từ chối", value: "rejected" },
                      ],
                    },
                  ]}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
