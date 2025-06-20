"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { login } from "@/api/login-api";
import { setAuthCookies } from "@/api/auth-utils";
import { LoadingScreen } from "@/components/loading-screen";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      // The API response is { data: { ... }, message, statusCode }
      const user = data?.data?.user;
      const token = data?.data?.accessToken;

      // Save token/user info using auth utility for consistency
      if (token && user) {
        setAuthCookies(token, user);
      } // Debug: log user data
      console.log("Login response:", data);

      // Show loading screen while redirecting
      setRedirecting(true);

      // Redirect to tenant selection page
      router.push("/tenant-selection");
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại");
      setLoading(false);
    }
  };

  // If redirecting, show the loading screen
  if (redirecting) {
    return <LoadingScreen message='Đang đăng nhập vào hệ thống...' />;
  }

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
          <CardHeader className='space-y-1'>
            <CardTitle className='text-2xl font-bold text-center'>
              Đăng nhập vào tài khoản của bạn
            </CardTitle>
            <CardDescription className='text-center'>
              Nhập email và mật khẩu của bạn để truy cập bảng điều khiển
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className='space-y-4'>
              {error && (
                <div className='text-red-500 text-sm text-center'>{error}</div>
              )}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className='flex flex-col space-y-4'>
              <Button
                className='w-full'
                type='submit'
                disabled={loading}
              >
                {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
              </Button>
              <div className='text-center text-sm'>
                Bạn chưa có tài khoản?{" "}
                <span className='text-gray-500'>Liên hệ admin để đăng ký</span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
