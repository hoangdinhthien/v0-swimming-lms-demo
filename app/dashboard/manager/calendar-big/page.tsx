"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BigCalendar from "@/components/calendar/big-calendar";
import "@/components/calendar/big-calendar.css";

import {
  fetchMonthSchedule,
  fetchWeekSchedule,
  fetchDateRangeSchedule,
  type ScheduleEvent,
} from "@/api/schedule-api";
import { fetchAllSlots, type SlotDetail } from "@/api/slot-api";
import {
  useCachedAPI,
  usePerformanceMonitor,
  apiCache,
} from "@/hooks/use-api-cache";

export default function BigCalendarPage() {
  usePerformanceMonitor("BigCalendarPage");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use cached API for slots (they don't change often)
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
      console.log("🔄 Refreshing calendar data...");

      // Clear cache to get fresh data
      apiCache.clear();

      // For now, let's fetch a month of data around current date
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const events = await fetchDateRangeSchedule(startOfMonth, endOfMonth);

      console.log(`✅ Loaded ${events.length} schedule events`);
      setScheduleEvents(events);
    } catch (err) {
      console.error("❌ Error loading calendar data:", err);
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
          <h1 className='text-2xl font-bold'>Lịch Học (Big Calendar)</h1>
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
    <div className='container mx-auto py-8'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
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
          <h1 className='text-2xl font-bold'>Lịch Học (Big Calendar)</h1>
        </div>

        <div className='flex items-center gap-2'>
          <Link href='/dashboard/manager/calendar'>
            <Button
              variant='outline'
              size='sm'
            >
              Lịch cũ
            </Button>
          </Link>
          <Button
            onClick={refreshCalendarData}
            variant='outline'
            size='sm'
            disabled={loading}
          >
            {loading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
            Làm mới
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <BigCalendar
        scheduleEvents={scheduleEvents}
        allSlots={allSlots || []}
        loading={loading || slotsLoading}
        onRefresh={refreshCalendarData}
      />

      {/* Debug Info */}
      <div className='mt-6 text-sm text-muted-foreground'>
        <p>Events loaded: {scheduleEvents.length}</p>
        <p>Slots loaded: {allSlots?.length || 0}</p>
        {slotsError && <p className='text-red-500'>Slot error: {slotsError}</p>}
      </div>
    </div>
  );
}
