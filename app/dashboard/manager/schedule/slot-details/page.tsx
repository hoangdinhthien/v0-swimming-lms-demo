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
  Search,
  Filter,
  CheckCircle2,
  Info,
  ChevronDown,
  AlertTriangle,
  Waves,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchSlotDetail,
  normalizePools,
  getSlotTimeRange,
  type SlotDetail,
  type SlotSchedule,
  type Pool,
  type Classroom,
} from "@/api/slot-api";
import { fetchClassrooms, addClassToSchedule } from "@/api/classrooms-api";
import { fetchPools } from "@/api/pools-api";
import { deleteScheduleEvent } from "@/api/schedule-api";
import { Classroom as ClassroomType } from "@/api/classrooms-api";
import { Pool as PoolType } from "@/api/pools-api";
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

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out;
  }

  .shimmer-effect {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200px 100%;
    animation: shimmer 2s infinite;
  }

  /* Enhanced dropdown item hover effects */
  [data-radix-collection-item]:hover .shimmer-on-hover {
    background: linear-gradient(
      90deg,
      rgba(59, 130, 246, 0.05) 0%,
      rgba(59, 130, 246, 0.15) 50%,
      rgba(59, 130, 246, 0.05) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out;
  }

  /* Pool selector trigger glow effect */
  .pool-selector-trigger:hover {
    box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.1);
  }

  .pool-selector-trigger:focus-within {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4), 0 0 25px rgba(59, 130, 246, 0.15);
  }
