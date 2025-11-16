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
  query_search?: string;
  // Dependencies
  dependencies?: Array<{ field: string; value: string }>;
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
          dependencies: [],
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
            Form Đánh Giá (Form Judge)
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Thiết kế form để giáo viên có thể đánh giá học viên cho nội dung này
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Add new field */}
          <div className='flex gap-2'>
            <Input
              placeholder='Nhập tên field (VD: diem_so, nhan_xet)...'
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addField()}
            />
            <Button
              onClick={addField}
              size='sm'
            >
              <Plus className='h-4 w-4 mr-1' />
              Thêm Field
            </Button>
          </div>

          {/* List of fields */}
          {allFieldNames.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              <p>Chưa có field nào. Thêm field đầu tiên để bắt đầu!</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {allFieldNames.map((fieldName) => {
                const field = schema.items[fieldName];
                const isExpanded = expandedFields.has(fieldName);

                return (
                  <Card
                    key={fieldName}
                    className='border-2'
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleFieldExpansion(fieldName)}
                          >
                            {isExpanded ? (
                              <ChevronUp className='h-4 w-4' />
                            ) : (
                              <ChevronDown className='h-4 w-4' />
                            )}
                          </Button>
                          <div>
                            <p className='font-semibold'>{fieldName}</p>
                            <div className='flex gap-2 mt-1'>
                              <Badge variant='outline'>{field.type}</Badge>
                              {field.required && (
                                <Badge variant='destructive'>Bắt buộc</Badge>
                              )}
                              {field.is_filter && (
                                <Badge variant='secondary'>Filter</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => removeField(fieldName)}
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

                        {/* Dependencies Configuration */}
                        <FormJudgeDependencyConfig
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
                        />
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* JSON Preview */}
          {allFieldNames.length > 0 && (
            <details className='mt-4'>
              <summary className='cursor-pointer font-medium text-sm'>
                Xem JSON Schema
              </summary>
              <pre className='mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-64'>
                {JSON.stringify(schema, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
