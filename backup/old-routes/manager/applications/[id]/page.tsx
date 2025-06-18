"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getApplicationDetail } from "@/api/applications-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Mail, User } from "lucide-react";

export default function ApplicationDetailPage() {
  const params = useParams();
  const applicationId = params?.id as string;
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplication() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken() ?? undefined;
        if (!tenantId || !token || !applicationId)
          throw new Error("Thiếu thông tin tenant, token hoặc applicationId");
        const appData = await getApplicationDetail(
          applicationId,
          tenantId,
          token
        );
        setApplication(appData);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setApplication(null);
      }
      setLoading(false);
    }
    if (applicationId) loadApplication();
  }, [applicationId]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <div>Đang tải chi tiết đơn từ...</div>
      </div>
    );
  }

  if (error) {
    return <div className='text-red-500 p-8'>{error}</div>;
  }

  if (!application) {
    return <div className='p-8'>Không tìm thấy đơn từ.</div>;
  }

  return (
    <>
      <div className='container mx-auto mb-4 pt-6'>
        <Link
          href='/dashboard/manager/applications'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' /> Quay về danh sách đơn từ
        </Link>
      </div>

      <div className='container mx-auto bg-card rounded-lg shadow p-4 md:p-6 mb-6'>
        <h1 className='text-2xl font-bold mb-2 text-foreground'>
          {application.title}
        </h1>
        <div className='flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-4'>
          <div className='flex items-center gap-1'>
            <User className='h-4 w-4' />
            <span>
              {application.created_by?.username ||
                application.created_by?.email}
            </span>
            <Mail className='h-4 w-4 ml-2' />
            <span>{application.created_by?.email}</span>
          </div>
          <Badge
            variant='outline'
            className={
              application.status.includes("Accepted")
                ? "bg-green-50 text-green-700 border-green-200"
                : application.status.includes("Rejected")
                ? "bg-gray-50 text-gray-700 border-gray-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }
          >
            {application.status.join(", ")}
          </Badge>
          <div className='flex items-center gap-1'>
            <span>
              Ngày gửi:{" "}
              {application.created_at
                ? new Date(application.created_at).toLocaleDateString("vi-VN")
                : "-"}
            </span>
          </div>
        </div>
        <div className='text-base mb-4 whitespace-pre-wrap text-foreground'>
          {application.content}
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-4'>
          <div>
            <div className='font-medium text-foreground'>Phản hồi</div>
            <div>
              {application.reply_content || (
                <span className='text-muted-foreground'>Chưa phản hồi</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
