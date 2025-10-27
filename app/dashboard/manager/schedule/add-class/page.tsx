"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  Info,
  Users,
  ChevronDown,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Waves,
} from "lucide-react";
import { fetchClassrooms, addClassToSchedule } from "@/api/manager/class-api";
import { fetchPools } from "@/api/manager/pools-api";
import { Classroom } from "@/api/manager/class-api";
import { Pool as PoolType } from "@/api/manager/pools-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function AddClassToSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get parameters from URL
  const date = searchParams.get("date");
  const slotId = searchParams.get("slotId"); // This should now be the actual slot ID from schedule events
  const slotKey = searchParams.get("slotKey"); // This is the UI slot key like "slot1"
  const slotTitle = searchParams.get("slotTitle");
  const timeRange = searchParams.get("time");

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  // API data
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [pools, setPools] = useState<PoolType[]>([]);
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [formattedDate, setFormattedDate] = useState("");
  const [isPastDate, setIsPastDate] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function to check if a date is in the past
  const isDateInPast = (dateString: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

    return targetDate < today;
  };

  useEffect(() => {
    // Debug log the URL parameters
    console.log("🔍 Add-class page URL parameters:", {
      date,
      slotId,
      slotKey,
      slotTitle,
      timeRange,
    });

    // Format the date for display and check if it's in the past
    if (date) {
      const dateObj = new Date(date);
      setFormattedDate(
        dateObj.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );

      // Format the date for display and check if it's in the past
      setIsPastDate(isDateInPast(date));

      if (isDateInPast(date)) {
        setErrorMessage(
          "Không thể thêm lớp học vào ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi."
        );
      } else {
        // Clear any previous past date error
        setErrorMessage(null);
      }
    }

    // Fetch classrooms and pools data
    const fetchData = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        // Fetch classrooms
        const classroomsData = await fetchClassrooms();
        setClasses(classroomsData);

        // Fetch pools
        const poolsData = await fetchPools();
        setPools(poolsData.pools);

        // Set default selected pool if any
        if (poolsData.pools.length > 0) {
          setSelectedPool(poolsData.pools[0]._id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMessage("Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date, slotId, slotKey, slotTitle, timeRange]);

  // Filter and search classes
  const filteredClasses = classes.filter((cls) => {
    // Convert instructor object or string to a searchable string
    const instructorName =
      typeof cls.instructor === "object" && cls.instructor?.name
        ? cls.instructor.name
        : "Không xác định";

    const matchesSearch =
      cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      instructorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cls.course?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    // For now, we don't have a status field, so just return based on search
    return matchesSearch;
  });

  const handleAddClass = async (classroomId: string) => {
    if (!selectedPool) {
      setErrorMessage("Vui lòng chọn hồ bơi trước khi thêm lớp học vào lịch");
      return;
    }

    if (!date) {
      setErrorMessage("Không có thông tin ngày được chọn");
      return;
    }

    // Check if the date is in the past
    if (isDateInPast(date)) {
      setErrorMessage(
        "Không thể thêm lớp học vào ngày trong quá khứ. Vui lòng chọn ngày từ hôm nay trở đi."
      );
      return;
    }

    if (!slotId) {
      setErrorMessage("Không có thông tin khung giờ được chọn");
      return;
    }

    // Check if the slotId appears to be a UI key (like "slot1") rather than a real MongoDB ID
    if (slotId.startsWith("slot")) {
      setErrorMessage(
        "Lỗi: ID khung giờ không hợp lệ. Vui lòng quay lại lịch và thử lại từ một khung giờ có sẵn lớp học."
      );
      return;
    }

    // Additional validation: MongoDB ObjectIds are typically 24 characters long
    if (slotId.length !== 24) {
      setErrorMessage(
        "Lỗi: ID khung giờ không đúng định dạng. Vui lòng quay lại và thử lại."
      );
      return;
    }

    // Get the class name for the success message
    const selectedClass = classes.find((c) => c._id === classroomId);

    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      console.log("Adding class to schedule with parameters:", {
        date,
        slotId, // This should be the actual slot ID from the slot object
        classroom: classroomId,
        pool: selectedPool,
      });

      console.log("Slot ID validation:", {
        slotId,
        startsWithSlot: slotId.startsWith("slot"),
        length: slotId.length,
        isValidLength: slotId.length === 24,
        isValidFormat: !slotId.startsWith("slot") && slotId.length === 24,
      });

      // Call the API to add the class to the schedule
      await addClassToSchedule({
        date: date,
        slot: slotId, // Using the correct slot ID from the schedule event
        classroom: classroomId,
        pool: selectedPool,
        instructor: "",
      });

      // Show success message
      setSuccessMessage(
        `Đã thêm lớp ${selectedClass?.name} vào lịch thành công!`
      );

      // After a delay, navigate back to calendar
      setTimeout(() => {
        router.push(`/dashboard/manager/calendar`);
      }, 1500);
    } catch (error) {
      console.error("Error adding class to schedule:", error);
      // Show error message in case of failure
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi thêm lớp học. Vui lòng thử lại sau."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen'>
      <div className='container mx-auto py-8 space-y-8'>
        {/* Header section */}
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
          <div className='space-y-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.back()}
              className='hover:bg-muted/50 transition-colors border-border/50 hover:border-border'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Quay lại
            </Button>
            <div className='space-y-2'>
              <h1 className='text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text'>
                Thêm lớp học vào lịch
              </h1>
              <p className='text-muted-foreground text-lg'>
                Chọn lớp học để thêm vào lịch của bạn
              </p>
            </div>
          </div>
        </div>{" "}
        {/* Slot and Date Information */}
        <Card className='border-border/50 shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-xl font-semibold flex items-center gap-2'>
              <Calendar className='h-5 w-5 text-primary' />
              Thông tin khung giờ
            </CardTitle>
            <CardDescription className='text-base'>
              Chi tiết về thời gian và ngày tháng đã chọn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <div className='space-y-3 p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`p-2 rounded-full ${
                      isPastDate ? "bg-red-500/10" : "bg-primary/10"
                    }`}
                  >
                    <Calendar
                      className={`h-5 w-5 ${
                        isPastDate ? "text-red-500" : "text-primary"
                      }`}
                    />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Ngày
                    </p>
                    <p className='text-lg font-semibold'>{formattedDate}</p>
                    {isPastDate && (
                      <p className='text-xs text-red-600 dark:text-red-400 font-medium'>
                        Ngày đã qua
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className='space-y-3 p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-full bg-blue-500/10'>
                    <Clock className='h-5 w-5 text-blue-500' />
                  </div>
                  <div>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Khung giờ
                    </p>
                    <p className='text-lg font-semibold'>{slotTitle}</p>
                    <p className='text-sm text-muted-foreground'>{timeRange}</p>
                  </div>
                </div>
              </div>

              <div className='space-y-3 p-4 rounded-lg border border-border/30 hover:border-border/60 transition-colors'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`p-2 rounded-full ${
                      slotId && !slotId.startsWith("slot")
                        ? "bg-green-500/10"
                        : "bg-red-500/10"
                    }`}
                  >
                    {slotId && !slotId.startsWith("slot") ? (
                      <CheckCircle2 className='h-5 w-5 text-green-500' />
                    ) : (
                      <AlertCircle className='h-5 w-5 text-red-500' />
                    )}
                  </div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Trạng thái ID
                    </p>
                    {slotId && !slotId.startsWith("slot") ? (
                      <div>
                        <p className='text-sm font-semibold text-green-600 dark:text-green-400'>
                          ID hợp lệ
                        </p>
                        <p className='text-xs text-muted-foreground mt-1 break-all font-mono'>
                          {slotId}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className='text-sm font-semibold text-red-600 dark:text-red-400'>
                          ID không hợp lệ
                        </p>
                        <p className='text-xs text-red-600 dark:text-red-400 mt-1 break-all font-mono'>
                          {slotId || "Không có ID khung giờ"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>{" "}
        {/* Pools Selection */}
        <Card className='border-border/50 shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-xl font-semibold flex items-center gap-2'>
              <Waves className='h-5 w-5 text-blue-500' />
              Chọn hồ bơi
            </CardTitle>
            <CardDescription className='text-base'>
              Vui lòng chọn hồ bơi cho lớp học này
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex justify-center items-center py-12'>
                <div className='flex flex-col items-center gap-4'>
                  <div className='p-4 rounded-full bg-primary/10'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary' />
                  </div>
                  <span className='text-muted-foreground font-medium'>
                    Đang tải dữ liệu...
                  </span>
                </div>
              </div>
            ) : pools.length === 0 ? (
              <div className='py-12 text-center'>
                <div className='flex flex-col items-center gap-4'>
                  <div className='p-4 rounded-full bg-muted/50'>
                    <AlertCircle className='h-8 w-8 text-muted-foreground' />
                  </div>
                  <p className='text-muted-foreground font-medium'>
                    Không tìm thấy hồ bơi nào.
                  </p>
                </div>
              </div>
            ) : (
              <RadioGroup
                value={selectedPool}
                onValueChange={setSelectedPool}
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              >
                {pools.map((pool) => (
                  <div
                    key={pool._id}
                    className='group'
                  >
                    <label
                      htmlFor={`pool-${pool._id}`}
                      className='flex items-start space-x-3 p-4 rounded-xl border border-border/30 hover:border-border cursor-pointer transition-all duration-200 hover:shadow-md group-hover:scale-[1.02]'
                    >
                      <RadioGroupItem
                        value={pool._id}
                        id={`pool-${pool._id}`}
                        className='mt-1'
                      />
                      <div className='flex-1 space-y-2'>
                        <div className='flex items-center gap-2'>
                          <Waves className='h-4 w-4 text-blue-500' />
                          <span className='font-semibold text-foreground group-hover:text-primary transition-colors'>
                            {pool.title}
                          </span>
                        </div>
                        {pool.type && (
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <span className='w-1 h-1 rounded-full bg-muted-foreground'></span>
                            Loại: {pool.type}
                          </div>
                        )}
                        {pool.dimensions && (
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <span className='w-1 h-1 rounded-full bg-muted-foreground'></span>
                            Kích thước: {pool.dimensions}
                          </div>
                        )}
                        {pool.capacity && (
                          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                            <span className='w-1 h-1 rounded-full bg-muted-foreground'></span>
                            Sức chứa: {pool.capacity} người
                          </div>
                        )}
                        <Badge
                          variant={pool.is_active ? "default" : "secondary"}
                          className='mt-2 text-xs'
                        >
                          {pool.is_active ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>{" "}
        {/* Search and Filter */}
        <div className='flex flex-col sm:flex-row gap-4 p-6 rounded-xl border border-border/30 hover:border-border/60 transition-colors'>
          <div className='relative flex-1'>
            <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'>
              <Search className='h-4 w-4 text-muted-foreground' />
            </div>
            <Input
              placeholder='Tìm kiếm tên lớp, khóa học...'
              className='pl-10 h-11 border-border/50 focus:border-primary transition-colors'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={filter}
            onValueChange={(value: "all" | "active" | "inactive") =>
              setFilter(value)
            }
          >
            <SelectTrigger className='w-full sm:w-[200px] h-11 border-border/50 focus:border-primary transition-colors'>
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4 text-muted-foreground' />
                <SelectValue placeholder='Trạng thái' />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Tất cả</SelectItem>
              <SelectItem value='active'>Đang hoạt động</SelectItem>
              <SelectItem value='inactive'>Tạm ngừng</SelectItem>
            </SelectContent>
          </Select>
        </div>{" "}
        {/* Classes List */}
        <Card className='border-border/50 shadow-lg hover:shadow-xl transition-all duration-300'>
          <CardHeader className='pb-4'>
            <CardTitle className='text-xl font-semibold flex items-center gap-2'>
              <Users className='h-5 w-5 text-green-500' />
              Danh sách lớp học
            </CardTitle>
            <CardDescription className='text-base'>
              Chọn một lớp để thêm vào lịch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='flex justify-center items-center py-16'>
                <div className='flex flex-col items-center gap-4'>
                  <div className='p-4 rounded-full bg-primary/10'>
                    <Loader2 className='h-8 w-8 animate-spin text-primary' />
                  </div>
                  <span className='text-muted-foreground font-medium'>
                    Đang tải dữ liệu...
                  </span>
                </div>
              </div>
            ) : filteredClasses.length === 0 ? (
              <div className='py-16 text-center'>
                <div className='flex flex-col items-center gap-4'>
                  <div className='p-4 rounded-full bg-muted/50'>
                    <AlertCircle className='h-8 w-8 text-muted-foreground' />
                  </div>
                  <p className='text-muted-foreground font-medium'>
                    Không tìm thấy lớp học nào phù hợp.
                  </p>
                </div>
              </div>
            ) : (
              <div className='rounded-xl border border-border/30 overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow className='hover:bg-muted/30 border-border/30'>
                      <TableHead className='w-[300px] font-semibold'>
                        Tên lớp học
                      </TableHead>
                      <TableHead className='font-semibold'>Khóa học</TableHead>
                      <TableHead className='w-[120px] font-semibold text-center'>
                        Thành viên
                      </TableHead>
                      <TableHead className='w-[140px] font-semibold text-center'>
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClasses.map((cls) => {
                      // Get members count
                      const membersCount = Array.isArray(cls.member)
                        ? cls.member.length
                        : 0;

                      return (
                        <TableRow
                          key={cls._id}
                          className='hover:bg-muted/20 transition-colors border-border/30'
                        >
                          <TableCell className='font-medium py-4'>
                            <div className='flex items-center gap-3'>
                              <div className='p-2 rounded-lg bg-primary/10'>
                                <Users className='h-4 w-4 text-primary' />
                              </div>
                              <span className='font-semibold'>{cls.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className='py-4'>
                            <div className='flex flex-col gap-1'>
                              <span className='font-medium'>
                                {cls.course?.title || "Chưa có khóa học"}
                              </span>
                              {cls.course?.session_number && (
                                <span className='text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md inline-block w-fit'>
                                  {cls.course.session_number} buổi (
                                  {cls.course.session_number_duration || "N/A"})
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='py-4 text-center'>
                            <div className='flex items-center justify-center gap-2'>
                              <div className='p-1.5 rounded-full bg-blue-500/10'>
                                <Users className='h-3 w-3 text-blue-500' />
                              </div>
                              <span className='font-semibold'>
                                {membersCount}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='py-4 text-center'>
                            <Button
                              onClick={() => handleAddClass(cls._id)}
                              disabled={
                                loading ||
                                !selectedPool ||
                                isPastDate ||
                                (!!slotId && slotId.startsWith("slot"))
                              }
                              className='bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                              size='sm'
                            >
                              {loading ? (
                                <>
                                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                  Đang xử lý...
                                </>
                              ) : isPastDate ? (
                                <>
                                  <Clock className='mr-2 h-4 w-4' />
                                  Ngày đã qua
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className='mr-2 h-4 w-4' />
                                  Thêm vào lịch
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          <CardFooter className='pt-4 border-t border-border/30'>
            <div className='flex items-center justify-between w-full'>
              <p className='text-sm text-muted-foreground font-medium'>
                Hiển thị {filteredClasses.length} lớp học
              </p>
              {filteredClasses.length > 0 && (
                <div className='flex items-center gap-2 text-xs'>
                  {isPastDate ? (
                    <>
                      <div className='w-2 h-2 rounded-full bg-red-500'></div>
                      <span className='text-red-600 dark:text-red-400 font-medium'>
                        Không thể thêm vào ngày đã qua
                      </span>
                    </>
                  ) : (
                    <>
                      <div className='w-2 h-2 rounded-full bg-green-500'></div>
                      <span className='text-muted-foreground'>
                        Sẵn sàng thêm vào lịch
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardFooter>
        </Card>{" "}
        {/* Past Date Warning */}
        {isPastDate && (
          <Alert className='border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/30 shadow-lg'>
            <div className='flex items-center gap-2'>
              <div className='p-1 rounded-full bg-yellow-500/20'>
                <AlertTriangle className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
              </div>
              <AlertTitle className='font-semibold text-yellow-800 dark:text-yellow-200'>
                Cảnh báo: Ngày đã qua
              </AlertTitle>
            </div>
            <AlertDescription className='mt-2 text-yellow-700 dark:text-yellow-300 font-medium'>
              Ngày {formattedDate} đã qua. Bạn chỉ có thể thêm lớp học vào lịch
              từ hôm nay trở đi. Vui lòng quay lại lịch và chọn một ngày khác.
            </AlertDescription>
            <div className='mt-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => router.push("/dashboard/manager/calendar")}
                className='border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/20'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Quay lại lịch
              </Button>
            </div>
          </Alert>
        )}
        {/* Success and Error Messages */}
        {successMessage && (
          <Alert className='bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800 shadow-lg'>
            <div className='flex items-center gap-2'>
              <div className='p-1 rounded-full bg-green-500/20'>
                <CheckCircle2 className='h-4 w-4 text-green-600 dark:text-green-400' />
              </div>
              <AlertTitle className='font-semibold'>Thành công</AlertTitle>
            </div>
            <AlertDescription className='mt-2 font-medium'>
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
        {errorMessage && (
          <Alert
            variant='destructive'
            className='shadow-lg border-red-200 dark:border-red-800'
          >
            <div className='flex items-center gap-2'>
              <div className='p-1 rounded-full bg-red-500/20'>
                <AlertCircle className='h-4 w-4 text-red-600 dark:text-red-400' />
              </div>
              <AlertTitle className='font-semibold'>Lỗi</AlertTitle>
            </div>
            <AlertDescription className='mt-2 font-medium'>
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        {/* Info Note */}
        <Alert className='border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 shadow-lg'>
          <div className='flex items-center gap-2'>
            <div className='p-1 rounded-full bg-blue-500/20'>
              <Info className='h-4 w-4 text-blue-600 dark:text-blue-400' />
            </div>
            <AlertTitle className='font-semibold text-blue-800 dark:text-blue-200'>
              Lưu ý quan trọng
            </AlertTitle>
          </div>
          <AlertDescription className='mt-2 text-blue-700 dark:text-blue-300 font-medium'>
            Việc thêm lớp học vào lịch sẽ đăng ký khung giờ này cho lớp học được
            chọn. Hãy đảm bảo không có xung đột với lịch hiện tại của lớp học và
            chọn hồ bơi phù hợp.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
