"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Waves, CreditCard } from "lucide-react"

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [courseType, setCourseType] = useState("individual")

  const nextStep = () => {
    setStep(step + 1)
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  return (
    <div className="min-h-screen flex flex-col">
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

      <main className="flex-1 container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">Course Registration</h1>
            <p className="text-muted-foreground mt-2">Register for swimming lessons at AquaLearn</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center relative">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= i ? "bg-sky-600 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i}
                  </div>
                  <span className="text-xs mt-2 font-medium">
                    {i === 1 ? "Course Selection" : i === 2 ? "Personal Details" : i === 3 ? "Payment" : "Confirmation"}
                  </span>
                </div>
              ))}
              <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-0">
                <div
                  className="h-full bg-sky-600 transition-all duration-300"
                  style={{ width: `${(step - 1) * 33.33}%` }}
                ></div>
              </div>
            </div>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select a Course</CardTitle>
                <CardDescription>Choose the swimming course you want to register for</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="individual" onValueChange={(value) => setCourseType(value)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="individual">Individual Courses</TabsTrigger>
                    <TabsTrigger value="group">Group Courses</TabsTrigger>
                  </TabsList>
                  <TabsContent value="individual" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      {[
                        {
                          id: 1,
                          title: "Beginner Swimming",
                          description: "Perfect for those new to swimming. Learn water safety and basic strokes.",
                          level: "Beginner",
                          age: "5+ years",
                          duration: "8 weeks",
                          price: "$120",
                        },
                        {
                          id: 2,
                          title: "Intermediate Techniques",
                          description: "Refine your strokes and build endurance for confident swimming.",
                          level: "Intermediate",
                          age: "8+ years",
                          duration: "10 weeks",
                          price: "$150",
                        },
                        {
                          id: 3,
                          title: "Advanced Performance",
                          description: "Master competitive techniques and advanced swimming skills.",
                          level: "Advanced",
                          age: "12+ years",
                          duration: "12 weeks",
                          price: "$180",
                        },
                      ].map((course) => (
                        <div key={course.id} className="flex items-start space-x-3 border rounded-lg p-4">
                          <Checkbox id={`course-${course.id}`} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={`course-${course.id}`} className="text-base font-medium cursor-pointer">
                              {course.title} - {course.price}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                              <div>
                                <span className="font-medium">Level:</span> {course.level}
                              </div>
                              <div>
                                <span className="font-medium">Age:</span> {course.age}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {course.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="group" className="space-y-4 pt-4">
                    <div className="space-y-4">
                      {[
                        {
                          id: 4,
                          title: "Family Swimming",
                          description: "Swimming lessons for the whole family. Learn together in a fun environment.",
                          participants: "Up to 4 family members",
                          age: "All ages",
                          duration: "8 weeks",
                          price: "$300",
                        },
                        {
                          id: 5,
                          title: "Parent & Child Swimming",
                          description: "Bond with your child while teaching them essential water skills.",
                          participants: "1 parent + 1 child",
                          age: "6 months - 3 years",
                          duration: "6 weeks",
                          price: "$100",
                        },
                      ].map((course) => (
                        <div key={course.id} className="flex items-start space-x-3 border rounded-lg p-4">
                          <Checkbox id={`course-${course.id}`} className="mt-1" />
                          <div className="flex-1">
                            <Label htmlFor={`course-${course.id}`} className="text-base font-medium cursor-pointer">
                              {course.title} - {course.price}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
                            <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                              <div>
                                <span className="font-medium">Participants:</span> {course.participants}
                              </div>
                              <div>
                                <span className="font-medium">Age:</span> {course.age}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {course.duration}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferred-time">Preferred Schedule</Label>
                    <Select>
                      <SelectTrigger id="preferred-time">
                        <SelectValue placeholder="Select preferred time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekday-morning">Weekday Mornings (9AM - 12PM)</SelectItem>
                        <SelectItem value="weekday-afternoon">Weekday Afternoons (1PM - 5PM)</SelectItem>
                        <SelectItem value="weekday-evening">Weekday Evenings (6PM - 9PM)</SelectItem>
                        <SelectItem value="weekend-morning">Weekend Mornings (9AM - 12PM)</SelectItem>
                        <SelectItem value="weekend-afternoon">Weekend Afternoons (1PM - 5PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Preferred Start Date</Label>
                    <Input type="date" id="start-date" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={nextStep}>Continue</Button>
              </CardFooter>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>
                  {courseType === "individual"
                    ? "Enter your personal information"
                    : "Enter information for all participants"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {courseType === "group" && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h3 className="font-medium mb-2">Primary Contact / Parent Information</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This person will be the main contact for all communications
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input id="first-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" type="tel" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Gender</Label>
                        <Select>
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="prefer-not">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">Zip Code</Label>
                        <Input id="zip" />
                      </div>
                    </div>
                  </div>

                  {courseType === "group" && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium">Additional Participants</h3>
                        <Button variant="outline" size="sm">
                          Add Participant
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg space-y-4">
                        <h4 className="font-medium">Participant 1</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="p1-first-name">First Name</Label>
                            <Input id="p1-first-name" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="p1-last-name">Last Name</Label>
                            <Input id="p1-last-name" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="p1-dob">Date of Birth</Label>
                            <Input id="p1-dob" type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="p1-relation">Relation to Primary Contact</Label>
                            <Select>
                              <SelectTrigger id="p1-relation">
                                <SelectValue placeholder="Select relation" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="medical">Medical Information</Label>
                    <Input id="medical" placeholder="Any medical conditions or allergies we should be aware of?" />
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox id="terms" />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the terms and conditions
                      </label>
                      <p className="text-sm text-muted-foreground">
                        By checking this box, you agree to our{" "}
                        <Link href="/terms" className="text-sky-600 hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-sky-600 hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button onClick={nextStep}>Continue</Button>
              </CardFooter>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
                <CardDescription>Secure payment for your swimming course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Beginner Swimming Course</span>
                      <span>$120.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Registration Fee</span>
                      <span>$15.00</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                      <span>Total</span>
                      <span>$135.00</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" className="flex items-center justify-center gap-2 h-16">
                        <CreditCard className="h-5 w-5" />
                        <span>Credit Card</span>
                      </Button>
                      <Button variant="outline" className="flex items-center justify-center gap-2 h-16">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M6.5 13.5C5.94772 13.5 5.5 13.0523 5.5 12.5V11.5C5.5 10.9477 5.94772 10.5 6.5 10.5H17.5C18.0523 10.5 18.5 10.9477 18.5 11.5V12.5C18.5 13.0523 18.0523 13.5 17.5 13.5H6.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M10.5 7.5C9.94772 7.5 9.5 7.05228 9.5 6.5V5.5C9.5 4.94772 9.94772 4.5 10.5 4.5H13.5C14.0523 4.5 14.5 4.94772 14.5 5.5V6.5C14.5 7.05228 14.0523 7.5 13.5 7.5H10.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M10.5 19.5C9.94772 19.5 9.5 19.0523 9.5 18.5V17.5C9.5 16.9477 9.94772 16.5 10.5 16.5H13.5C14.0523 16.5 14.5 16.9477 14.5 17.5V18.5C14.5 19.0523 14.0523 19.5 13.5 19.5H10.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M3.5 4.5C2.94772 4.5 2.5 4.94772 2.5 5.5V18.5C2.5 19.0523 2.94772 19.5 3.5 19.5H4.5C5.05228 19.5 5.5 19.0523 5.5 18.5V5.5C5.5 4.94772 5.05228 4.5 4.5 4.5H3.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M19.5 4.5C18.9477 4.5 18.5 4.94772 18.5 5.5V18.5C18.5 19.0523 18.9477 19.5 19.5 19.5H20.5C21.0523 19.5 21.5 19.0523 21.5 18.5V5.5C21.5 4.94772 21.0523 4.5 20.5 4.5H19.5Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span>PayPal</span>
                      </Button>
                      <Button variant="outline" className="flex items-center justify-center gap-2 h-16">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M4.5 9.5C3.94772 9.5 3.5 9.94772 3.5 10.5V13.5C3.5 14.0523 3.94772 14.5 4.5 14.5H19.5C20.0523 14.5 20.5 14.0523 20.5 13.5V10.5C20.5 9.94772 20.0523 9.5 19.5 9.5H4.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M5.5 6.5C4.94772 6.5 4.5 6.94772 4.5 7.5V8.5C4.5 9.05228 4.94772 9.5 5.5 9.5H18.5C19.0523 9.5 19.5 9.05228 19.5 8.5V7.5C19.5 6.94772 19.0523 6.5 18.5 6.5H5.5Z"
                            fill="currentColor"
                          />
                          <path
                            d="M5.5 14.5C4.94772 14.5 4.5 14.9477 4.5 15.5V16.5C4.5 17.0523 4.94772 17.5 5.5 17.5H18.5C19.0523 17.5 19.5 17.0523 19.5 16.5V15.5C19.5 14.9477 19.0523 14.5 18.5 14.5H5.5Z"
                            fill="currentColor"
                          />
                        </svg>
                        <span>Bank Transfer</span>
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="card-name">Name on Card</Label>
                      <Input id="card-name" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input id="card-number" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry">Expiry Date</Label>
                        <Input id="expiry" placeholder="MM/YY" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv">CVV</Label>
                        <Input id="cvv" placeholder="123" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billing-address">Billing Address</Label>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="same-address" defaultChecked />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="same-address"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Same as personal address
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button onClick={nextStep}>Complete Payment</Button>
              </CardFooter>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>Registration Complete!</CardTitle>
                  <CardDescription>Your swimming course registration was successful</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-2">Registration Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Course:</span>
                      <span>Beginner Swimming</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Start Date:</span>
                      <span>June 15, 2023</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Schedule:</span>
                      <span>Monday & Wednesday, 4:00 PM - 4:45 PM</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Location:</span>
                      <span>Main Pool - Lane 1-2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Instructor:</span>
                      <span>Sarah Johnson</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Payment:</span>
                      <span>$135.00 (Paid)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Order ID:</span>
                      <span>#SW12345</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-center">
                  <p>A confirmation email has been sent to your email address.</p>
                  <p className="text-sm text-muted-foreground">
                    Please arrive 15 minutes before your first class for orientation.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Link href="/dashboard/student" className="w-full">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
                <Link href="/" className="w-full">
                  <Button variant="outline" className="w-full">
                    Return to Home
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

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

function CheckCircle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
