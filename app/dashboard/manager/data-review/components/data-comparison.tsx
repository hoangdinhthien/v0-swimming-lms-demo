"use client";

import { Badge } from "@/components/ui/badge";
import { convertFormJudgeSchema } from "@/components/manager/form-judge-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Settings2 } from "lucide-react";

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
            Không thể tải dữ liệu gốc để so sánh. Module{" "}
            <strong>{moduleType}</strong> có thể chưa hỗ trợ xem chi tiết hoặc
            dữ liệu đã bị xóa.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Get field configurations based on module type
  const fieldConfig = getFieldConfig(moduleType);

  // Find changed fields (pass moduleType so we can ignore slug for Course)
  const changedFields = findChangedFields(
    originalData,
    updatedData,
    fieldConfig,
    moduleType
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
      { key: "slug", label: "Đường dẫn", type: "text" },
      { key: "price", label: "Giá", type: "currency" },
      { key: "session_number", label: "Số buổi học", type: "number" },
      {
        key: "session_number_duration",
        label: "Thời lượng buổi học",
        type: "text",
      },
      { key: "max_member", label: "Số học viên tối đa", type: "number" },
      { key: "detail", label: "Chi tiết nội dung", type: "course_detail" },
      {
        key: "form_judge",
        label: "Form đánh giá kỹ thuật",
        type: "form_judge",
      },
      { key: "category", label: "Danh mục", type: "array" },
      { key: "media", label: "Media", type: "array" },
      { key: "type", label: "Loại khóa học", type: "array" },
      { key: "type_of_age", label: "Đối tượng theo độ tuổi", type: "array" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
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

// Render a form_judge schema as a human-friendly UI (never raw JSON)
function renderFormJudgeUI(schema: any) {
  const normalized = convertFormJudgeSchema(schema);
  if (
    !normalized ||
    !Array.isArray(normalized.items) ||
    normalized.items.length === 0
  ) {
    return (
      <div className='bg-muted/50 p-3 rounded-md text-sm'>
        <em>Không có tiêu chí đánh giá</em>
      </div>
    );
  }

  return (
    <div className='space-y-3'>
      <div className='flex items-center gap-2 mb-2'>
        <Settings2 className='h-4 w-4 text-primary' />
        <span className='text-sm font-semibold'>
          Tiêu chí đánh giá học viên
        </span>
        <Badge
          variant='secondary'
          className='text-xs'
        >
          {normalized.items.length} tiêu chí
        </Badge>
      </div>

      <div className='space-y-2 ml-6'>
        {normalized.items.map((item: any, idx: number) => (
          <Card
            key={idx}
            className='p-3 border-l-4 border-l-primary/20'
          >
            <div className='flex items-start justify-between mb-2'>
              <div className='flex items-center gap-2 flex-1'>
                <div className='w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary'>
                  {idx + 1}
                </div>
                <span className='font-medium text-sm'>{item.name}</span>
              </div>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='text-xs'
                >
                  {getFieldTypeLabel(item.field?.type || "unknown")}
                </Badge>
                {item.field?.required && (
                  <Badge
                    variant='destructive'
                    className='text-xs'
                  >
                    Bắt buộc
                  </Badge>
                )}
                {item.field?.is_filter && (
                  <Badge
                    variant='secondary'
                    className='text-xs'
                  >
                    Bộ lọc
                  </Badge>
                )}
              </div>
            </div>

            {item.field && (
              <div className='text-xs text-muted-foreground space-y-1 mt-2'>
                {item.field.type === "string" && item.field.text_type && (
                  <div className='flex items-center gap-1'>
                    <span className='font-medium'>Kiểu nhập:</span>
                    <span>{item.field.text_type}</span>
                  </div>
                )}
                {item.field.type === "number" && (
                  <div className='flex items-center gap-1'>
                    <span className='font-medium'>Khoảng giá trị:</span>
                    <span>
                      {item.field.min ?? "Không giới hạn"} -{" "}
                      {item.field.max ?? "Không giới hạn"}
                    </span>
                  </div>
                )}
                {item.field.type === "select" && item.field.select_values && (
                  <div>
                    <div className='flex items-center gap-1 mb-1'>
                      <span className='font-medium'>Lựa chọn:</span>
                      <span>
                        {String(item.field.select_values).split(",").length} tùy
                        chọn
                      </span>
                    </div>
                    <div className='ml-4 space-y-1'>
                      {String(item.field.select_values)
                        .split(",")
                        .map((option: string, optIdx: number) => (
                          <div
                            key={optIdx}
                            className='text-xs bg-muted/50 px-2 py-1 rounded'
                          >
                            {option.trim()}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                {item.field.type === "relation" && item.field.entity && (
                  <div className='flex items-center gap-1'>
                    <span className='font-medium'>Liên kết:</span>
                    <span>
                      {item.field.entity} ({item.field.relation_type})
                    </span>
                  </div>
                )}
                {item.field.type === "boolean" && (
                  <div className='text-xs text-muted-foreground italic'>
                    Đánh giá dạng Có/Không hoặc Đạt/Không đạt
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

// Find fields that have changed
function findChangedFields(
  originalData: any,
  updatedData: any,
  fieldConfig: any[],
  moduleType?: string
) {
  const changedFields: any[] = [];

  // First, check configured fields
  fieldConfig.forEach((config) => {
    // Ignore slug for Course type
    if (config.key === "slug" && moduleType === "Course") return;
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

  // Also check for any other fields that might have changed (not in config)
  const allKeys = new Set([
    ...Object.keys(originalData || {}),
    ...Object.keys(updatedData || {}),
  ]);

  // Skip internal fields
  const skipKeys = [
    "_id",
    "tenant_id",
    "created_at",
    "created_by",
    "updated_at",
    "updated_by",
  ];

  allKeys.forEach((key) => {
    if (skipKeys.includes(key)) return;
    // Ignore slug in Course comparison
    if (key === "slug" && moduleType === "Course") return;

    // Skip if already checked in config
    if (fieldConfig.find((c) => c.key === key)) return;

    const oldValue = originalData?.[key];
    const newValue = updatedData?.[key];

    if (!isEqual(oldValue, newValue)) {
      changedFields.push({
        key: key,
        label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        type: "auto",
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
    case "course_detail":
      // Special handling for Course detail array
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className='space-y-2'>
            {value.map((item: any, i: number) => (
              <div
                key={i}
                className='bg-muted/30 p-2 rounded-md border text-xs'
              >
                <p className='font-medium mb-1'>
                  {i + 1}. {item.title || "Không có tiêu đề"}
                </p>
                {item.description && (
                  <p className='text-muted-foreground mb-1'>
                    {item.description}
                  </p>
                )}
                {item.form_judge && (
                  <div className='mt-2'>
                    <div className='text-xs font-medium text-blue-800 dark:text-blue-200 mb-1'>
                      Form đánh giá kỹ thuật:
                    </div>
                    {item.form_judge.type === "object" &&
                    Array.isArray(item.form_judge.items) ? (
                      <div className='bg-blue-50 dark:bg-blue-900/10 p-2 rounded border border-blue-200 dark:border-blue-700'>
                        <div className='space-y-1'>
                          {item.form_judge.items.map(
                            (criteria: any, idx: number) => (
                              <div
                                key={idx}
                                className='text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded'
                              >
                                <span className='font-medium'>
                                  {criteria.name}
                                </span>
                                <span className='text-muted-foreground ml-1'>
                                  (
                                  {getFieldTypeLabel(
                                    criteria.field?.type || "unknown"
                                  )}
                                  )
                                </span>
                                {criteria.field?.required && (
                                  <Badge
                                    variant='outline'
                                    className='text-xs ml-1'
                                  >
                                    Bắt buộc
                                  </Badge>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>{renderFormJudgeUI(item.form_judge)}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      return (
        <span className='text-muted-foreground italic text-sm'>
          Chưa có nội dung
        </span>
      );

    case "form_judge":
      // Special handling for form judge schema
      if (value && typeof value === "object") {
        return (
          <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-700'>
            <h4 className='font-semibold text-blue-800 dark:text-blue-200 mb-3 text-sm'>
              Biểu mẫu đánh giá kỹ thuật
            </h4>
            {value.type === "object" && Array.isArray(value.items) ? (
              <div className='space-y-2'>
                {value.items.map((item: any, index: number) => (
                  <div
                    key={index}
                    className='bg-white dark:bg-gray-800 p-3 rounded border'
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <h5 className='font-medium text-sm'>{item.name}</h5>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant='outline'
                          className='text-xs'
                        >
                          {getFieldTypeLabel(item.field?.type || "unknown")}
                        </Badge>
                        {item.field?.required && (
                          <Badge
                            variant='secondary'
                            className='text-xs'
                          >
                            Bắt buộc
                          </Badge>
                        )}
                      </div>
                    </div>
                    {item.field && (
                      <div className='text-xs text-muted-foreground space-y-1'>
                        {item.field.is_filter && (
                          <div>• Cho phép lọc/tìm kiếm</div>
                        )}
                        {item.field.type === "string" &&
                          item.field.text_type && (
                            <div>• Kiểu nhập: {item.field.text_type}</div>
                          )}
                        {item.field.type === "number" && (
                          <div>
                            • Khoảng: {item.field.min || 0} -{" "}
                            {item.field.max || "∞"}
                          </div>
                        )}
                        {item.field.type === "select" &&
                          item.field.select_values && (
                            <div>
                              • Lựa chọn:{" "}
                              {item.field.select_values.split(",").length} tùy
                              chọn
                            </div>
                          )}
                        {item.field.type === "relation" &&
                          item.field.entity && (
                            <div>• Đính kèm: {item.field.entity}</div>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div>{renderFormJudgeUI(value)}</div>
            )}
          </div>
        );
      }
      return (
        <span className='text-muted-foreground italic text-sm'>
          Không có form đánh giá
        </span>
      );

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

    case "auto":
      // Auto-detect type for unconfigured fields
      if (typeof value === "boolean") return formatValue(value, "boolean");
      if (typeof value === "number") return formatValue(value, "number");
      if (Array.isArray(value)) return formatValue(value, "array");
      if (typeof value === "object") return formatValue(value, "json");
      return formatValue(value, "text");

    case "json":
      // Format JSON objects nicely
      if (typeof value === "object") {
        return (
          <div className='bg-muted/50 p-2 rounded text-xs'>
            <pre className='overflow-x-auto whitespace-pre-wrap break-words'>
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
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

// Helper function to get Vietnamese label for field type
function getFieldTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    string: "Văn bản",
    number: "Số",
    boolean: "Đúng/Sai",
    select: "Lựa chọn",
    relation: "Đính kèm tập tin",
    unknown: "Không xác định",
  };
  return labels[type] || type;
}
