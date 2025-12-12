"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table/data-table";
import { createColumns, ApplicationType } from "./components/columns";
import {
  getApplicationTypes,
  createApplicationType,
  updateApplicationType,
  deleteApplicationType,
  type CreateApplicationTypeRequest,
} from "@/api/manager/application-types-api";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_ROLES = ["member", "instructor", "staff", "manager"];

const getRoleDisplayName = (role: string) => {
  const roleMap: Record<string, string> = {
    member: "Học viên",
    instructor: "Huấn luyện viên",
    staff: "Nhân viên",
    manager: "Quản lý",
  };
  return roleMap[role] || role;
};

export default function ApplicationTypesPage() {
  const { toast } = useToast();
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current item being edited/deleted
  const [currentItem, setCurrentItem] = useState<ApplicationType | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateApplicationTypeRequest>({
    title: "",
    type: [],
  });

  // Fetch application types with optional search
  const fetchApplicationTypes = async (
    searchValue?: string,
    isInitialLoad = false
  ) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else if (searchValue !== undefined) {
      setIsSearching(true);
    }

    try {
      // Build search params using searchOr pattern
      let searchParams: Record<string, string> | undefined;
      if (searchValue?.trim()) {
        searchParams = {
          "searchOr[title:contains]": searchValue.trim(),
        };
      }

      const types = await getApplicationTypes(undefined, searchParams);
      setApplicationTypes(types);
    } catch (error) {
      console.error("Error fetching application types:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách loại đơn từ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchApplicationTypes(undefined, true);
  }, []);

  // Handler for server-side search
  const handleServerSearch = (value: string) => {
    fetchApplicationTypes(value, false);
  };

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchApplicationTypes();
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!formData.title.trim() || formData.type.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createApplicationType(formData);
      await fetchApplicationTypes();
      setIsCreateModalOpen(false);
      resetForm();
      toast({
        title: "Thành công",
        description: "Tạo loại đơn từ thành công!",
      });
    } catch (error) {
      console.error("Error creating application type:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tạo loại đơn từ",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!currentItem || !formData.title.trim() || formData.type.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateApplicationType(currentItem._id, formData);
      await fetchApplicationTypes();
      setIsEditModalOpen(false);
      resetForm();
      toast({
        title: "Thành công",
        description: "Cập nhật loại đơn từ thành công!",
      });
    } catch (error) {
      console.error("Error updating application type:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi cập nhật loại đơn từ",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!currentItem) return;

    setIsSubmitting(true);
    try {
      await deleteApplicationType(currentItem._id);
      await fetchApplicationTypes();
      setIsDeleteModalOpen(false);
      setCurrentItem(null);
      toast({
        title: "Thành công",
        description: "Xóa loại đơn từ thành công!",
      });
    } catch (error) {
      console.error("Error deleting application type:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi xóa loại đơn từ",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: "", type: [] });
    setCurrentItem(null);
  };

  const handleEdit = (item: ApplicationType) => {
    setCurrentItem(item);
    setFormData({ title: item.title, type: item.type });
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: ApplicationType) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleRoleToggle = (role: string) => {
    setFormData((prev) => ({
      ...prev,
      type: prev.type.includes(role)
        ? prev.type.filter((r) => r !== role)
        : [...prev.type, role],
    }));
  };

  // Handle delete application type
  const handleDeleteType = async (typeId: string, typeTitle: string) => {
    await deleteApplicationType(typeId);
    await fetchApplicationTypes();
  };

  // Create columns with delete handler
  const columns = createColumns(handleDeleteType);

  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải loại đơn từ...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <Button
          variant='ghost'
          asChild
        >
          <a
            href='/dashboard/manager'
            className='inline-flex items-center text-sm font-medium'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            Quay lại Dashboard
          </a>
        </Button>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Loại Đơn Từ</h1>
          <p className='text-muted-foreground'>
            Quản lý các loại đơn từ cho hệ thống
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Dialog
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className='mr-2 h-4 w-4' /> Tạo loại đơn từ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo loại đơn từ mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin để tạo loại đơn từ mới
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='title'>Tiêu đề *</Label>
                  <Input
                    id='title'
                    placeholder='Nhập tiêu đề...'
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Vai trò *</Label>
                  <div className='grid grid-cols-2 gap-2'>
                    {AVAILABLE_ROLES.map((role) => (
                      <div
                        key={role}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={`create-${role}`}
                          checked={formData.type.includes(role)}
                          onCheckedChange={() => handleRoleToggle(role)}
                        />
                        <Label
                          htmlFor={`create-${role}`}
                          className='cursor-pointer'
                        >
                          {getRoleDisplayName(role)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang tạo..." : "Tạo"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3 mt-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tổng loại đơn từ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <FileText className='h-8 w-8 text-primary' />
              <div className='text-2xl font-bold'>
                {applicationTypes.length}
              </div>
            </div>
            <p className='text-xs text-muted-foreground'>Tổng số loại đơn từ</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách loại đơn từ</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={applicationTypes}
            searchKey='title'
            searchPlaceholder='Tìm kiếm theo tiêu đề...'
            onServerSearch={handleServerSearch}
            emptyMessage='Không tìm thấy loại đơn từ nào.'
            enableRowHover={false}
          />
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa loại đơn từ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin loại đơn từ
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-title'>Tiêu đề *</Label>
              <Input
                id='edit-title'
                placeholder='Nhập tiêu đề...'
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>Vai trò *</Label>
              <div className='grid grid-cols-2 gap-2'>
                {AVAILABLE_ROLES.map((role) => (
                  <div
                    key={role}
                    className='flex items-center space-x-2'
                  >
                    <Checkbox
                      id={`edit-${role}`}
                      checked={formData.type.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <Label
                      htmlFor={`edit-${role}`}
                      className='cursor-pointer'
                    >
                      {getRoleDisplayName(role)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsEditModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa loại đơn từ "{currentItem?.title}"? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
