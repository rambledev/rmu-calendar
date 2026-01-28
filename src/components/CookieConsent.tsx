"use client"

import { useEffect, useState } from "react"

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    // เช็คว่า user เคย accept cookies แล้วหรือยัง
    const consent = localStorage.getItem("cookieConsent")
    if (!consent) {
      setShowConsent(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookieConsent", "accepted")
    setShowConsent(false)
  }

  const rejectCookies = () => {
    localStorage.setItem("cookieConsent", "rejected")
    setShowConsent(false)
    alert("⚠️ หากไม่อนุญาตให้ใช้ Cookies คุณจะไม่สามารถเข้าสู่ระบบได้")
  }

  if (!showConsent) return null

  return (
    <>
      {/* Backdrop */}
      <div className="cookie-backdrop" />
      
      {/* Consent Popup */}
      <div className="cookie-consent">
        <div className="cookie-content">
          <div className="cookie-icon">🍪</div>
          <h3 className="cookie-title">เว็บไซต์นี้ใช้ Cookies</h3>
          <p className="cookie-text">
            เราใช้ cookies เพื่อให้คุณสามารถเข้าสู่ระบบและใช้งานได้อย่างปลอดภัย 
            ระบบจะจดจำการเข้าสู่ระบบของคุณผ่าน cookies ที่เข้ารหัสแล้ว
          </p>
          <div className="cookie-details">
            <p><strong>ข้อมูลที่เก็บ:</strong></p>
            <ul>
              <li>🔐 Session token (สำหรับการเข้าสู่ระบบ)</li>
              <li>👤 ข้อมูลผู้ใช้พื้นฐาน (อีเมล, ชื่อ, สิทธิ์การใช้งาน)</li>
              <li>⏰ ระยะเวลา: 30 วัน (หรือจนกว่าจะออกจากระบบ)</li>
            </ul>
          </div>
          <div className="cookie-buttons">
            <button onClick={acceptCookies} className="cookie-accept">
              ยอมรับทั้งหมด
            </button>
            <button onClick={rejectCookies} className="cookie-reject">
              ปฏิเสธ
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cookie-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 9998;
          animation: fadeIn 0.3s ease-in-out;
        }

        .cookie-consent {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          max-width: 600px;
          width: calc(100% - 40px);
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          z-index: 9999;
          animation: slideUp 0.3s ease-in-out;
        }

        .cookie-content {
          padding: 2rem;
        }

        .cookie-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .cookie-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 0.75rem;
          text-align: center;
        }

        .cookie-text {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 1rem;
          text-align: center;
        }

        .cookie-details {
          background: #f3f4f6;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .cookie-details p {
          color: #374151;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .cookie-details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .cookie-details li {
          color: #6b7280;
          padding: 0.25rem 0;
          font-size: 0.9rem;
        }

        .cookie-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .cookie-accept {
          flex: 1;
          padding: 0.875rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 1rem;
        }

        .cookie-accept:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .cookie-reject {
          flex: 1;
          padding: 0.875rem 2rem;
          background: white;
          color: #6b7280;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          font-size: 1rem;
        }

        .cookie-reject:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .cookie-consent {
            bottom: 0;
            left: 0;
            right: 0;
            transform: none;
            width: 100%;
            border-radius: 16px 16px 0 0;
            max-width: none;
          }

          .cookie-content {
            padding: 1.5rem;
          }

          .cookie-buttons {
            flex-direction: column;
          }

          .cookie-accept,
          .cookie-reject {
            width: 100%;
          }
        }
      `}</style>
    </>
  )
}