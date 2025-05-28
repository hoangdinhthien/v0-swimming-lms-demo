"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  BarChart,
  FileText,
  Calendar,
  Filter,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function ReportsPage() {
  const [reportType, setReportType] = useState("financial");
  const [timeframe, setTimeframe] = useState("monthly");

  // Mock financial data
  const financialData = [
    { category: "Course Fees", revenue: 32500, percentage: 65 },
    { category: "Private Lessons", revenue: 8750, percentage: 17.5 },
    { category: "Merchandise", revenue: 4200, percentage: 8.4 },
    { category: "Registration Fees", revenue: 3800, percentage: 7.6 },
    { category: "Other", revenue: 750, percentage: 1.5 },
  ];

  const totalRevenue = financialData.reduce(
    (sum, item) => sum + item.revenue,
    0
  );

  // Mock attendance data
  const attendanceData = [
    {
      course: "Beginner Swimming",
      enrolled: 42,
      attended: 38,
      percentage: 90.5,
    },
    {
      course: "Intermediate Techniques",
      enrolled: 28,
      attended: 24,
      percentage: 85.7,
    },
    {
      course: "Advanced Performance",
      enrolled: 15,
      attended: 14,
      percentage: 93.3,
    },
    { course: "Water Safety", enrolled: 35, attended: 31, percentage: 88.6 },
    {
      course: "Parent & Child Swimming",
      enrolled: 18,
      attended: 15,
      percentage: 83.3,
    },
  ];

  // Mock instructor performance data
  const instructorPerformanceData = [
    {
      name: "Sarah Johnson",
      classes: 12,
      students: 32,
      attendance: 91,
      rating: 4.9,
    },
    {
      name: "Michael Chen",
      classes: 8,
      students: 18,
      attendance: 94,
      rating: 4.8,
    },
    {
      name: "Emma Rodriguez",
      classes: 10,
      students: 25,
      attendance: 88,
      rating: 4.7,
    },
    {
      name: "David Wilson",
      classes: 8,
      students: 20,
      attendance: 85,
      rating: 4.6,
    },
    {
      name: "Lisa Thompson",
      classes: 6,
      students: 22,
      attendance: 90,
      rating: 4.5,
    },
  ];

  // Helper function to render the current report based on the selected type
  const renderCurrentReport = () => {
    switch (reportType) {
      case "financial":
        return (
          <>
            <div className='grid gap-6 mb-6 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>
                    ${totalRevenue.toLocaleString()}
                  </div>
                  <p className='text-xs text-green-600 mt-1'>
                    +12% from last period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Average Course Fee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>$142</div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Per student
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Revenue per Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>$6,250</div>
                  <p className='text-xs text-green-600 mt-1'>
                    +5% from last period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Operational Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>$18,700</div>
                  <p className='text-xs text-red-600 mt-1'>
                    +2% from last period
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Revenue</TableHead>
                      <TableHead className='text-right'>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell className='font-medium'>
                          {item.category}
                        </TableCell>
                        <TableCell className='text-right'>
                          ${item.revenue.toLocaleString()}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.percentage}%
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className='font-medium'>Total</TableCell>
                      <TableCell className='text-right font-bold'>
                        ${totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className='text-right font-bold'>
                        100%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        );

      case "attendance":
        return (
          <>
            <div className='grid gap-6 mb-6 md:grid-cols-4'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Overall Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>88.3%</div>
                  <p className='text-xs text-green-600 mt-1'>
                    +2.1% from last period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Highest Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>93.3%</div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Advanced Performance
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Lowest Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>83.3%</div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Parent & Child Swimming
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    No-Show Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>11.7%</div>
                  <p className='text-xs text-red-600 mt-1'>
                    -2.1% from last period
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Course</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead className='text-right'>Enrolled</TableHead>
                      <TableHead className='text-right'>Attended</TableHead>
                      <TableHead className='text-right'>
                        Attendance Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((item) => (
                      <TableRow key={item.course}>
                        <TableCell className='font-medium'>
                          {item.course}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.enrolled}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.attended}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.percentage.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        );

      case "instructor":
        return (
          <>
            <div className='grid gap-6 mb-6 md:grid-cols-3'>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Average Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>4.7/5.0</div>
                  <p className='text-xs text-green-600 mt-1'>
                    +0.2 from last period
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Top Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>Sarah Johnson</div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Rating: 4.9/5.0
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-sm font-medium'>
                    Student/Instructor Ratio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold'>23.4</div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Students per instructor
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Instructor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Instructor</TableHead>
                      <TableHead className='text-right'>Classes</TableHead>
                      <TableHead className='text-right'>Students</TableHead>
                      <TableHead className='text-right'>Attendance %</TableHead>
                      <TableHead className='text-right'>Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instructorPerformanceData.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell className='font-medium'>
                          {item.name}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.classes}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.students}
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.attendance}%
                        </TableCell>
                        <TableCell className='text-right'>
                          {item.rating}/5.0
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        );

      default:
        return <p>Select a report type to view data</p>;
    }
  };

  return (
    <DashboardLayout userRole='manager'>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Reports & Analysis</h1>
          <p className='text-muted-foreground'>
            Generate detailed reports on financial performance, attendance, and
            instructor metrics
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Printer className='mr-2 h-4 w-4' />
            Print Report
          </Button>
          <Button>
            <Download className='mr-2 h-4 w-4' />
            Export Data
          </Button>
        </div>
      </div>

      {/* Report Controls */}
      <div className='mt-8 flex flex-col gap-4 md:flex-row'>
        <Select
          value={reportType}
          onValueChange={setReportType}
        >
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='Select Report Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='financial'>
              <div className='flex items-center'>
                <BarChart className='mr-2 h-4 w-4' />
                <span>Financial Report</span>
              </div>
            </SelectItem>
            <SelectItem value='attendance'>
              <div className='flex items-center'>
                <Calendar className='mr-2 h-4 w-4' />
                <span>Attendance Report</span>
              </div>
            </SelectItem>
            <SelectItem value='instructor'>
              <div className='flex items-center'>
                <FileText className='mr-2 h-4 w-4' />
                <span>Instructor Performance</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={timeframe}
          onValueChange={setTimeframe}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Time Period' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='weekly'>Last 7 Days</SelectItem>
            <SelectItem value='monthly'>Last 30 Days</SelectItem>
            <SelectItem value='quarterly'>Last Quarter</SelectItem>
            <SelectItem value='yearly'>Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Report Content */}
      <div className='mt-8'>{renderCurrentReport()}</div>
    </DashboardLayout>
  );
}
