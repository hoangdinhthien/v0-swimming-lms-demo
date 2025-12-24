"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Search,
  CreditCard,
  User,
  Users,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { fetchCourses } from "@/api/manager/courses-api";
import { fetchStudents } from "@/api/manager/students-api";
import { createOrder, CreateOrderData } from "@/api/manager/orders-api";
import { useAuth } from "@/hooks/use-auth";

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type OrderType = "member" | "guest" | "cash";

export function CreateOrderModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrderModalProps) {
  const { toast } = useToast();
  const { token, tenantId } = useAuth();

  // Form state
  const [orderType, setOrderType] = useState<OrderType>("member");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [status, setStatus] = useState("paid");
  const [price, setPrice] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  // Data loading states
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creating, setCreating] = useState(false);

  // Search states
  const [courseSearchKey, setCourseSearchKey] = useState("");
  const [studentSearchKey, setStudentSearchKey] = useState("");

  // Load courses when modal opens or search changes
  useEffect(() => {
    if (open && token && tenantId) {
      loadCourses();
    }
  }, [open, courseSearchKey, token, tenantId]);

  // Load students when order type changes or search changes
  useEffect(() => {
    if (
      open &&
      token &&
      tenantId &&
      (orderType === "member" || orderType === "cash")
    ) {
      loadStudents();
    }
  }, [open, orderType, studentSearchKey, token, tenantId]);

  const loadCourses = async () => {
    if (!token || !tenantId) return;

    setLoadingCourses(true);
    try {
      const result = await fetchCourses({
        tenantId,
        token,
        page: 1,
        limit: 100,
        searchKey: courseSearchKey,
      });
      setCourses(result.data || []);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách khóa học",
        variant: "destructive",
      });
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadStudents = async () => {
    if (!token || !tenantId) return;

    setLoadingStudents(true);
    try {
      const result = await fetchStudents({
        tenantId,
        token,
        role: "member",
        searchKey: studentSearchKey,
      });
      setStudents(result || []);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách học viên",
        variant: "destructive",
      });
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || !tenantId) {
      toast({
        title: "Lỗi",
        description: "Thiếu thông tin xác thực",
        variant: "destructive",
      });
      return;
    }

    // Validation
    if (!selectedCourseId) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn khóa học",
        variant: "destructive",
      });
      return;
    }

    // Check if course is active
    const selectedCourse = courses.find((c) => c._id === selectedCourseId);
    if (selectedCourse && selectedCourse.is_active === false) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo giao dịch với khóa học không hoạt động",
        variant: "destructive",
      });
      return;
    }

    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập số tiền hợp lệ",
        variant: "destructive",
      });
      return;
    }

    // Validate based on order type
    if (orderType === "member") {
      if (!selectedUserId) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn học viên",
          variant: "destructive",
        });
        return;
      }
    } else if (orderType === "guest") {
      if (!guestName || !guestPhone || !guestEmail) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập đầy đủ thông tin khách hàng",
          variant: "destructive",
        });
        return;
      }
    } else if (orderType === "cash") {
      // For cash, either user or guest data is required
      if (!selectedUserId && (!guestName || !guestPhone || !guestEmail)) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn học viên hoặc nhập thông tin khách hàng",
          variant: "destructive",
        });
        return;
      }
    }

    setCreating(true);
    try {
      // Build order data
      const orderData: CreateOrderData = {
        type: [orderType],
        course: selectedCourseId,
        status: [status],
        price: Number(price),
      };

      // Add user or guest data based on order type
      if (orderType === "member") {
        orderData.user = selectedUserId;
      } else if (orderType === "guest") {
        orderData.guest = {
          username: guestName,
          phone: guestPhone,
          email: guestEmail,
        };
      } else if (orderType === "cash") {
        if (selectedUserId) {
          orderData.user = selectedUserId;
        } else {
          orderData.guest = {
            username: guestName,
            phone: guestPhone,
            email: guestEmail,
          };
        }
      }

      await createOrder(orderData, tenantId, token);

      toast({
        title: "Thành công",
        description: "Đã tạo giao dịch mới thành công",
      });

      // Reset form
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể tạo giao dịch. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setOrderType("member");
    setSelectedCourseId("");
    setSelectedUserId("");
    setStatus("paid");
    setPrice("");
    setGuestName("");
    setGuestPhone("");
    setGuestEmail("");
    setCourseSearchKey("");
    setStudentSearchKey("");
  };

  // Auto-fill price when course is selected
  useEffect(() => {
    if (selectedCourseId) {
      const course = courses.find((c) => c._id === selectedCourseId);
      if (course && course.price) {
        setPrice(String(course.price));
      }
    }
  }, [selectedCourseId, courses]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold'>
            Tạo giao dịch mới
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin để tạo giao dịch thanh toán cho khách hàng
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Order Type Selection with Cards */}
          <div className='space-y-3'>
            <Label className='text-base font-semibold'>Loại giao dịch *</Label>
            <div className='grid grid-cols-3 gap-4'>
              <Card
                className={`cursor-pointer transition-all ${
                  orderType === "member"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "hover:border-primary/50"
                }`}
                onClick={() => {
                  setOrderType("member");
                  setSelectedUserId("");
                  setGuestName("");
                  setGuestPhone("");
                  setGuestEmail("");
                }}
              >
                <CardContent className='p-4 text-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <div
                      className={`p-3 rounded-full ${
                        orderType === "member"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <User className='h-6 w-6' />
                    </div>
                    <div>
                      <div className='font-semibold'>Thành viên</div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        Đã có tài khoản
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  orderType === "guest"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "hover:border-primary/50"
                }`}
                onClick={() => {
                  setOrderType("guest");
                  setSelectedUserId("");
                  setGuestName("");
                  setGuestPhone("");
                  setGuestEmail("");
                }}
              >
                <CardContent className='p-4 text-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <div
                      className={`p-3 rounded-full ${
                        orderType === "guest"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <Users className='h-6 w-6' />
                    </div>
                    <div>
                      <div className='font-semibold'>Khách</div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        Chưa có tài khoản
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all ${
                  orderType === "cash"
                    ? "border-primary bg-primary/5 shadow-md"
                    : "hover:border-primary/50"
                }`}
                onClick={() => {
                  setOrderType("cash");
                  setSelectedUserId("");
                  setGuestName("");
                  setGuestPhone("");
                  setGuestEmail("");
                }}
              >
                <CardContent className='p-4 text-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <div
                      className={`p-3 rounded-full ${
                        orderType === "cash"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <DollarSign className='h-6 w-6' />
                    </div>
                    <div>
                      <div className='font-semibold'>Tiền mặt</div>
                      <div className='text-xs text-muted-foreground mt-1'>
                        Cả hai loại
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />

          {/* Course Selection Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5 text-primary' />
              <Label className='text-base font-semibold'>
                Thông tin khóa học
              </Label>
            </div>
            <Card>
              <CardContent className='pt-6 space-y-2'>
                <Label htmlFor='course'>Tìm kiếm và chọn khóa học *</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10' />
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                  >
                    <SelectTrigger
                      id='course'
                      className='h-10 pl-9'
                    >
                      <SelectValue placeholder='Tìm kiếm và chọn khóa học...' />
                    </SelectTrigger>
                    <SelectContent>
                      <div className='px-2 pb-2'>
                        <Input
                          placeholder='Nhập tên khóa học...'
                          value={courseSearchKey}
                          onChange={(e) => setCourseSearchKey(e.target.value)}
                          className='h-8'
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {loadingCourses ? (
                        <div className='flex items-center justify-center py-6'>
                          <Loader2 className='h-4 w-4 animate-spin mr-2' />
                          <span className='text-sm text-muted-foreground'>
                            Đang tải...
                          </span>
                        </div>
                      ) : courses.length === 0 ? (
                        <div className='text-center py-6 text-sm text-muted-foreground'>
                          Không tìm thấy khóa học
                        </div>
                      ) : (
                        courses.map((course) => (
                          <SelectItem
                            key={course._id}
                            value={course._id}
                            disabled={course.is_active === false}
                          >
                            <div className='flex items-center justify-between w-full gap-2'>
                              <div className='flex items-center gap-2 flex-1 min-w-0'>
                                <span
                                  className={`font-medium truncate ${
                                    course.is_active === false
                                      ? "text-muted-foreground line-through"
                                      : ""
                                  }`}
                                >
                                  {course.title}
                                </span>
                                {course.is_active === false && (
                                  <Badge
                                    variant='outline'
                                    className='text-xs border-destructive text-destructive shrink-0'
                                  >
                                    Không hoạt động
                                  </Badge>
                                )}
                              </div>
                              <Badge
                                variant='secondary'
                                className='shrink-0'
                              >
                                {course.price?.toLocaleString("vi-VN")}đ
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCourseId &&
                  courses.find((c) => c._id === selectedCourseId)?.is_active ===
                    false && (
                    <p className='text-xs text-destructive'>
                      Khóa học này đang không hoạt động, không thể tạo giao dịch
                    </p>
                  )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Student Selection (for member or cash with user) */}
          {(orderType === "member" || orderType === "cash") && (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <User className='h-5 w-5 text-primary' />
                <Label className='text-base font-semibold'>
                  Thông tin học viên {orderType === "member" && "*"}
                </Label>
              </div>
              <Card>
                <CardContent className='pt-6 space-y-2'>
                  <Label htmlFor='student'>
                    Tìm kiếm và chọn học viên{" "}
                    {orderType === "member" ? "*" : "(Tùy chọn)"}
                  </Label>
                  <div className='relative'>
                    <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10' />
                    <Select
                      value={selectedUserId}
                      onValueChange={setSelectedUserId}
                    >
                      <SelectTrigger
                        id='student'
                        className='h-10 pl-9'
                      >
                        <SelectValue placeholder='Tìm kiếm và chọn học viên...' />
                      </SelectTrigger>
                      <SelectContent>
                        <div className='px-2 pb-2'>
                          <Input
                            placeholder='Nhập tên hoặc email học viên...'
                            value={studentSearchKey}
                            onChange={(e) =>
                              setStudentSearchKey(e.target.value)
                            }
                            className='h-8'
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {loadingStudents ? (
                          <div className='flex items-center justify-center py-6'>
                            <Loader2 className='h-4 w-4 animate-spin mr-2' />
                            <span className='text-sm text-muted-foreground'>
                              Đang tải...
                            </span>
                          </div>
                        ) : students.length === 0 ? (
                          <div className='text-center py-6 text-sm text-muted-foreground'>
                            Không tìm thấy học viên
                          </div>
                        ) : (
                          students.map((student) => (
                            <SelectItem
                              key={student._id}
                              value={student.user?._id || student._id}
                            >
                              <div className='flex flex-col'>
                                <span className='font-medium'>
                                  {student.user?.username || student.username}
                                </span>
                                <span className='text-xs text-muted-foreground'>
                                  {student.user?.email || student.email}
                                </span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Guest Information (for guest or cash without user) */}
          {(orderType === "guest" ||
            (orderType === "cash" && !selectedUserId)) && (
            <div className='space-y-4'>
              <div className='flex items-center gap-2'>
                <Users className='h-5 w-5 text-primary' />
                <Label className='text-base font-semibold'>
                  Thông tin khách hàng {orderType === "guest" && "*"}
                </Label>
              </div>
              {orderType === "cash" && (
                <div className='bg-muted/50 border border-dashed rounded-lg p-3'>
                  <p className='text-sm text-muted-foreground'>
                    💡 Hoặc nhập thông tin khách hàng mới nếu chưa có tài khoản
                  </p>
                </div>
              )}
              <Card>
                <CardContent className='pt-6 space-y-4'>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2 md:col-span-2'>
                      <Label htmlFor='guest-name'>
                        Họ và tên {orderType === "guest" ? "*" : "(Tùy chọn)"}
                      </Label>
                      <Input
                        id='guest-name'
                        placeholder='Nguyễn Văn A'
                        className='h-10'
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='guest-phone'>
                        Số điện thoại{" "}
                        {orderType === "guest" ? "*" : "(Tùy chọn)"}
                      </Label>
                      <Input
                        id='guest-phone'
                        placeholder='0912345678'
                        className='h-10'
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='guest-email'>
                        Email {orderType === "guest" ? "*" : "(Tùy chọn)"}
                      </Label>
                      <Input
                        id='guest-email'
                        type='email'
                        placeholder='example@email.com'
                        className='h-10'
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator />

          {/* Payment Details Section */}
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-5 w-5 text-primary' />
              <Label className='text-base font-semibold'>
                Chi tiết thanh toán
              </Label>
            </div>
            <Card className='border-primary/20 bg-primary/5'>
              <CardContent className='pt-6 space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='status'>Trạng thái thanh toán *</Label>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                    >
                      <SelectTrigger
                        id='status'
                        className='h-10 bg-background'
                      >
                        <SelectValue placeholder='-- Chọn trạng thái --' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='paid'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-green-500'></div>
                            <span>Đã thanh toán</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='pending'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-yellow-500'></div>
                            <span>Đang chờ</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='expired'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-red-500'></div>
                            <span>Đã hết hạn</span>
                          </div>
                        </SelectItem>
                        <SelectItem value='refunded'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 rounded-full bg-orange-500'></div>
                            <span>Đã hoàn tiền</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='price'>Số tiền (VND) *</Label>
                    <div className='relative'>
                      <DollarSign className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                      <Input
                        id='price'
                        type='number'
                        placeholder='0'
                        className='pl-9 h-10 bg-background'
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                      />
                    </div>
                    {price && (
                      <p className='text-sm text-muted-foreground'>
                        {Number(price).toLocaleString("vi-VN")}đ
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            variant='outline'
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={creating}
            className='w-full sm:w-auto'
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating}
            className='w-full sm:w-auto'
          >
            {creating ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang tạo giao dịch...
              </>
            ) : (
              <>
                <CreditCard className='mr-2 h-4 w-4' />
                Tạo giao dịch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
