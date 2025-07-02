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
      <div className='min-h-screen bg-background'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-4'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-muted opacity-20 blur-xl animate-pulse'></div>
              <Loader2 className='relative h-12 w-12 animate-spin mx-auto text-muted-foreground' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-lg font-semibold text-foreground'>
                Đang tải chi tiết slot
              </h3>
              <p className='text-muted-foreground'>
                Vui lòng chờ trong giây lát...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className='min-h-screen bg-background'>
        <div className='flex items-center justify-center py-32'>
          <div className='text-center space-y-6 max-w-md'>
            <div className='relative'>
              <div className='absolute inset-0 rounded-full bg-destructive/20 opacity-20 blur-xl'></div>
              <div className='relative h-16 w-16 mx-auto bg-destructive rounded-full flex items-center justify-center'>
                <AlertCircle className='h-8 w-8 text-white' />
              </div>
            </div>
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold text-destructive'>
                Không thể tải dữ liệu
              </h3>
              <p className='text-muted-foreground bg-muted p-3 rounded-lg border'>
                {error}
              </p>
              <Button
                onClick={() => router.back()}
                className='bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg hover:shadow-xl transition-all duration-200'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Quay lại
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='max-w-7xl mx-auto px-6 py-6 space-y-8'>
        {/* Breadcrumb */}
        <div className='flex items-center space-x-2 text-sm opacity-80 hover:opacity-100 transition-opacity'>
          <Link
            href='/dashboard/manager/calendar'
            className='inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/10 px-2 py-1 rounded-md'
          >
            <ArrowLeft className='mr-1 h-4 w-4' />
            Quay về Lịch
          </Link>
        </div>

        {/* Header */}
        <div className='relative'>
          <div className='absolute inset-0 bg-muted/5 rounded-3xl blur-3xl'></div>
          <div className='relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between p-8 bg-card/80 backdrop-blur-sm border rounded-2xl shadow-xl'>
            <div className='space-y-2'>
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
                variant='outline'
                className='px-4 py-2 text-sm font-medium'
              >
                <Clock className='mr-2 h-4 w-4' />
                {slotDetail?.title || slotTitle}
              </Badge>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='grid gap-8 lg:grid-cols-3'>
          {/* Slot Information */}
          <div className='lg:col-span-1'>
            <Card className='bg-card/80 backdrop-blur-sm border shadow-xl hover:shadow-2xl transition-all duration-300'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <Clock className='h-5 w-5 text-primary-foreground' />
                  </div>
                  <span className='text-lg text-foreground'>
                    Thông Tin Slot
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center p-3 bg-muted/50 rounded-lg border'>
                    <span className='text-sm font-medium text-foreground'>
                      Tên Slot
                    </span>
                    <span className='font-bold text-foreground'>
                      {slotDetail?.title || slotTitle || "N/A"}
                    </span>
                  </div>

                  <div className='flex justify-between items-center p-3 bg-muted/50 rounded-lg border'>
                    <span className='text-sm font-medium text-foreground'>
                      Ngày
                    </span>
                    <span className='font-bold text-foreground'>
                      {date && new Date(date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <div className='flex justify-between items-center p-3 bg-muted/50 rounded-lg border'>
                    <span className='text-sm font-medium text-foreground'>
                      Thời gian
                    </span>
                    <span className='font-bold text-foreground'>
                      {slotDetail ? getSlotTimeRange(slotDetail) : "N/A"}
                    </span>
                  </div>

                  <div className='flex justify-between items-center p-3 bg-muted/50 rounded-lg border'>
                    <span className='text-sm font-medium text-foreground'>
                      Thời lượng
                    </span>
                    <span className='font-bold text-foreground'>
                      {slotDetail?.duration || "N/A"}
                    </span>
                  </div>

                  <div className='p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700'>
                    <div className='flex items-center gap-2 mb-2'>
                      <CheckCircle className='h-4 w-4 text-emerald-600' />
                      <span className='text-sm font-medium text-emerald-800 dark:text-emerald-200'>
                        Trạng Thái
                      </span>
                    </div>
                    <p className='text-emerald-700 dark:text-emerald-300 text-sm'>
                      Slot đang hoạt động
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Schedule Details */}
          <div className='lg:col-span-2'>
            <Card className='bg-card/80 backdrop-blur-sm border shadow-xl hover:shadow-2xl transition-all duration-300'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center gap-3'>
                  <div className='p-2 bg-primary rounded-lg'>
                    <CalendarIcon className='h-5 w-5 text-primary-foreground' />
                  </div>
                  <span className='text-lg text-foreground'>
                    Chi Tiết Lịch Học
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {slotDetail && slotDetail.schedules.length > 0 ? (
                  <div className='space-y-6'>
                    {slotDetail.schedules.map(
                      (schedule: SlotSchedule, index: number) => (
                        <div
                          key={schedule._id}
                          className='border rounded-xl p-6 bg-muted/20 hover:bg-muted/30 transition-all duration-200'
                        >
                          <div className='space-y-4'>
                            {/* Date and Day */}
                            <div className='flex items-center justify-between'>
                              <h3 className='text-xl font-bold text-foreground'>
                                {formatDate(schedule.date)}
                              </h3>
                              <Badge
                                variant='secondary'
                                className='px-3 py-1'
                              >
                                Lớp {index + 1}
                              </Badge>
                            </div>

                            <Separator />

                            {/* Schedule Details Grid */}
                            <div className='grid md:grid-cols-3 gap-4'>
                              {/* Slot Time Info */}
                              <div className='space-y-3'>
                                <h4 className='font-semibold text-foreground flex items-center gap-2'>
                                  <Clock className='h-4 w-4' />
                                  Thông Tin Giờ Học
                                </h4>
                                <div className='space-y-2 text-sm'>
                                  <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                      Giờ bắt đầu:
                                    </span>
                                    <span className='font-medium'>
                                      {slotDetail.start_time
                                        .toString()
                                        .padStart(2, "0")}
                                      :
                                      {slotDetail.start_minute
                                        .toString()
                                        .padStart(2, "0")}
                                    </span>
                                  </div>
                                  <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                      Giờ kết thúc:
                                    </span>
                                    <span className='font-medium'>
                                      {slotDetail.end_time
                                        .toString()
                                        .padStart(2, "0")}
                                      :
                                      {slotDetail.end_minute
                                        .toString()
                                        .padStart(2, "0")}
                                    </span>
                                  </div>
                                  <div className='flex justify-between'>
                                    <span className='text-muted-foreground'>
                                      Thời lượng:
                                    </span>
                                    <span className='font-medium'>
                                      {slotDetail.duration}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Classroom Info */}
                              <div className='space-y-3'>
                                <h4 className='font-semibold text-foreground flex items-center gap-2'>
                                  <School className='h-4 w-4' />
                                  Lớp Học
                                </h4>
                                <div className='space-y-2'>
                                  <div className='p-3 bg-background rounded-lg border'>
                                    <div className='flex items-center justify-between mb-2'>
                                      <span className='font-medium'>
                                        {schedule.classroom.name}
                                      </span>
                                      <Badge
                                        variant='outline'
                                        className='text-xs'
                                      >
                                        <Users className='h-3 w-3 mr-1' />
                                        {schedule.classroom.member?.length ||
                                          0}{" "}
                                        học viên
                                      </Badge>
                                    </div>
                                    <div className='text-xs text-muted-foreground'>
                                      Khóa học: {schedule.classroom.course}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Pool Info */}
                              <div className='space-y-3'>
                                <h4 className='font-semibold text-foreground flex items-center gap-2'>
                                  <MapPin className='h-4 w-4' />
                                  Hồ Bơi
                                </h4>
                                <div className='space-y-2'>
                                  {normalizePools(schedule.pool).length > 0 ? (
                                    normalizePools(schedule.pool).map(
                                      (pool: Pool) => (
                                        <div
                                          key={pool._id}
                                          className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700'
                                        >
                                          <div className='flex items-center justify-between mb-2'>
                                            <span className='font-medium text-blue-900 dark:text-blue-100'>
                                              {pool.title}
                                            </span>
                                            <Badge
                                              variant='outline'
                                              className={`text-xs ${
                                                pool.maintance_status ===
                                                "Đang hoạt động"
                                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700"
                                                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                                              }`}
                                            >
                                              {pool.maintance_status}
                                            </Badge>
                                          </div>
                                          <div className='space-y-1 text-xs text-blue-800 dark:text-blue-200'>
                                            <div className='flex justify-between'>
                                              <span>Loại:</span>
                                              <span className='font-medium'>
                                                {pool.type}
                                              </span>
                                            </div>
                                            <div className='flex justify-between'>
                                              <span>Kích thước:</span>
                                              <span className='font-medium'>
                                                {pool.dimensions}
                                              </span>
                                            </div>
                                            <div className='flex justify-between'>
                                              <span>Độ sâu:</span>
                                              <span className='font-medium'>
                                                {pool.depth}
                                              </span>
                                            </div>
                                            <div className='flex justify-between'>
                                              <span>Sức chứa:</span>
                                              <span className='font-medium'>
                                                {pool.capacity} người
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    <div className='p-3 bg-muted/50 rounded-lg border border-dashed border-muted-foreground/30 text-center'>
                                      <MapPin className='h-4 w-4 mx-auto mb-1 text-muted-foreground' />
                                      <span className='text-xs text-muted-foreground'>
                                        Chưa chỉ định hồ bơi
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Additional Info */}
                            <div className='pt-4 border-t'>
                              <div className='grid md:grid-cols-2 gap-4 text-xs text-muted-foreground'>
                                <div>
                                  <span className='font-medium'>Tạo lúc:</span>{" "}
                                  {new Date(schedule.created_at).toLocaleString(
                                    "vi-VN"
                                  )}
                                </div>
                                <div>
                                  <span className='font-medium'>Cập nhật:</span>{" "}
                                  {new Date(schedule.updated_at).toLocaleString(
                                    "vi-VN"
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
                  <div className='text-center py-12 space-y-6'>
                    <div className='relative'>
                      <div className='absolute inset-0 rounded-full bg-amber-100 dark:bg-amber-900/20 opacity-20 blur-xl'></div>
                      <div className='relative h-16 w-16 mx-auto bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center border border-amber-200 dark:border-amber-700'>
                        <CalendarIcon className='h-8 w-8 text-amber-600 dark:text-amber-400' />
                      </div>
                    </div>
                    <div className='space-y-4'>
                      <div className='space-y-2'>
                        <h3 className='text-xl font-semibold text-foreground'>
                          Slot trống
                        </h3>
                        <p className='text-muted-foreground text-base'>
                          Trong slot{" "}
                          <span className='font-semibold text-amber-600 dark:text-amber-400'>
                            {slotDetail?.title || slotTitle}
                          </span>{" "}
                          vào ngày{" "}
                          <span className='font-semibold text-amber-600 dark:text-amber-400'>
                            {date && new Date(date).toLocaleDateString("vi-VN")}
                          </span>{" "}
                          hiện chưa có lớp học nào được xếp lịch.
                        </p>
                      </div>

                      <div className='p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-700/50 max-w-md mx-auto'>
                        <div className='flex items-start gap-3'>
                          <AlertCircle className='h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0' />
                          <div className='space-y-1 text-left'>
                            <p className='text-sm font-medium text-amber-800 dark:text-amber-200'>
                              Thông tin slot
                            </p>
                            <p className='text-xs text-amber-700 dark:text-amber-300'>
                              Bạn có thể thêm lớp học mới vào slot này bằng cách
                              quay lại trang lịch và chọn "Thêm lớp học" trong
                              slot tương ứng.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='flex justify-center gap-3 pt-4'>
                        <Button
                          onClick={() => router.back()}
                          variant='outline'
                          className='px-6'
                        >
                          <ArrowLeft className='mr-2 h-4 w-4' />
                          Quay lại
                        </Button>
                        <Button
                          onClick={() =>
                            router.push("/dashboard/manager/calendar")
                          }
                          className='px-6 bg-amber-600 hover:bg-amber-700 text-white'
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
