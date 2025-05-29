"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  MoreVertical,
  Plus,
  MapPin,
  Phone,
  Mail,
  Users,
} from "lucide-react";

export default function TenantsPage() {
  const [tenants, setTenants] = useState([
    {
      id: 1,
      name: "AquaLearn Trung Tâm",
      address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
      status: "active",
      manager: "Nguyễn Văn A",
      phone: "0901234567",
      email: "trungtam@aqualearn.vn",
      students: 120,
      instructors: 8,
      courses: 15,
    },
    {
      id: 2,
      name: "AquaLearn Quận 2",
      address: "456 Trần Não, Quận 2, TP.HCM",
      status: "active",
      manager: "Trần Thị B",
      phone: "0907654321",
      email: "quan2@aqualearn.vn",
      students: 85,
      instructors: 5,
      courses: 10,
    },
    {
      id: 3,
      name: "AquaLearn Quận 7",
      address: "789 Nguyễn Thị Thập, Quận 7, TP.HCM",
      status: "inactive",
      manager: "Lê Văn C",
      phone: "0903456789",
      email: "quan7@aqualearn.vn",
      students: 45,
      instructors: 3,
      courses: 7,
    },
    {
      id: 4,
      name: "AquaLearn Bình Thạnh",
      address: "101 Điện Biên Phủ, Bình Thạnh, TP.HCM",
      status: "active",
      manager: "Phạm Thị D",
      phone: "0908765432",
      email: "binhthanh@aqualearn.vn",
      students: 95,
      instructors: 6,
      courses: 12,
    },
  ]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Chi Nhánh</h1>
          <p className='text-muted-foreground'>
            Quản lý danh sách các chi nhánh trung tâm dạy bơi
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className='mr-2 h-4 w-4' /> Thêm chi nhánh
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm chi nhánh mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin chi tiết để thêm chi nhánh mới vào hệ thống.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-4 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='name'>Tên chi nhánh</Label>
                <Input
                  id='name'
                  placeholder='AquaLearn...'
                />
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='address'>Địa chỉ</Label>
                <Textarea
                  id='address'
                  placeholder='123 Đường...'
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='manager'>Quản lý</Label>
                  <Input
                    id='manager'
                    placeholder='Nguyễn Văn A...'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label htmlFor='phone'>Số điện thoại</Label>
                  <Input
                    id='phone'
                    placeholder='090...'
                  />
                </div>
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='example@aqualearn.vn'
                />
              </div>
            </div>
            <DialogFooter>
              <Button type='submit'>Lưu chi nhánh</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid gap-6'>
        {/* Tổng quan chi nhánh */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng chi nhánh
              </CardTitle>
              <Building className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{tenants.length}</div>
              <p className='text-xs text-muted-foreground'>
                {tenants.filter((t) => t.status === "active").length} chi nhánh
                đang hoạt động
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng học viên
              </CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {tenants.reduce((acc, tenant) => acc + tenant.students, 0)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Tổng số học viên trên toàn bộ chi nhánh
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Tổng giáo viên
              </CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {tenants.reduce((acc, tenant) => acc + tenant.instructors, 0)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Tổng số giáo viên trên toàn bộ chi nhánh
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Danh sách chi nhánh */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách chi nhánh</CardTitle>
            <CardDescription>
              Quản lý tất cả các chi nhánh của hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên chi nhánh</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead>Quản lý</TableHead>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className='text-right'>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className='font-medium'>{tenant.name}</TableCell>
                    <TableCell>{tenant.address}</TableCell>
                    <TableCell>{tenant.manager}</TableCell>
                    <TableCell>{tenant.students}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tenant.status === "active" ? "default" : "secondary"
                        }
                      >
                        {tenant.status === "active"
                          ? "Đang hoạt động"
                          : "Ngưng hoạt động"}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                          >
                            <span className='sr-only'>Mở menu</span>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
                          <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                          <DropdownMenuItem>
                            {tenant.status === "active"
                              ? "Tạm ngưng"
                              : "Kích hoạt"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Chi tiết chi nhánh */}
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          {tenants
            .filter((t) => t.status === "active")
            .map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader>
                  <CardTitle>{tenant.name}</CardTitle>
                  <CardDescription className='flex items-center gap-1'>
                    <MapPin className='h-3 w-3' /> {tenant.address}
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex items-center space-x-2 text-sm'>
                    <span className='font-medium'>Quản lý:</span>
                    <span>{tenant.manager}</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm'>
                    <Phone className='h-3 w-3' />
                    <span>{tenant.phone}</span>
                  </div>
                  <div className='flex items-center space-x-2 text-sm'>
                    <Mail className='h-3 w-3' />
                    <span>{tenant.email}</span>
                  </div>
                  <div className='grid grid-cols-3 gap-2 pt-2'>
                    <div className='flex flex-col rounded-md border p-2 text-center'>
                      <span className='text-xs text-muted-foreground'>
                        Học viên
                      </span>
                      <span className='font-bold'>{tenant.students}</span>
                    </div>
                    <div className='flex flex-col rounded-md border p-2 text-center'>
                      <span className='text-xs text-muted-foreground'>
                        Giáo viên
                      </span>
                      <span className='font-bold'>{tenant.instructors}</span>
                    </div>
                    <div className='flex flex-col rounded-md border p-2 text-center'>
                      <span className='text-xs text-muted-foreground'>
                        Khóa học
                      </span>
                      <span className='font-bold'>{tenant.courses}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className='flex justify-between'>
                  <Button
                    variant='outline'
                    size='sm'
                  >
                    Xem chi tiết
                  </Button>
                  <Badge
                    variant='outline'
                    className='ml-auto'
                  >
                    {tenant.status === "active"
                      ? "Đang hoạt động"
                      : "Ngưng hoạt động"}
                  </Badge>
                </CardFooter>
              </Card>
            ))}
        </div>
      </div>
    </div>
  );
}
