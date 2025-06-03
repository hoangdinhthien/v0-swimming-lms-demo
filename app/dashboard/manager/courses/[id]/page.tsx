"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSelectedTenant } from "@/utils/tenant-utils";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Calendar, Tag } from "lucide-react";
import { fetchCourseById } from "@/api/courses-api";
import { getAuthToken } from "@/api/auth-utils";

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params?.id as string;
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError(null);
      try {
        const tenantId = getSelectedTenant();
        const token = getAuthToken();
        if (!tenantId) throw new Error("Thiếu thông tin tenant");

        const courseData = await fetchCourseById({ courseId, tenantId, token });
        setCourse(courseData);
      } catch (e: any) {
        setError(e.message || "Lỗi không xác định");
        setCourse(null);
      }
      setLoading(false);
    }
    if (courseId) loadCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className='flex flex-col items-center justify-center py-16'>
        <Loader2 className='h-10 w-10 animate-spin text-muted-foreground mb-4' />
        <div>Đang tải chi tiết khoá học...</div>
      </div>
    );
  }

  if (error) {
    return <div className='text-red-500 p-8'>{error}</div>;
  }

  if (!course) {
    return <div className='p-8'>Không tìm thấy khoá học.</div>;
  }

  return (
    <>
      <div className='container mx-auto mb-4 pt-6'>
        <Link
          href='/dashboard/manager/courses'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' /> Quay về danh sách khoá học
        </Link>
      </div>

      <div className='container mx-auto bg-white rounded-lg shadow p-4 md:p-6 mb-6'>
        <h1 className='text-2xl font-bold mb-2'>{course.title}</h1>
        <div className='flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-4'>
          <div className='flex items-center gap-1'>
            <Tag className='h-4 w-4' />
            {Array.isArray(course.category) &&
              course.category.map((cat: any) => (
                <span
                  key={cat._id}
                  className='mr-2'
                >
                  {cat.title}
                </span>
              ))}
          </div>
          <Badge
            variant='outline'
            className={
              course.is_active
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-700 border-gray-200"
            }
          >
            {course.is_active ? "Đang hoạt động" : "Đã kết thúc"}
          </Badge>
          <div className='flex items-center gap-1'>
            <Calendar className='h-4 w-4' />
            <span>
              Ngày tạo:{" "}
              {course.created_at
                ? new Date(course.created_at).toLocaleDateString("vi-VN")
                : "-"}
            </span>
            {course.updated_at && course.updated_at !== course.created_at && (
              <span className='ml-2'>
                (Cập nhật:{" "}
                {new Date(course.updated_at).toLocaleDateString("vi-VN")})
              </span>
            )}
          </div>
        </div>
        <div className='flex justify-center mb-4'>
          <div className='w-full max-w-xl aspect-video bg-muted rounded-md flex items-center justify-center'>
            <img
              src={`/placeholder.svg?height=400&width=800&text=${encodeURIComponent(
                course.title
              )}`}
              alt={course.title}
              className='object-contain w-full h-full rounded-md'
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
          </div>
        </div>
        <div className='text-base mb-4 whitespace-pre-wrap'>
          {course.description}
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mb-4'>
          <div>
            <div className='font-medium'>Giá</div>
            <div>{course.price?.toLocaleString()}₫</div>
          </div>
          <div>
            <div className='font-medium'>Số buổi</div>
            <div>{course.session_number}</div>
          </div>
          <div>
            <div className='font-medium'>Thời lượng/buổi</div>
            <div>{course.session_number_duration}</div>
          </div>
        </div>
        {Array.isArray(course.detail) && course.detail.length > 0 && (
          <div className='mt-2'>
            <div className='font-medium mb-1'>Nội dung khoá học:</div>
            <ul className='list-disc pl-5 space-y-1'>
              {course.detail.map((item: any, idx: number) => (
                <li key={idx}>{item.title}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
