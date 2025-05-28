"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function AttendancePage({ params }: { params: { id: string } }) {
  const [attendance, setAttendance] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: false,
    4: true,
    5: true,
  });

  // Mock class data
  const classData = {
    id: Number(params.id),
    title: "Beginner Swimming - Group A",
    date: "May 7, 2023",
    time: "4:00 PM - 4:45 PM",
    location: "Main Pool - Lane 1-2",
    students: [
      {
        id: 1,
        name: "Alex Johnson",
        age: 8,
        lastAttendance: "100%",
        avatar: "/placeholder.svg?height=40&width=40&text=AJ",
      },
      {
        id: 2,
        name: "Emma Wilson",
        age: 7,
        lastAttendance: "90%",
        avatar: "/placeholder.svg?height=40&width=40&text=EW",
      },
      {
        id: 3,
        name: "Michael Chen",
        age: 9,
        lastAttendance: "80%",
        avatar: "/placeholder.svg?height=40&width=40&text=MC",
      },
      {
        id: 4,
        name: "Sophia Rodriguez",
        age: 8,
        lastAttendance: "95%",
        avatar: "/placeholder.svg?height=40&width=40&text=SR",
      },
      {
        id: 5,
        name: "James Taylor",
        age: 7,
        lastAttendance: "85%",
        avatar: "/placeholder.svg?height=40&width=40&text=JT",
      },
    ],
  };

  const handleAttendanceChange = (studentId: number, isPresent: boolean) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: isPresent,
    }));
  };

  const saveAttendance = () => {
    // In a real app, this would send the data to the server
    alert("Attendance saved successfully!");
  };

  return (
    <DashboardLayout userRole='instructor'>
      <div className='mb-6'>
        <Link
          href='/dashboard/instructor'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Take Attendance</h1>
          <p className='text-muted-foreground'>
            {classData.title} | {classData.date}
          </p>
        </div>
        <Button onClick={saveAttendance}>
          <Save className='mr-2 h-4 w-4' />
          Save Attendance
        </Button>
      </div>

      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>{classData.title}</CardTitle>
          <CardDescription>
            Session: {classData.date} | {classData.time} | {classData.location}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {classData.students.map((student) => (
              <div
                key={student.id}
                className='flex items-center justify-between border-b pb-4'
              >
                <div className='flex items-center gap-3'>
                  <Avatar className='h-10 w-10'>
                    <AvatarImage
                      src={student.avatar || "/placeholder.svg"}
                      alt={student.name}
                    />
                    <AvatarFallback>
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{student.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      Previous attendance: {student.lastAttendance}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <Checkbox
                      id={`attendance-${student.id}`}
                      checked={attendance[student.id]}
                      onCheckedChange={(checked) =>
                        handleAttendanceChange(student.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`attendance-${student.id}`}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                    >
                      Present
                    </label>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                  >
                    <MessageSquare className='h-4 w-4' />
                    <span className='sr-only'>Add Note</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className='flex justify-between'>
          <Button variant='outline'>Cancel</Button>
          <Button onClick={saveAttendance}>Save Attendance</Button>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}
