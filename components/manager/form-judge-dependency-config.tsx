"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Dependency {
  field: string;
  value: string;
}

interface FormJudgeDependencyConfigProps {
  fieldName: string;
  dependencies: Dependency[];
  availableFields: string[];
  onChange: (dependencies: Dependency[]) => void;
}

export function FormJudgeDependencyConfig({
  fieldName,
  dependencies,
  availableFields,
  onChange,
}: FormJudgeDependencyConfigProps) {
  const [newDepField, setNewDepField] = useState("");
  const [newDepValue, setNewDepValue] = useState("");

  // Add a dependency
  const addDependency = () => {
    if (!newDepField || !newDepValue.trim()) {
      return;
    }

    // Check if dependency already exists for this field
    if (dependencies.some((dep) => dep.field === newDepField)) {
      alert("Dependency cho field này đã tồn tại!");
      return;
    }

    onChange([...dependencies, { field: newDepField, value: newDepValue }]);
    setNewDepField("");
    setNewDepValue("");
  };

  // Remove a dependency
  const removeDependency = (index: number) => {
    onChange(dependencies.filter((_, i) => i !== index));
  };

  // Update a dependency
  const updateDependency = (index: number, updates: Partial<Dependency>) => {
    onChange(
      dependencies.map((dep, i) => (i === index ? { ...dep, ...updates } : dep))
    );
  };

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <Label className='text-sm font-semibold'>
          Dependencies (Điều kiện hiển thị)
        </Label>
        <Badge
          variant='secondary'
          className='text-xs'
        >
          {dependencies.length} dependency
        </Badge>
      </div>

      <p className='text-xs text-muted-foreground'>
        Field này sẽ chỉ hiển thị khi các điều kiện sau được thỏa mãn:
      </p>

      {/* List existing dependencies */}
      {dependencies.length > 0 && (
        <div className='space-y-2'>
          {dependencies.map((dep, index) => (
            <Card
              key={index}
              className='border'
            >
              <CardContent className='p-3'>
                <div className='flex items-center gap-2'>
                  <div className='flex-1 grid grid-cols-2 gap-2'>
                    <div className='space-y-1'>
                      <Label className='text-xs'>Field</Label>
                      <Select
                        value={dep.field}
                        onValueChange={(value) =>
                          updateDependency(index, { field: value })
                        }
                      >
                        <SelectTrigger className='h-8'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableFields.map((field) => (
                            <SelectItem
                              key={field}
                              value={field}
                            >
                              {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-xs'>Giá trị</Label>
                      <Input
                        className='h-8'
                        placeholder='VD: excellent,good'
                        value={dep.value}
                        onChange={(e) =>
                          updateDependency(index, { value: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0'
                    onClick={() => removeDependency(index)}
                  >
                    <Trash2 className='h-4 w-4 text-destructive' />
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground mt-2'>
                  Hiển thị khi <strong>{dep.field}</strong> ={" "}
                  <code>{dep.value}</code>
                  {dep.value.includes(",") && " (có thể nhiều giá trị)"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new dependency */}
      {availableFields.length > 0 ? (
        <Card className='border-dashed'>
          <CardContent className='p-3'>
            <div className='space-y-2'>
              <div className='grid grid-cols-2 gap-2'>
                <div className='space-y-1'>
                  <Label className='text-xs'>Phụ thuộc vào Field</Label>
                  <Select
                    value={newDepField}
                    onValueChange={setNewDepField}
                  >
                    <SelectTrigger className='h-8'>
                      <SelectValue placeholder='Chọn field...' />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields
                        .filter(
                          (field) =>
                            !dependencies.some((dep) => dep.field === field)
                        )
                        .map((field) => (
                          <SelectItem
                            key={field}
                            value={field}
                          >
                            {field}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-1'>
                  <Label className='text-xs'>Khi có giá trị</Label>
                  <Input
                    className='h-8'
                    placeholder='VD: excellent'
                    value={newDepValue}
                    onChange={(e) => setNewDepValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addDependency()}
                  />
                </div>
              </div>
              <Button
                size='sm'
                className='w-full h-8'
                onClick={addDependency}
                disabled={!newDepField || !newDepValue.trim()}
              >
                <Plus className='h-3 w-3 mr-1' />
                Thêm Dependency
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className='text-xs text-muted-foreground italic'>
          Cần ít nhất 1 field khác để thiết lập dependency
        </p>
      )}

      {dependencies.length === 0 && (
        <p className='text-xs text-muted-foreground italic'>
          Không có dependency - field này sẽ luôn hiển thị
        </p>
      )}
    </div>
  );
}
