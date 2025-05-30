"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getNewsById, type NewsItem, formatRelativeTime } from "@/api/news-api";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNewsDetail() {
      if (typeof params.id !== "string") {
        setError("Invalid notification ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const newsDetail = await getNewsById(params.id);

        if (!newsDetail) {
          setError("Notification not found");
        } else {
          setNewsItem(newsDetail);
        }
      } catch (err) {
        setError("Failed to load notification details");
        console.error("Error fetching notification details:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNewsDetail();
  }, [params.id]);

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

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-3/4' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <Skeleton className='h-4 w-1/3' />
              <Skeleton className='h-32 w-full' />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-red-500'>{error}</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Unable to load the notification details.</p>
            <Button
              onClick={() => router.push("/dashboard/manager")}
              className='mt-4'
            >
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      ) : (
        newsItem && (
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl'>{newsItem.title}</CardTitle>
              <div className='flex flex-col gap-1 text-sm text-muted-foreground mt-2'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-3.5 w-3.5' />
                  <span>{formatRelativeTime(newsItem.created_at)}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <User className='h-3.5 w-3.5' />
                  <span>
                    For:{" "}
                    {newsItem.type
                      .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
                      .join(", ")}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='prose max-w-none'>
                <p>{newsItem.content}</p>
                {/* If there's cover image, display it */}
                {newsItem.cover && (
                  <div className='mt-4'>
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL}/files/${newsItem.cover}`}
                      alt={newsItem.title}
                      className='rounded-md max-w-full h-auto'
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      )}
    </>
  );
}
