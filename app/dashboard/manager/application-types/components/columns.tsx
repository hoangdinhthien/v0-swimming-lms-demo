"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

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

export const columns: ColumnDef<ApplicationType>[] = [
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
];
