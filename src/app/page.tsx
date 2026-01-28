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

  // อ่าน parameters จาก URL - เช็ค null ก่อน
  const theme = searchParams?.get('theme') || 'light'
  const view = searchParams?.get('view') || 'dayGridMonth'
  const showHeader = searchParams?.get('header') !== 'false'
  const height = searchParams?.get('height') || '600'
  const specificEventId = searchParams?.get('event') || null
  const showEventList = searchParams?.get('eventList') !== 'false'

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
        
        if (specificEventId) {
          const filteredData = data.filter((event: Event) => event.id === specificEventId)
          setEvents(filteredData)
          console.log(`🎯 Filtered to specific event: ${specificEventId}`)
        } else {
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
        return { backgroundColor: "#16a34a", borderColor: "#15803d" }
      case "ongoing":
        return { backgroundColor: "#22c55e", borderColor: "#16a34a" }
      case "completed":
        return { backgroundColor: "#6b7280", borderColor: "#4b5563" }
      default:
        return { backgroundColor: "#16a34a", borderColor: "#15803d" }
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
    
    if (eventDate.getTime() === today.getTime()) {
      return `วันนี้ ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
    }
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (eventDate.getTime() === tomorrow.getTime()) {
      return `พรุ่งนี้ ${date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.`
    }
    
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
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
            <div className="loading-pulse"></div>
          </div>
          <p className="loading-text">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`embed-container ${theme}`}>
        <div className="error-container">
          <div className="error-icon">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3>เกิดข้อผิดพลาด</h3>
          <p>{error}</p>
          <button onClick={fetchPublicEvents} className="retry-btn">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`embed-container ${theme}`}>
      {showHeader && (
        <div className="embed-header">
          <div className="header-content">
            <div className="header-icon">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="header-text">
              <h3 className="event-title">
                {specificEventId && events.length > 0
                  ? `กิจกรรม: ${events[0].title}`
                  : 'ปฏิทินกิจกรรม'}
              </h3>
              <h1 className="university-name">
                มหาวิทยาลัยราชภัฏมหาสารคาม
              </h1>
            </div>
          </div>
        </div>
      )}
      
      <div className="embed-calendar">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView={view}
          locale="th"
          headerToolbar={{
            left: showHeader ? 'prev,next today' : '',
            center: showHeader ? 'title' : '',
            right: showHeader && view !== 'dayGridMonth' ? 'dayGridMonth,timeGridWeek' : ''
          }}
          buttonText={{
            today: 'วันนี้',
            month: 'เดือน',
            week: 'สัปดาห์'
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
            <div className="no-events-icon">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p>
              {specificEventId 
                ? 'ไม่พบกิจกรรมที่ระบุ' 
                : 'ไม่มีข้อมูลกิจกรรม'
              }
            </p>
          </div>
        )}
      </div>

      {showEventList && events.length > 0 && (
        <div className="events-list-container">
          <div className="events-list-header">
            <div className="events-count-badge">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{events.length}</span>
            </div>
            <h4>
              {specificEventId 
                ? 'กิจกรรมที่เลือก' 
                : 'รายการกิจกรรมทั้งหมด'
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatDateForList(event.startDate)}</span>
                  </div>
                  <div className="event-list-content">
                    <div className="event-list-title">
                      {event.title}
                      <span className={`event-list-status ${status}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                    <div className="event-list-details">
                      <span className="event-list-location">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </span>
                      <span className="event-list-organizer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {event.organizer}
                      </span>
                    </div>
                  </div>
                  <div className="event-list-arrow">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {showModal && selectedEvent && (
        <div className="embed-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="embed-modal" onClick={(e) => e.stopPropagation()}>
            <div className="embed-modal-header">
              <h4>{selectedEvent.title}</h4>
              <button onClick={() => setShowModal(false)} className="close-btn">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="embed-modal-content">
              <div className="status-section">
                <span className={getStatusColor(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}>
                  {getStatusText(getEventStatus(selectedEvent.startDate, selectedEvent.endDate))}
                </span>
              </div>

              {selectedEvent.description && (
                <div className="modal-section">
                  <div className="modal-section-header">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <strong>รายละเอียด</strong>
                  </div>
                  <p>{selectedEvent.description}</p>
                </div>
              )}

              <div className="modal-section">
                <div className="modal-section-header">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <strong>วันที่และเวลา</strong>
                </div>
                <p>
                  <strong>เริ่ม:</strong> {formatDate(selectedEvent.startDate)}<br/>
                  <strong>สิ้นสุด:</strong> {formatDate(selectedEvent.endDate)}
                </p>
              </div>

              <div className="modal-section">
                <div className="modal-section-header">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <strong>สถานที่</strong>
                </div>
                <p>{selectedEvent.location}</p>
              </div>

              <div className="modal-section">
                <div className="modal-section-header">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <strong>จัดโดย</strong>
                </div>
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
          background: linear-gradient(to bottom, #f9fafb, #ffffff);
        }

        .embed-container.light {
          color: #111827;
        }

        .embed-container.dark {
          background: linear-gradient(to bottom, #1f2937, #111827);
          color: #f9fafb;
        }

        /* Header Styles */
        .embed-header {
          padding: 2rem 1.5rem;
          background: linear-gradient(135deg, #0b5d3a 0%, #7a1020 100%);
          border-radius: 16px;
          margin-bottom: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
        }

        .embed-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.3;
        }

        .header-content {
          position: relative;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .header-icon {
          flex-shrink: 0;
          width: 60px;
          height: 60px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .header-text {
          flex: 1;
        }

        .event-title {
          color: rgba(255, 255, 255, 0.95);
          font-size: clamp(1rem, 2.5vw, 1.3rem);
          font-weight: 500;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .university-name {
          color: #ffffff;
          font-size: clamp(1.5rem, 4vw, 2.2rem);
          font-weight: 700;
          letter-spacing: 0.5px;
          line-height: 1.3;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        @media (min-width: 768px) {
          .embed-header {
            padding: 2.5rem 2.5rem;
          }
        }

        /* Calendar Container */
        .embed-calendar {
          padding: 1.5rem;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .embed-container.dark .embed-calendar {
          background: #1f2937;
        }

        /* Loading Styles */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1.5rem;
        }

        .loading-spinner-wrapper {
          position: relative;
          width: 60px;
          height: 60px;
        }

        .loading-spinner {
          position: absolute;
          width: 60px;
          height: 60px;
          border: 4px solid #e5e7eb;
          border-top: 4px solid #16a34a;
          border-radius: 50%;
          animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
        }

        .loading-pulse {
          position: absolute;
          width: 60px;
          height: 60px;
          background: radial-gradient(circle, #16a34a20 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        .loading-text {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          animation: fadeInOut 2s ease-in-out infinite;
        }

        .embed-container.dark .loading-text {
          color: #d1d5db;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* Error Styles */
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
          gap: 1rem;
        }

        .error-icon {
          color: #ef4444;
          animation: shake 0.5s ease-in-out;
        }

        .embed-container.dark .error-icon {
          color: #fca5a5;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        .error-container h3 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ef4444;
        }

        .embed-container.dark .error-container h3 {
          color: #fca5a5;
        }

        .error-container p {
          color: #6b7280;
          text-align: center;
        }

        .embed-container.dark .error-container p {
          color: #9ca3af;
        }

        .retry-btn {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        .retry-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.4);
        }

        .retry-btn:active {
          transform: translateY(0);
        }

        /* No Events */
        .no-events {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          gap: 1rem;
        }

        .no-events-icon {
          color: #9ca3af;
        }

        .embed-container.dark .no-events-icon {
          color: #6b7280;
        }

        .no-events p {
          color: #6b7280;
          font-size: 1.125rem;
          font-weight: 500;
        }

        .embed-container.dark .no-events p {
          color: #9ca3af;
        }

        /* Events List */
        .events-list-container {
          margin-top: 1.5rem;
          background: white;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .embed-container.dark .events-list-container {
          background: #1f2937;
        }

        .events-list-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .embed-container.dark .events-list-header {
          border-bottom-color: #374151;
        }

        .events-count-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1.125rem;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
        }

        .events-list-header h4 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #111827;
          flex: 1;
        }

        .embed-container.dark .events-list-header h4 {
          color: #f9fafb;
        }

        .events-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .event-list-item {
          position: relative;
          display: flex;
          align-items: center;
          padding: 1.25rem;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
          border-radius: 14px;
          border-left: 4px solid #16a34a;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          gap: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .embed-container.dark .event-list-item {
          background: linear-gradient(135deg, #374151 0%, #2d3748 100%);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .event-list-item:hover {
          transform: translateX(8px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
          border-left-width: 6px;
        }

        .embed-container.dark .event-list-item:hover {
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
        }

        .event-list-item.upcoming {
          border-left-color: #16a34a;
        }

        .event-list-item.ongoing {
          border-left-color: #22c55e;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        }

        .embed-container.dark .event-list-item.ongoing {
          background: linear-gradient(135deg, #1e4620 0%, #15401a 100%);
        }

        .event-list-item.completed {
          border-left-color: #6b7280;
          opacity: 0.7;
        }

        .event-list-date {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 160px;
          font-weight: 600;
          color: #16a34a;
          font-size: 0.875rem;
        }

        .embed-container.dark .event-list-date {
          color: #4ade80;
        }

        .event-list-content {
          flex: 1;
          min-width: 0;
        }

        .event-list-title {
          font-weight: 700;
          font-size: 1.125rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          color: #111827;
        }

        .embed-container.dark .event-list-title {
          color: #f9fafb;
        }

        .event-list-status {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-weight: 600;
          white-space: nowrap;
        }

        .event-list-status.upcoming {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
        }

        .event-list-status.ongoing {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #064e3b;
        }

        .event-list-status.completed {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          color: #3730a3;
        }

        .event-list-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
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
          gap: 0.5rem;
        }

        .event-list-arrow {
          color: #9ca3af;
          transition: all 0.3s ease;
        }

        .event-list-item:hover .event-list-arrow {
          color: #16a34a;
          transform: translateX(4px);
        }

        .embed-container.dark .event-list-item:hover .event-list-arrow {
          color: #4ade80;
        }

        /* Modal Styles */
        .embed-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .embed-modal {
          background: white;
          border-radius: 20px;
          max-width: 550px;
          width: 100%;
          max-height: 85vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .embed-container.dark .embed-modal {
          background: #1f2937;
        }

        .embed-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
          border-bottom: 2px solid #e5e7eb;
        }

        .embed-container.dark .embed-modal-header {
          background: linear-gradient(135deg, #374151 0%, #2d3748 100%);
          border-bottom-color: #4b5563;
        }

        .embed-modal-header h4 {
          margin: 0;
          font-size: 1.375rem;
          font-weight: 700;
          flex: 1;
          padding-right: 1rem;
          color: #111827;
        }

        .embed-container.dark .embed-modal-header h4 {
          color: #f9fafb;
        }

        .close-btn {
          background: rgba(239, 68, 68, 0.1);
          border: none;
          cursor: pointer;
          color: #ef4444;
          padding: 0.5rem;
          border-radius: 10px;
          transition: all 0.2s;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: #ef4444;
          color: white;
          transform: rotate(90deg);
        }

        .embed-modal-content {
          padding: 1.5rem;
        }

        .status-section {
          text-align: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 2px dashed #e5e7eb;
        }

        .embed-container.dark .status-section {
          border-bottom-color: #4b5563;
        }

        .status-badge {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 600;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .status-badge.upcoming {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
        }

        .status-badge.ongoing {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          color: #064e3b;
        }

        .status-badge.completed {
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          color: #3730a3;
        }

        .modal-section {
          margin-bottom: 1.5rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 12px;
        }

        .embed-container.dark .modal-section {
          background: #374151;
        }

        .modal-section-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          color: #16a34a;
        }

        .embed-container.dark .modal-section-header {
          color: #4ade80;
        }

        .modal-section-header strong {
          font-size: 1.125rem;
          font-weight: 700;
        }

        .modal-section p {
          margin: 0;
          line-height: 1.6;
          color: #374151;
        }

        .embed-container.dark .modal-section p {
          color: #d1d5db;
        }

        /* FullCalendar Customizations */
        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #111827 !important;
          letter-spacing: -0.025em !important;
        }

        .embed-container.dark .fc-toolbar-title {
          color: #f9fafb !important;
        }
        
        .fc-button-primary {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
          border: none !important;
          color: white !important;
          border-radius: 10px !important;
          font-weight: 600 !important;
          padding: 0.625rem 1.25rem !important;
          transition: all 0.2s !important;
          box-shadow: 0 2px 8px rgba(22, 163, 74, 0.3) !important;
        }
        
        .fc-button-primary:hover {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.4) !important;
        }
        
        .fc-button-primary:active {
          transform: translateY(0) !important;
        }
        
        .fc-button-primary:disabled {
          background: #d1d5db !important;
          box-shadow: none !important;
          transform: none !important;
        }
        
        .fc-day-today {
          background: #f0fdf4 !important;
          position: relative !important;
        }

        .embed-container.dark .fc-day-today {
          background: #1e4620 !important;
        }
        
        .fc-day-today::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px solid #16a34a;
          border-radius: 4px;
          pointer-events: none;
        }
        
        .fc-event {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
          border: none !important;
          margin: 2px !important;
          cursor: pointer !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.2s !important;
        }

        .fc-event:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
        }
        
        .fc-daygrid-event {
          padding: 5px 8px !important;
        }
        
        .fc-col-header-cell {
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%) !important;
          font-weight: 700 !important;
          color: #374151 !important;
          padding: 12px 0 !important;
          border-bottom: 2px solid #e5e7eb !important;
          text-transform: uppercase !important;
          font-size: 0.875rem !important;
          letter-spacing: 0.025em !important;
        }

        .embed-container.dark .fc-col-header-cell {
          background: linear-gradient(135deg, #374151 0%, #2d3748 100%) !important;
          color: #d1d5db !important;
          border-bottom-color: #4b5563 !important;
        }
        
        .fc-scrollgrid {
          border-color: #e5e7eb !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }

        .embed-container.dark .fc-scrollgrid {
          border-color: #4b5563 !important;
        }
        
        .fc-daygrid-day-number {
          color: #374151 !important;
          font-weight: 600 !important;
          padding: 8px !important;
          transition: all 0.2s !important;
        }

        .embed-container.dark .fc-daygrid-day-number {
          color: #d1d5db !important;
        }
        
        .fc-daygrid-day:hover .fc-daygrid-day-number {
          color: #16a34a !important;
          transform: scale(1.1);
        }

        .embed-container.dark .fc-daygrid-day:hover .fc-daygrid-day-number {
          color: #4ade80 !important;
        }
        
        .fc-daygrid-day-frame {
          padding: 4px !important;
        }
        
        .fc-daygrid-day {
          transition: background-color 0.2s !important;
        }
        
        .fc-daygrid-day:hover {
          background-color: #f9fafb !important;
        }

        .embed-container.dark .fc-daygrid-day:hover {
          background-color: #374151 !important;
        }

        .custom-thai-event .fc-event-time {
          font-weight: 600;
          font-size: 0.875rem;
          margin-right: 0.25rem;
        }

        .custom-thai-event .fc-event-title {
          font-weight: 500;
          line-height: 1.2;
        }

        .custom-thai-event {
          border-radius: 6px;
          padding: 4px 6px;
          font-size: 0.875rem;
        }

        /* FullCalendar Dark Theme */
        .embed-container.dark .fc {
          color: #f9fafb;
        }

        .embed-container.dark .fc-theme-standard td,
        .embed-container.dark .fc-theme-standard th {
          border-color: #4b5563;
        }

        .embed-container.dark .fc-daygrid-day {
          background: #1f2937;
        }

        .embed-container.dark .fc-button {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
        }

        .embed-container.dark .fc-button:hover {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%) !important;
        }

        .embed-container.dark .fc-button:disabled {
          background: #4b5563 !important;
        }

        /* Scrollbar Styles */
        .events-list::-webkit-scrollbar,
        .embed-modal::-webkit-scrollbar {
          width: 8px;
        }

        .events-list::-webkit-scrollbar-track,
        .embed-modal::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        .embed-container.dark .events-list::-webkit-scrollbar-track,
        .embed-container.dark .embed-modal::-webkit-scrollbar-track {
          background: #374151;
        }

        .events-list::-webkit-scrollbar-thumb,
        .embed-modal::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          border-radius: 4px;
        }

        .events-list::-webkit-scrollbar-thumb:hover,
        .embed-modal::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #15803d 0%, #166534 100%);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .embed-header {
            padding: 1.5rem 1rem;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
            gap: 1rem;
          }

          .header-icon {
            width: 50px;
            height: 50px;
          }

          .header-icon svg {
            width: 28px;
            height: 28px;
          }

          .embed-calendar {
            padding: 1rem;
          }

          .events-list-container {
            padding: 1rem;
          }

          .events-count-badge {
            font-size: 1rem;
            padding: 0.4rem 0.8rem;
          }

          .event-list-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
            padding: 1rem;
          }

          .event-list-date {
            min-width: auto;
            font-size: 0.8rem;
          }

          .event-list-title {
            font-size: 1rem;
          }

          .event-list-details {
            flex-direction: column;
            gap: 0.5rem;
          }

          .event-list-arrow {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
          }

          .embed-modal {
            margin: 0.5rem;
            max-height: 92vh;
            border-radius: 16px;
          }

          .embed-modal-header {
            padding: 1rem;
          }

          .embed-modal-header h4 {
            font-size: 1.125rem;
          }

          .embed-modal-content {
            padding: 1rem;
          }

          .modal-section {
            padding: 0.75rem;
          }

          .fc-toolbar-title {
            font-size: 1.125rem !important;
          }
          
          .fc-button-primary {
            padding: 0.5rem 1rem !important;
            font-size: 0.875rem !important;
          }
          
          .fc-col-header-cell {
            padding: 10px 0 !important;
            font-size: 0.75rem !important;
          }
          
          .fc-daygrid-day-number {
            font-size: 0.875rem !important;
            padding: 6px !important;
          }
          
          .custom-thai-event .fc-event-time,
          .custom-thai-event .fc-event-title {
            font-size: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function EmbedPage() {
  return (
    <Suspense fallback={
      <div className="embed-container light">
        <div className="loading-container">
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner"></div>
            <div className="loading-pulse"></div>
          </div>
          <p className="loading-text">กำลังโหลด...</p>
        </div>
      </div>
    }>
      <EmbedCalendarContent />
    </Suspense>
  )
}