"use client";

import { Badge } from "@/components/ui/badge";
import { convertFormJudgeSchema } from "@/components/manager/form-judge-builder";
import { Card, CardContent } from "@/components/ui/card";

interface DataDisplayProps {
  data: any;
  moduleType: string;
}

interface FieldConfig {
  key: string;
  label: string;
  type: string;
}

/**
 * Component to display data in a user-friendly format (not JSON)
 * Used for POST and DELETE requests
 */
export function DataDisplay({ data, moduleType }: DataDisplayProps) {
  if (!data || typeof data !== "object") {
    return (
      <Card>
        <CardContent className='pt-6'>
          <p className='text-sm text-muted-foreground'>Không có dữ liệu</p>
        </CardContent>
      </Card>
    );
  }

  // Get field configurations based on module type
  const fieldConfig = getFieldConfig(moduleType);

  // Collect all fields to display
  const fieldsToShow: Array<{ label: string; value: any; type: string }> = [];

  // Add configured fields
  fieldConfig.forEach((config: FieldConfig) => {
    const value = data[config.key];
    if (value !== undefined && value !== null) {
      fieldsToShow.push({
        label: config.label,
        value: value,
        type: config.type,
      });
    }
  });

  // Add extra fields that aren't in config
  Object.keys(data).forEach((key) => {
    // Skip if already shown or if it's internal field
    if (
      fieldConfig.find((c: FieldConfig) => c.key === key) ||
      [
        "_id",
        "tenant_id",
        "created_at",
        "created_by",
        "updated_at",
        "updated_by",
      ].includes(key)
    ) {
      return;
    }

    const value = data[key];
    if (value !== undefined && value !== null) {
      fieldsToShow.push({
        label: key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: value,
        type: "auto",
      });
    }
  });

  return (
    <Card>
      <CardContent className='pt-4 pb-4'>
        <div className='grid grid-cols-1 gap-4'>
          {fieldsToShow.map((field, index) => (
            <div
              key={index}
              className='grid grid-cols-[140px_1fr] gap-4 items-start'
            >
              <p className='text-sm font-semibold text-muted-foreground'>
                {field.label}:
              </p>
              <div>{formatValue(field.value, field.type, moduleType)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Define field configurations for each module type
function getFieldConfig(moduleType: string): FieldConfig[] {
  const configs: Record<string, FieldConfig[]> = {
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
      { key: "max_member", label: "Số học viên tối đa", type: "number" },
      { key: "detail", label: "Chi tiết nội dung", type: "course_detail" },
      {
        key: "form_judge",
        label: "Form đánh giá kỹ thuật",
        type: "form_judge",
      },
      { key: "category", label: "Danh mục", type: "array" },
      { key: "media", label: "Media", type: "array" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
    ],
    User: [
      { key: "username", label: "Tên đăng nhập", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Số điện thoại", type: "text" },
      { key: "address", label: "Địa chỉ", type: "text" },
      { key: "birthday", label: "Ngày sinh", type: "date" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
      { key: "role_front", label: "Vai trò", type: "array" },
      { key: "featured_image", label: "Ảnh đại diện", type: "array" },
    ],
    News: [
      { key: "title", label: "Tiêu đề", type: "text" },
      { key: "description", label: "Mô tả ngắn", type: "text" },
      { key: "content", label: "Nội dung", type: "html" },
      { key: "slug", label: "Đường dẫn", type: "text" },
      { key: "featured_image", label: "Ảnh đại diện", type: "array" },
      { key: "is_active", label: "Trạng thái hoạt động", type: "boolean" },
    ],
    Class: [
      { key: "name", label: "Tên lớp", type: "text" },
      { key: "course", label: "Khóa học", type: "reference" },
      { key: "instructor", label: "Giảng viên", type: "reference" },
      { key: "member", label: "Học viên", type: "array" },
    ],
    Schedule: [
      { key: "date", label: "Ngày học", type: "date" },
      { key: "day_of_week", label: "Thứ", type: "number" },
      { key: "slot", label: "Khung giờ", type: "array" },
      { key: "classroom", label: "Lớp học", type: "array" },
      { key: "course", label: "Khóa học", type: "array" },
    ],
    Order: [
      { key: "student", label: "Học viên", type: "reference" },
      { key: "course", label: "Khóa học", type: "reference" },
      { key: "amount", label: "Số tiền", type: "currency" },
      { key: "status", label: "Trạng thái", type: "text" },
      { key: "payment_method", label: "Phương thức thanh toán", type: "text" },
    ],
    Application: [
      { key: "student", label: "Học viên", type: "reference" },
      { key: "type", label: "Loại đơn", type: "text" },
      { key: "reason", label: "Lý do", type: "text" },
      { key: "status", label: "Trạng thái", type: "text" },
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
    <div className='space-y-2'>
      {normalized.items.map((item: any, idx: number) => (
        <div
          key={idx}
          className='bg-white dark:bg-gray-800 p-2 rounded border'
        >
          <div className='flex items-center justify-between mb-1'>
            <span className='font-medium text-sm'>{item.name}</span>
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
              {item.field.is_filter && <div>• Cho phép lọc/tìm kiếm</div>}
              {item.field.type === "string" && item.field.text_type && (
                <div>• Kiểu nhập: {item.field.text_type}</div>
              )}
              {item.field.type === "number" && (
                <div>
                  • Khoảng: {item.field.min ?? 0} - {item.field.max ?? "∞"}
                </div>
              )}
              {item.field.type === "select" && item.field.select_values && (
                <div>
                  • Lựa chọn:{" "}
                  {String(item.field.select_values).split(",").length} tùy chọn
                </div>
              )}
              {item.field.type === "relation" && item.field.entity && (
                <div>• Đính kèm: {item.field.entity}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Format value based on type
function formatValue(value: any, type: string, moduleType?: string) {
  if (value === null || value === undefined) {
    return (
      <span className='text-muted-foreground italic text-sm'>
        Không có dữ liệu
      </span>
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
                className='bg-muted/30 p-3 rounded-md border'
              >
                <p className='font-medium text-sm mb-1'>
                  {i + 1}. {item.title || "Không có tiêu đề"}
                </p>
                {item.description && (
                  <p className='text-xs text-muted-foreground mb-2'>
                    {item.description}
                  </p>
                )}
                {item.form_judge && (
                  <div className='mt-2'>
                    <div className='text-xs font-medium text-blue-800 dark:text-blue-200 mb-2'>
                      Form đánh giá kỹ thuật:
                    </div>
                    {item.form_judge.type === "object" &&
                    Array.isArray(item.form_judge.items) ? (
                      <div className='bg-blue-50 dark:bg-blue-900/10 p-3 rounded border border-blue-200 dark:border-blue-700'>
                        <div className='space-y-2'>
                          {item.form_judge.items.map(
                            (criteria: any, idx: number) => (
                              <div
                                key={idx}
                                className='bg-white dark:bg-gray-800 p-2 rounded border'
                              >
                                <div className='flex items-center justify-between mb-1'>
                                  <span className='font-medium text-sm'>
                                    {criteria.name}
                                  </span>
                                  <div className='flex items-center gap-2'>
                                    <Badge
                                      variant='outline'
                                      className='text-xs'
                                    >
                                      {getFieldTypeLabel(
                                        criteria.field?.type || "unknown"
                                      )}
                                    </Badge>
                                    {criteria.field?.required && (
                                      <Badge
                                        variant='secondary'
                                        className='text-xs'
                                      >
                                        Bắt buộc
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {criteria.field && (
                                  <div className='text-xs text-muted-foreground space-y-1'>
                                    {criteria.field.is_filter && (
                                      <div>• Cho phép lọc/tìm kiếm</div>
                                    )}
                                    {criteria.field.type === "string" &&
                                      criteria.field.text_type && (
                                        <div>
                                          • Kiểu nhập:{" "}
                                          {criteria.field.text_type}
                                        </div>
                                      )}
                                    {criteria.field.type === "number" && (
                                      <div>
                                        • Khoảng: {criteria.field.min || 0} -{" "}
                                        {criteria.field.max || "∞"}
                                      </div>
                                    )}
                                    {criteria.field.type === "select" &&
                                      criteria.field.select_values && (
                                        <div>
                                          • Lựa chọn:{" "}
                                          {
                                            criteria.field.select_values.split(
                                              ","
                                            ).length
                                          }{" "}
                                          tùy chọn
                                        </div>
                                      )}
                                    {criteria.field.type === "relation" &&
                                      criteria.field.entity && (
                                        <div>
                                          • Đính kèm: {criteria.field.entity}
                                        </div>
                                      )}
                                  </div>
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
          <div className='bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700'>
            <h4 className='font-semibold text-blue-800 dark:text-blue-200 mb-3'>
              Biểu mẫu đánh giá kỹ thuật
            </h4>
            {value.type === "object" && Array.isArray(value.items) ? (
              <div className='space-y-3'>
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
    case "boolean":
      return (
        <Badge
          variant={value ? "default" : "secondary"}
          className='w-fit'
        >
          {value ? "✓ Hoạt động" : "✗ Không hoạt động"}
        </Badge>
      );

    case "currency":
      return (
        <span className='font-medium text-base'>
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(value)}
        </span>
      );

    case "number":
      return (
        <span className='font-medium text-base'>
          {value.toLocaleString("vi-VN")}
        </span>
      );

    case "date":
      try {
        const date = new Date(value);
        return (
          <span className='text-sm'>
            {date.toLocaleDateString("vi-VN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        );
      } catch {
        return <span className='text-sm'>{String(value)}</span>;
      }

    case "array":
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className='flex flex-wrap gap-1.5'>
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
      return (
        <span className='text-muted-foreground italic text-sm'>Trống</span>
      );

    case "html":
      // Strip HTML tags for preview
      const textContent = value.replace(/<[^>]*>/g, "");
      const preview =
        textContent.length > 200
          ? textContent.slice(0, 200) + "..."
          : textContent;
      return (
        <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
          {preview}
        </p>
      );

    case "json":
      // Format JSON objects nicely
      if (typeof value === "object") {
        return (
          <div className='bg-muted/50 p-3 rounded-md'>
            <pre className='text-xs overflow-x-auto whitespace-pre-wrap break-words'>
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        );
      }
      return <span className='text-sm'>{String(value)}</span>;

    case "reference":
      if (typeof value === "object" && value !== null) {
        return (
          <span className='text-sm font-medium'>
            {value.title || value.name || value.username || value._id || "N/A"}
          </span>
        );
      }
      return <span className='text-sm'>{String(value)}</span>;

    case "auto":
      // Auto-detect type
      if (typeof value === "boolean")
        return formatValue(value, "boolean", moduleType);
      if (typeof value === "number")
        return formatValue(value, "number", moduleType);
      if (Array.isArray(value)) return formatValue(value, "array", moduleType);
      if (typeof value === "object")
        return formatValue(value, "json", moduleType);
      return formatValue(value, "text", moduleType);

    case "text":
    default:
      const textValue = String(value);
      return (
        <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>
          {textValue}
        </p>
      );
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
