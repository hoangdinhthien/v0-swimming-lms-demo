"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNews, type NewsItem, formatRelativeTime } from "@/api/news-api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, Eye, Trash2 } from "lucide-react";

// Extended NewsItem type with read property
interface ExtendedNewsItem extends NewsItem {
  read?: boolean;
}

export default function NotificationsListPage() {
  const [newsItems, setNewsItems] = useState<ExtendedNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        setIsLoading(true);
        const news = await getNews();
        // Add read property to news items (defaulting to false for new items)
        const extendedNews = news.map((item) => ({
          ...item,
          read: false, // In a real app, this would come from the API
        }));
        setNewsItems(extendedNews);
      } catch (error) {
        console.error("Error fetching news:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNews();
  }, []);

  const unreadCount = newsItems.filter((n) => !n.read).length;

  const getTypeColor = (type: string | string[]) => {
    const typeStr = Array.isArray(type) ? type[0] : type;
    switch (typeStr) {
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link
          href="/dashboard/manager"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with the latest activities and alerts
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {unreadCount} unread
        </Badge>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Notifications</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                All Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsItems.map((notification) => (
                    <TableRow key={notification._id}>
                      <TableCell>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {notification.title}
                      </TableCell>
                      <TableCell>{notification.content}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(notification.type)}>
                          {Array.isArray(notification.type)
                            ? notification.type[0]
                            : notification.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatRelativeTime(notification.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread">
          <Card>
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsItems
                    .filter((n) => !n.read)
                    .map((notification) => (
                      <TableRow key={notification._id}>
                        <TableCell className="font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell>{notification.content}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(notification.type)}>
                            {Array.isArray(notification.type)
                              ? notification.type[0]
                              : notification.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatRelativeTime(notification.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="read">
          <Card>
            <CardHeader>
              <CardTitle>Read Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newsItems
                    .filter((n) => n.read)
                    .map((notification) => (
                      <TableRow key={notification._id}>
                        <TableCell className="font-medium">
                          {notification.title}
                        </TableCell>
                        <TableCell>{notification.content}</TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(notification.type)}>
                            {Array.isArray(notification.type)
                              ? notification.type[0]
                              : notification.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatRelativeTime(notification.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
