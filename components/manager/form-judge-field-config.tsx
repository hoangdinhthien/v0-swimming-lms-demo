"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FormJudgeField } from "./form-judge-builder";

interface FormJudgeFieldConfigProps {
  fieldName: string;
  field: FormJudgeField;
  onChange: (field: FormJudgeField) => void;
}

export function FormJudgeFieldConfig({
  fieldName,
  field,
  onChange,
}: FormJudgeFieldConfigProps) {
  const updateField = (updates: Partial<FormJudgeField>) => {
    onChange({ ...field, ...updates });
  };

  return (
    <div className='space-y-4'>
      {/* Field Type Selection */}
      <div className='space-y-2'>
        <Label>Loại Field</Label>
        <Select
          value={field.type}
          onValueChange={(value: FormJudgeField["type"]) => {
            // Reset field-specific properties when type changes
            const baseField: FormJudgeField = {
              type: value,
              required: field.required,
              is_filter: field.is_filter,
              dependencies: field.dependencies || [],
            };

            // Add type-specific defaults
            if (value === "string") {
              baseField.text_type = "short_text";
              baseField.min = 0;
              baseField.max = 100;
            } else if (value === "number") {
              baseField.is_array = false;
              baseField.min = 0;
              baseField.max = 100;
            } else if (value === "select") {
              baseField.select_values = "Option 1:option1,Option 2:option2";
            } else if (value === "relation") {
              baseField.entity = "";
              baseField.relation_type = "1-1";
              baseField.query_search = "";
            }

            onChange(baseField);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='string'>Text / String</SelectItem>
            <SelectItem value='number'>Number</SelectItem>
            <SelectItem value='boolean'>Boolean (Yes/No)</SelectItem>
            <SelectItem value='select'>Select (Dropdown)</SelectItem>
            <SelectItem value='relation'>Relation (Liên kết)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Common Properties */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id={`${fieldName}-required`}
            checked={field.required}
            onCheckedChange={(checked) =>
              updateField({ required: checked as boolean })
            }
          />
          <Label htmlFor={`${fieldName}-required`}>Bắt buộc</Label>
        </div>
        <div className='flex items-center space-x-2'>
          <Checkbox
            id={`${fieldName}-filter`}
            checked={field.is_filter}
            onCheckedChange={(checked) =>
              updateField({ is_filter: checked as boolean })
            }
          />
          <Label htmlFor={`${fieldName}-filter`}>Dùng làm Filter</Label>
        </div>
      </div>

      <Separator />

      {/* Type-specific configurations */}
      {field.type === "string" && (
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Loại Text</Label>
            <Select
              value={field.text_type || "short_text"}
              onValueChange={(value) =>
                updateField({ text_type: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='short_text'>Text ngắn</SelectItem>
                <SelectItem value='long_text'>Text dài (Textarea)</SelectItem>
                <SelectItem value='email'>Email</SelectItem>
                <SelectItem value='url'>URL</SelectItem>
                <SelectItem value='datetime'>Date & Time</SelectItem>
                <SelectItem value='date'>Date</SelectItem>
                <SelectItem value='time'>Time</SelectItem>
                <SelectItem value='color'>Color</SelectItem>
                <SelectItem value='html'>HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Số ký tự tối thiểu</Label>
              <Input
                type='number'
                value={field.min ?? 0}
                onChange={(e) =>
                  updateField({ min: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Số ký tự tối đa</Label>
              <Input
                type='number'
                value={field.max ?? 100}
                onChange={(e) =>
                  updateField({ max: parseInt(e.target.value) || 100 })
                }
              />
            </div>
          </div>
        </div>
      )}

      {field.type === "number" && (
        <div className='space-y-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id={`${fieldName}-array`}
              checked={field.is_array || false}
              onCheckedChange={(checked) => {
                if (checked) {
                  updateField({
                    is_array: true,
                    min_array_lenght: 1,
                    max_array_lenght: 10,
                  });
                } else {
                  updateField({
                    is_array: false,
                    number_type: undefined,
                    min_array_lenght: undefined,
                    max_array_lenght: undefined,
                  });
                }
              }}
            />
            <Label htmlFor={`${fieldName}-array`}>Dạng mảng (Array)</Label>
          </div>

          {field.is_array && (
            <>
              <div className='space-y-2'>
                <Label>Loại Number</Label>
                <Select
                  value={field.number_type || "normal"}
                  onValueChange={(value) =>
                    updateField({
                      number_type:
                        value === "coordinates" ? "coordinates" : undefined,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='normal'>Number thường</SelectItem>
                    <SelectItem value='coordinates'>
                      Coordinates (Tọa độ)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Số phần tử tối thiểu</Label>
                  <Input
                    type='number'
                    value={field.min_array_lenght ?? 1}
                    onChange={(e) =>
                      updateField({
                        min_array_lenght: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Số phần tử tối đa</Label>
                  <Input
                    type='number'
                    value={field.max_array_lenght ?? 10}
                    onChange={(e) =>
                      updateField({
                        max_array_lenght: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Giá trị tối thiểu</Label>
              <Input
                type='number'
                value={field.min ?? 0}
                onChange={(e) =>
                  updateField({ min: parseInt(e.target.value) || 0 })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Giá trị tối đa</Label>
              <Input
                type='number'
                value={field.max ?? 100}
                onChange={(e) =>
                  updateField({ max: parseInt(e.target.value) || 100 })
                }
              />
            </div>
          </div>
        </div>
      )}

      {field.type === "boolean" && (
        <div className='text-sm text-muted-foreground'>
          <p>
            Field Boolean sẽ hiển thị dạng checkbox (Yes/No hoặc True/False)
          </p>
        </div>
      )}

      {field.type === "select" && (
        <div className='space-y-2'>
          <Label>Danh sách Options</Label>
          <Input
            placeholder='Label1:value1,Label2:value2,...'
            value={field.select_values || ""}
            onChange={(e) => updateField({ select_values: e.target.value })}
          />
          <p className='text-xs text-muted-foreground'>
            Định dạng: <code>Label:Value</code>, cách nhau bởi dấu phẩy.
            <br />
            VD: <code>Xuất sắc:excellent,Tốt:good,Khá:fair</code>
          </p>
        </div>
      )}

      {field.type === "relation" && (
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Entity (Bảng liên kết)</Label>
            <Input
              placeholder='VD: students, courses...'
              value={field.entity || ""}
              onChange={(e) => updateField({ entity: e.target.value })}
            />
          </div>

          <div className='space-y-2'>
            <Label>Loại Relation</Label>
            <Select
              value={field.relation_type || "1-1"}
              onValueChange={(value) =>
                updateField({ relation_type: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='1-1'>One to One (1-1)</SelectItem>
                <SelectItem value='1-n'>One to Many (1-n)</SelectItem>
                <SelectItem value='n-n'>Many to Many (n-n)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Query Search (Tùy chọn)</Label>
            <Input
              placeholder='VD: example[query]search'
              value={field.query_search || ""}
              onChange={(e) => updateField({ query_search: e.target.value })}
            />
            <p className='text-xs text-muted-foreground'>
              Query tìm kiếm tùy chỉnh khi load dữ liệu liên kết
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
