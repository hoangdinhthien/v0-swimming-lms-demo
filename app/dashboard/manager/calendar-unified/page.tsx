"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UnifiedCalendar from "@/components/calendar/unified-calendar";

import { fetchDateRangeSchedule, type ScheduleEvent } from "@/api/schedule-api";
import { fetchAllSlots, type SlotDetail } from "@/api/slot-api";
import {
  useCachedAPI,
  usePerformanceMonitor,
  apiCache,
} from "@/hooks/use-api-cache";

export default function UnifiedCalendarPage() {
  usePerformanceMonitor("UnifiedCalendarPage");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use cached API for slots
  const {
    data: allSlots,
    loading: slotsLoading,
    error: slotsError,
  } = useCachedAPI(
    "all-slots",
    fetchAllSlots,
    [],
    10 * 60 * 1000 // Cache for 10 minutes
  );

  // Function to refresh calendar data
  const refreshCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Refreshing unified calendar data...");

      // Clear cache to get fresh data
      apiCache.clear();

      // Fetch current month data
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const events = await fetchDateRangeSchedule(startOfMonth, endOfMonth);

      console.log(
        `✅ Loaded ${events.length} schedule events for unified calendar`
      );
      setScheduleEvents(events);
    } catch (err) {
      console.error("❌ Error loading unified calendar data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load calendar data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    refreshCalendarData();
  }, []);

  // Error state
  if (error) {
    return (
      <div className='container mx-auto py-8'>
        <div className='flex items-center gap-4 mb-6'>
          <Link href='/dashboard/manager'>
            <Button
              variant='outline'
              size='sm'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Quay lại
            </Button>
          </Link>
          <h1 className='text-2xl font-bold'>Unified Calendar</h1>
        </div>

        <Card>
          <CardContent className='p-6'>
            <div className='text-center text-red-600'>
              <p className='text-lg font-medium mb-2'>Có lỗi xảy ra</p>
              <p className='text-sm'>{error}</p>
              <Button
                onClick={refreshCalendarData}
                className='mt-4'
                disabled={loading}
              >
                {loading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
                Thử lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link href='/dashboard/manager'>
            <Button
              variant='outline'
              size='sm'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-2'>
              Unified Calendar
            </h1>
            <p className='text-muted-foreground mt-1'>
              Calendar thế hệ mới - Drag & Drop, Inline Editing, No Navigation
              Hell
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          <Link href='/dashboard/manager/calendar'>
            <Button
              variant='outline'
              size='sm'
            >
              Calendar cũ
            </Button>
          </Link>
          <Link href='/dashboard/manager/calendar-big'>
            <Button
              variant='outline'
              size='sm'
            >
              BigCalendar
            </Button>
          </Link>
        </div>
      </div>

      {/* Feature Highlights */}
      <Card className='bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-none'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            Tính năng mới
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 bg-green-500 rounded-full'></span>
              <span>
                <strong>Drag & Drop:</strong> Kéo thả lớp học giữa các slots
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
              <span>
                <strong>Inline Actions:</strong> Right-click để thao tác nhanh
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='w-2 h-2 bg-purple-500 rounded-full'></span>
              <span>
                <strong>No Navigation:</strong> Tất cả trong 1 màn hình
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unified Calendar */}
      <UnifiedCalendar
        scheduleEvents={scheduleEvents}
        allSlots={allSlots || []}
        loading={loading || slotsLoading}
        onRefresh={refreshCalendarData}
      />

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <Card className='bg-gray-50 dark:bg-gray-900'>
          <CardContent className='p-4'>
            <div className='text-xs text-muted-foreground space-y-1'>
              <div>📊 Debug Info:</div>
              <div>• Events loaded: {scheduleEvents.length}</div>
              <div>• Slots loaded: {allSlots?.length || 0}</div>
              <div>• Loading: {loading ? "Yes" : "No"}</div>
              <div>• Slots error: {slotsError || "None"}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
