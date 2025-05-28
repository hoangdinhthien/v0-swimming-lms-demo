"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Search, Filter, Calendar } from "lucide-react";
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

export default function CoursesPage() {
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock courses data
  const courses = [
    {
      id: 1,
      title: "Beginner Swimming",
      level: "Beginner",
      ageGroup: "5+ years",
      students: 42,
      instructors: ["Sarah Johnson", "Emma Rodriguez"],
      sessions: "2 sessions per week, 45 minutes each",
      price: "$120",
      status: "Active",
      startDate: "June 1, 2025",
      endDate: "July 24, 2025",
    },
    {
      id: 2,
      title: "Intermediate Techniques",
      level: "Intermediate",
      ageGroup: "8+ years",
      students: 28,
      instructors: ["Michael Chen"],
      sessions: "3 sessions per week, 60 minutes each",
      price: "$150",
      status: "Active",
      startDate: "June 5, 2025",
      endDate: "August 1, 2025",
    },
    {
      id: 3,
      title: "Advanced Performance",
      level: "Advanced",
      ageGroup: "12+ years",
      students: 15,
      instructors: ["Michael Chen"],
      sessions: "4 sessions per week, 90 minutes each",
      price: "$200",
      status: "Active",
      startDate: "June 10, 2025",
      endDate: "August 20, 2025",
    },
    {
      id: 4,
      title: "Water Safety",
      level: "All Levels",
      ageGroup: "All Ages",
      students: 35,
      instructors: ["Sarah Johnson", "Emma Rodriguez"],
      sessions: "1 session per week, 60 minutes each",
      price: "$80",
      status: "Active",
      startDate: "June 3, 2025",
      endDate: "July 22, 2025",
    },
    {
      id: 5,
      title: "Parent & Child Swimming",
      level: "Beginner",
      ageGroup: "1-4 years",
      students: 18,
      instructors: ["Emma Rodriguez"],
      sessions: "1 session per week, 45 minutes each",
      price: "$120",
      status: "Active",
      startDate: "June 7, 2025",
      endDate: "July 26, 2025",
    },
    {
      id: 6,
      title: "Competition Training",
      level: "Advanced",
      ageGroup: "14+ years",
      students: 10,
      instructors: ["Michael Chen"],
      sessions: "5 sessions per week, 120 minutes each",
      price: "$250",
      status: "Upcoming",
      startDate: "July 1, 2025",
      endDate: "September 30, 2025",
    },
    {
      id: 7,
      title: "Adult Learn-to-Swim",
      level: "Beginner",
      ageGroup: "18+ years",
      students: 12,
      instructors: ["Sarah Johnson"],
      sessions: "2 sessions per week, 60 minutes each",
      price: "$180",
      status: "Active",
      startDate: "June 2, 2025",
      endDate: "July 25, 2025",
    },
    {
      id: 8,
      title: "Stroke Refinement",
      level: "Intermediate",
      ageGroup: "10+ years",
      students: 20,
      instructors: ["David Wilson"],
      sessions: "2 sessions per week, 75 minutes each",
      price: "$160",
      status: "Completed",
      startDate: "April 5, 2025",
      endDate: "May 28, 2025",
    },
  ];

  // Filter courses based on filters and search
  const filteredCourses = courses.filter((course) => {
    // Filter by level
    const levelMatch = levelFilter === "all" || course.level === levelFilter;

    // Filter by status
    const statusMatch =
      statusFilter === "all" || course.status === statusFilter;

    // Filter by search query
    const searchMatch =
      searchQuery === "" ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.ageGroup.toLowerCase().includes(searchQuery.toLowerCase());

    return levelMatch && statusMatch && searchMatch;
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
          <h1 className='text-3xl font-bold'>Course Management</h1>
          <p className='text-muted-foreground'>
            Manage all swimming courses at your center
          </p>
        </div>
        <Link href='/dashboard/manager/courses/new'>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Create Course
          </Button>
        </Link>
      </div>

      <div className='mt-8 grid gap-6 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {courses.filter((c) => c.status === "Active").length}
            </div>
            <p className='text-xs text-muted-foreground'>Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {courses.reduce((sum, course) => sum + course.students, 0)}
            </div>
            <p className='text-xs text-muted-foreground'>Students enrolled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Upcoming Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {courses.filter((c) => c.status === "Upcoming").length}
            </div>
            <p className='text-xs text-muted-foreground'>Starting soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Average Course Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {Math.round(
                courses.reduce((sum, course) => sum + course.students, 0) /
                  courses.length
              )}
            </div>
            <p className='text-xs text-muted-foreground'>Students per course</p>
          </CardContent>
        </Card>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-4 md:flex-row md:items-center mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search courses by title, level, or age group...'
                className='pl-8'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-2 gap-4 w-full md:w-[400px]'>
              <Select
                value={levelFilter}
                onValueChange={setLevelFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Filter by level' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Levels</SelectItem>
                  <SelectItem value='Beginner'>Beginner</SelectItem>
                  <SelectItem value='Intermediate'>Intermediate</SelectItem>
                  <SelectItem value='Advanced'>Advanced</SelectItem>
                  <SelectItem value='All Levels'>All Levels</SelectItem>
                </SelectContent>
              </Select>

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
                  <SelectItem value='Upcoming'>Upcoming</SelectItem>
                  <SelectItem value='Completed'>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Instructors</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className='font-medium'>
                        {course.title}
                      </TableCell>
                      <TableCell>{course.level}</TableCell>
                      <TableCell>{course.ageGroup}</TableCell>
                      <TableCell>{course.students}</TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          {course.instructors.map((instructor, index) => (
                            <div
                              key={index}
                              className='text-sm'
                            >
                              {instructor}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={
                            course.status === "Active"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : course.status === "Upcoming"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-700 border-gray-200"
                          }
                        >
                          {course.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right space-x-2'>
                        <Link href={`/dashboard/manager/courses/${course.id}`}>
                          <Button
                            variant='ghost'
                            size='sm'
                          >
                            View
                          </Button>
                        </Link>
                        <Link
                          href={`/dashboard/manager/courses/${course.id}/registrations`}
                        >
                          <Button
                            variant='ghost'
                            size='sm'
                          >
                            Registrations
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
                      No courses found matching the current filters.
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