`;

export default function SlotDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [slotDetail, setSlotDetail] = useState<SlotDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-class related state
  const [showAddClass, setShowAddClass] = useState(false);
  const [classrooms, setClassrooms] = useState<ClassroomType[]>([]);
  const [pools, setPools] = useState<PoolType[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [filteredClassrooms, setFilteredClassrooms] = useState<ClassroomType[]>(
    []
  );
  const [selectedClass, setSelectedClass] = useState<ClassroomType | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{
    scheduleId: string;
    className: string;
    date: string;
    slotTitle: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get parameters from URL
  const scheduleId = searchParams.get("scheduleId");
  const slotId = searchParams.get("slotId");
  const date = searchParams.get("date");
  const slotTitle = searchParams.get("slotTitle");
  const time = searchParams.get("time");
  const mode = searchParams.get("mode"); // "add-class" or null

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

  // Check if the selected date is in the past
  const isPastDate = (dateString: string | null) => {
    if (!dateString) return false;

    const selectedDate = new Date(dateString);
    const today = new Date();

    // Reset time to start of day for accurate comparison
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return selectedDate < today;
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

  // Handle mode changes and load add-class data
  useEffect(() => {
    if (mode === "add-class") {
      setShowAddClass(true);
      loadAddClassData();
    } else {
      setShowAddClass(false);
    }
  }, [mode]);

  // Load classrooms and pools for add-class functionality
  const loadAddClassData = async () => {
    try {
      const [classroomsData, poolsData] = await Promise.all([
        fetchClassrooms(),
        fetchPools(),
      ]);
      setClassrooms(classroomsData);
      setPools(poolsData);
      setFilteredClassrooms(classroomsData);
    } catch (err) {
      console.error("Error loading add-class data:", err);
      setErrorMessage("Không thể tải dữ liệu lớp học và hồ bơi");
    }
  };

  // Filter classrooms based on selected pool and search term
  useEffect(() => {
    let filtered = classrooms;

    if (selectedPool) {
      // Skip pool filtering for now since we need to check the exact property name
      filtered = classrooms;
    }

    if (searchTerm) {
      filtered = filtered.filter((classroom) =>
        classroom.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClassrooms(filtered);
  }, [classrooms, selectedPool, searchTerm]);

  // Handle adding class to schedule
  const handleAddClass = async () => {
    if (!selectedClass || !date || !slotId) {
      setErrorMessage(
        "Vui lòng chọn lớp học và đảm bảo có đầy đủ thông tin slot"
      );
      return;
    }

    if (!selectedPool) {
      setErrorMessage("Vui lòng chọn hồ bơi trước khi thêm lớp học vào lịch");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const result = await addClassToSchedule({
        date,
        slot: slotId,
        classroom: selectedClass._id,
        pool: selectedPool,
      });

      console.log("Class added to schedule successfully:", result);
      setSubmitStatus("success");

      // Refresh slot details to show the newly added class
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Error adding class to schedule:", err);
      setSubmitStatus("error");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi thêm lớp học. Vui lòng thử lại sau."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting schedule event
  const handleDeleteScheduleEvent = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      console.log("🗑️ Deleting schedule event:", scheduleToDelete.scheduleId);

      await deleteScheduleEvent(scheduleToDelete.scheduleId);

      console.log("✅ Schedule event deleted successfully");

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (err) {
      console.error("❌ Error deleting schedule event:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to delete schedule event"
      );
    } finally {
      setIsDeleting(false);
    }
  };

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
        {/* Back Button - Outside Header Card */}
        <div className='flex items-center gap-3'>
          <Button
            onClick={() => router.back()}
            variant='outline'
            size='sm'
            className='flex items-center gap-2 bg-background/80 hover:bg-background border-muted/50 hover:border-muted text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm hover:shadow-md'
          >
            <ArrowLeft className='h-4 w-4' />
            Quay lại
          </Button>
        </div>

        {/* Header */}
        <div className='relative'>
          <div className='absolute inset-0 bg-primary/5 rounded-3xl blur-3xl'></div>
          <div className='relative flex flex-col gap-6 p-8 bg-gradient-to-r from-card/90 to-card/70 backdrop-blur-sm border border-muted/40 rounded-2xl shadow-xl'>
            {/* Main Header Content */}
            <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
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
                {!showAddClass && !isPastDate(date) && (
                  <Button
                    onClick={() => setShowAddClass(true)}
                    className='ml-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 h-auto shadow-lg hover:shadow-xl transition-all duration-200'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Thêm lớp học
                  </Button>
                )}
              </div>
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
                              <div className='flex items-center gap-3'>
                                <Badge
                                  variant='secondary'
                                  className='px-3 py-1 bg-blue-100 dark:bg-blue-800/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50'
                                >
                                  Lớp {index + 1}
                                </Badge>
                                {!isPastDate(date) && (
                                  <Button
                                    onClick={() => {
                                      // Set up the delete confirmation dialog
                                      setScheduleToDelete({
                                        scheduleId: schedule._id,
                                        className: schedule.classroom.name,
                                        date: date
                                          ? new Date(date).toLocaleDateString(
                                              "vi-VN"
                                            )
                                          : "",
                                        slotTitle:
                                          slotDetail?.title || slotTitle || "",
                                      });
                                      setDeleteDialogOpen(true);
                                    }}
                                    size='sm'
                                    variant='outline'
                                    className='group flex items-center gap-2 border-red-200 dark:border-red-800/50 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50/50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-all duration-200'
                                  >
                                    <Trash2 className='h-4 w-4 group-hover:scale-110 transition-transform duration-200' />
                                    Gỡ lớp học
                                  </Button>
                                )}
                              </div>
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

        {/* Add Class Section */}
        {showAddClass && (
          <div className='space-y-6'>
            {/* Success/Error Messages */}
            {submitStatus === "success" && (
              <Card className='border-green-200 bg-green-50 dark:bg-green-900/20'>
                <CardContent className='pt-6'>
                  <div className='flex items-center gap-3 text-green-800 dark:text-green-200'>
                    <CheckCircle2 className='h-5 w-5' />
                    <span className='font-medium'>
                      Đã thêm lớp {selectedClass?.name} vào lịch thành công!
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {submitStatus === "error" && errorMessage && (
              <Card className='border-red-200 bg-red-50 dark:bg-red-900/20'>
                <CardContent className='pt-6'>
                  <div className='flex items-center gap-3 text-red-800 dark:text-red-200'>
                    <AlertTriangle className='h-5 w-5' />
                    <span className='font-medium'>{errorMessage}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Class Form */}
            <Card className='relative overflow-hidden bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30 shadow-xl hover:shadow-2xl transition-all duration-300'>
              {/* Decorative elements */}
              <div className='absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500/80 via-green-500 to-green-500/80'></div>
              <div className='absolute top-0 right-0 w-40 h-40 bg-green-100/30 dark:bg-green-800/10 rounded-full -translate-y-20 translate-x-20 blur-3xl'></div>
              <div className='absolute bottom-0 left-0 w-32 h-32 bg-blue-100/30 dark:bg-blue-800/10 rounded-full translate-y-16 -translate-x-16 blur-3xl'></div>

              <CardHeader className='relative pb-4'>
                <CardTitle className='flex items-center gap-3'>
                  <div className='p-2 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800/30 dark:to-green-900/20 rounded-lg shadow-sm'>
                    <Plus className='h-5 w-5 text-green-600 dark:text-green-400' />
                  </div>
                  <span className='text-lg text-foreground'>
                    Thêm lớp học vào lịch
                  </span>
                </CardTitle>
                <p className='text-sm text-muted-foreground mt-2'>
                  Điền thông tin để thêm lớp học mới vào khung giờ đã chọn
                </p>
              </CardHeader>
              <CardContent className='relative space-y-6'>
                {/* Slot and Date Information */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-gradient-to-br from-blue-50/50 to-blue-50/30 dark:from-blue-900/10 dark:to-blue-900/5 rounded-xl border border-blue-200/50 dark:border-blue-800/30'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center'>
                        <CalendarIcon className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                      </div>
                      <span className='text-sm font-medium text-foreground'>
                        Ngày học
                      </span>
                    </div>
                    <p className='text-lg font-semibold text-foreground ml-10'>
                      {date && new Date(date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='h-8 w-8 rounded-lg bg-green-100 dark:bg-green-800/30 flex items-center justify-center'>
                        <Clock className='h-4 w-4 text-green-600 dark:text-green-400' />
                      </div>
                      <span className='text-sm font-medium text-foreground'>
                        Khung giờ
                      </span>
                    </div>
                    <p className='text-lg font-semibold text-foreground ml-10'>
                      {slotTitle}
                    </p>
                  </div>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2'>
                      <div className='h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-800/30 flex items-center justify-center'>
                        <Clock className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                      </div>
                      <span className='text-sm font-medium text-foreground'>
                        Thời gian
                      </span>
                    </div>
                    <p className='text-lg font-semibold text-foreground ml-10'>
                      {time}
                    </p>
                  </div>
                </div>

                {/* Pool Selection */}
                <div className='space-y-4'>
                  {/* Enhanced Header Section */}
                  <div className='space-y-2'>
                    <div className='flex items-center gap-3'>
                      <div className='h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20'>
                        <Waves className='h-4 w-4 text-white' />
                      </div>
                      <div className='flex-1'>
                        <label className='text-base font-semibold text-foreground flex items-center gap-2'>
                          Chọn hồ bơi
                          <span className='text-red-500 text-sm'>*</span>
                        </label>
                        <p className='text-sm text-muted-foreground mt-0.5'>
                          Lựa chọn hồ bơi phù hợp cho lớp học dựa trên loại hồ
                          và sức chứa
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Select Component */}
                  <div className='relative'>
                    <Select
                      value={selectedPool}
                      onValueChange={setSelectedPool}
                    >
                      <SelectTrigger className='pool-selector-trigger w-full h-auto min-h-[80px] relative overflow-hidden bg-gradient-to-br from-blue-50/90 via-blue-50/60 to-blue-100/40 dark:from-blue-950/50 dark:via-blue-900/30 dark:to-blue-950/20 border-2 border-blue-200/70 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700/70 focus:border-blue-400 dark:focus:border-blue-600 shadow-lg hover:shadow-xl focus:shadow-2xl transition-all duration-300 group rounded-2xl'>
                        {/* Enhanced Decorative background elements */}
                        <div className='absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-300/30 to-blue-400/20 dark:from-blue-700/20 dark:to-blue-800/10 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:blur-3xl transition-all duration-500'></div>
                        <div className='absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-cyan-200/30 to-blue-300/20 dark:from-cyan-800/20 dark:to-blue-900/10 rounded-full translate-y-10 -translate-x-10 blur-2xl group-hover:blur-3xl transition-all duration-500'></div>

                        {/* Subtle border glow effect */}
                        <div className='absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

                        {/* Content wrapper */}
                        <div className='relative flex items-center gap-4 w-full p-2'>
                          {/* Enhanced Icon */}
                          <div className='h-12 w-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/50 dark:to-blue-900/30 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-700/30'>
                            <Waves className='h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200' />
                          </div>

                          {/* Enhanced Text content */}
                          <div className='flex-1 text-left min-h-[44px] flex flex-col justify-center'>
                            {selectedPool ? (
                              // Display selected pool with enhanced formatting
                              <div className='space-y-1.5'>
                                <div className='flex items-center gap-3'>
                                  <div className='text-base font-semibold text-foreground'>
                                    {pools.find((p) => p._id === selectedPool)
                                      ?.title ||
                                      pools.find((p) => p._id === selectedPool)
                                        ?._id}
                                  </div>
                                  <div
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium shadow-sm ${
                                      (
                                        pools.find(
                                          (p) => p._id === selectedPool
                                        ) as any
                                      )?.maintance_status === "Đang hoạt động"
                                        ? "bg-gradient-to-r from-green-100 to-green-200 text-green-800 dark:from-green-900/40 dark:to-green-800/30 dark:text-green-300 border border-green-300/50 dark:border-green-700/50"
                                        : "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800 dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50"
                                    }`}
                                  >
                                    {(
                                      pools.find(
                                        (p) => p._id === selectedPool
                                      ) as any
                                    )?.maintance_status || "Không xác định"}
                                  </div>
                                </div>
                                <div className='flex items-center gap-6 text-sm text-muted-foreground'>
                                  <span className='flex items-center gap-1'>
                                    <span className='font-medium text-blue-600 dark:text-blue-400'>
                                      Loại:
                                    </span>
                                    {(
                                      pools.find(
                                        (p) => p._id === selectedPool
                                      ) as any
                                    )?.type || "N/A"}
                                  </span>
                                  <span className='flex items-center gap-1'>
                                    <span className='font-medium text-blue-600 dark:text-blue-400'>
                                      Sức chứa:
                                    </span>
                                    {(
                                      pools.find(
                                        (p) => p._id === selectedPool
                                      ) as any
                                    )?.capacity || 0}{" "}
                                    người
                                  </span>
                                </div>
                              </div>
                            ) : (
                              // Enhanced placeholder when no pool is selected
                              <SelectValue
                                placeholder={
                                  <div className='space-y-1.5'>
                                    <div className='text-base font-medium text-muted-foreground/80'>
                                      Chọn hồ bơi từ danh sách...
                                    </div>
                                    <div className='text-sm text-muted-foreground/60'>
                                      Xem thông tin chi tiết các hồ bơi khả dụng
                                    </div>
                                  </div>
                                }
                              />
                            )}
                          </div>

                          {/* Enhanced Dropdown arrow */}
                          <div className='h-8 w-8 rounded-xl bg-gradient-to-br from-blue-100/80 to-blue-200/60 dark:from-blue-800/40 dark:to-blue-900/30 flex items-center justify-center group-hover:from-blue-200/80 group-hover:to-blue-300/60 dark:group-hover:from-blue-700/50 dark:group-hover:to-blue-800/40 transition-all duration-300 shadow-sm border border-blue-200/50 dark:border-blue-700/30'>
                            <ChevronDown className='h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200 group-hover:scale-110' />
                          </div>
                        </div>
                      </SelectTrigger>

                      {/* Enhanced SelectContent with adaptive positioning and horizontal layout */}
                      <SelectContent
                        className='w-[var(--radix-select-trigger-width)] max-w-none bg-background/98 backdrop-blur-md border-blue-200/60 dark:border-blue-800/40 shadow-2xl rounded-2xl overflow-hidden'
                        side='bottom'
                        align='center'
                        sideOffset={8}
                        alignOffset={0}
                        avoidCollisions={true}
                        collisionPadding={10}
                      >
                        {pools.length === 0 ? (
                          <div className='p-8 text-center space-y-4'>
                            <div className='h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/30 dark:to-blue-900/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
                              <Waves className='h-8 w-8 text-blue-600 dark:text-blue-400' />
                            </div>
                            <div className='space-y-2'>
                              <p className='text-base font-medium text-muted-foreground'>
                                Không có hồ bơi nào khả dụng
                              </p>
                              <p className='text-sm text-muted-foreground/70'>
                                Vui lòng liên hệ quản trị viên để thêm hồ bơi
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className='p-3 space-y-2'>
                            {pools.map((pool) => (
                              <SelectItem
                                key={pool._id}
                                value={pool._id}
                                className='p-0 focus:bg-blue-50/80 dark:focus:bg-blue-900/30 data-[highlighted]:bg-blue-50/80 dark:data-[highlighted]:bg-blue-900/30 rounded-xl border-0 focus:outline-none'
                              >
                                {/* Horizontal Layout Container */}
                                <div className='w-full p-4 relative overflow-hidden rounded-xl bg-gradient-to-r from-background/90 via-blue-50/30 to-background/90 dark:from-background/90 dark:via-blue-950/20 dark:to-background/90 hover:from-blue-50/60 hover:via-blue-100/40 hover:to-blue-50/60 dark:hover:from-blue-950/40 dark:hover:via-blue-900/30 dark:hover:to-blue-950/40 transition-all duration-300 border border-border/50 hover:border-blue-200/70 dark:hover:border-blue-800/50'>
                                  {/* Subtle background decoration */}
                                  <div className='absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-100/20 to-transparent dark:from-blue-900/10 rounded-xl'></div>

                                  {/* Main Horizontal Content */}
                                  <div className='relative flex items-center gap-4 w-full'>
                                    {/* Left Section: Icon + Title */}
                                    <div className='flex items-center gap-3 flex-shrink-0'>
                                      <div className='h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/40 dark:to-blue-900/30 flex items-center justify-center shadow-md border border-blue-200/50 dark:border-blue-700/30'>
                                        <Waves className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                                      </div>
                                      <div className='space-y-0.5'>
                                        <div className='font-semibold text-base text-foreground'>
                                          {(pool as any).title || pool._id}
                                        </div>
                                        <div className='text-xs text-muted-foreground font-mono'>
                                          ID: {pool._id.slice(-8)}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Middle Section: Pool Details in Horizontal Layout */}
                                    <div className='flex-1 flex items-center justify-center gap-6'>
                                      <div className='flex items-center gap-2'>
                                        <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                                        <span className='text-xs font-medium text-blue-600 dark:text-blue-400'>
                                          Loại:
                                        </span>
                                        <span className='text-sm font-semibold text-foreground'>
                                          {(pool as any).type || "N/A"}
                                        </span>
                                      </div>

                                      <div className='h-4 w-px bg-border'></div>

                                      <div className='flex items-center gap-2'>
                                        <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                                        <span className='text-xs font-medium text-blue-600 dark:text-blue-400'>
                                          Kích thước:
                                        </span>
                                        <span className='text-sm font-semibold text-foreground'>
                                          {(pool as any).dimensions || "N/A"}
                                        </span>
                                      </div>

                                      <div className='h-4 w-px bg-border'></div>

                                      <div className='flex items-center gap-2'>
                                        <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                                        <span className='text-xs font-medium text-blue-600 dark:text-blue-400'>
                                          Độ sâu:
                                        </span>
                                        <span className='text-sm font-semibold text-foreground'>
                                          {(pool as any).depth || "N/A"}
                                        </span>
                                      </div>

                                      <div className='h-4 w-px bg-border'></div>

                                      <div className='flex items-center gap-2'>
                                        <div className='h-2 w-2 rounded-full bg-blue-500'></div>
                                        <span className='text-xs font-medium text-blue-600 dark:text-blue-400'>
                                          Sức chứa:
                                        </span>
                                        <span className='text-sm font-semibold text-foreground'>
                                          {(pool as any).capacity || 0} người
                                        </span>
                                      </div>
                                    </div>

                                    {/* Right Section: Status + Usage Count */}
                                    <div className='flex items-center gap-3 flex-shrink-0'>
                                      {/* Usage Count (if available) */}
                                      {(pool as any).usageCount !==
                                        undefined && (
                                        <div className='flex items-center gap-2'>
                                          <div className='h-7 w-7 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800/40 dark:to-blue-900/30 flex items-center justify-center shadow-sm border border-blue-200/50 dark:border-blue-700/30'>
                                            <span className='text-xs font-bold text-blue-600 dark:text-blue-400'>
                                              {(pool as any).usageCount}
                                            </span>
                                          </div>
                                          <Badge
                                            variant='outline'
                                            className={`text-xs px-2 py-0.5 font-medium ${
                                              (pool as any).usageCount > 5
                                                ? "bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-300 dark:from-red-900/30 dark:to-red-800/20 dark:text-red-300 dark:border-red-700/50"
                                                : (pool as any).usageCount > 2
                                                ? "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-300 dark:from-amber-900/30 dark:to-amber-800/20 dark:text-amber-300 dark:border-amber-700/50"
                                                : "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-300 dark:from-green-900/30 dark:to-green-800/20 dark:text-green-300 dark:border-green-700/50"
                                            }`}
                                          >
                                            {(pool as any).usageCount > 5
                                              ? "Cao"
                                              : (pool as any).usageCount > 2
                                              ? "Trung bình"
                                              : "Thấp"}
                                          </Badge>
                                        </div>
                                      )}

                                      {/* Status Badge */}
                                      <Badge
                                        variant='outline'
                                        className={`text-xs px-3 py-1.5 font-medium shadow-md border-2 ${
                                          (pool as any).maintance_status ===
                                          "Đang hoạt động"
                                            ? "bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-300 dark:from-green-900/40 dark:to-green-800/30 dark:text-green-300 dark:border-green-600/50"
                                            : "bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-300 dark:from-amber-900/40 dark:to-amber-800/30 dark:text-amber-300 dark:border-amber-600/50"
                                        }`}
                                      >
                                        <div
                                          className={`mr-2 h-2.5 w-2.5 rounded-full shadow-sm ${
                                            (pool as any).maintance_status ===
                                            "Đang hoạt động"
                                              ? "bg-green-500 shadow-green-300"
                                              : "bg-amber-500 shadow-amber-300"
                                          }`}
                                        ></div>
                                        {(pool as any).maintance_status}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Search */}
                <div className='space-y-3'>
                  <div className='space-y-1'>
                    <label className='text-sm font-medium text-foreground flex items-center gap-2'>
                      <div className='h-4 w-4 rounded-sm bg-purple-100 dark:bg-purple-800/30 flex items-center justify-center'>
                        <Search className='h-3 w-3 text-purple-600 dark:text-purple-400' />
                      </div>
                      Tìm kiếm lớp học
                    </label>
                    <p className='text-xs text-muted-foreground'>
                      Nhập tên lớp học để lọc danh sách
                    </p>
                  </div>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Nhập tên lớp học...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10 bg-gradient-to-r from-background to-background/95 border-purple-200/50 dark:border-purple-800/30 focus:border-purple-300 dark:focus:border-purple-700/50 transition-colors'
                    />
                  </div>
                </div>

                {/* Class Selection */}
                <div className='space-y-4'>
                  {/* Enhanced Header Section */}
                  <div className='space-y-2'>
                    <div className='flex items-center gap-3'>
                      <div className='h-8 w-8 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20'>
                        <School className='h-4 w-4 text-white' />
                      </div>
                      <div className='flex-1'>
                        <label className='text-base font-semibold text-foreground flex items-center gap-2'>
                          Chọn lớp học
                          <span className='text-red-500 text-sm'>*</span>
                        </label>
                        <p className='text-sm text-muted-foreground mt-0.5'>
                          Chọn lớp học sẽ được thêm vào khung giờ này
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Class Selection Grid */}
                  <div className='space-y-3'>
                    {filteredClassrooms.length > 0 ? (
                      <div className='grid gap-4 max-h-96 overflow-y-auto pr-2'>
                        {filteredClassrooms.map((classroom) => (
                          <div
                            key={classroom._id}
                            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
                              selectedClass?._id === classroom._id
                                ? "border-green-400 bg-gradient-to-br from-green-50/80 to-green-100/50 dark:from-green-900/30 dark:to-green-800/20 shadow-lg shadow-green-200/50 dark:shadow-green-900/30"
                                : "border-border/50 bg-gradient-to-br from-background/80 to-background/60 hover:border-green-200 dark:hover:border-green-800/50 hover:from-green-50/30 hover:to-green-50/20 dark:hover:from-green-950/20 dark:hover:to-green-900/10"
                            }`}
                            onClick={() => setSelectedClass(classroom)}
                          >
                            {/* Decorative background elements */}
                            <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/20 to-green-300/10 dark:from-green-800/10 dark:to-green-900/5 rounded-full -translate-y-16 translate-x-16 blur-2xl group-hover:blur-3xl transition-all duration-500'></div>
                            <div className='absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/30 to-green-200/20 dark:from-green-900/10 dark:to-green-800/5 rounded-full translate-y-12 -translate-x-12 blur-xl group-hover:blur-2xl transition-all duration-500'></div>

                            <div className='relative p-5 space-y-4'>
                              {/* Header with Class Name and Selection Status */}
                              <div className='flex items-center justify-between'>
                                <div className='flex items-center gap-3'>
                                  <div
                                    className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-md border transition-all duration-200 ${
                                      selectedClass?._id === classroom._id
                                        ? "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-800/50 dark:to-green-900/30 border-green-300 dark:border-green-700/50"
                                        : "bg-gradient-to-br from-background to-muted/50 border-border/50 group-hover:from-green-50 group-hover:to-green-100 dark:group-hover:from-green-900/20 dark:group-hover:to-green-800/10"
                                    }`}
                                  >
                                    <School
                                      className={`h-5 w-5 transition-colors duration-200 ${
                                        selectedClass?._id === classroom._id
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400"
                                      }`}
                                    />
                                  </div>
                                  <div className='space-y-1'>
                                    <h3 className='text-lg font-bold text-foreground group-hover:text-green-700 dark:group-hover:text-green-300 transition-colors duration-200'>
                                      {classroom.name}
                                    </h3>
                                    <div className='text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded-md inline-block'>
                                      ID: {classroom._id.slice(-8)}
                                    </div>
                                  </div>
                                </div>

                                {/* Selection Button */}
                                <Button
                                  variant={
                                    selectedClass?._id === classroom._id
                                      ? "default"
                                      : "outline"
                                  }
                                  size='sm'
                                  className={`transition-all duration-200 ${
                                    selectedClass?._id === classroom._id
                                      ? "bg-green-600 hover:bg-green-700 text-white shadow-md"
                                      : "border-green-200 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-300"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClass(classroom);
                                  }}
                                >
                                  {selectedClass?._id === classroom._id ? (
                                    <>
                                      <CheckCircle className='mr-2 h-4 w-4' />
                                      Đã chọn
                                    </>
                                  ) : (
                                    <>
                                      <Plus className='mr-2 h-4 w-4' />
                                      Chọn
                                    </>
                                  )}
                                </Button>
                              </div>

                              {/* Course Information */}
                              <div className='space-y-3'>
                                <div className='flex items-start gap-3'>
                                  <div className='h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center flex-shrink-0 mt-0.5'>
                                    <Book className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                                  </div>
                                  <div className='flex-1 space-y-2'>
                                    <h4 className='font-semibold text-base text-foreground'>
                                      {classroom.course?.title ||
                                        "Chưa có tên khóa học"}
                                    </h4>
                                    <p className='text-sm text-muted-foreground line-clamp-2'>
                                      {classroom.course?.description ||
                                        "Chưa có mô tả khóa học"}
                                    </p>
                                  </div>
                                </div>

                                {/* Course Details Grid */}
                                <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
                                  {/* Price */}
                                  <div className='bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-xl p-3 border border-green-100/60 dark:border-green-900/40 shadow-sm'>
                                    <div className='text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1'>
                                      <div className='h-1.5 w-1.5 rounded-full bg-green-500'></div>
                                      Học phí
                                    </div>
                                    <div className='text-sm font-bold text-foreground'>
                                      {classroom.course?.price
                                        ? new Intl.NumberFormat("vi-VN", {
                                            style: "currency",
                                            currency: "VND",
                                          }).format(classroom.course.price)
                                        : "Chưa có giá"}
                                    </div>
                                  </div>

                                  {/* Session Number */}
                                  <div className='bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-xl p-3 border border-green-100/60 dark:border-green-900/40 shadow-sm'>
                                    <div className='text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1'>
                                      <div className='h-1.5 w-1.5 rounded-full bg-green-500'></div>
                                      Số buổi
                                    </div>
                                    <div className='text-sm font-bold text-foreground'>
                                      {classroom.course?.session_number || 0}{" "}
                                      buổi
                                    </div>
                                  </div>

                                  {/* Session Duration */}
                                  <div className='bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-xl p-3 border border-green-100/60 dark:border-green-900/40 shadow-sm'>
                                    <div className='text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1'>
                                      <div className='h-1.5 w-1.5 rounded-full bg-green-500'></div>
                                      Thời lượng
                                    </div>
                                    <div className='text-sm font-bold text-foreground'>
                                      {classroom.course
                                        ?.session_number_duration || "Chưa rõ"}
                                    </div>
                                  </div>

                                  {/* Student Count */}
                                  <div className='bg-gradient-to-br from-background/90 to-background/70 backdrop-blur-sm rounded-xl p-3 border border-green-100/60 dark:border-green-900/40 shadow-sm'>
                                    <div className='text-xs font-semibold text-green-600 dark:text-green-400 mb-1 flex items-center gap-1'>
                                      <div className='h-1.5 w-1.5 rounded-full bg-green-500'></div>
                                      Học viên
                                    </div>
                                    <div className='text-sm font-bold text-foreground flex items-center gap-1'>
                                      <Users className='h-3 w-3' />
                                      {(classroom as any).students?.length ||
                                        0}{" "}
                                      người
                                    </div>
                                  </div>
                                </div>

                                {/* Additional Info */}
                                <div className='flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30'>
                                  <div className='flex items-center gap-2'>
                                    <CalendarIcon className='h-3 w-3' />
                                    <span>
                                      Tạo:{" "}
                                      {classroom.created_at
                                        ? new Date(
                                            classroom.created_at
                                          ).toLocaleDateString("vi-VN")
                                        : "N/A"}
                                    </span>
                                  </div>
                                  <div className='flex items-center gap-2'>
                                    <CheckCircle className='h-3 w-3' />
                                    <span
                                      className={
                                        classroom.course?.is_active
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-amber-600 dark:text-amber-400"
                                      }
                                    >
                                      {classroom.course?.is_active
                                        ? "Khóa học đang hoạt động"
                                        : "Khóa học tạm dừng"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className='text-center py-12 space-y-4'>
                        <div className='h-16 w-16 bg-gradient-to-br from-muted to-muted/60 rounded-2xl flex items-center justify-center mx-auto shadow-lg'>
                          <AlertCircle className='h-8 w-8 text-muted-foreground' />
                        </div>
                        <div className='space-y-2'>
                          <h3 className='text-lg font-semibold text-foreground'>
                            Không tìm thấy lớp học nào
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            Thử điều chỉnh từ khóa tìm kiếm hoặc liên hệ quản
                            trị viên để thêm lớp học mới
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='flex justify-between items-center pt-6 border-t border-muted/30'>
                  <Button
                    variant='outline'
                    onClick={() => setShowAddClass(false)}
                    disabled={isSubmitting}
                    className='border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200'
                  >
                    <ArrowLeft className='mr-2 h-4 w-4' />
                    Hủy
                  </Button>
                  <Button
                    onClick={handleAddClass}
                    disabled={!selectedClass || !selectedPool || isSubmitting}
                    className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none min-w-[140px]'
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Đang thêm...
                      </>
                    ) : (
                      <>
                        <Plus className='mr-2 h-4 w-4' />
                        Thêm lớp học
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent className='bg-background border-2 border-destructive/20 shadow-2xl'>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-3 text-destructive'>
              <div className='p-2 bg-destructive/10 rounded-full'>
                <Trash2 className='h-5 w-5' />
              </div>
              Xác nhận gỡ lớp học
            </AlertDialogTitle>
            <AlertDialogDescription className='text-base leading-relaxed'>
              Bạn có chắc chắn muốn gỡ lớp học này khỏi lịch? Hành động này
              không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {scheduleToDelete && (
            <div className='my-4 p-4 bg-muted/50 rounded-lg border border-muted space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Lớp học:
                </span>
                <span className='font-semibold'>
                  {scheduleToDelete.className}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Ngày:
                </span>
                <span className='font-semibold'>{scheduleToDelete.date}</span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Slot:
                </span>
                <span className='font-semibold'>
                  {scheduleToDelete.slotTitle}
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className='border-muted hover:bg-muted/50'
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteScheduleEvent}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-destructive-foreground'
            >
              {isDeleting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang gỡ...
                </>
              ) : (
                <>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Gỡ lớp học
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
