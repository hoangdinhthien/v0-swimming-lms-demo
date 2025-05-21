"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Percent,
  Calendar,
  Tag,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

export default function PromotionsPage() {
  const [showNewPromotion, setShowNewPromotion] = useState(false);

  // Mock promotions data
  const activePromotions = [
    {
      id: 1,
      code: "SUMMER2023",
      title: "Summer Special",
      description: "Get 20% off on all summer swimming courses",
      discountType: "percentage",
      discountValue: 20,
      startDate: "2023-06-01",
      endDate: "2023-08-31",
      courses: ["All Summer Courses"],
      usageLimit: 100,
      usageCount: 45,
      status: "active",
    },
    {
      id: 2,
      code: "WELCOME10",
      title: "New Student Discount",
      description: "10% off for new students on their first course",
      discountType: "percentage",
      discountValue: 10,
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      courses: ["All Courses"],
      usageLimit: 500,
      usageCount: 210,
      status: "active",
    },
  ];

  const inactivePromotions = [
    {
      id: 3,
      code: "SPRING2023",
      title: "Spring Promotion",
      description: "15% off on all spring swimming courses",
      discountType: "percentage",
      discountValue: 15,
      startDate: "2023-03-01",
      endDate: "2023-05-31",
      courses: ["All Spring Courses"],
      usageLimit: 100,
      usageCount: 87,
      status: "expired",
    },
    {
      id: 4,
      code: "FAMILY25",
      title: "Family Package Discount",
      description: "$25 off when registering 3 or more family members",
      discountType: "fixed",
      discountValue: 25,
      startDate: "2023-02-01",
      endDate: "2023-04-30",
      courses: ["Family Swimming", "Parent & Child Swimming"],
      usageLimit: 50,
      usageCount: 32,
      status: "expired",
    },
  ];

  return (
    <DashboardLayout userRole='admin'>
      {" "}
      <div className='mb-6'>
        <Link
          href='/dashboard/admin'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Quay lại Bảng Điều Khiển
        </Link>
      </div>{" "}
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Khuyến Mãi & Giảm Giá</h1>
          <p className='text-muted-foreground'>
            Tạo và quản lý ưu đãi đặc biệt cho các khóa học bơi của bạn
          </p>
        </div>
        <Button onClick={() => setShowNewPromotion(!showNewPromotion)}>
          {showNewPromotion ? "Hủy" : <Plus className='mr-2 h-4 w-4' />}
          {showNewPromotion ? "Hủy" : "Tạo Khuyến Mãi"}
        </Button>
      </div>
      {showNewPromotion && (
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Tạo Khuyến Mãi Mới</CardTitle>
            <CardDescription>
              Thiết lập khuyến mãi hoặc ưu đãi đặc biệt mới
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='promo-title'>Tiêu Đề Khuyến Mãi</Label>
                <Input
                  id='promo-title'
                  placeholder='VD: Ưu đãi mùa hè'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='promo-code'>Mã Khuyến Mãi</Label>
                <Input
                  id='promo-code'
                  placeholder='VD: HE2023'
                />
              </div>
            </div>{" "}
            <div className='space-y-2'>
              <Label htmlFor='promo-description'>Mô Tả</Label>
              <Textarea
                id='promo-description'
                placeholder='Mô tả chi tiết khuyến mãi...'
                className='min-h-[100px]'
              />
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='discount-type'>Loại Giảm Giá</Label>
                <Select>
                  <SelectTrigger id='discount-type'>
                    <SelectValue placeholder='Chọn loại giảm giá' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='percentage'>
                      Giảm theo phần trăm
                    </SelectItem>
                    <SelectItem value='fixed'>Giảm số tiền cố định</SelectItem>
                  </SelectContent>
                </Select>
              </div>{" "}
              <div className='space-y-2'>
                <Label htmlFor='discount-value'>Giá Trị Giảm Giá</Label>
                <div className='relative'>
                  <Input
                    id='discount-value'
                    type='number'
                    placeholder='VD: 20'
                  />
                  <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                    <Percent className='h-4 w-4 text-muted-foreground' />
                  </div>
                </div>
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='start-date'>Ngày Bắt Đầu</Label>
                <Input
                  id='start-date'
                  type='date'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='end-date'>Ngày Kết Thúc</Label>
                <Input
                  id='end-date'
                  type='date'
                />
              </div>
            </div>{" "}
            <div className='space-y-2'>
              <Label htmlFor='applicable-courses'>Khóa Học Áp Dụng</Label>
              <Select>
                <SelectTrigger id='applicable-courses'>
                  <SelectValue placeholder='Chọn khóa học áp dụng' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tất cả khóa học</SelectItem>
                  <SelectItem value='beginner'>
                    Bơi cho người mới bắt đầu
                  </SelectItem>
                  <SelectItem value='intermediate'>
                    Kỹ thuật trung cấp
                  </SelectItem>
                  <SelectItem value='advanced'>Hiệu suất nâng cao</SelectItem>
                  <SelectItem value='family'>Bơi cho gia đình</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='usage-limit'>Giới Hạn Sử Dụng</Label>
                <Input
                  id='usage-limit'
                  type='number'
                  placeholder='VD: 100'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='min-purchase'>Số Tiền Mua Tối Thiểu</Label>
                <Input
                  id='min-purchase'
                  type='number'
                  placeholder='VD: 50'
                />
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Switch id='active-status' />
              <Label htmlFor='active-status'>Kích Hoạt</Label>
            </div>
          </CardContent>
          <CardFooter className='flex justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => setShowNewPromotion(false)}
            >
              Hủy
            </Button>
            <Button>Tạo Khuyến Mãi</Button>
          </CardFooter>
        </Card>
      )}
      <Tabs
        defaultValue='active'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-2'>
          {" "}
          <TabsTrigger value='active'>Khuyến Mãi Đang Hoạt Động</TabsTrigger>
          <TabsTrigger value='inactive'>Khuyến Mãi Không Hoạt Động</TabsTrigger>
        </TabsList>
        <TabsContent
          value='active'
          className='space-y-6 mt-6'
        >
          <div className='grid gap-4 md:grid-cols-2'>
            {activePromotions.map((promo) => (
              <Card key={promo.id}>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <CardTitle>{promo.title}</CardTitle>{" "}
                    <Badge
                      variant='outline'
                      className='bg-green-50 text-green-700 border-green-200'
                    >
                      Hoạt động
                    </Badge>
                  </div>
                  <CardDescription>Code: {promo.code}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <p className='text-sm'>{promo.description}</p>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Percent className='h-4 w-4 text-muted-foreground' />
                      <span>
                        {promo.discountType === "percentage"
                          ? `${promo.discountValue}% off`
                          : `$${promo.discountValue} off`}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <span>
                        {new Date(promo.startDate).toLocaleDateString()} -{" "}
                        {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 col-span-2'>
                      <Tag className='h-4 w-4 text-muted-foreground' />
                      <span>{promo.courses.join(", ")}</span>
                    </div>
                  </div>
                  <div className='bg-muted p-3 rounded-lg'>
                    <div className='flex justify-between text-sm mb-1'>
                      <span>Usage</span>
                      <span>
                        {promo.usageCount}/{promo.usageLimit}
                      </span>
                    </div>
                    <div className='w-full bg-background rounded-full h-2'>
                      <div
                        className='bg-sky-600 h-2 rounded-full'
                        style={{
                          width: `${
                            (promo.usageCount / promo.usageLimit) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex justify-between'>
                  <div className='flex gap-2'>
                    {" "}
                    <Button
                      variant='ghost'
                      size='sm'
                    >
                      <Copy className='h-4 w-4 mr-1' />
                      Sao chép
                    </Button>
                  </div>
                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      <Edit className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      <Trash2 className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent
          value='inactive'
          className='space-y-6 mt-6'
        >
          <div className='grid gap-4 md:grid-cols-2'>
            {inactivePromotions.map((promo) => (
              <Card key={promo.id}>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <CardTitle>{promo.title}</CardTitle>{" "}
                    <Badge
                      variant='outline'
                      className='bg-muted text-muted-foreground'
                    >
                      Hết hạn
                    </Badge>
                  </div>
                  <CardDescription>Code: {promo.code}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <p className='text-sm'>{promo.description}</p>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <div className='flex items-center gap-2'>
                      <Percent className='h-4 w-4 text-muted-foreground' />
                      <span>
                        {promo.discountType === "percentage"
                          ? `${promo.discountValue}% off`
                          : `$${promo.discountValue} off`}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-4 w-4 text-muted-foreground' />
                      <span>
                        {new Date(promo.startDate).toLocaleDateString()} -{" "}
                        {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 col-span-2'>
                      <Tag className='h-4 w-4 text-muted-foreground' />
                      <span>{promo.courses.join(", ")}</span>
                    </div>
                  </div>
                  <div className='bg-muted p-3 rounded-lg'>
                    <div className='flex justify-between text-sm mb-1'>
                      <span>Usage</span>
                      <span>
                        {promo.usageCount}/{promo.usageLimit}
                      </span>
                    </div>
                    <div className='w-full bg-background rounded-full h-2'>
                      <div
                        className='bg-muted-foreground h-2 rounded-full'
                        style={{
                          width: `${
                            (promo.usageCount / promo.usageLimit) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex justify-between'>
                  {" "}
                  <Button
                    variant='outline'
                    size='sm'
                  >
                    Kích hoạt lại
                  </Button>
                  <div className='flex gap-2'>
                    {" "}
                    <Button
                      variant='ghost'
                      size='sm'
                    >
                      <Copy className='h-4 w-4 mr-1' />
                      Nhân bản
                    </Button>
                    <Button
                      variant='outline'
                      size='sm'
                    >
                      <Trash2 className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
