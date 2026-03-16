// src/app/auth/signin/page.tsx
import { signinAction } from "./action"

export default function SignIn({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string }
}) {
  const error = searchParams?.error

  const errorMessage =
    error === "missing" ? "กรุณากรอก Email และ Password" :
    error === "invalid" ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" :
    error === "server" ? "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" : null

  return (
    <div className="container">
      <div className="signin-card">
        <div className="signin-header">
          <div className="icon-container">🔐</div>
          <h1 className="title">เข้าสู่ระบบผู้ดูแล</h1>
          <p className="subtitle">ระบบจัดการปฏิทินกิจกรรม มรม.</p>
        </div>

        <form action={signinAction}>
          <div className="form-group">
            <label className="form-label">อีเมล</label>
            <input
              type="email"
              name="email"
              required
              className="form-input"
              placeholder="กรอกอีเมลของคุณ"
              style={{ paddingLeft: "1rem" }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">รหัสผ่าน</label>
            <input
              type="password"
              name="password"
              required
              className="form-input"
              placeholder="กรอกรหัสผ่านของคุณ"
              style={{ paddingLeft: "1rem" }}
            />
          </div>

          {errorMessage && <div className="error-message">{errorMessage}</div>}

          <button type="submit" className="submit-button">
            <span>🔐</span>
            <span>เข้าสู่ระบบ</span>
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