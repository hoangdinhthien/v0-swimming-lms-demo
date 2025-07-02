"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MapPin,
  Loader2,
  Book,
  School,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  fetchSlotDetail,
  normalizePools,
  getSlotTimeRange,
  type SlotDetail,
  type SlotSchedule,
  type Pool,
  type Classroom,
} from "@/api/slot-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";
import config from "@/api/config.json";

// Add some custom styles for the page
const customStyles = `
  @keyframes progress {
    0% {
      width: 0%;
    }
    50% {
      width: 70%;
    }
    100% {
      width: 100%;
    }
  }

  .animate-progress {
    animation: progress 1.5s ease-in-out infinite;
  }
`;

export default function SlotDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slotDetail, setSlotDetail] = useState<SlotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get parameters from URL
  const scheduleId = searchParams.get("scheduleId");
  const slotId = searchParams.get("slotId");
  const date = searchParams.get("date");
  const slotTitle = searchParams.get("slotTitle");

  // Format date display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // No longer needed as we're using fetchSlotDetail from slot-api.ts directly

  // LEGACY: This function is kept for reference but should not be used anymore
  // Map display slot IDs to slot details based on the calendar's default slots
  const getSlotDetailFromDisplayId = (
    displayId: string,
    title?: string
  ): SlotDetail => {
    console.warn(
      "DEPRECATED: Using legacy getSlotDetailFromDisplayId function"
    );
    // The actual implementation has been removed as we're now using MongoDB ObjectIds
    throw new Error(
      "Legacy function should not be used. Please use MongoDB ObjectId instead."
    );
  };

  // Load slot details on component mount
  useEffect(() => {
    const loadSlotDetails = async () => {
      if (!slotId || !date) {
        setError("Không tìm thấy thông tin slot hoặc ngày");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if slotId is a display ID (like "slot1", "slot2") or an actual MongoDB ObjectId
        const isDisplayId = /^slot\d+$/.test(slotId);
        let actualSlotId = slotId;

        if (isDisplayId) {
          // We need to fetch the actual MongoDB ObjectId for this slot from the schedules API
          console.log("Display slot ID detected, fetching actual slot ID...");

          const tenantId = getSelectedTenant();
          const token = getAuthToken();

          if (!tenantId || !token) {
            throw new Error("Missing authentication or tenant information");
          }

          // Calculate the start of the week and end of the week for the given date
          const dateObj = new Date(date);
          const startDate = new Date(dateObj);
          startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week (Sunday)
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 6); // End of week (Saturday)

          const startDateStr = startDate.toISOString().split("T")[0];
          const endDateStr = endDate.toISOString().split("T")[0];

          // Fetch schedules to get the actual slot ID
          const response = await fetch(
            `${config.API}/v1/workflow-process/schedules?startDate=${startDateStr}&endDate=${endDateStr}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "x-tenant-id": tenantId,
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch schedules: ${response.status}`);
          }

          const schedulesData = await response.json();

          // Extract slot MongoDB ID from the schedules data
          let found = false;
          if (schedulesData.data && Array.isArray(schedulesData.data)) {
            // Get the slot number from the display ID (e.g., "1" from "slot1")
            const slotNumber = slotId.replace(/[^0-9]/g, "");

            // Navigate through the nested arrays
            for (const outerArray of schedulesData.data) {
              if (!Array.isArray(outerArray) || found) continue;

              for (const innerArray of outerArray) {
                if (!Array.isArray(innerArray) || found) continue;

                // Look for a schedule that has a slot with matching properties
                for (const schedule of innerArray) {
                  if (schedule.slot && typeof schedule.slot === "object") {
                    // Check for slot title containing the slot number or for display ID matching
                    if (
                      (schedule.slot.title &&
                        schedule.slot.title.includes(slotNumber)) ||
                      (schedule.slot.displayId &&
                        schedule.slot.displayId === slotId)
                    ) {
                      actualSlotId = schedule.slot._id;
                      console.log(
                        `Found actual slot ID for ${slotId}: ${actualSlotId}`
                      );
                      found = true;
                      break;
                    }
                  }
                }
                if (found) break;
              }
              if (found) break;
            }
          }

          if (!found) {
            console.warn(
              `Could not find actual MongoDB ObjectId for display ID ${slotId}`
            );
            setError(
              `Không thể tìm thấy thông tin chi tiết cho slot ${slotId}. Vui lòng thử lại sau.`
            );
            setLoading(false);
            return;
          }
        }

        console.log(
          "Fetching slot details for ID:",
          actualSlotId,
          "date:",
          date
        );

        // Use the actual MongoDB ObjectId to fetch slot details
        const detail = await fetchSlotDetail(actualSlotId, date);
        setSlotDetail(detail);

        // Log the fetched data
        console.log("Fetched slot detail:", detail);
      } catch (err) {
        console.error("Error fetching slot details:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch slot details"
        );
      } finally {
        setLoading(false);
      }
    };

    loadSlotDetails();
  }, [slotId, date]);

  // Show loading state
  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-muted/20'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-6'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-blue-100/50 dark:bg-blue-900/20 opacity-70 blur-3xl animate-pulse'></div>
              <div className='relative h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-blue-100/80 to-blue-50/60 dark:from-blue-900/30 dark:to-blue-900/10 border border-blue-200 dark:border-blue-700/30 shadow-xl flex items-center justify-center'>
                <Loader2 className='h-10 w-10 animate-spin text-blue-500 dark:text-blue-400' />
              </div>
            </div>
            <div className='space-y-3 max-w-md mx-auto'>
              <h3 className='text-xl font-bold text-foreground'>
                Đang tải chi tiết slot
              </h3>
              <p className='text-muted-foreground text-base'>
                Hệ thống đang lấy thông tin chi tiết về slot và lịch học. Vui
                lòng chờ trong giây lát...
              </p>
              <div className='w-full max-w-xs mx-auto h-1.5 bg-muted rounded-full mt-4 overflow-hidden'>
                <div className='h-full bg-blue-500/70 rounded-full animate-progress'></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-background to-muted/20'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-8 max-w-md'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/20 opacity-30 blur-3xl'></div>
              <div className='relative'>
                <div className='h-24 w-24 mx-auto bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/10 rounded-full flex items-center justify-center border-2 border-red-200/70 dark:border-red-700/30 shadow-lg'>
                  <AlertCircle className='h-12 w-12 text-red-500 dark:text-red-400' />
                </div>
              </div>
            </div>
            <div className='space-y-5'>
              <div>
                <h3 className='text-2xl font-bold text-red-600 dark:text-red-400 mb-2'>
                  Không thể tải dữ liệu
                </h3>
                <p className='text-muted-foreground text-lg'>
                  Đã có lỗi xảy ra khi tải thông tin chi tiết của slot
                </p>
              </div>
              <div className='bg-white dark:bg-slate-900 p-4 rounded-xl border border-red-200 dark:border-red-800/30 shadow-sm'>
                <p className='text-red-600 dark:text-red-400 font-mono text-sm'>
                  {error}
                </p>
              </div>
              <div className='pt-4'>
                <Button
                  onClick={() => router.back()}
                  className='bg-red-600 hover:bg-red-700 text-white px-6 py-2 h-auto shadow-lg hover:shadow-xl transition-all duration-200'
                >
                  <ArrowLeft className='mr-2 h-4 w-4' />
                  Quay lại
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-background to-muted/10'>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <div className='max-w-7xl mx-auto px-6 py-6 space-y-8'>
        {/* Breadcrumb */}
        <div className='flex items-center space-x-2 text-sm'>
          <div className='flex items-center space-x-2 bg-muted/20 px-3 py-1.5 rounded-lg border border-muted/30'>
            <Link
              href='/dashboard'
              className='text-muted-foreground hover:text-foreground transition-colors duration-200'
            >
              Dashboard
            </Link>
            <span className='text-muted-foreground/50'>→</span>
            <Link
              href='/dashboard/manager'
              className='text-muted-foreground hover:text-foreground transition-colors duration-200'
            >
              Manager
            </Link>
            <span className='text-muted-foreground/50'>→</span>
            <Link
              href='/dashboard/manager/calendar'
              className='text-muted-foreground hover:text-foreground transition-colors duration-200'
            >
              Lịch
            </Link>
            <span className='text-muted-foreground/50'>→</span>
            <span className='text-foreground font-medium'>Chi tiết Slot</span>
          </div>
          <Link
            href='/dashboard/manager/calendar'
            className='ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/30 px-3 py-1.5 rounded-lg border border-muted/30'
          >
            <ArrowLeft className='h-4 w-4' />
            Quay về Lịch
          </Link>
        </div>

        {/* Header */}
        <div className='relative'>
          <div className='absolute inset-0 bg-primary/5 rounded-3xl blur-3xl'></div>
          <div className='relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-8 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm border border-muted/40 rounded-2xl shadow-xl'>
            <div className='space-y-3'>
              <div className='inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary-foreground/80 text-sm font-medium'>
                <Clock className='mr-2 h-4 w-4 text-primary' />
                {slotDetail?.title || slotTitle}
              </div>
              <h1 className='text-4xl font-bold text-foreground'>
                Chi Tiết Slot
              </h1>
              <p className='text-muted-foreground text-lg'>
                Thông tin chi tiết về {slotDetail?.title || slotTitle} -{" "}
                {date && formatDate(date + "T00:00:00.000Z")}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Badge
                variant='secondary'
                className='px-4 py-2 text-sm font-medium border border-muted bg-secondary/50 hover:bg-secondary/70 transition-colors duration-200'
              >
                <CalendarIcon className='mr-2 h-4 w-4' />
                {date && new Date(date).toLocaleDateString("vi-VN")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid gap-8 lg:grid-cols-3'>
          {/* Slot Information */}
          <div className='lg:col-span-1'>
            <Card className='bg-gradient-to-br from-card to-card/90 backdrop-blur-sm border border-muted/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden'>
              <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80'></div>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-3'>
                  <div className='p-2 bg-primary/20 rounded-lg'>
                    <Clock className='h-5 w-5 text-primary' />
                  </div>
                  <span className='text-lg text-foreground'>
                    Thông Tin Slot
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-5 pt-2'>
                <div className='space-y-3'>
                  <div className='group flex justify-between items-center p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-muted/50 transition-all duration-200'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1 bg-background rounded-md'>
                        <CalendarIcon className='h-4 w-4 text-primary' />
                      </div>
                      <span className='text-sm font-medium text-foreground'>
                        Tên Slot
                      </span>
                    </div>
                    <span className='font-bold text-foreground group-hover:text-primary transition-colors'>
                      {slotDetail?.title || slotTitle || "N/A"}
                    </span>
                  </div>

                  <div className='group flex justify-between items-center p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-muted/50 transition-all duration-200'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1 bg-background rounded-md'>
                        <CalendarIcon className='h-4 w-4 text-primary' />
                      </div>
                      <span className='text-sm font-medium text-foreground'>
                        Ngày
                      </span>
                    </div>
                    <span className='font-bold text-foreground group-hover:text-primary transition-colors'>
                      {date && new Date(date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div className='group flex justify-between items-center p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-muted/50 transition-all duration-200'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1 bg-background rounded-md'>
                        <Clock className='h-4 w-4 text-primary' />
                      </div>
                      <span className='text-sm font-medium text-foreground'>
                        Thời gian
                      </span>
                    </div>
                    <span className='font-bold text-foreground group-hover:text-primary transition-colors'>
                      {slotDetail ? getSlotTimeRange(slotDetail) : "N/A"}
                    </span>
                  </div>

                  <div className='group flex justify-between items-center p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-muted/50 transition-all duration-200'>
                    <div className='flex items-center gap-2'>
                      <div className='p-1 bg-background rounded-md'>
                        <Clock className='h-4 w-4 text-primary' />
                      </div>
                      <span className='text-sm font-medium text-foreground'>
                        Thời lượng
                      </span>
                    </div>
                    <span className='font-bold text-foreground group-hover:text-primary transition-colors'>
                      {slotDetail?.duration || "N/A"}
                    </span>
                  </div>

                  <div className='relative p-4 bg-gradient-to-r from-emerald-50 to-emerald-50/70 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-lg border border-emerald-200 dark:border-emerald-700/50 overflow-hidden'>
                    <div className='absolute top-0 right-0 w-20 h-20 bg-emerald-100 dark:bg-emerald-700/20 rounded-full -translate-y-10 translate-x-5 opacity-70'></div>
                    <div className='absolute bottom-0 left-0 w-16 h-16 bg-emerald-100 dark:bg-emerald-700/20 rounded-full translate-y-8 -translate-x-5 opacity-70'></div>
                    <div className='relative flex items-center gap-3 mb-2'>
                      <div className='p-1.5 bg-emerald-100 dark:bg-emerald-800/40 rounded-full'>
                        <CheckCircle className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                      </div>
                      <span className='text-sm font-semibold text-emerald-800 dark:text-emerald-200'>
                        Trạng Thái
                      </span>
                    </div>
                    <p className='relative ml-9 text-emerald-700 dark:text-emerald-300 text-sm'>
                      Slot đang hoạt động
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Details */}
          <div className='lg:col-span-2'>
            <Card className='bg-gradient-to-br from-card to-card/90 backdrop-blur-sm border border-muted/30 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden'>
              <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/80 via-blue-500 to-blue-500/80'></div>
              <CardHeader className='pb-2'>
                <CardTitle className='flex items-center gap-3'>
                  <div className='p-2 bg-blue-500/20 rounded-lg'>
                    <School className='h-5 w-5 text-blue-500' />
                  </div>
                  <span className='text-lg text-foreground'>
                    Lớp Học và Hồ Bơi
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-2'>
                {slotDetail && slotDetail.schedules.length > 0 ? (
                  <div className='space-y-6'>
                    {slotDetail.schedules.map(
                      (schedule: SlotSchedule, index: number) => (
                        <div
                          key={schedule._id}
                          className='relative border border-blue-200/50 dark:border-blue-700/30 rounded-xl p-6 bg-gradient-to-br from-blue-50/50 to-blue-50/30 dark:from-blue-900/10 dark:to-blue-900/5 hover:from-blue-50/70 hover:to-blue-50/40 dark:hover:from-blue-900/15 dark:hover:to-blue-900/10 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden'
                        >
                          {/* Decorative elements */}
                          <div className='absolute top-0 right-0 w-40 h-40 bg-blue-100/70 dark:bg-blue-800/10 rounded-full -translate-y-20 translate-x-20 blur-2xl'></div>
                          <div className='absolute bottom-0 left-0 w-32 h-32 bg-blue-100/70 dark:bg-blue-800/10 rounded-full translate-y-16 -translate-x-16 blur-2xl'></div>

                          <div className='relative space-y-4'>
                            {/* Class Info Header */}
                            <div className='flex items-center justify-between'>
                              <div className='flex items-center gap-3'>
                                <div className='p-1.5 bg-blue-100 dark:bg-blue-800/30 rounded-full'>
                                  <School className='h-5 w-5 text-blue-500 dark:text-blue-400' />
                                </div>
                                <h3 className='text-xl font-bold text-foreground'>
                                  {schedule.classroom.name}
                                </h3>
                              </div>
                              <Badge
                                variant='secondary'
                                className='px-3 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50'
                              >
                                Lớp {index + 1}
                              </Badge>
                            </div>

                            <Separator className='bg-blue-200/50 dark:bg-blue-700/30' />

                            {/* Schedule Details Grid */}
                            <div className='grid md:grid-cols-2 gap-5'>
                              {/* Classroom Info */}
                              <div className='space-y-3'>
                                <h4 className='font-semibold text-foreground flex items-center gap-2'>
                                  <div className='p-1 bg-blue-100/70 dark:bg-blue-800/20 rounded-md'>
                                    <School className='h-4 w-4 text-blue-500 dark:text-blue-400' />
                                  </div>
                                  Lớp Học
                                </h4>
                                <div className='space-y-2'>
                                  <div className='p-4 bg-background/70 dark:bg-background/50 backdrop-blur-sm rounded-lg border border-blue-100 dark:border-blue-900/30 hover:border-blue-200 dark:hover:border-blue-700/50 transition-colors duration-200 shadow-sm'>
                                    <div className='flex items-center justify-between mb-3'>
                                      <div className='flex items-center gap-2'>
                                        <div className='h-8 w-8 rounded-full bg-blue-100/70 dark:bg-blue-800/20 flex items-center justify-center'>
                                          <School className='h-4 w-4 text-blue-500 dark:text-blue-400' />
                                        </div>
                                        <span className='font-medium text-lg'>
                                          {schedule.classroom.name}
                                        </span>
                                      </div>
                                      <Badge
                                        variant='outline'
                                        className='text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/30 px-2 py-1'
                                      >
                                        <Users className='h-3 w-3 mr-1' />
                                        {schedule.classroom.member?.length ||
                                          0}{" "}
                                        học viên
                                      </Badge>
                                    </div>
                                    <div className='flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-muted/30'>
                                      <Book className='h-4 w-4 text-blue-500 dark:text-blue-400' />
                                      <span>Khóa học: </span>
                                      <span className='font-medium'>
                                        {schedule.classroom.course}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Pool Info */}
                              <div className='space-y-3'>
                                <h4 className='font-semibold text-foreground flex items-center gap-2'>
                                  <div className='p-1 bg-blue-100/70 dark:bg-blue-800/20 rounded-md'>
                                    <MapPin className='h-4 w-4 text-blue-500 dark:text-blue-400' />
                                  </div>
                                  Hồ Bơi
                                </h4>
                                <div className='space-y-2'>
                                  {normalizePools(schedule.pool).length > 0 ? (
                                    normalizePools(schedule.pool).map(
                                      (pool: Pool) => (
                                        <div
                                          key={pool._id}
                                          className='overflow-hidden relative p-4 bg-gradient-to-br from-blue-50/80 to-blue-50/60 dark:from-blue-900/15 dark:to-blue-900/10 rounded-lg border border-blue-200/70 dark:border-blue-800/30 hover:border-blue-300 dark:hover:border-blue-700/50 transition-all duration-200 shadow-sm'
                                        >
                                          <div className='absolute top-0 right-0 w-24 h-24 bg-blue-100/70 dark:bg-blue-800/10 rounded-full -translate-y-12 translate-x-12 blur-xl'></div>

                                          <div className='relative'>
                                            <div className='flex items-center justify-between mb-3'>
                                              <div className='flex items-center gap-2'>
                                                <div className='h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center'>
                                                  <MapPin className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                                                </div>
                                                <span className='font-medium text-lg text-blue-900 dark:text-blue-100'>
                                                  {pool.title}
                                                </span>
                                              </div>
                                              <Badge
                                                variant='outline'
                                                className={`text-xs px-2 py-0.5 ${
                                                  pool.maintance_status ===
                                                  "Đang hoạt động"
                                                    ? "bg-green-50/80 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/50"
                                                    : "bg-amber-50/80 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700/50"
                                                }`}
                                              >
                                                <div
                                                  className={`mr-1 h-2 w-2 rounded-full ${
                                                    pool.maintance_status ===
                                                    "Đang hoạt động"
                                                      ? "bg-green-500"
                                                      : "bg-amber-500"
                                                  }`}
                                                ></div>
                                                {pool.maintance_status}
                                              </Badge>
                                            </div>

                                            <div className='mt-3 grid grid-cols-2 gap-2 text-sm'>
                                              <div className='bg-white/70 dark:bg-white/5 rounded-md p-2 border border-blue-100 dark:border-blue-800/20'>
                                                <div className='text-xs text-blue-600 dark:text-blue-400 mb-1'>
                                                  Loại hồ bơi
                                                </div>
                                                <div className='font-medium text-foreground'>
                                                  {pool.type}
                                                </div>
                                              </div>

                                              <div className='bg-white/70 dark:bg-white/5 rounded-md p-2 border border-blue-100 dark:border-blue-800/20'>
                                                <div className='text-xs text-blue-600 dark:text-blue-400 mb-1'>
                                                  Kích thước
                                                </div>
                                                <div className='font-medium text-foreground'>
                                                  {pool.dimensions}
                                                </div>
                                              </div>

                                              <div className='bg-white/70 dark:bg-white/5 rounded-md p-2 border border-blue-100 dark:border-blue-800/20'>
                                                <div className='text-xs text-blue-600 dark:text-blue-400 mb-1'>
                                                  Độ sâu
                                                </div>
                                                <div className='font-medium text-foreground'>
                                                  {pool.depth}
                                                </div>
                                              </div>

                                              <div className='bg-white/70 dark:bg-white/5 rounded-md p-2 border border-blue-100 dark:border-blue-800/20'>
                                                <div className='text-xs text-blue-600 dark:text-blue-400 mb-1'>
                                                  Sức chứa
                                                </div>
                                                <div className='font-medium text-foreground'>
                                                  {pool.capacity} người
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div className='p-6 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30 text-center'>
                                      <div className='h-12 w-12 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3'>
                                        <MapPin className='h-6 w-6 text-muted-foreground' />
                                      </div>
                                      <span className='text-sm text-muted-foreground block'>
                                        Chưa chỉ định hồ bơi
                                      </span>
                                      <span className='text-xs text-muted-foreground/70 mt-1 block'>
                                        Vui lòng quay lại lịch và cập nhật thông
                                        tin hồ bơi
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <div className='text-center py-16 space-y-8'>
                    <div className='relative'>
                      <div className='absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-900/20 opacity-30 blur-3xl'></div>
                      <div className='relative'>
                        <div className='h-24 w-24 mx-auto bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/10 rounded-full flex items-center justify-center border-2 border-blue-200/70 dark:border-blue-700/30 shadow-lg'>
                          <CalendarIcon className='h-10 w-10 text-blue-500 dark:text-blue-400' />
                        </div>
                        <div className='absolute -right-6 top-3 h-8 w-8 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center border border-amber-200 dark:border-amber-700/50'>
                          <AlertCircle className='h-5 w-5 text-amber-500 dark:text-amber-400' />
                        </div>
                      </div>
                    </div>
                    <div className='space-y-6 max-w-lg mx-auto'>
                      <div className='space-y-3'>
                        <h3 className='text-2xl font-bold text-foreground'>
                          Slot trống
                        </h3>
                        <p className='text-muted-foreground text-lg'>
                          Trong slot{" "}
                          <span className='font-semibold text-blue-600 dark:text-blue-400'>
                            {slotDetail?.title || slotTitle}
                          </span>{" "}
                          vào ngày{" "}
                          <span className='font-semibold text-blue-600 dark:text-blue-400'>
                            {date && new Date(date).toLocaleDateString("vi-VN")}
                          </span>{" "}
                          hiện chưa có lớp học nào được xếp lịch.
                        </p>
                      </div>

                      <div className='relative overflow-hidden p-5 bg-gradient-to-r from-amber-50 to-amber-50/50 dark:from-amber-900/10 dark:to-amber-900/5 rounded-xl border border-amber-200 dark:border-amber-700/30 max-w-md mx-auto shadow-sm'>
                        <div className='absolute top-0 right-0 w-32 h-32 bg-amber-100/70 dark:bg-amber-800/10 rounded-full -translate-y-16 translate-x-16 blur-xl'></div>
                        <div className='absolute bottom-0 left-0 w-24 h-24 bg-amber-100/70 dark:bg-amber-800/10 rounded-full translate-y-12 -translate-x-12 blur-xl'></div>

                        <div className='relative flex items-start gap-4'>
                          <div className='p-2 bg-amber-100 dark:bg-amber-900/20 rounded-full mt-0.5'>
                            <AlertCircle className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                          </div>
                          <div className='space-y-2 text-left'>
                            <p className='text-base font-semibold text-amber-800 dark:text-amber-300'>
                              Thêm lớp học vào slot này
                            </p>
                            <p className='text-sm text-amber-700 dark:text-amber-400'>
                              Bạn có thể thêm lớp học mới vào slot này bằng cách
                              quay lại trang lịch và chọn "Thêm lớp học" trong
                              slot tương ứng.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='flex justify-center gap-4 pt-6'>
                        <Button
                          onClick={() => router.back()}
                          variant='outline'
                          className='px-6 py-2 h-auto border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200'
                        >
                          <ArrowLeft className='mr-2 h-4 w-4' />
                          Quay lại
                        </Button>
                        <Button
                          onClick={() =>
                            router.push("/dashboard/manager/calendar")
                          }
                          className='px-6 py-2 h-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200'
                        >
                          <CalendarIcon className='mr-2 h-4 w-4' />
                          Về trang lịch
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
