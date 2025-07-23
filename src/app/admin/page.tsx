"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
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
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    fetchEvents()
  }, [])

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

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) {
      return { text: "ยังไม่ถึงวันจัดกิจกรรม", className: "status-badge upcoming" }
    } else if (now >= start && now <= end) {
      return { text: "อยู่ระหว่างจัดกิจกรรม", className: "status-badge ongoing" }
    } else {
      return { text: "จัดกิจกรรมแล้ว", className: "status-badge completed" }
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

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("คุณต้องการลบกิจกรรมนี้หรือไม่?")) {
      try {
        const response = await fetch(`/api/events/${eventId}`, {
          method: "DELETE"
        })
        if (response.ok) {
          fetchEvents()
        }
      } catch (error) {
        console.error("Error deleting event:", error)
      }
    }
  }

  const handleFormSuccess = () => {
    fetchEvents()
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

  if (status === "loading" || loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const ongoingEvents = events.filter(event => {
    const now = new Date()
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    return now >= start && now <= end
  }).length

  const upcomingEvents = events.filter(event => new Date(event.startDate) > new Date()).length

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
            <span style={{color: '#374151'}}>สวัสดี, {session?.user?.name || session?.user?.email}</span>
            <div className="admin-actions">
              <button
                onClick={() => router.push("/admin/change-password")}
                className="change-password-button"
                title="เปลี่ยนรหัสผ่าน"
              >
                <span>🔐</span>
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>
              <button
                onClick={() => signOut()}
                className="logout-button"
              >
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
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon green">📅</div>
              <div className="stat-info">
                <h3>กิจกรรมทั้งหมด</h3>
                <p>{events.length}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon blue">👥</div>
              <div className="stat-info">
                <h3>กิจกรรมที่กำลังจัด</h3>
                <p>{ongoingEvents}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon red">⚙️</div>
              <div className="stat-info">
                <h3>กิจกรรมที่กำลังจะมา</h3>
                <p>{upcomingEvents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={handleAddNewEvent}
            className="action-button primary"
          >
            <span>➕</span>
            <span>เพิ่มกิจกรรมใหม่</span>
          </button>
          
          <button
            onClick={() => router.push("/")}
            className="action-button secondary"
          >
            <span>📅</span>
            <span>ดูปฏิทินกิจกรรม</span>
          </button>
        </div>

        {/* Events List */}
        <div className="events-table-container">
          <div className="table-header">
            <h2>รายการกิจกรรม</h2>
          </div>
          
          <div style={{overflowX: 'auto'}}>
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
                    <td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                      ยังไม่มีกิจกรรม
                    </td>
                  </tr>
                ) : (
                  events.map((event) => {
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
                          <div className="event-date">
                            {formatDate(event.startDate)}
                          </div>
                          <div className="event-date-end">
                            ถึง {formatDate(event.endDate)}
                          </div>
                        </td>
                        <td style={{color: '#111827'}}>
                          {event.location}
                        </td>
                        <td>
                          <span className={status.className}>
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons-cell">
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

      <style jsx>{`
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

        .change-password-button:hover {
          background: #2563eb;
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .admin-header-content {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .admin-user-info {
            flex-direction: column;
            gap: 0.5rem;
          }

          .admin-actions {
            flex-direction: column;
            gap: 0.5rem;
            width: 100%;
          }

          .change-password-button,
          .logout-button {
            width: 100%;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .admin-actions {
            flex-direction: column;
            width: 100%;
          }

          .change-password-button,
          .logout-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}