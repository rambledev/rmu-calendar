"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import EventForm from "@/components/EventForm"

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  location: string
  organizer: string
  createdAt: string
  createdBy: string
}

interface EventStats {
  total: number
  ongoing: number
  upcoming: number
  completed: number
}

interface CurrentUser {
  id: string
  email: string
  role: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showEventsTable, setShowEventsTable] = useState(false)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [tableTitle, setTableTitle] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'status'>('date-asc')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth/signin'
  }

  useEffect(() => {
    fetchCurrentUser()
    fetchEvents()
    fetchAllEvents()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllEvents = async () => {
    try {
      const response = await fetch("/api/allevents")
      if (response.ok) {
        const data = await response.json()
        setAllEvents(data)
      }
    } catch (error) {
      console.error("Error fetching all events:", error)
    }
  }

  // ตรวจสอบสิทธิ์ แก้ไข/ลบ
  const canEditDelete = (event: Event): boolean => {
    if (!currentUser) return false
    const role = currentUser.role
    // SUPER-ADMIN แก้ไข/ลบได้ทุก event
    if (role === 'SUPER-ADMIN' || role === 'SUPERADMIN') return true
    // ADMIN แก้ไข/ลบได้เฉพาะ event ที่ตัวเองสร้าง
    return event.createdBy === currentUser.id
  }

  const getStatusKey = (event: Event): 'ongoing' | 'upcoming' | 'completed' => {
    const now = new Date()
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    if (now < start) return 'upcoming'
    if (now >= start && now <= end) return 'ongoing'
    return 'completed'
  }

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) {
      return { text: "ยังไม่ถึงวันจัดกิจกรรม", className: "status-badge upcoming" }
    } else if (now >= start && now <= end) {
      return { text: "อยู่ระหว่างจัดกิจกรรม", className: "status-badge ongoing" }
    } else {
      return { text: "ผ่านไปแล้ว", className: "status-badge completed" }
    }
  }

  const getSortedEvents = () => {
    const sorted = [...events]
    switch (sortBy) {
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      case 'status':
        const order: Record<string, number> = { ongoing: 0, upcoming: 1, completed: 2 }
        return sorted.sort((a, b) => order[getStatusKey(a)] - order[getStatusKey(b)])
      default:
        return sorted
    }
  }

  const calculateEventStats = (): EventStats => {
    const now = new Date()
    let total = 0, ongoing = 0, upcoming = 0, completed = 0

    allEvents.forEach(event => {
      total++
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)

      if (now < start) {
        upcoming++
      } else if (now >= start && now <= end) {
        ongoing++
      } else {
        completed++
      }
    })

    return { total, ongoing, upcoming, completed }
  }

  const stats = calculateEventStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("คุณต้องการลบกิจกรรมนี้หรือไม่?")) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: "DELETE"
        })
        if (response.ok) {
          fetchEvents()
          fetchAllEvents()
        }
      } catch (error) {
        console.error("Error deleting event:", error)
      }
    }
  }

  const handleFormSuccess = () => {
    fetchEvents()
    fetchAllEvents()
    setShowEventForm(false)
    setEditingEvent(null)
  }

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event)
    setShowEventForm(true)
  }

  const handleAddNewEvent = () => {
    setEditingEvent(null)
    setShowEventForm(true)
  }

  const handleCloseForm = () => {
    setShowEventForm(false)
    setEditingEvent(null)
  }

  const handleStatCardClick = (type: 'total' | 'ongoing' | 'upcoming' | 'completed') => {
    const now = new Date()
    let filtered: Event[] = []
    let title = ""

    switch (type) {
      case 'total':
        filtered = allEvents
        title = "กิจกรรมทั้งหมด"
        break
      case 'ongoing':
        filtered = allEvents.filter(event => {
          const start = new Date(event.startDate)
          const end = new Date(event.endDate)
          return now >= start && now <= end
        })
        title = "กิจกรรมที่กำลังจัด"
        break
      case 'upcoming':
        filtered = allEvents.filter(event => new Date(event.startDate) > now)
        title = "กิจกรรมที่กำลังจะมา"
        break
      case 'completed':
        filtered = allEvents.filter(event => new Date(event.endDate) < now)
        title = "กิจกรรมที่จัดแล้ว"
        break
    }

    setFilteredEvents(filtered)
    setTableTitle(title)
    setShowEventsTable(true)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
  }

  if (status === "loading" || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <div className="icon-container">📅</div>
            <div className="admin-info">
              <h1>แผงควบคุมผู้ดูแลระบบ</h1>
              <p>จัดการปฏิทินกิจกรรม มรม.</p>
            </div>
          </div>

          <div className="admin-user-info">
            <span style={{ color: '#374151' }}>
              สวัสดี, {session?.user?.name || session?.user?.email || currentUser?.email}
            </span>
            <div className="admin-actions">
              <button
                onClick={() => router.push("/admin/change-password")}
                className="change-password-button"
                title="เปลี่ยนรหัสผ่าน"
              >
                <span>🔐</span>
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>
              <button onClick={handleSignOut} className="logout-button">
                <span>🚪</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => handleStatCardClick('total')} title="คลิกเพื่อดูรายละเอียด">
            <div className="stat-content">
              <div className="stat-icon green">📅</div>
              <div className="stat-info">
                <h3>กิจกรรมทั้งหมด</h3>
                <p>{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => handleStatCardClick('ongoing')} title="คลิกเพื่อดูรายละเอียด">
            <div className="stat-content">
              <div className="stat-icon blue">👥</div>
              <div className="stat-info">
                <h3>กิจกรรมที่กำลังจัด</h3>
                <p>{stats.ongoing}</p>
              </div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => handleStatCardClick('upcoming')} title="คลิกเพื่อดูรายละเอียด">
            <div className="stat-content">
              <div className="stat-icon red">⚙️</div>
              <div className="stat-info">
                <h3>กิจกรรมที่กำลังจะมา</h3>
                <p>{stats.upcoming}</p>
              </div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => handleStatCardClick('completed')} title="คลิกเพื่อดูรายละเอียด">
            <div className="stat-content">
              <div className="stat-icon purple">✅</div>
              <div className="stat-info">
                <h3>กิจกรรมที่จัดแล้ว</h3>
                <p>{stats.completed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={handleAddNewEvent} className="action-button primary">
            <span>➕</span>
            <span>เพิ่มกิจกรรมใหม่</span>
          </button>
          <button onClick={() => router.push("/calendar")} className="action-button secondary">
            <span>📅</span>
            <span>ดูปฏิทินกิจกรรมรวม</span>
          </button>
        </div>

        {/* Events List */}
        <div className="events-table-container">
          <div className="table-header">
            <h2>รายการกิจกรรมของคุณ</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                fontSize: '0.875rem',
                color: '#374151',
                background: 'white',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="date-asc">📅 วันที่ เก่า → ใหม่</option>
              <option value="date-desc">📅 วันที่ ใหม่ → เก่า</option>
              <option value="status">🔄 เรียงตามสถานะ</option>
            </select>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="events-table">
              <thead>
                <tr>
                  <th>กิจกรรม</th>
                  <th>วันที่จัด</th>
                  <th>สถานที่</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      ยังไม่มีกิจกรรม
                    </td>
                  </tr>
                ) : (
                  getSortedEvents().map((event) => {
                    const status = getEventStatus(event.startDate, event.endDate)
                    return (
                      <tr key={event.id}>
                        <td>
                          <div>
                            <div className="event-title">{event.title}</div>
                            <div className="event-organizer">จัดโดย: {event.organizer}</div>
                          </div>
                        </td>
                        <td>
                          <div className="event-date">{formatDate(event.startDate)}</div>
                          <div className="event-date-end">ถึง {formatDate(event.endDate)}</div>
                        </td>
                        <td style={{ color: '#111827' }}>{event.location}</td>
                        <td>
                          <span className={status.className}>{status.text}</span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
                            {canEditDelete(event) ? (
                              <>
                                <button
                                  onClick={() => handleEditEvent(event)}
                                  className="icon-button edit"
                                  title="แก้ไข"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteEvent(event.id)}
                                  className="icon-button delete"
                                  title="ลบ"
                                >
                                  🗑️
                                </button>
                              </>
                            ) : (
                              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>ดูอย่างเดียว</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          editEvent={editingEvent}
        />
      )}

      {/* Events Table Modal */}
      {showEventsTable && (
        <div className="modal-overlay" onClick={() => setShowEventsTable(false)}>
          <div className="modal-content events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{tableTitle} ({filteredEvents.length} รายการ)</h2>
              <button className="close-button" onClick={() => setShowEventsTable(false)}>✕</button>
            </div>
            <div className="modal-body">
              <table className="modal-events-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>ลำดับ</th>
                    <th>ชื่อกิจกรรม</th>
                    <th>หน่วยงาน</th>
                    <th>วันที่จัดกิจกรรม</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        ไม่มีกิจกรรมในหมวดนี้
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((event, index) => (
                      <tr key={event.id}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td>
                          <button className="event-name-button" onClick={() => handleEventClick(event)}>
                            {event.title}
                          </button>
                        </td>
                        <td>{event.organizer}</td>
                        <td>{formatDateShort(event.startDate)} - {formatDateShort(event.endDate)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content event-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>รายละเอียดกิจกรรม</h2>
              <button className="close-button" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="modal-body event-details">
              <div className="detail-group">
                <label>ชื่อกิจกรรม:</label>
                <p>{selectedEvent.title}</p>
              </div>
              <div className="detail-group">
                <label>รายละเอียด:</label>
                <p>{selectedEvent.description || 'ไม่มีรายละเอียด'}</p>
              </div>
              <div className="detail-group">
                <label>หน่วยงานที่จัด:</label>
                <p>{selectedEvent.organizer}</p>
              </div>
              <div className="detail-group">
                <label>สถานที่:</label>
                <p>{selectedEvent.location}</p>
              </div>
              <div className="detail-group">
                <label>วันที่เริ่ม:</label>
                <p>{formatDate(selectedEvent.startDate)}</p>
              </div>
              <div className="detail-group">
                <label>วันที่สิ้นสุด:</label>
                <p>{formatDate(selectedEvent.endDate)}</p>
              </div>
              <div className="detail-group">
                <label>สถานะ:</label>
                <span className={getEventStatus(selectedEvent.startDate, selectedEvent.endDate).className}>
                  {getEventStatus(selectedEvent.startDate, selectedEvent.endDate).text}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .clickable {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .clickable:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .stat-icon.purple {
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
        }
        .modal-overlay {
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
        }
        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 90vw;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }
        .events-modal { width: 900px; }
        .event-detail-modal { width: 600px; }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        .modal-header h2 {
          margin: 0;
          color: #111827;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #6b7280;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .close-button:hover {
          background: #f3f4f6;
          color: #111827;
        }
        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          max-height: calc(90vh - 120px);
        }
        .modal-events-table {
          width: 100%;
          border-collapse: collapse;
        }
        .modal-events-table th,
        .modal-events-table td {
          padding: 0.75rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .modal-events-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .modal-events-table tbody tr:hover { background: #f9fafb; }
        .event-name-button {
          background: none;
          border: none;
          color: #3b82f6;
          cursor: pointer;
          text-decoration: underline;
          font-size: inherit;
          padding: 0;
        }
        .event-name-button:hover { color: #2563eb; }
        .event-details {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .detail-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .detail-group label {
          font-weight: 600;
          color: #374151;
          font-size: 0.875rem;
        }
        .detail-group p {
          margin: 0;
          color: #111827;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .admin-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .change-password-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        .change-password-button:hover { background: #2563eb; }
        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        @media (max-width: 768px) {
          .modal-content { width: 95vw; margin: 1rem; }
          .modal-events-table { font-size: 0.875rem; }
          .admin-header-content { flex-direction: column; gap: 1rem; text-align: center; }
          .admin-user-info { flex-direction: column; gap: 0.5rem; }
          .admin-actions { flex-direction: column; gap: 0.5rem; width: 100%; }
          .change-password-button, .logout-button { width: 100%; justify-content: center; }
          .table-header { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .admin-actions { flex-direction: column; width: 100%; }
          .change-password-button, .logout-button { width: 100%; }
        }
      `}</style>
    </div>
  )
}