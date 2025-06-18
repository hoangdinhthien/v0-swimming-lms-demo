"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNews, type NewsItem, formatRelativeTime } from "@/api/news-api";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsListPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Notifications</h1>
          <p className='text-muted-foreground'>
            View all manager notifications
          </p>
        </div>
      </div>

      <div className='mt-6'>
        <Card>
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='space-y-4'>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className='flex items-start gap-2 border-b pb-3'
                  >
                    <div className='mt-1 flex h-2 w-2 rounded-full bg-muted' />
                    <div className='flex flex-1 flex-col gap-1'>
                      <div className='h-4 w-3/4 rounded bg-muted' />
                      <div className='h-3 w-full rounded bg-muted' />
                      <div className='h-3 w-1/4 rounded bg-muted' />
                    </div>
                  </div>
                ))}
              </div>
            ) : newsItems.length > 0 ? (
              <div className='space-y-4'>
                {newsItems.map((newsItem) => (
                  <Link
                    key={newsItem._id}
                    href={`/dashboard/manager/notifications/${newsItem._id}`}
                    className='block'
                  >
                    <div className='flex items-start gap-2 border-b pb-3 last:border-0 hover:bg-muted/20 p-2 -mx-2 rounded-md transition-colors'>
                      <div className='mt-1 flex h-2 w-2 rounded-full bg-sky-500' />
                      <div className='flex flex-1 flex-col gap-1'>
                        <div className='text-sm font-medium'>
                          {newsItem.title}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {newsItem.content}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {formatRelativeTime(newsItem.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className='text-center py-8'>
                <p className='text-muted-foreground'>No notifications found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
