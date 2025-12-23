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
import { Separator } from "@/components/ui/separator";
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
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2">
        <div
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}

// Types for FormJudge Schema
export interface FormJudgeField {
  type: "string" | "number" | "boolean" | "select" | "relation";
  required: boolean;
  is_filter: boolean;
  stt?: number;
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
    // Already in new format, but ensure sorting by stt
    return {
      ...schema,
      items: [...schema.items].sort(
        (a, b) => (a.field?.stt || 0) - (b.field?.stt || 0)
      ),
    } as FormJudgeSchema;
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
    items: items.sort((a, b) => (a.field.stt || 0) - (b.field.stt || 0)),
  };
}

// Helper function to convert new schema format to old format for API
export function convertFormJudgeSchemaToAPI(schema: FormJudgeSchema): any {
  const items: Record<string, FormJudgeField> = {};
  schema.items.forEach((item, index) => {
    items[item.name] = { ...item.field, stt: index };
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
  const [newField, setNewField] = useState<FormJudgeField["type"]>("string");
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
            type: newField,
            required: false,
            is_filter: false,
            text_type:
              newField === "string" ? ("short_text" as const) : undefined,
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
      select: "Lựa chọn từ danh sách",
      relation: "Đính kèm tập tin",
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 border rounded-lg p-4">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              Biểu mẫu đánh giá học viên
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo các tiêu chí để Huấn luyện viên đánh giá học viên trong nội
              dung này. Mỗi tiêu chí sẽ hiển thị khi Huấn luyện viên thực hiện
              đánh giá.
            </p>
          </div>
        </div>

        {/* Add new field */}
        <div className="flex gap-2">
          <Input
            placeholder="Nhập tên tiêu chí (VD: diem_so, nhan_xet, ky_nang_boi)"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && newFieldName.trim() && addField()
            }
          />
          <Select
            value={newField}
            onValueChange={(value: FormJudgeField["type"]) =>
              setNewField(value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">Văn bản</SelectItem>
              <SelectItem value="number">Số</SelectItem>
              <SelectItem value="boolean">Đúng/Sai</SelectItem>
              <SelectItem value="select">Lựa chọn từ danh sách</SelectItem>
              <SelectItem value="relation">Đính kèm tập tin</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={addField}
            disabled={!newFieldName.trim()}
            className="whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm tiêu chí
          </Button>
        </div>
      </div>

      {/* List of fields */}
      {allFieldNames.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-1">
            Chưa có tiêu chí đánh giá nào
          </p>
          <p className="text-sm text-muted-foreground">
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
            <div className="space-y-2">
              {schema.items.map((item, index) => {
                const fieldName = item.name;
                const field = item.field;

                return (
                  <SortableItem key={fieldName} id={fieldName}>
                    <Card className="border shadow-sm hover:border-primary/30 transition-colors">
                      <CardContent className="p-0">
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="settings" className="border-0">
                            <div className="p-3">
                              <div className="flex items-center gap-3">
                                {/* Left Content */}
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {/* STT Label */}
                                  <div className="w-8 h-7 flex items-center justify-center text-xs font-bold bg-muted/50 rounded shrink-0">
                                    {index + 1}
                                  </div>

                                  {/* Name & metadata */}
                                  <div className="flex-1 min-w-0 flex items-center gap-2">
                                    {editingFieldName === index.toString() ? (
                                      <Input
                                        value={tempFieldName}
                                        onChange={(e) =>
                                          setTempFieldName(e.target.value)
                                        }
                                        onBlur={() =>
                                          handleRenameField(
                                            index,
                                            tempFieldName
                                          )
                                        }
                                        onKeyPress={(e) =>
                                          e.key === "Enter" &&
                                          handleRenameField(
                                            index,
                                            tempFieldName
                                          )
                                        }
                                        autoFocus
                                        className="h-7 text-sm font-medium py-0 px-2 flex-1"
                                      />
                                    ) : (
                                      <h4
                                        className="text-sm font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => startEditingField(index)}
                                      >
                                        {fieldName}
                                      </h4>
                                    )}

                                    {/* Status Badges - Compact */}
                                    <div className="flex gap-1 shrink-0">
                                      {field.required && (
                                        <Badge
                                          className="h-5 px-1.5 text-[10px] bg-red-50 text-red-600 border-red-100 dark:bg-red-950/30 dark:text-red-400"
                                          variant="outline"
                                        >
                                          Yêu cầu
                                        </Badge>
                                      )}
                                      {field.is_filter && (
                                        <Badge
                                          className="h-5 px-1.5 text-[10px] bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/30 dark:text-blue-400"
                                          variant="outline"
                                        >
                                          Bộ lọc
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Right: Type Badge & Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge
                                    variant="secondary"
                                    className="h-6 text-[10px] font-medium whitespace-nowrap bg-primary/5 text-primary border-primary/10"
                                  >
                                    {getFieldTypeLabel(field.type)}
                                  </Badge>

                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeField(index)}
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>

                                  <AccordionTrigger className="p-0 h-7 w-7 flex items-center justify-center hover:bg-muted rounded transition-transform [&[data-state=open]>svg]:rotate-180">
                                    {/* Chevron is handled by AccordionTrigger */}
                                  </AccordionTrigger>
                                </div>
                              </div>
                            </div>

                            <AccordionContent className="px-3 pb-3 pt-0">
                              <div className="space-y-3 bg-muted/20 p-3 rounded-md border border-dashed">
                                {/* Type specific info in compact grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground border-b border-white/10 pb-2 mb-2">
                                  {field.type === "string" && (
                                    <div className="flex gap-1.5 items-center">
                                      <span className="shrink-0">Loại:</span>
                                      <Badge
                                        variant="secondary"
                                        className="h-5 text-[10px] bg-background"
                                      >
                                        {field.text_type === "short_text" &&
                                          "Văn bản ngắn"}
                                        {field.text_type === "long_text" &&
                                          "Văn bản dài"}
                                        {field.text_type === "email" && "Email"}
                                        {field.text_type === "url" &&
                                          "Đường dẫn"}
                                        {field.text_type === "datetime" &&
                                          "Ngày giờ"}
                                        {field.text_type === "date" &&
                                          "Ngày tháng"}
                                        {field.text_type === "time" && "Giờ"}
                                        {field.text_type === "color" &&
                                          "Màu sắc"}
                                        {field.text_type === "html" && "HTML"}
                                      </Badge>
                                    </div>
                                  )}
                                  {field.type === "number" && (
                                    <div className="flex gap-1.5 items-center">
                                      <span className="shrink-0">Giá trị:</span>
                                      <span className="px-1.5 py-0.5 rounded bg-background font-medium">
                                        {field.is_array
                                          ? "Danh sách số"
                                          : `${field.min || 0} → ${
                                              field.max || 100
                                            }`}
                                      </span>
                                    </div>
                                  )}
                                  {field.type === "select" &&
                                    field.select_values && (
                                      <div className="flex gap-1.5 col-span-full items-center">
                                        <span className="shrink-0">
                                          Lựa chọn:
                                        </span>
                                        <div className="flex gap-1 overflow-x-auto pb-1 max-w-full no-scrollbar">
                                          {field.select_values
                                            .split(",")
                                            .slice(0, 3)
                                            .map((v, i) => (
                                              <Badge
                                                key={i}
                                                variant="outline"
                                                className="h-5 text-[10px] whitespace-nowrap"
                                              >
                                                {v.split(":")[0]}
                                              </Badge>
                                            ))}
                                          {field.select_values.split(",")
                                            .length > 3 && (
                                            <span className="text-[10px]">
                                              ...
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  {field.type === "relation" && (
                                    <div className="flex gap-1.5 items-center">
                                      <span className="shrink-0">
                                        Đối tượng:
                                      </span>
                                      <Badge
                                        variant="secondary"
                                        className="h-5 text-[10px]"
                                      >
                                        {field.entity === "media"
                                          ? "Ảnh/Video"
                                          : field.entity}
                                      </Badge>
                                    </div>
                                  )}
                                </div>

                                <FormJudgeFieldConfig
                                  fieldName={fieldName}
                                  field={field}
                                  onChange={(updatedField: FormJudgeField) =>
                                    updateField(index, updatedField)
                                  }
                                />
                              </div>
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
