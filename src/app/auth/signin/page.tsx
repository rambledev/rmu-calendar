// src/app/auth/signin/page.tsx
"use client"

import { useState } from "react"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    console.log(`[SignIn] handleSubmit START email=${email}`)

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      console.log(`[SignIn] handleSubmit response status=${res.status}`)

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.log(`[SignIn] handleSubmit error=${data.error}`)
        setError(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
        return
      }

      const data = await res.json()
      console.log(`[SignIn] handleSubmit SUCCESS role=${data.role}`)

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
    } catch (err) {
      console.error(`[SignIn] handleSubmit ERROR:`, err)
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