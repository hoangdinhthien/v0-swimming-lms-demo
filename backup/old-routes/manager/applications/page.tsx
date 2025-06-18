"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Mail, User } from "lucide-react";
import {
  getApplications,
  getApplicationDetail,
  Application,
} from "@/api/applications-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchApplications() {
      setLoading(true);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token)
          throw new Error("Thiếu thông tin tenant hoặc token");
        const apps = await getApplications(tenantId, token);
        setApplications(apps);
      } catch (e) {
        setApplications([]);
      }
      setLoading(false);
    }
    fetchApplications();
  }, []);

  async function handleShowDetail(id: string) {
    setDetailLoading(true);
    setDialogOpen(true);
    try {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();
      if (!tenantId || !token)
        throw new Error("Thiếu thông tin tenant hoặc token");
      const detail = await getApplicationDetail(id, tenantId, token);
      setSelectedApp(detail);
    } catch {
      setSelectedApp(null);
    }
    setDetailLoading(false);
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Đơn từ</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả các đơn từ gửi lên trong hệ thống
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đơn từ</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Đang tải dữ liệu...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead>Người gửi</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Phản hồi</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell className='font-medium'>{app.title}</TableCell>
                    <TableCell>{app.content}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        <span>
                          {app.created_by?.username || app.created_by?.email}
                        </span>
                        <Mail className='h-4 w-4 ml-2' />
                        <span>{app.created_by?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(app.created_at).toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      {app.status.map((s) => (
                        <Badge
                          key={s}
                          variant={
                            s === "Accepted"
                              ? "default"
                              : s === "Rejected"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {s}
                        </Badge>
                      ))}
                    </TableCell>
                    <TableCell>
                      {app.reply_content || (
                        <span className='text-muted-foreground'>
                          Chưa phản hồi
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/manager/applications/${app._id}`}>
                        <Button
                          variant='ghost'
                          size='sm'
                        >
                          Xem chi tiết
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
