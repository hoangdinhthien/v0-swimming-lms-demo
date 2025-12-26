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
    <div className='space-y-6'>
      {/* Field Type Selection */}
      <div className='space-y-2'>
        <Label className='text-base font-semibold'>Loại dữ liệu</Label>
        <Select
          value={field.type}
          onValueChange={(value: FormJudgeField["type"]) => {
            // Reset field-specific properties when type changes
            const baseField: FormJudgeField = {
              type: value,
              required: field.required,
              is_filter: field.is_filter,
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
              baseField.entity = "media";
              baseField.relation_type = "1-1";
            }

            onChange(baseField);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='string'>Văn bản</SelectItem>
            <SelectItem value='number'>Số</SelectItem>
            <SelectItem value='boolean'>Đúng/Sai</SelectItem>
            <SelectItem value='select'>Lựa chọn từ danh sách</SelectItem>
            <SelectItem value='relation'>Đính kèm tập tin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Common Properties */}
      <div className='space-y-3'>
        <Label className='text-base font-semibold'>Tùy chọn chung</Label>
        <div className='space-y-2'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id={`${fieldName}-required`}
              checked={field.required}
              onCheckedChange={(checked) =>
                updateField({ required: checked as boolean })
              }
            />
            <Label
              htmlFor={`${fieldName}-required`}
              className='font-normal cursor-pointer'
            >
              Bắt buộc phải điền
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id={`${fieldName}-filter`}
              checked={field.is_filter}
              onCheckedChange={(checked) =>
                updateField({ is_filter: checked as boolean })
              }
            />
            <Label
              htmlFor={`${fieldName}-filter`}
              className='font-normal cursor-pointer'
            >
              Cho phép lọc/tìm kiếm theo tiêu chí này
            </Label>
          </div>
        </div>
      </div>

      <div className='border-t pt-4' />

      {/* Type-specific configurations */}
      {field.type === "string" && (
        <div className='space-y-4'>
          <div>
            <Label className='text-base font-semibold mb-3 block'>
              Cài đặt cho văn bản
            </Label>
            <div className='space-y-3'>
              <div>
                <Label className='text-sm mb-1.5 block'>Kiểu nhập liệu</Label>
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
                    <SelectItem value='short_text'>Văn bản ngắn</SelectItem>
                    <SelectItem value='long_text'>Văn bản dài</SelectItem>
                    <SelectItem value='email'>Email</SelectItem>
                    <SelectItem value='url'>Đường dẫn URL</SelectItem>
                    <SelectItem value='datetime'>Ngày giờ</SelectItem>
                    <SelectItem value='date'>Ngày</SelectItem>
                    <SelectItem value='time'>Giờ</SelectItem>
                    <SelectItem value='color'>Màu sắc</SelectItem>
                    <SelectItem value='html'>Văn bản định dạng</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label className='text-sm mb-1.5 block'>
                    Số ký tự tối thiểu
                  </Label>
                  <Input
                    type='number'
                    value={field.min ?? 0}
                    onChange={(e) =>
                      updateField({ min: parseInt(e.target.value) || 0 })
                    }
                    placeholder='0'
                  />
                </div>
                <div>
                  <Label className='text-sm mb-1.5 block'>
                    Số ký tự tối đa
                  </Label>
                  <Input
                    type='number'
                    value={field.max ?? 100}
                    onChange={(e) =>
                      updateField({ max: parseInt(e.target.value) || 100 })
                    }
                    placeholder='100'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {field.type === "number" && (
        <div className='space-y-4'>
          <div>
            <Label className='text-base font-semibold mb-3 block'>
              Cài đặt cho số
            </Label>
            <div className='space-y-3'>
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
                <Label
                  htmlFor={`${fieldName}-array`}
                  className='font-normal cursor-pointer'
                >
                  Cho phép nhập nhiều số (danh sách)
                </Label>
              </div>

              {field.is_array && (
                <>
                  <div>
                    <Label className='text-sm mb-1.5 block'>Loại dữ liệu</Label>
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
                        <SelectItem value='normal'>Số thông thường</SelectItem>
                        <SelectItem value='coordinates'>Tọa độ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='grid grid-cols-2 gap-3'>
                    <div>
                      <Label className='text-sm mb-1.5 block'>
                        Số phần tử tối thiểu
                      </Label>
                      <Input
                        type='number'
                        value={field.min_array_lenght ?? 1}
                        onChange={(e) =>
                          updateField({
                            min_array_lenght: parseInt(e.target.value) || 1,
                          })
                        }
                        placeholder='1'
                      />
                    </div>
                    <div>
                      <Label className='text-sm mb-1.5 block'>
                        Số phần tử tối đa
                      </Label>
                      <Input
                        type='number'
                        value={field.max_array_lenght ?? 10}
                        onChange={(e) =>
                          updateField({
                            max_array_lenght: parseInt(e.target.value) || 10,
                          })
                        }
                        placeholder='10'
                      />
                    </div>
                  </div>
                </>
              )}

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label className='text-sm mb-1.5 block'>
                    Giá trị nhỏ nhất
                  </Label>
                  <Input
                    type='number'
                    value={field.min ?? 0}
                    onChange={(e) =>
                      updateField({ min: parseInt(e.target.value) || 0 })
                    }
                    placeholder='0'
                  />
                </div>
                <div>
                  <Label className='text-sm mb-1.5 block'>
                    Giá trị lớn nhất
                  </Label>
                  <Input
                    type='number'
                    value={field.max ?? 100}
                    onChange={(e) =>
                      updateField({ max: parseInt(e.target.value) || 100 })
                    }
                    placeholder='100'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {field.type === "boolean" && (
        <div className='p-4 bg-muted/50 rounded-lg border'>
          <p className='text-sm text-muted-foreground'>
            Huấn luyện viên sẽ đánh dấu checkbox để đánh giá Đúng/Sai hoặc
            Đạt/Không đạt. Phù hợp cho các tiêu chí đơn giản.
          </p>
        </div>
      )}

      {field.type === "select" && (
        <div className='space-y-3'>
          <div>
            <Label className='text-base font-semibold mb-3 block'>
              Cài đặt danh sách lựa chọn
            </Label>
            <div className='space-y-2'>
              <Label className='text-sm'>Các lựa chọn</Label>
              <Input
                placeholder='Xuất sắc:xuat_sac,Tốt:tot,Khá:kha,Trung bình:trung_binh'
                value={field.select_values || ""}
                onChange={(e) => updateField({ select_values: e.target.value })}
              />
              <div className='text-xs text-muted-foreground bg-muted/50 p-3 rounded border'>
                <p className='font-medium mb-1.5'>Cách nhập:</p>
                <p className='mb-1'>
                  • Định dạng: <code>Tên hiển thị:ma_dinh_danh</code>
                </p>
                <p className='mb-2'>• Cách nhau bằng dấu phẩy (,)</p>
                <p className='font-medium mb-1'>Ví dụ:</p>
                <code className='block bg-background px-2 py-1.5 rounded border text-xs'>
                  Xuất sắc:xuat_sac,Tốt:tot,Khá:kha
                </code>
              </div>
            </div>
          </div>
        </div>
      )}

      {field.type === "relation" && (
        <div className='space-y-3'>
          <div>
            <Label className='text-base font-semibold mb-3 block'>
              Cài đặt đính kèm tập tin
            </Label>
            <div className='space-y-3'>
              <div>
                <Label className='text-sm mb-1.5 block'>Loại tập tin</Label>
                <Select
                  value={field.entity || "media"}
                  onValueChange={(value) => updateField({ entity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='media'>Hình ảnh & Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className='text-sm mb-1.5 block'>Số lượng</Label>
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
                    {/* <SelectItem value='1-n'>Nhiều tập tin</SelectItem>
                    <SelectItem value='n-n'>Không giới hạn</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
