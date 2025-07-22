"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Setup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
      } else {
        setError(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (success) {
    return (
      <div className="container">
        <div className="setup-card">
          <div className="setup-header">
            <div className="icon-container">✓</div>
            <h2 className="title">สำเร็จ!</h2>
            <p className="subtitle">สร้างผู้ใช้ admin เรียบร้อยแล้ว</p>
            <p style={{fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem'}}>
              กำลังไปหน้าเข้าสู่ระบบ...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="setup-card">
        <div className="setup-header">
          <div className="icon-container">👤</div>
          <h1 className="title">ตั้งค่าระบบ</h1>
          <p className="subtitle">สร้างผู้ใช้ admin คนแรก</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">ชื่อ-นามสกุล</label>
            <div className="input-container">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <div className="input-container">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="กรอกอีเมล"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">รหัสผ่าน</label>
            <div className="input-container">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="form-input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">ยืนยันรหัสผ่าน</label>
            <div className="input-container">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="ยืนยันรหัสผ่าน"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <span>👤</span>
                <span>สร้างผู้ใช้ admin</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}