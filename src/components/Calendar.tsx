"use client"

import { useState, useEffect } from "react"
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'

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

interface CalendarComponentProps {
  events: Event[]
  onEventClick: (event: Event) => void
  className?: string
}

export default function CalendarComponent({ events, onEventClick, className = "" }: CalendarComponentProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'listDay'>('dayGridMonth')

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
      onEventClick(event)
    }
  }

  const handleViewChange = (view: 'dayGridMonth' | 'listDay') => {
    setCurrentView(view)
  }

  const getCustomHeaderToolbar = () => {
    if (isMobile) {
      return {
        left: 'prev,next',
        center: 'title',
        right: '' // จะใช้ custom buttons แทน
      }
    } else {
      return {
        left: 'prev,next today',
        center: 'title',
        right: '' // จะใช้ custom buttons แทน
      }
    }
  }

  if (events.length === 0) {
    return (
      <div className={`calendar-empty-state ${className}`}>
        <div className="empty-state-content">
          <div className="empty-state-icon">📅</div>
          <h3>ไม่มีข้อมูลกิจกรรม</h3>
          <p>ยังไม่มีกิจกรรมที่จัดขึ้น</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`calendar-component ${className}`}>
      {/* Custom View Switcher */}
      <div className="calendar-view-switcher">
        <div className="view-buttons">
          <button 
            className={`view-btn ${currentView === 'dayGridMonth' ? 'active' : ''}`}
            onClick={() => handleViewChange('dayGridMonth')}
          >
            📅 เดือน
          </button>
          <button 
            className={`view-btn ${currentView === 'listDay' ? 'active' : ''}`}
            onClick={() => handleViewChange('listDay')}
          >
            📋 วันนี้
          </button>
        </div>
        
        {/* Event Count */}
        <div className="event-count">
          <span>📊 รวม {events.length} กิจกรรม</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
          initialView={currentView}
          key={currentView} // Force re-render when view changes
          locale="th"
          headerToolbar={getCustomHeaderToolbar()}
          buttonText={{
            today: 'วันนี้',
            month: 'เดือน',
            list: 'รายการ'
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
          // สำหรับ List View
          listDayFormat={{
            weekday: 'long',
            month: 'long', 
            day: 'numeric'
          }}
          listDaySideFormat={false}
          noEventsContent="ไม่มีกิจกรรมในวันนี้"
          // Custom date range for listDay view (show today only)
          validRange={currentView === 'listDay' ? {
            start: new Date().toISOString().split('T')[0],
            end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          } : undefined}
          eventDidMount={(info) => {
            const timeElement = info.el.querySelector('.fc-event-time')
            if (timeElement && timeElement.textContent) {
              const timeText = timeElement.textContent.trim()
              if (timeText && !timeText.includes('น.')) {
                timeElement.textContent = timeText + ' น.'
              }
            }
            info.el.classList.add('custom-thai-event')
            
            // Add status class for styling
            const status = info.event.extendedProps.status
            info.el.classList.add(`event-${status}`)
          }}
        />
      </div>

      <style jsx global>{`
        .calendar-component {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .calendar-view-switcher {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid #e5e7eb;
        }

        .view-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .view-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          color: #374151;
        }

        .view-btn:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .view-btn.active {
          background: #3b82f6;
          border-color: #2563eb;
          color: white;
        }

        .view-btn.active:hover {
          background: #2563eb;
        }

        .event-count {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .calendar-wrapper {
          padding: 1rem;
        }

        .calendar-empty-state {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-state-content {
          max-width: 400px;
          margin: 0 auto;
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.6;
        }

        .empty-state-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          color: #374151;
        }

        .empty-state-content p {
          margin: 0;
          color: #6b7280;
          font-size: 1rem;
        }

        /* Custom Event Styles */
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

        /* List View Customization */
        .fc-list-day-cushion {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
          color: #374151 !important;
          font-weight: 600 !important;
          padding: 0.75rem 1rem !important;
        }

        .fc-list-event {
          border-bottom: 1px solid #f1f5f9 !important;
        }

        .fc-list-event:hover {
          background: #f8fafc !important;
        }

        .fc-list-event-time {
          font-weight: 600 !important;
          color: #3b82f6 !important;
        }

        .fc-list-event-title {
          font-weight: 500 !important;
        }

        /* Status-based styling */
        .event-upcoming {
          opacity: 1;
        }

        .event-ongoing {
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.5) !important;
          animation: pulse 2s infinite;
        }

        .event-completed {
          opacity: 0.7;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.5);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.3);
          }
        }

        @media (max-width: 768px) {
          .calendar-view-switcher {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .view-buttons {
            width: 100%;
            justify-content: center;
          }

          .view-btn {
            flex: 1;
            max-width: 120px;
          }

          .custom-thai-event .fc-event-time {
            font-size: 0.75rem;
          }
          
          .custom-thai-event .fc-event-title {
            font-size: 0.75rem;
          }

          .calendar-wrapper {
            padding: 0.5rem;
          }

          .empty-state-content {
            padding: 2rem 1rem;
          }

          .empty-state-icon {
            font-size: 3rem;
          }

          .empty-state-content h3 {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}