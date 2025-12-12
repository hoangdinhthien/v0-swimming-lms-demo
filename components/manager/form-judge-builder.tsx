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
import { Plus, Trash2, Settings2 } from "lucide-react";
import { FormJudgeFieldConfig } from "./form-judge-field-config";
import { FormJudgeDependencyConfig } from "./form-judge-dependency-config";

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
  items: Record<string, FormJudgeField>;
}

interface FormJudgeBuilderProps {
  value?: FormJudgeSchema;
  onChange: (schema: FormJudgeSchema) => void;
}

export function FormJudgeBuilder({ value, onChange }: FormJudgeBuilderProps) {
  const [schema, setSchema] = useState<FormJudgeSchema>(
    value || {
      type: "object",
      items: {},
    }
  );
  const [newFieldName, setNewFieldName] = useState("");

  // Update parent when schema changes
  const updateSchema = (newSchema: FormJudgeSchema) => {
    setSchema(newSchema);
    onChange(newSchema);
  };

  // Add a new field
  const addField = () => {
    if (!newFieldName.trim()) return;
    if (schema.items[newFieldName]) {
      alert("Tên field đã tồn tại!");
      return;
    }

    const newSchema = {
      ...schema,
      items: {
        ...schema.items,
        [newFieldName]: {
          type: "string" as const,
          required: false,
          is_filter: false,
          text_type: "short_text" as const,
        },
      },
    };
    updateSchema(newSchema);
    setNewFieldName("");
  };

  // Remove a field
  const removeField = (fieldName: string) => {
    const newItems = { ...schema.items };
    delete newItems[fieldName];
    updateSchema({ ...schema, items: newItems });
  };

  // Update a field
  const updateField = (fieldName: string, fieldData: FormJudgeField) => {
    updateSchema({
      ...schema,
      items: {
        ...schema.items,
        [fieldName]: fieldData,
      },
    });
  };

  // Get all field names
  const allFieldNames = Object.keys(schema.items);

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
        <div className='space-y-3'>
          {allFieldNames.map((fieldName) => {
            const field = schema.items[fieldName];

            return (
              <Card
                key={fieldName}
                className='border-2'
              >
                <CardContent className='p-4'>
                  {/* Field Header */}
                  <div className='flex items-start justify-between mb-4 pb-4 border-b'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-2'>
                        <h4 className='font-semibold text-base'>{fieldName}</h4>
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
                      onClick={() => removeField(fieldName)}
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
                          {field.text_type === "short_text" && "Văn bản ngắn"}
                          {field.text_type === "long_text" && "Văn bản dài"}
                          {field.text_type === "email" && "Email"}
                          {field.text_type === "url" && "Đường dẫn URL"}
                          {field.text_type === "datetime" && "Ngày giờ"}
                          {field.text_type === "date" && "Ngày tháng"}
                          {field.text_type === "time" && "Giờ"}
                          {field.text_type === "color" && "Màu sắc"}
                          {field.text_type === "html" && "Văn bản định dạng"}
                        </span>
                        {field.min !== undefined && field.max !== undefined && (
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
                            {field.number_type === "coordinates" && "(Tọa độ)"}{" "}
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
                        {field.entity === "media" ? "ảnh/video" : field.entity}{" "}
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
                            updateField(fieldName, updatedField)
                          }
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
