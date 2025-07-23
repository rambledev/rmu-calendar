"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AdminChangePassword() {
  const { data: session, status } = useSession()
  const router = useRouter()
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

  if (status === "loading") {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    router.push("/auth/signin")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    // Validation
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })
        setTimeout(() => {
          router.push("/admin")
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

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <div className="icon-container">🔐</div>
            <div className="admin-info">
              <h1>เปลี่ยนรหัสผ่าน Admin</h1>
              <p>เปลี่ยนรหัสผ่านของคุณ</p>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/admin")}
            className="back-to-dashboard"
          >
            ← กลับสู่แดชบอร์ด
          </button>
        </div>
      </header>

      <div className="admin-content">
        <div className="change-password-container">
          <div className="change-password-card">
            <h2>เปลี่ยนรหัสผ่าน Admin</h2>
            
            {success && (
              <div className="success-message">
                <p>✅ เปลี่ยนรหัสผ่านสำเร็จ! กำลังเปลี่ยนเส้นทาง...</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Current Password */}
              <div className="form-group">
                <label className="form-label">รหัสผ่านปัจจุบัน</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                    required
                    className="form-input"
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({
                      ...prev,
                      current: !prev.current
                    }))}
                    className="password-toggle"
                  >
                    {showPasswords.current ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">รหัสผ่านใหม่</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                    required
                    className="form-input"
                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({
                      ...prev,
                      new: !prev.new
                    }))}
                    className="password-toggle"
                  >
                    {showPasswords.new ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">ยืนยันรหัสผ่านใหม่</label>
                <div className="password-input-container">
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                    required
                    className="form-input"
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({
                      ...prev,
                      confirm: !prev.confirm
                    }))}
                    className="password-toggle"
                  >
                    {showPasswords.confirm ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <p>❌ {error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => router.push("/admin")}
                  className="cancel-button"
                >
                  ยกเลิก
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="submit-button"
                >
                  {loading ? (
                    <div className="button-loading">
                      <div className="spinner"></div>
                      <span>กำลังเปลี่ยน...</span>
                    </div>
                  ) : (
                    <>
                      <span>🔐</span>
                      <span>เปลี่ยนรหัสผ่าน</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .change-password-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .change-password-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .change-password-card h2 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          text-align: center;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .password-input-container {
          position: relative;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          padding-right: 3rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .password-toggle {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.25rem;
          color: #6b7280;
          padding: 0.25rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .password-toggle:hover {
          background: #f3f4f6;
        }

        .success-message {
          background: #d1fae5;
          border: 1px solid #a7f3d0;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .success-message p {
          margin: 0;
          color: #065f46;
          font-weight: 500;
        }

        .error-message {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .error-message p {
          margin: 0;
          color: #991b1b;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .cancel-button {
          flex: 1;
          padding: 0.75rem 1.5rem;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .cancel-button:hover {
          background: #e5e7eb;
        }

        .submit-button {
          flex: 1;
          padding: 0.75rem 1.5rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .submit-button:hover:not(:disabled) {
          background: #b91c1c;
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .button-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .back-to-dashboard {
          background: #6b7280;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .back-to-dashboard:hover {
          background: #4b5563;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* เพิ่ม CSS สำหรับ header และ container */
        .admin-container {
          min-height: 100vh;
          background: #f9fafb;
        }

        .admin-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .admin-header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .icon-container {
          width: 48px;
          height: 48px;
          background: #dc2626;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .admin-info h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        .admin-info p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .admin-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: #f9fafb;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #dc2626;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .admin-header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .form-actions {
            flex-direction: column;
          }

          .change-password-container {
            padding: 1rem;
          }

          .change-password-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}