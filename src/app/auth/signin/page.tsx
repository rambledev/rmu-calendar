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
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      } else {
        // Get user session to check role
        const session = await getSession()
        
        if (session?.user?.role === "ADMIN") {
          router.push("/admin")
        } else if (session?.user?.role === "CIO") {
          router.push("/cio")
        } else {
          // Default fallback
          router.push("/")
        }
        
        router.refresh()
      }
    } catch (error) {
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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
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
              <div className="loading-spinner"></div>
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
            © 2025 มหาวิทยาลัยราชภัฏมหาสารคาม
          </p>
        </div>
      </div>
    </div>
  )
}