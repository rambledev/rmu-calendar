"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("🔄 Attempting login...")
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      console.log("📡 Login result:", result)

      if (result?.error) {
        console.log("❌ Login failed:", result.error)
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        return
      }

      if (result?.ok) {
        console.log("✅ Login successful! Getting session...")
        
        // รอให้ session อัพเดท (สำคัญมาก!)
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Get fresh session
        const session = await getSession()
        console.log("🔍 Fresh session:", session)
        
        if (session?.user?.role) {
          console.log("👤 User role found:", session.user.role)
          
          let redirectPath = "/"
          
          // Redirect ตาม role
          switch (session.user.role) {
            case "SUPERADMIN":
              redirectPath = "/super-admin"
              console.log("🚀 Redirecting to SUPERADMIN dashboard")
              break
            case "ADMIN":
              redirectPath = "/admin"
              console.log("🚀 Redirecting to ADMIN dashboard")
              break
            case "CIO":
              redirectPath = "/cio"
              console.log("🚀 Redirecting to CIO dashboard")
              break
            default:
              console.log("❓ Unknown role:", session.user.role)
              redirectPath = "/"
          }
          
          console.log("🔄 Force redirecting to:", redirectPath)
          
          // ใช้ window.location.href สำหรับ force redirect
          window.location.href = redirectPath
          
        } else {
          console.error("❌ No user role found in session")
          console.error("Session data:", session)
          setError("ไม่พบข้อมูล role ของผู้ใช้")
        }
      } else {
        console.error("❌ Unexpected result:", result)
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ")
      }
    } catch (error) {
      console.error("❌ Login error:", error)
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  return (
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

        {/* Debug Info - เอาออกได้หลังแก้ปัญหาแล้ว */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{
            marginTop: '1rem', 
            padding: '0.5rem', 
            background: '#f3f4f6', 
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: '#6b7280'
          }}>
            🔧 Debug Mode: ดู Console สำหรับ login logs
          </div>
        )}

        {/* Footer */}
        <div style={{textAlign: 'center', marginTop: '1.5rem'}}>
          <p style={{color: '#6b7280', fontSize: '0.875rem'}}>
            © 2025 มหาวิทยาลัยราชภัฏมหาสารคาม
          </p>
        </div>
      </div>
    </div>
  )
}