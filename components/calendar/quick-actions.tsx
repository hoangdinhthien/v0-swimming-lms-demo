"use client";

import React, { useState, useCallback } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Users,
  Clock,
  MapPin,
  Copy,
  Trash2,
  Edit3,
  Zap,
  Calendar,
  BookOpen,
} from "lucide-react";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  shortcut?: string;
  action: () => void;
}

interface QuickActionsProps {
  slotId: string;
  date: Date;
  existingClasses: any[];
  onAddClass: (classData: any) => Promise<void>;
  onBulkAction: (action: string, data: any) => Promise<void>;
}

// Mock data - in real app, fetch from APIs
const AVAILABLE_CLASSES = [
  {
    id: "1",
    name: "Bơi cơ bản A",
    course: "Bơi cơ bản",
    instructor: "Thầy Nam",
    students: 15,
  },
  {
    id: "2",
    name: "Bơi nâng cao B",
    course: "Bơi nâng cao",
    instructor: "Cô Lan",
    students: 12,
  },
  {
    id: "3",
    name: "Aerobic nước",
    course: "Aerobic",
    instructor: "Cô Mai",
    students: 20,
  },
  {
    id: "4",
    name: "Bơi trẻ em",
    course: "Bơi trẻ em",
    instructor: "Thầy Hùng",
    students: 10,
  },
];

const POOLS = [
  { id: "pool1", name: "Hồ bơi 1", capacity: 25 },
  { id: "pool2", name: "Hồ bơi 2", capacity: 30 },
  { id: "pool3", name: "Hồ bơi 3", capacity: 20 },
];

