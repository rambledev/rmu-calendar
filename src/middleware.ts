import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    console.log("Middleware - Path:", pathname)
    console.log("Middleware - User role:", token?.role)

    // Check admin routes - only ADMIN can access
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      console.log("Blocking access to admin - redirecting to sign in")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Check CIO routes - only CIO can access
    if (pathname.startsWith("/cio") && token?.role !== "CIO") {
      console.log("Blocking access to CIO - redirecting to sign in")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    console.log("Access granted")
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/cio/:path*"]
}