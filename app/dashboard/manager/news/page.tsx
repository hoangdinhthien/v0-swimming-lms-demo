"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Calendar,
  ChevronRight,
  Loader2,
  Plus,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getNews,
  type NewsItem,
  formatRelativeTime,
  createNews,
} from "@/api/news-api";
import { uploadMedia } from "@/api/media-api";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsListPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: [] as string[],
    coverFile: null as File | null,
  });

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setIsLoading(true);
        const news = await getNews();
        // Managers have access to see all notifications/news
        setNewsItems(news);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNews();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input clicked!", e.target.files); // Debug log
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name); // Debug log
      setFormData((prev) => ({ ...prev, coverFile: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Alternative file upload trigger function
  const triggerFileUpload = () => {
    console.log("Triggering file upload..."); // Debug log
    const fileInput = document.getElementById(
      "cover-upload"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
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

  // Create news article
  const handleCreateNews = async () => {
    if (
      !formData.title.trim() ||
      !formData.content.trim() ||
      formData.type.length === 0
    ) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setIsCreating(true);
    try {
      const token = getAuthToken();
      const tenantId = getSelectedTenant();

      if (!token || !tenantId) {
        throw new Error("Không tìm thấy thông tin xác thực");
      }

      let coverId = null;

      // Upload image if provided
      if (formData.coverFile) {
        const uploadResult = await uploadMedia({
          file: formData.coverFile,
          title: formData.title,
          alt: formData.title,
          tenantId,
          token,
        });
        coverId = uploadResult.data._id;
      }

      // Create news article using the new API function
      const requestBody = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        ...(coverId && { cover: [coverId] }),
      };

      await createNews(requestBody, token, tenantId);

      // Reset form and close modal
      setFormData({
        title: "",
        content: "",
        type: [],
        coverFile: null,
      });
      setImagePreview(null);
      setIsModalOpen(false);

      // Refresh the news list
      const news = await getNews();
      setNewsItems(news);
    } catch (error) {
      console.error("Error creating news:", error);
      alert(
        `Lỗi: ${
          error instanceof Error ? error.message : "Không thể tạo thông báo"
        }`
      );
    } finally {
      setIsCreating(false);
    }
  };

  // Reset form when modal closes
  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({
      title: "",
      content: "",
      type: [],
      coverFile: null,
    });
    setImagePreview(null);
  };

  return (
    <div className='min-h-screen from-gray-50 via-white to-blue-50/30 dark:from-black dark:via-gray-900 dark:to-gray-800 transition-colors duration-300'>
      <div className='container mx-auto px-1 sm:px-2 md:px-4 py-8 max-w-7xl'>
        {/* Header Section */}
        <div className='mb-8'>
          <Link
            href='/dashboard/manager'
            className='inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 group mb-6'
          >
            <ArrowLeft className='mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200' />
            Quay lại Trang Chủ
          </Link>

          <div className='flex items-center space-x-4 mb-2'>
            <div className='flex-1'>
              <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent'>
                Tin Tức
              </h1>
              <p className='text-lg text-gray-600 dark:text-gray-400 mt-1'>
                Quản lý và theo dõi tất cả tin tức hệ thống
              </p>
            </div>
            <Dialog
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className='bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black shadow-lg hover:shadow-xl transition-all duration-200'
                  size='lg'
                >
                  <Plus className='h-5 w-5 mr-2' />
                  Tạo tin tức mới
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
                <DialogHeader>
                  <DialogTitle className='text-xl font-bold text-black dark:text-white'>
                    Tạo Tin Tức Mới
                  </DialogTitle>
                  <DialogDescription>
                    Tạo tin tức mới để chia sẻ thông tin quan trọng với người
                    dùng
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-6 py-4'>
                  {/* Title */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='title'
                      className='text-sm font-medium'
                    >
                      Tiêu đề tin tức <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='title'
                      placeholder='Nhập tiêu đề tin tức...'
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      className='w-full'
                    />
                  </div>

                  {/* Content */}
                  <div className='space-y-2'>
                    <Label
                      htmlFor='content'
                      className='text-sm font-medium'
                    >
                      Nội dung tin tức <span className='text-red-500'>*</span>
                    </Label>
                    <Textarea
                      id='content'
                      placeholder='Nhập nội dung chi tiết của tin tức...'
                      value={formData.content}
                      onChange={(e) =>
                        handleInputChange("content", e.target.value)
                      }
                      className='w-full min-h-32 resize-none'
                      rows={6}
                    />
                  </div>

                  {/* Target Audience */}
                  <div className='space-y-3'>
                    <Label className='text-sm font-medium'>
                      Đối tượng xem tin tức{" "}
                      <span className='text-red-500'>*</span>
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
                            id={type.id}
                            checked={formData.type.includes(type.id)}
                            onCheckedChange={(checked) =>
                              handleTypeChange(type.id, checked as boolean)
                            }
                          />
                          <div className='grid gap-1.5 leading-none'>
                            <Label
                              htmlFor={type.id}
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
                    <Label className='text-sm font-medium'>
                      Ảnh bìa (tùy chọn)
                    </Label>
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
                              setImagePreview(null);
                              setFormData((prev) => ({
                                ...prev,
                                coverFile: null,
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
                            <div
                              onClick={triggerFileUpload}
                              className='cursor-pointer'
                            >
                              <span className='mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors'>
                                Tải lên ảnh bìa
                              </span>
                              <span className='mt-1 block text-xs text-gray-500 dark:text-gray-400'>
                                PNG, JPG, JPEG tối đa 5MB
                              </span>
                            </div>
                            <input
                              id='cover-upload'
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
                    disabled={isCreating}
                  >
                    Hủy
                  </Button>
                  <Button
                    type='button'
                    onClick={handleCreateNews}
                    disabled={
                      isCreating ||
                      !formData.title.trim() ||
                      !formData.content.trim() ||
                      formData.type.length === 0
                    }
                    className='bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black'
                  >
                    {isCreating && (
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    )}
                    {isCreating ? "Đang tạo..." : "Tạo tin tức"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    {isLoading ? (
                      <Skeleton className='h-8 w-12 bg-gray-300 dark:bg-gray-700' />
                    ) : (
                      newsItems.length
                    )}
                  </div>
                </div>
                <div className='p-3 bg-blue-200/80 dark:bg-blue-900/50 rounded-xl'>
                  <Bell className='h-6 w-6 text-blue-700 dark:text-blue-300' />
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
                    {isLoading ? (
                      <Skeleton className='h-8 w-16 bg-gray-300 dark:bg-gray-700' />
                    ) : newsItems.length > 0 ? (
                      new Date(newsItems[0]?.created_at).toLocaleDateString(
                        "vi-VN",
                        {
                          day: "2-digit",
                          month: "2-digit",
                        }
                      )
                    ) : (
                      "0"
                    )}
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
                    {isLoading ? (
                      <Skeleton className='h-8 w-20 bg-gray-300 dark:bg-gray-700' />
                    ) : (
                      "Hoạt động"
                    )}
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
              {isLoading && (
                <Loader2 className='h-5 w-5 animate-spin text-gray-500 dark:text-gray-400' />
              )}
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='p-6 space-y-4'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className='flex items-start space-x-4 p-4 bg-gray-200/50 dark:bg-gray-900/50 rounded-xl animate-pulse'
                  >
                    <div className='w-12 h-12 bg-gray-400 dark:bg-gray-700 rounded-full flex-shrink-0' />
                    <div className='flex-1 space-y-2'>
                      <div className='h-4 w-3/4 bg-gray-400 dark:bg-gray-700 rounded' />
                      <div className='h-3 w-full bg-gray-400 dark:bg-gray-700 rounded' />
                      <div className='h-3 w-1/4 bg-gray-400 dark:bg-gray-700 rounded' />
                    </div>
                  </div>
                ))}
              </div>
            ) : newsItems.length > 0 ? (
              <div className='divide-y divide-gray-300 dark:divide-gray-800'>
                {newsItems.map((newsItem, index) => (
                  <Link
                    key={newsItem._id}
                    href={`/dashboard/manager/news/${newsItem._id}`}
                    className='block group hover:bg-gray-200/60 dark:hover:bg-gray-900/50 transition-all duration-200'
                  >
                    <div className='flex items-start space-x-4 p-6 group-hover:scale-[1.01] transition-transform duration-200'>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between mb-2'>
                          <h3 className='text-base font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-1 pr-4'>
                            {newsItem.title}
                          </h3>
                          <ChevronRight className='h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0' />
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
                                ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                : "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                            } shadow-sm`}
                          >
                            <Calendar className='h-3 w-3 mr-1.5' />
                            {formatRelativeTime(newsItem.created_at)}
                          </Badge>

                          <span className='text-xs text-gray-500 dark:text-gray-400 font-medium'>
                            Mới
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-16 text-center'>
                <div className='relative mb-6'>
                  <div className='w-20 h-20 bg-gradient-to-br from-gray-200 via-gray-100 to-blue-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-lg'>
                    <Bell className='h-10 w-10 text-gray-500 dark:text-gray-400' />
                  </div>
                  <div className='absolute inset-0 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 dark:from-blue-800/20 dark:to-indigo-800/20 rounded-full animate-pulse' />
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
