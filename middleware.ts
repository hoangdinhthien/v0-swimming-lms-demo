import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Get the token from cookies or headers
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.split(" ")[1];

  // Check if the user is accessing a dashboard route
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // If there's no token and the route requires authentication, redirect to login
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Get user data from cookies for role-based access control
    const userCookie = request.cookies.get("user")?.value;
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        const path = request.nextUrl.pathname;
        // Extract frontend role (role_front has priority)
        let frontendRole = "";
        if (Array.isArray(user.role_front) && user.role_front.length > 0) {
          frontendRole = user.role_front[0].toLowerCase();
        } else if (typeof user.role_front === "string") {
          frontendRole = user.role_front.toLowerCase();
        } else if (
          Array.isArray(user.role_system) &&
          user.role_system.length > 0
        ) {
          frontendRole = user.role_system[0].toLowerCase();
        } else if (typeof user.role_system === "string") {
          frontendRole = user.role_system.toLowerCase();
        }

        // Role-based access control for dashboard areas
        if (
          path.startsWith("/dashboard/student") &&
          frontendRole !== "student"
        ) {
          return NextResponse.redirect(new URL("/", request.url));
        }
        if (
          path.startsWith("/dashboard/instructor") &&
          frontendRole !== "instructor"
        ) {
          return NextResponse.redirect(new URL("/", request.url));
        }
        if (
          path.startsWith("/dashboard/manager") &&
          frontendRole !== "manager" &&
          frontendRole !== "admin"
        ) {
          return NextResponse.redirect(new URL("/", request.url));
        }
        if (path.startsWith("/dashboard/admin") && frontendRole !== "admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch (e) {
        console.error("Failed to parse user data from cookie", e);
      }
    }
  }

  return NextResponse.next();
}

// Matching paths for middleware to run on
export const config = {
  matcher: ["/dashboard/:path*"],
};
