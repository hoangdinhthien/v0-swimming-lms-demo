import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Waves } from "lucide-react";

export default function LoginPage() {
  return (
    <div className='min-h-screen flex flex-col'>
      <div className='container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-screen py-12'>
        <Link
          href='/'
          className='flex items-center gap-2 mb-8'
        >
          <Waves className='h-6 w-6 text-sky-500' />
          <span className='font-bold text-xl'>AquaLearn</span>
        </Link>

        <Card className='w-full max-w-md'>
          {" "}
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center'>
              Đăng nhập vào tài khoản của bạn
            </CardTitle>
            <CardDescription className='text-center'>
              Nhập email và mật khẩu của bạn để truy cập bảng điều khiển
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='m@example.com'
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>Mật khẩu</Label>
                <Link
                  href='/forgot-password'
                  className='text-sm text-sky-600 hover:underline'
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <Input
                id='password'
                type='password'
              />
            </div>
          </CardContent>{" "}
          <CardFooter className='flex flex-col space-y-4'>
            <Button className='w-full'>Đăng Nhập</Button>
            <div className='text-center text-sm'>
              Bạn chưa có tài khoản?{" "}
              <Link
                href='/signup'
                className='text-sky-600 hover:underline'
              >
                Đăng ký
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
