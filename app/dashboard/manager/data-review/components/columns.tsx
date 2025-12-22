"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import {
  DataReviewRecord,
  fetchDataReviewDetail,
} from "@/api/manager/data-review-api";

// Mapping tiếng Anh -> tiếng Việt
const MODULE_LABELS: Record<string, string> = {
  User: "Người dùng",
  Class: "Lớp học",
  Course: "Khóa học",
  Order: "Giao dịch",
  Pool: "Hồ bơi",
  Schedule: "Lịch học",
  News: "Tin tức",
  Application: "Đơn từ",
  Blog: "Blog",
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, Clock, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
// toasts disabled on this page due to UX conflicts
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DataComparison } from "./data-comparison";
import { DataDisplay } from "./data-display";
import { fetchOriginalData } from "@/api/manager/data-review-helpers";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";

// Helper function to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleString("vi-VN");
  } catch {
    return dateString;
  }
};

// Helper to get status color
const getStatusColor = (status?: string[]) => {
  const statusValue = Array.isArray(status) ? status[0] : status;
  switch (statusValue) {
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "pending":
    default:
      return "secondary";
  }
};

// Helper to get status label
const getStatusLabel = (status?: string[]) => {
  const statusValue = Array.isArray(status) ? status[0] : status;
  switch (statusValue) {
    case "approved":
      return "Đã duyệt";
    case "rejected":
      return "Từ chối";
    case "pending":
    default:
      return "Chờ duyệt";
  }
};

// Helper to get method badge variant
const getMethodVariant = (method?: string[]) => {
  const methodValue = Array.isArray(method) ? method[0] : method;
  return methodValue === "POST" ? "default" : "outline";
};

// Helper to get method label
const getMethodLabel = (method?: string[]) => {
  const methodValue = Array.isArray(method) ? method[0] : method;
  return methodValue === "POST" ? "Tạo mới" : "Cập nhật";
};

