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
        <Label>Loại dữ liệu (Field Type)</Label>
        <Select
          value={field.type}
          onValueChange={(value: FormJudgeField["type"]) => {
            // Reset field-specific properties when type changes
            const baseField: FormJudgeField = {
              type: value,
              required: field.required,
              is_filter: field.is_filter,
              // REMOVED: dependencies - not needed
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
              baseField.select_values =
                "Lựa chọn 1:lua_chon_1,Lựa chọn 2:lua_chon_2,Lựa chọn 3:lua_chon_3";
            } else if (value === "relation") {
              baseField.entity = "media"; // Default to media
              baseField.relation_type = "1-1";
              // REMOVED: query_search - not needed
            }

            onChange(baseField);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='string'>Văn bản (Text/String)</SelectItem>
            <SelectItem value='number'>Số (Number)</SelectItem>
            <SelectItem value='boolean'>Có/Không (Boolean)</SelectItem>
            <SelectItem value='select'>Danh sách lựa chọn (Select)</SelectItem>
            <SelectItem value='relation'>
              Liên kết tập tin (Relation)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Common Properties */}
      <div className='space-y-3'>
        <div className='flex items-center space-x-2 p-3 bg-muted/50 rounded-lg'>
          <Checkbox
            id={`${fieldName}-required`}
            checked={field.required}
            onCheckedChange={(checked) =>
              updateField({ required: checked as boolean })
            }
          />
          <div className='flex-1'>
            <Label
              htmlFor={`${fieldName}-required`}
              className='font-medium cursor-pointer'
            >
              Bắt buộc phải điền (Required)
            </Label>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Giáo viên phải điền tiêu chí này khi đánh giá
            </p>
          </div>
        </div>
        <div className='flex items-center space-x-2 p-3 bg-muted/50 rounded-lg'>
          <Checkbox
            id={`${fieldName}-filter`}
            checked={field.is_filter}
            onCheckedChange={(checked) =>
              updateField({ is_filter: checked as boolean })
            }
          />
          <div className='flex-1'>
            <Label
              htmlFor={`${fieldName}-filter`}
              className='font-medium cursor-pointer'
            >
              Dùng làm bộ lọc (Filter)
            </Label>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Có thể tìm kiếm/lọc đánh giá theo tiêu chí này
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Type-specific configurations */}
      {field.type === "string" && (
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Kiểu nhập liệu</Label>
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
                <SelectItem value='short_text'>
                  Văn bản ngắn (1 dòng)
                </SelectItem>
                <SelectItem value='long_text'>
                  Văn bản dài (Nhiều dòng)
                </SelectItem>
                <SelectItem value='email'>Email</SelectItem>
                <SelectItem value='url'>Đường dẫn web (URL)</SelectItem>
                <SelectItem value='datetime'>Ngày giờ</SelectItem>
                <SelectItem value='date'>Chỉ ngày</SelectItem>
                <SelectItem value='time'>Chỉ giờ</SelectItem>
                <SelectItem value='color'>Chọn màu</SelectItem>
                <SelectItem value='html'>Soạn thảo văn bản (HTML)</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Chọn kiểu phù hợp với nội dung cần đánh giá
            </p>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Độ dài tối thiểu</Label>
              <Input
                type='number'
                value={field.min ?? 0}
                onChange={(e) =>
                  updateField({ min: parseInt(e.target.value) || 0 })
                }
                placeholder='VD: 10'
              />
              <p className='text-xs text-muted-foreground'>Số ký tự ít nhất</p>
            </div>
            <div className='space-y-2'>
              <Label>Độ dài tối đa</Label>
              <Input
                type='number'
                value={field.max ?? 100}
                onChange={(e) =>
                  updateField({ max: parseInt(e.target.value) || 100 })
                }
                placeholder='VD: 500'
              />
              <p className='text-xs text-muted-foreground'>
                Số ký tự nhiều nhất
              </p>
            </div>
          </div>
        </div>
      )}

      {field.type === "number" && (
        <div className='space-y-4'>
          <div className='flex items-center space-x-2 p-3 bg-muted/50 rounded-lg'>
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
            <div className='flex-1'>
              <Label
                htmlFor={`${fieldName}-array`}
                className='font-medium cursor-pointer'
              >
                Dạng mảng/nhiều giá trị (Array)
              </Label>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Cho phép nhập nhiều số thay vì chỉ một số
              </p>
            </div>
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
              <Label>Giá trị nhỏ nhất</Label>
              <Input
                type='number'
                value={field.min ?? 0}
                onChange={(e) =>
                  updateField({ min: parseInt(e.target.value) || 0 })
                }
                placeholder='VD: 0'
              />
              <p className='text-xs text-muted-foreground'>
                Số thấp nhất cho phép
              </p>
            </div>
            <div className='space-y-2'>
              <Label>Giá trị lớn nhất</Label>
              <Input
                type='number'
                value={field.max ?? 100}
                onChange={(e) =>
                  updateField({ max: parseInt(e.target.value) || 100 })
                }
                placeholder='VD: 10'
              />
              <p className='text-xs text-muted-foreground'>
                Số cao nhất cho phép
              </p>
            </div>
          </div>
        </div>
      )}

      {field.type === "boolean" && (
        <div className='text-sm text-muted-foreground p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-l-4 border-blue-500'>
          <p className='font-medium text-blue-900 dark:text-blue-100 mb-2'>
            Tiêu chí đánh giá dạng Đạt/Không đạt
          </p>
          <p className='text-blue-800 dark:text-blue-200'>
            Giáo viên sẽ chỉ cần đánh dấu ✓ hoặc để trống. Thích hợp cho các
            tiêu chí đơn giản như "Có tham gia đủ", "Hoàn thành bài tập", v.v.
          </p>
        </div>
      )}

      {field.type === "select" && (
        <div className='space-y-2'>
          <Label>Danh sách lựa chọn</Label>
          <Input
            placeholder='Xuất sắc:xuat_sac,Tốt:tot,Khá:kha,Trung bình:trung_binh'
            value={field.select_values || ""}
            onChange={(e) => updateField({ select_values: e.target.value })}
          />
          <div className='text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800'>
            <p className='font-medium mb-2 text-blue-900 dark:text-blue-100'>
              📝 Cách nhập:
            </p>
            <div className='space-y-1'>
              <p>
                • Mỗi lựa chọn gồm 2 phần: <strong>Tên hiển thị</strong> và{" "}
                <strong>mã định danh</strong>
              </p>
              <p>
                • Định dạng:{" "}
                <code className='bg-white dark:bg-slate-900 px-2 py-0.5 rounded border'>
                  Tên hiển thị:ma_dinh_danh
                </code>
              </p>
              <p>• Cách nhau bằng dấu phẩy (,)</p>
            </div>
            <div className='mt-2 pt-2 border-t border-blue-200 dark:border-blue-800'>
              <p className='font-medium mb-1 text-blue-900 dark:text-blue-100'>
                Ví dụ thực tế:
              </p>
              <code className='block bg-white dark:bg-slate-900 px-2 py-1.5 rounded border text-green-600 dark:text-green-400'>
                Xuất sắc:xuat_sac,Tốt:tot,Khá:kha,Trung bình:trung_binh
              </code>
              <p className='mt-1 text-xs'>
                → Giáo viên sẽ thấy: "Xuất sắc", "Tốt", "Khá", "Trung bình"
              </p>
            </div>
          </div>
        </div>
      )}

      {field.type === "relation" && (
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label>Loại tập tin đính kèm</Label>
            <Select
              value={field.entity || "media"}
              onValueChange={(value) => updateField({ entity: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder='Chọn loại tập tin...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='media'>Hình ảnh & Video</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Giáo viên có thể đính kèm ảnh hoặc video khi đánh giá
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Số lượng tập tin</Label>
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
                <SelectItem value='1-1'>Chỉ 1 tập tin</SelectItem>
                <SelectItem value='1-n'>Nhiều tập tin</SelectItem>
                <SelectItem value='n-n'>Không giới hạn</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Giới hạn số ảnh/video giáo viên có thể tải lên
            </p>
          </div>

          {/* TEMPORARILY DISABLED: Query Search */}
          {/* <div className='space-y-2'>
            <Label>Query Search (Tùy chọn)</Label>
            <Input
              placeholder='VD: example[query]search'
              value={field.query_search || ""}
              onChange={(e) => updateField({ query_search: e.target.value })}
            />
            <p className='text-xs text-muted-foreground'>
              Query tìm kiếm tùy chỉnh khi load dữ liệu liên kết
            </p>
          </div> */}
        </div>
      )}
    </div>
  );
}
