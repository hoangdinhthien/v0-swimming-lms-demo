"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

export type ClassItem = {
  _id: string;
  name: string;
  course: {
    title: string;
    is_active?: boolean;
  };
  instructor?: any;
  member?: string[];
  schedule?: string;
};

export const columns: ColumnDef<ClassItem>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Tên lớp'
      />
    ),
    cell: ({ row }) => {
      return <span className='font-medium'>{row.original.name}</span>;
    },
  },
  {
    accessorKey: "course.title",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Khóa học'
      />
    ),
    cell: ({ row }) => {
      return <span>{row.original.course.title}</span>;
    },
  },
  {
    accessorKey: "instructor",
    header: "Giảng viên",
    cell: ({ row }) => {
      const instructor = row.original.instructor;

      if (!instructor) {
        return (
          <span className='text-muted-foreground text-sm'>Chưa phân công</span>
        );
      }

      // Handle string (ID)
      if (typeof instructor === "string") {
        return (
          <span className='text-muted-foreground text-sm'>
            Không có thông tin
          </span>
        );
      }

      // Handle object
      if (typeof instructor === "object" && !Array.isArray(instructor)) {
        return (
          <span>
            {instructor.username || instructor.email || "Không có thông tin"}
          </span>
        );
      }

      // Handle array
      if (Array.isArray(instructor)) {
        if (instructor.length === 0) {
          return (
            <span className='text-muted-foreground text-sm'>
              Chưa phân công
            </span>
          );
        }

        const names = instructor
          .map((inst: any) => {
            if (typeof inst === "string") return null;
            if (typeof inst === "object" && inst?.username)
              return inst.username;
            if (typeof inst === "object" && inst?.email) return inst.email;
            return null;
          })
          .filter(Boolean);

        if (names.length === 0) {
          return (
            <span className='text-muted-foreground text-sm'>
              Không có thông tin
            </span>
          );
        }

        return <span>{names.join(", ")}</span>;
      }

      return (
        <span className='text-muted-foreground text-sm'>
          Không có thông tin
        </span>
      );
    },
  },
  {
    accessorKey: "member",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Sĩ số'
      />
    ),
    cell: ({ row }) => {
      const count = row.original.member?.length || 0;
      return <span className='text-sm'>{count} học viên</span>;
    },
  },
  {
    id: "status", // Use simple ID instead of nested accessor
    accessorFn: (row) => row.course.is_active ?? true, // Use accessorFn for nested data
    header: "Trạng thái",
    cell: ({ row }) => {
      const isActive = row.original.course.is_active ?? true;
      return (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={isActive ? "bg-green-500" : ""}
        >
          {isActive ? "Đang hoạt động" : "Đã kết thúc"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      const isActive = row.original.course.is_active ?? true;
      if (value === "active") return isActive === true;
      if (value === "inactive") return isActive === false;
      return true;
    },
  },
];
