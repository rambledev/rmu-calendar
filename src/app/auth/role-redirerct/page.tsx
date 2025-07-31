"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function RoleRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log("=== ROLE REDIRECT DEBUG ===")
    console.log("Session status:", status)
    console.log("Session data:", session)
    console.log("User role:", session?.user?.role)
    console.log("Timestamp:", new Date().toISOString())
    console.log("===========================")

    // รอให้ session โหลดเสร็จ
    if (status === "loading") {
      console.log("⏳ Session loading...")
      return
    }

    // หากไม่มี session
    if (status === "unauthenticated" || !session?.user) {
      console.log("❌ No session - redirecting to signin")
      router.push("/auth/signin")
      return
    }

    // Role-based redirect
    const userRole = session.user.role
    console.log("🎭 Processing role-based redirect for:", userRole)

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
        console.log("✅ Redirecting regular user to home")
        router.push("/")
        break
    }
  }, [session, status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          กำลังเข้าสู่ระบบ...
        </h2>
        
        <p className="text-gray-600 mb-4">
          {status === "loading" 
            ? "กำลังตรวจสอบสิทธิ์การเข้าใช้งาน" 
            : `กำลังนำท่านไปยังหน้าที่เหมาะสม`
          }
        </p>

        {session?.user && (
          <div className="text-sm text-gray-500 mb-4">
            สวัสดี, {session.user.name || session.user.email}
            <br />
            <span className="font-medium">บทบาท: {session.user.role}</span>
          </div>
        )}

        {/* Debug panel สำหรับ development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="font-medium text-gray-800 mb-2">Debug Info:</h3>
            <div className="text-xs space-y-1 text-gray-600">
              <div><strong>Status:</strong> {status}</div>
              <div><strong>User ID:</strong> {session?.user?.id || "N/A"}</div>
              <div><strong>Email:</strong> {session?.user?.email || "N/A"}</div>
              <div><strong>Role:</strong> {session?.user?.role || "N/A"}</div>
              <div><strong>Name:</strong> {session?.user?.name || "N/A"}</div>
            </div>
          </div>
        )}

        {/* Manual navigation สำหรับ debug */}
        {process.env.NODE_ENV === "development" && session?.user && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-500">Manual Navigation (Debug):</p>
            <div className="flex gap-2 justify-center">
              <button 
                onClick={() => router.push("/admin")}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Admin
              </button>
              <button 
                onClick={() => router.push("/cio")}
                className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
              >
                CIO
              </button>
              <button 
                onClick={() => router.push("/super-admin")}
                className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
              >
                Super Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}