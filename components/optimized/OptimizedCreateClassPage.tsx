/**
 * Optimized Create Class Page with Performance Improvements
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  Users,
  BookOpen,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

// Optimized hooks and APIs
import { useCommonData, useOptimizedAvatars } from "@/hooks/useOptimizedAPI";
import { createClass, type CreateClassData } from "@/api/manager/class-api";
import { fetchStudentsByCourseOrder } from "@/api/manager/students-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

interface Student {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    phone?: string;
    featured_image?: any;
  };
}

export default function OptimizedCreateClassPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [className, setClassName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Student data for selected course
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Search states
  const [courseSearch, setCourseSearch] = useState("");

  // Use optimized data loading
  const {
    instructors,
    courses,
    loading: commonDataLoading,
    error: commonDataError,
  } = useCommonData({
    loadInstructors: true,
    loadCourses: true,
  });

  // Optimized avatar loading for instructors
  const instructorAvatars = useOptimizedAvatars(instructors);
  const studentAvatars = useOptimizedAvatars(students);

  // Fetch students when course changes
  const fetchStudentsForCourse = useCallback(
    async (courseId: string) => {
      if (!courseId) {
        setStudents([]);
        return;
      }

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        toast({
          title: "Lỗi",
          description: "Thiếu thông tin xác thực",
          variant: "destructive",
        });
        return;
      }

      try {
        setLoadingStudents(true);
        const studentsResult = await fetchStudentsByCourseOrder({
          courseId,
          tenantId,
          token,
        });

        setStudents(studentsResult || []);
      } catch (err: any) {
        console.error("Error fetching students by course:", err);
        toast({
          title: "Lỗi",
          description:
            "Không thể tải danh sách học viên đã thanh toán khóa học",
          variant: "destructive",
        });
        setStudents([]);
      } finally {
        setLoadingStudents(false);
      }
    },
    [toast]
  );

  // Handle course selection
  const handleCourseChange = useCallback(
    (courseId: string) => {
      setSelectedCourse(courseId);
      setSelectedMembers([]); // Reset selected members
      fetchStudentsForCourse(courseId);
    },
    [fetchStudentsForCourse]
  );

  // Memoized filtered data
  const filteredCourses = useMemo(() => {
    return (courses || []).filter((course: any) =>
      course?.title?.toLowerCase().includes(courseSearch.toLowerCase())
    );
  }, [courses, courseSearch]);

  // Memoized instructors with avatars
  const instructorsWithAvatars = useMemo(() => {
    return (instructors || []).map((instructor: any) => ({
      ...instructor,
      avatarUrl: instructorAvatars[instructor._id] || "/placeholder.svg",
    }));
  }, [instructors, instructorAvatars]);

  // Memoized students with avatars
  const studentsWithAvatars = useMemo(() => {
    return students.map((student) => ({
      ...student,
      avatarUrl: studentAvatars[student._id] || "/placeholder.svg",
    }));
  }, [students, studentAvatars]);

  // Handle member selection
  const handleMemberToggle = useCallback((studentId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const handleRemoveMember = useCallback((studentId: string) => {
    setSelectedMembers((prev) => prev.filter((id) => id !== studentId));
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!className.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên lớp học",
          variant: "destructive",
        });
        return;
      }

      if (!selectedCourse) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn khóa học",
          variant: "destructive",
        });
        return;
      }

      if (!selectedInstructor) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn Huấn luyện viên",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);

      try {
        const classData: CreateClassData = {
          name: className.trim(),
          course: selectedCourse,
          instructor: selectedInstructor,
          member: selectedMembers,
        };

        await createClass(classData);

        toast({
          title: "Thành công",
          description: "Lớp học đã được tạo thành công",
        });

        router.push("/dashboard/manager/classes");
      } catch (err: any) {
        console.error("Error creating class:", err);
        toast({
          title: "Lỗi",
          description: err.message || "Không thể tạo lớp học",
          variant: "destructive",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [
      className,
      selectedCourse,
      selectedInstructor,
      selectedMembers,
      toast,
      router,
    ]
  );

  // Loading and error states
  if (commonDataLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <p className='text-muted-foreground'>Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (commonDataError) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <div className='text-center space-y-4'>
          <div className='text-red-500 text-lg font-semibold'>Lỗi</div>
          <p className='text-muted-foreground'>{commonDataError}</p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager/classes'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay về Danh sách lớp học
        </Link>
      </div>

      <div className='flex flex-col space-y-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Tạo lớp học mới</h1>
          <p className='text-muted-foreground'>
            Điền thông tin để tạo lớp học mới
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className='space-y-8'
        >
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='className'>Tên lớp học *</Label>
                <Input
                  id='className'
                  placeholder='Nhập tên lớp học (ví dụ: Lớp A1, Lớp Bơi Cơ Bản 1, ...)'
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Course Selection */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BookOpen className='h-5 w-5' />
                Chọn khóa học *
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Khóa học có sẵn</Label>
                <Select
                  value={selectedCourse}
                  onValueChange={handleCourseChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn khóa học cho lớp học' />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCourses.length > 0 ? (
                      filteredCourses.map((course: any) => (
                        <SelectItem
                          key={course._id}
                          value={course._id}
                        >
                          <div className='flex flex-col'>
                            <span className='font-medium'>
                              {course?.title || "Tên khóa học không xác định"}
                            </span>
                            <span className='text-sm text-muted-foreground'>
                              {course?.session_number || 0} buổi -{" "}
                              {course?.session_number_duration ||
                                "Chưa xác định"}{" "}
                              - {(course?.price || 0).toLocaleString("vi-VN")}{" "}
                              VNĐ
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem
                        value='no-courses'
                        disabled
                      >
                        Không tìm thấy khóa học nào
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Instructor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                Chọn Huấn luyện viên *
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Huấn luyện viên có sẵn</Label>
                <Select
                  value={selectedInstructor}
                  onValueChange={setSelectedInstructor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Chọn Huấn luyện viên cho lớp học' />
                  </SelectTrigger>
                  <SelectContent>
                    {instructorsWithAvatars.length > 0 ? (
                      instructorsWithAvatars.map((instructor) => (
                        <SelectItem
                          key={instructor._id}
                          value={instructor._id}
                        >
                          <div className='flex items-center gap-3'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage
                                src={instructor.avatarUrl}
                                alt={instructor?.username || "Huấn luyện viên"}
                              />
                              <AvatarFallback>
                                {instructor?.username
                                  ?.charAt(0)
                                  ?.toUpperCase() || "G"}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex flex-col'>
                              <span className='font-medium'>
                                {instructor?.username || "Tên không xác định"}
                              </span>
                              <span className='text-sm text-muted-foreground'>
                                {instructor?.email || "Email không xác định"}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem
                        value='no-instructors'
                        disabled
                      >
                        Không tìm thấy Huấn luyện viên nào
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Chọn học viên (tùy chọn)
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className='space-y-2'>
                  <Label>Học viên đã chọn ({selectedMembers.length})</Label>
                  <div className='flex flex-wrap gap-2'>
                    {selectedMembers.map((memberId) => {
                      const student = studentsWithAvatars.find(
                        (s) => s.user._id === memberId
                      );
                      return (
                        <Badge
                          key={memberId}
                          variant='secondary'
                          className='flex items-center gap-2 px-3 py-1'
                        >
                          <Avatar className='h-5 w-5'>
                            <AvatarImage
                              src={student?.avatarUrl}
                              alt={student?.user?.username || "Học viên"}
                            />
                            <AvatarFallback className='text-xs'>
                              {student?.user?.username
                                ?.charAt(0)
                                ?.toUpperCase() || "H"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{student?.user?.username || "Unknown"}</span>
                          <X
                            className='h-3 w-3 cursor-pointer'
                            onClick={() => handleRemoveMember(memberId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {!selectedCourse ? (
                <div className='bg-amber-50 border border-amber-200 rounded-md p-6 text-center dark:bg-amber-950/30 dark:border-amber-800'>
                  <div className='bg-background rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-sm'>
                    <BookOpen className='h-8 w-8 text-amber-400' />
                  </div>
                  <p className='text-amber-900 dark:text-amber-200 font-medium mb-1'>
                    Vui lòng chọn khóa học trước
                  </p>
                  <p className='text-amber-700/70 dark:text-amber-300/70 text-sm'>
                    Bạn cần chọn khóa học trước để xem danh sách học viên đã
                    thanh toán
                  </p>
                </div>
              ) : loadingStudents ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin' />
                  <span className='ml-2'>
                    Đang tải học viên đã thanh toán khóa học...
                  </span>
                </div>
              ) : (
                <div className='space-y-2'>
                  <Label>Học viên đã thanh toán cho khóa học</Label>
                  <ScrollArea className='h-64 border rounded-md p-4'>
                    <div className='space-y-2'>
                      {studentsWithAvatars.length > 0 ? (
                        studentsWithAvatars.map((student) => (
                          <div
                            key={student._id}
                            className='flex items-center space-x-3'
                          >
                            <Checkbox
                              id={student.user._id}
                              checked={selectedMembers.includes(
                                student.user._id
                              )}
                              onCheckedChange={() =>
                                handleMemberToggle(student.user._id)
                              }
                            />
                            <Avatar className='h-8 w-8'>
                              <AvatarImage
                                src={student.avatarUrl}
                                alt={student?.user?.username || "Học viên"}
                              />
                              <AvatarFallback>
                                {student?.user?.username
                                  ?.charAt(0)
                                  ?.toUpperCase() || "H"}
                              </AvatarFallback>
                            </Avatar>
                            <Label
                              htmlFor={student.user._id}
                              className='flex-1 cursor-pointer'
                            >
                              <div className='flex flex-col'>
                                <span className='font-medium'>
                                  {student?.user?.username ||
                                    "Tên không xác định"}
                                </span>
                                <span className='text-sm text-muted-foreground'>
                                  {student?.user?.email ||
                                    "Email không xác định"}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))
                      ) : (
                        <div className='text-center py-8 text-muted-foreground'>
                          <div className='bg-background rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center shadow-sm'>
                            <Users className='h-6 w-6 text-muted-foreground' />
                          </div>
                          <p className='font-medium mb-1'>
                            Chưa có học viên nào thanh toán
                          </p>
                          <p className='text-sm'>
                            Chưa có học viên nào thanh toán cho khóa học này
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className='flex gap-4'>
            <Button
              type='button'
              variant='outline'
              onClick={() => router.back()}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type='submit'
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className='mr-2 h-4 w-4' />
                  Tạo lớp học
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
