"use client"

import { useState, useEffect } from "react"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import { useSearchParams } from 'next/navigation'
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

export default function EmbedCalendarPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string>("")
  
  const searchParams = useSearchParams()
  
  // รับ parameters จาก URL
  const theme = searchParams.get('theme') || 'light' // light, dark
  const view = searchParams.get('view') || 'dayGridMonth' // dayGridMonth, timeGridWeek
  const showHeader = searchParams.get('header') !== 'false'
  const height = searchParams.get('height') || '600'
  const eventId = searchParams.get('event') // แสดงเฉพาะ event ที่ระบุ

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        // ถ้าระบุ eventId ให้แสดงเฉพาะ event นั้น
        const filteredEvents = eventId 
          ? data.filter((event: Event) => event.id === eventId)
          : data
        setEvents(filteredEvents)
        setError("")
      } else {
        const errorText = await response.text()
        setError(`Error: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      setError(`Network error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return "upcoming"
    else if (now >= start && now <= end) return "ongoing"
    else return "completed"
  }

  const getEventColor = (status: string) => {
    const colors = {
      upcoming: { backgroundColor: "#3b82f6", borderColor: "#2563eb" },
      ongoing: { backgroundColor: "#22c55e", borderColor: "#16a34a" },
      completed: { backgroundColor: "#6b7280", borderColor: "#4b5563" }
    }
    return colors[status as keyof typeof colors] || colors.upcoming
  }

  const calendarEvents: CalendarEvent[] = events.map(event => {
    const status = getEventStatus(event.startDate, event.endDate)
    const colors = getEventColor(status)
    
    return {
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
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

  if (loading) {
    return (
      <div className="embed-loading">
        <div className="loading-spinner"></div>
        <p>กำลังโหลด...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="embed-error">
        <h3>เกิดข้อผิดพลาด</h3>
        <p>{error}</p>
        <button onClick={fetchEvents} className="retry-btn">ลองใหม่</button>
      </div>
    )
  }

  return (
    <div className={`embed-container ${theme}`} style={{ height: `${height}px` }}>
      {showHeader && (
        <div className="embed-header">
          <div className="embed-header-content">
            <div className="embed-logo">
              <Image
                src="/logo_rmu.png"
                alt="โลโก้มหาวิทยาลัยราชภัฏมหาสารคาม"
                width={40}
                height={40}
                className="logo-image"
              />
            </div>
            <div className="embed-title">
              <h3>ปฏิทินกิจกรรม - มหาวิทยาลัยราชภัฏมหาสารคาม</h3>
            </div>
          </div>
        </div>
      )}
      
      <div className="embed-calendar" style={{ height: showHeader ? `calc(100% - 80px)` : '100%' }}>
        {events.length === 0 ? (
          <div className="no-events">
            <h4>ไม่มีข้อมูลกิจกรรม</h4>
            <p>ยังไม่มีกิจกรรมที่จัดขึ้น</p>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin]}
            initialView={view as any}
            locale="th"
            headerToolbar={{
              left: 'prev,next',
              center: 'title',
              right: view === 'timeGridWeek' ? 'dayGridMonth,timeGridWeek' : 'dayGridMonth'
            }}
            buttonText={{
              today: 'วันนี้',
              month: 'เดือน',
              week: 'สัปดาห์'
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            height="100%"
            aspectRatio={1.35}
            firstDay={1}
            weekends={true}
            dayMaxEvents={3}
            moreLinkText="เพิ่มเติม"
            eventDisplay="block"
            displayEventTime={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventTextColor="#ffffff"
            eventDidMount={(info) => {
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
          />
        )}
      </div>

      {/* Event Detail Modal for Embed */}
      {showModal && selectedEvent && (
        <div className="embed-modal-overlay">
          <div className="embed-modal">
            <div className="embed-modal-header">
              <h4>{selectedEvent.title}</h4>
              <button onClick={() => setShowModal(false)} className="close-btn">×</button>
            </div>
            <div className="embed-modal-content">
              {/* Status */}
              <div className="status-section">
                <span className={getStatusColor(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}>
                  {getStatusText(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}
                </span>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div className="detail-section">
                  <strong>📝 รายละเอียด:</strong>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              {/* Date & Time */}
              <div className="detail-section">
                <strong>📅 วันที่และเวลา:</strong>
                <p>
                  <strong>เริ่ม:</strong> {formatDate(selectedEvent.startDate)}<br/>
                  <strong>สิ้นสุด:</strong> {formatDate(selectedEvent.endDate)}
                </p>
              </div>

              {/* Location */}
              <div className="detail-section">
                <strong>📍 สถานที่:</strong> {selectedEvent.location}
              </div>

              {/* Organizer */}
              <div className="detail-section">
                <strong>👥 จัดโดย:</strong> {selectedEvent.organizer}
              </div>

              {/* Link to full site */}
              <div className="detail-section">
                <a 
                  href={`${window.location.origin}?event=${selectedEvent.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-full-btn"
                >
                  🔗 ดูรายละเอียดเพิ่มเติม
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* Embed Container Styles */
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 0;
          font-family: 'Sarabun', 'Segoe UI', 'Roboto', sans-serif;
        }

        .embed-container {
          width: 100%;
          height: 100%;
          overflow: hidden;
          position: relative;
        }

        .embed-container.light {
          background: #ffffff;
          color: #1f2937;
        }

        .embed-container.dark {
          background: #1f2937;
          color: #f9fafb;
        }

        /* Header Styles */
        .embed-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
        }

        .embed-container.dark .embed-header {
          background: #374151;
          border-bottom-color: #4b5563;
        }

        .embed-header-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: center;
        }

        .embed-logo {
          flex-shrink: 0;
        }

        .logo-image {
          border-radius: 6px;
        }

        .embed-title h3 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
          text-align: center;
        }

        /* Calendar Styles */
        .embed-calendar {
          padding: 1rem;
          overflow: hidden;
        }

        /* Loading States */
        .embed-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f9fafb;
        }

        .embed-container.dark .embed-loading {
          background: #1f2937;
          color: #f9fafb;
        }

        .loading-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 0.5rem;
        }

        .embed-container.dark .loading-spinner {
          border-color: #4b5563;
          border-top-color: #60a5fa;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Error States */
        .embed-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          padding: 2rem;
        }

        .embed-container.dark .embed-error {
          color: #f9fafb;
        }

        .retry-btn {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 1rem;
        }

        .retry-btn:hover {
          background: #2563eb;
        }

        /* No Events */
        .no-events {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #6b7280;
        }

        .embed-container.dark .no-events {
          color: #9ca3af;
        }

        .no-events h4 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
        }

        .no-events p {
          margin: 0;
          font-size: 0.875rem;
        }

        /* Custom Thai Event Styling */
        .custom-thai-event .fc-event-time {
          font-weight: 600;
          font-size: 0.75rem;
          margin-right: 0.25rem;
          color: #ffffff;
        }

        .custom-thai-event .fc-event-title {
          font-weight: 500;
          line-height: 1.2;
          font-size: 0.75rem;
        }

        .custom-thai-event {
          border-radius: 4px;
          padding: 2px 4px;
        }

        /* FullCalendar Dark Theme */
        .embed-container.dark .fc {
          color: #f9fafb;
        }

        .embed-container.dark .fc-button-primary {
          background: #4b5563;
          border-color: #6b7280;
          color: #f9fafb;
        }

        .embed-container.dark .fc-button-primary:not(:disabled):active,
        .embed-container.dark .fc-button-primary:not(:disabled).fc-button-active {
          background: #374151;
          border-color: #4b5563;
        }

        .embed-container.dark .fc-button-primary:hover {
          background: #374151;
          border-color: #4b5563;
        }

        .embed-container.dark .fc-col-header-cell {
          background: #374151;
          color: #f9fafb;
        }

        .embed-container.dark .fc-daygrid-day {
          background: #1f2937;
          border-color: #374151;
        }

        .embed-container.dark .fc-day-today {
          background: #065f46 !important;
        }

        .embed-container.dark .fc-toolbar-title {
          color: #f9fafb;
        }

        .embed-container.dark .fc-daygrid-day-number {
          color: #f9fafb;
        }

        .embed-container.dark .fc-col-header-cell-cushion {
          color: #f9fafb;
        }

        /* Embed Modal Styles */
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
          z-index: 1000;
          padding: 1rem;
        }

        .embed-modal {
          background: white;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .embed-container.dark .embed-modal {
          background: #374151;
          color: #f9fafb;
        }

        .embed-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .embed-container.dark .embed-modal-header {
          border-bottom-color: #4b5563;
        }

        .embed-modal-header h4 {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          padding: 0.25rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .embed-container.dark .close-btn:hover {
          background: #4b5563;
          color: #f9fafb;
        }

        .embed-modal-content {
          padding: 1rem;
          line-height: 1.6;
        }

        .status-section {
          text-align: center;
          margin-bottom: 1rem;
        }

        .detail-section {
          margin-bottom: 1rem;
        }

        .detail-section p {
          margin: 0.25rem 0 0 0;
          color: #6b7280;
        }

        .embed-container.dark .detail-section p {
          color: #9ca3af;
        }

        /* Status Badges */
        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.75rem;
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

        /* View Full Button */
        .view-full-btn {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
        }

        .view-full-btn:hover {
          background: #2563eb;
          text-decoration: none;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .embed-header-content {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }

          .embed-title h3 {
            font-size: 1rem;
          }

          .embed-calendar {
            padding: 0.5rem;
          }

          .custom-thai-event .fc-event-time,
          .custom-thai-event .fc-event-title {
            font-size: 0.625rem;
          }

          .embed-modal {
            margin: 0.5rem;
            max-height: 90vh;
          }

          .embed-modal-header,
          .embed-modal-content {
            padding: 0.75rem;
          }

          .embed-modal-header h4 {
            font-size: 1rem;
          }

          .status-badge {
            font-size: 0.625rem;
            padding: 0.375rem 0.75rem;
          }
        }

        /* Small embed sizes */
        @media (max-width: 480px) {
          .embed-header {
            padding: 0.5rem;
          }

          .embed-title h3 {
            font-size: 0.875rem;
          }

          .embed-calendar {
            padding: 0.25rem;
          }

          /* Hide some FullCalendar elements for very small sizes */
          .fc-toolbar-chunk:last-child {
            display: none;
          }

          .fc-daygrid-day-number {
            font-size: 0.75rem;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .embed-container.light {
            background: #ffffff;
            color: #000000;
          }

          .embed-container.dark {
            background: #000000;
            color: #ffffff;
          }

          .embed-header {
            border-bottom: 2px solid #000000;
          }

          .embed-container.dark .embed-header {
            border-bottom: 2px solid #ffffff;
          }
        }

        /* Print styles */
        @media print {
          .embed-modal-overlay {
            display: none;
          }

          .embed-container {
            background: white !important;
            color: black !important;
          }

          .fc-button-group {
            display: none;
          }
        }

        /* Focus styles for accessibility */
        .fc-button:focus,
        .close-btn:focus,
        .retry-btn:focus,
        .view-full-btn:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }

          * {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  )
}