"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export type Application = {
  _id: string;
  title: string;
  content?: string;
  type?: any;
  status?: string[];
  created_at: string;
  updated_at?: string;
  created_by?: {
    _id: string;
    email?: string;
    username: string;
    phone?: string;
    role_front?: string[];
    featured_image?: string | string[];
  };
  tenant_id?: string;
  reply?: string;
  reply_content?: string;
};

const getStatusBadgeVariant = (status: string) => {
  const lowerStatus = status.toLowerCase();
  if (lowerStatus.includes("pending") || lowerStatus.includes("chờ"))
    return "secondary";
  if (
    lowerStatus.includes("approved") ||
    lowerStatus.includes("đồng ý") ||
    lowerStatus.includes("duyệt")
  )
    return "default";
  if (lowerStatus.includes("rejected") || lowerStatus.includes("từ chối"))
    return "destructive";
  return "outline";
};

const getTypeLabel = (type: any): string => {
  if (!type) return "-";

  // If type is an object with title field
  if (typeof type === "object" && type.title) {
    return type.title;
  }

  // If type is an array, join with comma
  if (Array.isArray(type)) {
    return type.join(", ");
  }

  // If type is a string
  if (typeof type === "string") {
    return type;
  }

  return "-";
};

export const columns: ColumnDef<Application>[] = [
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
      const applicationId = row.original._id;
      return (
        <Link
          href={`/dashboard/manager/applications/${applicationId}`}
          className='font-medium hover:text-primary hover:underline transition-colors max-w-[250px] truncate block'
        >
          {title}
        </Link>
      );
    },
  },
  {
    accessorKey: "created_by",
    header: "Người tạo",
    cell: ({ row }) => {
      const createdBy = row.getValue("created_by") as Application["created_by"];
      if (!createdBy) {
        return <span className='text-muted-foreground'>-</span>;
      }

      const imageUrl =
        createdBy.featured_image &&
        Array.isArray(createdBy.featured_image) &&
        createdBy.featured_image.length > 0
          ? createdBy.featured_image[0]
          : typeof createdBy.featured_image === "string"
          ? createdBy.featured_image
          : "";

      return (
        <div className='flex items-center gap-2'>
          <Avatar className='h-8 w-8'>
            {imageUrl && (
              <AvatarImage
                src={imageUrl}
                alt={createdBy.username}
              />
            )}
            <AvatarFallback>
              {createdBy.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='text-sm font-medium'>{createdBy.username}</span>
            {createdBy.email && (
              <span className='text-xs text-muted-foreground'>
                {createdBy.email}
              </span>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const statuses = row.getValue("status") as string[];
      return (
        <div className='flex gap-1 flex-wrap'>
          {statuses && statuses.length > 0 ? (
            statuses.map((status, index) => (
              <Badge
                key={index}
                variant={getStatusBadgeVariant(status)}
                className='text-xs'
              >
                {status}
              </Badge>
            ))
          ) : (
            <Badge
              variant='secondary'
              className='text-xs'
            >
              Chờ xử lý
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const statuses = row.getValue(id) as string[];
      if (!statuses || statuses.length === 0) return value === "pending";
      return statuses.some((status) =>
        status.toLowerCase().includes(value.toLowerCase())
      );
    },
  },
  {
    accessorKey: "type",
    header: "Loại",
    cell: ({ row }) => {
      const type = row.getValue("type");
      const typeLabel = getTypeLabel(type);

      return (
        <div className='max-w-[200px] truncate'>
          {typeLabel !== "-" ? (
            <Badge
              variant='outline'
              className='text-xs'
            >
              {typeLabel}
            </Badge>
          ) : (
            <span className='text-muted-foreground text-sm'>-</span>
          )}
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
];
