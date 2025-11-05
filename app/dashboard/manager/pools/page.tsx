"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, RefreshCw, Loader2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { columns, Pool } from "./components/columns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { fetchPools, createPool } from "@/api/manager/pools-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

export default function PoolsPage() {
  const { toast } = useToast();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    dimensions: "",
    depth: "",
    capacity: "",
    is_active: true,
  });

  // Load pools
  const loadPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");

      const result = await fetchPools(
        { page: 1, limit: 1000 },
        tenantId,
        token
      );
      setPools(result.pools || []);
    } catch (e: any) {
      setError(e?.message || "Lỗi khi tải danh sách hồ bơi");
      setPools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPools();
      toast({
        title: "Đã làm mới",
        description: "Dữ liệu hồ bơi đã được cập nhật",
      });
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

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle create pool
  const handleCreatePool = async () => {
    if (
      !formData.title.trim() ||
      !formData.dimensions.trim() ||
      !formData.depth.trim() ||
      !formData.capacity
    ) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const requestBody = {
        title: formData.title,
        type: formData.type || undefined,
        dimensions: `${formData.dimensions} mét`,
        depth: `${formData.depth} mét`,
        capacity: parseInt(formData.capacity),
        is_active: formData.is_active,
      };

      await createPool(requestBody);

      // Reset form and close modal
      setFormData({
        title: "",
        type: "",
        dimensions: "",
        depth: "",
        capacity: "",
        is_active: true,
      });
      setIsModalOpen(false);

      // Refresh the pools list
      await loadPools();
      toast({
        title: "Thành công",
        description: "Tạo hồ bơi thành công!",
      });
    } catch (error) {
      console.error("Error creating pool:", error);
      toast({
        title: "Lỗi tạo hồ bơi",
        description:
          error instanceof Error ? error.message : "Không thể tạo hồ bơi",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Reset form when modal closes
  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({
      title: "",
      type: "",
      dimensions: "",
      depth: "",
      capacity: "",
      is_active: true,
    });
  };

  const totalCapacity = pools.reduce((s, p) => s + (p.capacity || 0), 0);
  const inactiveCount = pools.filter((p) => !p.is_active).length;

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải danh sách hồ bơi...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>
            Lỗi tải dữ liệu
          </div>
          <p className='text-muted-foreground'>{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
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
          <h1 className='text-3xl font-bold'>Quản lý Hồ Bơi</h1>
          <p className='text-muted-foreground'>
            Quản lý thông tin các hồ bơi tại trung tâm
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Thêm hồ bơi
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Thêm hồ bơi mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin để tạo hồ bơi mới cho trung tâm
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='title'>Tên hồ bơi *</Label>
                  <Input
                    id='title'
                    placeholder='Nhập tên hồ bơi...'
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='type'>Loại hồ bơi</Label>
                  <Input
                    id='type'
                    placeholder='Ví dụ: Trẻ em, Trung bình, Lớn...'
                    value={formData.type}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='dimensions'>Kích thước (mét) *</Label>
                    <Input
                      id='dimensions'
                      type='number'
                      placeholder='Ví dụ: 10'
                      value={formData.dimensions}
                      onChange={(e) =>
                        handleInputChange("dimensions", e.target.value)
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='depth'>Độ sâu (mét) *</Label>
                    <Input
                      id='depth'
                      type='number'
                      placeholder='Ví dụ: 1.2'
                      value={formData.depth}
                      onChange={(e) =>
                        handleInputChange("depth", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='capacity'>Sức chứa *</Label>
                  <Input
                    id='capacity'
                    type='number'
                    placeholder='Nhập sức chứa...'
                    value={formData.capacity}
                    onChange={(e) =>
                      handleInputChange("capacity", e.target.value)
                    }
                  />
                </div>

                <div className='flex items-center justify-between'>
                  <Label htmlFor='is_active'>Trạng thái hoạt động</Label>
                  <Switch
                    id='is_active'
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_active", checked)
                    }
                  />
                </div>
              </div>

              <div className='flex justify-end gap-2 mt-6'>
                <Button
                  variant='outline'
                  onClick={handleModalClose}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreatePool}
                  disabled={isCreating}
                >
                  {isCreating ? "Đang tạo..." : "Tạo hồ bơi"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3 mt-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng số hồ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Waves className='h-8 w-8 text-primary' />
              <div className='text-2xl font-bold'>{pools.length}</div>
            </div>
            <p className='text-xs text-muted-foreground'>Tổng số hồ hiện có</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng sức chứa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalCapacity}</div>
            <p className='text-xs text-muted-foreground'>
              Tổng số người có thể chứa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Không hoạt động
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{inactiveCount}</div>
            <p className='text-xs text-muted-foreground'>Hồ không hoạt động</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách hồ bơi</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pools}
            searchKey='title'
            searchPlaceholder='Tìm kiếm theo tên hồ bơi...'
            filterOptions={[
              {
                columnId: "is_active",
                title: "Trạng thái",
                options: [
                  { label: "Hoạt động", value: "true" },
                  { label: "Không hoạt động", value: "false" },
                ],
              },
            ]}
            emptyMessage='Không tìm thấy hồ bơi nào.'
          />
        </CardContent>
      </Card>
    </>
  );
}
