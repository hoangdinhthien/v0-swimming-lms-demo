"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Calendar, Settings } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import Link from "next/link";
import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import StaffPermissionModal to avoid SSR issues
const StaffPermissionModal = dynamic(
  () => import("@/components/manager/staff-permission-modal"),
  { ssr: false }
);

// Helper function to get user initials
function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

export type Staff = {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string[];
  status: string;
  joinDate: string;
  avatar: string;
  userId?: string;
  staffId?: string;
};

export const columns: ColumnDef<Staff>[] = [
  {
    accessorKey: "name",
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Nhân viên'
      />
    ),
    cell: ({ row }) => {
      const staff = row.original;

      return (
        <div className='flex items-center gap-3'>
          <Avatar className='h-10 w-10 border-2 border-primary/10 shadow-sm'>
            <AvatarImage
              src={staff.avatar}
              alt={staff.name}
              className='object-cover'
            />
            <AvatarFallback className='bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm'>
              {getUserInitials(staff.name)}
            </AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <Link
              href={`/dashboard/manager/staff/${staff.id}`}
              className='font-medium text-foreground truncate hover:text-primary hover:underline transition-colors block'
            >
              {staff.name}
            </Link>
            <div className='flex items-center gap-1 text-xs text-muted-foreground mt-1'>
              <Mail className='h-3 w-3' />
              <span className='truncate'>{staff.email}</span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
  },
  {
    accessorKey: "phone",
    id: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Số điện thoại'
      />
    ),
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string;
      return (
        <div className='flex items-center gap-2'>
          <Phone className='h-4 w-4 text-muted-foreground' />
          <span>{phone || "-"}</span>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "department",
    id: "department",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Bộ phận'
      />
    ),
    cell: ({ row }) => {
      const department = row.getValue("department") as string[];

      if (!department || department.length === 0) {
        return <span className='text-muted-foreground'>-</span>;
      }

      return (
        <div className='flex flex-wrap gap-1'>
          {department.slice(0, 2).map((dept, index) => (
            <Badge
              key={index}
              variant='outline'
              className='text-xs'
            >
              {dept}
            </Badge>
          ))}
          {department.length > 2 && (
            <Badge
              variant='secondary'
              className='text-xs'
            >
              +{department.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const department = row.getValue(id) as string[];
      return value.some((v: string) => department.includes(v));
    },
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "status",
    id: "status",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Trạng thái'
      />
    ),
    cell: ({ row }) => {
      const status = row.getValue("status") as string;

      return (
        <Badge
          variant={status === "Active" ? "default" : "secondary"}
          className='font-medium'
        >
          {status === "Active" ? "Hoạt động" : "Ngừng"}
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
    accessorKey: "joinDate",
    id: "joinDate",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title='Ngày tham gia'
      />
    ),
    cell: ({ row }) => {
      const joinDate = row.getValue("joinDate") as string;
      return (
        <div className='flex items-center gap-2 text-sm'>
          <Calendar className='h-4 w-4 text-muted-foreground' />
          <span>{joinDate}</span>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "actions",
    header: "Thao tác",
    cell: ({ row }) => {
      const staff = row.original;
      const [isModalOpen, setIsModalOpen] = useState(false);

      return (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="h-8 w-8 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <StaffPermissionModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            staffData={{
              _id: staff.userId || staff.staffId || staff.id,
              user: {
                username: staff.name,
                email: staff.email,
              },
            }}
            onSuccess={() => {
              setIsModalOpen(false);
            }}
          />
        </>
      );
    },
  },
];
