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
} from "@/api/application-types-api";

const AVAILABLE_ROLES = ["member", "instructor", "staff", "manager"];

export default function ApplicationTypesPage() {
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
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
    setIsMounted(true);
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

  // Loading state similar to applications page
  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>
          Đang tải danh sách loại đơn từ...
        </p>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen from-gray-50 via-white to-gray-50/30 dark:from-black dark:via-gray-900 dark:to-gray-800 transition-all duration-500 animate-in fade-in ${
        isMounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className='container mx-auto px-1 sm:px-2 md:px-4 py-8 max-w-7xl animate-in fade-in duration-500'>
        {/* Header Section */}
        <div className='mb-8 animate-in fade-in duration-700 delay-100'>
          <Link
            href='/dashboard/manager'
            className='inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 group mb-6 focus:outline-none'
          >
            <ArrowLeft className='mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200' />
            Quay lại Trang Chủ
          </Link>

          <div className='flex items-center space-x-4 mb-2'>
            <div className='flex-1'>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-indigo-800 dark:from-white dark:via-gray-200 dark:to-indigo-200 bg-clip-text text-transparent'>
                Quản Lý Loại Đơn Từ
              </h1>
              <p className='text-lg text-gray-600 dark:text-gray-400 mt-1'>
                Cấu hình các loại đơn từ cho từng vai trò người dùng
              </p>
            </div>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={openCreateModal}
                  className='bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black shadow-lg hover:shadow-xl transition-all duration-200'
                  size='lg'
                >
                  <Plus className='h-5 w-5 mr-2' />
                  Tạo loại đơn từ mới
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>

        {/* Stats Section */}
        <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8 animate-in fade-in duration-700 delay-200'>
          <Card className='bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 hover:shadow-xl hover:bg-gray-200/90 dark:hover:bg-black transition-all duration-300 animate-in fade-in-50 delay-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Tổng số loại
                  </p>
                  <div className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
                    {totalTypes}
                  </div>
                </div>
                <div className='p-3 bg-gray-200/80 dark:bg-gray-900/50 rounded-xl'>
                  <FileText className='h-6 w-6 text-gray-700 dark:text-gray-300' />
                </div>
              </div>
            </CardContent>
          </Card>

          {AVAILABLE_ROLES.map((role, index) => {
            // Define role-specific icons
            const getRoleIcon = (role: string) => {
              switch (role) {
                case "member":
                  return (
                    <GraduationCap className='h-6 w-6 text-blue-700 dark:text-blue-300' />
                  );
                case "instructor":
                  return (
                    <UserCheck className='h-6 w-6 text-green-700 dark:text-green-300' />
                  );
                case "staff":
                  return (
                    <Users className='h-6 w-6 text-purple-700 dark:text-purple-300' />
                  );
                case "manager":
                  return (
                    <Crown className='h-6 w-6 text-orange-700 dark:text-orange-300' />
                  );
                default:
                  return (
                    <Users className='h-6 w-6 text-gray-700 dark:text-gray-300' />
                  );
              }
            };

            // Define role-specific background colors
            const getRoleBackground = (role: string) => {
              switch (role) {
                case "member":
                  return "bg-blue-200/80 dark:bg-blue-900/50";
                case "instructor":
                  return "bg-green-200/80 dark:bg-green-900/50";
                case "staff":
                  return "bg-purple-200/80 dark:bg-purple-900/50";
                case "manager":
                  return "bg-orange-200/80 dark:bg-orange-900/50";
                default:
                  return "bg-gray-200/80 dark:bg-gray-900/50";
              }
            };

            // Get delay class for staggered animation
            const getDelayClass = (index: number) => {
              const delays = [
                "delay-200",
                "delay-300",
                "delay-500",
                "delay-700",
              ];
              return delays[index] || "delay-200";
            };

            return (
              <Card
                key={role}
                className={`bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 hover:shadow-xl hover:bg-gray-200/90 dark:hover:bg-black transition-all duration-300 animate-in fade-in-50 ${getDelayClass(
                  index
                )}`}
              >
                <CardContent className='p-6'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {getRoleDisplayName(role)}
                      </p>
                      <div className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
                        {typesByRole[role]}
                      </div>
                    </div>
                    <div
                      className={`p-3 ${getRoleBackground(role)} rounded-xl`}
                    >
                      {getRoleIcon(role)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filter Section */}
        <Card className='bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 shadow-xl mb-6 animate-in fade-in duration-700 delay-300'>
          <CardContent className='p-6'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                <Input
                  placeholder='Tìm kiếm theo tên loại đơn từ...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
              <div className='sm:w-48'>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
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
          </CardContent>
        </Card>

        {/* Application Types List */}
        <Card className='bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 shadow-xl animate-in fade-in duration-700 delay-500'>
          <CardHeader className='border-b border-gray-400 dark:border-gray-800 bg-gray-200/70 dark:bg-black/70'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-xl font-bold text-gray-800 dark:text-white'>
                Danh Sách Loại Đơn Từ
              </CardTitle>
              {isLoading && (
                <Loader2 className='h-5 w-5 animate-spin text-gray-500 dark:text-gray-400' />
              )}
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='p-6 space-y-4'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className='flex items-center space-x-4 p-4 bg-gray-200/50 dark:bg-gray-900/50 rounded-xl animate-pulse'
                  >
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 w-3/4 bg-gray-400 dark:bg-gray-700 rounded' />
                      <div className='h-3 w-1/2 bg-gray-400 dark:bg-gray-700 rounded' />
                    </div>
                    <div className='h-8 w-20 bg-gray-400 dark:bg-gray-700 rounded' />
                  </div>
                ))}
              </div>
            ) : filteredTypes.length > 0 ? (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow className='border-gray-300 dark:border-gray-700'>
                      <TableHead className='text-gray-700 dark:text-gray-300 font-semibold'>
                        Tên Loại Đơn Từ
                      </TableHead>
                      <TableHead className='text-gray-700 dark:text-gray-300 font-semibold'>
                        Vai Trò Được Phép
                      </TableHead>
                      <TableHead className='text-gray-700 dark:text-gray-300 font-semibold'>
                        Ngày Tạo
                      </TableHead>
                      <TableHead className='text-gray-700 dark:text-gray-300 font-semibold text-right'>
                        Thao Tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTypes.map((type) => (
                      <TableRow
                        key={type._id}
                        className='border-gray-300 dark:border-gray-700 hover:bg-gray-200/60 dark:hover:bg-gray-900/50 transition-colors'
                      >
                        <TableCell className='font-medium text-gray-800 dark:text-white'>
                          {type.title}
                        </TableCell>
                        <TableCell>
                          <div className='flex flex-wrap gap-2'>
                            {type.type.map((role) => (
                              <Badge
                                key={role}
                                variant='secondary'
                                className={`${getRoleColorClass(
                                  role
                                )} shadow-sm`}
                              >
                                {getRoleDisplayName(role)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className='text-gray-600 dark:text-gray-400'>
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
                              className='hover:bg-gray-100 dark:hover:bg-gray-800'
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
                                  className='hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </AlertDialogTrigger>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <div className='relative mb-6'>
                  <div className='w-20 h-20 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-lg'>
                    <FileText className='h-10 w-10 text-gray-500 dark:text-gray-400' />
                  </div>
                </div>
                <h3 className='text-xl font-semibold text-gray-800 dark:text-white mb-2'>
                  {searchTerm || selectedRoleFilter
                    ? "Không tìm thấy kết quả"
                    : "Chưa có loại đơn từ nào"}
                </h3>
                <p className='text-gray-600 dark:text-gray-300 max-w-md'>
                  {searchTerm || selectedRoleFilter
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                    : "Hãy tạo loại đơn từ đầu tiên để bắt đầu"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
        >
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle className='text-xl font-bold text-black dark:text-white'>
                Tạo Loại Đơn Từ Mới
              </DialogTitle>
              <DialogDescription>
                Tạo một loại đơn từ mới để người dùng có thể sử dụng
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-6 py-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='title'
                  className='text-sm font-medium'
                >
                  Tên loại đơn từ <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='title'
                  placeholder='Ví dụ: Đơn xin nghỉ phép, Đăng ký khóa học...'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className='space-y-3'>
                <Label className='text-sm font-medium'>
                  Vai trò được phép sử dụng{" "}
                  <span className='text-red-500'>*</span>
                </Label>
                <div className='grid grid-cols-2 gap-3'>
                  {AVAILABLE_ROLES.map((role) => (
                    <div
                      key={role}
                      className='flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
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
                        className='text-sm font-medium cursor-pointer'
                      >
                        {getRoleDisplayName(role)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className='flex gap-2'>
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
                className='bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black'
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
              <DialogTitle className='text-xl font-bold text-black dark:text-white'>
                Chỉnh Sửa Loại Đơn Từ
              </DialogTitle>
              <DialogDescription>
                Cập nhật thông tin loại đơn từ
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-6 py-4'>
              <div className='space-y-2'>
                <Label
                  htmlFor='edit-title'
                  className='text-sm font-medium'
                >
                  Tên loại đơn từ <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='edit-title'
                  placeholder='Ví dụ: Đơn xin nghỉ phép, Đăng ký khóa học...'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>

              <div className='space-y-3'>
                <Label className='text-sm font-medium'>
                  Vai trò được phép sử dụng{" "}
                  <span className='text-red-500'>*</span>
                </Label>
                <div className='grid grid-cols-2 gap-3'>
                  {AVAILABLE_ROLES.map((role) => (
                    <div
                      key={role}
                      className='flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
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
                        className='text-sm font-medium cursor-pointer'
                      >
                        {getRoleDisplayName(role)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className='flex gap-2'>
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
                className='bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black'
              >
                {isSubmitting && (
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                )}
                {isSubmitting ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Modal */}
        <AlertDialog
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa loại đơn từ "
                <strong>{currentItem?.title}</strong>"? Hành động này không thể
                hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isSubmitting}
                className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
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
    </div>
  );
}
