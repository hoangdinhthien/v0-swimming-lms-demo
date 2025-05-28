"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Filter } from "lucide-react";
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

export default function InstructorsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock instructors data
  const instructors = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah.j@example.com",
      phone: "(555) 123-4567",
      specialty: ["Beginner Swimming", "Water Safety"],
      status: "Active",
      students: 32,
      classes: 3,
      joinDate: "Jan 15, 2024",
      rating: 4.9,
      avatar: "/placeholder.svg?height=40&width=40&text=SJ",
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "michael.c@example.com",
      phone: "(555) 234-5678",
      specialty: ["Competition Swimming", "Advanced Techniques"],
      status: "Active",
      students: 18,
      classes: 2,
      joinDate: "Mar 10, 2024",
      rating: 4.8,
      avatar: "/placeholder.svg?height=40&width=40&text=MC",
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      email: "emma.r@example.com",
      phone: "(555) 345-6789",
      specialty: ["Children's Swimming", "Technique Development"],
      status: "Active",
      students: 25,
      classes: 2,
      joinDate: "Feb 5, 2024",
      rating: 4.7,
      avatar: "/placeholder.svg?height=40&width=40&text=ER",
    },
    {
      id: 4,
      name: "David Wilson",
      email: "david.w@example.com",
      phone: "(555) 456-7890",
      specialty: ["Intermediate Techniques", "Stroke Refinement"],
      status: "Active",
      students: 20,
      classes: 2,
      joinDate: "Apr 20, 2024",
      rating: 4.6,
      avatar: "/placeholder.svg?height=40&width=40&text=DW",
    },
    {
      id: 5,
      name: "Lisa Thompson",
      email: "lisa.t@example.com",
      phone: "(555) 567-8901",
      specialty: ["Water Safety", "Parent & Child Swimming"],
      status: "On Leave",
      students: 22,
      classes: 2,
      joinDate: "Jan 3, 2024",
      rating: 4.5,
      avatar: "/placeholder.svg?height=40&width=40&text=LT",
    },
    {
      id: 6,
      name: "James Miller",
      email: "james.m@example.com",
      phone: "(555) 678-9012",
      specialty: ["Competition Training", "Advanced Performance"],
      status: "Active",
      students: 15,
      classes: 1,
      joinDate: "May 1, 2024",
      rating: 4.7,
      avatar: "/placeholder.svg?height=40&width=40&text=JM",
    },
    {
      id: 7,
      name: "Sophia Davis",
      email: "sophia.d@example.com",
      phone: "(555) 789-0123",
      specialty: ["Adult Learn-to-Swim", "Water Aerobics"],
      status: "Inactive",
      students: 0,
      classes: 0,
      joinDate: "Dec 10, 2023",
      rating: 4.4,
      avatar: "/placeholder.svg?height=40&width=40&text=SD",
    },
  ];

  // Get unique specialties for filter
  const specialties = Array.from(
    new Set(instructors.flatMap((instructor) => instructor.specialty))
  );

  // Filter instructors based on filters and search
  const filteredInstructors = instructors.filter((instructor) => {
    // Filter by status
    const statusMatch =
      statusFilter === "all" || instructor.status === statusFilter;

    // Filter by specialty
    const specialtyMatch =
      specialtyFilter === "all" ||
      instructor.specialty.includes(specialtyFilter);

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      instructor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instructor.phone.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && specialtyMatch && searchMatch;
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
          <h1 className='text-3xl font-bold'>Instructor Management</h1>
          <p className='text-muted-foreground'>
            Manage all instructors at your swimming center
          </p>
        </div>
        <Link href='/dashboard/manager/instructors/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Add Instructor
          </Button>
        </Link>
      </div>

      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Instructors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructors.filter((i) => i.status === "Active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {(
                instructors.reduce(
                  (sum, instructor) => sum + instructor.rating,
                  0
                ) / instructors.length
              ).toFixed(1)}
            </div>
            <p className='text-xs text-amber-500'>★★★★★</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {instructors.reduce(
                (sum, instructor) => sum + instructor.classes,
                0
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Classes per Instructor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round(
                (instructors.reduce(
                  (sum, instructor) => sum + instructor.classes,
                  0
                ) /
                  instructors.filter((i) => i.status === "Active").length) *
                  10
              ) / 10}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Instructors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search instructors by name, email, or phone...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-2 gap-4 w-full md:w-[400px]'>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Filter by status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='Active'>Active</SelectItem>
                  <SelectItem value='On Leave'>On Leave</SelectItem>
                  <SelectItem value='Inactive'>Inactive</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={specialtyFilter}
                onValueChange={setSpecialtyFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Filter by specialty' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Specialties</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem
                      key={specialty}
                      value={specialty}
                    >
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstructors.length > 0 ? (
                  filteredInstructors.map((instructor) => (
                    <TableRow key={instructor.id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <img
                            src={instructor.avatar}
                            alt={instructor.name}
                            className='h-8 w-8 rounded-full'
                          />
                          <div>
                            <div className='font-medium'>{instructor.name}</div>
                            <div className='text-xs text-muted-foreground'>
                              {instructor.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          {instructor.specialty.map((spec, index) => (
                            <div
                              key={index}
                              className='text-sm'
                            >
                              {spec}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{instructor.students}</TableCell>
                      <TableCell>{instructor.classes}</TableCell>
                      <TableCell>
                        <div className='flex items-center'>
                          <span className='text-amber-500 mr-1'>★</span>
                          {instructor.rating}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            instructor.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : instructor.status === "On Leave"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {instructor.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right space-x-2'>
                        <Link
                          href={`/dashboard/manager/instructors/${instructor.id}`}
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                          >
                            View
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/manager/instructors/${instructor.id}/schedule`}
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                          >
                            Schedule
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className='text-center py-8 text-muted-foreground'
                    >
                      No instructors found matching the current filters.
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
