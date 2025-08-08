"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  Clock,
  Tag,
  Edit,
  Plus,
  Upload,
  X,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getNewsDetail,
  type NewsItem,
  formatRelativeTime,
  updateNews,
} from "@/api/news-api";
import { getMediaDetails, uploadMedia } from "@/api/media-api";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

// Trang chi tiết thông báo
export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: [] as string[],
    coverFile: null as File | null,
    removeCover: false, // Flag to indicate if cover should be removed
  });

  // Image preview for editing
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  // Handle opening edit modal
  const handleOpenEditModal = () => {
    if (newsItem) {
      setFormData({
        title: newsItem.title,
        content: newsItem.content,
        type: newsItem.type,
        coverFile: null,
        removeCover: false,
      });
      setImagePreview(coverImageUrl);
      setIsEditModalOpen(true);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        coverFile: file,
        removeCover: false, // Reset remove cover flag when new file is selected
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle type selection
  const handleTypeChange = (type: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      type: checked
        ? [...prev.type, type]
        : prev.type.filter((t) => t !== type),
    }));
  };

  // Handle update news
  const handleUpdateNews = async () => {
    if (
      !formData.title.trim() ||
      !formData.content.trim() ||
      formData.type.length === 0 ||
      !newsItem
    ) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const token = getAuthToken();
      const tenantId = getSelectedTenant();

      if (!token || !tenantId) {
        throw new Error("Không tìm thấy thông tin xác thực");
      }

      let coverId = null;

      // Determine cover ID based on user actions
      if (formData.removeCover) {
        // User wants to remove cover entirely
        coverId = null;
      } else if (formData.coverFile) {
        // User uploaded a new image - upload it first and get the media ID
        const uploadResult = await uploadMedia({
          file: formData.coverFile,
          title: formData.title,
          alt: formData.title,
          tenantId,
          token,
        });
        coverId = uploadResult.data._id;
      } else {
        // Keep existing cover if present
        coverId = newsItem.cover;
      }

      // Update news article - cover field expects an array of media IDs
      const requestBody = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        ...(coverId && { cover: [coverId] }),
      };

      await updateNews(newsItem._id, requestBody, token, tenantId);

      // Close modal and refresh data
      setIsEditModalOpen(false);

      // Refresh the news detail
      const updatedNewsDetail = await getNewsDetail(newsItem._id);
      if (updatedNewsDetail) {
        setNewsItem(updatedNewsDetail);

        // Update cover image based on updated news data
        if (updatedNewsDetail.cover) {
          try {
            const mediaPath = await getMediaDetails(updatedNewsDetail.cover);
            setCoverImageUrl(mediaPath || "/placeholder.svg");
          } catch (mediaErr) {
            console.error("Error fetching updated media details:", mediaErr);
            setCoverImageUrl("/placeholder.svg");
          }
        } else {
          // Cover was removed, set to null
          setCoverImageUrl(null);
        }
      }

      toast({
        title: "Thành công",
        description: "Cập nhật thông báo thành công!",
        variant: "default",
      });
    } catch (error) {
      console.error("Error updating news:", error);
      toast({
        title: "Lỗi cập nhật",
        description:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật thông báo",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Reset form when modal closes
  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setFormData({
      title: "",
      content: "",
      type: [],
      coverFile: null,
      removeCover: false,
    });
    setImagePreview(null);
  };

  return (
    <div className='px-2 sm:px-4 md:px-6 lg:px-8 mx-auto max-w-full space-y-6'>
      {/* Header */}
      <div className='relative'>
        <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl blur-xl -z-10' />
        <div className='relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 rounded-xl p-6 shadow-lg'>
          <div className='flex items-center justify-between'>
            <Link
              href='/dashboard/manager'
              className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group'
            >
              <ArrowLeft className='mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1' />
              Trở về Trang Quản Lý
            </Link>

            {newsItem && !isLoading && !error && (
              <Button
                onClick={handleOpenEditModal}
                className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200'
              >
                <Edit className='mr-2 h-4 w-4' />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className='relative'>
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl blur-xl -z-10' />
          <Card className='relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 shadow-lg'>
            <CardHeader className='space-y-4'>
              <div className='space-y-3'>
                <Skeleton className='h-8 w-3/4 bg-gray-200/50 dark:bg-gray-700/50' />
                <div className='flex gap-4'>
                  <Skeleton className='h-4 w-32 bg-gray-200/50 dark:bg-gray-700/50' />
                  <Skeleton className='h-4 w-40 bg-gray-200/50 dark:bg-gray-700/50' />
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-6'>
              <Skeleton className='h-48 w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-lg' />
              <div className='space-y-3'>
                <Skeleton className='h-4 w-full bg-gray-200/50 dark:bg-gray-700/50' />
                <Skeleton className='h-4 w-5/6 bg-gray-200/50 dark:bg-gray-700/50' />
                <Skeleton className='h-4 w-4/6 bg-gray-200/50 dark:bg-gray-700/50' />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : error ? (
        <div className='relative'>
          <div className='absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10 dark:from-red-500/5 dark:to-pink-500/5 rounded-xl blur-xl -z-10' />
          <Card className='relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 shadow-lg'>
            <CardHeader>
              <CardTitle className='text-red-600 dark:text-red-400 flex items-center gap-2'>
                <div className='p-2 bg-red-100 dark:bg-red-900/20 rounded-lg'>
                  <Eye className='h-5 w-5' />
                </div>
                {error}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-muted-foreground mb-6'>
                Không thể tải thông tin chi tiết thông báo.
              </p>
              <Button
                onClick={() => router.push("/dashboard/manager")}
                className='bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Trở về Trang Quản Lý
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        newsItem && (
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
                        {formatRelativeTime(newsItem.created_at)}
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
                    {newsItem.type.map((type, index) => {
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
                        student: {
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
                {/* Cover Image */}
                {coverImageUrl && (
                  <div className='relative'>
                    <div className='relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'>
                      <img
                        src={coverImageUrl}
                        alt={newsItem.title}
                        className='w-full h-auto max-h-96 object-contain rounded-xl transition-all duration-300 hover:scale-105'
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder.svg";
                        }}
                      />
                      <div className='absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl' />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className='prose max-w-none'>
                  <div className='bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-black/50 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50'>
                    <div className='text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-base'>
                      {newsItem.content}
                    </div>
                  </div>
                </div>

                {/* Footer Information */}
                <div className='border-t border-gray-200/50 dark:border-gray-700/50 pt-6'>
                  <div className='bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/20 rounded-xl p-4'>
                    <div className='flex justify-between items-start gap-4 text-sm'>
                      <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Clock className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                          <span className='font-medium text-gray-700 dark:text-gray-300'>
                            Ngày tạo:
                          </span>
                          <span className='text-gray-900 dark:text-gray-100'>
                            {new Date(newsItem.created_at).toLocaleDateString(
                              "vi-VN",
                              {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        {newsItem.created_at !== newsItem.updated_at && (
                          <div className='flex items-center gap-2'>
                            <Clock className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            <span className='font-medium text-gray-700 dark:text-gray-300'>
                              Cập nhật:
                            </span>
                            <span className='text-gray-900 dark:text-gray-100'>
                              {new Date(newsItem.updated_at).toLocaleDateString(
                                "vi-VN",
                                {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      )}

      {/* Edit Modal */}
      <Dialog
        open={isEditModalOpen}
        onOpenChange={handleModalClose}
      >
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-xl font-bold text-gray-900 dark:text-gray-100'>
              Chỉnh Sửa Thông Báo
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin thông báo</DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Title */}
            <div className='space-y-2'>
              <Label
                htmlFor='edit-title'
                className='text-sm font-medium'
              >
                Tiêu đề thông báo <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='edit-title'
                placeholder='Nhập tiêu đề thông báo...'
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className='w-full'
              />
            </div>

            {/* Content */}
            <div className='space-y-2'>
              <Label
                htmlFor='edit-content'
                className='text-sm font-medium'
              >
                Nội dung thông báo <span className='text-red-500'>*</span>
              </Label>
              <Textarea
                id='edit-content'
                placeholder='Nhập nội dung chi tiết của thông báo...'
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className='w-full min-h-32 resize-none'
                rows={6}
              />
            </div>

            {/* Target Audience */}
            <div className='space-y-3'>
              <Label className='text-sm font-medium'>
                Đối tượng xem thông báo <span className='text-red-500'>*</span>
              </Label>
              <div className='grid grid-cols-2 gap-3'>
                {[
                  {
                    id: "manager",
                    label: "Quản lý",
                    description: "Chỉ quản lý có thể xem",
                  },
                  {
                    id: "instructor",
                    label: "Giảng viên",
                    description: "Quản lý và giảng viên",
                  },
                  {
                    id: "member",
                    label: "Học viên",
                    description: "Quản lý và học viên",
                  },
                  {
                    id: "public",
                    label: "Công khai",
                    description: "Tất cả mọi người",
                  },
                ].map((type) => (
                  <div
                    key={type.id}
                    className='flex items-start space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors'
                  >
                    <Checkbox
                      id={`edit-${type.id}`}
                      checked={formData.type.includes(type.id)}
                      onCheckedChange={(checked) =>
                        handleTypeChange(type.id, checked as boolean)
                      }
                    />
                    <div className='grid gap-1.5 leading-none'>
                      <Label
                        htmlFor={`edit-${type.id}`}
                        className='text-sm font-medium cursor-pointer'
                      >
                        {type.label}
                      </Label>
                      <p className='text-xs text-muted-foreground'>
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div className='space-y-3'>
              <Label className='text-sm font-medium'>Ảnh bìa (tùy chọn)</Label>

              <div className='border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors'>
                {imagePreview ? (
                  <div className='relative'>
                    <img
                      src={imagePreview}
                      alt='Preview'
                      className='w-full h-48 object-cover rounded-lg'
                    />
                    <Button
                      type='button'
                      variant='destructive'
                      size='sm'
                      className='absolute top-2 right-2'
                      onClick={() => {
                        // Remove the image entirely and allow immediate upload
                        setImagePreview(null);
                        setFormData((prev) => ({
                          ...prev,
                          coverFile: null,
                          removeCover: true,
                        }));
                      }}
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                ) : (
                  <div className='text-center'>
                    <ImageIcon className='mx-auto h-12 w-12 text-gray-400' />
                    <div className='mt-4'>
                      <Label
                        htmlFor='edit-cover-upload'
                        className='cursor-pointer'
                      >
                        <span className='mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100'>
                          Tải lên ảnh bìa
                        </span>
                        <span className='mt-1 block text-xs text-gray-500 dark:text-gray-400'>
                          PNG, JPG, JPEG tối đa 5MB
                        </span>
                      </Label>
                      <input
                        id='edit-cover-upload'
                        type='file'
                        className='hidden'
                        accept='image/*'
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className='flex gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleModalClose}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button
              type='button'
              onClick={handleUpdateNews}
              disabled={
                isUpdating ||
                !formData.title.trim() ||
                !formData.content.trim() ||
                formData.type.length === 0
              }
              className='bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
            >
              {isUpdating && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              {isUpdating ? "Đang cập nhật..." : "Cập nhật thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
