import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";

/**
 * Middleware to protect routes that require authentication
 * Checks for JWT token in cookies and validates it
 */
export function middleware(request) {
  const { pathname } = request.nextUrl;

  // List of protected routes
  const protectedRoutes = ["/profile", "/prayerProgress"];

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    // Allow access to non-protected routes
    return NextResponse.next();
  }

  // Get token from cookies
  const token = request.cookies.get("token")?.value;

  // If no cookie token, allow request through and let client-side protection handle it
  // This is necessary because tokens are stored in localStorage (client-side only)
  // The client-side code will check localStorage and redirect if needed
  if (!token) {
    return NextResponse.next();
  }

  try {
    // Verify the token if cookie exists
    const decoded = verifyToken(token);

    if (!decoded) {
      // Invalid token in cookie, clear it and allow request through
      // Client-side will handle redirect based on localStorage
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }

    // Token is valid, allow access
    return NextResponse.next();
  } catch (error) {
    // Token verification failed, clear invalid cookie and allow request through
    // Client-side will handle redirect based on localStorage
    const response = NextResponse.next();
    response.cookies.delete("token");
    return response;
  }
}

// Configure which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

