"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import Image from "next/image"

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  location: string
  organizer: string
  createdAt: string
  updatedAt?: string
  userId?: string
  user?: {
    name: string | null
    email: string
  } | null
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  backgroundColor: string
  borderColor: string
  extendedProps: {
    description: string | null
    location: string
    organizer: string
    status: string
  }
}

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string>("")
  
  // เพิ่ม state สำหรับ Embed Modal
  const [showEmbedModal, setShowEmbedModal] = useState(false)
  const [embedOptions, setEmbedOptions] = useState({
    theme: 'light',
    view: 'dayGridMonth',
    showHeader: true,
    width: '100%',
    height: '600'
  })

  useEffect(() => {
    console.log("🔄 Calendar page mounted, fetching events...")
    fetchEvents()
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchEvents = async () => {
    try {
      console.log("🔄 Fetching events...")
      const response = await fetch("/api/allevents")
      console.log("📡 Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Events received:", data.length, "events")
        setEvents(data)
        setError("")
      } else {
        const errorText = await response.text()
        console.error("❌ Response error:", errorText)
        setError(`Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("❌ Fetch error:", error)
      setError(`Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) {
      return "upcoming"
    } else if (now >= start && now <= end) {
      return "ongoing"
    } else {
      return "completed"
    }
  }

  const getEventColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return { backgroundColor: "#3b82f6", borderColor: "#2563eb" }
      case "ongoing":
        return { backgroundColor: "#22c55e", borderColor: "#16a34a" }
      case "completed":
        return { backgroundColor: "#6b7280", borderColor: "#4b5563" }
      default:
        return { backgroundColor: "#3b82f6", borderColor: "#2563eb" }
    }
  }

  const calendarEvents: CalendarEvent[] = events.map(event => {
    const status = getEventStatus(event.startDate, event.endDate)
    const colors = getEventColor(status)
    
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    
    return {
      id: event.id,
      title: event.title,
      start: startDate,
      end: endDate,
      backgroundColor: colors.backgroundColor,
      borderColor: colors.borderColor,
      extendedProps: {
        description: event.description,
        location: event.location,
        organizer: event.organizer,
        status: status
      }
    }
  })

  const handleEventClick = (clickInfo: { event: { id: string } }) => {
    const event = events.find(e => e.id === clickInfo.event.id)
    if (event) {
      setSelectedEvent(event)
      setShowModal(true)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "upcoming":
        return "ยังไม่ถึงวันจัดกิจกรรม"
      case "ongoing":
        return "อยู่ระหว่างจัดกิจกรรม"
      case "completed":
        return "จัดกิจกรรมแล้ว"
      default:
        return ""
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "status-badge upcoming"
      case "ongoing":
        return "status-badge ongoing"
      case "completed":
        return "status-badge completed"
      default:
        return "status-badge upcoming"
    }
  }

  const shareEvent = (event: Event, platform: string) => {
    const eventUrl = `${window.location.origin}?event=${event.id}`
    const text = `🎉 ${event.title}\n📅 ${formatDate(event.startDate)} - ${formatDate(event.endDate)}\n📍 ${event.location}\n👥 จัดโดย: ${event.organizer}`
    
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(text)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(eventUrl)}`, '_blank')
        break
      case 'line':
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(text)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(`${text}\n\n${eventUrl}`)
        alert('คัดลอกลิงก์แล้ว!')
        break
    }
  }

  // ฟังก์ชันสร้าง embed code
  const generateEmbedCode = (event?: Event | null) => {
    const baseUrl = window.location.origin
    const params = new URLSearchParams({
      theme: embedOptions.theme,
      view: embedOptions.view,
      header: embedOptions.showHeader.toString(),
      height: embedOptions.height
    })
    
    if (event) {
      params.append('event', event.id)
    }
    
    const embedUrl = `${baseUrl}/embed?${params.toString()}`
    
    return `<iframe src="${embedUrl}" width="${embedOptions.width}" height="${embedOptions.height}" frameborder="0" scrolling="no" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`
  }

  // Component สำหรับ Embed Modal
  const EmbedModal = ({ isOpen, onClose, event }: { 
    isOpen: boolean
    onClose: () => void
    event?: Event | null 
  }) => {
    const [embedCode, setEmbedCode] = useState('')
    const [previewUrl, setPreviewUrl] = useState('')
    
    useEffect(() => {
      if (isOpen) {
        const code = generateEmbedCode(event)
        setEmbedCode(code)
        
        const baseUrl = window.location.origin
        const params = new URLSearchParams({
          theme: embedOptions.theme,
          view: embedOptions.view,
          header: embedOptions.showHeader.toString(),
          height: embedOptions.height
        })
        
        if (event) {
          params.append('event', event.id)
        }
        
        setPreviewUrl(`${baseUrl}/embed?${params.toString()}`)
      }
    }, [isOpen, embedOptions, event])
    
    const copyEmbedCode = () => {
      navigator.clipboard.writeText(embedCode)
      alert('คัดลอก Embed Code แล้ว!')
    }
    
    if (!isOpen) return null
    
    return (
      <div className="embed-modal-overlay">
        <div className="embed-modal-container">
          <div className="embed-modal-header">
            <h3>🔗 Embed Calendar {event ? `- ${event.title}` : ''}</h3>
            <button onClick={onClose} className="close-button">×</button>
          </div>
          
          <div className="embed-modal-body">
            <div className="embed-options">
              <h4>🎨 ตัวเลือกการแสดงผล</h4>
              
              <div className="option-group">
                <label>🎭 Theme:</label>
                <select 
                  value={embedOptions.theme} 
                  onChange={(e) => setEmbedOptions({...embedOptions, theme: e.target.value})}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>📅 มุมมอง:</label>
                <select 
                  value={embedOptions.view} 
                  onChange={(e) => setEmbedOptions({...embedOptions, view: e.target.value})}
                >
                  <option value="dayGridMonth">รายเดือน</option>
                  <option value="timeGridWeek">รายสัปดาห์</option>
                </select>
              </div>
              
              <div className="option-group">
                <label>📏 ความกว้าง:</label>
                <input 
                  type="text" 
                  value={embedOptions.width}
                  onChange={(e) => setEmbedOptions({...embedOptions, width: e.target.value})}
                  placeholder="100% หรือ 800px"
                />
              </div>
              
              <div className="option-group">
                <label>📐 ความสูง:</label>
                <input 
                  type="text" 
                  value={embedOptions.height}
                  onChange={(e) => setEmbedOptions({...embedOptions, height: e.target.value})}
                  placeholder="600"
                />
              </div>
              
              <div className="option-group">
                <label>
                  <input 
                    type="checkbox" 
                    checked={embedOptions.showHeader}
                    onChange={(e) => setEmbedOptions({...embedOptions, showHeader: e.target.checked})}
                  />
                  แสดงหัวเรื่อง
                </label>
              </div>
            </div>
            
            <div className="embed-preview">
              <h4>👁️ ตัวอย่าง</h4>
              <div className="preview-container">
                <iframe 
                  src={previewUrl}
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
            </div>
            
            <div className="embed-code">
              <h4>💻 Embed Code</h4>
              <div className="code-container">
                <textarea 
                  value={embedCode}
                  readOnly
                  rows={4}
                  className="code-textarea"
                />
                <div className="code-actions">
                  <button onClick={copyEmbedCode} className="copy-code-btn">
                    📋 คัดลอกโค้ด
                  </button>
                  <a 
                    href={previewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="preview-btn"
                  >
                    🔗 เปิดในหน้าใหม่
                  </a>
                </div>
              </div>
            </div>
            
            <div className="embed-instructions">
              <h4>📖 วิธีใช้งาน</h4>
              <ol>
                <li>คัดลอกโค้ด HTML ด้านบน</li>
                <li>นำไปวางในเว็บไซต์ของคุณ (Laravel, WordPress, หรือ HTML ธรรมดา)</li>
                <li>ปฏิทินจะแสดงผลในเว็บไซต์ของคุณโดยอัตโนมัติ</li>
                <li>ข้อมูลจะอัปเดตแบบ Real-time จากระบบหลัก</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    )
  }

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
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-header-content">
          {/* Logo and Title */}
          <div className="calendar-logo-section">
            <div className="calendar-logo">
              <Image
                src="/logo_rmu.png"
                alt="โลโก้มหาวิทยาลัยราชภัฏมหาสารคาม"
                width={60}
                height={60}
                className="logo-image"
              />
            </div>
            <div className="calendar-title-section">
              <h1 className="calendar-title">ปฏิทินกิจกรรม</h1>
              <p className="calendar-subtitle">มหาวิทยาลัยราชภัฏมหาสารคาม</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="calendar-actions">
            <button
              onClick={() => setShowEmbedModal(true)}
              className="embed-full-calendar-btn"
            >
              🔗 Share ปฏิทิน
            </button>
            
            {/* Navigation Buttons */}
            
            
            {/* Admin Login Button */}
            {status === "unauthenticated" && (
              <button
                onClick={() => router.push("/auth/signin")}
                className="admin-login-btn"
              >
                🔐 Admin Login
              </button>
            )}
            
            {/* User Info for logged in users */}
            {status === "authenticated" && (
              <div className="user-info">
                <span>สวัสดี, {session?.user?.name}</span>
                <span className="user-role">({session?.user?.role})</span>
                <button
                  onClick={() => {
                    switch (session?.user?.role) {
                      case "ADMIN":
                        router.push("/admin")
                        break
                      case "CIO":
                        router.push("/cio")
                        break
                      case "SUPERADMIN":
                        router.push("/super-admin")
                        break
                    }
                  }}
                  className="dashboard-btn"
                >
                  📊 Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="calendar-content">
        {events.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h3>ไม่มีข้อมูลกิจกรรม</h3>
            <p>ยังไม่มีกิจกรรมที่จัดขึ้น</p>
            {status === "authenticated" && (
              <button
                onClick={() => {
                  switch (session?.user?.role) {
                    case "ADMIN":
                      router.push("/admin")
                      break
                    case "CIO":
                      router.push("/cio")
                      break
                    case "SUPERADMIN":
                      router.push("/super-admin")
                      break
                  }
                }}
                className="create-event-btn"
              >
                ➕ สร้างกิจกรรมใหม่
              </button>
            )}
          </div>
        )}
        
        {events.length > 0 && (
          <FullCalendar
  plugins={[dayGridPlugin]}  // เอา timeGridPlugin ออก
  initialView="dayGridMonth"
  locale="th"
  headerToolbar={{
    left: 'prev,next',        // เอา today ออก
    center: 'title',
    right: ''                 // เอาปุ่มทั้งหมดออก
  }}
  // เอา buttonText ออกได้เลย เพราะไม่มีปุ่มแล้ว
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
  eventTimeFormat={{
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }}
  eventTextColor="#ffffff"
  titleFormat={isMobile ? 
    { year: 'numeric', month: 'short' } : 
    { year: 'numeric', month: 'long' }
  }
  eventDidMount={(info) => {
    const timeElement = info.el.querySelector('.fc-event-time')
    if (timeElement && timeElement.textContent) {
      const timeText = timeElement.textContent.trim()
      if (timeText && !timeText.includes('น.')) {
        timeElement.textContent = timeText + ' น.'
      }
    }
    info.el.classList.add('custom-thai-event')
  }}
/>
        )}
      </div>

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <div className="event-form-overlay">
          <div className="event-detail-modal">
            <div className="event-detail-header">
              <h3 className="event-detail-title">{selectedEvent.title}</h3>
              <button onClick={() => setShowModal(false)} className="close-button">×</button>
            </div>

            <div className="event-detail-content">
              <div style={{marginBottom: '1rem', textAlign: 'center'}}>
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
                  <strong>เริ่ม:</strong> {formatDate(selectedEvent.startDate)}<br/>
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
                  <button onClick={() => shareEvent(selectedEvent, 'facebook')} className="share-button facebook">
                    📘 Facebook
                  </button>
                  <button onClick={() => shareEvent(selectedEvent, 'twitter')} className="share-button twitter">
                    🐦 Twitter
                  </button>
                  <button onClick={() => shareEvent(selectedEvent, 'line')} className="share-button line">
                    💚 Line
                  </button>
                  <button onClick={() => shareEvent(selectedEvent, 'copy')} className="share-button copy">
                    📋 คัดลอกลิงก์
                  </button>
                  <button
                    onClick={() => {
                      setShowModal(false)
                      setShowEmbedModal(true)
                    }}
                    className="share-button embed"
                  >
                    🔗 Embed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embed Modal */}
      {showEmbedModal && (
        <EmbedModal 
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          event={selectedEvent}
        />
      )}

      <style jsx global>{`
        .custom-thai-event .fc-event-time {
          font-weight: 600;
          font-size: 0.875rem;
          margin-right: 0.25rem;
          color: #ffffff;
        }

        .custom-thai-event .fc-event-title {
          font-weight: 500;
          line-height: 1.2;
        }

        .custom-thai-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.875rem;
        }

        @media (max-width: 768px) {
          .custom-thai-event .fc-event-time {
            font-size: 0.75rem;
          }
          
          .custom-thai-event .fc-event-title {
            font-size: 0.75rem;
          }
        }

        .calendar-container {
          min-height: 100vh;
          background: #f9fafb;
        }

        .calendar-header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 1rem 0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .calendar-header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .calendar-logo-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .calendar-logo {
          flex-shrink: 0;
        }

        .logo-image {
          border-radius: 8px;
        }

        .calendar-title-section {
          flex: 1;
        }

        .calendar-title {
          margin: 0;
          font-size: 1.875rem;
          font-weight: 700;
          color: #111827;
          line-height: 1.2;
        }

        .calendar-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 1rem;
          margin-top: 0.25rem;
        }

        .calendar-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .calendar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .embed-full-calendar-btn {
          padding: 0.75rem 1.5rem;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .embed-full-calendar-btn:hover {
          background: #7c3aed;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }

        .nav-btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-btn.home {
          background: #22c55e;
          color: white;
        }

        .nav-btn.home:hover {
          background: #16a34a;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .admin-login-btn {
          padding: 0.75rem 1.5rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .admin-login-btn:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          color: #374151;
          font-size: 0.875rem;
          gap: 0.5rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .dashboard-btn {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .dashboard-btn:hover {
          background: #2563eb;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #374151;
        }

        .empty-state p {
          margin: 0 0 2rem 0;
          color: #6b7280;
          font-size: 1rem;
        }

        .create-event-btn {
          padding: 1rem 2rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .create-event-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #f9fafb;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #f9fafb;
          text-align: center;
          padding: 2rem;
        }

        .event-form-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .event-detail-modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .event-detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .event-detail-title {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .event-detail-content {
          padding: 1.5rem;
        }

        .event-detail-section {
          margin-bottom: 1.5rem;
        }

        .event-detail-label {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #374151;
        }

        .event-detail-text {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          display: inline-block;
        }

        .status-badge.upcoming {
          background: #fef3c7;
          color: #d97706;
        }

        .status-badge.ongoing {
          background: #d1fae5;
          color: #059669;
        }

        .status-badge.completed {
          background: #e0e7ff;
          color: #5b21b6;
        }

        .share-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .share-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          color: white;
        }

        .share-button.facebook {
          background: #1877f2;
        }

        .share-button.facebook:hover {
          background: #166fe5;
        }

        .share-button.twitter {
          background: #1da1f2;
        }

        .share-button.twitter:hover {
          background: #1a91da;
        }

        .share-button.line {
          background: #00c300;
        }

        .share-button.line:hover {
          background: #00b300;
        }

        .share-button.copy {
          background: #6b7280;
        }

        .share-button.copy:hover {
          background: #4b5563;
        }

        .share-button.embed {
          background: #8b5cf6;
        }

        .share-button.embed:hover {
          background: #7c3aed;
        }

        .embed-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }

        .embed-modal-container {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalSlideIn 0.3s ease-out;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .embed-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px 12px 0 0;
        }

        .embed-modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
        }

        .embed-modal-body {
          padding: 1.5rem;
        }

        .embed-options {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .embed-options h4 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .option-group {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .option-group label {
          min-width: 100px;
          font-weight: 500;
          color: #374151;
        }

        .option-group select,
        .option-group input[type="text"] {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .option-group input[type="checkbox"] {
          margin-right: 0.5rem;
        }

        .embed-preview {
          margin-bottom: 2rem;
        }

        .embed-preview h4 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .preview-container {
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          padding: 1rem;
          background: #f9fafb;
        }

        .embed-code {
          margin-bottom: 2rem;
        }

        .embed-code h4 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .code-container {
          position: relative;
        }

        .code-textarea {
          width: 100%;
          padding: 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875rem;
          background: #f8fafc;
          resize: vertical;
          line-height: 1.5;
        }

        .code-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .copy-code-btn,
        .preview-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          display: inline-block;
          transition: all 0.2s;
        }

        .copy-code-btn {
          background: #3b82f6;
          color: white;
        }

        .copy-code-btn:hover {
          background: #2563eb;
        }

        .preview-btn {
          background: #10b981;
          color: white;
        }

        .preview-btn:hover {
          background: #059669;
        }

        .embed-instructions {
          background: #fef3c7;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid #f59e0b;
        }

        .embed-instructions h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #92400e;
        }

        .embed-instructions ol {
          margin: 0;
          padding-left: 1.5rem;
          color: #92400e;
        }

        .embed-instructions li {
          margin-bottom: 0.25rem;
        }

        @media (max-width: 768px) {
          .calendar-header-content {
            flex-direction: column;
            text-align: center;
          }

          .calendar-logo-section {
            flex-direction: column;
            text-align: center;
          }

          .calendar-title {
            font-size: 1.5rem;
          }

          .calendar-subtitle {
            font-size: 0.875rem;
          }

          .calendar-content {
            padding: 1rem;
          }

          .calendar-actions {
            flex-direction: column;
            width: 100%;
          }

          .embed-full-calendar-btn,
          .admin-login-btn,
          .nav-btn {
            width: 100%;
            justify-content: center;
          }

          .user-info {
            align-items: center;
            text-align: center;
          }

          .event-detail-modal {
            margin: 0.5rem;
            max-height: 90vh;
          }

          .event-detail-header,
          .event-detail-content {
            padding: 1rem;
          }

          .share-buttons {
            flex-direction: column;
          }

          .share-button {
            width: 100%;
          }

          .embed-modal-container {
            margin: 0.5rem;
          }

          .option-group {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .option-group label {
            min-width: auto;
          }

          .option-group select,
          .option-group input[type="text"] {
            width: 100%;
          }

          .code-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}