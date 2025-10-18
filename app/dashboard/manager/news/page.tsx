"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  FileText,
  Megaphone,
  Clock,
  Tag,
  Users,
  Loader2,
  Calendar,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getNews, createNews, type NewsItem } from "@/api/news-api";
import { uploadMedia } from "@/api/media-api";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";

export default function NewsListPage() {
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

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

  // Filter and search news
  const filteredNews = newsItems.filter((news) => {
    const searchMatch =
      searchQuery === "" ||
      news.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      news.content.toLowerCase().includes(searchQuery.toLowerCase());

    const typeMatch =
      filter === "all" ||
      (Array.isArray(news.type) && news.type.includes(filter));

    return searchMatch && typeMatch;
  });

  // Calculate summary statistics
  const totalNews = newsItems.length;
  const announcementNews = newsItems.filter((news) =>
    Array.isArray(news.type) ? news.type.includes("announcement") : false
  ).length;
  const notificationNews = newsItems.filter((news) =>
    Array.isArray(news.type) ? news.type.includes("notification") : false
  ).length;
  const eventNews = newsItems.filter((news) =>
    Array.isArray(news.type) ? news.type.includes("event") : false
  ).length;

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get news type display
  const getNewsTypeDisplay = (types: string[]) => {
    if (!Array.isArray(types)) return "";
    return types
      .map((type) => {
        switch (type) {
          case "announcement":
            return "Thông báo";
          case "notification":
            return "Tin tức";
          case "event":
            return "Sự kiện";
          default:
            return type;
        }
      })
      .join(", ");
  };

  // Get content preview
  const getContentPreview = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách tin tức...</p>
      </div>
    );
  }

  return (
    <>
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý tin tức</h1>
          <p className='text-muted-foreground'>
            Quản lý tất cả tin tức, thông báo và sự kiện của trung tâm
          </p>
        </div>
        <div className='flex gap-2'>
          <Dialog
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className='mr-2 h-4 w-4' />
                Tạo tin tức
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle>Tạo tin tức mới</DialogTitle>
                <DialogDescription>
                  Tạo tin tức, thông báo hoặc sự kiện mới cho trung tâm
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
                    className='min-h-[150px]'
                    value={formData.content}
                    onChange={(e) =>
                      handleInputChange("content", e.target.value)
                    }
                  />
                </div>

                <div className='space-y-3'>
                  <Label>Loại tin tức *</Label>
                  <div className='space-y-2'>
                    {[
                      { value: "announcement", label: "Thông báo" },
                      { value: "notification", label: "Tin tức" },
                      { value: "event", label: "Sự kiện" },
                    ].map((type) => (
                      <div
                        key={type.value}
                        className='flex items-center space-x-2'
                      >
                        <Checkbox
                          id={type.value}
                          checked={formData.type.includes(type.value)}
                          onCheckedChange={(checked) =>
                            handleTypeChange(type.value, checked as boolean)
                          }
                        />
                        <Label htmlFor={type.value}>{type.label}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className='space-y-3'>
                  <Label>Ảnh đại diện</Label>
                  <div className='space-y-3'>
                    <input
                      type='file'
                      id='cover-upload'
                      accept='image/*'
                      onChange={handleFileChange}
                      className='hidden'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() =>
                        document.getElementById("cover-upload")?.click()
                      }
                      className='w-full'
                    >
                      <Upload className='mr-2 h-4 w-4' />
                      Chọn ảnh
                    </Button>
                    {imagePreview && (
                      <div className='relative'>
                        <img
                          src={imagePreview}
                          alt='Preview'
                          className='w-full h-48 object-cover rounded-lg border'
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
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={handleModalClose}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateNews}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Đang tạo...
                    </>
                  ) : (
                    "Tạo tin tức"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <FileText className='h-4 w-4 text-primary' />
              Tổng số tin tức
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-foreground'>
              {totalNews}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>Đã đăng</p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Megaphone className='h-4 w-4 text-blue-600' />
              Thông báo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {announcementNews}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalNews > 0
                ? Math.round((announcementNews / totalNews) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <FileText className='h-4 w-4 text-green-600' />
              Tin tức
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {notificationNews}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalNews > 0
                ? Math.round((notificationNews / totalNews) * 100)
                : 0}
              % tổng số
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-orange-600' />
              Sự kiện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {eventNews}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              {totalNews > 0 ? Math.round((eventNews / totalNews) * 100) : 0}%
              tổng số
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8 bg-card/80 backdrop-blur-sm border shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-3'>
            <FileText className='h-5 w-5 text-primary' />
            Danh sách tin tức
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Tìm kiếm tin tức theo tiêu đề hoặc nội dung...'
                className='pl-10 h-11 border-muted-foreground/20 focus:border-primary transition-colors'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='w-full md:w-[200px]'>
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger className='h-11 border-muted-foreground/20 focus:border-primary transition-colors'>
                  <SelectValue placeholder='Lọc theo loại' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      Tất cả tin tức
                    </div>
                  </SelectItem>
                  <SelectItem value='announcement'>
                    <div className='flex items-center gap-2'>
                      <Megaphone className='h-4 w-4 text-blue-600' />
                      Thông báo
                    </div>
                  </SelectItem>
                  <SelectItem value='notification'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4 text-green-600' />
                      Tin tức
                    </div>
                  </SelectItem>
                  <SelectItem value='event'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-orange-600' />
                      Sự kiện
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-lg border border-border/50 overflow-hidden shadow-sm'>
            <Table>
              <TableHeader>
                <TableRow className='bg-muted/30 hover:bg-muted/40 border-border/50'>
                  <TableHead className='font-semibold text-foreground py-4'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      Tiêu đề
                    </div>
                  </TableHead>
                  <TableHead className='font-semibold text-foreground py-4'>
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4' />
                      Nội dung
                    </div>
                  </TableHead>
                  <TableHead className='font-semibold text-foreground py-4'>
                    <div className='flex items-center gap-2'>
                      <Tag className='h-4 w-4' />
                      Loại
                    </div>
                  </TableHead>
                  <TableHead className='font-semibold text-foreground py-4'>
                    <div className='flex items-center gap-2'>
                      <Clock className='h-4 w-4' />
                      Ngày tạo
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.length > 0 ? (
                  filteredNews.map((news) => (
                    <TableRow
                      key={news._id}
                      className='cursor-pointer hover:bg-muted/50 transition-colors border-border/30'
                      onClick={() =>
                        router.push(`/dashboard/manager/news/${news._id}`)
                      }
                    >
                      <TableCell className='py-4'>
                        <div className='flex items-start gap-3'>
                          <div className='min-w-0 flex-1'>
                            <div className='font-medium text-foreground line-clamp-2'>
                              {news.title}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='py-4 max-w-xs'>
                        <div className='text-sm text-muted-foreground line-clamp-3'>
                          {getContentPreview(news.content)}
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {Array.isArray(news.type) &&
                            news.type.map((type) => (
                              <Badge
                                key={type}
                                variant='outline'
                                className={
                                  type === "announcement"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                                    : type === "notification"
                                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                                    : type === "event"
                                    ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800"
                                    : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800"
                                }
                              >
                                {type === "announcement"
                                  ? "Thông báo"
                                  : type === "notification"
                                  ? "Tin tức"
                                  : type === "event"
                                  ? "Sự kiện"
                                  : type}
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex items-center gap-2'>
                          <Clock className='h-3 w-3 text-muted-foreground' />
                          <span className='text-sm text-muted-foreground'>
                            {formatDate(news.created_at)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow key='empty-row'>
                    <TableCell
                      colSpan={4}
                      className='text-center py-8 text-muted-foreground'
                    >
                      Không tìm thấy tin tức phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
