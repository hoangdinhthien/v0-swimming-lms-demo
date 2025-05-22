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
  }

  return NextResponse.next();
}

// Matching paths for middleware to run on
export const config = {
  matcher: ["/dashboard/:path*"],
};
