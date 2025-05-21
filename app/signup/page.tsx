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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Waves } from "lucide-react";

export default function SignupPage() {
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
              Tạo tài khoản mới
            </CardTitle>
            <CardDescription className='text-center'>
              Nhập thông tin của bạn để bắt đầu với AquaLearn
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='first-name'>Tên</Label>
                <Input
                  id='first-name'
                  placeholder='Nguyễn'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='last-name'>Họ</Label>
                <Input
                  id='last-name'
                  placeholder='Văn A'
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='m@example.com'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Mật khẩu</Label>
              <Input
                id='password'
                type='password'
              />
            </div>{" "}
            <div className='space-y-2'>
              <Label htmlFor='confirm-password'>Xác nhận mật khẩu</Label>
              <Input
                id='confirm-password'
                type='password'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='account-type'>Loại tài khoản</Label>
              <Select>
                <SelectTrigger id='account-type'>
                  <SelectValue placeholder='Chọn loại tài khoản' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='student'>Học viên</SelectItem>
                  <SelectItem value='parent'>Phụ huynh</SelectItem>
                  <SelectItem value='instructor'>
                    Giáo viên (cần phê duyệt)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>{" "}
          <CardFooter className='flex flex-col space-y-4'>
            <Button className='w-full'>Tạo Tài Khoản</Button>
            <div className='text-center text-sm'>
              Bạn đã có tài khoản?{" "}
              <Link
                href='/login'
                className='text-sky-600 hover:underline'
              >
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
