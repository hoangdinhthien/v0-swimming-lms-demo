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
import { fetchStaffDetailWithModule } from "@/api/manager/staff-api";
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
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  // Debug logs
  console.log("StaffPermissionModal props:", {
    open,
    staffData,
    token,
    tenantId,
  });

  // Load available permissions when modal opens
  useEffect(() => {
    console.log("Modal open effect triggered:", { open, token, tenantId });
    if (open && token && tenantId) {
      loadAvailablePermissions();
    }
  }, [open, token, tenantId]);

  // Fetch staff permissions if not provided
  useEffect(() => {
    async function fetchPermissionsIfNeeded() {
      // Only fetch if modal is open, we have staffData, but no currentPermissions
      if (
        open &&
        staffData &&
        !staffData.currentPermissions &&
        token &&
        tenantId
      ) {
        setLoadingPermissions(true);
        try {
          console.log(
            "Fetching staff permissions from API for:",
            staffData._id
          );
          const detailData = await fetchStaffDetailWithModule({
            staffId: staffData._id,
            tenantId,
            token,
          });

          if (detailData && detailData.permission) {
            console.log("Fetched permissions:", detailData.permission);
            setSelectedPermissions([...detailData.permission]);
          } else {
            console.log("No permissions found for staff");
            setSelectedPermissions([]);
          }
        } catch (error) {
          console.error("Error fetching staff permissions:", error);
          setSelectedPermissions([]);
        } finally {
          setLoadingPermissions(false);
        }
      } else if (staffData?.currentPermissions) {
        console.log(
          "Using provided currentPermissions:",
          staffData.currentPermissions
        );
        setSelectedPermissions([...staffData.currentPermissions]);
      } else if (open && staffData && !token) {
        console.log("No token available, setting empty permissions");
        setSelectedPermissions([]);
      }
    }

    fetchPermissionsIfNeeded();
  }, [open, staffData, token, tenantId]);

  // Initialize selected permissions when staff data changes
  useEffect(() => {
    console.log("Staff data changed:", staffData);
    if (staffData?.currentPermissions) {
      console.log(
        "Setting selected permissions:",
        staffData.currentPermissions
      );
      setSelectedPermissions([...staffData.currentPermissions]);
    } else {
      console.log("No current permissions, will be fetched or set to empty");
      // Don't set to empty here - let the previous useEffect handle it
    }
  }, [staffData]);

  const loadAvailablePermissions = async () => {
    if (!token || !tenantId) return;

    setLoading(true);
    try {
      console.log("Loading available permissions...");
      const permissions = await fetchAvailablePermissions({
        tenantId,
        token,
      });

      console.log("Permissions from fetchAvailablePermissions:", permissions);
      console.log("Type of permissions:", typeof permissions);
      console.log("Is permissions an array:", Array.isArray(permissions));

      // Ensure permissions is always an array
      const validPermissions = Array.isArray(permissions) ? permissions : [];
      console.log("Valid permissions after array check:", validPermissions);
      console.log("Valid permissions length:", validPermissions.length);
      console.log("First permission item:", validPermissions[0]);

      // The API function already handles deduplication, but let's add a safety check
      const uniquePermissions = validPermissions.filter(
        (permission, index, self) => {
          const moduleName = permission.module?.[0];
          if (!moduleName) return false;

          // Keep only the first occurrence of each module
          return index === self.findIndex((p) => p.module?.[0] === moduleName);
        }
      );

      console.log("Final permissions to set:", uniquePermissions);
      console.log("Number of available permissions:", uniquePermissions.length);

      setAvailablePermissions(uniquePermissions);
    } catch (error) {
      console.error("Error loading available permissions:", error);
      // Set empty array on error to prevent map error
      setAvailablePermissions([]);
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
    const existingIndex = selectedPermissions.findIndex(
      (perm) => perm?.module && perm.module.includes(moduleName)
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
    console.log("Toggle action:", { moduleIndex, action, checked });
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
      console.log("Updated permissions:", newPermissions);
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
    if (!staffData || !token || !tenantId) {
      console.log("Missing required data for save:", {
        staffData,
        token,
        tenantId,
      });
      return;
    }

    console.log("Saving permissions:", {
      userId: staffData._id,
      permissions: selectedPermissions,
      tenantId,
    });

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

        {loading || loadingPermissions ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin' />
            <span className='ml-2'>
              {loading
                ? "Đang tải danh sách quyền hạn..."
                : "Đang tải quyền hạn hiện tại..."}
            </span>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='grid gap-4'>
              {Array.isArray(availablePermissions) &&
              availablePermissions.length > 0 ? (
                availablePermissions.map(
                  (modulePermission, permissionIndex) => {
                    const moduleName = modulePermission.module[0];
                    const isModuleSelected = selectedPermissions.some(
                      (perm) => perm?.module && perm.module.includes(moduleName)
                    );
                    const selectedModuleIndex = selectedPermissions.findIndex(
                      (perm) => perm?.module && perm.module.includes(moduleName)
                    );

                    return (
                      <Card
                        key={`${moduleName}-${permissionIndex}`} // Use index to ensure unique keys
                        className='border'
                      >
                        <CardHeader className='pb-3'>
                          <div className='flex items-center space-x-2'>
                            <Checkbox
                              id={`module-${moduleName}-${permissionIndex}`}
                              checked={isModuleSelected}
                              onCheckedChange={() =>
                                handleModuleToggle(modulePermission)
                              }
                            />
                            <Label
                              htmlFor={`module-${moduleName}-${permissionIndex}`}
                              className='text-lg font-medium cursor-pointer'
                            >
                              {getModuleDisplayName(moduleName)}
                            </Label>
                            <div className='text-xs text-gray-500'>
                              ({modulePermission.action.join(", ")})
                            </div>
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
                                        id={`${moduleName}-${action}-${permissionIndex}`}
                                        checked={
                                          selectedPermissions[
                                            selectedModuleIndex
                                          ]?.action?.includes(action) || false
                                        }
                                        onCheckedChange={(checked) =>
                                          handleActionToggle(
                                            selectedModuleIndex,
                                            action,
                                            checked as boolean
                                          )
                                        }
                                      />
                                      <Label
                                        htmlFor={`${moduleName}-${action}-${permissionIndex}`}
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
                                      id={`${moduleName}-no-review-${permissionIndex}`}
                                      checked={
                                        selectedPermissions[selectedModuleIndex]
                                          ?.noReview === true
                                      }
                                      onCheckedChange={(checked) =>
                                        handleReviewToggle(
                                          selectedModuleIndex,
                                          checked as boolean
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`${moduleName}-no-review-${permissionIndex}`}
                                      className='cursor-pointer'
                                    >
                                      Không cần phê duyệt
                                    </Label>
                                  </div>
                                  <div className='flex items-center space-x-2'>
                                    <Checkbox
                                      id={`${moduleName}-need-review-${permissionIndex}`}
                                      checked={
                                        selectedPermissions[selectedModuleIndex]
                                          ?.noReview === false
                                      }
                                      onCheckedChange={(checked) =>
                                        handleReviewToggle(
                                          selectedModuleIndex,
                                          !(checked as boolean)
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`${moduleName}-need-review-${permissionIndex}`}
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
                  }
                )
              ) : (
                <div className='text-center py-8 text-muted-foreground'>
                  Không có quyền hạn nào có sẵn để cấp cho nhân viên.
                  <br />
                  <small className='text-xs'>
                    Available permissions: {availablePermissions.length}
                  </small>
                </div>
              )}
            </div>

            <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
              <h4 className='font-medium text-blue-800 mb-2'>
                Quyền hạn hiện tại:
              </h4>
              {selectedPermissions.length > 0 ? (
                <div className='space-y-2'>
                  {selectedPermissions.map((perm, index) => (
                    <div
                      key={index}
                      className='text-sm text-blue-700'
                    >
                      <strong>{getModuleDisplayName(perm.module[0])}:</strong>{" "}
                      {perm.action
                        .map((action) => getActionDisplayName(action))
                        .join(", ")}{" "}
                      <span className='text-xs'>
                        ({perm.noReview ? "Không cần duyệt" : "Cần phê duyệt"})
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-sm text-blue-600'>
                  Chưa có quyền hạn nào được chọn. Nhân viên vẫn có thể đăng
                  nhập nhưng không thể truy cập các chức năng.
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={saving || loadingPermissions}
          >
            <X className='h-4 w-4 mr-2' />
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || loadingPermissions}
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
