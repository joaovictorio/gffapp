import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/login", "/registro", "/convite"];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isApiAuth = pathname.startsWith("/api/auth");
  // Allow public routes and auth API
  if (isPublicRoute || isApiAuth) {
    // Redirect to painel if already logged in
    if (token && isPublicRoute) {
      return NextResponse.redirect(new URL("/painel", request.url));
    }
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};
