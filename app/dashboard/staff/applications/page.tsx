"use client";

import { useStaffApplications } from "@/hooks/useStaffData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StaffApplicationsPage() {
  const { data, loading, error, refetch, hasPermission } =
    useStaffApplications();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <Alert>
        <AlertDescription>
          You don't have permission to view applications. Please contact your
          manager.
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
        <div className='flex items-center justify-between space-y-2'>
          <h2 className='text-3xl font-bold tracking-tight'>Applications</h2>
          <Button
            onClick={refetch}
            variant='outline'
            size='sm'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Retry
          </Button>
        </div>
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='flex-1 space-y-4 p-4 md:p-8 pt-6'>
      <div className='flex items-center justify-between space-y-2'>
        <h2 className='text-3xl font-bold tracking-tight'>Applications</h2>
        <div className='flex items-center space-x-2'>
          <Button
            onClick={refetch}
            variant='outline'
            size='sm'
          >
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
          <Button size='sm'>
            <Plus className='h-4 w-4 mr-2' />
            New Application
          </Button>
        </div>
      </div>

      {data ? (
        <div className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Application Data from Staff API</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    API Response Status:
                  </span>
                  <Badge variant='default'>
                    {data.statusCode} - {data.message}
                  </Badge>
                </div>

                <div className='space-y-2'>
                  <h4 className='font-medium'>Raw API Response:</h4>
                  <pre className='text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96'>
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Application Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              No application data available. This could mean:
            </p>
            <ul className='list-disc list-inside mt-2 text-sm text-muted-foreground'>
              <li>You don't have any applications assigned</li>
              <li>The API is still loading</li>
              <li>There's a permission issue</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
