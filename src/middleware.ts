// middleware.ts
import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    console.log(`🛡️ Middleware: Checking ${pathname} for user role: ${token?.role || 'none'}`)

    // Allow access to public routes
    if (
      pathname === "/" ||
      pathname.startsWith("/calendar") ||
      pathname.startsWith("/embed") ||
      pathname.startsWith("/api/events") ||
      pathname.startsWith("/api/allevents") ||
      pathname.startsWith("/auth") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/logo_rmu.png")
    ) {
      return NextResponse.next()
    }

    // Protected routes - require authentication
    if (!token) {
      console.log("❌ Middleware: No token found, redirecting to signin")
      const signInUrl = new URL("/auth/signin", req.url)
      return NextResponse.redirect(signInUrl)
    }

    // Role-based access control
    const userRole = token.role as string

    // Admin routes (accessible by ADMIN and SUPER-ADMIN/SUPERADMIN)
    if (pathname.startsWith("/admin")) {
      if (userRole !== "ADMIN" && userRole !== "SUPER-ADMIN" && userRole !== "SUPERADMIN") {
        console.log(`❌ Middleware: Access denied to ${pathname} for role: ${userRole}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
      console.log(`✅ Middleware: Access granted to ${pathname} for role: ${userRole}`)
    }

    // CIO routes (accessible by CIO and SUPER-ADMIN/SUPERADMIN)
    if (pathname.startsWith("/cio")) {
      if (userRole !== "CIO" && userRole !== "SUPER-ADMIN" && userRole !== "SUPERADMIN") {
        console.log(`❌ Middleware: Access denied to ${pathname} for role: ${userRole}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
      console.log(`✅ Middleware: Access granted to ${pathname} for role: ${userRole}`)
    }

    // Super Admin routes (accessible by SUPER-ADMIN or SUPERADMIN)
    if (pathname.startsWith("/super-admin")) {
      if (userRole !== "SUPER-ADMIN" && userRole !== "SUPERADMIN") {
        console.log(`❌ Middleware: Access denied to ${pathname} for role: ${userRole}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
      console.log(`✅ Middleware: Access granted to ${pathname} for role: ${userRole}`)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Always allow access to public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/calendar") ||
          pathname.startsWith("/embed") ||
          pathname.startsWith("/api/events") ||
          pathname.startsWith("/api/allevents") ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname.startsWith("/logo_rmu.png")
        ) {
          return true
        }

        // For protected routes, require a token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
}