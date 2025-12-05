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
import { Plus, Trash2, Settings2, ChevronDown, ChevronUp } from "lucide-react";
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
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());
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
          // REMOVED: dependencies - not needed
        },
      },
    };
    updateSchema(newSchema);
    setExpandedFields(new Set([...expandedFields, newFieldName]));
    setNewFieldName("");
  };

  // Remove a field
  const removeField = (fieldName: string) => {
    const newItems = { ...schema.items };
    delete newItems[fieldName];
    updateSchema({ ...schema, items: newItems });

    // Remove from expanded fields
    const newExpanded = new Set(expandedFields);
    newExpanded.delete(fieldName);
    setExpandedFields(newExpanded);
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

  // Toggle field expansion
  const toggleFieldExpansion = (fieldName: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldName)) {
      newExpanded.delete(fieldName);
    } else {
      newExpanded.add(fieldName);
    }
    setExpandedFields(newExpanded);
  };

  // Get all field names (for dependencies)
  const allFieldNames = Object.keys(schema.items);

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Settings2 className='h-5 w-5' />
            Biểu mẫu đánh giá học viên (Form Judge)
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Tạo các tiêu chí đánh giá cho giáo viên sử dụng khi đánh giá học
            viên trong nội dung này
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Add new field */}
          <div className='space-y-2'>
            <Label className='text-sm font-semibold'>
              Thêm tiêu chí đánh giá mới
            </Label>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <Input
                  placeholder='VD: diem_so, nhan_xet, ky_nang_boi...'
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && newFieldName.trim() && addField()
                  }
                  className={
                    !newFieldName.trim()
                      ? "border-red-300 focus-visible:ring-red-500"
                      : ""
                  }
                />
              </div>
              <Button
                onClick={addField}
                size='sm'
                disabled={!newFieldName.trim()}
              >
                <Plus className='h-4 w-4 mr-1' />
                Thêm tiêu chí
              </Button>
            </div>
            <p className='text-xs text-muted-foreground'>
              Tên tiêu chí nên viết liền không dấu, sử dụng dấu gạch dưới (_)
              thay cho khoảng trắng
            </p>
          </div>

          {/* List of fields */}
          {allFieldNames.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg'>
              <Settings2 className='h-12 w-12 mx-auto mb-3 opacity-50' />
              <p className='font-medium'>Chưa có tiêu chí đánh giá nào</p>
              <p className='text-xs mt-1'>
                Thêm tiêu chí đầu tiên để bắt đầu tạo biểu mẫu đánh giá!
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              <p className='text-sm font-medium text-muted-foreground'>
                Danh sách tiêu chí đánh giá ({allFieldNames.length})
              </p>
              {allFieldNames.map((fieldName) => {
                const field = schema.items[fieldName];
                const isExpanded = expandedFields.has(fieldName);

                // Map field type to Vietnamese
                const fieldTypeMap: Record<string, string> = {
                  string: "Văn bản (Text)",
                  number: "Số (Number)",
                  boolean: "Có/Không (Yes/No)",
                  select: "Chọn từ danh sách (Select)",
                  relation: "Liên kết (Relation)",
                };

                return (
                  <Card
                    key={fieldName}
                    className='border-2 hover:border-primary/50 transition-colors'
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 flex-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleFieldExpansion(fieldName)}
                            className='hover:bg-muted'
                          >
                            {isExpanded ? (
                              <ChevronUp className='h-4 w-4' />
                            ) : (
                              <ChevronDown className='h-4 w-4' />
                            )}
                          </Button>
                          <div className='flex-1'>
                            <p className='font-semibold text-base'>
                              {fieldName}
                            </p>
                            <div className='flex gap-2 mt-1 flex-wrap'>
                              <Badge
                                variant='outline'
                                className='text-xs'
                              >
                                {fieldTypeMap[field.type] || field.type}
                              </Badge>
                              {field.required && (
                                <Badge
                                  variant='destructive'
                                  className='text-xs'
                                >
                                  Bắt buộc
                                </Badge>
                              )}
                              {field.is_filter && (
                                <Badge
                                  variant='secondary'
                                  className='text-xs'
                                >
                                  Dùng làm bộ lọc
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeField(fieldName)}
                          className='hover:bg-destructive/10'
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className='space-y-4 pt-0'>
                        <FormJudgeFieldConfig
                          fieldName={fieldName}
                          field={field}
                          onChange={(updatedField: FormJudgeField) =>
                            updateField(fieldName, updatedField)
                          }
                        />

                        {/* TEMPORARILY DISABLED: Dependencies Configuration */}
                        {/* <FormJudgeDependencyConfig
                          fieldName={fieldName}
                          dependencies={field.dependencies || []}
                          availableFields={allFieldNames.filter(
                            (name) => name !== fieldName
                          )}
                          onChange={(
                            newDeps: Array<{ field: string; value: string }>
                          ) =>
                            updateField(fieldName, {
                              ...field,
                              dependencies: newDeps,
                            })
                          }
                        /> */}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
