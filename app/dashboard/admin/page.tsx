"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Waves,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  PlusCircle,
  Settings,
  FileText,
  Droplets,
  Wrench,
} from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"

export default function AdminDashboardPage() {
  // Mock admin data
  const admin = {
    name: "Admin User",
    email: "admin@example.com",
    role: "Administrator",
    centerStats: {
      totalStudents: 156,
      activeInstructors: 8,
      activeCourses: 12,
      totalRevenue: "$15,240",
      poolUtilization: "78%",
    },
    courses: [
      {
        id: 1,
        title: "Beginner Swimming",
        students: 42,
        instructors: 3,
        revenue: "$5,040",
        status: "Active",
      },
      {
        id: 2,
        title: "Intermediate Techniques",
        students: 28,
        instructors: 2,
        revenue: "$4,200",
        status: "Active",
      },
      {
        id: 3,
        title: "Advanced Performance",
        students: 15,
        instructors: 1,
        revenue: "$3,000",
        status: "Active",
      },
      {
        id: 4,
        title: "Water Safety",
        students: 35,
        instructors: 2,
        revenue: "$2,800",
        status: "Active",
      },
    ],
    instructors: [
      {
        id: 1,
        name: "Sarah Johnson",
        specialty: "Beginner Swimming, Water Safety",
        students: 32,
        classes: 3,
        rating: 4.9,
        avatar: "/placeholder.svg?height=40&width=40&text=SJ",
      },
      {
        id: 2,
        name: "Michael Chen",
        specialty: "Competitive Swimming, Advanced Techniques",
        students: 18,
        classes: 2,
        rating: 4.8,
        avatar: "/placeholder.svg?height=40&width=40&text=MC",
      },
      {
        id: 3,
        name: "Emma Rodriguez",
        specialty: "Youth Swimming, Stroke Development",
        students: 25,
        classes: 2,
        rating: 4.7,
        avatar: "/placeholder.svg?height=40&width=40&text=ER",
      },
    ],
    pools: [
      {
        id: 1,
        name: "Main Pool",
        status: "Operational",
        temperature: "78°F",
        lastMaintenance: "April 30, 2023",
        nextMaintenance: "May 15, 2023",
        lanes: 6,
        currentClasses: 2,
      },
      {
        id: 2,
        name: "Training Pool",
        status: "Operational",
        temperature: "80°F",
        lastMaintenance: "May 2, 2023",
        nextMaintenance: "May 17, 2023",
        lanes: 4,
        currentClasses: 1,
      },
      {
        id: 3,
        name: "Shallow Pool",
        status: "Maintenance Scheduled",
        temperature: "82°F",
        lastMaintenance: "April 25, 2023",
        nextMaintenance: "May 10, 2023",
        lanes: 0,
        currentClasses: 1,
      },
    ],
    recentPayments: [
      {
        id: 1,
        student: "Alex Johnson",
        course: "Beginner Swimming",
        amount: "$120.00",
        date: "May 5, 2023",
        status: "Completed",
      },
      {
        id: 2,
        student: "Emma Wilson",
        course: "Intermediate Techniques",
        amount: "$150.00",
        date: "May 4, 2023",
        status: "Completed",
      },
      {
        id: 3,
        student: "Michael Brown",
        course: "Water Safety",
        amount: "$80.00",
        date: "May 3, 2023",
        status: "Completed",
      },
    ],
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {admin.name}!</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/admin/reports">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Reports
            </Button>
          </Link>
          <Link href="/dashboard/admin/settings">
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 mt-8 md:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.centerStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Instructors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.centerStats.activeInstructors}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.centerStats.activeCourses}</div>
            <p className="text-xs text-muted-foreground">Running courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.centerStats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pool Utilization</CardTitle>
            <Waves className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admin.centerStats.poolUtilization}</div>
            <p className="text-xs text-muted-foreground">Average usage</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="mt-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="instructors">Instructors</TabsTrigger>
          <TabsTrigger value="pools">Pool Management</TabsTrigger>
          <TabsTrigger value="finances">Finances</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Course Management</h2>
            <Link href="/dashboard/admin/courses/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Course
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium text-sm">Course</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Students</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Instructors</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Revenue</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Status</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.courses.map((course) => (
                      <tr key={course.id} className="border-b">
                        <td className="py-3 px-4 font-medium">{course.title}</td>
                        <td className="py-3 px-4">{course.students}</td>
                        <td className="py-3 px-4">{course.instructors}</td>
                        <td className="py-3 px-4">{course.revenue}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {course.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/admin/courses/${course.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href={`/dashboard/admin/courses/${course.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="instructors" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Instructor Management</h2>
            <Link href="/dashboard/admin/instructors/new">
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Instructor
              </Button>
            </Link>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="py-3 px-4 text-left font-medium text-sm">Instructor</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Specialty</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Students</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Classes</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Rating</th>
                      <th className="py-3 px-4 text-left font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admin.instructors.map((instructor) => (
                      <tr key={instructor.id} className="border-b">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={instructor.avatar || "/placeholder.svg"} alt={instructor.name} />
                              <AvatarFallback>
                                {instructor.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{instructor.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{instructor.specialty}</td>
                        <td className="py-3 px-4">{instructor.students}</td>
                        <td className="py-3 px-4">{instructor.classes}</td>
                        <td className="py-3 px-4">{instructor.rating}/5.0</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Link href={`/dashboard/admin/instructors/${instructor.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            <Link href={`/dashboard/admin/instructors/${instructor.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pools" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Pool Management</h2>
            <div className="flex gap-2">
              <Link href="/dashboard/admin/pools/maintenance">
                <Button variant="outline">
                  <Wrench className="mr-2 h-4 w-4" />
                  Schedule Maintenance
                </Button>
              </Link>
              <Link href="/dashboard/admin/pools/new">
                <Button>
                  <Droplets className="mr-2 h-4 w-4" />
                  Add New Pool
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {admin.pools.map((pool) => (
              <Card key={pool.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>{pool.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={
                        pool.status === "Operational"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }
                    >
                      {pool.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    {pool.lanes} lanes | Temperature: {pool.temperature}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Classes:</span>
                      <span>{pool.currentClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last Maintenance:</span>
                      <span>{pool.lastMaintenance}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Next Maintenance:</span>
                      <span>{pool.nextMaintenance}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/dashboard/admin/pools/${pool.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      View Details
                    </Button>
                  </Link>
                  <Link href={`/dashboard/admin/pools/${pool.id}/schedule`} className="flex-1">
                    <Button className="w-full" size="sm">
                      Manage Schedule
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="finances" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Financial Overview</h2>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Export Report
              </Button>
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="year-to-date">Year to Date</option>
              </select>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Course</CardTitle>
                <CardDescription>Monthly revenue breakdown by course</CardDescription>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-2" />
                  <p>Revenue chart visualization would appear here</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Payments</CardTitle>
                <CardDescription>Latest payment transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admin.recentPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">{payment.student}</p>
                        <p className="text-sm text-muted-foreground">{payment.course}</p>
                        <p className="text-xs text-muted-foreground">{payment.date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{payment.amount}</p>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {payment.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="reports" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Reports & Analytics</h2>
            <div className="flex gap-2">
              <select className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="last-3-months">Last 3 Months</option>
                <option value="year-to-date">Year to Date</option>
              </select>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Student enrollment over time</CardDescription>
              </CardHeader>
              <CardContent className="h-60 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Enrollment chart would appear here</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Course Popularity</CardTitle>
                <CardDescription>Most popular swimming courses</CardDescription>
              </CardHeader>
              <CardContent className="h-60 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Course popularity chart would appear here</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Instructor Performance</CardTitle>
                <CardDescription>Instructor ratings and student count</CardDescription>
              </CardHeader>
              <CardContent className="h-60 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Instructor performance chart would appear here</p>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>Generate and download detailed reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Financial Summary</span>
                    <span className="text-xs text-muted-foreground">Revenue, expenses, and profit</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Attendance Report</span>
                    <span className="text-xs text-muted-foreground">Student attendance by course</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Instructor Performance</span>
                    <span className="text-xs text-muted-foreground">Ratings and student feedback</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Pool Usage Analytics</span>
                    <span className="text-xs text-muted-foreground">Pool utilization and maintenance</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Student Progress</span>
                    <span className="text-xs text-muted-foreground">Learning outcomes and achievements</span>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Course Completion</span>
                    <span className="text-xs text-muted-foreground">Certification and graduation rates</span>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  )
}
