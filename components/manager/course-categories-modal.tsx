"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Edit, Trash2, Save, X, Settings } from "lucide-react";
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
import {
  fetchAllCourseCategories,
  createCourseCategory,
  updateCourseCategory,
  deleteCourseCategory,
  type CourseCategory,
} from "@/api/manager/course-categories";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

interface CourseCategoriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesUpdated?: () => void;
}

export default function CourseCategoriesModal({
  open,
  onOpenChange,
  onCategoriesUpdated,
}: CourseCategoriesModalProps) {
  const { toast } = useToast();

  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form states
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newCategoryActive, setNewCategoryActive] = useState(true);
  const [editCategoryTitle, setEditCategoryTitle] = useState("");
  const [editCategoryActive, setEditCategoryActive] = useState(true);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] =
    useState<CourseCategory | null>(null);

  // Load categories when modal opens
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId) {
        throw new Error("Thiếu thông tin tenant");
      }

      const data = await fetchAllCourseCategories({
        tenantId,
        token: token || undefined,
      });
      setCategories(data);
    } catch (error: any) {
      console.error("Error loading categories:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách danh mục",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryTitle.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên danh mục",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate titles
    if (
      categories.some(
        (cat) =>
          cat.title.toLowerCase() === newCategoryTitle.trim().toLowerCase()
      )
    ) {
      toast({
        title: "Lỗi",
        description: "Tên danh mục đã tồn tại",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      await createCourseCategory({
        title: newCategoryTitle.trim(),
        is_active: newCategoryActive,
        tenantId,
        token,
      });

      toast({
        title: "Thành công",
        description: "Đã tạo danh mục mới",
      });

      setNewCategoryTitle("");
      setNewCategoryActive(true);
      await loadCategories();
      onCategoriesUpdated?.();
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo danh mục",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditCategory = (category: CourseCategory) => {
    setEditing(category._id);
    setEditCategoryTitle(category.title);
    setEditCategoryActive(category.is_active ?? true);
  };

  const handleSaveEdit = async (categoryId: string) => {
    if (!editCategoryTitle.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên danh mục",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate titles (excluding current category)
    if (
      categories.some(
        (cat) =>
          cat._id !== categoryId &&
          cat.title.toLowerCase() === editCategoryTitle.trim().toLowerCase()
      )
    ) {
      toast({
        title: "Lỗi",
        description: "Tên danh mục đã tồn tại",
        variant: "destructive",
      });
      return;
    }

    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      await updateCourseCategory({
        categoryId,
        title: editCategoryTitle.trim(),
        is_active: editCategoryActive,
        tenantId,
        token,
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật danh mục",
      });

      setEditing(null);
      setEditCategoryTitle("");
      await loadCategories();
      onCategoriesUpdated?.();
    } catch (error: any) {
      console.error("Error updating category:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật danh mục",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditCategoryTitle("");
    setEditCategoryActive(true);
  };

  const handleDeleteClick = (category: CourseCategory) => {
    setCategoryToDelete(category);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeleting(categoryToDelete._id);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      await deleteCourseCategory({
        categoryId: categoryToDelete._id,
        tenantId,
        token,
      });

      toast({
        title: "Thành công",
        description: "Đã xóa danh mục",
      });

      await loadCategories();
      onCategoriesUpdated?.();
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa danh mục",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              Quản lý danh mục khóa học
            </DialogTitle>
            <DialogDescription>
              Thêm, sửa, xóa các danh mục để phân loại khóa học
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6'>
            {/* Add new category form */}
            <div className='mb-6 p-4 border rounded-lg bg-muted/50'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                <div>
                  <Label htmlFor='new-category'>Tên danh mục</Label>
                  <Input
                    id='new-category'
                    placeholder='Nhập tên danh mục...'
                    value={newCategoryTitle}
                    onChange={(e) => setNewCategoryTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !creating) {
                        handleCreateCategory();
                      }
                    }}
                    disabled={creating}
                  />
                </div>
                <div className='flex items-center space-x-2'>
                  <Switch
                    id='new-category-active'
                    checked={newCategoryActive}
                    onCheckedChange={setNewCategoryActive}
                    disabled={creating}
                  />
                  <Label htmlFor='new-category-active'>
                    Trạng thái hoạt động
                  </Label>
                </div>
              </div>
              <div className='flex justify-end'>
                <Button
                  onClick={handleCreateCategory}
                  disabled={creating || !newCategoryTitle.trim()}
                >
                  {creating ? (
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  ) : (
                    <Plus className='h-4 w-4 mr-2' />
                  )}
                  Thêm
                </Button>
              </div>
            </div>

            {/* Categories table */}
            <div>
              <h4 className='font-medium mb-4'>
                Danh sách danh mục ({categories.length})
              </h4>

              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-8 w-8 animate-spin' />
                  <span className='ml-2'>Đang tải...</span>
                </div>
              ) : (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên danh mục</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Người tạo</TableHead>
                        <TableHead className='w-32'>Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.length > 0 ? (
                        categories.map((category) => (
                          <TableRow key={category._id}>
                            <TableCell>
                              {editing === category._id ? (
                                <Input
                                  value={editCategoryTitle}
                                  onChange={(e) =>
                                    setEditCategoryTitle(e.target.value)
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveEdit(category._id);
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  autoFocus
                                />
                              ) : (
                                <span className='font-medium'>
                                  {category.title}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editing === category._id ? (
                                <div className='flex items-center space-x-2'>
                                  <Switch
                                    checked={editCategoryActive}
                                    onCheckedChange={setEditCategoryActive}
                                  />
                                  <Label className='text-sm'>
                                    {editCategoryActive
                                      ? "Hoạt động"
                                      : "Không hoạt động"}
                                  </Label>
                                </div>
                              ) : (
                                <Badge
                                  variant='outline'
                                  className={
                                    category.is_active !== false
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-gray-50 text-gray-700 border-gray-200"
                                  }
                                >
                                  {category.is_active !== false
                                    ? "Hoạt động"
                                    : "Không hoạt động"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {formatDate(category.created_at)}
                            </TableCell>
                            <TableCell>
                              {category.created_by?.username || "N/A"}
                            </TableCell>
                            <TableCell>
                              {editing === category._id ? (
                                <div className='flex gap-1'>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => handleSaveEdit(category._id)}
                                  >
                                    <Save className='h-3 w-3' />
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={handleCancelEdit}
                                  >
                                    <X className='h-3 w-3' />
                                  </Button>
                                </div>
                              ) : (
                                <div className='flex gap-1'>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => handleEditCategory(category)}
                                  >
                                    <Edit className='h-3 w-3' />
                                  </Button>
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    onClick={() => handleDeleteClick(category)}
                                    disabled={deleting === category._id}
                                  >
                                    {deleting === category._id ? (
                                      <Loader2 className='h-3 w-3 animate-spin' />
                                    ) : (
                                      <Trash2 className='h-3 w-3' />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className='text-center py-8 text-muted-foreground'
                          >
                            Chưa có danh mục nào được tạo
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục "{categoryToDelete?.title}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteConfirmOpen(false);
                setCategoryToDelete(null);
              }}
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
