import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Waves, Search } from "lucide-react"

export default function CoursesPage() {
  // Sample course data
  const courses = [
    {
      id: 1,
      title: "Beginner Swimming",
      description: "Perfect for those new to swimming. Learn water safety and basic strokes.",
      level: "Beginner",
      age: "5+ years",
      duration: "8 weeks",
      instructor: "Sarah Johnson",
      price: "$120",
    },
    {
      id: 2,
      title: "Intermediate Techniques",
      description: "Refine your strokes and build endurance for confident swimming.",
      level: "Intermediate",
      age: "8+ years",
      duration: "10 weeks",
      instructor: "Michael Chen",
      price: "$150",
    },
    {
      id: 3,
      title: "Advanced Performance",
      description: "Master competitive techniques and advanced swimming skills.",
      level: "Advanced",
      age: "12+ years",
      duration: "12 weeks",
      instructor: "Emma Rodriguez",
      price: "$180",
    },
    {
      id: 4,
      title: "Parent & Child Swimming",
      description: "Bond with your child while teaching them essential water skills.",
      level: "Beginner",
      age: "6 months - 3 years",
      duration: "6 weeks",
      instructor: "David Wilson",
      price: "$100",
    },
    {
      id: 5,
      title: "Adult Learn to Swim",
      description: "It's never too late to learn! Designed specifically for adult beginners.",
      level: "Beginner",
      age: "16+ years",
      duration: "8 weeks",
      instructor: "Lisa Thompson",
      price: "$140",
    },
    {
      id: 6,
      title: "Competitive Stroke Refinement",
      description: "Perfect your technique for competitive swimming events.",
      level: "Advanced",
      age: "14+ years",
      duration: "10 weeks",
      instructor: "James Anderson",
      price: "$200",
    },
  ]

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
            <Link href="/" className="text-sm font-medium">
              Home
            </Link>
            <Link href="/courses" className="text-sm font-medium text-sky-600 dark:text-sky-400">
              Courses
            </Link>
            <Link href="/instructors" className="text-sm font-medium">
              Instructors
            </Link>
            <Link href="/about" className="text-sm font-medium">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-8 md:py-12">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Swimming Courses</h1>
            <p className="text-muted-foreground">
              Browse our comprehensive selection of swimming courses for all ages and skill levels.
            </p>
          </div>

          {/* Filters */}
          <div className="my-8 grid gap-4 md:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search courses..." className="w-full pl-8" />
            </div>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Skill Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                <SelectItem value="toddler">Toddler (0-3)</SelectItem>
                <SelectItem value="children">Children (4-12)</SelectItem>
                <SelectItem value="teen">Teen (13-17)</SelectItem>
                <SelectItem value="adult">Adult (18+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Course Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={`/placeholder.svg?height=200&width=400&text=${course.title}`}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Level:</span> {course.level}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Age:</span> {course.age}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Duration:</span> {course.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Price:</span> {course.price}
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                      <span className="font-medium">Instructor:</span> {course.instructor}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/courses/${course.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Details
                    </Button>
                  </Link>
                  <Link href={`/courses/${course.id}/enroll`} className="flex-1">
                    <Button className="w-full">Enroll</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
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
