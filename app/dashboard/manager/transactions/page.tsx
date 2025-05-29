"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function TransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [courseFilter, setCourseFilter] = useState("all");

  // Mock transaction data
  const transactions = [
    {
      id: "TRX-001",
      studentName: "Emma Wilson",
      studentId: "STU12345",
      course: "Beginner Swimming",
      amount: "$120.00",
      date: "May 22, 2025",
      paymentMethod: "Credit Card",
      status: "Completed",
      createdBy: "Online",
      avatar: "/placeholder.svg?height=40&width=40&text=EW",
    },
    {
      id: "TRX-002",
      studentName: "Noah Martinez",
      studentId: "STU12346",
      course: "Beginner Swimming",
      amount: "$120.00",
      date: "May 21, 2025",
      paymentMethod: "Cash",
      status: "Completed",
      createdBy: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40&text=NM",
    },
    {
      id: "TRX-003",
      studentName: "Olivia Johnson",
      studentId: "STU12348",
      course: "Intermediate Techniques",
      amount: "$150.00",
      date: "May 20, 2025",
      paymentMethod: "Bank Transfer",
      status: "Completed",
      createdBy: "Online",
      avatar: "/placeholder.svg?height=40&width=40&text=OJ",
    },
    {
      id: "TRX-004",
      studentName: "Liam Thompson",
      studentId: "STU12350",
      course: "Beginner Swimming",
      amount: "$120.00",
      date: "May 18, 2025",
      paymentMethod: "Credit Card",
      status: "Pending",
      createdBy: "Online",
      avatar: "/placeholder.svg?height=40&width=40&text=LT",
    },
    {
      id: "TRX-005",
      studentName: "Sophia Garcia",
      studentId: "STU12347",
      course: "Intermediate Techniques",
      amount: "$150.00",
      date: "May 15, 2025",
      paymentMethod: "Credit Card",
      status: "Completed",
      createdBy: "Online",
      avatar: "/placeholder.svg?height=40&width=40&text=SG",
    },
    {
      id: "TRX-006",
      studentName: "Jackson Brown",
      studentId: "STU12355",
      course: "Water Safety",
      amount: "$80.00",
      date: "May 15, 2025",
      paymentMethod: "Cash",
      status: "Completed",
      createdBy: "Emma Rodriguez",
      avatar: "/placeholder.svg?height=40&width=40&text=JB",
    },
    {
      id: "TRX-007",
      studentName: "Ava Davis",
      studentId: "STU12357",
      course: "Advanced Performance",
      amount: "$200.00",
      date: "May 12, 2025",
      paymentMethod: "Credit Card",
      status: "Failed",
      createdBy: "Online",
      avatar: "/placeholder.svg?height=40&width=40&text=AD",
    },
    {
      id: "TRX-008",
      studentName: "Lucas Miller",
      studentId: "STU12360",
      course: "Beginner Swimming",
      amount: "$120.00",
      date: "May 10, 2025",
      paymentMethod: "Bank Transfer",
      status: "Refunded",
      createdBy: "Admin",
      avatar: "/placeholder.svg?height=40&width=40&text=LM",
    },
  ];

  // Get unique courses for filter
  const courses = Array.from(new Set(transactions.map((t) => t.course)));

  // Calculate totals
  const totalTransactions = transactions.length;
  const totalCompleted = transactions.filter(
    (t) => t.status === "Completed"
  ).length;
  const totalAmount = transactions.reduce((sum, t) => {
    if (t.status === "Completed") {
      return sum + parseFloat(t.amount.replace("$", ""));
    }
    return sum;
  }, 0);
  const totalPending = transactions.filter(
    (t) => t.status === "Pending"
  ).length;

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter((transaction) => {
    // Filter by status
    const statusMatch =
      statusFilter === "all" ||
      transaction.status.toLowerCase() === statusFilter.toLowerCase();

    // Filter by course
    const courseMatch =
      courseFilter === "all" || transaction.course === courseFilter;

    // Filter by date (if a date is selected)
    const dateMatch =
      !dateFilter || transaction.date === format(dateFilter, "MMM d, yyyy");

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      transaction.studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && courseMatch && dateMatch && searchMatch;
  });

  return (
    <>
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
          <h1 className='text-3xl font-bold'>Transactions & Payments</h1>
          <p className='text-muted-foreground'>
            Manage all financial transactions at your swimming center
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
          <Link href='/dashboard/manager/transactions/new'>
            <Button>Record Payment</Button>
          </Link>
        </div>
      </div>

      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Completed Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalCompleted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalPending}</div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search by transaction ID, student name, or student ID...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='failed'>Failed</SelectItem>
                  <SelectItem value='refunded'>Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={courseFilter}
                onValueChange={setCourseFilter}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Course' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem
                      key={course}
                      value={course}
                    >
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {dateFilter ? format(dateFilter, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className='font-medium'>
                        {transaction.id}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <img
                            src={transaction.avatar}
                            alt={transaction.studentName}
                            className='h-8 w-8 rounded-full'
                          />
                          <div>
                            <div>{transaction.studentName}</div>
                            <div className='text-xs text-muted-foreground'>
                              {transaction.studentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.course}</TableCell>
                      <TableCell>{transaction.amount}</TableCell>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.paymentMethod}</TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            transaction.status === "Completed"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : transaction.status === "Pending"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : transaction.status === "Failed"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Link
                          href={`/dashboard/manager/transactions/${transaction.id}`}
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                          >
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className='text-center py-8 text-muted-foreground'
                    >
                      No transactions found matching the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
