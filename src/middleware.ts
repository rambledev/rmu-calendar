// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, COOKIE_NAME } from "@/lib/auth"

const PUBLIC_PATHS = [
  "/calendar",
  "/embed",
  "/api/events",
  "/api/allevents",
  "/api/login",
  "/api/logout",
  "/auth/signin",
  "/_next",
  "/favicon",
  "/logo_rmu.png",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  const payload = token ? await verifyToken(token) : null

  if (pathname === "/") {
    if (payload?.role) {
      return NextResponse.redirect(new URL(getDashboard(payload.role), req.url))
    }
    return NextResponse.next()
  }

  if (!payload) {
    const url = new URL("/auth/signin", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

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
