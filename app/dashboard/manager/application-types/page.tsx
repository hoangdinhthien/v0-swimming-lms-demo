"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Users,
  FileText,
  Loader2,
  Search,
  GraduationCap,
  UserCheck,
  Crown,
  Settings,
} from "lucide-react";
import Link from "next/link";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getApplicationTypes,
  createApplicationType,
  updateApplicationType,
  deleteApplicationType,
  getRoleDisplayName,
  getRoleColorClass,
  type ApplicationType,
  type CreateApplicationTypeRequest,
} from "@/api/manager/application-types-api";

const AVAILABLE_ROLES = ["member", "instructor", "staff", "manager"];

export default function ApplicationTypesPage() {
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("");

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

  useEffect(() => {
    fetchApplicationTypes();
  }, []);

  const fetchApplicationTypes = async () => {
    try {
      setIsLoading(true);
      const types = await getApplicationTypes();
      setApplicationTypes(types);
    } catch (error) {
      console.error("Error fetching application types:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!formData.title.trim() || formData.type.length === 0) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      await createApplicationType(formData);
      await fetchApplicationTypes();
      setIsCreateModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating application type:", error);
      alert("Có lỗi xảy ra khi tạo loại đơn từ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!currentItem || !formData.title.trim() || formData.type.length === 0) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateApplicationType(currentItem._id, formData);
      await fetchApplicationTypes();
      setIsEditModalOpen(false);
      resetForm();
      setCurrentItem(null);
    } catch (error) {
      console.error("Error updating application type:", error);
      alert("Có lỗi xảy ra khi cập nhật loại đơn từ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;

    setIsSubmitting(true);
    try {
      await deleteApplicationType(currentItem._id);
      await fetchApplicationTypes();
      setIsDeleteModalOpen(false);
      setCurrentItem(null);
    } catch (error) {
      console.error("Error deleting application type:", error);
      alert("Có lỗi xảy ra khi xóa loại đơn từ");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: [],
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const openEditModal = (item: ApplicationType) => {
    setCurrentItem(item);
    setFormData({
      title: item.title,
      type: [...item.type],
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: ApplicationType) => {
    setCurrentItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleRoleToggle = (role: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      type: checked
        ? [...prev.type, role]
        : prev.type.filter((r) => r !== role),
    }));
  };

  // Filter application types based on search term and role filter
  const filteredTypes = applicationTypes.filter((type) => {
    const matchesSearch = type.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole =
      !selectedRoleFilter || type.type.includes(selectedRoleFilter);
    return matchesSearch && matchesRole;
  });

  // Stats calculations
  const totalTypes = applicationTypes.length;
  const typesByRole = AVAILABLE_ROLES.reduce((acc, role) => {
    acc[role] = applicationTypes.filter((type) =>
      type.type.includes(role)
    ).length;
    return acc;
  }, {} as Record<string, number>);

  // Loading state similar to other pages
  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách loại đơn từ...
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
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về Bảng điều khiển
        </Link>
      </div>

      <div className='flex flex-col space-y-8'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Quản lý loại đơn từ
            </h1>
            <p className='text-muted-foreground'>
              Cấu hình các loại đơn từ cho từng vai trò người dùng
            </p>
          </div>
          <Dialog
            open={isCreateModalOpen}
            onOpenChange={setIsCreateModalOpen}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateModal}>
                <Plus className='mr-2 h-4 w-4' />
                Tạo loại đơn từ mới
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>

        <div className='grid gap-6 md:grid-cols-5'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng số loại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{totalTypes}</div>
              <p className='text-xs text-muted-foreground'>Loại đơn từ</p>
            </CardContent>
          </Card>

          {AVAILABLE_ROLES.map((role) => (
            <Card key={role}>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {getRoleDisplayName(role)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{typesByRole[role]}</div>
                <p className='text-xs text-muted-foreground'>Loại đơn từ</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Danh sách loại đơn từ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
              <div className='flex-1 relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Tìm kiếm theo tên loại đơn từ...'
                  className='pl-8'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className='w-full md:w-48'>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-input rounded-md bg-background text-foreground'
                >
                  <option value=''>Tất cả vai trò</option>
                  {AVAILABLE_ROLES.map((role) => (
                    <option
                      key={role}
                      value={role}
                    >
                      {getRoleDisplayName(role)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className='rounded-md border overflow-hidden'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên loại đơn từ</TableHead>
                    <TableHead>Vai trò được phép</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className='text-right'>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTypes.length > 0 ? (
                    filteredTypes.map((type) => (
                      <TableRow
                        key={type._id}
                        className='cursor-pointer hover:bg-muted/50 transition-colors'
                      >
                        <TableCell className='font-medium'>
                          {type.title}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap gap-2'>
                            {type.type.map((role) => (
                              <Badge
                                key={role}
                                variant='outline'
                                className={getRoleColorClass(role)}
                              >
                                {getRoleDisplayName(role)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(type.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => openEditModal(type)}
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>
                            <AlertDialog
                              open={
                                isDeleteModalOpen &&
                                currentItem?._id === type._id
                              }
                              onOpenChange={setIsDeleteModalOpen}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  onClick={() => openDeleteModal(type)}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Xác nhận xóa
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc chắn muốn xóa loại đơn từ "
                                    {type.title}"? Hành động này không thể hoàn
                                    tác.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isSubmitting}>
                                    Hủy
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className='bg-red-600 hover:bg-red-700'
                                  >
                                    {isSubmitting && (
                                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                    )}
                                    {isSubmitting ? "Đang xóa..." : "Xóa"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className='text-center py-8 text-muted-foreground'
                      >
                        {searchTerm || selectedRoleFilter
                          ? "Không tìm thấy kết quả phù hợp"
                          : "Chưa có loại đơn từ nào"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        >
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Tạo loại đơn từ mới</DialogTitle>
              <DialogDescription>
                Thêm loại đơn từ mới cho hệ thống
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-6 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>Tên loại đơn từ</Label>
                <Input
                  id='title'
                  placeholder='Nhập tên loại đơn từ...'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className='space-y-3'>
                <Label>Vai trò được phép sử dụng</Label>
                <div className='grid grid-cols-2 gap-4'>
                  {AVAILABLE_ROLES.map((role) => (
                    <div
                      key={role}
                      className='flex items-center space-x-2'
                    >
                      <Checkbox
                        id={`create-${role}`}
                        checked={formData.type.includes(role)}
                        onCheckedChange={(checked) =>
                          handleRoleToggle(role, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`create-${role}`}
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
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
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  formData.type.length === 0
                }
              >
                {isSubmitting && (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                )}
                {isSubmitting ? "Đang tạo..." : "Tạo loại đơn từ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Modal */}
        <Dialog
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
        >
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Chỉnh sửa loại đơn từ</DialogTitle>
              <DialogDescription>
                Cập nhật thông tin loại đơn từ
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-6 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='edit-title'>Tên loại đơn từ</Label>
                <Input
                  id='edit-title'
                  placeholder='Nhập tên loại đơn từ...'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className='space-y-3'>
                <Label>Vai trò được phép sử dụng</Label>
                <div className='grid grid-cols-2 gap-4'>
                  {AVAILABLE_ROLES.map((role) => (
                    <div
                      key={role}
                      className='flex items-center space-x-2'
                    >
                      <Checkbox
                        id={`edit-${role}`}
                        checked={formData.type.includes(role)}
                        onCheckedChange={(checked) =>
                          handleRoleToggle(role, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`edit-${role}`}
                        className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
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
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleEditSubmit}
                disabled={
                  isSubmitting ||
                  !formData.title.trim() ||
                  formData.type.length === 0
                }
              >
                {isSubmitting && (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                )}
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
