import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simplified token expiration check for server-side middleware
function isTokenExpiredServerSide(token: string): boolean {
  try {
    // JWT format: header.payload.signature
    const payload = token.split(".")[1];
    if (!payload) return true;

    // Base64 decode the payload
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    const decoded = JSON.parse(jsonPayload);

    if (!decoded.exp) return true;

    // exp is in seconds since epoch
    const now = Math.floor(Date.now() / 1000);

    // App version timestamp - change this on significant updates
    const APP_VERSION_TIMESTAMP = "2025-05-30";

    // Check if token was issued before current app version
    if (
      decoded.iat &&
      new Date(decoded.iat * 1000).toISOString().slice(0, 10) <
        APP_VERSION_TIMESTAMP
    ) {
      return true;
    }

    return decoded.exp < now;
  } catch (e) {
    return true;
  }
}

export function middleware(request: NextRequest) {
  // Get the token from cookies or headers
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.split(" ")[1];

  // Check if the user is accessing tenant selection page
  if (request.nextUrl.pathname === "/tenant-selection") {
    // If there's no token or token is expired, redirect to login
    if (!token || isTokenExpiredServerSide(token)) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    // Allow access to tenant selection if authenticated
    return NextResponse.next();
  }

  // Check if the user is accessing a dashboard route
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    // If there's no token or token is expired, redirect to login
    if (!token || isTokenExpiredServerSide(token)) {
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
  matcher: ["/dashboard/:path*", "/tenant-selection"],
};
