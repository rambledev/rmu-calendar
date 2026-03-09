"use client"

import { useState } from "react"
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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        return
      }

      // redirect ตาม role
      const role = data.role as string
      if (["SUPERADMIN", "SUPER-ADMIN"].includes(role)) {
        window.location.href = "/super-admin"
      } else if (role === "ADMIN") {
        window.location.href = "/admin"
      } else if (role === "CIO") {
        window.location.href = "/cio"
      } else {
        window.location.href = "/"
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="signin-card">
        <div className="signin-header">
          <div className="icon-container">🔐</div>
          <h1 className="title">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="subtitle">ระบบจัดการปฏิทินกิจกรรม มรม.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
              placeholder="กรอกอีเมลของคุณ"
              style={{ paddingLeft: "1rem" }}
              disabled={loading}
            />
          </div>

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
                style={{ paddingLeft: "1rem", paddingRight: "3rem" }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
                disabled={loading}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="submit-button">
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

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>
            © 2025 dev:cc มหาวิทยาลัยราชภัฏมหาสารคาม
          </p>
        </div>
      </div>
    </div>
  )
}