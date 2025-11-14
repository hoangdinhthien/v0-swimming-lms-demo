"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export type ApplicationType = {
  _id: string;
  title: string;
  type: string[];
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
};

const getRoleBadgeVariant = (role: string) => {
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("manager") || lowerRole.includes("quản lý"))
    return "default";
  if (lowerRole.includes("staff") || lowerRole.includes("nhân viên"))
    return "secondary";
  if (lowerRole.includes("student") || lowerRole.includes("học viên"))
    return "outline";
  if (lowerRole.includes("parent") || lowerRole.includes("phụ huynh"))
    return "outline";
  return "secondary";
};

// Actions cell component - receives delete handler from parent
const ActionsCell = ({
  row,
  onDelete,
}: {
  row: any;
  onDelete: (typeId: string, typeTitle: string) => Promise<void>;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const appType = row.original as ApplicationType;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(appType._id, appType.title);

      toast({
        title: "Thành công",
        description: "Đã xóa loại đơn thành công",
      });

      // Refresh the page to update the list
      router.refresh();
    } catch (error) {
      console.error("Error deleting application type:", error);
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể xóa loại đơn. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className='flex items-center gap-2'
      onClick={(e) => e.stopPropagation()}
    >
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-8 p-0 text-destructive hover:text-destructive'
            disabled={isDeleting}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa loại đơn &quot;{appType.title}&quot;
              không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Create columns function that accepts delete handler
export const createColumns = (
  onDelete: (typeId: string, typeTitle: string) => Promise<void>
): ColumnDef<ApplicationType>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Tiêu đề'
      />
    ),
    cell: ({ row }) => {
      const title = row.getValue("title") as string;
      return <div className='font-medium max-w-[300px] truncate'>{title}</div>;
    },
  },
  {
    accessorKey: "type",
    header: "Vai trò",
    cell: ({ row }) => {
      const types = row.getValue("type") as string[];
      return (
        <div className='flex gap-1 flex-wrap'>
          {types && types.length > 0 ? (
            types.map((type, index) => (
              <Badge
                key={index}
                variant={getRoleBadgeVariant(type)}
                className='text-xs'
              >
                {type}
              </Badge>
            ))
          ) : (
            <span className='text-muted-foreground text-sm'>-</span>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const types = row.getValue(id) as string[];
      if (!types || types.length === 0) return false;
      return types.some((type) =>
        type.toLowerCase().includes(value.toLowerCase())
      );
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
      if (!date) return <span className='text-muted-foreground'>-</span>;
      try {
        return (
          <div className='text-sm'>
            {format(new Date(date), "dd/MM/yyyy", { locale: vi })}
          </div>
        );
      } catch {
        return <span className='text-muted-foreground'>-</span>;
      }
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onDelete={onDelete}
      />
    ),
  },
];

// Export default columns for backward compatibility
export const columns = createColumns(async () => {
  throw new Error("Delete handler not provided");
});
