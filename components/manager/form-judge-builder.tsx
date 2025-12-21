"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, Settings2, GripVertical } from "lucide-react";
import { FormJudgeFieldConfig } from "./form-judge-field-config";
import { FormJudgeDependencyConfig } from "./form-judge-dependency-config";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Sortable Item Component
interface SortableItemProps {
  id: string;
  children: React.ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <div className='flex items-center gap-2'>
        <div
          {...listeners}
          className='cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded'
        >
          <GripVertical className='h-4 w-4 text-muted-foreground' />
        </div>
        <div className='flex-1'>{children}</div>
      </div>
    </div>
  );
}

// Types for FormJudge Schema
export interface FormJudgeField {
  type: "string" | "number" | "boolean" | "select" | "relation";
  required: boolean;
  is_filter: boolean;
  // For string type
  text_type?:
    | "short_text"
    | "long_text"
    | "email"
    | "url"
    | "datetime"
    | "date"
    | "time"
    | "color"
    | "html";
  min?: number;
  max?: number;
  // For number type
  is_array?: boolean;
  number_type?: "coordinates";
  min_array_lenght?: number;
  max_array_lenght?: number;
  // For select type
  select_values?: string;
  // For relation type
  entity?: string;
  relation_type?: "1-1" | "1-n" | "n-n";
  // REMOVED: query_search - not needed
  // REMOVED: dependencies - not needed
}

export interface FormJudgeSchema {
  type: "object";
  items: Array<{ name: string; field: FormJudgeField }>;
}

interface FormJudgeBuilderProps {
  value?: FormJudgeSchema;
  onChange: (schema: FormJudgeSchema) => void;
}

// Helper function to convert old schema format to new format
export function convertFormJudgeSchema(schema: any): FormJudgeSchema {
  if (!schema || typeof schema !== "object") {
    return { type: "object", items: [] };
  }

  if (Array.isArray(schema.items)) {
    // Already in new format
    return schema as FormJudgeSchema;
  }

  // Convert old format (Record) to new format (Array)
  const items: Array<{ name: string; field: FormJudgeField }> = [];
  if (schema.items && typeof schema.items === "object") {
    Object.entries(schema.items).forEach(([name, field]) => {
      items.push({ name, field: field as FormJudgeField });
    });
  }

  return {
    type: schema.type || "object",
    items,
  };
}

// Helper function to convert new schema format to old format for API
export function convertFormJudgeSchemaToAPI(schema: FormJudgeSchema): any {
  const items: Record<string, FormJudgeField> = {};
  schema.items.forEach((item) => {
    items[item.name] = item.field;
  });

  return {
    type: schema.type,
    items,
  };
}

