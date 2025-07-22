"use client"

import { useState, useEffect } from "react"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
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
      start: startDate, // ใช้ Date object โดยตรง
      end: endDate,     // ใช้ Date object โดยตรง
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

  const handleEventClick = (clickInfo: any) => {
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

  const createTestData = async () => {
    try {
      setLoading(true)
      console.log("🧪 Creating test data...")
      
      const response = await fetch("/api/test-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ ${result.message}`)
        // รีเฟรชข้อมูลหลังจากสร้างเสร็จ
        await fetchEvents()
      } else {
        alert(`❌ Error: ${result.error}`)
        console.error("Test data creation failed:", result)
      }
    } catch (error) {
      console.error("Error creating test data:", error)
      alert("❌ เกิดข้อผิดพลาดในการสร้างข้อมูลทดสอบ")
    } finally {
      setLoading(false)
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
            <button
              onClick={() => router.push("/admin")}
              className="admin-link-button"
            >
              <span>⚙️</span>
              <span>จัดการกิจกรรม</span>
            </button>
          </div>
        </div>
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
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
            initialView={isMobile ? "listWeek" : "dayGridMonth"}
            locale="th"
            headerToolbar={{
              left: isMobile ? 'prev,next' : 'prev,next today',
              center: 'title',
              right: isMobile ? 'listWeek,dayGridMonth' : 'dayGridMonth,timeGridWeek,listWeek'
            }}
            buttonText={{
              today: 'วันนี้',
              month: 'เดือน'
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
            eventTextColor="#ffffff"
            titleFormat={isMobile ? 
              { year: 'numeric', month: 'short' } : 
              { year: 'numeric', month: 'long' }
            }
            eventDidMount={(info) => {
              console.log("🎯 Event mounted:", info.event.title)
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
    </div>
  )
}