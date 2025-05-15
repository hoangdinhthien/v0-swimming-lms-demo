import Link from "next/link"
import type { ReactNode } from "react"
import {
  Waves,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  Calendar,
  Award,
  Settings,
  BarChart3,
  CreditCard,
  MessageSquare,
  Bell,
  Percent,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardLayoutProps {
  children: ReactNode
  userRole: "student" | "instructor" | "admin"
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const navItems = {
    student: [
      { href: "/dashboard/student", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/dashboard/student/courses", label: "My Courses", icon: <Award className="h-5 w-5" /> },
      { href: "/dashboard/student/schedule", label: "Schedule", icon: <Calendar className="h-5 w-5" /> },
      { href: "/dashboard/student/payments", label: "Payments", icon: <CreditCard className="h-5 w-5" /> },
      { href: "/dashboard/student/notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> },
      { href: "/chat", label: "Messages", icon: <MessageSquare className="h-5 w-5" /> },
      { href: "/dashboard/student/feedback", label: "Feedback", icon: <Star className="h-5 w-5" /> },
    ],
    instructor: [
      { href: "/dashboard/instructor", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/dashboard/instructor/classes", label: "My Classes", icon: <Users className="h-5 w-5" /> },
      { href: "/dashboard/instructor/students", label: "Students", icon: <Users className="h-5 w-5" /> },
      { href: "/dashboard/instructor/schedule", label: "Schedule", icon: <Calendar className="h-5 w-5" /> },
      { href: "/dashboard/instructor/feedback", label: "Feedback", icon: <MessageSquare className="h-5 w-5" /> },
      { href: "/chat", label: "Messages", icon: <MessageSquare className="h-5 w-5" /> },
    ],
    admin: [
      { href: "/dashboard/admin", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/dashboard/admin/courses", label: "Courses", icon: <Award className="h-5 w-5" /> },
      { href: "/dashboard/admin/instructors", label: "Instructors", icon: <Users className="h-5 w-5" /> },
      { href: "/dashboard/admin/students", label: "Students", icon: <Users className="h-5 w-5" /> },
      { href: "/dashboard/admin/pools", label: "Pool Management", icon: <Waves className="h-5 w-5" /> },
      { href: "/dashboard/admin/finances", label: "Finances", icon: <CreditCard className="h-5 w-5" /> },
      { href: "/dashboard/admin/promotions", label: "Promotions", icon: <Percent className="h-5 w-5" /> },
      { href: "/dashboard/admin/reports", label: "Reports", icon: <BarChart3 className="h-5 w-5" /> },
      { href: "/dashboard/admin/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium hidden md:inline-block">
                {userRole === "student" ? "Alex Johnson" : userRole === "instructor" ? "Sarah Johnson" : "Admin User"}
              </span>
            </div>
            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-muted/40">
          <div className="flex flex-col gap-2 p-4">
            {navItems[userRole].map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-muted
                  ${item.href.endsWith(userRole) ? "bg-muted font-medium" : "text-muted-foreground"}`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
