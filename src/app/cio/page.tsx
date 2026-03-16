// src/app/cio/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { logoutAction } from "@/app/actions/auth"

interface Event {
  id: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  location: string
  organizer: string
  createdAt: string
}

interface EventStats {
  total: number
  ongoing: number
  upcoming: number
  completed: number
  thisMonth: number
  thisWeek: number
}

interface CurrentUser {
  id: string
  email: string
  role: string
}

export default function CIODashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EventStats>({
    total: 0, ongoing: 0, upcoming: 0, completed: 0, thisMonth: 0, thisWeek: 0
  })
  const [selectedView, setSelectedView] = useState<string | null>(null)
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showEventModal, setShowEventModal] = useState(false)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    console.log(`[CIOPage] fetchCurrentUser START`)
    try {
      const res = await fetch("/api/me")
      if (!res.ok) {
        console.log(`[CIOPage] fetchCurrentUser NOT OK status=${res.status}, redirect to signin`)
        router.push("/auth/signin")
        return
      }
      const data = await res.json()
      console.log(`[CIOPage] fetchCurrentUser SUCCESS email=${data.email} role=${data.role}`)
      setCurrentUser(data)
      fetchEvents()
    } catch (err) {
      console.error(`[CIOPage] fetchCurrentUser ERROR:`, err)
      router.push("/auth/signin")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    console.log(`[CIOPage] handleSignOut START`)
    await logoutAction()
    console.log(`[CIOPage] handleSignOut DONE redirect to signin`)
    window.location.href = "/auth/signin"
  }

  const fetchEvents = async () => {
    console.log(`[CIOPage] fetchEvents START`)
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        console.log(`[CIOPage] fetchEvents SUCCESS count=${data.length}`)
        setEvents(data)
        calculateStats(data)
      } else {
        console.log(`[CIOPage] fetchEvents NOT OK status=${response.status}`)
      }
    } catch (err) {
      console.error(`[CIOPage] fetchEvents ERROR:`, err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (events: Event[]) => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const result = events.reduce((acc, event) => {
      const startDate = new Date(event.startDate)
      const endDate = new Date(event.endDate)
      const currentDate = new Date()
      acc.total++
      if (currentDate < startDate) acc.upcoming++
      else if (currentDate >= startDate && currentDate <= endDate) acc.ongoing++
      else acc.completed++
      if (startDate >= startOfMonth) acc.thisMonth++
      if (startDate >= startOfWeek) acc.thisWeek++
      return acc
    }, { total: 0, ongoing: 0, upcoming: 0, completed: 0, thisMonth: 0, thisWeek: 0 })

    setStats(result)
  }

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (now < start) return { text: "ยังไม่ถึงวันจัดกิจกรรม", className: "status-badge upcoming" }
    if (now >= start && now <= end) return { text: "อยู่ระหว่างจัดกิจกรรม", className: "status-badge ongoing" }
    return { text: "จัดกิจกรรมแล้ว", className: "status-badge completed" }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }

  const getRecentEvents = () => {
    return [...events]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    return events
      .filter(event => new Date(event.startDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 5)
  }

  const handleCardClick = (type: string) => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    let filtered: Event[] = []
    switch (type) {
      case 'total': filtered = events; break
      case 'ongoing': filtered = events.filter(e => { const s = new Date(e.startDate); const en = new Date(e.endDate); const c = new Date(); return c >= s && c <= en }); break
      case 'upcoming': filtered = events.filter(e => new Date(e.startDate) > new Date()); break
      case 'completed': filtered = events.filter(e => new Date(e.endDate) < new Date()); break
      case 'thisMonth': filtered = events.filter(e => new Date(e.startDate) >= startOfMonth); break
      case 'thisWeek': filtered = events.filter(e => new Date(e.startDate) >= startOfWeek); break
      default: filtered = events
    }
    setFilteredEvents(filtered)
    setSelectedView(type)
  }

  const getViewTitle = (type: string) => {
    const titles: Record<string, string> = {
      total: 'กิจกรรมทั้งหมด', ongoing: 'กิจกรรมที่กำลังจัด',
      upcoming: 'กิจกรรมที่กำลังจะมา', completed: 'กิจกรรมที่จัดแล้ว',
      thisMonth: 'กิจกรรมเดือนนี้', thisWeek: 'กิจกรรมสัปดาห์นี้'
    }
    return titles[type] || 'กิจกรรม'
  }

  if (authLoading || loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <div className="icon-container">📊</div>
            <div className="admin-info">
              <h1>แดชบอร์ด CIO</h1>
              <p>ภาพรวมและสถิติกิจกรรม มรม.</p>
            </div>
          </div>
          <div className="admin-user-info">
            <span style={{ color: '#374151' }}>สวัสดี, {currentUser?.email}</span>
            <div className="admin-actions">
              <button onClick={() => router.push("/cio/change-password")} className="change-password-button">
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
        {selectedView ? (
          <div className="filtered-view">
            <div className="view-header">
              <button onClick={() => { setSelectedView(null); setFilteredEvents([]) }} className="back-button">← กลับสู่ภาพรวม</button>
              <h2>{getViewTitle(selectedView)} ({filteredEvents.length} รายการ)</h2>
            </div>
            <div className="filtered-events-grid">
              {filteredEvents.length === 0 ? (
                <div className="no-events"><p>ไม่มีกิจกรรมในหมวดนี้</p></div>
              ) : (
                filteredEvents.map((event) => {
                  const status = getEventStatus(event.startDate, event.endDate)
                  return (
                    <div key={event.id} className="event-card clickable" onClick={() => { setSelectedEvent(event); setShowEventModal(true) }}>
                      <div className="event-card-header">
                        <h4 className="event-title">{event.title}</h4>
                        <span className={status.className}>{status.text}</span>
                      </div>
                      <div className="event-card-body">
                        <p className="event-organizer">จัดโดย: {event.organizer}</p>
                        <p className="event-location">📍 {event.location}</p>
                        <p className="event-date">🗓️ {formatDate(event.startDate)}</p>
                        {event.description && (
                          <p className="event-description">
                            {event.description.length > 100 ? `${event.description.substring(0, 100)}...` : event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="stats-grid">
              {[
                { type: 'total', icon: '📅', color: 'blue', label: 'กิจกรรมทั้งหมด', value: stats.total },
                { type: 'ongoing', icon: '🎯', color: 'green', label: 'กิจกรรมที่กำลังจัด', value: stats.ongoing },
                { type: 'upcoming', icon: '⏳', color: 'orange', label: 'กิจกรรมที่กำลังจะมา', value: stats.upcoming },
                { type: 'completed', icon: '✅', color: 'purple', label: 'กิจกรรมที่จัดแล้ว', value: stats.completed },
              ].map(item => (
                <div key={item.type} className="stat-card clickable" onClick={() => handleCardClick(item.type)}>
                  <div className="stat-content">
                    <div className={`stat-icon ${item.color}`}>{item.icon}</div>
                    <div className="stat-info"><h3>{item.label}</h3><p>{item.value}</p></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="stats-grid" style={{ marginTop: '1.5rem' }}>
              {[
                { type: 'thisMonth', icon: '📈', color: 'teal', label: 'กิจกรรมเดือนนี้', value: stats.thisMonth, note: 'เพิ่มขึ้นจากเดือนที่แล้ว' },
                { type: 'thisWeek', icon: '📊', color: 'indigo', label: 'กิจกรรมสัปดาห์นี้', value: stats.thisWeek, note: 'กิจกรรมที่เริ่มในสัปดาห์นี้' },
              ].map(item => (
                <div key={item.type} className="stat-card clickable" onClick={() => handleCardClick(item.type)}>
                  <div className="stat-content">
                    <div className={`stat-icon ${item.color}`}>{item.icon}</div>
                    <div className="stat-info">
                      <h3>{item.label}</h3><p>{item.value}</p>
                      <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>{item.note}</small>
                    </div>
                  </div>
                </div>
              ))}
              <div className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon rose">🎯</div>
                  <div className="stat-info">
                    <h3>อัตราความสำเร็จ</h3>
                    <p>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
                    <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>กิจกรรมที่จัดสำเร็จ</small>
                  </div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-content">
                  <div className="stat-icon amber">📋</div>
                  <div className="stat-info">
                    <h3>ค่าเฉลี่ยต่อเดือน</h3>
                    <p>{Math.round(stats.total / 12)}</p>
                    <small style={{ color: '#6b7280', fontSize: '0.875rem' }}>กิจกรรมต่อเดือน</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons" style={{ marginTop: '2rem' }}>
              <button onClick={() => router.push("/calendar")} className="action-button secondary"><span>📅</span><span>ดูปฏิทินกิจกรรมรวม</span></button>
              <button onClick={() => router.push("/admin")} className="action-button secondary"><span>⚙️</span><span>จัดการกิจกรรม</span></button>
              <button onClick={() => window.print()} className="action-button secondary"><span>🖨️</span><span>พิมพ์รายงาน</span></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
              <div className="events-table-container">
                <div className="table-header"><h2>กิจกรรมล่าสุด</h2></div>
                <div className="events-list">
                  {getRecentEvents().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>ยังไม่มีกิจกรรม</div>
                  ) : getRecentEvents().map((event) => {
                    const status = getEventStatus(event.startDate, event.endDate)
                    return (
                      <div key={event.id} className="event-card clickable" onClick={() => { setSelectedEvent(event); setShowEventModal(true) }}>
                        <div className="event-card-header">
                          <h4 className="event-title">{event.title}</h4>
                          <span className={status.className}>{status.text}</span>
                        </div>
                        <div className="event-card-body">
                          <p className="event-organizer">จัดโดย: {event.organizer}</p>
                          <p className="event-location">📍 {event.location}</p>
                          <p className="event-date">🗓️ {formatDate(event.startDate)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="events-table-container">
                <div className="table-header"><h2>กิจกรรมที่กำลังจะมา</h2></div>
                <div className="events-list">
                  {getUpcomingEvents().length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>ไม่มีกิจกรรมที่กำลังจะมา</div>
                  ) : getUpcomingEvents().map((event) => {
                    const daysUntil = Math.ceil((new Date(event.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={event.id} className="event-card upcoming clickable" onClick={() => { setSelectedEvent(event); setShowEventModal(true) }}>
                        <div className="event-card-header">
                          <h4 className="event-title">{event.title}</h4>
                          <span className="days-until">{daysUntil === 0 ? 'วันนี้' : `อีก ${daysUntil} วัน`}</span>
                        </div>
                        <div className="event-card-body">
                          <p className="event-organizer">จัดโดย: {event.organizer}</p>
                          <p className="event-location">📍 {event.location}</p>
                          <p className="event-date">🗓️ {formatDate(event.startDate)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => { setShowEventModal(false); setSelectedEvent(null) }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedEvent.title}</h2>
              <button onClick={() => { setShowEventModal(false); setSelectedEvent(null) }} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="event-details">
                {[
                  { label: 'ชื่อกิจกรรม', value: selectedEvent.title },
                  { label: 'ผู้จัด', value: selectedEvent.organizer },
                  { label: 'สถานที่', value: `📍 ${selectedEvent.location}` },
                  { label: 'วันที่เริ่ม', value: `🗓️ ${formatDate(selectedEvent.startDate)}` },
                  { label: 'วันที่สิ้นสุด', value: `🗓️ ${formatDate(selectedEvent.endDate)}` },
                  { label: 'วันที่สร้าง', value: formatDate(selectedEvent.createdAt) },
                ].map(item => (
                  <div key={item.label} className="detail-item">
                    <strong>{item.label}:</strong>
                    <span>{item.value}</span>
                  </div>
                ))}
                <div className="detail-item">
                  <strong>สถานะ:</strong>
                  <span className={getEventStatus(selectedEvent.startDate, selectedEvent.endDate).className}>
                    {getEventStatus(selectedEvent.startDate, selectedEvent.endDate).text}
                  </span>
                </div>
                {selectedEvent.description && (
                  <div className="detail-item description">
                    <strong>คำอธิบาย:</strong>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowEventModal(false); setSelectedEvent(null) }} className="button secondary">ปิด</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-actions { display: flex; align-items: center; gap: 0.75rem; }
        .admin-user-info { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .change-password-button { display: flex; align-items: center; gap: 0.5rem; background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .change-password-button:hover { background: #2563eb; }
        .logout-button { display: flex; align-items: center; gap: 0.5rem; background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .logout-button:hover { background: #dc2626; }
        .clickable { cursor: pointer; transition: all 0.2s ease; }
        .clickable:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .filtered-view { width: 100%; }
        .view-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid #e5e7eb; }
        .view-header h2 { margin: 0; color: #111827; font-size: 1.5rem; font-weight: 600; }
        .back-button { background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .back-button:hover { background: #2563eb; }
        .filtered-events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; }
        .no-events { grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: #6b7280; font-size: 1.125rem; }
        .events-list { display: flex; flex-direction: column; gap: 1rem; max-height: 400px; overflow-y: auto; padding: 1rem; }
        .event-card { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; transition: all 0.2s; }
        .event-card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); transform: translateY(-1px); }
        .event-card.upcoming { border-left: 4px solid #3b82f6; }
        .event-card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem; }
        .event-card-header h4 { margin: 0; font-size: 1rem; font-weight: 600; color: #111827; flex: 1; margin-right: 1rem; }
        .event-card-body p { margin: 0.25rem 0; font-size: 0.875rem; color: #6b7280; }
        .event-description { color: #374151 !important; font-style: italic; margin-top: 0.5rem !important; }
        .days-until { background: #dbeafe; color: #1d4ed8; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal-content { background: white; border-radius: 12px; width: 100%; max-width: 600px; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #e5e7eb; }
        .modal-header h2 { margin: 0; font-size: 1.5rem; font-weight: 600; color: #111827; }
        .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280; padding: 0.25rem; border-radius: 4px; }
        .modal-close:hover { background: #f3f4f6; color: #111827; }
        .modal-body { padding: 1.5rem; }
        .event-details { display: flex; flex-direction: column; gap: 1rem; }
        .detail-item { display: flex; align-items: flex-start; gap: 0.75rem; }
        .detail-item.description { flex-direction: column; align-items: stretch; }
        .detail-item strong { min-width: 120px; color: #374151; font-weight: 600; }
        .detail-item span { color: #6b7280; flex: 1; }
        .detail-item p { margin: 0.5rem 0 0 0; color: #6b7280; line-height: 1.5; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.5rem; border-top: 1px solid #e5e7eb; }
        .button { padding: 0.75rem 1.5rem; border-radius: 6px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; }
        .button.secondary { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; }
        .button.secondary:hover { background: #e5e7eb; }
        .stat-icon.teal { background: #14b8a6; }
        .stat-icon.indigo { background: #6366f1; }
        .stat-icon.rose { background: #f43f5e; }
        .stat-icon.amber { background: #f59e0b; }
        .stat-icon.orange { background: #f97316; }
        .stat-icon.purple { background: #a855f7; }
        .stat-icon.blue { background: #3b82f6; }
        .stat-icon.green { background: #10b981; }
        .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500; white-space: nowrap; }
        .status-badge.upcoming { background: #fef3c7; color: #d97706; }
        .status-badge.ongoing { background: #d1fae5; color: #059669; }
        .status-badge.completed { background: #e0e7ff; color: #5b21b6; }
        .loading-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f9fafb; }
        .loading-spinner { width: 40px; height: 40px; border: 4px solid #e5e7eb; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .admin-container { min-height: 100vh; background: #f9fafb; }
        .admin-header { background: white; border-bottom: 1px solid #e5e7eb; padding: 1rem 0; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
        .admin-header-content { max-width: 1200px; margin: 0 auto; padding: 0 1rem; display: flex; justify-content: space-between; align-items: center; }
        .admin-logo { display: flex; align-items: center; gap: 1rem; }
        .icon-container { width: 48px; height: 48px; background: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        .admin-info h1 { margin: 0; font-size: 1.5rem; font-weight: 700; color: #111827; }
        .admin-info p { margin: 0; color: #6b7280; font-size: 0.875rem; }
        .admin-content { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
        .stat-card { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; transition: all 0.2s ease; }
        .stat-card:hover { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .stat-content { padding: 1.5rem; display: flex; align-items: center; gap: 1rem; }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: white; }
        .stat-info h3 { margin: 0 0 0.5rem 0; font-size: 0.875rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
        .stat-info p { margin: 0; font-size: 2rem; font-weight: 700; color: #111827; }
        .action-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
        .action-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: none; }
        .action-button.secondary { background: white; color: #374151; border: 1px solid #d1d5db; }
        .action-button.secondary:hover { background: #f9fafb; }
        .events-table-container { background: white; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
        .table-header { padding: 1.5rem; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
        .table-header h2 { margin: 0; font-size: 1.125rem; font-weight: 600; color: #111827; }
        @media (max-width: 768px) {
          .admin-header-content { flex-direction: column; gap: 1rem; text-align: center; }
          .admin-user-info { flex-direction: column; gap: 0.5rem; }
          .admin-actions { flex-direction: column; gap: 0.5rem; width: 100%; }
          .change-password-button, .logout-button { width: 100%; justify-content: center; }
          .stats-grid { grid-template-columns: 1fr; }
          .filtered-events-grid { grid-template-columns: 1fr; }
          .action-buttons { justify-content: center; }
          .view-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        }
      `}</style>
    </div>
  )
}