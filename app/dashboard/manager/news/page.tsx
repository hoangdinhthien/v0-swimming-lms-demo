"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Megaphone,
  Loader2,
  RefreshCw,
  Upload,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable } from "@/components/ui/data-table/data-table";
import { columns, NewsItem } from "./components/columns";
import { getNews, createNews } from "@/api/manager/news-api";
import { useToast } from "@/hooks/use-toast";
import { uploadMedia } from "@/api/media-api";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";

export default function NewsListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: [] as string[],
    coverFile: null as File | null,
  });

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Extract fetch logic
  const fetchNews = async () => {
    try {
      setIsLoading(true);
      const news = await getNews();
      setNewsItems(news);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNews();
      toast({
        title: "Đã làm mới",
        description: "Dữ liệu tin tức đã được cập nhật",
      });
    } catch (err) {
      toast({
        title: "Lỗi",
        description: "Không thể làm mới dữ liệu",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
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
      setFormData((prev) => ({ ...prev, coverFile: file }));
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

  // Create news article
  const handleCreateNews = async () => {
    if (
      !formData.title.trim() ||
      !formData.content.trim() ||
      formData.type.length === 0
    ) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin",
        variant: "destructive",
      });
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

      // Create news article
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

      // Refresh news list
      await fetchNews();
      toast({
        title: "Thành công",
        description: "Tạo tin tức thành công!",
      });
    } catch (error: any) {
      console.error("Error creating news:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể tạo tin tức",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle news click
  const handleNewsClick = (news: NewsItem) => {
    router.push(`/dashboard/manager/news/${news._id}`);
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center bg-background'>
        <div className='bg-card rounded-lg shadow-lg p-8 text-center border'>
          <Loader2 className='h-12 w-12 animate-spin text-primary mx-auto mb-4' />
          <p className='text-lg font-medium text-foreground'>
            Đang tải tin tức...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <Button variant='ghost' asChild>
          <a href='/dashboard/manager' className='inline-flex items-center text-sm font-medium'>
            <ArrowLeft className='mr-1 h-4 w-4' />
            Quay lại Dashboard
          </a>
        </Button>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý Tin tức</h1>
          <p className='text-muted-foreground'>
            Quản lý tin tức, thông báo và sự kiện của trung tâm
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className='mr-2 h-4 w-4' /> Tạo tin tức
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Tạo tin tức mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin để tạo tin tức, thông báo hoặc sự kiện mới
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-6'>
                <div className='space-y-2'>
                  <Label htmlFor='title'>Tiêu đề *</Label>
                  <Input
                    id='title'
                    placeholder='Nhập tiêu đề tin tức...'
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='content'>Nội dung *</Label>
                  <Textarea
                    id='content'
                    placeholder='Nhập nội dung tin tức...'
                    value={formData.content}
                    onChange={(e) => handleInputChange("content", e.target.value)}
                    rows={6}
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Loại tin tức *</Label>
                  <div className='flex gap-4'>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='announcement'
                        checked={formData.type.includes("Thông báo")}
                        onCheckedChange={(checked) =>
                          handleTypeChange("Thông báo", checked as boolean)
                        }
                      />
                      <Label htmlFor='announcement'>Thông báo</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='notification'
                        checked={formData.type.includes("Tin tức")}
                        onCheckedChange={(checked) =>
                          handleTypeChange("Tin tức", checked as boolean)
                        }
                      />
                      <Label htmlFor='notification'>Tin tức</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Checkbox
                        id='event'
                        checked={formData.type.includes("Sự kiện")}
                        onCheckedChange={(checked) =>
                          handleTypeChange("Sự kiện", checked as boolean)
                        }
                      />
                      <Label htmlFor='event'>Sự kiện</Label>
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='cover'>Ảnh bìa</Label>
                  <div className='flex items-center gap-4'>
                    <Input
                      id='cover'
                      type='file'
                      accept='image/*'
                      onChange={handleFileChange}
                      className='hidden'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => document.getElementById("cover")?.click()}
                    >
                      <Upload className='mr-2 h-4 w-4' />
                      Chọn ảnh
                    </Button>
                    {imagePreview && (
                      <div className='relative'>
                        <img
                          src={imagePreview}
                          alt='Preview'
                          className='h-20 w-20 object-cover rounded'
                        />
                        <Button
                          size='icon'
                          variant='destructive'
                          className='absolute -top-2 -right-2 h-6 w-6'
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, coverFile: null }));
                            setImagePreview(null);
                          }}
                        >
                          <X className='h-3 w-3' />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant='outline' onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateNews} disabled={isCreating}>
                  {isCreating ? "Đang tạo..." : "Tạo tin tức"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid gap-4 md:grid-cols-3 mt-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Tổng số tin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-2'>
              <Megaphone className='h-8 w-8 text-primary' />
              <div className='text-2xl font-bold'>{newsItems.length}</div>
            </div>
            <p className='text-xs text-muted-foreground'>
              Tổng số tin tức hiện có
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Thông báo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {newsItems.filter((n) => n.type.includes("Thông báo")).length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Số lượng thông báo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Sự kiện</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {newsItems.filter((n) => n.type.includes("Sự kiện")).length}
            </div>
            <p className='text-xs text-muted-foreground'>
              Số lượng sự kiện
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Danh sách tin tức</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={newsItems}
            searchKey="title"
            searchPlaceholder="Tìm kiếm theo tiêu đề..."
            onRowClick={handleNewsClick}
            emptyMessage="Không tìm thấy tin tức nào."
          />
        </CardContent>
      </Card>
    </>
  );
}
