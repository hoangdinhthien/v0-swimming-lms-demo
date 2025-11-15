"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import Link from "next/link";
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

// User object interface for created_by and updated_by fields
export interface UserObject {
  _id: string;
  username: string;
  email: string;
  phone: string;
}

export type NewsItem = {
  _id: string;
  title: string;
  content: string;
  type: string[];
  created_at: string;
  created_by: string | UserObject;
  updated_at: string;
  updated_by: string | UserObject;
  tenant_id: string;
  cover?: string | string[] | any[];
};

const getTypeBadgeVariant = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType === "public") return "default";
  if (lowerType === "manager") return "destructive";
  if (lowerType === "instructor") return "secondary";
  if (lowerType === "member") return "outline";
  return "secondary";
};

const getTypeLabel = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType === "public") return "Công khai";
  if (lowerType === "manager") return "Quản lý";
  if (lowerType === "instructor") return "HLV";
  if (lowerType === "member") return "Học viên";
  return type;
};

// Actions cell component - receives delete handler from parent
const ActionsCell = ({
  row,
  onDelete,
}: {
  row: any;
  onDelete: (newsId: string, newsTitle: string) => Promise<void>;
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const newsItem = row.original as NewsItem;

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    router.push(`/dashboard/manager/news/${newsItem._id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(newsItem._id, newsItem.title);

      toast({
        title: "Thành công",
        description: "Đã xóa thông báo thành công",
      });

      // Refresh the page to update the list
      router.refresh();
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể xóa thông báo. Vui lòng thử lại.",
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
        onClick={handleView}
        className='h-8 w-8 p-0'
      >
        <Eye className='h-4 w-4' />
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
              Bạn có chắc chắn muốn xóa thông báo &quot;{newsItem.title}&quot;
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
  onDelete: (newsId: string, newsTitle: string) => Promise<void>
): ColumnDef<NewsItem>[] => [
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
      const newsId = row.original._id;
      return (
        <div className='flex flex-col gap-1'>
          <Link 
            href={`/dashboard/manager/news/${newsId}`}
            className='font-medium hover:text-primary hover:underline transition-colors max-w-[300px] truncate block'
          >
            {title}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Đối tượng",
    cell: ({ row }) => {
      const types = row.getValue("type") as string[];
      return (
        <div className='flex gap-1 flex-wrap'>
          {types && types.length > 0 ? (
            types.map((type, index) => (
              <Badge
                key={index}
                variant={getTypeBadgeVariant(type)}
                className='text-xs'
              >
                {getTypeLabel(type)}
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
    accessorKey: "content",
    header: "Nội dung",
    cell: ({ row }) => {
      const content = row.getValue("content") as string;
      return (
        <div className='max-w-[400px] truncate text-sm text-muted-foreground'>
          {content || "-"}
        </div>
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
