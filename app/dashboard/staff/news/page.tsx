"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Calendar,
  ChevronRight,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStaffNews } from "@/hooks/useStaffData";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsItem } from "@/api/news-api";
import { parseApiResponse } from "@/utils/api-response-parser";

// Helper function to format relative time (adapted from news-api)
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Vừa xong";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
};

export default function StaffNewsPage() {
  const {
    data: staffNewsData,
    loading: isLoading,
    error,
    refetch,
    hasPermission,
  } = useStaffNews();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  useEffect(() => {
    if (staffNewsData) {
      // Use flexible API response parser
      const parsedResponse = parseApiResponse<NewsItem>(staffNewsData);
      setNewsItems(parsedResponse.data);
    }
  }, [staffNewsData]);

  if (!hasPermission) {
    return (
      <div className='min-h-screen from-gray-50 via-white to-gray-50/30 dark:from-black dark:via-gray-900 dark:to-gray-800 transition-colors duration-300'>
        <div className='container mx-auto px-1 sm:px-2 md:px-4 py-8 max-w-7xl'>
          <Alert>
            <AlertDescription>
              Bạn không có quyền xem tin tức. Vui lòng liên hệ quản lý.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen from-gray-50 via-white to-gray-50/30 dark:from-black dark:via-gray-900 dark:to-gray-800 transition-colors duration-300'>
        <div className='container mx-auto px-1 sm:px-2 md:px-4 py-8 max-w-7xl'>
          <div className='mb-8'>
            <Link
              href='/dashboard/staff'
              className='inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 group mb-6 focus:outline-none'
            >
              <ArrowLeft className='mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200' />
              Quay lại Trang Chủ
            </Link>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-indigo-800 dark:from-white dark:via-gray-200 dark:to-indigo-200 bg-clip-text text-transparent'>
                  Tin Tức
                </h1>
                <p className='text-lg text-gray-600 dark:text-gray-400 mt-1'>
                  Xem tất cả tin tức và thông báo
                </p>
              </div>
              <Button
                onClick={refetch}
                variant='outline'
                size='lg'
              >
                <RefreshCw className='h-5 w-5 mr-2' />
                Làm mới
              </Button>
            </div>
          </div>
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách tin tức...</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen from-gray-50 via-white to-gray-50/30 dark:from-black dark:via-gray-900 dark:to-gray-800 transition-colors duration-300'>
      <div className='container mx-auto px-1 sm:px-2 md:px-4 py-8 max-w-7xl'>
        {/* Header Section */}
        <div className='mb-8'>
          <Link
            href='/dashboard/staff'
            className='inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200 group mb-6 focus:outline-none'
          >
            <ArrowLeft className='mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200' />
            Quay lại Trang Chủ
          </Link>

          <div className='flex items-center space-x-4 mb-2'>
            <div className='flex-1'>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-indigo-800 dark:from-white dark:via-gray-200 dark:to-indigo-200 bg-clip-text text-transparent'>
                Tin Tức
              </h1>
              <p className='text-lg text-gray-600 dark:text-gray-400 mt-1'>
                Xem tất cả tin tức và thông báo hệ thống
              </p>
            </div>
            <Button
              onClick={refetch}
              variant='outline'
              size='lg'
            >
              <RefreshCw className='h-5 w-5 mr-2' />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
          <Card className='bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 hover:shadow-xl hover:bg-gray-200/90 dark:hover:bg-black transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Tổng tin tức
                  </p>
                  <div className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
                    {newsItems.length}
                  </div>
                </div>
                <div className='p-3 bg-gray-200/80 dark:bg-gray-900/50 rounded-xl'>
                  <Bell className='h-6 w-6 text-gray-700 dark:text-gray-300' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 hover:shadow-xl hover:bg-gray-200/90 dark:hover:bg-black transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Mới nhất
                  </p>
                  <div className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
                    {newsItems.length > 0
                      ? new Date(newsItems[0]?.created_at).toLocaleDateString(
                          "vi-VN",
                          {
                            day: "2-digit",
                            month: "2-digit",
                          }
                        )
                      : "0"}
                  </div>
                </div>
                <div className='p-3 bg-green-200/80 dark:bg-green-900/50 rounded-xl'>
                  <Calendar className='h-6 w-6 text-green-700 dark:text-green-300' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 hover:shadow-xl hover:bg-gray-200/90 dark:hover:bg-black transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Trạng thái
                  </p>
                  <div className='text-2xl font-bold text-gray-800 dark:text-white mt-1'>
                    Hoạt động
                  </div>
                </div>
                <div className='p-3 bg-emerald-200/80 dark:bg-emerald-900/50 rounded-xl'>
                  <div className='h-6 w-6 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center'>
                    <div className='h-2 w-2 bg-white rounded-full animate-pulse' />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* News List */}
        <Card className='bg-gray-100/90 dark:bg-black/95 backdrop-blur-sm border-gray-300 dark:border-gray-800 shadow-xl'>
          <CardHeader className='border-b border-gray-400 dark:border-gray-800 bg-gray-200/70 dark:bg-black/70'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div>
                  <CardTitle className='text-xl font-bold text-gray-800 dark:text-white'>
                    Danh Sách Tin Tức
                  </CardTitle>
                  <p className='text-sm text-gray-700 dark:text-gray-300 mt-1'>
                    Tất cả tin tức được sắp xếp theo thời gian
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {newsItems.length > 0 ? (
              <div className='divide-y divide-gray-300 dark:divide-gray-800'>
                {newsItems.map((newsItem, index) => (
                  <div
                    key={newsItem._id}
                    className='block group hover:bg-gray-200/60 dark:hover:bg-gray-900/50 transition-all duration-200 focus:outline-none focus:ring-0 focus:border-none'
                  >
                    <div className='flex items-start space-x-4 p-6 group-hover:scale-[1.01] transition-transform duration-200'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between mb-2'>
                          <h3 className='text-base font-semibold text-gray-800 dark:text-white group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors line-clamp-1 pr-4'>
                            {newsItem.title}
                          </h3>
                          <ChevronRight className='h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0' />
                        </div>

                        <p className='text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors'>
                          {newsItem.content}
                        </p>

                        <div className='flex items-center justify-between'>
                          <Badge
                            variant='secondary'
                            className={`${
                              index % 3 === 0
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
                                : index % 3 === 1
                                ? "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                                : "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                            } shadow-sm`}
                          >
                            <Calendar className='h-3 w-3 mr-1.5' />
                            {formatRelativeTime(newsItem.created_at)}
                          </Badge>

                          <span className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                            Tin tức
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <div className='relative mb-6'>
                  <div className='w-20 h-20 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-lg'>
                    <Bell className='h-10 w-10 text-gray-500 dark:text-gray-400' />
                  </div>
                  <div className='absolute inset-0 bg-gradient-to-br from-gray-200/30 to-indigo-200/30 dark:from-gray-800/20 dark:to-indigo-800/20 rounded-full animate-pulse' />
                </div>
                <h3 className='text-xl font-semibold text-gray-800 dark:text-white mb-2'>
                  Chưa có tin tức nào
                </h3>
                <p className='text-gray-600 dark:text-gray-300 max-w-md'>
                  Tin tức mới từ hệ thống sẽ xuất hiện tại đây. Hãy kiểm tra lại
                  sau.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
