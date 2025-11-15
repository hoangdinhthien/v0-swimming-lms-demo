"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Users, Baby } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import Link from "next/link";

// Helper function to calculate age from birthday
function calculateAge(birthdayStr: string | null | undefined): number | null {
  if (!birthdayStr) return null;

  try {
    const birthday = new Date(birthdayStr);
    if (isNaN(birthday.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const monthDiff = today.getMonth() - birthday.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthday.getDate())
    ) {
      age--;
    }
    return age;
  } catch (error) {
    console.error("Error calculating age:", error);
    return null;
  }
}

// Helper function to get user initials
function getUserInitials(username: string) {
  return username
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export type Student = {
  _id: string;
  user?: {
    _id: string;
    username: string;
    email: string;
    birthday?: string;
    is_active: boolean;
    featured_image?: any;
  };
  avatar: string;
  parentName: string | null;
};

export const columns: ColumnDef<Student>[] = [
  {
    accessorKey: "username",
    id: "username",
    accessorFn: (row) => row.user?.username || "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Học viên" />
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      const avatar = row.original.avatar;
      
      if (!user) return null;
      
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
            <AvatarImage
              src={avatar}
              alt={user.username || "avatar"}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
              {user.username ? getUserInitials(user.username) : "ST"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Link 
              href={`/dashboard/manager/students/${row.original._id}`}
              className="font-medium text-foreground truncate hover:text-primary hover:underline transition-colors block"
            >
              {user.username}
            </Link>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "age",
    id: "age",
    accessorFn: (row) => calculateAge(row.user?.birthday) ?? -1,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tuổi" />
    ),
    cell: ({ row }) => {
      const age = calculateAge(row.original.user?.birthday);
      
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground">
            {age !== null ? age : "-"}
          </span>
          {age !== null && (
            <span className="text-xs text-muted-foreground">tuổi</span>
          )}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "courses",
    id: "courses",
    header: "Khoá học đã đăng ký",
    cell: () => {
      return <span className="text-muted-foreground">-</span>;
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "status",
    id: "status",
    accessorFn: (row) => (row.user?.is_active ? "active" : "inactive"),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Trạng thái" />
    ),
    cell: ({ row }) => {
      const isActive = row.original.user?.is_active;
      
      return (
        <Badge
          variant="outline"
          className={`transition-all duration-200 ${
            isActive
              ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
              : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800"
          }`}
        >
          {isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "parentName",
    id: "parentName",
    accessorFn: (row) => row.parentName || "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phụ Huynh" />
    ),
    cell: ({ row }) => {
      const parentName = row.original.parentName;
      
      return parentName ? (
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3 text-blue-600" />
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
            {parentName}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground italic">Không có</span>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
];
