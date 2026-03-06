// src/middleware.ts

import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    console.log(`🛡️ Middleware: ${pathname} | Role: ${token?.role || 'none'} | Has Token: ${!!token}`)

    if (token) {
      console.log(`✅ Token details - Email: ${token.email}, Role: ${token.role}`)
    }

    // ✅ Public routes - always allow (ไม่ต้อง login)
    const publicPaths = [
      "/calendar",
      "/embed",
      "/api/events",
      "/api/allevents",
      "/api/auth",
      "/api/debug-auth",   // ✅ เพิ่มชั่วคราวสำหรับ debug (ลบออกหลัง debug เสร็จ)
      "/auth/signin",
      "/_next",
      "/favicon",
      "/logo_rmu.png",
      "/public",
    ]

    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next()
    }

    // ✅ Home page: ถ้ามี token → redirect ไป dashboard ตาม role
    if (pathname === "/") {
      if (token?.role) {
        const userRole = token.role as string
        let dashboardPath = ""

        if (userRole === "SUPERADMIN" || userRole === "SUPER-ADMIN") {
          dashboardPath = "/super-admin"
        } else if (userRole === "ADMIN") {
          dashboardPath = "/admin"
        } else if (userRole === "CIO") {
          dashboardPath = "/cio"
        }

        if (dashboardPath) {
          console.log(`✅ Redirecting to dashboard: ${dashboardPath}`)
          return NextResponse.redirect(new URL(dashboardPath, req.url))
        }
      }
      // ไม่มี token → แสดง public calendar
      return NextResponse.next()
    }

    // ✅ Protected routes: ต้องมี token
    if (!token) {
      console.log(`❌ No token for protected route: ${pathname}`)
      const signInUrl = new URL("/auth/signin", req.url)
      signInUrl.searchParams.set("callbackUrl", pathname) // ✅ redirect กลับหลัง login
      return NextResponse.redirect(signInUrl)
    }

    // ✅ Role-based access control
    const userRole = token.role as string
    const isSuperAdmin = ["SUPER-ADMIN", "SUPERADMIN"].includes(userRole)

    if (pathname.startsWith("/super-admin")) {
      if (!isSuperAdmin) {
        console.log(`❌ Access denied to ${pathname} for role: ${userRole}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    if (pathname.startsWith("/admin")) {
      if (!["ADMIN", "SUPER-ADMIN", "SUPERADMIN"].includes(userRole)) {
        console.log(`❌ Access denied to ${pathname} for role: ${userRole}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    if (pathname.startsWith("/cio")) {
      if (!["CIO", "SUPER-ADMIN", "SUPERADMIN"].includes(userRole)) {
        console.log(`❌ Access denied to ${pathname} for role: ${userRole}`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      }
    }

    console.log(`✅ Access granted to ${pathname}`)
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // ✅ ให้ middleware จัดการ auth เองทั้งหมด
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
)

export const config = {
  matcher: [
    // ✅ ครอบคลุมทุก route ยกเว้น static files
    '/((?!_next/static|_next/image|favicon.ico|logo_rmu\\.png).*)',
  ],
}