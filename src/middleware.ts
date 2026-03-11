// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth"

// Routes ที่ไม่ต้อง login
const PUBLIC_PATHS = [
  "/calendar",
  "/embed",
  "/api/events",
  "/api/allevents",
  "/api/auth/login",   // ✅ login endpoint เองต้องเป็น public
  "/auth/signin",
  "/_next",
  "/favicon",
  "/logo_rmu.png",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ✅ อนุญาต public paths ผ่านได้เลย
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  console.log(`🔍 path=${pathname} isPublic=${isPublic}`)
  if (isPublic) {
    return NextResponse.next()
  }

  // ✅ อ่าน token จาก cookie
  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  console.log(`🛡️ ${pathname} | role: ${payload?.role ?? "none"} | auth: ${!!payload}`)

  // ✅ Home page
  if (pathname === "/") {
    if (payload?.role) {
      return NextResponse.redirect(new URL(getDashboard(payload.role), req.url))
    }
    return NextResponse.next()
  }

  // ✅ ไม่มี token → ไป signin
  if (!payload) {
    const url = new URL("/auth/signin", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // ✅ Role-based access
  const role = payload.role
  const isSuperAdmin = ["SUPERADMIN", "SUPER-ADMIN"].includes(role)

  if (pathname.startsWith("/super-admin") && !isSuperAdmin) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
  if (pathname.startsWith("/admin") && !["ADMIN", "SUPERADMIN", "SUPER-ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }
  if (pathname.startsWith("/cio") && !["CIO", "SUPERADMIN", "SUPER-ADMIN"].includes(role)) {
    return NextResponse.redirect(new URL("/auth/signin", req.url))
  }

  return NextResponse.next()
}

function getDashboard(role: string) {
  if (["SUPERADMIN", "SUPER-ADMIN"].includes(role)) return "/super-admin"
  if (role === "ADMIN") return "/admin"
  if (role === "CIO") return "/cio"
  return "/"
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo_rmu\\.png).*)"],
}