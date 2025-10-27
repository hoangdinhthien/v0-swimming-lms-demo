"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Search, Plus } from "lucide-react";
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
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { fetchPools, Pool } from "@/api/manager/pools-api";

export default function PoolsPage() {
  const [poolsData, setPoolsData] = useState<{
    pools: Pool[];
    meta: { count: number; page: number; limit: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    let mounted = true;
    async function load() {
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
        if (!mounted) return;
        setPoolsData(result);
      } catch (e: any) {
        setError(e?.message || "Lỗi khi tải danh sách hồ bơi");
        setPoolsData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []); // Remove searchQuery from dependencies

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
          <Button variant='outline'>Xuất dữ liệu</Button>
          <Link href='/dashboard/manager/pools/new'>
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Thêm hồ bơi
            </Button>
          </Link>
        </div>
      </div>

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
                  <TableRow key={p._id}>
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