export function FormJudgeBuilder({ value, onChange }: FormJudgeBuilderProps) {
  const [schema, setSchema] = useState<FormJudgeSchema>(
    convertFormJudgeSchema(value)
  );
  const [newFieldName, setNewFieldName] = useState("");
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null);
  const [tempFieldName, setTempFieldName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update parent when schema changes
  const updateSchema = (newSchema: FormJudgeSchema) => {
    setSchema(newSchema);
    onChange(newSchema);
  };

  // Add a new field
  const addField = () => {
    if (!newFieldName.trim()) return;
    if (schema.items.some((item) => item.name === newFieldName)) {
      alert("Tên field đã tồn tại!");
      return;
    }

    const newSchema = {
      ...schema,
      items: [
        ...schema.items,
        {
          name: newFieldName,
          field: {
            type: "string" as const,
            required: false,
            is_filter: false,
            text_type: "short_text" as const,
          },
        },
      ],
    };
    updateSchema(newSchema);
    setNewFieldName("");
  };

  // Remove a field
  const removeField = (index: number) => {
    const newItems = schema.items.filter((_, i) => i !== index);
    updateSchema({ ...schema, items: newItems });
  };

  // Update a field
  const updateField = (index: number, fieldData: FormJudgeField) => {
    const newItems = [...schema.items];
    newItems[index] = { ...newItems[index], field: fieldData };
    updateSchema({ ...schema, items: newItems });
  };

  // Start editing field name
  const startEditingField = (index: number) => {
    setEditingFieldName(index.toString());
    setTempFieldName(schema.items[index].name);
  };

  // Handle renaming a field
  const handleRenameField = (index: number, newName: string) => {
    if (!newName.trim() || newName === schema.items[index].name) {
      setEditingFieldName(null);
      return;
    }
    if (schema.items.some((item) => item.name === newName)) {
      alert("Tên field đã tồn tại!");
      return;
    }

    const newItems = [...schema.items];
    newItems[index] = { ...newItems[index], name: newName };
    updateSchema({ ...schema, items: newItems });
    setEditingFieldName(null);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = schema.items.findIndex(
        (item) => item.name === active.id
      );
      const newIndex = schema.items.findIndex((item) => item.name === over.id);

      const newItems = arrayMove(schema.items, oldIndex, newIndex);
      updateSchema({ ...schema, items: newItems });
    }
  };

  // Get all field names
  const allFieldNames = schema.items.map((item) => item.name);

  // Get Vietnamese label for field type
  const getFieldTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      string: "Văn bản",
      number: "Số",
      boolean: "Đúng/Sai",
      select: "Lựa chọn",
      relation: "Đính kèm tập tin",
    };
    return labels[type] || type;
  };

  return (
    <div className='space-y-4'>
      <div className='bg-muted/50 border rounded-lg p-4'>
        <div className='flex items-start gap-3 mb-4'>
          <div className='flex-1'>
            <h3 className='font-semibold text-lg'>
              Biểu mẫu đánh giá học viên
            </h3>
            <p className='text-sm text-muted-foreground mt-1'>
              Tạo các tiêu chí để Huấn luyện viên đánh giá học viên trong nội
              dung này. Mỗi tiêu chí sẽ hiển thị khi Huấn luyện viên thực hiện
              đánh giá.
            </p>
          </div>
        </div>

        {/* Add new field */}
        <div className='flex gap-2'>
          <Input
            placeholder='Nhập tên tiêu chí (VD: diem_so, nhan_xet, ky_nang_boi)'
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && newFieldName.trim() && addField()
            }
          />
          <Button
            onClick={addField}
            disabled={!newFieldName.trim()}
            className='whitespace-nowrap'
          >
            <Plus className='h-4 w-4 mr-2' />
            Thêm tiêu chí
          </Button>
        </div>
      </div>

      {/* List of fields */}
      {allFieldNames.length === 0 ? (
        <div className='text-center py-12 border-2 border-dashed rounded-lg bg-muted/20'>
          <p className='text-muted-foreground mb-1'>
            Chưa có tiêu chí đánh giá nào
          </p>
          <p className='text-sm text-muted-foreground'>
            Thêm tiêu chí đầu tiên bằng form bên trên
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={allFieldNames}
            strategy={verticalListSortingStrategy}
          >
            <div className='space-y-3'>
              {schema.items.map((item, index) => {
                const fieldName = item.name;
                const field = item.field;

                return (
                  <SortableItem
                    key={fieldName}
                    id={fieldName}
                  >
                    <Card className='border-2'>
                      <CardContent className='p-4'>
                        {/* Field Header */}
                        <div className='flex items-start justify-between mb-4 pb-4 border-b'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2 mb-2'>
                              {editingFieldName === index.toString() ? (
                                <Input
                                  value={tempFieldName}
                                  onChange={(e) =>
                                    setTempFieldName(e.target.value)
                                  }
                                  onBlur={() =>
                                    handleRenameField(index, tempFieldName)
                                  }
                                  onKeyPress={(e) =>
                                    e.key === "Enter" &&
                                    handleRenameField(index, tempFieldName)
                                  }
                                  autoFocus
                                  className='font-semibold text-base h-auto p-1 border rounded focus-visible:ring-1'
                                />
                              ) : (
                                <h4
                                  className='font-semibold text-base cursor-pointer'
                                  onClick={() => startEditingField(index)}
                                >
                                  {fieldName}
                                </h4>
                              )}
                              <Badge variant='outline'>
                                {getFieldTypeLabel(field.type)}
                              </Badge>
                            </div>
                            <div className='flex gap-2 flex-wrap'>
                              {field.required && (
                                <span className='text-xs text-red-600 font-medium'>
                                  • Bắt buộc điền
                                </span>
                              )}
                              {field.is_filter && (
                                <span className='text-xs text-blue-600 font-medium'>
                                  • Có thể dùng làm bộ lọc
                                </span>
                              )}
                              {!field.required && !field.is_filter && (
                                <span className='text-xs text-muted-foreground'>
                                  • Tùy chọn
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeField(index)}
                            className='text-destructive hover:text-destructive hover:bg-destructive/10'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>

                        {/* Quick Info - Always visible */}
                        <div className='space-y-2 mb-4 text-sm'>
                          {field.type === "string" && (
                            <p className='text-muted-foreground'>
                              Kiểu văn bản:{" "}
                              <span className='font-medium text-foreground'>
                                {field.text_type === "short_text" &&
                                  "Văn bản ngắn"}
                                {field.text_type === "long_text" &&
                                  "Văn bản dài"}
                                {field.text_type === "email" && "Email"}
                                {field.text_type === "url" && "Đường dẫn URL"}
                                {field.text_type === "datetime" && "Ngày giờ"}
                                {field.text_type === "date" && "Ngày tháng"}
                                {field.text_type === "time" && "Giờ"}
                                {field.text_type === "color" && "Màu sắc"}
                                {field.text_type === "html" &&
                                  "Văn bản định dạng"}
                              </span>
                              {field.min !== undefined &&
                                field.max !== undefined && (
                                  <>
                                    {" "}
                                    • Độ dài: {field.min}-{field.max} ký tự
                                  </>
                                )}
                            </p>
                          )}
                          {field.type === "number" && (
                            <p className='text-muted-foreground'>
                              {field.is_array ? (
                                <>
                                  Danh sách số{" "}
                                  {field.number_type === "coordinates" &&
                                    "(Tọa độ)"}{" "}
                                  • Giới hạn: {field.min_array_lenght || 0} -{" "}
                                  {field.max_array_lenght || 10} phần tử
                                </>
                              ) : (
                                <>
                                  Giá trị số • Khoảng: {field.min || 0} -{" "}
                                  {field.max || 100}
                                </>
                              )}
                            </p>
                          )}
                          {field.type === "boolean" && (
                            <p className='text-muted-foreground'>
                              Huấn luyện viên chọn Đúng hoặc Sai (checkbox)
                            </p>
                          )}
                          {field.type === "select" && field.select_values && (
                            <div className='text-muted-foreground'>
                              <span>Các lựa chọn: </span>
                              {field.select_values.split(",").map((opt, i) => {
                                const [label] = opt.split(":");
                                return (
                                  <Badge
                                    key={i}
                                    variant='secondary'
                                    className='ml-1 text-xs'
                                  >
                                    {label.trim()}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          {field.type === "relation" && (
                            <p className='text-muted-foreground'>
                              Đính kèm{" "}
                              {field.entity === "media"
                                ? "ảnh/video"
                                : field.entity}{" "}
                              •{" "}
                              {field.relation_type === "1-1"
                                ? "Tối đa 1 tập tin"
                                : field.relation_type === "1-n"
                                ? "Nhiều tập tin"
                                : "Nhiều-nhiều"}
                            </p>
                          )}
                        </div>

                        {/* Advanced Settings - Collapsible */}
                        <Accordion
                          type='single'
                          collapsible
                          className='border-t pt-3'
                        >
                          <AccordionItem
                            value='settings'
                            className='border-0'
                          >
                            <AccordionTrigger className='py-2 hover:no-underline'>
                              <span className='text-sm font-medium'>
                                Cài đặt chi tiết
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className='pt-4'>
                              <FormJudgeFieldConfig
                                fieldName={fieldName}
                                field={field}
                                onChange={(updatedField: FormJudgeField) =>
                                  updateField(index, updatedField)
                                }
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </SortableItem>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
