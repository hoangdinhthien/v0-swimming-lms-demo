"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bell, Calendar, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Trang chi tiết thông báo
export default function NotificationDetailPage() {
  const params = useParams();
  const notificationId = params?.id as string;
  const [notification, setNotification] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock notification data - in real app, you'd fetch by ID
    const mockNotification = {
      id: notificationId,
      title: "New Student Registration",
      message: "John Doe has registered for the Beginner Swimming course. Please review the registration details and confirm enrollment.",
      type: "info",
      timestamp: "2 hours ago",
      fullDate: "June 19, 2025 at 2:30 PM",
      read: false,
      details: {
        studentName: "John Doe",
        course: "Beginner Swimming",
        registrationDate: "June 19, 2025",
        paymentStatus: "Completed",
        amount: "$150.00"
      }
    };

    setNotification(mockNotification);
    setLoading(false);
  }, [notificationId]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success": return "bg-green-100 text-green-800";
      case "warning": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Thông báo không tồn tại</h2>
        <p className="text-gray-600 mt-2">Thông báo bạn đang tìm kiếm không tồn tại.</p>
        <Link href="/dashboard/manager/notifications">
          <Button className="mt-4">Quay lại Thông báo</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/dashboard/manager/notifications"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay lại Thông báo
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  <h1 className="text-2xl font-bold">{notification.title}</h1>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {notification.fullDate}
                  </div>
                  <Badge className={getTypeColor(notification.type)}>
                    {notification.type}
                  </Badge>
                </div>
              </div>
              <Button>Đ đánh dấu là đã đọc</Button>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed">{notification.message}</p>
          </CardContent>
        </Card>

        {notification.details && (
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Tên học viên:</span>
                  <span className="text-sm">{notification.details.studentName}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Khóa học:</span>
                  <span className="text-sm">{notification.details.course}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Ngày đăng ký:</span>
                  <span className="text-sm">{notification.details.registrationDate}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Trạng thái thanh toán:</span>
                  <Badge variant="outline" className="text-green-600">
                    {notification.details.paymentStatus}
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Số tiền:</span>
                  <span className="text-sm font-semibold">{notification.details.amount}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <Button>Thực hiện hành động</Button>
          <Button variant="outline">Lưu trữ</Button>
          <Button variant="outline">Xóa</Button>
        </div>
      </div>
    </>
  );
}
