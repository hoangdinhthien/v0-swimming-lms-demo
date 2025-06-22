"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Home, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ManagerNotFound() {
  const router = useRouter();

  return (
    <div className='flex items-center justify-center min-h-[60vh] p-6'>
      <Card className='w-full max-w-md text-center border-0 shadow-lg'>
        <CardContent className='pt-8 pb-8'>
          {/* Error Icon */}
          <div className='flex justify-center mb-6'>
            <div className='relative'>
              <div className='w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-12 h-12 text-destructive' />
              </div>
              <div className='absolute -top-1 -right-1 w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center'>
                <span className='text-destructive font-bold text-lg'>404</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className='space-y-4 mb-8'>
            <h1 className='text-2xl font-bold text-foreground'>
              Không tìm thấy trang
            </h1>
            <p className='text-muted-foreground leading-relaxed'>
              Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển. Vui
              lòng kiểm tra lại đường dẫn hoặc quay về trang chính.
            </p>
          </div>

          {/* Action Buttons */}
          <div className='space-y-3'>
            <Button
              onClick={() => router.back()}
              variant='default'
              className='w-full'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại trang trước
            </Button>

            <div className='flex gap-2'>
              <Button
                asChild
                variant='outline'
                className='flex-1'
              >
                <Link href='/dashboard/manager'>
                  <Home className='w-4 h-4 mr-2' />
                  Trang chủ
                </Link>
              </Button>

              <Button
                asChild
                variant='outline'
                className='flex-1'
              >
                <Link href='/dashboard/manager/students'>
                  <Search className='w-4 h-4 mr-2' />
                  Tìm kiếm
                </Link>
              </Button>
            </div>
          </div>

          {/* Helpful Links */}
          <div className='mt-8 pt-6 border-t'>
            <p className='text-sm text-muted-foreground mb-3'>
              Bạn có thể truy cập:
            </p>
            <div className='flex flex-wrap gap-2 justify-center text-sm'>
              <Link
                href='/dashboard/manager/students'
                className='text-primary hover:underline'
              >
                Học viên
              </Link>
              <span className='text-muted-foreground'>•</span>
              <Link
                href='/dashboard/manager/instructors'
                className='text-primary hover:underline'
              >
                Giáo viên
              </Link>
              <span className='text-muted-foreground'>•</span>
              <Link
                href='/dashboard/manager/courses'
                className='text-primary hover:underline'
              >
                Khóa học
              </Link>
              <span className='text-muted-foreground'>•</span>
              <Link
                href='/dashboard/manager/calendar'
                className='text-primary hover:underline'
              >
                Lịch
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
