import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Waves, Search, Star } from "lucide-react"

export default function InstructorsPage() {
  // Sample instructor data
  const instructors = [
    {
      id: 1,
      name: "Sarah Johnson",
      specialty: "Beginner Swimming, Water Safety",
      experience: "10+ years",
      certifications: ["American Red Cross WSI", "Lifeguard Certified"],
      bio: "Sarah specializes in teaching beginners and helping students overcome water anxiety. Her patient approach makes learning to swim enjoyable for all ages.",
      rating: 4.9,
      reviews: 124,
      image: "/placeholder.svg?height=300&width=300&text=Sarah",
    },
    {
      id: 2,
      name: "Michael Chen",
      specialty: "Competitive Swimming, Advanced Techniques",
      experience: "15+ years",
      certifications: ["USA Swimming Coach", "Former Olympic Athlete"],
      bio: "Michael is a former competitive swimmer who now shares his expertise with students looking to perfect their technique and improve their speed.",
      rating: 4.8,
      reviews: 98,
      image: "/placeholder.svg?height=300&width=300&text=Michael",
    },
    {
      id: 3,
      name: "Emma Rodriguez",
      specialty: "Youth Swimming, Stroke Development",
      experience: "8+ years",
      certifications: ["ASCA Level 2 Coach", "Swim America Instructor"],
      bio: "Emma has a special talent for working with children and developing proper stroke techniques from an early age.",
      rating: 4.7,
      reviews: 87,
      image: "/placeholder.svg?height=300&width=300&text=Emma",
    },
    {
      id: 4,
      name: "David Wilson",
      specialty: "Parent & Child Swimming, Water Acclimation",
      experience: "12+ years",
      certifications: ["Infant Swimming Resource", "Water Safety Instructor"],
      bio: "David specializes in parent-child swimming lessons and helping infants and toddlers become comfortable in the water.",
      rating: 4.9,
      reviews: 112,
      image: "/placeholder.svg?height=300&width=300&text=David",
    },
    {
      id: 5,
      name: "Lisa Thompson",
      specialty: "Adult Learn-to-Swim, Aquatic Fitness",
      experience: "9+ years",
      certifications: ["Adult-Learn-To-Swim Instructor", "Aquatic Exercise Association"],
      bio: "Lisa focuses on adult swimmers and those looking to use swimming for fitness and rehabilitation purposes.",
      rating: 4.8,
      reviews: 76,
      image: "/placeholder.svg?height=300&width=300&text=Lisa",
    },
    {
      id: 6,
      name: "James Anderson",
      specialty: "Competitive Coaching, Performance Analysis",
      experience: "20+ years",
      certifications: ["ASCA Level 4 Coach", "Sports Performance Analyst"],
      bio: "James has coached competitive swimmers at national and international levels, with expertise in performance analysis and technique refinement.",
      rating: 4.9,
      reviews: 145,
      image: "/placeholder.svg?height=300&width=300&text=James",
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
            <Link href="/courses" className="text-sm font-medium">
              Courses
            </Link>
            <Link href="/instructors" className="text-sm font-medium text-sky-600 dark:text-sky-400">
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
            <h1 className="text-3xl font-bold">Our Swimming Instructors</h1>
            <p className="text-muted-foreground">
              Meet our team of certified swimming instructors with years of experience teaching swimmers of all ages and
              abilities.
            </p>
          </div>

          {/* Search */}
          <div className="my-8">
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search instructors by name or specialty..." className="w-full pl-8" />
            </div>
          </div>

          {/* Instructors Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="overflow-hidden">
                <div className="aspect-square w-full overflow-hidden">
                  <img
                    src={instructor.image || "/placeholder.svg"}
                    alt={instructor.name}
                    className="object-cover w-full h-full"
                  />
                </div>
                <CardHeader>
                  <CardTitle>{instructor.name}</CardTitle>
                  <CardDescription>{instructor.specialty}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{instructor.bio}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{instructor.rating}</span>
                    <span className="text-muted-foreground text-sm">({instructor.reviews} reviews)</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Experience:</p>
                    <p className="text-sm">{instructor.experience}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Certifications:</p>
                    <ul className="text-sm list-disc pl-5">
                      {instructor.certifications.map((cert, index) => (
                        <li key={index}>{cert}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    View Profile
                  </Button>
                  <Button className="flex-1">Book Lesson</Button>
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
