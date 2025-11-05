"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

export type Pool = {
  _id: string;
  title: string;
  type?: string;
  dimensions?: string;
  depth?: string;
  capacity?: number;
  is_active: boolean;
};

export const columns: ColumnDef<Pool>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Tên hồ bơi'
      />
    ),
    cell: ({ row }) => {
      return <span className='font-medium'>{row.original.title}</span>;
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
];
