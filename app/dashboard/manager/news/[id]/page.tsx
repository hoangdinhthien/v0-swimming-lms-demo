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
  ChevronLeft,
  ChevronRight,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getNewsDetail,
  type NewsItem,
  formatRelativeTime,
  updateNews,
  deleteNews,
  extractNewsImageUrls,
} from "@/api/manager/news-api";
import { getMediaDetails, uploadMedia } from "@/api/media-api";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWithReview } from "@/hooks/use-with-review";

// News detail page
export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { handleResponse } = useWithReview({
    onSuccess: async () => {
      // Close modal and refresh data
      setIsEditModalOpen(false);

      if (!newsItem) return;

      // Refresh the news detail
      const updatedNewsDetail = await getNewsDetail(newsItem._id);
      if (updatedNewsDetail) {
        setNewsItem(updatedNewsDetail);

        // Update cover images based on updated news data
        if (updatedNewsDetail.cover) {
          const imageUrls = extractNewsImageUrls(updatedNewsDetail.cover);
          setCoverImages(imageUrls);
          setCurrentImageIndex(0); // Reset to first image
        } else {
          // Cover was removed, set to empty array
          setCoverImages([]);
        }
      }

      toast({
        title: "Thành công",
        description: "Cập nhật tin tức thành công!",
        variant: "default",
      });
    },
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: [] as string[],
    coverFile: null as File | null,
    removeCover: false, // Flag to indicate if cover should be removed
    existingImages: [] as string[], // Store existing cover images
  });

  // Image preview for editing (new uploaded image)
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  useEffect(() => {
    async function fetchNewsDetail() {
      if (typeof params.id !== "string") {
        setError("ID tin tức không hợp lệ");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const newsDetail = await getNewsDetail(params.id);

        if (!newsDetail) {
          setError("Không tìm thấy tin tức");
        } else {
          setNewsItem(newsDetail);

          // Extract image URLs from cover field
          if (newsDetail.cover) {
            const imageUrls = extractNewsImageUrls(newsDetail.cover);
            setCoverImages(imageUrls);
            setCurrentImageIndex(0); // Reset to first image
          } else {
            setCoverImages([]);
          }
        }
      } catch (err) {
        setError("Không thể tải thông tin chi tiết tin tức");
        console.error("Error fetching news details:", err);
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
        existingImages: coverImages, // Store current cover images
      });
      setImagePreview(null); // Reset new image preview
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

  // Alternative file upload trigger function
  const triggerFileUpload = () => {
    const fileInput = document.getElementById(
      "edit-cover-upload"
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

  // Handle removing existing images
  const handleRemoveExistingImage = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      existingImages: prev.existingImages.filter((img) => img !== imageUrl),
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

      let coverIds: string[] = [];

      // Start with existing images that weren't removed
      const existingCoverIds: string[] = [];

      // Create a mapping from image URLs to IDs using the original cover data
      if (Array.isArray(newsItem.cover) && coverImages.length > 0) {
        const originalCoverIds = newsItem.cover.map((item) =>
          typeof item === "string" ? item : item._id
        );

        // For each remaining existing image, find its corresponding ID
        formData.existingImages.forEach((imageUrl) => {
          const imageIndex = coverImages.indexOf(imageUrl);
          if (imageIndex >= 0 && imageIndex < originalCoverIds.length) {
            existingCoverIds.push(originalCoverIds[imageIndex]);
          }
        });
      }

      // Handle new uploaded image
      if (formData.coverFile) {
        // User uploaded a new image - upload it first and get the media ID
        const uploadResult = await uploadMedia({
          file: formData.coverFile,
          title: formData.title,
          alt: formData.title,
          tenantId,
          token,
        });
        // Add new image ID to existing ones
        coverIds = [...existingCoverIds, uploadResult.data._id];
      } else {
        // No new image, just use existing ones
        coverIds = existingCoverIds;
      }

      // Update news article - cover field expects an array of media IDs
      const requestBody = {
        title: formData.title,
        content: formData.content,
        type: formData.type,
        ...(coverIds.length > 0 && { cover: coverIds }),
      };

      const response = await updateNews(
        newsItem._id,
        requestBody,
        token,
        tenantId
      );

      handleResponse(response);
    } catch (error) {
      console.error("Error updating news:", error);
      toast({
        title: "Lỗi cập nhật",
        description:
          error instanceof Error ? error.message : "Không thể cập nhật tin tức",
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
      existingImages: [],
    });
    setImagePreview(null);
  };

  // Handle delete news
  const handleDeleteNews = async () => {
    if (!newsItem) return;

    setIsDeleting(true);
    try {
      const token = getAuthToken();
      const tenantId = getSelectedTenant();

      if (!token || !tenantId) {
        throw new Error("Không tìm thấy thông tin xác thực");
      }

      await deleteNews(newsItem._id, token, tenantId);

      toast({
        title: "Thành công",
        description: "Xóa tin tức thành công!",
        variant: "default",
      });

      // Redirect back to news list
      router.push("/dashboard/manager/news");
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({
        title: "Lỗi xóa",
        description:
          error instanceof Error ? error.message : "Không thể xóa tin tức",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">
            Đang tải chi tiết tin tức...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
          <div className="text-red-600 dark:text-red-400 flex items-center gap-2 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <Eye className="h-5 w-5" />
            </div>
            {error}
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/manager/news">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay về danh sách tin tức
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 md:px-6 lg:px-8  max-w-full space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl blur-xl -z-10" />
        <div className="relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/manager/news"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Quay về danh sách
            </Link>

            <div className="flex gap-2">
              <Button
                onClick={handleOpenEditModal}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Edit className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Xóa
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xác nhận xóa tin tức</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn xóa tin tức này không? Hành động này
                      không thể hoàn tác.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteNews}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? "Đang xóa..." : "Xóa"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl blur-xl -z-10" />
        <Card className="relative bg-white/80 dark:bg-black/80 backdrop-blur-sm border border-white/20 dark:border-gray-800/50 shadow-lg overflow-hidden">
          <CardHeader className="pb-4">
            <div className="space-y-4">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                {newsItem!.title}
              </CardTitle>

              {/* Meta Information */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">
                    {formatRelativeTime(newsItem!.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
                    <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="font-medium">Đối tượng:</span>
                </div>
              </div>

              {/* Audience Badges */}
              <div className="flex flex-wrap gap-2">
                {newsItem!.type.map((type, index) => {
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
                      variant="secondary"
                      className={`${roleInfo.color} border-0 font-medium`}
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {roleInfo.label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Cover Images */}
            {coverImages.length > 0 && (
              <div className="relative">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                  <img
                    src={coverImages[currentImageIndex]}
                    alt={`${newsItem!.title} - Hình ${currentImageIndex + 1}`}
                    className="w-full h-auto max-h-96 object-contain rounded-xl transition-all duration-300 hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />

                  {/* Navigation Buttons */}
                  {coverImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 z-10"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 z-10"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Image Counter */}
                  {coverImages.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {coverImages.length}
                    </div>
                  )}
                </div>

                {/* Image Thumbnails */}
                {coverImages.length > 1 && (
                  <div className="flex gap-2 mt-4 justify-center overflow-x-auto pb-2">
                    {coverImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentImageIndex
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Content */}
            <div className="prose max-w-none">
              <div className="bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-black/50 rounded-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap text-base">
                  {newsItem!.content}
                </div>
              </div>
            </div>

            {/* Footer Information */}
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-6">
              <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/20 rounded-xl p-4">
                <div className="flex justify-between items-start gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Ngày tạo:
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {new Date(newsItem!.created_at).toLocaleDateString(
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

                    {newsItem!.created_at !== newsItem!.updated_at && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Cập nhật:
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">
                          {new Date(newsItem!.updated_at).toLocaleDateString(
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Chỉnh Sửa Tin Tức
            </DialogTitle>
            <DialogDescription>Cập nhật thông tin tin tức</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="text-sm font-medium">
                Tiêu đề tin tức <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-title"
                placeholder="Nhập tiêu đề tin tức..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="edit-content" className="text-sm font-medium">
                Nội dung tin tức <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="edit-content"
                placeholder="Nhập nội dung chi tiết của tin tức..."
                value={formData.content}
                onChange={(e) => handleInputChange("content", e.target.value)}
                className="w-full min-h-32 resize-none"
                rows={6}
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Đối tượng xem tin tức <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: "manager",
                    label: "Quản lý",
                    description: "Chỉ quản lý có thể xem",
                  },
                  {
                    id: "instructor",
                    label: "Huấn luyện viên",
                    description: "Quản lý và Huấn luyện viên",
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
                    className="flex items-start space-x-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Checkbox
                      id={`edit-${type.id}`}
                      checked={formData.type.includes(type.id)}
                      onCheckedChange={(checked) =>
                        handleTypeChange(type.id, checked as boolean)
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={`edit-${type.id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        {type.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Ảnh bìa (tùy chọn)</Label>

              {/* Existing Images */}
              {formData.existingImages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Ảnh hiện tại ({formData.existingImages.length})
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {formData.existingImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={imageUrl}
                          alt={`Cover ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveExistingImage(imageUrl)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Image Upload */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="New Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        // Remove the new uploaded image
                        setImagePreview(null);
                        setFormData((prev) => ({
                          ...prev,
                          coverFile: null,
                        }));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <div
                        onClick={triggerFileUpload}
                        className="cursor-pointer"
                      >
                        <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {formData.existingImages.length > 0
                            ? "Thêm ảnh bìa mới"
                            : "Tải lên ảnh bìa"}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, JPEG tối đa 5MB
                        </span>
                      </div>
                    </div>
                    <input
                      id="edit-cover-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleModalClose}
              disabled={isUpdating}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleUpdateNews}
              disabled={
                isUpdating ||
                !formData.title.trim() ||
                !formData.content.trim() ||
                formData.type.length === 0
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isUpdating ? "Đang cập nhật..." : "Cập nhật tin tức"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
