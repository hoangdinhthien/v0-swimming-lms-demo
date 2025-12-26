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
import { createColumns, NewsItem } from "./components/columns";
import { getNews, createNews, deleteNews } from "@/api/manager/news-api";
import { useToast } from "@/hooks/use-toast";
import { uploadMedia } from "@/api/media-api";
import { getAuthToken } from "@/api/auth-utils";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { useWithReview } from "@/hooks/use-with-review";

import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const newsFormSchema = z.object({
  title: z.string().min(1, "Vui lòng nhập tiêu đề tin tức"),
  content: z.string().min(1, "Vui lòng nhập nội dung tin tức"),
  type: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một đối tượng xem"),
  coverFile: z.instanceof(File).nullable().optional(),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

export default function NewsListPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Image preview
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    // Initialize form
    defaultValues: {
      title: "",
      content: "",
      type: [],
      coverFile: null,
    },
  });

  const { handleResponse } = useWithReview({
    onSuccess: async () => {
      await fetchNews();
      toast({
        title: "Thành công",
        description: "Tạo tin tức thành công!",
      });
    },
  });

  // Extract fetch logic with search support
  const fetchNews = async (searchValue?: string, isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setIsLoading(true);
      } else if (searchValue !== undefined) {
        setIsSearching(true);
      }

      let searchParams: Record<string, string> | undefined;

      if (searchValue && searchValue.trim()) {
        searchParams = {
          "searchOr[title:contains]": searchValue.trim(),
        };
      }

      const news = await getNews(searchParams);
      setNewsItems(news);
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  // Handle server-side search
  const handleServerSearch = (searchValue: string) => {
    setSearchQuery(searchValue);
    fetchNews(searchValue, false);
  };

  useEffect(() => {
    fetchNews(undefined, true);
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchNews();
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

  // Handle type selection
  const handleTypeChange = (type: string, checked: boolean) => {
    const currentTypes = form.getValues("type");
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);
    form.setValue("type", newTypes, { shouldValidate: true });
  };

  // Create news article
  const onSubmit = async (data: NewsFormValues) => {
    setIsCreating(true);
    try {
      const token = getAuthToken();
      const tenantId = getSelectedTenant();

      if (!token || !tenantId) {
        throw new Error("Không tìm thấy thông tin xác thực");
      }

      let coverId = null;

      // Upload image if provided
      if (data.coverFile) {
        const uploadResult = await uploadMedia({
          file: data.coverFile,
          title: data.title,
          alt: data.title,
          tenantId,
          token,
        });
        coverId = uploadResult.data._id;
      }

      // Create news article
      const requestBody = {
        title: data.title,
        content: data.content,
        type: data.type,
        ...(coverId && { cover: [coverId] }),
      };

      const response = await createNews(requestBody, token, tenantId);

      handleResponse(response);

      // Reset form and close modal
      form.reset();
      setImagePreview(null);
      setIsModalOpen(false);
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

  // Handle delete news
  const handleDeleteNews = async (newsId: string, newsTitle: string) => {
    const token = getAuthToken();
    const tenantId = getSelectedTenant();

    if (!token || !tenantId) {
      throw new Error("Không tìm thấy thông tin xác thực");
    }

    await deleteNews(newsId, token, tenantId);

    // Refresh the list after deletion
    await fetchNews();
  };

  // Create columns with delete handler
  const columns = createColumns(handleDeleteNews);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="bg-card rounded-lg shadow-lg p-8 text-center border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">
            Đang tải tin tức...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <a
            href="/dashboard/manager"
            className="inline-flex items-center text-sm font-medium"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Quay lại Dashboard
          </a>
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Tin tức</h1>
          <p className="text-muted-foreground">
            Quản lý tin tức, thông báo và sự kiện của trung tâm
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
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
                <Plus className="mr-2 h-4 w-4" /> Tạo tin tức
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo tin tức mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin để tạo tin tức, thông báo hoặc sự kiện mới
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nhập tiêu đề tin tức..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nội dung *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nhập nội dung tin tức..."
                            rows={6}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={() => (
                      <FormItem>
                        <FormLabel>Đối tượng xem tin tức *</FormLabel>
                        <div className="flex flex-col gap-3">
                          {["public", "manager", "instructor", "member"].map(
                            (type) => (
                              <div
                                key={type}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={type}
                                  checked={form.watch("type").includes(type)}
                                  onCheckedChange={(checked) =>
                                    handleTypeChange(type, checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor={type}
                                  className="cursor-pointer"
                                >
                                  {type === "public"
                                    ? "Công khai (Tất cả mọi người)"
                                    : type === "manager"
                                    ? "Quản lý (Chỉ quản lý có thể xem)"
                                    : type === "instructor"
                                    ? "Huấn luyện viên (Quản lý và HLV có thể xem)"
                                    : "Học viên (Quản lý và học viên có thể xem)"}
                                </Label>
                              </div>
                            )
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="coverFile"
                    render={({ field: { value, onChange, ...field } }) => (
                      <FormItem>
                        <FormLabel>Ảnh bìa</FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-4">
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id="cover"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  onChange(file);
                                  const reader = new FileReader();
                                  reader.onload = (e) => {
                                    setImagePreview(e.target?.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() =>
                                document.getElementById("cover")?.click()
                              }
                            >
                              <Upload className="mr-2 h-4 w-4" />
                              Chọn ảnh
                            </Button>
                            {imagePreview && (
                              <div className="relative">
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="h-20 w-20 object-cover rounded"
                                />
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-6 w-6"
                                  type="button"
                                  onClick={() => {
                                    onChange(null);
                                    setImagePreview(null);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? "Đang tạo..." : "Tạo tin tức"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tổng số tin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Megaphone className="h-8 w-8 text-primary" />
              <div className="text-2xl font-bold">{newsItems.length}</div>
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng số tin tức hiện có
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Công khai</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newsItems.filter((n) => n.type.includes("public")).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Tin công khai cho tất cả
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Huấn luyện viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newsItems.filter((n) => n.type.includes("instructor")).length}
            </div>
            <p className="text-xs text-muted-foreground">Tin cho HLV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Học viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newsItems.filter((n) => n.type.includes("member")).length}
            </div>
            <p className="text-xs text-muted-foreground">Tin cho học viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Danh sách tin tức</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={newsItems}
            searchKey="title"
            searchPlaceholder="Tìm kiếm theo tiêu đề..."
            onServerSearch={handleServerSearch}
            emptyMessage="Không tìm thấy tin tức nào."
          />
        </CardContent>
      </Card>
    </>
  );
}
