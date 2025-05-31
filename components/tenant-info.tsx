"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, CheckCircle } from "lucide-react";
import { useTenant } from "@/components/tenant-provider";
import { useRouter } from "next/navigation";

export function TenantInfo() {
  const { selectedTenantId, clearTenant } = useTenant();
  const router = useRouter();

  const handleSwitchTenant = () => {
    clearTenant();
    router.push("/tenant-selection");
  };

  if (!selectedTenantId) {
    return null;
  }

  return (
    <Card className='mb-6'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Building2 className='h-5 w-5' />
          Current Tenant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='secondary'
              className='flex items-center gap-1'
            >
              <CheckCircle className='h-3 w-3' />
              Connected
            </Badge>
            <span className='text-sm text-gray-600'>
              Tenant ID: {selectedTenantId}
            </span>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleSwitchTenant}
          >
            Switch Tenant
          </Button>
        </div>
        <p className='text-sm text-gray-500 mt-2'>
          All API requests will automatically include the x-tenant-id header
          with this tenant ID.
        </p>
      </CardContent>
    </Card>
  );
}
