"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Trash2, Pencil } from "lucide-react";
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

export type Pool = {
  _id: string;
  title: string;
  type?: string;
  dimensions?: string;
  depth?: string;
  capacity?: number;
  is_active: boolean;
};

// Actions cell component - receives delete and edit handlers from parent
const ActionsCell = ({
  row,
  onDelete,
  onEdit,
}: {
  row: any;
  onDelete: (poolId: string, poolTitle: string) => Promise<void>;
  onEdit: (pool: Pool) => void;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const pool = row.original as Pool;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(pool._id, pool.title);

      toast({
        title: "Thành công",
        description: "Đã xóa hồ bơi thành công",
      });

      // Refresh the page to update the list
      router.refresh();
    } catch (error) {
      console.error("Error deleting pool:", error);
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể xóa hồ bơi. Vui lòng thử lại.",
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
      <Button
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0 text-primary hover:text-primary'
        onClick={() => onEdit(pool)}
      >
        <Pencil className='h-4 w-4' />
      </Button>
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
              Bạn có chắc chắn muốn xóa hồ bơi &quot;{pool.title}&quot; không?
              Hành động này không thể hoàn tác.
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

// Create columns function that accepts delete and edit handlers
export const createColumns = (
  onDelete: (poolId: string, poolTitle: string) => Promise<void>,
  onEdit: (pool: Pool) => void
): ColumnDef<Pool>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Tên hồ bơi'
      />
    ),
    cell: ({ row }) => {
      return <div className='font-medium'>{row.original.title}</div>;
    },
  },
  {
    accessorKey: "type",
    header: "Loại hồ",
    cell: ({ row }) => {
      const type = row.original.type;
      return type ? (
        <span>{type}</span>
      ) : (
        <span className='text-muted-foreground text-sm'>-</span>
      );
    },
  },
  {
    accessorKey: "dimensions",
    header: "Kích thước",
    cell: ({ row }) => {
      const dimensions = row.original.dimensions;
      return dimensions ? (
        <span>{dimensions}</span>
      ) : (
        <span className='text-muted-foreground text-sm'>-</span>
      );
    },
  },
  {
    accessorKey: "depth",
    header: "Độ sâu",
    cell: ({ row }) => {
      const depth = row.original.depth;
      return depth ? (
        <span>{depth}</span>
      ) : (
        <span className='text-muted-foreground text-sm'>-</span>
      );
    },
  },
  {
    accessorKey: "capacity",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Sức chứa'
      />
    ),
    cell: ({ row }) => {
      const capacity = row.original.capacity;
      return capacity ? (
        <span>{capacity} người</span>
      ) : (
        <span className='text-muted-foreground text-sm'>-</span>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Trạng thái",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={isActive ? "bg-green-500" : ""}
        >
          {isActive ? "Hoạt động" : "Ngưng hoạt động"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (value === "active") return row.original.is_active === true;
      if (value === "inactive") return row.original.is_active === false;
      return true;
    },
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => (
      <ActionsCell
        row={row}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    ),
  },
];

// Export default columns for backward compatibility
export const columns = createColumns(
  async () => {
    throw new Error("Delete handler not provided");
  },
  () => {
    throw new Error("Edit handler not provided");
  }
);
