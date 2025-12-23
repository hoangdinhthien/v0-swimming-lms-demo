"use client";

import { useEffect, useState } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInstructorValidation } from "@/hooks/use-instructor-validation";

// API imports
import { createClass, type CreateClassData } from "@/api/manager/class-api";
import { fetchCourses } from "@/api/manager/courses-api";
import { fetchInstructors } from "@/api/manager/instructors-api";
import {
  fetchStudents,
  fetchStudentsByCourseOrder,
} from "@/api/manager/students-api";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { getAuthToken } from "@/api/auth-utils";

// Custom function to handle different featured_image formats
async function getAvatarUrl(featured_image?: any): Promise<string> {
  const placeholder = "/placeholder.svg";

  if (!featured_image) {
    return placeholder;
  }

  try {
    let imageUrl = "";

    // Case 1: Empty array - return placeholder
    if (Array.isArray(featured_image) && featured_image.length === 0) {
      return placeholder;
    }

    // Case 2: Object with direct path property
    if (featured_image.path && typeof featured_image.path === "string") {
      imageUrl = featured_image.path;
    }

    // Case 3: Array with objects containing path arrays
    else if (Array.isArray(featured_image) && featured_image.length > 0) {
      const firstItem = featured_image[0];
      if (firstItem.path) {
        if (Array.isArray(firstItem.path) && firstItem.path.length > 0) {
          imageUrl = firstItem.path[0];
        } else if (typeof firstItem.path === "string") {
          imageUrl = firstItem.path;
        }
      }
    }

    // Case 4: Direct string (legacy format)
    else if (typeof featured_image === "string") {
      imageUrl = featured_image;
    }

    const finalUrl = imageUrl || placeholder;
    return finalUrl;
  } catch (error) {
    console.error("Error processing avatar image:", error);
    return placeholder;
  }
}

interface Course {
  _id: string;
  title: string;
  description: string;
  session_number: number;
  session_number_duration: string;
  price: number;
  is_active: boolean;
}

interface Instructor {
  _id: string;
  username: string;
  email: string;
  phone?: string;
  featured_image?: any; // Can be array, object, or undefined
  avatarUrl?: string; // Resolved avatar URL
}

interface Student {
  _id: string;
  user: {
    _id: string;
    username: string;
    email: string;
    phone?: string;
    featured_image?: any; // Can be array, object, or undefined
  };
  avatarUrl?: string; // Resolved avatar URL
}

