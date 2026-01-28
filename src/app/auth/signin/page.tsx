"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import CookieConsent from "@/components/CookieConsent" // ✅ เพิ่ม

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // ✅ เช็คว่า user ยอมรับ cookies หรือยัง
    const cookieConsent = localStorage.getItem("cookieConsent")
    if (cookieConsent === "rejected") {
      setError("❌ กรุณายอมรับการใช้ Cookies เพื่อเข้าสู่ระบบ")
      return
    }
    
    setLoading(true)
    setError("")

    try {
      console.log("🔄 ==================== LOGIN ATTEMPT ====================")
      console.log("📧 Email:", email)
      console.log("🍪 Cookie consent:", cookieConsent)
      console.log("🍪 Cookies before login:", document.cookie)
      
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("📡 ==================== LOGIN RESULT ====================")
      console.log("✅ Result OK:", result?.ok)
      console.log("❌ Result Error:", result?.error)
      console.log("🍪 Cookies after login:", document.cookie)

      if (result?.error) {
        console.log("❌ Login failed")
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        return
      }

      if (result?.ok) {
        console.log("✅ Login successful!")
        
        // รอให้ NextAuth อัพเดท session และ cookies
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log("🍪 Cookies after wait:", document.cookie)
        
        // Fetch session เพื่อดู role
        const sessionRes = await fetch('/api/auth/session')
        const session = await sessionRes.json()
        
        console.log("📝 Session data:", session)
        console.log("👤 User role:", session?.user?.role)
        
        if (!session?.user) {
          console.error("❌ No session found after login!")
          setError("ไม่สามารถสร้าง session ได้ กรุณาลองใหม่อีกครั้ง")
          return
        }
        
        // Redirect ตาม role
        let redirectPath = "/"
        
        if (session?.user?.role) {
          const userRole = session.user.role
          
          if (userRole === "SUPERADMIN" || userRole === "SUPER-ADMIN") {
            redirectPath = "/super-admin"
          } else if (userRole === "ADMIN") {
            redirectPath = "/admin"
          } else if (userRole === "CIO") {
            redirectPath = "/cio"
          }
        }
        
        console.log("🚀 Redirecting to:", redirectPath)
        
        // Force hard redirect
        window.location.href = redirectPath
      }
    } catch (error) {
      console.error("❌ LOGIN EXCEPTION:", error)
      if (error instanceof Error) {
        console.error("❌ Error message:", error.message)
        console.error("❌ Error stack:", error.stack)
      }
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* ✅ เพิ่ม Cookie Consent Popup */}
      <CookieConsent />
      
      <div className="container">
        <div className="signin-card">
          {/* Header */}
          <div className="signin-header">
            <div className="icon-container">🔐</div>
            <h1 className="title">เข้าสู่ระบบผู้ดูแล</h1>
            <p className="subtitle">ระบบจัดการปฏิทินกิจกรรม มรม.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="form-group">
              <label className="form-label">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
                placeholder="กรอกอีเมลของคุณ"
                style={{paddingLeft: '1rem'}}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label className="form-label">รหัสผ่าน</label>
              <div className="password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  style={{paddingLeft: '1rem', paddingRight: '3rem'}}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  disabled={loading}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </>
              ) : (
                <>
                  <span>🔐</span>
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
            <p style={{color: '#6b7280', fontSize: '0.875rem'}}>
              © 2025 dev:cc มหาวิทยาลัยราชภัฏมหาสารคาม
            </p>
          </div>
        </div>
      </div>
    </>
  )
}