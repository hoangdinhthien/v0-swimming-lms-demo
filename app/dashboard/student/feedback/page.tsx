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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, Send, MessageSquare } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout-v2";

export default function FeedbackPage() {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submittedFeedback, setSubmittedFeedback] = useState(false);

  // Mock course data
  const courses = [
    {
      id: 1,
      title: "Beginner Swimming",
      instructor: "Sarah Williams",
      instructorAvatar: "/placeholder.svg?height=40&width=40&text=SW",
      completed: true,
      completionDate: "May 1, 2023",
      feedbackSubmitted: false,
    },
    {
      id: 2,
      title: "Water Safety",
      instructor: "Michael Chen",
      instructorAvatar: "/placeholder.svg?height=40&width=40&text=MC",
      completed: false,
      progress: 80,
      feedbackSubmitted: false,
    },
  ];

  // Mock previous feedback
  const previousFeedback = [
    {
      id: 1,
      course: "Freestyle Techniques",
      instructor: "James Anderson",
      rating: 5,
      comment:
        "Excellent course! James is a fantastic instructor who really helped me improve my freestyle technique.",
      date: "March 15, 2023",
    },
    {
      id: 2,
      course: "Water Confidence",
      instructor: "Emma Rodriguez",
      rating: 4,
      comment:
        "Great course for beginners. Emma was patient and encouraging. The only improvement could be more one-on-one time.",
      date: "January 10, 2023",
    },
  ];

  const handleSubmitFeedback = () => {
    // In a real app, this would send the feedback to the server
    setSubmittedFeedback(true);
  };

  return (
    <DashboardLayout userRole='student'>
      <div className='mb-6'>
        <Link
          href='/dashboard/student'
          className='inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground'
        >
          <ArrowLeft className='mr-1 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>

      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Course Feedback</h1>
          <p className='text-muted-foreground'>
            Share your experience and help us improve
          </p>
        </div>
      </div>

      <Tabs
        defaultValue='give-feedback'
        className='mt-8'
      >
        <TabsList className='grid w-full grid-cols-2'>
          {" "}
          <TabsTrigger value='give-feedback'>Gửi Phản Hồi</TabsTrigger>
          <TabsTrigger value='previous-feedback'>
            Phản Hồi Trước Đây
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value='give-feedback'
          className='space-y-6 mt-6'
        >
          <h2 className='text-xl font-bold'>Khóa Học Có Thể Gửi Phản Hồi</h2>
          <div className='space-y-4'>
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className='flex justify-between items-center'>
                    <CardTitle>{course.title}</CardTitle>
                    {course.completed ? (
                      <span className='text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full'>
                        Hoàn thành
                      </span>
                    ) : (
                      <span className='text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full'>
                        Đang học
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    Instructor: {course.instructor}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center gap-3 mb-4'>
                    <Avatar className='h-10 w-10'>
                      <AvatarImage
                        src={course.instructorAvatar || "/placeholder.svg"}
                        alt={course.instructor}
                      />
                      <AvatarFallback>
                        {course.instructor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>{course.instructor}</p>
                      <p className='text-sm text-muted-foreground'>
                        {course.completed
                          ? `Completed on ${course.completionDate}`
                          : `In Progress (${course.progress}%)`}
                      </p>
                    </div>
                  </div>

                  {course.completed &&
                    !course.feedbackSubmitted &&
                    !submittedFeedback && (
                      <div className='space-y-4'>
                        <div className='space-y-2'>
                          <p className='font-medium'>Rate your experience:</p>
                          <div className='flex gap-1'>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type='button'
                                onClick={() => setRating(star)}
                                className='focus:outline-none'
                              >
                                <Star
                                  className={`h-8 w-8 ${
                                    rating && star <= rating
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <p className='font-medium'>Your feedback:</p>
                          <Textarea
                            placeholder='Share your experience with this course and instructor...'
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                          />
                        </div>
                      </div>
                    )}

                  {course.completed && course.feedbackSubmitted && (
                    <div className='bg-muted p-4 rounded-lg'>
                      <p className='text-center text-muted-foreground'>
                        You have already submitted feedback for this course.
                      </p>
                    </div>
                  )}

                  {submittedFeedback && (
                    <div className='bg-green-50 p-4 rounded-lg'>
                      <p className='text-center text-green-700'>
                        Thank you for your feedback! Your input helps us improve
                        our courses.
                      </p>
                    </div>
                  )}

                  {!course.completed && (
                    <div className='bg-muted p-4 rounded-lg'>
                      <p className='text-center text-muted-foreground'>
                        You can provide feedback once you complete this course.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  {course.completed &&
                    !course.feedbackSubmitted &&
                    !submittedFeedback && (
                      <Button
                        onClick={handleSubmitFeedback}
                        disabled={!rating || !feedback}
                      >
                        <Send className='mr-2 h-4 w-4' />
                        Submit Feedback
                      </Button>
                    )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent
          value='previous-feedback'
          className='space-y-6 mt-6'
        >
          <h2 className='text-xl font-bold'>Your Previous Feedback</h2>
          {previousFeedback.length > 0 ? (
            <div className='space-y-4'>
              {previousFeedback.map((feedback) => (
                <Card key={feedback.id}>
                  <CardHeader>
                    <CardTitle>{feedback.course}</CardTitle>
                    <CardDescription>
                      Instructor: {feedback.instructor}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center gap-1'>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= feedback.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                        <span className='ml-2 text-sm text-muted-foreground'>
                          {feedback.rating}/5
                        </span>
                      </div>
                      <div className='bg-muted p-4 rounded-lg'>
                        <div className='flex items-start gap-2'>
                          <MessageSquare className='h-5 w-5 text-muted-foreground mt-0.5' />
                          <p className='text-sm'>{feedback.comment}</p>
                        </div>
                      </div>
                      <p className='text-xs text-muted-foreground'>
                        Submitted on {feedback.date}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-10'>
                <MessageSquare className='h-12 w-12 text-muted-foreground mb-4' />
                <p className='text-lg font-medium'>No Previous Feedback</p>
                <p className='text-muted-foreground'>
                  You haven't submitted any feedback yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