// Actions cell component - opens modal for view and approve/reject
const ActionsCell = ({
  row,
  onUpdateStatus,
}: {
  row: any;
  onUpdateStatus: (
    id: string,
    service: string,
    status: "approved" | "rejected",
    note: string
  ) => Promise<void>;
}) => {
  // toasts disabled on this page due to UX conflicts
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState("");
  const [detailRecord, setDetailRecord] = useState<DataReviewRecord | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [loadingOriginal, setLoadingOriginal] = useState(false);
  const [opError, setOpError] = useState<string | null>(null);
  const record = row.original as DataReviewRecord;

  const service = Array.isArray(record.type) ? record.type[0] : record.type;
  const isPending =
    Array.isArray(record.status) && record.status[0] === "pending";
  const method = Array.isArray(record.method)
    ? record.method[0]
    : record.method;
  const isPutRequest = method === "PUT";

  // Load detail data when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadDetail = async () => {
        setLoadingDetail(true);
        try {
          const tenantId = getSelectedTenant();
          const token = getAuthToken();
          if (!tenantId || !token) {
            throw new Error("Thiếu thông tin tenant hoặc token");
          }

          const detail = await fetchDataReviewDetail({
            id: record._id,
            type: service,
            tenantId,
            token,
          });
          setDetailRecord(detail);
        } catch (error) {
          console.error("Failed to load detail data:", error);
          setDetailRecord(null);
        } finally {
          setLoadingDetail(false);
        }
      };

      loadDetail();
    }
  }, [isOpen, record._id, service]);

  // Load original data when modal opens for PUT requests
  useEffect(() => {
    if (isOpen && isPutRequest && record.data_id) {
      const loadOriginal = async () => {
        setLoadingOriginal(true);
        try {
          const tenantId = getSelectedTenant();
          const token = getAuthToken();
          if (!tenantId || !token) {
            throw new Error("Thiếu thông tin tenant hoặc token");
          }

          const data = await fetchOriginalData(
            service,
            record.data_id!,
            tenantId,
            token
          );
          setOriginalData(data);
        } catch (error) {
          console.error("Failed to load original data:", error);
          setOriginalData(null);
        } finally {
          setLoadingOriginal(false);
        }
      };

      loadOriginal();
    }
  }, [isOpen, isPutRequest, record.data_id, service]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(record._id, service, "approved", note);
      setIsOpen(false);
      setNote("");
    } catch (error) {
      // show inline error in modal instead of global toast
      console.error("Approve failed:", error);
      setOpError(
        error instanceof Error ? error.message : "Không thể phê duyệt"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(record._id, service, "rejected", note);
      setIsOpen(false);
      setNote("");
    } catch (error) {
      // show inline error in modal instead of global toast
      console.error("Reject failed:", error);
      setOpError(error instanceof Error ? error.message : "Không thể từ chối");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0'
        onClick={() => setIsOpen(true)}
      >
        <Eye className='h-4 w-4' />
      </Button>
      <Dialog
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <DialogContent
          className='max-w-3xl max-h-[85vh]'
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu - {service}</DialogTitle>
            <DialogDescription>
              ID: {record._id} | Trạng thái: {getStatusLabel(record.status)}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className='h-[50vh] pr-4'>
            <div className='space-y-4'>
              {opError && (
                <div className='p-3 bg-destructive/10 text-destructive rounded-md'>
                  <strong className='block'>Lỗi:</strong>
                  <div className='text-sm'>{opError}</div>
                </div>
              )}
              {/* Metadata */}
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-semibold'>Loại:</span>{" "}
                  {Array.isArray(record.type) ? record.type[0] : record.type}
                </div>
                <div>
                  <span className='font-semibold'>Phương thức:</span>{" "}
                  <Badge variant={getMethodVariant(record.method)}>
                    {getMethodLabel(record.method)}
                  </Badge>
                </div>
                <div>
                  <span className='font-semibold'>Tạo bởi:</span>{" "}
                  {record.created_by?.username || "N/A"}
                </div>
                <div>
                  <span className='font-semibold'>Tạo lúc:</span>{" "}
                  {formatDate(record.created_at)}
                </div>
              </div>

              {/* Show note if exists (for approved/rejected records) */}
              {record.note && (
                <div className='bg-muted p-3 rounded-md'>
                  <h4 className='font-semibold mb-1 text-sm'>
                    Ghi chú từ Manager:
                  </h4>
                  <p className='text-sm text-muted-foreground'>{record.note}</p>
                </div>
              )}

              {/* Data content - show comparison for PUT, formatted display for POST/DELETE */}
              {loadingDetail ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-primary' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Đang tải chi tiết dữ liệu...
                  </span>
                </div>
              ) : isPutRequest ? (
                <div>
                  <h4 className='font-semibold mb-3'>So sánh thay đổi:</h4>
                  {loadingOriginal ? (
                    <div className='flex items-center justify-center py-8'>
                      <Loader2 className='h-6 w-6 animate-spin text-primary' />
                      <span className='ml-2 text-sm text-muted-foreground'>
                        Đang tải dữ liệu gốc...
                      </span>
                    </div>
                  ) : (
                    <DataComparison
                      originalData={originalData}
                      updatedData={detailRecord?.data || record.data}
                      moduleType={service}
                    />
                  )}
                </div>
              ) : (
                <div>
                  <h4 className='font-semibold mb-3'>Dữ liệu yêu cầu:</h4>
                  <DataDisplay
                    data={detailRecord?.data || record.data}
                    moduleType={service}
                  />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Note input and actions - only show if pending */}
          {isPending && (
            <>
              <div className='space-y-2'>
                <Label htmlFor='note'>Ghi chú (tùy chọn)</Label>
                <Textarea
                  id='note'
                  placeholder='Nhập ghi chú cho quyết định của bạn...'
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter className='gap-2'>
                <Button
                  variant='outline'
                  onClick={() => setIsOpen(false)}
                  disabled={isProcessing}
                >
                  Đóng
                </Button>
                <Button
                  variant='destructive'
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  <XCircle className='h-4 w-4 mr-2' />
                  {isProcessing ? "Đang xử lý..." : "Từ chối"}
                </Button>
                <Button
                  variant='default'
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className='bg-green-600 hover:bg-green-700'
                >
                  <CheckCircle2 className='h-4 w-4 mr-2' />
                  {isProcessing ? "Đang xử lý..." : "Phê duyệt"}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* If not pending, just show close button */}
          {!isPending && (
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsOpen(false)}
              >
                Đóng
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const createColumns = (
  onUpdateStatus: (
    id: string,
    service: string,
    status: "approved" | "rejected",
    note: string
  ) => Promise<void>
): ColumnDef<DataReviewRecord>[] => [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Loại dữ liệu'
      />
    ),
    cell: ({ row }) => {
      const type = row.getValue("type") as string[] | string;
      const displayType = Array.isArray(type) ? type[0] : type;
      return (
        <span className='font-medium'>
          {MODULE_LABELS[displayType] || displayType}
        </span>
      );
    },
    filterFn: (row, id, value) => {
      const type = row.getValue(id) as string[] | string;
      const displayType = Array.isArray(type) ? type[0] : type;
      return value.includes(displayType);
    },
  },
  {
    accessorKey: "method",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Hành động'
      />
    ),
    cell: ({ row }) => {
      const method = row.getValue("method") as string[] | string | undefined;
      return (
        <Badge variant={getMethodVariant(method as string[])}>
          {getMethodLabel(method as string[])}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const method = row.getValue(id) as string[] | string | undefined;
      const methodValue = Array.isArray(method) ? method[0] : method;
      return value.includes(methodValue);
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Trạng thái'
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string[] | string | undefined;
      const statusValue = Array.isArray(status) ? status[0] : status;
      const Icon =
        statusValue === "approved"
          ? CheckCircle2
          : statusValue === "rejected"
          ? XCircle
          : Clock;

      return (
        <div className='flex items-center gap-2'>
          <Icon className='h-4 w-4' />
          <Badge variant={getStatusColor(status as string[])}>
            {getStatusLabel(status as string[])}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const status = row.getValue(id) as string[] | string | undefined;
      const statusValue = Array.isArray(status) ? status[0] : status;
      return value.includes(statusValue);
    },
  },
  {
    accessorKey: "created_by",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Tạo bởi'
      />
    ),
    cell: ({ row }) => {
      const createdBy = row.getValue("created_by") as any;
      return <span>{createdBy?.username || "N/A"}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Ngày tạo'
      />
    ),
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return (
        <span className='text-sm text-muted-foreground'>
          {formatDate(date)}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onUpdateStatus={onUpdateStatus}
      />
    ),
  },
];
