"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { HighlightText } from "@/components/ui/highlight-text";
import Link from "next/link";

export type ClassItem = {
  _id: string;
  name: string;
  course: {
    title: string;
    is_active?: boolean;
    session_number?: number;
  };
  instructor?: any;
  member?: string[];
  schedule?: string;
  schedules?: any[];
};

// Create columns with search query for highlighting
export const createColumns = (
  searchQuery: string = ""
): ColumnDef<ClassItem>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Tên lớp'
      />
    ),
    cell: ({ row }) => {
      return (
        <Link
          href={`/dashboard/manager/class/${row.original._id}`}
          className='font-medium hover:text-primary hover:underline transition-colors'
        >
          <HighlightText text={row.original.name} searchQuery={searchQuery} />
        </Link>
      );
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
      return (
        <HighlightText
          text={row.original.course.title}
          searchQuery={searchQuery}
        />
      );
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
        const displayName =
          instructor.username || instructor.email || "Không có thông tin";
        return <HighlightText text={displayName} searchQuery={searchQuery} />;
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

        return (
          <HighlightText text={names.join(", ")} searchQuery={searchQuery} />
        );
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
    id: "sessions",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Buổi học đã xếp'
      />
    ),
    cell: ({ row }) => {
      const scheduledCount = row.original.schedules?.length || 0;
      const totalSessions = row.original.course.session_number || 0;

      if (totalSessions === 0) {
        return (
          <span className='text-muted-foreground text-sm'>Chưa xác định</span>
        );
      }

      const isComplete = scheduledCount >= totalSessions;
      const remaining = totalSessions - scheduledCount;

      return (
        <div className='flex flex-col'>
          <span
            className={`text-sm font-medium ${
              isComplete ? "text-green-600" : "text-orange-600"
            }`}
          >
            {scheduledCount}/{totalSessions} buổi
          </span>
          {!isComplete && remaining > 0 && (
            <span className='text-xs text-muted-foreground'>
              Còn thiếu {remaining} buổi
            </span>
          )}
          {isComplete && <span className='text-xs text-green-600'>Đã đủ</span>}
        </div>
      );
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

// Export default columns for backward compatibility
export const columns = createColumns("");
