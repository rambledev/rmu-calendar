import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // เช็คว่าเป็น path ที่ต้องการ protect หรือไม่
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/cio") && !pathname.startsWith("/super-admin")) {
    return NextResponse.next()
  }

  try {
    // ใช้ fetch session API เพื่อดึงข้อมูล user ล่าสุด
    const sessionUrl = new URL('/api/auth/session', req.url)
    const sessionResponse = await fetch(sessionUrl.toString(), {
      headers: {
        cookie: req.headers.get('cookie') || '',
        'content-type': 'application/json',
      },
    })

    console.log("=== MIDDLEWARE DEBUG (SESSION API) ===")
    console.log("Path:", pathname)
    console.log("Session response status:", sessionResponse.status)

    if (!sessionResponse.ok) {
      console.log("❌ Failed to get session - redirecting to signin")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    const session = await sessionResponse.json()
    
    console.log("Session data:", JSON.stringify(session, null, 2))
    console.log("User role from session:", session?.user?.role)
    console.log("User email from session:", session?.user?.email)
    console.log("User ID from session:", session?.user?.id)
    console.log("=====================================")

    // หากไม่มี session หรือ user redirect ไปหน้า signin
    if (!session || !session.user) {
      console.log("❌ No session found - redirecting to signin")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    const userRole = session.user.role

    // Check admin routes - only ADMIN can access
    if (pathname.startsWith("/admin")) {
      if (userRole !== "ADMIN") {
        console.log(`❌ Blocking admin access - user role: "${userRole}", expected: "ADMIN"`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      } else {
        console.log("✅ Admin access granted")
      }
    }

    // Check CIO routes - only CIO can access
    if (pathname.startsWith("/cio")) {
      if (userRole !== "CIO") {
        console.log(`❌ Blocking CIO access - user role: "${userRole}", expected: "CIO"`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      } else {
        console.log("✅ CIO access granted")
      }
    }

    // Check SUPERADMIN routes - only SUPERADMIN can access
    if (pathname.startsWith("/super-admin")) {
      if (userRole !== "SUPERADMIN") {
        console.log(`❌ Blocking SUPERADMIN access - user role: "${userRole}", expected: "SUPERADMIN"`)
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      } else {
        console.log("✅ SUPERADMIN access granted")
      }
    }

    console.log("✅ Access granted to:", pathname)
    return NextResponse.next()

  } catch (error) {
    console.error("Middleware error:", error)
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
}

export const config = {
  matcher: ["/admin/:path*", "/cio/:path*", "/super-admin/:path*"]
}