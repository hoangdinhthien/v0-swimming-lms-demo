"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

export type NewsItem = {
  _id: string;
  title: string;
  content: string;
  type: string[];
  created_at: string;
  created_by?: string;
  updated_at?: string;
  updated_by?: string;
  tenant_id?: string;
  cover?: string | string[] | any[];
};

const getTypeBadgeVariant = (type: string) => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("announcement") || lowerType.includes("thông báo"))
    return "default";
  if (lowerType.includes("notification") || lowerType.includes("tin tức"))
    return "secondary";
  if (lowerType.includes("event") || lowerType.includes("sự kiện"))
    return "outline";
  return "secondary";
};

export const columns: ColumnDef<NewsItem>[] = [
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
      return (
        <div className='flex flex-col gap-1'>
          <div className='font-medium max-w-[300px] truncate'>{title}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Loại",
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
    accessorKey: "cover",
    header: "Ảnh bìa",
    cell: ({ row }) => {
      const cover = row.getValue("cover");
      const hasCover =
        cover &&
        ((Array.isArray(cover) && cover.length > 0) ||
          (typeof cover === "string" && cover));
      return (
        <div className='text-sm'>
          {hasCover ? (
            <Badge
              variant='outline'
              className='text-xs'
            >
              Có ảnh
            </Badge>
          ) : (
            <span className='text-muted-foreground text-xs'>Không có</span>
          )}
        </div>
      );
    },
  },
];
