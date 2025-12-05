import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/jwt";

/**
 * Middleware to verify JWT token from request
 * Returns the decoded token payload or null if invalid
 */
export function verifyAuth(request) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware wrapper for protected API routes
 * Returns NextResponse with error if not authenticated, or null if authenticated
 */
export function requireAuth(request) {
  const decoded = verifyAuth(request);
  
  if (!decoded) {
    return NextResponse.json(
      { success: false, error: "Unauthorized. Please login to continue." },
      { status: 401 }
    );
  }

  return null; // null means authenticated
}

/**
 * Get authenticated user email from request
 * Returns email or null if not authenticated
 */
export function getAuthEmail(request) {
  const decoded = verifyAuth(request);
  return decoded?.email || null;
}

