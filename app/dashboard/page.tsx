"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Waves, User, LogOut, BookOpen, Calendar, Award, Clock, CheckCircle2 } from "lucide-react"

export default function DashboardPage() {
  const [progress, setProgress] = useState({
    "Beginner Swimming": 45,
    "Water Safety": 80,
  })

  // Mock user data
  const user = {
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "Student",
    enrolledCourses: [
      {
        id: 1,
        title: "Beginner Swimming",
        progress: progress["Beginner Swimming"],
        nextLesson: "Tomorrow, 4:00 PM",
        instructor: "Sarah Williams",
      },
      {
        id: 2,
        title: "Water Safety",
        progress: progress["Water Safety"],
        nextLesson: "Friday, 5:30 PM",
        instructor: "Michael Chen",
      },
    ],
    completedModules: ["Water Comfort and Safety", "Floating and Gliding", "Basic Kicking Techniques"],
    upcomingLessons: [
      {
        id: 1,
        title: "Arm Movements for Freestyle",
        date: "May 7, 2023",
        time: "4:00 PM - 4:45 PM",
        instructor: "Sarah Williams",
        course: "Beginner Swimming",
      },
      {
        id: 2,
        title: "Rescue Techniques",
        date: "May 10, 2023",
        time: "5:30 PM - 6:15 PM",
        instructor: "Michael Chen",
        course: "Water Safety",
      },
      {
        id: 3,
        title: "Breathing Techniques",
        date: "May 14, 2023",
        time: "4:00 PM - 4:45 PM",
        instructor: "Sarah Williams",
        course: "Beginner Swimming",
      },
    ],
    achievements: [
      {
        id: 1,
        title: "First Dive",
        description: "Successfully completed your first dive",
        date: "April 15, 2023",
      },
      {
        id: 2,
        title: "25m Freestyle",
        description: "Swam 25 meters using freestyle technique",
        date: "April 22, 2023",
      },
      {
        id: 3,
        title: "Water Safety Basics",
        description: "Completed the water safety basics module",
        date: "April 29, 2023",
      },
    ],
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Waves className="h-6 w-6 text-sky-500" />
            <span>AquaLearn</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/dashboard" className="text-sm font-medium text-sky-600 dark:text-sky-400">
              Dashboard
            </Link>
            <Link href="/courses" className="text-sm font-medium">
              Courses
            </Link>
            <Link href="/calendar" className="text-sm font-medium">
              Calendar
            </Link>
            <Link href="/achievements" className="text-sm font-medium">
              Achievements
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden md:inline-block">{user.name}</span>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Student Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user.name}!</p>
            </div>
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Browse More Courses
            </Button>
          </div>

          <div className="grid gap-6 mt-8 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.enrolledCourses.length}</div>
                <p className="text-xs text-muted-foreground">Active courses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Lessons</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.upcomingLessons.length}</div>
                <p className="text-xs text-muted-foreground">Scheduled sessions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.achievements.length}</div>
                <p className="text-xs text-muted-foreground">Earned badges</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="progress" className="mt-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="progress">My Progress</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>
            <TabsContent value="progress" className="space-y-6 mt-6">
              <h2 className="text-xl font-bold">Course Progress</h2>
              {user.enrolledCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>Instructor: {course.instructor}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Completed Modules</h4>
                      <ul className="space-y-1">
                        {user.completedModules.map((module, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {module}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Next Lesson:</span> {course.nextLesson}
                    </div>
                    <Button variant="outline" size="sm">
                      View Course
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="schedule" className="space-y-6 mt-6">
              <h2 className="text-xl font-bold">Upcoming Lessons</h2>
              <div className="space-y-4">
                {user.upcomingLessons.map((lesson) => (
                  <Card key={lesson.id}>
                    <CardHeader>
                      <CardTitle>{lesson.title}</CardTitle>
                      <CardDescription>{lesson.course}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 md:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lesson.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{lesson.time}</span>
                        </div>
                        <div className="flex items-center gap-2 md:col-span-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Instructor: {lesson.instructor}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" size="sm">
                        Add to Calendar
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="achievements" className="space-y-6 mt-6">
              <h2 className="text-xl font-bold">Your Achievements</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {user.achievements.map((achievement) => (
                  <Card key={achievement.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-center mb-2">
                        <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center">
                          <Award className="h-8 w-8 text-sky-600" />
                        </div>
                      </div>
                      <CardTitle className="text-center">{achievement.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-center text-muted-foreground">{achievement.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-center pt-0">
                      <p className="text-xs text-muted-foreground">Earned on {achievement.date}</p>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="resources" className="space-y-6 mt-6">
              <h2 className="text-xl font-bold">Learning Resources</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Swimming Technique Videos</CardTitle>
                    <CardDescription>Watch instructional videos to improve your technique</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Freestyle Breathing Technique
                        </Link>
                      </li>
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Proper Breaststroke Form
                        </Link>
                      </li>
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Backstroke Arm Movement
                        </Link>
                      </li>
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Butterfly Kick Tutorial
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">
                      View All Videos
                    </Button>
                  </CardFooter>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Swimming Drills</CardTitle>
                    <CardDescription>Practice exercises to enhance your swimming skills</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Kick Board Drills for Beginners
                        </Link>
                      </li>
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Pull Buoy Exercises
                        </Link>
                      </li>
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Breathing Control Drills
                        </Link>
                      </li>
                      <li className="text-sm">
                        <Link href="#" className="text-sky-600 hover:underline">
                          Endurance Training Sets
                        </Link>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">
                      View All Drills
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-24">
          <div className="flex items-center gap-2 font-semibold">
            <Waves className="h-5 w-5 text-sky-500" />
            <span>AquaLearn</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AquaLearn Swimming Center. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm text-muted-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:underline">
              Privacy
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
