"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Filter, FileText } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function StudentsPage() {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock student data
  const students = [
    {
      id: 1,
      name: "Emma Wilson",
      email: "emma.w@example.com",
      phone: "(555) 123-4567",
      age: 12,
      enrolledCourses: ["Beginner Swimming", "Water Safety"],
      instructors: ["Sarah Johnson"],
      status: "Active",
      joinDate: "Jan 15, 2025",
      lastAttendance: "May 22, 2025",
      payments: "Current",
      avatar: "/placeholder.svg?height=40&width=40&text=EW",
    },
    {
      id: 2,
      name: "Noah Martinez",
      email: "noah.m@example.com",
      phone: "(555) 234-5678",
      age: 8,
      enrolledCourses: ["Beginner Swimming"],
      instructors: ["Michael Chen"],
      status: "Active",
      joinDate: "Feb 3, 2025",
      lastAttendance: "May 21, 2025",
      payments: "Current",
      avatar: "/placeholder.svg?height=40&width=40&text=NM",
    },
    {
      id: 3,
      name: "Olivia Johnson",
      email: "olivia.j@example.com",
      phone: "(555) 345-6789",
      age: 15,
      enrolledCourses: ["Intermediate Techniques", "Advanced Performance"],
      instructors: ["Emma Rodriguez", "Michael Chen"],
      status: "Active",
      joinDate: "Nov 10, 2024",
      lastAttendance: "May 23, 2025",
      payments: "Current",
      avatar: "/placeholder.svg?height=40&width=40&text=OJ",
    },
    {
      id: 4,
      name: "Liam Thompson",
      email: "liam.t@example.com",
      phone: "(555) 456-7890",
      age: 10,
      enrolledCourses: ["Beginner Swimming"],
      instructors: ["Sarah Johnson"],
      status: "Inactive",
      joinDate: "Mar 22, 2025",
      lastAttendance: "May 1, 2025",
      payments: "Overdue",
      avatar: "/placeholder.svg?height=40&width=40&text=LT",
    },
    {
      id: 5,
      name: "Sophia Garcia",
      email: "sophia.g@example.com",
      phone: "(555) 567-8901",
      age: 13,
      enrolledCourses: ["Intermediate Techniques"],
      instructors: ["Emma Rodriguez"],
      status: "Active",
      joinDate: "Dec 5, 2024",
      lastAttendance: "May 20, 2025",
      payments: "Current",
      avatar: "/placeholder.svg?height=40&width=40&text=SG",
    },
    {
      id: 6,
      name: "Jackson Brown",
      email: "jackson.b@example.com",
      phone: "(555) 678-9012",
      age: 9,
      enrolledCourses: ["Beginner Swimming", "Water Safety"],
      instructors: ["Sarah Johnson"],
      status: "Active",
      joinDate: "Apr 17, 2025",
      lastAttendance: "May 22, 2025",
      payments: "Current",
      avatar: "/placeholder.svg?height=40&width=40&text=JB",
    },
    {
      id: 7,
      name: "Ava Davis",
      email: "ava.d@example.com",
      phone: "(555) 789-0123",
      age: 16,
      enrolledCourses: ["Advanced Performance"],
      instructors: ["Michael Chen"],
      status: "Active",
      joinDate: "Oct 30, 2024",
      lastAttendance: "May 21, 2025",
      payments: "Current",
      avatar: "/placeholder.svg?height=40&width=40&text=AD",
    },
    {
      id: 8,
      name: "Lucas Miller",
      email: "lucas.m@example.com",
      phone: "(555) 890-1234",
      age: 7,
      enrolledCourses: ["Beginner Swimming"],
      instructors: ["Emma Rodriguez"],
      status: "On Hold",
      joinDate: "Jan 25, 2025",
      lastAttendance: "Apr 15, 2025",
      payments: "Overdue",
      avatar: "/placeholder.svg?height=40&width=40&text=LM",
    },
  ];

  // Filter and search students
  const filteredStudents = students.filter((student) => {
    // Filter by status
    const statusMatch =
      filter === "all" || student.status.toLowerCase() === filter.toLowerCase();

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.phone.includes(searchQuery);

    return statusMatch && searchMatch;
  });

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
          <h1 className='text-3xl font-bold'>Student Management</h1>
          <p className='text-muted-foreground'>
            Manage all students registered at your swimming center
          </p>
        </div>
        <div className='flex gap-2'>
          <Link href='/dashboard/manager/students/import'>
            <Button variant='outline'>
              <FileText className='mr-2 h-4 w-4' />
              Import
            </Button>
          </Link>
          <Link href='/dashboard/manager/students/new'>
            <Button>
              <Plus className='mr-2 h-4 w-4' />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Students</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search students by name, email or phone...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='w-full md:w-[180px]'>
              <Select
                value={filter}
                onValueChange={setFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Students</SelectItem>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='inactive'>Inactive</SelectItem>
                  <SelectItem value='on hold'>On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Enrolled Courses</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payments</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className='h-8 w-8 rounded-full'
                          />
                          <div>
                            <div className='font-medium'>{student.name}</div>
                            <div className='text-xs text-muted-foreground'>
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{student.age}</TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          {student.enrolledCourses.map((course, index) => (
                            <div
                              key={index}
                              className='text-sm'
                            >
                              {course}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            student.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : student.status === "Inactive"
                              ? "bg-gray-50 text-gray-700 border-gray-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            student.payments === "Current"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {student.payments}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Link
                          href={`/dashboard/manager/students/${student.id}`}
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                          >
                            View
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/manager/students/${student.id}/edit`}
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                          >
                            Edit
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center py-8 text-muted-foreground'
                    >
                      No students found matching the current filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
