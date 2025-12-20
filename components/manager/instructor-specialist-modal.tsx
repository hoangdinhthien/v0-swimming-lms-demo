"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, X, Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  fetchAllCourseCategories,
  CourseCategory,
} from "@/api/manager/course-categories";
import { fetchAgeRules, AgeRule } from "@/api/manager/age-types";
import {
  fetchInstructorSpecialist,
  updateInstructorSpecialist,
  InstructorSpecialist,
} from "@/api/manager/instructors-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

interface InstructorSpecialistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorData: {
    id: string;
    name: string;
    email: string;
  } | null;
  onSuccess?: () => void;
}

export default function InstructorSpecialistModal({
  open,
  onOpenChange,
  instructorData,
  onSuccess,
}: InstructorSpecialistModalProps) {
  const { toast } = useToast();

  const [availableCategories, setAvailableCategories] = useState<
    CourseCategory[]
  >([]);
  const [availableAgeTypes, setAvailableAgeTypes] = useState<AgeRule[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedAgeTypes, setSelectedAgeTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [categorySelectOpen, setCategorySelectOpen] = useState(false);

  // Load available categories and age types when modal opens
  useEffect(() => {
    if (open) {
      loadAvailableData();
    }
  }, [open]);

  // Fetch current specialist data when instructor changes
  useEffect(() => {
    if (open && instructorData) {
      loadCurrentSpecialist();
    }
  }, [open, instructorData]);

  const loadAvailableData = async () => {
    setLoading(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Missing authentication");
      }

      const [categories, ageTypes] = await Promise.all([
        fetchAllCourseCategories({ tenantId, token }),
        fetchAgeRules({}, tenantId, token),
      ]);

      setAvailableCategories(
        categories.filter((cat) => cat.is_active !== false)
      );
      setAvailableAgeTypes(ageTypes.filter((age) => age.is_active !== false));
    } catch (error) {
      console.error("Error loading available data:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách chuyên môn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentSpecialist = async () => {
    if (!instructorData) return;

    setLoadingData(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Missing authentication");
      }

      const specialists = await fetchInstructorSpecialist({
        searchParams: { "user._id": instructorData.id },
        tenantId,
        token,
      });

      if (specialists.length > 0) {
        const specialist = specialists[0];
        setSelectedCategories(
          Array.isArray(specialist.category)
            ? specialist.category.map((cat) =>
                typeof cat === "string" ? cat : cat._id
              )
            : []
        );
        setSelectedAgeTypes(
          Array.isArray(specialist.age_types)
            ? specialist.age_types.map((age) =>
                typeof age === "string" ? age : age._id
              )
            : []
        );
      } else {
        setSelectedCategories([]);
        setSelectedAgeTypes([]);
      }
    } catch (error) {
      console.error("Error loading current specialist:", error);
      setSelectedCategories([]);
      setSelectedAgeTypes([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleAgeTypeChange = (ageTypeId: string, checked: boolean) => {
    setSelectedAgeTypes((prev) =>
      checked ? [...prev, ageTypeId] : prev.filter((id) => id !== ageTypeId)
    );
  };

  const handleSave = async () => {
    if (!instructorData) return;

    setSaving(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Missing authentication");
      }

      await updateInstructorSpecialist({
        userId: instructorData.id,
        data: {
          category: selectedCategories,
          age_types: selectedAgeTypes,
        },
        tenantId,
        token,
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật chuyên môn của huấn luyện viên",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating specialist:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật chuyên môn",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setSelectedCategories([]);
    setSelectedAgeTypes([]);
    setCategorySelectOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa chuyên môn</DialogTitle>
          <DialogDescription>
            Cập nhật chuyên môn cho huấn luyện viên {instructorData?.name}
          </DialogDescription>
        </DialogHeader>

        {(loading || loadingData) && (
          <div className='flex justify-center items-center py-8'>
            <Loader2 className='h-6 w-6 animate-spin' />
            <span className='ml-2'>Đang tải...</span>
          </div>
        )}

        {!loading && !loadingData && (
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Danh mục khóa học</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover
                  open={categorySelectOpen}
                  onOpenChange={setCategorySelectOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      role='combobox'
                      aria-expanded={categorySelectOpen}
                      className='w-full justify-between'
                    >
                      {selectedCategories.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {selectedCategories.slice(0, 2).map((categoryId) => {
                            const category = availableCategories.find(
                              (cat) => cat._id === categoryId
                            );
                            return category ? (
                              <Badge
                                key={categoryId}
                                variant='secondary'
                                className='text-xs'
                              >
                                {category.title}
                              </Badge>
                            ) : null;
                          })}
                          {selectedCategories.length > 2 && (
                            <Badge
                              variant='secondary'
                              className='text-xs'
                            >
                              +{selectedCategories.length - 2} nữa
                            </Badge>
                          )}
                        </div>
                      ) : (
                        "Chọn danh mục khóa học..."
                      )}
                      <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
                    <Command>
                      <CommandInput placeholder='Tìm kiếm danh mục...' />
                      <CommandList>
                        <CommandEmpty>
                          Không tìm thấy danh mục nào.
                        </CommandEmpty>
                        <CommandGroup>
                          {availableCategories.map((category) => {
                            const isSelected = selectedCategories.includes(
                              category._id
                            );
                            return (
                              <CommandItem
                                key={category._id}
                                onSelect={() => {
                                  setSelectedCategories((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== category._id)
                                      : [...prev, category._id]
                                  );
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {category.title}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedCategories.length > 0 && (
                  <div className='mt-2'>
                    <p className='text-sm text-muted-foreground'>
                      Đã chọn {selectedCategories.length} danh mục
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Độ tuổi</CardTitle>
              </CardHeader>
              <CardContent>
                {availableAgeTypes.length === 0 ? (
                  <p className='text-muted-foreground'>Không có độ tuổi nào</p>
                ) : (
                  <div className='grid grid-cols-2 gap-4'>
                    {availableAgeTypes.map((ageType) => (
                      <div
                        key={ageType._id}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`age-${ageType._id}`}
                          checked={selectedAgeTypes.includes(ageType._id)}
                          onCheckedChange={(checked) =>
                            handleAgeTypeChange(ageType._id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={`age-${ageType._id}`}
                          className='text-sm font-normal'
                        >
                          {ageType.title}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={saving}
          >
            <X className='mr-2 h-4 w-4' />
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || loadingData}
          >
            {saving ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <Save className='mr-2 h-4 w-4' />
            )}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
