"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Check, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function CourseRegistrationsPage({
  params,
}: {
  params: { id: string };
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock course data
  const course = {
    id: Number(params.id),
    title: "Beginner Swimming",
    description:
      "A foundational course for beginners to learn basic swimming techniques and water safety.",
    level: "Beginner",
    ageGroup: "5+ years",
    sessions: "2 sessions per week, 45 minutes each",
    duration: "8 weeks",
    price: "$120",
    startDate: "June 1, 2025",
    endDate: "July 24, 2025",
  };

  // Mock student registration data
  const registrations = [
    {
      id: 1,
      studentName: "Emma Wilson",
      studentId: "STU12345",
      age: 12,
      registeredDate: "May 15, 2025",
      paymentStatus: "Paid",
      attendanceRate: "100%",
      email: "emma.w@example.com",
      phone: "(555) 123-4567",
      avatar: "/placeholder.svg?height=40&width=40&text=EW",
    },
    {
      id: 2,
      studentName: "Noah Martinez",
      studentId: "STU12346",
      age: 8,
      registeredDate: "May 16, 2025",
      paymentStatus: "Paid",
      attendanceRate: "75%",
      email: "noah.m@example.com",
      phone: "(555) 234-5678",
      avatar: "/placeholder.svg?height=40&width=40&text=NM",
    },
    {
      id: 3,
      studentName: "Liam Thompson",
      studentId: "STU12350",
      age: 10,
      registeredDate: "May 18, 2025",
      paymentStatus: "Pending",
      attendanceRate: "0%",
      email: "liam.t@example.com",
      phone: "(555) 456-7890",
      avatar: "/placeholder.svg?height=40&width=40&text=LT",
    },
    {
      id: 4,
      studentName: "Jackson Brown",
      studentId: "STU12355",
      age: 9,
      registeredDate: "May 20, 2025",
      paymentStatus: "Paid",
      attendanceRate: "100%",
      email: "jackson.b@example.com",
      phone: "(555) 678-9012",
      avatar: "/placeholder.svg?height=40&width=40&text=JB",
    },
    {
      id: 5,
      studentName: "Lucas Miller",
      studentId: "STU12360",
      age: 7,
      registeredDate: "May 21, 2025",
      paymentStatus: "Pending",
      attendanceRate: "0%",
      email: "lucas.m@example.com",
      phone: "(555) 890-1234",
      avatar: "/placeholder.svg?height=40&width=40&text=LM",
    },
  ];

  // Mock waitlist data
  const waitlist = [
    {
      id: 1,
      studentName: "Sophia Garcia",
      studentId: "STU12347",
      age: 13,
      waitlistDate: "May 19, 2025",
      email: "sophia.g@example.com",
      phone: "(555) 567-8901",
      avatar: "/placeholder.svg?height=40&width=40&text=SG",
    },
    {
      id: 2,
      studentName: "Ava Davis",
      studentId: "STU12357",
      age: 16,
      waitlistDate: "May 22, 2025",
      email: "ava.d@example.com",
      phone: "(555) 789-0123",
      avatar: "/placeholder.svg?height=40&width=40&text=AD",
    },
  ];

  // Filter students based on search query
  const filteredRegistrations = registrations.filter(
    (registration) =>
      registration.studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      registration.studentId
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      registration.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter waitlist based on search query
  const filteredWaitlist = waitlist.filter(
    (waitlistItem) =>
      waitlistItem.studentName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      waitlistItem.studentId
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      waitlistItem.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout userRole='admin'>
      <div className='mb-6'>
        <Link
          href='/dashboard/manager/courses'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Courses
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>{course.title}</h1>
          <div className='flex items-center gap-2 text-muted-foreground'>
            <Badge variant='outline'>{course.level}</Badge>
            <span>•</span>
            <span>{course.ageGroup}</span>
            <span>•</span>
            <span>{course.duration}</span>
          </div>
        </div>
        <div className='flex gap-2'>
          <Link href={`/dashboard/manager/courses/${params.id}/attendance`}>
            <Button variant='outline'>
              <Check className='mr-2 h-4 w-4' />
              Attendance
            </Button>
          </Link>
          <Link href={`/dashboard/manager/courses/${params.id}/edit`}>
            <Button>Edit Course</Button>
          </Link>
        </div>
      </div>

      <div className='mt-8 grid gap-6 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>{registrations.length}</CardTitle>
            <CardDescription>Registered Students</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>{waitlist.length}</CardTitle>
            <CardDescription>Waitlisted Students</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-2xl'>
              {registrations.reduce(
                (total, reg) =>
                  reg.paymentStatus === "Paid" ? total + 1 : total,
                0
              )}{" "}
              / {registrations.length}
            </CardTitle>
            <CardDescription>Payments Received</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className='mt-8'>
        <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
          <div className='flex-1 relative'>
            <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search students by name, ID or email...'
              className='pl-8'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link href={`/dashboard/manager/courses/${params.id}/add-student`}>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Add Student
            </Button>
          </Link>
        </div>

        <Tabs defaultValue='registered'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='registered'>
              Registered ({registrations.length})
            </TabsTrigger>
            <TabsTrigger value='waitlist'>
              Waitlist ({waitlist.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value='registered'
            className='mt-4'
          >
            <Card>
              <CardContent className='p-0'>
                <div className='rounded-md overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Registered Date</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.length > 0 ? (
                        filteredRegistrations.map((registration) => (
                          <TableRow key={registration.id}>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <img
                                  src={registration.avatar}
                                  alt={registration.studentName}
                                  className='h-8 w-8 rounded-full'
                                />
                                <div>
                                  <div className='font-medium'>
                                    {registration.studentName}
                                  </div>
                                  <div className='text-xs text-muted-foreground'>
                                    {registration.studentId}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{registration.age}</TableCell>
                            <TableCell>{registration.registeredDate}</TableCell>
                            <TableCell>
                              <Badge
                                variant='outline'
                                className={
                                  registration.paymentStatus === "Paid"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }
                              >
                                {registration.paymentStatus}
                              </Badge>
                            </TableCell>
                            <TableCell>{registration.attendanceRate}</TableCell>
                            <TableCell className='text-right'>
                              <Link
                                href={`/dashboard/manager/students/${registration.id}`}
                              >
                                <Button
                                  variant='ghost'
                                  size='sm'
                                >
                                  View
                                </Button>
                              </Link>
                              <Button
                                variant='ghost'
                                size='sm'
                                className='text-red-500 hover:text-red-700'
                              >
                                <X className='h-4 w-4 mr-1' />
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className='text-center py-8 text-muted-foreground'
                          >
                            No registered students found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value='waitlist'
            className='mt-4'
          >
            <Card>
              <CardContent className='p-0'>
                <div className='rounded-md overflow-hidden'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Waitlist Date</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWaitlist.length > 0 ? (
                        filteredWaitlist.map((waitlistItem) => (
                          <TableRow key={waitlistItem.id}>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <img
                                  src={waitlistItem.avatar}
                                  alt={waitlistItem.studentName}
                                  className='h-8 w-8 rounded-full'
                                />
                                <div>
                                  <div className='font-medium'>
                                    {waitlistItem.studentName}
                                  </div>
                                  <div className='text-xs text-muted-foreground'>
                                    {waitlistItem.studentId}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{waitlistItem.age}</TableCell>
                            <TableCell>{waitlistItem.waitlistDate}</TableCell>
                            <TableCell className='text-right'>
                              <Link
                                href={`/dashboard/manager/students/${waitlistItem.id}`}
                              >
                                <Button
                                  variant='ghost'
                                  size='sm'
                                >
                                  View
                                </Button>
                              </Link>
                              <Button
                                variant='outline'
                                size='sm'
                                className='ml-2'
                              >
                                <Check className='h-4 w-4 mr-1' />
                                Enroll
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className='text-center py-8 text-muted-foreground'
                          >
                            No waitlisted students found matching your search.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className='mt-6 flex justify-end'>
        <Button variant='outline'>
          <Download className='mr-2 h-4 w-4' />
          Export Student List
        </Button>
      </div>
    </DashboardLayout>
  );
}
