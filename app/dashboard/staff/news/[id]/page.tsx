"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Clock,
  Tag,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import { fetchStaffData } from "@/api/staff-data/staff-data-api";
import { getMediaDetails } from "@/api/media-api";

// News detail page for staff
export default function StaffNewsDetailPage() {
  const params = useParams();
  const newsId = params?.id as string;
  const [newsItem, setNewsItem] = useState<any>(null);
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadNewsDetail = async () => {
      if (!newsId) {
        setError("Thiếu mã tin tức");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId || !token) throw new Error("Thiếu thông tin xác thực");

        const response = await fetchStaffData({
          module: "News",
          tenantId,
          token,
          additionalParams: { "search[_id:equal]": newsId },
        });

        // Extract news data from nested structure
        const newsData = response?.data?.[0]?.[0]?.documents?.[0];

        if (!newsData) {
          throw new Error("Không tìm thấy tin tức");
        }

        setNewsItem(newsData);

        // Extract image URLs from cover field
        if (newsData.cover && Array.isArray(newsData.cover)) {
          const imageUrls: string[] = [];
          for (const coverItem of newsData.cover) {
            if (coverItem?.path && typeof coverItem.path === "string") {
              imageUrls.push(coverItem.path);
            } else if (coverItem?._id && typeof coverItem._id === "string") {
              // Try to get media details if we have media ID
              try {
                const mediaPath = await getMediaDetails(coverItem._id);
                if (mediaPath) {
                  imageUrls.push(mediaPath);
                }
              } catch (error) {
                console.warn(
                  "Cannot fetch media details for news cover:",
                  error
                );
              }
            }
          }
          setCoverImages(imageUrls);
          setCurrentImageIndex(0); // Reset to first image
        } else {
          setCoverImages([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Không thể tải thông tin tin tức"
        );
        setNewsItem(null);
      } finally {
        setLoading(false);
      }
    };

    loadNewsDetail();
  }, [newsId]);

  // Navigation functions for image slider
  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === coverImages.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? coverImages.length - 1 : prev - 1
    );
  };

  // Keyboard navigation for image slider
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (coverImages && coverImages.length > 1) {
        if (event.key === "ArrowLeft") {
          prevImage();
        } else if (event.key === "ArrowRight") {
          nextImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [coverImages, currentImageIndex]);

  if (loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải chi tiết tin tức...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <Card className='max-w-md mx-auto shadow-lg'>
          <CardContent className='p-8 text-center'>
            <div className='w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Eye className='h-8 w-8 text-destructive' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              Không tìm thấy tin tức
            </h3>
            <p className='text-destructive mb-4'>{error}</p>
            <Link
              href='/dashboard/staff/news'
              className='inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Quay lại danh sách
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='px-2 sm:px-4 md:px-6 lg:px-8 max-w-full space-y-6 animate-in fade-in duration-500'>
      {/* Header */}
      <div className='relative'>
        <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl blur-xl -z-10' />
        <div className='relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 rounded-xl p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <Link
              href='/dashboard/staff/news'
              className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group'
            >
              <ArrowLeft className='mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1' />
              Quay về danh sách
            </Link>
          </div>
        </div>
      </div>

      <div className='relative'>
        <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl blur-xl -z-10' />
        <Card className='relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 shadow-lg overflow-hidden'>
          <CardHeader className='pb-4'>
            <div className='space-y-4'>
              <CardTitle className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight'>
                {newsItem.title}
              </CardTitle>

              {/* Meta Information */}
              <div className='flex flex-wrap gap-4 text-sm'>
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <div className='p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg'>
                    <Calendar className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <span className='font-medium'>
                    {newsItem.created_at
                      ? new Date(newsItem.created_at).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "N/A"}
                  </span>
                </div>

                <div className='flex items-center gap-2 text-muted-foreground'>
                  <div className='p-1.5 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg'>
                    <User className='h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400' />
                  </div>
                  <span className='font-medium'>Đối tượng:</span>
                </div>
              </div>

              {/* Audience Badges */}
              <div className='flex flex-wrap gap-2'>
                {newsItem.type &&
                  Array.isArray(newsItem.type) &&
                  newsItem.type.map((type: string, index: number) => {
                    const roleInfo = {
                      admin: {
                        label: "Quản trị viên",
                        color:
                          "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
                      },
                      manager: {
                        label: "Quản lý",
                        color:
                          "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
                      },
                      instructor: {
                        label: "Huấn luyện viên",
                        color:
                          "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
                      },
                      member: {
                        label: "Học viên",
                        color:
                          "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
                      },
                    }[type.toLowerCase()] || {
                      label: type.charAt(0).toUpperCase() + type.slice(1),
                      color:
                        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
                    };

                    return (
                      <Badge
                        key={index}
                        variant='secondary'
                        className={`${roleInfo.color} border-0 font-medium`}
                      >
                        <Tag className='mr-1 h-3 w-3' />
                        {roleInfo.label}
                      </Badge>
                    );
                  })}
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-8'>
            {/* Cover Images */}
            {coverImages.length > 0 && (
              <div className='relative'>
                <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'>
                  <img
                    src={coverImages[currentImageIndex]}
                    alt={`${newsItem.title} - Hình ${currentImageIndex + 1}`}
                    className='w-full h-64 sm:h-80 md:h-96 object-cover transition-all duration-300'
                  />

                  {/* Navigation arrows */}
                  {coverImages.length > 1 && (
                    <>
                      <Button
                        variant='secondary'
                        size='icon'
                        className='absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white dark:bg-black/90 dark:hover:bg-black shadow-lg hover:shadow-xl transition-all duration-200'
                        onClick={prevImage}
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='secondary'
                        size='icon'
                        className='absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white dark:bg-black/90 dark:hover:bg-black shadow-lg hover:shadow-xl transition-all duration-200'
                        onClick={nextImage}
                      >
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    </>
                  )}

                  {/* Image indicators */}
                  {coverImages.length > 1 && (
                    <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2'>
                      {coverImages.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-200 ${
                            index === currentImageIndex
                              ? "bg-white shadow-lg"
                              : "bg-white/50 hover:bg-white/75"
                          }`}
                          onClick={() => setCurrentImageIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content */}
            <div className='prose prose-lg dark:prose-invert max-w-none'>
              <div
                className='text-muted-foreground leading-relaxed whitespace-pre-wrap'
                dangerouslySetInnerHTML={{
                  __html:
                    newsItem.content?.replace(/\n/g, "<br />") ||
                    newsItem.content,
                }}
              />
            </div>

            {/* Footer Information */}
            <div className='border-t pt-6 space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <h4 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
                    Người tạo
                  </h4>
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm'>
                      {newsItem.created_by?.username
                        ?.charAt(0)
                        ?.toUpperCase() || "N"}
                    </div>
                    <div>
                      <p className='font-medium text-foreground'>
                        {newsItem.created_by?.username || "N/A"}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {newsItem.created_at
                          ? new Date(newsItem.created_at).toLocaleDateString(
                              "vi-VN"
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {newsItem.updated_by && (
                  <div className='space-y-2'>
                    <h4 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
                      Cập nhật lần cuối
                    </h4>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold text-sm'>
                        {newsItem.updated_by?.username
                          ?.charAt(0)
                          ?.toUpperCase() || "N"}
                      </div>
                      <div>
                        <p className='font-medium text-foreground'>
                          {newsItem.updated_by?.username || "N/A"}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {newsItem.updated_at
                            ? new Date(newsItem.updated_at).toLocaleDateString(
                                "vi-VN"
                              )
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
