"use client"

import { useState, useEffect } from "react"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useRouter } from "next/navigation"
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
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  useEffect(() => {
    console.log("🔄 Component mounted, fetching events...")
    fetchEvents()
    
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // เพิ่ม useEffect เพื่อ debug เมื่อ events เปลี่ยน
  useEffect(() => {
    console.log("🔄 Events state changed:", events)
    console.log("🔄 Events length:", events.length)
  }, [events])

  const fetchEvents = async () => {
    try {
      console.log("🔄 Fetching events...")
      const response = await fetch("/api/events")
      console.log("📡 Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("📊 Received raw data:", data)
        console.log("📊 Data type:", typeof data)
        console.log("📊 Is array:", Array.isArray(data))
        console.log("📊 Data length:", data.length)
        
        if (data.length > 0) {
          console.log("📊 First event raw:", data[0])
          console.log("📊 First event startDate type:", typeof data[0].startDate)
          console.log("📊 First event startDate value:", data[0].startDate)
        }
        
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
    
    console.log("🗓️ Processing event:", event.title)
    console.log("🗓️ Original startDate:", event.startDate, "Type:", typeof event.startDate)
    console.log("🗓️ Original endDate:", event.endDate, "Type:", typeof event.endDate)
    
    // แปลงเป็น Date object โดยตรง
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    
    console.log("🗓️ Converted startDate:", startDate)
    console.log("🗓️ Converted endDate:", endDate)
    console.log("🗓️ StartDate valid:", !isNaN(startDate.getTime()))
    console.log("🗓️ EndDate valid:", !isNaN(endDate.getTime()))
    
    const calendarEvent = {
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
    
    console.log("📅 Created calendar event:", calendarEvent)
    return calendarEvent
  })

  console.log("📅 Calendar events:", calendarEvents)

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
          
          {/* Action Button */}
          <div className="calendar-actions">
            
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div style={{ padding: '10px', backgroundColor: '#f3f4f6', margin: '10px', borderRadius: '8px' }}>
        <p><strong>จำนวน events :</strong> {events.length}</p>
      </div>

      {/* Calendar */}
      <div className="calendar-content">
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h3>ไม่มีข้อมูลกิจกรรม</h3>
            <p>ยังไม่มีกิจกรรมที่จัดขึ้น</p>
            <div style={{ marginTop: '20px' }}>
              <button onClick={fetchEvents} style={{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginRight: '10px'
              }}>
                🔄 รีเฟรชข้อมูล
              </button>
              <button onClick={() => window.location.reload()} style={{
                padding: '10px 20px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}>
                🔄 รีโหลดหน้า
              </button>
            </div>
          </div>
        )}
        
        {events.length > 0 && (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView={isMobile ? "dayGridMonth" : "dayGridMonth"}
            locale="th"
            headerToolbar={{
              left: isMobile ? 'prev,next' : 'prev,next today',
              center: 'title',
              right: isMobile ? 'dayGridMonth' : 'dayGridMonth,timeGridWeek'
            }}
            buttonText={{
              today: 'วันนี้',
              month: 'เดือน',
              week: 'สัปดาห์'
            }}
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
              console.log("🎯 Event mounted:", info.event.title)
              
              // เพิ่ม "น." หลังเวลา
              const timeElement = info.el.querySelector('.fc-event-time')
              if (timeElement && timeElement.textContent) {
                const timeText = timeElement.textContent.trim()
                if (timeText && !timeText.includes('น.')) {
                  timeElement.textContent = timeText + ' น.'
                }
              }
              
              // เพิ่ม custom class สำหรับ styling
              info.el.classList.add('custom-thai-event')
            }}
            eventsSet={(events) => {
              console.log("📋 Events set in calendar:", events.length)
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
              <button onClick={() => setShowModal(false)} className="close-button">
                ×
              </button>
            </div>

            <div className="event-detail-content">
              {/* Status */}
              <div style={{marginBottom: '1rem', textAlign: 'center'}}>
                <span className={getStatusColor(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}>
                  {getStatusText(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}
                </span>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div className="event-detail-section">
                  <h4 className="event-detail-label">📝 รายละเอียด</h4>
                  <p className="event-detail-text">{selectedEvent.description}</p>
                </div>
              )}

              {/* Date & Time */}
              <div className="event-detail-section">
                <h4 className="event-detail-label">📅 วันที่และเวลา</h4>
                <p className="event-detail-text">
                  <strong>เริ่ม:</strong> {formatDate(selectedEvent.startDate)}<br/>
                  <strong>สิ้นสุด:</strong> {formatDate(selectedEvent.endDate)}
                </p>
              </div>

              {/* Location */}
              <div className="event-detail-section">
                <h4 className="event-detail-label">📍 สถานที่</h4>
                <p className="event-detail-text">{selectedEvent.location}</p>
              </div>

              {/* Organizer */}
              <div className="event-detail-section">
                <h4 className="event-detail-label">👥 จัดโดย</h4>
                <p className="event-detail-text">{selectedEvent.organizer}</p>
              </div>

              {/* Share Buttons */}
              <div className="event-detail-section">
                <h4 className="event-detail-label">🔗 แชร์กิจกรรม</h4>
                <div className="share-buttons">
                  <button
                    onClick={() => shareEvent(selectedEvent, 'facebook')}
                    className="share-button facebook"
                  >
                    📘 Facebook
                  </button>
                  <button
                    onClick={() => shareEvent(selectedEvent, 'twitter')}
                    className="share-button twitter"
                  >
                    🐦 Twitter
                  </button>
                  <button
                    onClick={() => shareEvent(selectedEvent, 'line')}
                    className="share-button line"
                  >
                    💚 Line
                  </button>
                  <button
                    onClick={() => shareEvent(selectedEvent, 'copy')}
                    className="share-button copy"
                  >
                    📋 คัดลอกลิงก์
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Custom Thai Event Styling */
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

        /* Improve event readability */
        .custom-thai-event {
          border-radius: 4px;
          padding: 2px 4px;
          font-size: 0.875rem;
        }

        /* Mobile responsive adjustments */
        @media (max-width: 768px) {
          .custom-thai-event .fc-event-time {
            font-size: 0.75rem;
          }
          
          .custom-thai-event .fc-event-title {
            font-size: 0.75rem;
          }
        }

        /* Calendar container styling */
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

        /* Loading and Error States */
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

        /* Modal Styles */
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

        /* Status Badges */
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

        /* Share Buttons */
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

        /* Mobile Responsive */
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
        }
      `}</style>
    </div>
  )
}