export default function CreateClassPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [className, setClassName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Data state
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [tenantId, setTenantId] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // Loading states
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingInstructors, setLoadingInstructors] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Search states for better UX
  const [courseSearch, setCourseSearch] = useState("");

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (tenantId) setTenantId(tenantId);
      if (token) setToken(token);

      if (!tenantId || !token) {
        setError("Thiếu thông tin xác thực");
        return;
      }

      try {
        // Fetch courses
        setLoadingCourses(true);
        const coursesResult = await fetchCourses({
          tenantId,
          token,
          limit: 100,
        });
        setCourses(coursesResult.data || []);
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách khóa học",
          variant: "destructive",
        });
      } finally {
        setLoadingCourses(false);
      }

      try {
        // Fetch instructors
        setLoadingInstructors(true);
        const instructorsResult = await fetchInstructors({ tenantId, token });

        // Process instructors with avatars
        const instructorsWithAvatars = await Promise.all(
          (instructorsResult || []).map(async (instructor: any) => {
            const avatarUrl = await getAvatarUrl(instructor?.featured_image);
            return {
              ...instructor,
              avatarUrl,
            };
          })
        );

        setInstructors(instructorsWithAvatars);
      } catch (err: any) {
        console.error("Error fetching instructors:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách huấn luyện viên",
          variant: "destructive",
        });
      } finally {
        setLoadingInstructors(false);
      }
    };

    fetchData();
  }, []); // ✅ FIX: Empty dependency array - only fetch once on mount

  // Separate useEffect to fetch students when course is selected
  useEffect(() => {
    const fetchStudentsByCourseOrderData = async () => {
      if (!selectedCourse) {
        setStudents([]);
        return;
      }

      const tenantId = getSelectedTenant();
      const token = getAuthToken();

      if (!tenantId || !token) {
        setError("Thiếu thông tin xác thực");
        return;
      }

      try {
        setLoadingStudents(true);
        const studentsResult = await fetchStudentsByCourseOrder({
          courseId: selectedCourse,
          tenantId,
          token,
        });

        // Process students with avatars
        const studentsWithAvatars = await Promise.all(
          (studentsResult || []).map(async (student: any) => {
            const avatarUrl = await getAvatarUrl(student.user?.featured_image);
            return {
              ...student,
              avatarUrl,
            };
          })
        );

        setStudents(studentsWithAvatars);
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
    };

    fetchStudentsByCourseOrderData();
  }, [selectedCourse, toast]); // Trigger when selectedCourse changes

  // Clear selected members when course changes
  useEffect(() => {
    setSelectedMembers([]);
  }, [selectedCourse]);

  // Filter functions
  const filteredCourses = (courses || []).filter((course) =>
    course?.title?.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const filteredInstructors = instructors || [];

  const filteredStudents = students || [];

  // Handle member selection
  const handleMemberToggle = (studentId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleRemoveMember = (studentId: string) => {
    setSelectedMembers((prev) => prev.filter((id) => id !== studentId));
  };

  // Get selected course data for validation
  const selectedCourseData = courses.find((c) => c._id === selectedCourse);

  // Instructor Validation
  const { result: validationResult, loading: validatingInstructor } =
    useInstructorValidation({
      instructorId: selectedInstructor,
      course: selectedCourseData,
      tenantId,
      token,
      skip: !selectedInstructor || !selectedCourseData || !tenantId || !token,
    });

  const isFormValid =
    className.trim() &&
    selectedCourse &&
    selectedInstructor &&
    validationResult.isValid;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
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
        description: "Vui lòng chọn huấn luyện viên",
        variant: "destructive",
      });
      return;
    }

    if (!validationResult.isValid) {
      toast({
        title: "Lỗi",
        description: "Huấn luyện viên không phù hợp với khóa học",
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

      // Redirect back to classes list
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
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="text-red-500 text-lg font-semibold">Lỗi</div>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.back()}>Quay lại</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link
          href="/dashboard/manager/classes"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Quay về Danh sách lớp học
        </Link>
      </div>

      <div className="flex flex-col space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tạo lớp học mới</h1>
          <p className="text-muted-foreground">
            Điền thông tin để tạo lớp học mới
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="className">Tên lớp học *</Label>
                <Input
                  id="className"
                  placeholder="Nhập tên lớp học (ví dụ: Lớp A1, Lớp Bơi Cơ Bản 1, ...)"
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
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chọn khóa học *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingCourses ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Đang tải khóa học...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Khóa học có sẵn</Label>
                  <Select
                    value={selectedCourse}
                    onValueChange={setSelectedCourse}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khóa học cho lớp học" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map((course) => (
                          <SelectItem key={course._id} value={course._id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {course?.title || "Tên khóa học không xác định"}
                              </span>
                              <span className="text-sm text-muted-foreground">
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
                        <SelectItem value="no-courses" disabled>
                          Không tìm thấy khóa học nào
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructor Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Chọn huấn luyện viên *
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingInstructors ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Đang tải huấn luyện viên...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Huấn luyện viên có sẵn</Label>
                  <Select
                    value={selectedInstructor}
                    onValueChange={setSelectedInstructor}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn huấn luyện viên cho lớp học" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredInstructors.length > 0 ? (
                        filteredInstructors.map((instructor) => (
                          <SelectItem
                            key={instructor._id}
                            value={instructor._id}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={instructor.avatarUrl}
                                  alt={
                                    instructor?.username || "Huấn luyện viên"
                                  }
                                />
                                <AvatarFallback>
                                  {instructor?.username
                                    ?.charAt(0)
                                    ?.toUpperCase() || "G"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {instructor?.username || "Tên không xác định"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {instructor?.email || "Email không xác định"}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-instructors" disabled>
                          Không tìm thấy huấn luyện viên nào
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Validation Warnings/Errors */}
          {(validationResult.warnings.length > 0 ||
            validationResult.errors.length > 0) && (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
              {validationResult.errors.map((error, index) => (
                <Alert key={`error-${index}`} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{error.message}</AlertTitle>
                  <AlertDescription>{error.details}</AlertDescription>
                </Alert>
              ))}
              {validationResult.warnings.map((warning, index) => (
                <Alert
                  key={`warning-${index}`}
                  className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-200"
                >
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <AlertTitle className="text-yellow-800 dark:text-yellow-300">
                    {warning.message}
                  </AlertTitle>
                  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    {warning.details}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Chọn học viên (tùy chọn)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Members */}
              {selectedMembers.length > 0 && (
                <div className="space-y-2">
                  <Label>Học viên đã chọn ({selectedMembers.length})</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((memberId) => {
                      const student = (students || []).find(
                        (s) => s.user._id === memberId
                      );
                      return (
                        <Badge
                          key={memberId}
                          variant="secondary"
                          className="flex items-center gap-2 px-3 py-1"
                        >
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={student?.avatarUrl}
                              alt={student?.user?.username || "Học viên"}
                            />
                            <AvatarFallback className="text-xs">
                              {student?.user?.username
                                ?.charAt(0)
                                ?.toUpperCase() || "H"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{student?.user?.username || "Unknown"}</span>
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => handleRemoveMember(memberId)}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {!selectedCourse ? (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-6 text-center dark:bg-amber-950/30 dark:border-amber-800">
                  <div className="bg-background rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-sm">
                    <BookOpen className="h-8 w-8 text-amber-400" />
                  </div>
                  <p className="text-amber-900 dark:text-amber-200 font-medium mb-1">
                    Vui lòng chọn khóa học trước
                  </p>
                  <p className="text-amber-700/70 dark:text-amber-300/70 text-sm">
                    Bạn cần chọn khóa học trước để xem danh sách học viên đã
                    thanh toán
                  </p>
                </div>
              ) : loadingStudents ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">
                    Đang tải học viên đã thanh toán khóa học...
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Học viên đã thanh toán cho khóa học</Label>
                  <ScrollArea className="h-64 border rounded-md p-4">
                    <div className="space-y-2">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <div
                            key={student._id}
                            className="flex items-center space-x-3"
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
                            <Avatar className="h-8 w-8">
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
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {student?.user?.username ||
                                    "Tên không xác định"}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {student?.user?.email ||
                                    "Email không xác định"}
                                </span>
                              </div>
                            </Label>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <div className="bg-background rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center shadow-sm">
                            <Users className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <p className="font-medium mb-1">
                            Chưa có học viên nào thanh toán
                          </p>
                          <p className="text-sm">
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
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={submitting || !isFormValid || validatingInstructor}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
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
