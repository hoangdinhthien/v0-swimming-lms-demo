"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchAvailablePermissions,
  updateStaffPermissions,
  PermissionModule,
  AvailablePermission,
} from "@/api/staff/staff-permissions-api";
import { useAuth } from "@/hooks/use-auth";

interface StaffPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffData: {
    _id: string;
    user: {
      username: string;
      email: string;
    };
    currentPermissions?: PermissionModule[];
  } | null;
  onSuccess?: () => void;
}

export default function StaffPermissionModal({
  open,
  onOpenChange,
  staffData,
  onSuccess,
}: StaffPermissionModalProps) {
  const { toast } = useToast();
  const { token, tenantId } = useAuth();

  const [availablePermissions, setAvailablePermissions] = useState<
    AvailablePermission[]
  >([]);
  const [selectedPermissions, setSelectedPermissions] = useState<
    PermissionModule[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load available permissions when modal opens
  useEffect(() => {
    if (open && token && tenantId) {
      loadAvailablePermissions();
    }
  }, [open, token, tenantId]);

  // Initialize selected permissions when staff data changes
  useEffect(() => {
    if (staffData?.currentPermissions) {
      setSelectedPermissions([...staffData.currentPermissions]);
    } else {
      setSelectedPermissions([]);
    }
  }, [staffData]);

  const loadAvailablePermissions = async () => {
    if (!token || !tenantId) return;

    setLoading(true);
    try {
      const permissions = await fetchAvailablePermissions({
        tenantId,
        token,
      });
      setAvailablePermissions(permissions);
    } catch (error) {
      console.error("Error loading available permissions:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách quyền hạn có sẵn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (modulePermission: AvailablePermission) => {
    const moduleName = modulePermission.module[0];
    const existingIndex = selectedPermissions.findIndex((perm) =>
      perm.module.includes(moduleName)
    );

    if (existingIndex >= 0) {
      // Remove the module permission
      setSelectedPermissions((prev) =>
        prev.filter((_, index) => index !== existingIndex)
      );
    } else {
      // Add the module with all available actions
      const newPermission: PermissionModule = {
        module: [...modulePermission.module],
        action: [...modulePermission.action],
        noReview: true, // Default to no review required
      };
      setSelectedPermissions((prev) => [...prev, newPermission]);
    }
  };

  const handleActionToggle = (
    moduleIndex: number,
    action: string,
    checked: boolean
  ) => {
    setSelectedPermissions((prev) => {
      const newPermissions = [...prev];
      if (checked) {
        // Add action if not present
        if (!newPermissions[moduleIndex].action.includes(action)) {
          newPermissions[moduleIndex] = {
            ...newPermissions[moduleIndex],
            action: [...newPermissions[moduleIndex].action, action],
          };
        }
      } else {
        // Remove action
        newPermissions[moduleIndex] = {
          ...newPermissions[moduleIndex],
          action: newPermissions[moduleIndex].action.filter(
            (a) => a !== action
          ),
        };
      }
      return newPermissions;
    });
  };

  const handleReviewToggle = (moduleIndex: number, noReview: boolean) => {
    setSelectedPermissions((prev) => {
      const newPermissions = [...prev];
      newPermissions[moduleIndex] = {
        ...newPermissions[moduleIndex],
        noReview,
      };
      return newPermissions;
    });
  };

  const handleSave = async () => {
    if (!staffData || !token || !tenantId) return;

    setSaving(true);
    try {
      await updateStaffPermissions({
        userId: staffData._id,
        permissions: selectedPermissions,
        tenantId,
        token,
      });

      toast({
        title: "Thành công",
        description: "Quyền hạn nhân viên đã được cập nhật",
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating staff permissions:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quyền hạn nhân viên",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!staffData) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Quản lý quyền hạn nhân viên</DialogTitle>
          <DialogDescription>
            Cấp quyền truy cập các chức năng cho nhân viên:{" "}
            <strong>{staffData.user.username}</strong> ({staffData.user.email})
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
            <span className='ml-2'>Đang tải danh sách quyền hạn...</span>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='grid gap-4'>
              {availablePermissions.map((modulePermission) => {
                const moduleName = modulePermission.module[0];
                const isModuleSelected = selectedPermissions.some((perm) =>
                  perm.module.includes(moduleName)
                );
                const selectedModuleIndex = selectedPermissions.findIndex(
                  (perm) => perm.module.includes(moduleName)
                );

                return (
                  <Card
                    key={moduleName}
                    className='border'
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-center space-x-2'>
                        <Checkbox
                          id={`module-${moduleName}`}
                          checked={isModuleSelected}
                          onCheckedChange={() =>
                            handleModuleToggle(modulePermission)
                          }
                        />
                        <Label
                          htmlFor={`module-${moduleName}`}
                          className='text-lg font-medium cursor-pointer'
                        >
                          {getModuleDisplayName(moduleName)}
                        </Label>
                      </div>
                    </CardHeader>

                    {isModuleSelected && selectedModuleIndex >= 0 && (
                      <CardContent>
                        <div className='space-y-4'>
                          {/* Actions */}
                          <div>
                            <Label className='text-sm font-medium mb-2 block'>
                              Hành động được phép:
                            </Label>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                              {modulePermission.action.map((action) => (
                                <div
                                  key={action}
                                  className='flex items-center space-x-2'
                                >
                                  <Checkbox
                                    id={`${moduleName}-${action}`}
                                    checked={selectedPermissions[
                                      selectedModuleIndex
                                    ].action.includes(action)}
                                    onCheckedChange={(checked) =>
                                      handleActionToggle(
                                        selectedModuleIndex,
                                        action,
                                        checked as boolean
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`${moduleName}-${action}`}
                                    className='cursor-pointer'
                                  >
                                    {getActionDisplayName(action)}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Review Settings */}
                          <div>
                            <Label className='text-sm font-medium mb-2 block'>
                              Quy trình phê duyệt:
                            </Label>
                            <div className='flex gap-4'>
                              <div className='flex items-center space-x-2'>
                                <Checkbox
                                  id={`${moduleName}-no-review`}
                                  checked={
                                    selectedPermissions[selectedModuleIndex]
                                      .noReview === true
                                  }
                                  onCheckedChange={(checked) =>
                                    handleReviewToggle(
                                      selectedModuleIndex,
                                      checked as boolean
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`${moduleName}-no-review`}
                                  className='cursor-pointer'
                                >
                                  Không cần phê duyệt
                                </Label>
                              </div>
                              <div className='flex items-center space-x-2'>
                                <Checkbox
                                  id={`${moduleName}-need-review`}
                                  checked={
                                    selectedPermissions[selectedModuleIndex]
                                      .noReview === false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleReviewToggle(
                                      selectedModuleIndex,
                                      !(checked as boolean)
                                    )
                                  }
                                />
                                <Label
                                  htmlFor={`${moduleName}-need-review`}
                                  className='cursor-pointer'
                                >
                                  Cần phê duyệt từ quản lý
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>

            {selectedPermissions.length === 0 && (
              <div className='text-center py-8 text-muted-foreground'>
                Chưa có quyền hạn nào được chọn. Nhân viên vẫn có thể đăng nhập
                nhưng không thể truy cập các chức năng.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            <X className='h-4 w-4 mr-2' />
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <Save className='h-4 w-4 mr-2' />
            )}
            Lưu quyền hạn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions for display names
function getModuleDisplayName(module: string): string {
  const moduleNames: Record<string, string> = {
    Course: "Khóa học",
    Order: "Giao dịch",
    Class: "Lớp học",
    User: "Người dùng",
    News: "Tin tức",
    Blog: "Blog",
    Application: "Đơn đăng ký",
  };
  return moduleNames[module] || module;
}

function getActionDisplayName(action: string): string {
  const actionNames: Record<string, string> = {
    GET: "Xem",
    POST: "Tạo mới",
    PUT: "Chỉnh sửa",
    DELETE: "Xóa",
  };
  return actionNames[action] || action;
}
