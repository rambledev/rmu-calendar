import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    console.log(`🛡️ Middleware: ${pathname} | Role: ${token?.role || 'none'}`)

    // Public routes - always allow
    const publicPaths = [
      "/calendar",
      "/embed",
      "/api/events",
      "/api/allevents",
      "/api/auth",
      "/auth/signin",
      "/_next",
      "/favicon",
      "/logo_rmu.png"
    ]
    
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // Home page with authentication - redirect to dashboard
    if (pathname === "/" && token?.role) {
      const userRole = token.role as string
      let dashboardPath = "/"
      
      if (userRole === "SUPERADMIN" || userRole === "SUPER-ADMIN") {
        dashboardPath = "/super-admin"
      } else if (userRole === "ADMIN") {
        dashboardPath = "/admin"
      } else if (userRole === "CIO") {
        dashboardPath = "/cio"
      }
      
      if (dashboardPath !== "/") {
        console.log(`✅ Redirecting to dashboard: ${dashboardPath}`)
        return NextResponse.redirect(new URL(dashboardPath, req.url))
      }
    }

    // Home page without auth - allow (will show public calendar)
    if (pathname === "/") {
      return NextResponse.next()
    }

    // Protected routes - require authentication
    if (!token) {
      console.log("❌ No token, redirecting to signin")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    // Role-based access control
    const userRole = token.role as string

    if (pathname.startsWith("/admin")) {
      if (!["ADMIN", "SUPER-ADMIN", "SUPERADMIN"].includes(userRole)) {
        console.log(`❌ Access denied to ${pathname}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    if (pathname.startsWith("/cio")) {
      if (!["CIO", "SUPER-ADMIN", "SUPERADMIN"].includes(userRole)) {
        console.log(`❌ Access denied to ${pathname}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    if (pathname.startsWith("/super-admin")) {
      if (!["SUPER-ADMIN", "SUPERADMIN"].includes(userRole)) {
        console.log(`❌ Access denied to ${pathname}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    console.log(`✅ Access granted`)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // ✅ ลบ { token } ออก เพราะไม่ได้ใช้
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
)

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ]
}