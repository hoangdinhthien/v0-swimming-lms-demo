"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import {
  fetchPools,
  Pool,
  createPool,
  getPoolDetail,
  updatePool,
} from "@/api/manager/pools-api";
import { getUserFrontendRole } from "@/api/role-utils";
import { useToast } from "@/hooks/use-toast";

export default function PoolsPage() {
  const { toast } = useToast();
  const [poolsData, setPoolsData] = useState<{
    pools: Pool[];
    meta: { count: number; page: number; limit: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Detail/Update modal state
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Update form state
  const [updateFormData, setUpdateFormData] = useState({
    title: "",
    type: "",
    dimensions: "",
    depth: "",
    capacity: "",
    is_active: true,
  });

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    dimensions: "",
    depth: "",
    capacity: "",
    is_active: true,
  });

  // Extract load logic
  const loadPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");
      // Fetch all pools for client-side search and pagination
      const result = await fetchPools(
        { page: 1, limit: 1000 }, // Fetch all pools
        tenantId,
        token
      );
      setPoolsData(result);
    } catch (e: any) {
      setError(e?.message || "Lỗi khi tải danh sách hồ bơi");
      setPoolsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []); // Remove searchQuery from dependencies

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
      const result = await fetchPools(
        { page: 1, limit: 1000 },
        undefined,
        undefined
      );
      setPoolsData(result);
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

  // Handle pool row click to show detail
  const handlePoolClick = async (pool: Pool) => {
    setSelectedPool(pool);
    setIsDetailModalOpen(true);
    setIsEditing(false);

    // Load pool details
    try {
      const poolDetail = await getPoolDetail(pool._id);
      setSelectedPool(poolDetail);

      // Initialize update form with current data
      setUpdateFormData({
        title: poolDetail.title,
        type: poolDetail.type || "",
        dimensions: poolDetail.dimensions
          ? poolDetail.dimensions.replace(" mét", "")
          : "",
        depth: poolDetail.depth ? poolDetail.depth.replace(" mét", "") : "",
        capacity: poolDetail.capacity?.toString() || "",
        is_active: poolDetail.is_active,
      });
    } catch (error) {
      console.error("Error loading pool details:", error);
      toast({
        title: "Lỗi tải chi tiết",
        description: "Không thể tải chi tiết hồ bơi",
        variant: "destructive",
      });
    }
  };

  // Handle update form input changes
  const handleUpdateInputChange = (field: string, value: any) => {
    setUpdateFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle update pool
  const handleUpdatePool = async () => {
    if (!selectedPool) return;

    if (
      !updateFormData.title.trim() ||
      !updateFormData.dimensions.trim() ||
      !updateFormData.depth.trim() ||
      !updateFormData.capacity
    ) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const requestBody = {
        title: updateFormData.title,
        type: updateFormData.type || undefined,
        dimensions: `${updateFormData.dimensions} mét`,
        depth: `${updateFormData.depth} mét`,
        capacity: parseInt(updateFormData.capacity),
        is_active: updateFormData.is_active,
      };

      await updatePool(selectedPool._id, requestBody);

      // Update local state
      if (poolsData) {
        const updatedPools = poolsData.pools.map((p) =>
          p._id === selectedPool._id ? { ...p, ...requestBody } : p
        );
        setPoolsData({ ...poolsData, pools: updatedPools });
      }

      setIsEditing(false);
      toast({
        title: "Thành công",
        description: "Cập nhật hồ bơi thành công!",
      });
    } catch (error) {
      console.error("Error updating pool:", error);
      toast({
        title: "Lỗi cập nhật",
        description:
          error instanceof Error ? error.message : "Không thể cập nhật hồ bơi",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle detail modal close
  const handleDetailModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedPool(null);
    setIsEditing(false);
  };

  const pools = poolsData?.pools || [];

  // Client-side filtering
  const filteredPools = pools.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title || "").toLowerCase().includes(q) ||
      (p.type || "").toLowerCase().includes(q) ||
      (p._id || "").toLowerCase().includes(q)
    );
  });

  // Client-side pagination
  const total = filteredPools.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const paginatedPools = filteredPools.slice((page - 1) * limit, page * limit);

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
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay lại Dashboard
        </Link>
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
          <Button variant='outline'>Xuất dữ liệu</Button>
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
                    placeholder='Số người tối đa...'
                    value={formData.capacity}
                    onChange={(e) =>
                      handleInputChange("capacity", e.target.value)
                    }
                  />
                </div>

                <div className='flex items-center space-x-2'>
                  <Checkbox
                    id='is_active'
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      handleInputChange("is_active", checked)
                    }
                  />
                  <Label htmlFor='is_active'>Hồ bơi đang hoạt động</Label>
                </div>
              </div>
              <DialogFooter>
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
                  {isCreating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo hồ bơi"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pool Detail/Update Modal */}
      <Dialog
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      >
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Chỉnh sửa hồ bơi" : "Chi tiết hồ bơi"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Cập nhật thông tin hồ bơi"
                : "Xem thông tin chi tiết của hồ bơi"}
            </DialogDescription>
          </DialogHeader>

          {selectedPool && (
            <div className='space-y-6'>
              {!isEditing ? (
                // View mode
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm font-medium'>Tên hồ bơi</Label>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {selectedPool.title}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium'>Loại hồ bơi</Label>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {selectedPool.type || "Không có"}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm font-medium'>Kích thước</Label>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {selectedPool.dimensions || "Không có"}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium'>Độ sâu</Label>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {selectedPool.depth || "Không có"}
                      </p>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label className='text-sm font-medium'>Sức chứa</Label>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {selectedPool.capacity ?? "Không có"}
                      </p>
                    </div>
                    <div>
                      <Label className='text-sm font-medium'>Trạng thái</Label>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {selectedPool.is_active
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </p>
                    </div>
                  </div>

                  {(selectedPool.created_at || selectedPool.updated_at) && (
                    <div className='grid grid-cols-2 gap-4 pt-4 border-t'>
                      <div>
                        <Label className='text-sm font-medium'>Ngày tạo</Label>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {selectedPool.created_at
                            ? new Date(selectedPool.created_at).toLocaleString(
                                "vi-VN"
                              )
                            : "Không có"}
                        </p>
                      </div>
                      <div>
                        <Label className='text-sm font-medium'>
                          Cập nhật lần cuối
                        </Label>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {selectedPool.updated_at
                            ? new Date(selectedPool.updated_at).toLocaleString(
                                "vi-VN"
                              )
                            : "Không có"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Edit mode
                <div className='space-y-6'>
                  <div className='space-y-2'>
                    <Label htmlFor='update-title'>Tên hồ bơi *</Label>
                    <Input
                      id='update-title'
                      placeholder='Nhập tên hồ bơi...'
                      value={updateFormData.title}
                      onChange={(e) =>
                        handleUpdateInputChange("title", e.target.value)
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='update-type'>Loại hồ bơi</Label>
                    <Input
                      id='update-type'
                      placeholder='Ví dụ: Trẻ em, Trung bình, Lớn...'
                      value={updateFormData.type}
                      onChange={(e) =>
                        handleUpdateInputChange("type", e.target.value)
                      }
                    />
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='update-dimensions'>
                        Kích thước (mét) *
                      </Label>
                      <Input
                        id='update-dimensions'
                        type='number'
                        placeholder='Ví dụ: 10'
                        value={updateFormData.dimensions}
                        onChange={(e) =>
                          handleUpdateInputChange("dimensions", e.target.value)
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='update-depth'>Độ sâu (mét) *</Label>
                      <Input
                        id='update-depth'
                        type='number'
                        placeholder='Ví dụ: 1.2'
                        value={updateFormData.depth}
                        onChange={(e) =>
                          handleUpdateInputChange("depth", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='update-capacity'>Sức chứa *</Label>
                    <Input
                      id='update-capacity'
                      type='number'
                      placeholder='Số người tối đa...'
                      value={updateFormData.capacity}
                      onChange={(e) =>
                        handleUpdateInputChange("capacity", e.target.value)
                      }
                    />
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox
                      id='update-is_active'
                      checked={updateFormData.is_active}
                      onCheckedChange={(checked) =>
                        handleUpdateInputChange("is_active", checked)
                      }
                    />
                    <Label htmlFor='update-is_active'>
                      Hồ bơi đang hoạt động
                    </Label>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!isEditing ? (
              <>
                <Button
                  variant='outline'
                  onClick={handleDetailModalClose}
                >
                  Đóng
                </Button>
                <Button onClick={() => setIsEditing(true)}>Chỉnh sửa</Button>
              </>
            ) : (
              <>
                <Button
                  variant='outline'
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleUpdatePool}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Cập nhật"
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='mt-8 grid gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng hồ bơi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{pools.length}</div>
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

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách hồ bơi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm theo tên, loại, ID...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Kích thước / Độ sâu</TableHead>
                  <TableHead>Sức chứa</TableHead>
                  <TableHead>Sử dụng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPools.map((p) => (
                  <TableRow
                    key={p._id}
                    className='cursor-pointer hover:bg-muted/50'
                    onClick={() => handlePoolClick(p)}
                  >
                    <TableCell>
                      <div className='font-medium'>{p.title}</div>
                    </TableCell>
                    <TableCell>{p.type || "-"}</TableCell>
                    <TableCell>
                      {p.dimensions
                        ? `${p.dimensions}${p.depth ? ` / ${p.depth}` : ""}`
                        : p.depth || "-"}
                    </TableCell>
                    <TableCell>{p.capacity ?? "-"}</TableCell>
                    <TableCell>{p.usageCount ?? 0}</TableCell>
                    <TableCell>
                      {p.is_active ? "Hoạt động" : "Không hoạt động"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className='flex items-center justify-between mt-4'>
            <div className='text-sm text-muted-foreground'>
              Hiển thị {(page - 1) * limit + 1} -{" "}
              {Math.min(page * limit, total)} trên {total} kết quả
            </div>
            <div className='flex items-center gap-2'>
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Trước
              </Button>
              <div className='px-3'>
                {page} / {totalPages}
              </div>
              <Button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Tiếp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
