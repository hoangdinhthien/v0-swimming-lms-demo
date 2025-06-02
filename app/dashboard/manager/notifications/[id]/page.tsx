"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getNewsDetail,
  getMediaDetails,
  type NewsItem,
  formatRelativeTime,
} from "@/api/news-api";
import { Skeleton } from "@/components/ui/skeleton";

// Trang chi tiết thông báo
export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchNewsDetail() {
      if (typeof params.id !== "string") {
        setError("ID thông báo không hợp lệ");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const newsDetail = await getNewsDetail(params.id);

        if (!newsDetail) {
          setError("Không tìm thấy thông báo");
        } else {
          setNewsItem(newsDetail);

          // Always try to fetch the media path if cover exists
          if (newsDetail.cover) {
            try {
              const mediaPath = await getMediaDetails(newsDetail.cover);
              if (mediaPath) {
                setCoverImageUrl(mediaPath);
              } else {
                setCoverImageUrl("/placeholder.svg");
              }
            } catch (mediaErr) {
              console.error("Error fetching media details:", mediaErr);
              setCoverImageUrl("/placeholder.svg");
            }
          } else {
            setCoverImageUrl("/placeholder.svg");
          }
        }
      } catch (err) {
        setError("Không thể tải thông tin chi tiết thông báo");
        console.error("Error fetching notification details:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNewsDetail();
  }, [params.id]);

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Trở về Trang Quản Lý
        </Link>
      </div>
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-3/4' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Skeleton className='h-4 w-1/3' />
              <Skeleton className='h-32 w-full' />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-red-500'>{error}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Không thể tải thông tin chi tiết thông báo.</p>
            <Button
              onClick={() => router.push("/dashboard/manager")}
              className='mt-4'
            >
              Trở về Trang Quản Lý
            </Button>
          </CardContent>
        </Card>
      ) : (
        newsItem && (
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>{newsItem.title}</CardTitle>
              <div className='flex flex-col gap-1 text-sm text-muted-foreground mt-2'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-3.5 w-3.5' />
                  <span>{formatRelativeTime(newsItem.created_at)}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <User className='h-3.5 w-3.5' />
                  <span>
                    Đối tượng:{" "}
                    {newsItem.type
                      .map((t) => {
                        // Translate role types to Vietnamese
                        switch (t.toLowerCase()) {
                          case "admin":
                            return "Quản trị viên";
                          case "manager":
                            return "Quản lý";
                          case "instructor":
                            return "Huấn luyện viên";
                          case "student":
                            return "Học viên";
                          default:
                            return t.charAt(0).toUpperCase() + t.slice(1);
                        }
                      })
                      .join(", ")}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='prose max-w-none'>
                <div className='mb-6 flex justify-center'>
                  <div className='w-full max-w-xl aspect-video bg-muted rounded-md flex items-center justify-center'>
                    <img
                      src={coverImageUrl || "/placeholder.svg"}
                      alt={newsItem.title}
                      className='object-contain w-full h-full rounded-md'
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder.svg";
                      }}
                    />
                  </div>
                </div>
                <div className='whitespace-pre-wrap'>{newsItem.content}</div>

                <div className='mt-8 text-sm text-muted-foreground border-t pt-4'>
                  <div className='flex justify-between flex-wrap gap-2'>
                    <div>
                      <p>
                        <strong>Ngày tạo:</strong>{" "}
                        {new Date(newsItem.created_at).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                      {newsItem.created_at !== newsItem.updated_at && (
                        <p>
                          <strong>Cập nhật:</strong>{" "}
                          {new Date(newsItem.updated_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </>
  );
}
