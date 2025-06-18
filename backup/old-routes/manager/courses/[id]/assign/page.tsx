"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function CourseAssignmentPage({
  params,
}: {
  params: { id: string };
}) {
  const [selectedInstructor, setSelectedInstructor] = useState("");

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
    schedule: [
      { day: "Monday", time: "4:00 PM - 4:45 PM", pool: "Main Pool" },
      { day: "Wednesday", time: "4:00 PM - 4:45 PM", pool: "Main Pool" },
    ],
    students: 42,
  };

  // Currently assigned instructors
  const assignedInstructors = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Lead Instructor",
      specialty: "Beginner Swimming, Water Safety",
      rating: 4.9,
      scheduledSessions: "Monday, Wednesday",
      avatar: "/placeholder.svg?height=40&width=40&text=SJ",
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      role: "Assistant Instructor",
      specialty: "Children's Swimming, Technique Development",
      rating: 4.7,
      scheduledSessions: "Monday, Wednesday",
      avatar: "/placeholder.svg?height=40&width=40&text=ER",
    },
  ];

  // Available instructors for assignment
  const availableInstructors = [
    {
      id: 2,
      name: "Michael Chen",
      specialty: "Competition Swimming, Advanced Techniques",
      rating: 4.8,
      availability: "Monday, Tuesday, Thursday, Friday",
      avatar: "/placeholder.svg?height=40&width=40&text=MC",
    },
    {
      id: 4,
      name: "David Wilson",
      specialty: "Intermediate Techniques, Stroke Refinement",
      rating: 4.6,
      availability: "Monday, Wednesday, Friday",
      avatar: "/placeholder.svg?height=40&width=40&text=DW",
    },
    {
      id: 6,
      name: "James Miller",
      specialty: "Competition Training, Advanced Performance",
      rating: 4.7,
      availability: "Tuesday, Thursday",
      avatar: "/placeholder.svg?height=40&width=40&text=JM",
    },
  ];

  return (
    <DashboardLayout userRole='admin'>
      <div className='mb-6'>
        <Link
          href={`/dashboard/manager/courses/${params.id}`}
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Course
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Instructor Assignment</h1>
          <p className='text-muted-foreground'>
            Manage instructors for {course.title}
          </p>
        </div>
      </div>

      {/* Course Info */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>{course.title}</CardTitle>
          <CardDescription>
            {course.level} • {course.ageGroup} • {course.duration}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Schedule</p>
              <div className='space-y-1'>
                {course.schedule.map((session, index) => (
                  <p
                    key={index}
                    className='text-sm text-muted-foreground'
                  >
                    {session.day}: {session.time} at {session.pool}
                  </p>
                ))}
              </div>
            </div>
            <div className='space-y-1'>
              <p className='text-sm font-medium'>Course Details</p>
              <p className='text-sm text-muted-foreground'>
                Start: {course.startDate}
              </p>
              <p className='text-sm text-muted-foreground'>
                End: {course.endDate}
              </p>
              <p className='text-sm text-muted-foreground'>
                Students: {course.students}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currently Assigned Instructors */}
      <Card className='mt-8'>
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <CardTitle>Assigned Instructors</CardTitle>
            <CardDescription>
              Instructors currently assigned to this course
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200'
          >
            {assignedInstructors.length} Assigned
          </Badge>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Scheduled Sessions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignedInstructors.map((instructor) => (
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
                            {instructor.specialty}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{instructor.role}</TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        <span className='text-amber-500 mr-1'>★</span>
                        {instructor.rating}
                      </div>
                    </TableCell>
                    <TableCell>{instructor.scheduledSessions}</TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-500 hover:text-red-700'
                      >
                        <Trash2 className='h-4 w-4 mr-1' />
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Instructor */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Add Instructor</CardTitle>
          <CardDescription>
            Assign a new instructor to this course
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium'>Select Instructor</p>
            <Select
              value={selectedInstructor}
              onValueChange={setSelectedInstructor}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Choose an instructor' />
              </SelectTrigger>
              <SelectContent>
                {availableInstructors.map((instructor) => (
                  <SelectItem
                    key={instructor.id}
                    value={instructor.id.toString()}
                  >
                    {instructor.name} - {instructor.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedInstructor && (
            <div>
              <Separator className='my-4' />
              <div className='space-y-4'>
                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium'>Instructor Role</p>
                  <Select>
                    <SelectTrigger className='w-full'>
                      <SelectValue placeholder='Select a role' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='lead'>Lead Instructor</SelectItem>
                      <SelectItem value='assistant'>
                        Assistant Instructor
                      </SelectItem>
                      <SelectItem value='substitute'>
                        Substitute Instructor
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex flex-col space-y-1'>
                  <p className='text-sm font-medium'>Sessions</p>
                  <div className='grid grid-cols-2 gap-2'>
                    {course.schedule.map((session, index) => (
                      <div
                        key={index}
                        className='flex items-center space-x-2'
                      >
                        <input
                          type='checkbox'
                          id={`session-${index}`}
                          className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                        />
                        <label
                          htmlFor={`session-${index}`}
                          className='text-sm'
                        >
                          {session.day}: {session.time}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex justify-between'>
          <Button variant='outline'>Cancel</Button>
          <Button>Assign Instructor</Button>
        </CardFooter>
      </Card>

      {/* Available Instructors */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Available Instructors</CardTitle>
          <CardDescription>
            Instructors available for assignment to this course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-md border overflow-hidden'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableInstructors.map((instructor) => (
                  <TableRow key={instructor.id}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <img
                          src={instructor.avatar}
                          alt={instructor.name}
                          className='h-8 w-8 rounded-full'
                        />
                        <div className='font-medium'>{instructor.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{instructor.specialty}</TableCell>
                    <TableCell>
                      <div className='flex items-center'>
                        <span className='text-amber-500 mr-1'>★</span>
                        {instructor.rating}
                      </div>
                    </TableCell>
                    <TableCell>{instructor.availability}</TableCell>
                    <TableCell>
                      <Button
                        variant='outline'
                        size='sm'
                      >
                        <Plus className='h-4 w-4 mr-1' />
                        Quick Assign
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
