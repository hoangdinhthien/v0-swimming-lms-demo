"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

export type Course = {
  _id: string;
  title: string;
  category: { title: string }[];
  level: string;
  price?: number;
  studentCount?: number;
  is_active: boolean;
  description?: string;
};

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Tên khóa học'
      />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{row.original.title}</span>
          {row.original.description && (
            <span className='text-xs text-muted-foreground line-clamp-1'>
              {row.original.description}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "Danh mục",
    cell: ({ row }) => {
      const categories = row.original.category;
      if (!Array.isArray(categories) || categories.length === 0) {
        return (
          <span className='text-muted-foreground text-sm'>Chưa phân loại</span>
        );
      }
      return (
        <div className='flex flex-wrap gap-1'>
          {categories.map((cat: any, index: number) => (
            <Badge
              key={index}
              variant='outline'
              className='text-xs'
            >
              {cat.title || cat}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const categories = row.original.category;
      if (!Array.isArray(categories)) return false;
      return categories.some((cat: any) => {
        const title = cat.title || cat;
        return title === value;
      });
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Học phí'
      />
    ),
    cell: ({ row }) => {
      const price = row.original.price;
      if (price === undefined || price === null) {
        return <span className='text-muted-foreground'>Liên hệ</span>;
      }
      return (
        <span className='font-medium'>{price.toLocaleString("vi-VN")} VNĐ</span>
      );
    },
  },
  {
    accessorKey: "studentCount",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Học viên'
      />
    ),
    cell: ({ row }) => {
      const count = row.original.studentCount || 0;
      return <span className='text-sm'>{count} học viên</span>;
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
          {isActive ? "Đang mở" : "Đã đóng"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (value === "Active") return row.original.is_active === true;
      if (value === "Completed") return row.original.is_active === false;
      return true;
    },
  },
];
