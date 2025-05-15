import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Waves, Calendar, Clock, Users, Award, ArrowLeft } from "lucide-react"

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  // This would normally come from a database
  const course = {
    id: Number.parseInt(params.id),
    title: "Beginner Swimming",
    description: "Perfect for those new to swimming. Learn water safety and basic strokes.",
    fullDescription:
      "This comprehensive beginner swimming course is designed for individuals with little to no swimming experience. Our expert instructors will guide you through water safety principles, basic floating techniques, and fundamental swimming strokes. By the end of this course, you'll feel confident and comfortable in the water, with the ability to swim short distances using proper technique.",
    level: "Beginner",
    age: "5+ years",
    duration: "8 weeks",
    sessions: "2 sessions per week, 45 minutes each",
    instructor: "Sarah Johnson",
    price: "$120",
    maxStudents: 8,
    location: "Main Pool - Lane 1-2",
    prerequisites: "None",
    equipment: "Swimsuit, towel, goggles, and swim cap",
    startDate: "June 15, 2023",
    modules: [
      {
        title: "Water Comfort and Safety",
        description: "Learn to be comfortable in the water and understand basic water safety rules.",
        lessons: ["Pool rules and safety", "Water entry and exit", "Face submersion", "Breath control"],
      },
      {
        title: "Floating and Gliding",
        description: "Master the fundamental skills of floating and gliding in the water.",
        lessons: ["Front float", "Back float", "Front glide", "Back glide", "Streamline position"],
      },
      {
        title: "Kicking Techniques",
        description: "Develop effective kicking techniques for different swimming strokes.",
        lessons: ["Flutter kick", "Whip kick", "Dolphin kick", "Vertical kicking"],
      },
      {
        title: "Arm Movements",
        description: "Learn proper arm movements for basic swimming strokes.",
        lessons: ["Front crawl arms", "Backstroke arms", "Breaststroke arms", "Arm and kick coordination"],
      },
      {
        title: "Breathing Techniques",
        description: "Master proper breathing techniques for swimming.",
        lessons: ["Side breathing", "Rhythmic breathing", "Bilateral breathing"],
      },
      {
        title: "Basic Strokes",
        description: "Put everything together to perform basic swimming strokes.",
        lessons: ["Front crawl (freestyle)", "Backstroke", "Elementary backstroke", "Beginning breaststroke"],
      },
      {
        title: "Water Confidence",
        description: "Build confidence through various water activities and challenges.",
        lessons: ["Treading water", "Changing directions", "Surface dives", "Distance swimming"],
      },
      {
        title: "Assessment and Graduation",
        description: "Demonstrate your new swimming skills and receive your certificate.",
        lessons: ["Skill review", "Distance swim assessment", "Safety assessment", "Certificate ceremony"],
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
          <div className="mb-6">
            <Link
              href="/courses"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Courses
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Course Image and Details */}
            <div className="lg:col-span-2">
              <div className="rounded-lg overflow-hidden mb-6">
                <img
                  src={`/placeholder.svg?height=400&width=800&text=${course.title}`}
                  alt={course.title}
                  className="w-full h-auto object-cover aspect-video"
                />
              </div>

              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-muted-foreground mb-6">{course.fullDescription}</p>

              <Tabs defaultValue="curriculum">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="instructor">Instructor</TabsTrigger>
                </TabsList>
                <TabsContent value="curriculum" className="pt-6">
                  <div className="space-y-6">
                    {course.modules.map((module, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle>
                            Module {index + 1}: {module.title}
                          </CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <li key={lessonIndex}>{lesson}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="details" className="pt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <Award className="h-5 w-5 text-sky-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Level</p>
                            <p className="text-sm text-muted-foreground">{course.level}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Users className="h-5 w-5 text-sky-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Age Group</p>
                            <p className="text-sm text-muted-foreground">{course.age}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Calendar className="h-5 w-5 text-sky-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Duration</p>
                            <p className="text-sm text-muted-foreground">{course.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-sky-500 mt-0.5" />
                          <div>
                            <p className="font-medium">Sessions</p>
                            <p className="text-sm text-muted-foreground">{course.sessions}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 space-y-4">
                        <div>
                          <p className="font-medium">Prerequisites</p>
                          <p className="text-sm text-muted-foreground">{course.prerequisites}</p>
                        </div>
                        <div>
                          <p className="font-medium">Required Equipment</p>
                          <p className="text-sm text-muted-foreground">{course.equipment}</p>
                        </div>
                        <div>
                          <p className="font-medium">Location</p>
                          <p className="text-sm text-muted-foreground">{course.location}</p>
                        </div>
                        <div>
                          <p className="font-medium">Class Size</p>
                          <p className="text-sm text-muted-foreground">
                            Maximum {course.maxStudents} students per class
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">Start Date</p>
                          <p className="text-sm text-muted-foreground">{course.startDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="instructor" className="pt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src="/placeholder.svg?height=128&width=128&text=Instructor"
                            alt={course.instructor}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2">{course.instructor}</h3>
                          <p className="text-muted-foreground mb-4">
                            Sarah Johnson is a certified swimming instructor with over 10 years of experience teaching
                            swimmers of all ages. She specializes in working with beginners and helping them overcome
                            water anxiety. Sarah holds certifications from the American Red Cross and has competed at
                            the collegiate level.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                            <Button variant="outline" size="sm">
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Enrollment Card */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Course Enrollment</CardTitle>
                  <CardDescription>Secure your spot in this popular course</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Price:</span>
                    <span className="text-xl font-bold">{course.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Start Date:</span>
                    <span>{course.startDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Duration:</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Availability:</span>
                    <span className="text-green-600 dark:text-green-400">Spots Available</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                  <Button className="w-full">Enroll Now</Button>
                  <Button variant="outline" className="w-full">
                    Add to Wishlist
                  </Button>
                </CardFooter>
              </Card>
            </div>
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
