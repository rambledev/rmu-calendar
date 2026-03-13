// src/app/admin/page.tsx
"use client"

import { useState, useEffect } from "react"
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
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [showEventsTable, setShowEventsTable] = useState(false)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [tableTitle, setTableTitle] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [sortBy, setSortBy] = useState<'date-asc' | 'date-desc' | 'status'>('date-asc')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const handleSignOut = async () => {
    await fetch('/api/logout', { method: 'POST' })
    window.location.href = '/auth/signin'
  }

  useEffect(() => {
    fetchCurrentUser()
    fetchEvents()
    fetchAllEvents()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/me")
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data)
      } else {
        router.push("/auth/signin")
      }
    } catch {
      router.push("/auth/signin")
    } finally {
      setAuthLoading(false)
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

  const canEditDelete = (event: Event): boolean => {
    if (!currentUser) return false
    const role = currentUser.role
    if (role === 'SUPER-ADMIN' || role === 'SUPERADMIN') return true
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
    if (now < start) return { text: "ยังไม่ถึงวันจัดกิจกรรม", className: "status-badge upcoming" }
    if (now >= start && now <= end) return { text: "อยู่ระหว่างจัดกิจกรรม", className: "status-badge ongoing" }
    return { text: "ผ่านไปแล้ว", className: "status-badge completed" }
  }

  const getSortedEvents = () => {
    const sorted = [...events]
    switch (sortBy) {
      case 'date-asc': return sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      case 'date-desc': return sorted.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
      case 'status':
        const order: Record<string, number> = { ongoing: 0, upcoming: 1, completed: 2 }
        return sorted.sort((a, b) => order[getStatusKey(a)] - order[getStatusKey(b)])
      default: return sorted
    }
  }

  const calculateEventStats = (): EventStats => {
    const now = new Date()
    let total = 0, ongoing = 0, upcoming = 0, completed = 0
    allEvents.forEach(event => {
      total++
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      if (now < start) upcoming++
      else if (now >= start && now <= end) ongoing++
      else completed++
    })
    return { total, ongoing, upcoming, completed }
  }

  const stats = calculateEventStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("คุณต้องการลบกิจกรรมนี้หรือไม่?")) {
      try {
        const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
        if (response.ok) { fetchEvents(); fetchAllEvents() }
      } catch (error) {
        console.error("Error deleting event:", error)
      }
    }
  }

  const handleFormSuccess = () => {
    fetchEvents(); fetchAllEvents()
    setShowEventForm(false); setEditingEvent(null)
  }

  const handleStatCardClick = (type: 'total' | 'ongoing' | 'upcoming' | 'completed') => {
    const now = new Date()
    let filtered: Event[] = []
    let title = ""
    switch (type) {
      case 'total': filtered = allEvents; title = "กิจกรรมทั้งหมด"; break
      case 'ongoing':
        filtered = allEvents.filter(e => { const s = new Date(e.startDate); const en = new Date(e.endDate); return now >= s && now <= en })
        title = "กิจกรรมที่กำลังจัด"; break
      case 'upcoming': filtered = allEvents.filter(e => new Date(e.startDate) > now); title = "กิจกรรมที่กำลังจะมา"; break
      case 'completed': filtered = allEvents.filter(e => new Date(e.endDate) < now); title = "กิจกรรมที่จัดแล้ว"; break
    }
    setFilteredEvents(filtered); setTableTitle(title); setShowEventsTable(true)
  }

  if (authLoading || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  return (
    <div className="admin-container">
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
            <span style={{ color: '#374151' }}>สวัสดี, {currentUser?.email}</span>
            <div className="admin-actions">
              <button onClick={() => router.push("/admin/change-password")} className="change-password-button">
                <span>🔐</span><span>เปลี่ยนรหัสผ่าน</span>
              </button>
              <button onClick={handleSignOut} className="logout-button">
                <span>🚪</span><span>ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-content">
        <div className="stats-grid">
          <div className="stat-card clickable" onClick={() => handleStatCardClick('total')}>
            <div className="stat-content">
              <div className="stat-icon green">📅</div>
              <div className="stat-info"><h3>กิจกรรมทั้งหมด</h3><p>{stats.total}</p></div>
            </div>
          </div>
          <div className="stat-card clickable" onClick={() => handleStatCardClick('ongoing')}>
            <div className="stat-content">
              <div className="stat-icon blue">👥</div>
              <div className="stat-info"><h3>กิจกรรมที่กำลังจัด</h3><p>{stats.ongoing}</p></div>
            </div>
          </div>
          <div className="stat-card clickable" onClick={() => handleStatCardClick('upcoming')}>
            <div className="stat-content">
              <div className="stat-icon red">⚙️</div>
              <div className="stat-info"><h3>กิจกรรมที่กำลังจะมา</h3><p>{stats.upcoming}</p></div>
            </div>
          </div>
          <div className="stat-card clickable" onClick={() => handleStatCardClick('completed')}>
            <div className="stat-content">
              <div className="stat-icon purple">✅</div>
              <div className="stat-info"><h3>กิจกรรมที่จัดแล้ว</h3><p>{stats.completed}</p></div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => { setEditingEvent(null); setShowEventForm(true) }} className="action-button primary">
            <span>➕</span><span>เพิ่มกิจกรรมใหม่</span>
          </button>
          <button onClick={() => router.push("/calendar")} className="action-button secondary">
            <span>📅</span><span>ดูปฏิทินกิจกรรมรวม</span>
          </button>
        </div>

        <div className="events-table-container">
          <div className="table-header">
            <h2>รายการกิจกรรมของคุณ</h2>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#374151', background: 'white', cursor: 'pointer' }}>
              <option value="date-asc">📅 วันที่ เก่า → ใหม่</option>
              <option value="date-desc">📅 วันที่ ใหม่ → เก่า</option>
              <option value="status">🔄 เรียงตามสถานะ</option>
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="events-table">
              <thead>
                <tr><th>กิจกรรม</th><th>วันที่จัด</th><th>สถานที่</th><th>สถานะ</th><th>จัดการ</th></tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>ยังไม่มีกิจกรรม</td></tr>
                ) : (
                  getSortedEvents().map((event) => {
                    const eventStatus = getEventStatus(event.startDate, event.endDate)
                    return (
                      <tr key={event.id}>
                        <td>
                          <div className="event-title">{event.title}</div>
                          <div className="event-organizer">จัดโดย: {event.organizer}</div>
                        </td>
                        <td>
                          <div className="event-date">{formatDate(event.startDate)}</div>
                          <div className="event-date-end">ถึง {formatDate(event.endDate)}</div>
                        </td>
                        <td style={{ color: '#111827' }}>{event.location}</td>
                        <td><span className={eventStatus.className}>{eventStatus.text}</span></td>
                        <td>
                          <div className="action-buttons-cell">
                            {canEditDelete(event) ? (
                              <>
                                <button onClick={() => { setEditingEvent(event); setShowEventForm(true) }} className="icon-button edit" title="แก้ไข">✏️</button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="icon-button delete" title="ลบ">🗑️</button>
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

      {showEventForm && (
        <EventForm onClose={() => { setShowEventForm(false); setEditingEvent(null) }} onSuccess={handleFormSuccess} editEvent={editingEvent} />
      )}

      {showEventsTable && (
        <div className="modal-overlay" onClick={() => setShowEventsTable(false)}>
          <div className="modal-content events-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{tableTitle} ({filteredEvents.length} รายการ)</h2>
              <button className="close-button" onClick={() => setShowEventsTable(false)}>✕</button>
            </div>
            <div className="modal-body">
              <table className="modal-events-table">
                <thead><tr><th style={{ width: '50px' }}>ลำดับ</th><th>ชื่อกิจกรรม</th><th>หน่วยงาน</th><th>วันที่จัดกิจกรรม</th></tr></thead>
                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>ไม่มีกิจกรรมในหมวดนี้</td></tr>
                  ) : (
                    filteredEvents.map((event, index) => (
                      <tr key={event.id}>
                        <td style={{ textAlign: 'center' }}>{index + 1}</td>
                        <td><button className="event-name-button" onClick={() => setSelectedEvent(event)}>{event.title}</button></td>
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

      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content event-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>รายละเอียดกิจกรรม</h2>
              <button className="close-button" onClick={() => setSelectedEvent(null)}>✕</button>
            </div>
            <div className="modal-body event-details">
              <div className="detail-group"><label>ชื่อกิจกรรม:</label><p>{selectedEvent.title}</p></div>
              <div className="detail-group"><label>รายละเอียด:</label><p>{selectedEvent.description || 'ไม่มีรายละเอียด'}</p></div>
              <div className="detail-group"><label>หน่วยงานที่จัด:</label><p>{selectedEvent.organizer}</p></div>
              <div className="detail-group"><label>สถานที่:</label><p>{selectedEvent.location}</p></div>
              <div className="detail-group"><label>วันที่เริ่ม:</label><p>{formatDate(selectedEvent.startDate)}</p></div>
              <div className="detail-group"><label>วันที่สิ้นสุด:</label><p>{formatDate(selectedEvent.endDate)}</p></div>
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
    </div>
  )
}
