// src/app/calendar/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import Image from "next/image"

interface Event {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  location: string
  organizer: string
  color?: string
}

interface CurrentUser {
  id: string
  email: string
  role: string
}

export default function CalendarPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [embedOptions, setEmbedOptions] = useState({
    width: "100%",
    height: "600",
    showHeader: true,
  })

  useEffect(() => {
    setIsMobile(window.innerWidth < 768)
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    fetch("/api/me")
      .then(res => res.ok ? res.json() : null)
      .then(data => setCurrentUser(data))
      .catch(() => setCurrentUser(null))
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/allevents")
      const data = await res.json()
      setEvents(data)
    } catch {
      setError("ไม่สามารถโหลดข้อมูลได้")
    } finally {
      setLoading(false)
    }
  }

  const calendarEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: e.endDate,
    backgroundColor: e.color || "#3b82f6",
    borderColor: e.color || "#3b82f6",
    extendedProps: e,
  }))

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event.extendedProps)
    setShowModal(true)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("th-TH", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  const getEventStatus = (start: string, end: string) => {
    const now = new Date()
    if (new Date(start) > now) return "upcoming"
    if (new Date(end) < now) return "completed"
    return "ongoing"
  }

  const getStatusText = (status: string) => {
    if (status === "upcoming") return "🕐 กำลังจะมาถึง"
    if (status === "ongoing") return "🟢 กำลังดำเนินการ"
    return "✅ เสร็จสิ้น"
  }

  const getStatusColor = (status: string) => {
    if (status === "upcoming") return "status-badge upcoming"
    if (status === "ongoing") return "status-badge ongoing"
    return "status-badge completed"
  }

  const getDashboardPath = (role: string) => {
    if (["SUPERADMIN", "SUPER-ADMIN"].includes(role)) return "/super-admin"
    if (role === "ADMIN") return "/admin"
    if (role === "CIO") return "/cio"
    return "/"
  }

  const shareEvent = (event: Event, platform: string) => {
    const url = window.location.href
    const text = `${event.title} - ${formatDate(event.startDate)}`
    if (platform === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`)
    if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
    if (platform === "line") window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`)
    if (platform === "copy") { navigator.clipboard.writeText(url); alert("คัดลอกลิงก์แล้ว") }
  }

  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed" width="${embedOptions.width}" height="${embedOptions.height}" frameborder="0"></iframe>`
  const previewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/embed`
  const copyEmbedCode = () => { navigator.clipboard.writeText(embedCode); alert("คัดลอกโค้ดแล้ว") }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>เกิดข้อผิดพลาด</h2>
        <p>{error}</p>
        <button onClick={fetchEvents}>ลองใหม่</button>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-header-content">
          <div className="calendar-logo-section">
            <div className="calendar-logo">
              <Image src="/logo_rmu.png" alt="โลโก้มหาวิทยาลัยราชภัฏมหาสารคาม" width={60} height={60} className="logo-image" />
            </div>
            <div className="calendar-title-section">
              <h1 className="calendar-title">ปฏิทินกิจกรรม</h1>
              <p className="calendar-subtitle">มหาวิทยาลัยราชภัฏมหาสารคาม</p>
            </div>
          </div>

          <div className="calendar-actions">
            <button onClick={() => setShowEmbedModal(true)} className="embed-full-calendar-btn">
              🔗 Share ปฏิทิน
            </button>

            {!currentUser && (
              <button onClick={() => router.push("/auth/signin")} className="admin-login-btn">
                🔐 Admin Login
              </button>
            )}

            {currentUser && (
              <div className="user-info">
                <span>สวัสดี, {currentUser.email}</span>
                <span className="user-role">({currentUser.role})</span>
                <button onClick={() => router.push(getDashboardPath(currentUser.role))} className="dashboard-btn">
                  📊 Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="calendar-content">
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>ไม่มีข้อมูลกิจกรรม</h3>
            <p>ยังไม่มีกิจกรรมที่จัดขึ้น</p>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            locale="th"
            headerToolbar={{ left: "prev,next", center: "title", right: "" }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height={isMobile ? "auto" : 600}
            aspectRatio={isMobile ? 0.8 : 1.35}
            firstDay={1}
            weekends={true}
            dayMaxEvents={isMobile ? 2 : 3}
            moreLinkText="เพิ่มเติม"
            eventDisplay="block"
            displayEventTime={true}
            eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
            eventTextColor="#ffffff"
            titleFormat={isMobile ? { year: "numeric", month: "short" } : { year: "numeric", month: "long" }}
          />
        )}
      </div>

      {showModal && selectedEvent && (
        <div className="event-form-overlay">
          <div className="event-detail-modal">
            <div className="event-detail-header">
              <h3 className="event-detail-title">{selectedEvent.title}</h3>
              <button onClick={() => setShowModal(false)} className="close-button">×</button>
            </div>
            <div className="event-detail-content">
              <div style={{ marginBottom: "1rem", textAlign: "center" }}>
                <span className={getStatusColor(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}>
                  {getStatusText(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}
                </span>
              </div>
              {selectedEvent.description && (
                <div className="event-detail-section">
                  <h4 className="event-detail-label">📝 รายละเอียด</h4>
                  <p className="event-detail-text">{selectedEvent.description}</p>
                </div>
              )}
              <div className="event-detail-section">
                <h4 className="event-detail-label">📅 วันที่และเวลา</h4>
                <p className="event-detail-text">
                  <strong>เริ่ม:</strong> {formatDate(selectedEvent.startDate)}<br />
                  <strong>สิ้นสุด:</strong> {formatDate(selectedEvent.endDate)}
                </p>
              </div>
              <div className="event-detail-section">
                <h4 className="event-detail-label">📍 สถานที่</h4>
                <p className="event-detail-text">{selectedEvent.location}</p>
              </div>
              <div className="event-detail-section">
                <h4 className="event-detail-label">👥 จัดโดย</h4>
                <p className="event-detail-text">{selectedEvent.organizer}</p>
              </div>
              <div className="event-detail-section">
                <h4 className="event-detail-label">🔗 แชร์กิจกรรม</h4>
                <div className="share-buttons">
                  <button onClick={() => shareEvent(selectedEvent, "facebook")} className="share-button facebook">📘 Facebook</button>
                  <button onClick={() => shareEvent(selectedEvent, "twitter")} className="share-button twitter">🐦 Twitter</button>
                  <button onClick={() => shareEvent(selectedEvent, "line")} className="share-button line">💚 Line</button>
                  <button onClick={() => shareEvent(selectedEvent, "copy")} className="share-button copy">📋 คัดลอกลิงก์</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEmbedModal && (
        <div className="embed-modal-overlay">
          <div className="embed-modal-container">
            <div className="embed-modal-header">
              <h3>🔗 แชร์ปฏิทิน</h3>
              <button onClick={() => setShowEmbedModal(false)} className="close-button">×</button>
            </div>
            <div className="embed-modal-body">
              <div className="embed-options">
                <h4>⚙️ ตั้งค่า</h4>
                <div className="option-group">
                  <label>📏 ความกว้าง:</label>
                  <input type="text" value={embedOptions.width} onChange={(e) => setEmbedOptions({ ...embedOptions, width: e.target.value })} placeholder="100% หรือ 800px" />
                </div>
                <div className="option-group">
                  <label>📐 ความสูง:</label>
                  <input type="text" value={embedOptions.height} onChange={(e) => setEmbedOptions({ ...embedOptions, height: e.target.value })} placeholder="600" />
                </div>
              </div>
              <div className="embed-code">
                <h4>💻 Embed Code</h4>
                <div className="code-container">
                  <textarea value={embedCode} readOnly rows={4} className="code-textarea" />
                  <div className="code-actions">
                    <button onClick={copyEmbedCode} className="copy-code-btn">📋 คัดลอกโค้ด</button>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="preview-btn">🔗 เปิดในหน้าใหม่</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