export default function QuickActions({
  slotId,
  date,
  existingClasses,
  onAddClass,
  onBulkAction,
}: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"actions" | "add-class" | "bulk-ops">(
    "actions"
  );
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedPool, setSelectedPool] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Quick actions configuration
  const quickActions: QuickAction[] = [
    {
      id: "add-class",
      label: "Thêm lớp học",
      icon: <Plus className='h-4 w-4' />,
      description: "Thêm lớp học mới vào slot này",
      shortcut: "Ctrl+N",
      action: () => setMode("add-class"),
    },
    {
      id: "copy-from",
      label: "Copy từ slot khác",
      icon: <Copy className='h-4 w-4' />,
      description: "Sao chép lớp từ slot khác",
      shortcut: "Ctrl+C",
      action: () => handleCopyFromSlot(),
    },
    {
      id: "bulk-edit",
      label: "Chỉnh sửa hàng loạt",
      icon: <Edit3 className='h-4 w-4' />,
      description: "Chỉnh sửa nhiều lớp cùng lúc",
      shortcut: "Ctrl+E",
      action: () => setMode("bulk-ops"),
    },
    {
      id: "quick-template",
      label: "Áp dụng template",
      icon: <Zap className='h-4 w-4' />,
      description: "Áp dụng template lịch có sẵn",
      action: () => handleApplyTemplate(),
    },
  ];

  const handleAddClass = useCallback(async () => {
    if (!selectedClass || !selectedPool) return;

    const classData = AVAILABLE_CLASSES.find((c) => c.id === selectedClass);
    const poolData = POOLS.find((p) => p.id === selectedPool);

    if (classData && poolData) {
      await onAddClass({
        classId: selectedClass,
        className: classData.name,
        course: classData.course,
        instructor: classData.instructor,
        poolId: selectedPool,
        poolName: poolData.name,
        slotId,
        date: date.toISOString().split("T")[0],
      });

      // Reset form
      setSelectedClass("");
      setSelectedPool("");
      setIsOpen(false);
      setMode("actions");
    }
  }, [selectedClass, selectedPool, onAddClass, slotId, date]);

  const handleCopyFromSlot = useCallback(() => {
    // This would open a slot picker
    console.log("Copy from slot functionality");
  }, []);

  const handleApplyTemplate = useCallback(() => {
    // This would show template picker
    console.log("Apply template functionality");
  }, []);

  const renderMainActions = () => (
    <div className='space-y-2'>
      <div className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
        Chọn thao tác nhanh:
      </div>
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={action.action}
          className='w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group'
        >
          <div className='flex items-center gap-3'>
            <div className='text-blue-500 group-hover:text-blue-600'>
              {action.icon}
            </div>
            <div className='flex-1'>
              <div className='font-medium'>{action.label}</div>
              {action.description && (
                <div className='text-xs text-gray-500 mt-1'>
                  {action.description}
                </div>
              )}
            </div>
            {action.shortcut && (
              <Badge
                variant='outline'
                className='text-xs'
              >
                {action.shortcut}
              </Badge>
            )}
          </div>
        </button>
      ))}
    </div>
  );

  const renderAddClass = () => (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
        <Plus className='h-4 w-4' />
        Thêm lớp học mới
      </div>

      <div className='space-y-3'>
        <div>
          <Label htmlFor='class-select'>Chọn lớp học</Label>
          <Command className='border rounded-md'>
            <CommandInput
              placeholder='Tìm kiếm lớp học...'
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList className='max-h-32'>
              <CommandEmpty>Không tìm thấy lớp học.</CommandEmpty>
              <CommandGroup>
                {AVAILABLE_CLASSES.filter(
                  (cls) =>
                    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cls.course.toLowerCase().includes(searchTerm.toLowerCase())
                ).map((cls) => (
                  <CommandItem
                    key={cls.id}
                    onSelect={() => setSelectedClass(cls.id)}
                    className={
                      selectedClass === cls.id
                        ? "bg-blue-100 dark:bg-blue-900"
                        : ""
                    }
                  >
                    <div className='flex items-center gap-2 w-full'>
                      <BookOpen className='h-4 w-4 text-blue-500' />
                      <div className='flex-1'>
                        <div className='font-medium'>{cls.name}</div>
                        <div className='text-xs text-gray-500'>
                          {cls.course} • {cls.instructor} • {cls.students} học
                          viên
                        </div>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>

        <div>
          <Label htmlFor='pool-select'>Chọn hồ bơi</Label>
          <Select
            value={selectedPool}
            onValueChange={setSelectedPool}
          >
            <SelectTrigger>
              <SelectValue placeholder='Chọn hồ bơi...' />
            </SelectTrigger>
            <SelectContent>
              {POOLS.map((pool) => (
                <SelectItem
                  key={pool.id}
                  value={pool.id}
                >
                  <div className='flex items-center gap-2'>
                    <MapPin className='h-4 w-4 text-green-500' />
                    {pool.name} (Sức chứa: {pool.capacity})
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex items-center justify-between pt-2'>
          <Button
            variant='outline'
            onClick={() => setMode("actions")}
          >
            Quay lại
          </Button>
          <Button
            onClick={handleAddClass}
            disabled={!selectedClass || !selectedPool}
            className='bg-green-500 hover:bg-green-600'
          >
            <Plus className='h-4 w-4 mr-2' />
            Thêm lớp
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBulkOps = () => (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
        <Edit3 className='h-4 w-4' />
        Thao tác hàng loạt
      </div>

      <div className='space-y-3'>
        <div className='p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20'>
          <div className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
            Đã chọn: {existingClasses.length} lớp học
          </div>
          <div className='text-xs text-yellow-600 dark:text-yellow-300 mt-1'>
            Các thao tác sẽ áp dụng cho tất cả lớp đã chọn
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button
            variant='outline'
            onClick={() => onBulkAction("move", { targetSlot: "next" })}
          >
            <Calendar className='h-4 w-4 mr-2' />
            Chuyển slot
          </Button>

          <Button
            variant='outline'
            onClick={() => onBulkAction("duplicate", {})}
          >
            <Copy className='h-4 w-4 mr-2' />
            Nhân bản
          </Button>

          <Button
            variant='outline'
            onClick={() => onBulkAction("reschedule", {})}
          >
            <Clock className='h-4 w-4 mr-2' />
            Đổi giờ
          </Button>

          <Button
            variant='destructive'
            onClick={() => onBulkAction("delete", {})}
          >
            <Trash2 className='h-4 w-4 mr-2' />
            Xóa tất cả
          </Button>
        </div>

        <Button
          variant='outline'
          onClick={() => setMode("actions")}
          className='w-full'
        >
          Quay lại
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='w-full'
        >
          <Zap className='h-4 w-4 mr-2' />
          Quick Actions
        </Button>
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            Thao tác nhanh - Slot {format(date, "dd/MM/yyyy")}
          </DialogTitle>
        </DialogHeader>

        <div className='py-4'>
          {mode === "actions" && renderMainActions()}
          {mode === "add-class" && renderAddClass()}
          {mode === "bulk-ops" && renderBulkOps()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
