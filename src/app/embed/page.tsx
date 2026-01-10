"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from 'next/navigation'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'

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

function EmbedCalendarContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string>("")

  // อ่าน parameters จาก URL
  const theme = searchParams.get('theme') || 'light'
  const view = searchParams.get('view') || 'dayGridMonth'
  const showHeader = searchParams.get('header') !== 'false'
  const height = searchParams.get('height') || '600'
  const specificEventId = searchParams.get('event')
  const showEventList = searchParams.get('eventList') !== 'false'

  useEffect(() => {
    fetchPublicEvents()
  }, [])

  const fetchPublicEvents = async () => {
    try {
      console.log("🔄 Fetching public events for embed...")
      const response = await fetch("/api/events?public=true")
      console.log("📡 Response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        
        // ถ้ามีการระบุ event ID เฉพาะ ให้แสดงแค่ event นั้น
        if (specificEventId) {
          const filteredData = data.filter((event: Event) => event.id === specificEventId)
          setEvents(filteredData)
          console.log(`🎯 Filtered to specific event: ${specificEventId}`)
        } else {
          // เรียงลำดับตามวันที่เริ่มต้น (จากอนาคตไปอดีต)
          const sortedData = data.sort((a: Event, b: Event) => 
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          )
          setEvents(sortedData)
          console.log(`📅 Loaded ${sortedData.length} events`)
        }
        
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

  const handleEventItemClick = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
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

  const formatDateForList = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    
    // ถ้าเป็นวันนี้
    if (eventDate.getTime() === today.getTime()) {
      return `วันนี้ ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
    }
    
    // ถ้าเป็นพรุ่งนี้
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (eventDate.getTime() === tomorrow.getTime()) {
      return `พรุ่งนี้ ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
    }
    
    // แสดงเป็นวันที่
    return date.toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
      <div className={`embed-container ${theme}`}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`embed-container ${theme}`}>
        <div className="error-container">
          <h3>เกิดข้อผิดพลาด</h3>
          <p>{error}</p>
          <button onClick={fetchPublicEvents} className="retry-btn">
            ลองใหม่
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`embed-container ${theme}`}>
      {showHeader && (
        <div className="embed-header">
  <h3 className="event-title">
    {specificEventId && events.length > 0
      ? `กิจกรรม: ${events[0].title}`
      : 'ปฏิทินกิจกรรม'}
  </h3>

  <h1 className="university-name">
    มหาวิทยาลัยราชภัฏมหาสารคาม
  </h1>
</div>


      )}
      
      <div className="embed-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView={view}
          locale="th"
          headerToolbar={{
            left: showHeader ? 'prev,next' : '',
            center: showHeader ? 'title' : '',
            right: showHeader && view !== 'dayGridMonth' ? 'dayGridMonth,timeGridWeek' : ''
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          height={parseInt(height)}
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
          titleFormat={{ year: 'numeric', month: 'long' }}
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

        {events.length === 0 && (
          <div className="no-events">
            <p>
              {specificEventId 
                ? 'ไม่พบกิจกรรมที่ระบุ' 
                : 'ไม่มีข้อมูลกิจกรรม'
              }
            </p>
          </div>
        )}
      </div>

      {/* ส่วนแสดงรายการกิจกรรม */}
      {showEventList && events.length > 0 && (
        <div className="events-list-container">
          <div className="events-list-header">
            <h4>
              {specificEventId 
                ? 'กิจกรรมที่เลือก' 
                : `รายการกิจกรรมทั้งหมด (${events.length})`
              }
            </h4>
          </div>
          <div className="events-list">
            {events.map(event => {
              const status = getEventStatus(event.startDate, event.endDate)
              return (
                <div 
                  key={event.id} 
                  className={`event-list-item ${status}`}
                  onClick={() => handleEventItemClick(event.id)}
                >
                  <div className="event-list-date">
                    {formatDateForList(event.startDate)}
                  </div>
                  <div className="event-list-content">
                    <div className="event-list-title">
                      {event.title}
                      <span className={`event-list-status ${status}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                    <div className="event-list-details">
                      <span className="event-list-location">📍 {event.location}</span>
                      <span className="event-list-organizer">👥 {event.organizer}</span>
                    </div>
                  </div>
                  <div className="event-list-arrow">
                    →
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showModal && selectedEvent && (
        <div className="embed-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="embed-modal" onClick={(e) => e.stopPropagation()}>
            <div className="embed-modal-header">
              <h4>{selectedEvent.title}</h4>
              <button onClick={() => setShowModal(false)} className="close-btn">×</button>
            </div>
            <div className="embed-modal-content">
              <div className="status-section">
                <span className={getStatusColor(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}>
                  {getStatusText(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}
                </span>
              </div>

              {selectedEvent.description && (
                <div className="modal-section">
                  <strong>📝 รายละเอียด:</strong>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              <div className="modal-section">
                <strong>📅 วันที่และเวลา:</strong>
                <p>
                  <strong>เริ่ม:</strong> {formatDate(selectedEvent.startDate)}<br/>
                  <strong>สิ้นสุด:</strong> {formatDate(selectedEvent.endDate)}
                </p>
              </div>

              <div className="modal-section">
                <strong>📍 สถานที่:</strong>
                <p>{selectedEvent.location}</p>
              </div>

              <div className="modal-section">
                <strong>👥 จัดโดย:</strong>
                <p>{selectedEvent.organizer}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Kanit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 0;
        }

        .embed-container {
          width: 100%;
          height: 100%;
          min-height: 400px;
        }

        .embed-container.light {
          background: #ffffff;
          color: #111827;
        }

        .embed-header {
  padding: 1.4rem 1rem;
  background: linear-gradient(
    135deg,
    #0b5d3a 0%,   /* เขียวเข้ม */
    #7a1020 100%  /* แดงเข้ม */
  );
  color: #ffffff;                 /* ⭐ ตัวหนังสือขาวทั้งหมด */
  border-radius: 14px;
  text-align: center;
  margin-bottom: 1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
}

/* หัวข้อกิจกรรม */
.event-title {
  color: #ffffff;
  font-size: clamp(0.95rem, 2.5vw, 1.2rem);
  font-weight: 500;
  margin-bottom: 0.4rem;
}

/* ชื่อมหาวิทยาลัย */
.university-name {
  color: #ffffff;
  font-size: clamp(1.4rem, 4vw, 2.1rem);
  font-weight: 700;
  letter-spacing: 0.6px;
  line-height: 1.3;
}

/* จอใหญ่ */
@media (min-width: 768px) {
  .embed-header {
    padding: 1.8rem 2rem;
  }
}

        .embed-container.dark {
          background: #1f2937;
          color: #f9fafb;
        }

        .embed-header {
          padding: 1rem;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .embed-container.dark .embed-header {
          border-bottom-color: #374151;
        }

        .embed-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .embed-header p {
          margin: 0;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .embed-container.dark .embed-header p {
          color: #9ca3af;
        }

        .embed-calendar {
          padding: 1rem;
        }

        /* Events List Styles */
        .events-list-container {
          border-top: 1px solid #e5e7eb;
          padding: 1rem;
        }

        .embed-container.dark .events-list-container {
          border-top-color: #374151;
        }

        .events-list-header {
          margin-bottom: 1rem;
        }

        .events-list-header h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
        }

        .embed-container.dark .events-list-header h4 {
          color: #f9fafb;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .event-list-item {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 1rem;
        }

        .embed-container.dark .event-list-item {
          background: #374151;
        }

        .event-list-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .embed-container.dark .event-list-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .event-list-item.upcoming {
          border-left-color: #3b82f6;
        }

        .event-list-item.ongoing {
          border-left-color: #22c55e;
        }

        .event-list-item.completed {
          border-left-color: #6b7280;
        }

        .event-list-date {
          min-width: 140px;
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }

        .embed-container.dark .event-list-date {
          color: #f9fafb;
        }

        .event-list-content {
          flex: 1;
          min-width: 0;
        }

        .event-list-title {
          font-weight: 600;
          margin-bottom: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .event-list-status {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          font-weight: 500;
        }

        .event-list-status.upcoming {
          background: #fef3c7;
          color: #d97706;
        }

        .event-list-status.ongoing {
          background: #d1fae5;
          color: #059669;
        }

        .event-list-status.completed {
          background: #e0e7ff;
          color: #5b21b6;
        }

        .event-list-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .embed-container.dark .event-list-details {
          color: #d1d5db;
        }

        .event-list-location,
        .event-list-organizer {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .event-list-arrow {
          color: #9ca3af;
          font-size: 1.25rem;
          font-weight: 300;
          transition: transform 0.2s;
        }

        .event-list-item:hover .event-list-arrow {
          transform: translateX(4px);
          color: #3b82f6;
        }

        .embed-container.dark .event-list-item:hover .event-list-arrow {
          color: #60a5fa;
        }

        .loading-container,
        .error-container,
        .no-events {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 2rem;
          min-height: 200px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-container {
          color: #ef4444;
        }

        .embed-container.dark .error-container {
          color: #fca5a5;
        }

        .retry-btn {
          margin-top: 1rem;
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .retry-btn:hover {
          background: #2563eb;
        }

        .embed-modal-overlay {
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

        .embed-modal {
          background: white;
          border-radius: 8px;
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
          flex: 1;
          padding-right: 1rem;
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
          flex-shrink: 0;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .embed-container.dark .close-btn {
          color: #9ca3af;
        }

        .embed-container.dark .close-btn:hover {
          background: #4b5563;
          color: #f9fafb;
        }

        .embed-modal-content {
          padding: 1rem;
        }

        .status-section {
          text-align: center;
          margin-bottom: 1rem;
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

        .modal-section {
          margin-bottom: 1rem;
        }

        .modal-section strong {
          display: block;
          margin-bottom: 0.25rem;
          color: #374151;
        }

        .embed-container.dark .modal-section strong {
          color: #f3f4f6;
        }

        .modal-section p {
          margin: 0;
          line-height: 1.5;
          color: #6b7280;
        }

        .embed-container.dark .modal-section p {
          color: #d1d5db;
        }

        /* FullCalendar Customizations */
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
          cursor: pointer;
        }

        /* FullCalendar Dark Theme */
        .embed-container.dark .fc {
          color: #f9fafb;
        }

        .embed-container.dark .fc-theme-standard td,
        .embed-container.dark .fc-theme-standard th {
          border-color: #4b5563;
        }

        .embed-container.dark .fc-col-header-cell {
          background: #374151;
          color: #f9fafb;
        }

        .embed-container.dark .fc-daygrid-day {
          background: #1f2937;
        }

        .embed-container.dark .fc-daygrid-day:hover {
          background: #374151;
        }

        .embed-container.dark .fc-button {
          background: #4b5563;
          border-color: #6b7280;
          color: #f9fafb;
        }

        .embed-container.dark .fc-button:hover {
          background: #6b7280;
        }

        .embed-container.dark .fc-button:disabled {
          background: #374151;
          border-color: #4b5563;
          color: #6b7280;
        }

        .embed-container.dark .fc-today {
          background: #1e40af !important;
        }

        .embed-container.dark .fc-daygrid-day-number {
          color: #f9fafb;
        }

        .embed-container.dark .fc-more-link {
          color: #60a5fa;
        }

        /* Scrollbar Styles */
        .events-list::-webkit-scrollbar {
          width: 6px;
        }

        .events-list::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .embed-container.dark .events-list::-webkit-scrollbar-track {
          background: #374151;
        }

        .events-list::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .embed-container.dark .events-list::-webkit-scrollbar-thumb {
          background: #4b5563;
        }

        .events-list::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .embed-header h3 {
            font-size: 1rem;
          }

          .embed-header p {
            font-size: 0.75rem;
          }

          .embed-calendar {
            padding: 0.5rem;
          }

          .events-list-container {
            padding: 0.75rem;
          }

          .event-list-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .event-list-date {
            min-width: auto;
            font-size: 0.75rem;
          }

          .event-list-details {
            flex-direction: column;
            gap: 0.25rem;
          }

          .event-list-arrow {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
          }

          .embed-modal {
            margin: 0.5rem;
            max-height: 90vh;
          }

          .embed-modal-header,
          .embed-modal-content {
            padding: 0.75rem;
          }

          .custom-thai-event .fc-event-time {
            font-size: 0.75rem;
          }
          
          .custom-thai-event .fc-event-title {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}

export default function EmbedCalendar() {
  return (
    <Suspense fallback={
      <div className="embed-container light">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลด...</p>
        </div>
      </div>
    }>
      <EmbedCalendarContent />
    </Suspense>
  )
}