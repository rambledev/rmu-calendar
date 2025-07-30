"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RoleRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log("=== ROLE REDIRECT PAGE DEBUG ===")
    console.log("Session status:", status)
    console.log("Session data:", session)
    console.log("User role:", session?.user?.role)
    console.log("================================")

    if (status === "loading") {
      console.log("⏳ Session loading...")
      return
    }

    if (status === "unauthenticated" || !session?.user) {
      console.log("❌ No session - redirecting to signin")
      router.push("/auth/signin")
      return
    }

    const userRole = session.user.role
    console.log("🔄 Processing role-based redirect for role:", userRole)

    // Role-based redirect logic
    switch (userRole) {
      case "ADMIN":
        console.log("✅ Redirecting ADMIN to /admin")
        router.push("/admin")
        break
      
      case "CIO":
        console.log("✅ Redirecting CIO to /cio")
        router.push("/cio")
        break
      
      case "SUPERADMIN":
        console.log("✅ Redirecting SUPERADMIN to /super-admin")
        router.push("/super-admin")
        break
      
      default:
        console.log("⚠️ Unknown role or regular user - redirecting to home")
        router.push("/")
        break
    }
  }, [session, status, router])

  // แสดง loading screen ขณะกำลัง redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">กำลังเข้าสู่ระบบ...</h2>
        <p className="text-sm text-gray-600">
          {status === "loading" 
            ? "กำลังตรวจสอบสิทธิ์การเข้าใช้งาน" 
            : `กำลังนำท่านไปยังหน้าที่เหมาะสม (${session?.user?.role})`
          }
        </p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-left max-w-md">
            <strong>Debug Info:</strong><br/>
            Status: {status}<br/>
            Role: {session?.user?.role || "N/A"}<br/>
            User ID: {session?.user?.id || "N/A"}<br/>
            Email: {session?.user?.email || "N/A"}
          </div>
        )}
      </div>
    </div>
  )
}