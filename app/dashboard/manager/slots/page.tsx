"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  fetchAllSlots,
  createSlot,
  updateSlot,
  deleteSlot,
  formatTime,
  type SlotDetail,
  type CreateSlotData,
} from "@/api/manager/slot-api";

export default function SlotsPage() {
  const { toast } = useToast();
  const [slots, setSlots] = useState<SlotDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SlotDetail | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<SlotDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateSlotData>({
    title: "",
    start_time: 0,
    end_time: 0,
    duration: "",
    start_minute: 0,
    end_minute: 0,
  });

  // Load slots
  const loadSlots = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      const data = await fetchAllSlots(tenantId, token);
      setSlots(data);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tải danh sách slots",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, []);

  // Handle create/edit modal open
  const handleOpenModal = (slot?: SlotDetail) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({
        title: slot.title,
        start_time: slot.start_time,
        end_time: slot.end_time,
        duration: slot.duration,
        start_minute: slot.start_minute,
        end_minute: slot.end_minute,
      });
    } else {
      setEditingSlot(null);
      setFormData({
        title: "",
        start_time: 0,
        end_time: 0,
        duration: "",
        start_minute: 0,
        end_minute: 0,
      });
    }
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      if (editingSlot) {
        await updateSlot(editingSlot._id, formData, tenantId, token);
        toast({
          title: "Thành công",
          description: "Đã cập nhật slot thành công",
        });
      } else {
        await createSlot(formData, tenantId, token);
        toast({
          title: "Thành công",
          description: "Đã tạo slot mới thành công",
        });
      }

      setIsModalOpen(false);
      loadSlots(true);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể lưu slot",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deletingSlot) return;

    setSubmitting(true);

    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        throw new Error("Thiếu thông tin xác thực");
      }

      await deleteSlot(deletingSlot._id, tenantId, token);
      toast({
        title: "Thành công",
        description: "Đã xóa slot thành công",
      });

      setIsDeleteDialogOpen(false);
      setDeletingSlot(null);
      loadSlots(true);
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể xóa slot",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle open delete dialog
  const handleOpenDeleteDialog = (slot: SlotDetail) => {
    setDeletingSlot(slot);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Quản lý Slots</h1>
          <p className='text-muted-foreground'>
            Quản lý các khung giờ học trong hệ thống
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => loadSlots(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => handleOpenModal()}>
            <Plus className='h-4 w-4 mr-2' />
            Thêm Slot Mới
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : slots.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              Chưa có slot nào. Hãy tạo slot đầu tiên!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Slot</TableHead>
                  <TableHead>Thời gian bắt đầu</TableHead>
                  <TableHead>Thời gian kết thúc</TableHead>
                  <TableHead>Thời lượng</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot._id}>
                    <TableCell className='font-medium'>{slot.title}</TableCell>
                    <TableCell>
                      {formatTime(slot.start_time, slot.start_minute)}
                    </TableCell>
                    <TableCell>
                      {formatTime(slot.end_time, slot.end_minute)}
                    </TableCell>
                    <TableCell>{slot.duration}</TableCell>
                    <TableCell className='text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleOpenModal(slot)}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleOpenDeleteDialog(slot)}
                        >
                          <Trash2 className='h-4 w-4 text-red-500' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      >
        <DialogContent className='sm:max-w-[500px]'>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingSlot ? "Chỉnh sửa Slot" : "Tạo Slot Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingSlot
                  ? "Cập nhật thông tin slot"
                  : "Điền thông tin để tạo slot mới"}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='title'>
                  Tên Slot <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='title'
                  placeholder='VD: Slot 1'
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='start_time'>
                    Giờ bắt đầu <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='start_time'
                    type='number'
                    min='0'
                    max='23'
                    placeholder='0-23'
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_time: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='start_minute'>
                    Phút bắt đầu <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='start_minute'
                    type='number'
                    min='0'
                    max='59'
                    placeholder='0-59'
                    value={formData.start_minute}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_minute: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='end_time'>
                    Giờ kết thúc <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='end_time'
                    type='number'
                    min='0'
                    max='23'
                    placeholder='0-23'
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        end_time: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='end_minute'>
                    Phút kết thúc <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    id='end_minute'
                    type='number'
                    min='0'
                    max='59'
                    placeholder='0-59'
                    value={formData.end_minute}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        end_minute: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='duration'>
                  Thời lượng <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='duration'
                  placeholder='VD: 45 phút'
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
              >
                Hủy
              </Button>
              <Button
                type='submit'
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    Đang lưu...
                  </>
                ) : editingSlot ? (
                  "Cập nhật"
                ) : (
                  "Tạo mới"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa slot "{deletingSlot?.title}"? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className='bg-red-500 hover:bg-red-600'
            >
              {submitting ? (
                <>
                  <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                  Đang xóa...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
