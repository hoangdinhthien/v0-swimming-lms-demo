"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { DataReviewRecord } from "@/api/manager/data-review-api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [note, setNote] = useState("");
  const record = row.original as DataReviewRecord;

  const service = Array.isArray(record.type) ? record.type[0] : record.type;
  const isPending =
    Array.isArray(record.status) && record.status[0] === "pending";

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(record._id, service, "approved", note);
      toast({
        title: "✅ Đã phê duyệt",
        description: `Đã phê duyệt yêu cầu ${service}`,
      });
      setIsOpen(false);
      setNote("");
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể phê duyệt",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onUpdateStatus(record._id, service, "rejected", note);
      toast({
        title: "✅ Đã từ chối",
        description: `Đã từ chối yêu cầu ${service}`,
      });
      setIsOpen(false);
      setNote("");
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description:
          error instanceof Error ? error.message : "Không thể từ chối",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0'
        >
          <Eye className='h-4 w-4' />
        </Button>
      </DialogTrigger>
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

            {/* Data payload */}
            <div>
              <h4 className='font-semibold mb-2'>Dữ liệu yêu cầu:</h4>
              <pre className='bg-muted p-4 rounded-md text-xs overflow-x-auto'>
                {JSON.stringify(record.data, null, 2)}
              </pre>
            </div>
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
      return <span className='font-medium'>{displayType}</span>;
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
