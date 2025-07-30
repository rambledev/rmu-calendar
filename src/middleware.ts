import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // เช็คว่าเป็น path ที่ต้องการ protect หรือไม่
  if (!pathname.startsWith("/admin") && !pathname.startsWith("/cio") && !pathname.startsWith("/super-admin")) {
    return NextResponse.next()
  }

  console.log("=== MIDDLEWARE DEBUG START ===")
  console.log("🔍 Checking protected path:", pathname)
  console.log("📅 Timestamp:", new Date().toISOString())

  try {
    // ใช้ fetch session API เพื่อดึงข้อมูล user ล่าสุด
    const sessionUrl = new URL('/api/auth/session', req.url)
    console.log("🌐 Fetching session from:", sessionUrl.toString())
    
    const sessionResponse = await fetch(sessionUrl.toString(), {
      headers: {
        cookie: req.headers.get('cookie') || '',
        'content-type': 'application/json',
      },
    })

    console.log("📡 Session API response status:", sessionResponse.status)
    console.log("🍪 Request cookies present:", !!req.headers.get('cookie'))

    if (!sessionResponse.ok) {
      console.log("❌ Failed to get session response")
      console.log("🔄 Redirecting to signin from middleware")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    const session = await sessionResponse.json()
    
    console.log("📋 Raw session response:", JSON.stringify(session, null, 2))
    console.log("👤 User from session:", {
      id: session?.user?.id,
      email: session?.user?.email,
      role: session?.user?.role,
      name: session?.user?.name
    })

    // หากไม่มี session หรือ user redirect ไปหน้า signin
    if (!session || !session.user) {
      console.log("❌ No valid session or user found")
      console.log("🔄 Redirecting to signin - no session")
      return NextResponse.redirect(new URL("/auth/signin", req.url))
    }

    const userRole = session.user.role
    console.log("🎭 User role extracted:", `"${userRole}"` || "undefined")

    // Check admin routes - only ADMIN can access
    if (pathname.startsWith("/admin")) {
      console.log("🔒 Checking ADMIN route access")
      if (userRole !== "ADMIN") {
        console.log(`❌ Access DENIED - user role: "${userRole}", required: "ADMIN"`)
        console.log("🔄 Redirecting to signin - insufficient privileges")
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      } else {
        console.log("✅ ADMIN access GRANTED")
      }
    }

    // Check CIO routes - only CIO can access
    if (pathname.startsWith("/cio")) {
      console.log("🔒 Checking CIO route access")
      if (userRole !== "CIO") {
        console.log(`❌ Access DENIED - user role: "${userRole}", required: "CIO"`)
        console.log("🔄 Redirecting to signin - insufficient privileges")
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      } else {
        console.log("✅ CIO access GRANTED")
      }
    }

    // Check SUPERADMIN routes - only SUPERADMIN can access
    if (pathname.startsWith("/super-admin")) {
      console.log("🔒 Checking SUPERADMIN route access")
      if (userRole !== "SUPERADMIN") {
        console.log(`❌ Access DENIED - user role: "${userRole}", required: "SUPERADMIN"`)
        console.log("🔄 Redirecting to signin - insufficient privileges")
        return NextResponse.redirect(new URL("/auth/signin", req.url))
      } else {
        console.log("✅ SUPERADMIN access GRANTED")
      }
    }

    console.log("🎉 Access granted to:", pathname)
    console.log("=== MIDDLEWARE DEBUG END ===")
    return NextResponse.next()

  } catch (error) {
    console.error("💥 Middleware error:", error)
    console.log("🔄 Redirecting to signin - error occurred")
    console.log("=== MIDDLEWARE DEBUG END (ERROR) ===")
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
}

export const config = {
  matcher: ["/admin/:path*", "/cio/:path*", "/super-admin/:path*"]
}