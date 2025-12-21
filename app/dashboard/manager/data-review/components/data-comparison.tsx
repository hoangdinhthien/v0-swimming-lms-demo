"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";

interface DataComparisonProps {
  originalData: any;
  updatedData: any;
  moduleType: string;
}

/**
 * Comparison component that displays before/after data in a user-friendly format
 * Shows only fields that changed, with visual distinction
 */
export function DataComparison({
  originalData,
  updatedData,
  moduleType,
}: DataComparisonProps) {
  if (!originalData) {
    return (
      <Card className='border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'>
        <CardContent className='pt-6'>
          <p className='text-sm text-yellow-800 dark:text-yellow-200'>
            ⚠️ Không thể tải dữ liệu gốc để so sánh. Module{" "}
            <strong>{moduleType}</strong> có thể chưa hỗ trợ xem chi tiết hoặc
            dữ liệu đã bị xóa.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get field configurations based on module type
  const fieldConfig = getFieldConfig(moduleType);

  // Find changed fields
  const changedFields = findChangedFields(
    originalData,
    updatedData,
    fieldConfig
  );

  if (changedFields.length === 0) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-sm text-muted-foreground text-center'>
            Không có thay đổi nào được phát hiện
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Badge variant='outline'>{changedFields.length} thay đổi</Badge>
        <span>được phát hiện</span>
      </div>

      {changedFields.map((field, index) => (
        <Card key={index}>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>{field.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-[1fr_auto_1fr] gap-4 items-center'>
              {/* Before */}
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  Trước khi cập nhật
                </p>
                <div className='bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-3'>
                  {formatValue(field.oldValue, field.type)}
                </div>
              </div>

              {/* Arrow */}
              <ArrowRight className='h-5 w-5 text-muted-foreground flex-shrink-0' />

              {/* After */}
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  Sau khi cập nhật
                </p>
                <div className='bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md p-3'>
                  {formatValue(field.newValue, field.type)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Define field configurations for each module type
function getFieldConfig(moduleType: string) {
  const configs: Record<string, any> = {
    Pool: [
      { key: "title", label: "Tên hồ bơi", type: "text" },
      { key: "type", label: "Loại hồ", type: "text" },
      { key: "dimensions", label: "Kích thước", type: "text" },
      { key: "depth", label: "Độ sâu", type: "text" },
      { key: "capacity", label: "Sức chứa", type: "number" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
    ],
    Course: [
      { key: "title", label: "Tên khóa học", type: "text" },
      { key: "description", label: "Mô tả", type: "text" },
      { key: "price", label: "Giá", type: "currency" },
      { key: "session_number", label: "Số buổi học", type: "number" },
      { key: "max_member", label: "Số học viên tối đa", type: "number" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
      { key: "category", label: "Danh mục", type: "array" },
    ],
    User: [
      { key: "username", label: "Tên đăng nhập", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Số điện thoại", type: "text" },
      { key: "address", label: "Địa chỉ", type: "text" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
      { key: "role_front", label: "Vai trò", type: "array" },
    ],
    News: [
      { key: "title", label: "Tiêu đề", type: "text" },
      { key: "description", label: "Mô tả", type: "text" },
      { key: "content", label: "Nội dung", type: "html" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
    ],
    Class: [
      { key: "name", label: "Tên lớp", type: "text" },
      { key: "course", label: "Khóa học", type: "reference" },
      { key: "instructor", label: "Giảng viên", type: "reference" },
    ],
  };

  return configs[moduleType] || [];
}

// Find fields that have changed
function findChangedFields(
  originalData: any,
  updatedData: any,
  fieldConfig: any[]
) {
  const changedFields: any[] = [];

  fieldConfig.forEach((config) => {
    const oldValue = originalData[config.key];
    const newValue = updatedData[config.key];

    // Compare values (handle different types)
    if (!isEqual(oldValue, newValue)) {
      changedFields.push({
        key: config.key,
        label: config.label,
        type: config.type,
        oldValue,
        newValue,
      });
    }
  });

  return changedFields;
}

// Simple equality check
function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify(a.sort()) === JSON.stringify(b.sort());
  }
  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

// Format value based on type
function formatValue(value: any, type: string) {
  if (value === null || value === undefined) {
    return (
      <span className='text-muted-foreground italic'>Không có dữ liệu</span>
    );
  }

  switch (type) {
    case "boolean":
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "✓ Hoạt động" : "✗ Không hoạt động"}
        </Badge>
      );

    case "currency":
      return (
        <span className='font-medium'>
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(value)}
        </span>
      );

    case "number":
      return (
        <span className='font-medium'>{value.toLocaleString("vi-VN")}</span>
      );

    case "array":
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className='flex flex-wrap gap-1'>
            {value.map((item, i) => (
              <Badge
                key={i}
                variant='outline'
                className='text-xs'
              >
                {typeof item === "string"
                  ? item
                  : typeof item === "object" && item !== null
                  ? item.title ||
                    item.name ||
                    item.username ||
                    item._id ||
                    JSON.stringify(item)
                  : JSON.stringify(item)}
              </Badge>
            ))}
          </div>
        );
      }
      return <span className='text-muted-foreground italic'>Trống</span>;

    case "html":
      // Strip HTML tags for preview
      const textContent = value.replace(/<[^>]*>/g, "");
      const preview =
        textContent.length > 100
          ? textContent.slice(0, 100) + "..."
          : textContent;
      return <p className='text-sm'>{preview}</p>;

    case "reference":
      if (typeof value === "object" && value !== null) {
        return (
          <span className='text-sm'>
            {value.title || value.name || value.username || value._id}
          </span>
        );
      }
      return <span className='text-sm'>{String(value)}</span>;

    case "text":
    default:
      const textValue = String(value);
      if (textValue.length > 150) {
        return (
          <p className='text-sm break-words'>
            {textValue.slice(0, 150)}
            <span className='text-muted-foreground'>
              ... (còn {textValue.length - 150} ký tự)
            </span>
          </p>
        );
      }
      return <p className='text-sm break-words'>{textValue}</p>;
  }
}
