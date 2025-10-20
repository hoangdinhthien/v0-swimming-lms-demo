"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  ChevronRight,
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
import { fetchStaffNews } from "@/api/staff-data/staff-data-api";

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  type: string[];
  cover?: any;
  created_at: string;
  created_by?: {
    _id: string;
    username: string;
    email: string;
  };
  updated_at: string;
}

export default function StaffNewsPage() {
  const router = useRouter();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setIsLoading(true);
        setError(null);

        // Use staff API to fetch news
        const response = await fetchStaffNews(1, 1000);

        // Extract data from the nested response structure
        // Based on API response: data: [[{ documents: [...] }]]
        const documents = response?.data?.[0]?.[0]?.documents || [];
        setNewsItems(documents);
      } catch (err: any) {
        setError(err.message || "Lỗi không xác định");
        setNewsItems([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNews();
  }, []);

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
  const managerNews = newsItems.filter((news) =>
    Array.isArray(news.type) ? news.type.includes("manager") : false
  ).length;
  const instructorNews = newsItems.filter((news) =>
    Array.isArray(news.type) ? news.type.includes("instructor") : false
  ).length;
  const memberNews = newsItems.filter((news) =>
    Array.isArray(news.type) ? news.type.includes("member") : false
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
          case "manager":
            return "Quản lý";
          case "instructor":
            return "Giáo viên";
          case "member":
            return "Học viên";
          default:
            return type;
        }
      })
      .join(", ");
  };

  // Get news type badge color
  const getNewsTypeBadgeClass = (types: string[]) => {
    if (!Array.isArray(types) || types.length === 0)
      return "bg-gray-50 text-gray-700 border-gray-200";

    const primaryType = types[0];
    switch (primaryType) {
      case "manager":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "instructor":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "member":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
    }
  };

  // Get content preview
  const getContentPreview = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  // Get cover image URL
  const getCoverImageUrl = (cover: any) => {
    if (!cover) return null;

    // Handle array format
    if (Array.isArray(cover) && cover.length > 0) {
      return cover[0]?.path || null;
    }

    // Handle object format
    if (typeof cover === "object" && cover?.path) {
      return cover.path;
    }

    return null;
  };

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải danh sách tin tức...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>
            Lỗi tải dữ liệu
          </div>
          <p className='text-muted-foreground'>{error}</p>
          <Button onClick={() => window.location.reload()}>Thử lại</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/staff'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về trang nhân viên
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Quản lý tin tức</h1>
          <p className='text-muted-foreground'>
            Xem tất cả tin tức, thông báo và sự kiện của trung tâm
          </p>
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
            <p className='text-xs text-muted-foreground mt-1'>Tất cả tin tức</p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Megaphone className='h-4 w-4 text-blue-600' />
              Tin quản lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {managerNews}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Dành cho quản lý
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Users className='h-4 w-4 text-green-600' />
              Tin giáo viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {instructorNews}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Dành cho giáo viên
            </p>
          </CardContent>
        </Card>

        <Card className='bg-card/80 backdrop-blur-sm border shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Calendar className='h-4 w-4 text-orange-600' />
              Tin học viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {memberNews}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Dành cho học viên
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
                  <SelectItem value='manager'>
                    <div className='flex items-center gap-2'>
                      <Megaphone className='h-4 w-4 text-blue-600' />
                      Tin quản lý
                    </div>
                  </SelectItem>
                  <SelectItem value='instructor'>
                    <div className='flex items-center gap-2'>
                      <Users className='h-4 w-4 text-green-600' />
                      Tin giáo viên
                    </div>
                  </SelectItem>
                  <SelectItem value='member'>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-orange-600' />
                      Tin học viên
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
                  <TableHead className='w-8'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNews.length > 0 ? (
                  filteredNews.map((news) => (
                    <TableRow
                      key={news._id}
                      className='cursor-pointer hover:bg-muted/50 transition-colors border-border/30 group'
                      onClick={() =>
                        router.push(`/dashboard/staff/news/${news._id}`)
                      }
                    >
                      <TableCell className='py-4'>
                        <div className='flex items-start gap-3'>
                          <div className='min-w-0 flex-1'>
                            <div className='font-medium text-foreground group-hover:text-primary transition-colors leading-tight'>
                              {news.title}
                            </div>
                            {news.created_by && (
                              <div className='text-xs text-muted-foreground mt-1'>
                                Bởi:{" "}
                                {news.created_by.username ||
                                  news.created_by.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='text-sm text-muted-foreground group-hover:text-foreground transition-colors'>
                          {getContentPreview(news.content)}
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='flex flex-wrap gap-1'>
                          {Array.isArray(news.type) ? (
                            news.type.slice(0, 2).map((type, index) => (
                              <Badge
                                key={index}
                                variant='outline'
                                className={`text-xs transition-all duration-200 ${getNewsTypeBadgeClass(
                                  [type]
                                )}`}
                              >
                                {type === "manager"
                                  ? "Quản lý"
                                  : type === "instructor"
                                  ? "Giáo viên"
                                  : type === "member"
                                  ? "Học viên"
                                  : type}
                              </Badge>
                            ))
                          ) : (
                            <Badge
                              variant='outline'
                              className='text-xs bg-gray-50 text-gray-700 border-gray-200'
                            >
                              -
                            </Badge>
                          )}
                          {Array.isArray(news.type) && news.type.length > 2 && (
                            <Badge
                              variant='outline'
                              className='text-xs bg-gray-50 text-gray-700 border-gray-200'
                            >
                              +{news.type.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='py-4'>
                        <div className='text-sm text-muted-foreground group-hover:text-foreground transition-colors'>
                          {formatDate(news.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className='py-4 w-8'>
                        <ChevronRight className='h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200' />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className='text-center py-12'
                    >
                      <div className='flex flex-col items-center gap-2'>
                        <FileText className='h-8 w-8 text-muted-foreground/50' />
                        <p className='text-muted-foreground font-medium'>
                          Không tìm thấy tin tức phù hợp
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          Thử điều chỉnh bộ lọc hoặc tìm kiếm khác
                        </p>
                      </div>
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
