// src/app/admin/change-password/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminChangePassword() {
  const router = useRouter()
  const [authLoading, setAuthLoading] = useState(true)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    fetch("/api/me")
      .then(res => {
        if (!res.ok) router.push("/auth/signin")
        else setAuthLoading(false)
      })
      .catch(() => router.push("/auth/signin"))
  }, [router])

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    if (formData.newPassword !== formData.confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน")
      setLoading(false)
      return
    }

    if (formData.newPassword.length < 6) {
      setError("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
        setTimeout(() => router.push("/admin"), 2000)
      } else {
        setError(data.error || "เกิดข้อผิดพลาด")
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <div className="icon-container">🔐</div>
            <div className="admin-info">
              <h1>เปลี่ยนรหัสผ่าน Admin</h1>
              <p>เปลี่ยนรหัสผ่านของคุณ</p>
            </div>
          </div>
          <button onClick={() => router.push("/admin")} className="back-to-dashboard">
            ← กลับสู่แดชบอร์ด
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="change-password-container">
          <div className="change-password-card">
            <h2>เปลี่ยนรหัสผ่าน</h2>

            {success && (
              <div className="success-message">
                <p>✅ เปลี่ยนรหัสผ่านสำเร็จ! กำลังเปลี่ยนเส้นทาง...</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">รหัสผ่านปัจจุบัน</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required className="form-input" placeholder="กรอกรหัสผ่านปัจจุบัน"
                  />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))} className="password-toggle">
                    {showPasswords.current ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">รหัสผ่านใหม่</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required className="form-input" placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))} className="password-toggle">
                    {showPasswords.new ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required className="form-input" placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  />
                  <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))} className="password-toggle">
                    {showPasswords.confirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {error && <div className="error-message"><p>❌ {error}</p></div>}

              <div className="form-actions">
                <button type="button" onClick={() => router.push("/admin")} className="cancel-button">ยกเลิก</button>
                <button type="submit" disabled={loading} className="submit-button">
                  {loading ? <span>กำลังเปลี่ยน...</span> : <span>🔐 เปลี่ยนรหัสผ่าน</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
