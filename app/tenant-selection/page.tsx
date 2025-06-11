"use client";

import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Waves, Building2 } from "lucide-react";
import {
  getAvailableTenants,
  // setSelectedTenant,
  type Tenant,
} from "@/api/tenant-api";
import { useTenant } from "@/components/tenant-provider";
import { LoadingScreen } from "@/components/loading-screen";

export default function TenantSelectionPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();
  const { setSelectedTenant } = useTenant();

  useEffect(() => {
    fetchAvailableTenants();
  }, []);

  const fetchAvailableTenants = async () => {
    try {
      setLoading(true);
      setError("");
      const availableTenants = await getAvailableTenants();
      setTenants(availableTenants);

      // If only one tenant is available, auto-select it
      if (availableTenants.length === 1) {
        setSelectedTenantId(availableTenants[0].tenant_id._id);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải danh sách chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenantId) {
      setError("Vui lòng chọn một chi nhánh");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      // Save the selected tenant using context
      setSelectedTenant(selectedTenantId);

      // Show loading screen while redirecting
      setRedirecting(true);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Không thể truy cập bảng điều khiển chi nhánh");
      setSubmitting(false);
    }
  };

  // If redirecting, show the loading screen
  if (redirecting) {
    return <LoadingScreen message='Đang chuẩn bị bảng điều khiển...' />;
  }

  if (loading) {
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
            <CardContent className='pt-6'>
              <div className='flex items-center justify-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500'></div>
              </div>{" "}
              <p className='text-center mt-4 text-sm text-gray-600'>
                Đang tải danh sách chi nhánh...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
            <CardTitle className='text-2xl font-bold text-center flex items-center justify-center gap-2'>
              {" "}
              <Building2 className='h-6 w-6 text-sky-500' />
              Chọn Chi Nhánh
            </CardTitle>
            <CardDescription className='text-center'>
              Chọn một chi nhánh để truy cập bảng điều khiển
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleTenantSelection}>
            <CardContent className='space-y-4'>
              {error && (
                <div className='text-red-500 text-sm text-center bg-red-50 p-3 rounded-md border border-red-200'>
                  {error}
                </div>
              )}

              {tenants.length === 0 ? (
                <div className='text-center py-8'>
                  {" "}
                  <Building2 className='h-12 w-12 text-gray-400 mx-auto mb-4' />{" "}
                  <p className='text-gray-600'>Không có chi nhánh nào</p>
                  <p className='text-sm text-gray-500 mt-2'>
                    Vui lòng liên hệ quản trị viên để được cấp quyền truy cập
                  </p>
                </div>
              ) : (
                <div className='space-y-2'>
                  {" "}
                  <Label htmlFor='tenant'>
                    Chi nhánh: <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={selectedTenantId}
                    onValueChange={setSelectedTenantId}
                    disabled={submitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Chọn một chi nhánh' />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((tenant) => (
                        <SelectItem
                          key={tenant.tenant_id._id}
                          value={tenant.tenant_id._id}
                        >
                          {tenant.tenant_id.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>

            {tenants.length > 0 && (
              <CardFooter className='flex flex-col space-y-4'>
                <Button
                  className='w-full'
                  type='submit'
                  disabled={!selectedTenantId || submitting}
                >
                  {" "}
                  {submitting ? "Đang truy cập..." : "Truy cập Bảng Điều Khiển"}
                </Button>{" "}
                <div className='text-center text-sm'>
                  <Link
                    href='/login'
                    className='text-sky-600 hover:underline'
                  >
                    Quay lại Đăng nhập
                  </Link>
                </div>
              </CardFooter>
            )}
          </form>
        </Card>
      </div>
    </div>
  );
}
