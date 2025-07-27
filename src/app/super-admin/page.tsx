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

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: string
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'users'>('events')
  
  // User Management States
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditUserForm, setShowEditUserForm] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADMIN'
  })
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    resetPassword: false,
    newPassword: ''
  })

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/auth/signin')
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    fetchEvents()
    fetchUsers()
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

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
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

  // Event Management Functions
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

  // User Management Functions
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      })

      if (response.ok) {
        fetchUsers()
        setShowUserForm(false)
        setNewUser({ name: '', email: '', password: '', role: 'ADMIN' })
        alert('สร้างผู้ใช้ใหม่สำเร็จ')
      } else {
        const error = await response.text()
        alert(`เกิดข้อผิดพลาด: ${error}`)
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้')
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === session?.user?.email) {
      alert('ไม่สามารถลบบัญชีของตัวเองได้')
      return
    }

    if (confirm(`คุณต้องการลบผู้ใช้ ${userEmail} หรือไม่?`)) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          fetchUsers()
          alert('ลบผู้ใช้สำเร็จ')
        } else {
          const error = await response.text()
          alert(`เกิดข้อผิดพลาด: ${error}`)
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('เกิดข้อผิดพลาดในการลบผู้ใช้')
      }
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        fetchUsers()
        alert('อัพเดทบทบาทสำเร็จ')
      } else {
        const error = await response.text()
        alert(`เกิดข้อผิดพลาด: ${error}`)
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดทบทบาท')
    }
  }

  const handleEditUser = (user: User) => {
    setEditUser({
      id: user.id,
      name: user.name || '',
      email: user.email,
      role: user.role,
      resetPassword: false,
      newPassword: ''
    })
    setShowEditUserForm(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editUser.name) {
      alert('กรุณากรอกชื่อ')
      return
    }

    if (editUser.resetPassword && (!editUser.newPassword || editUser.newPassword.length < 6)) {
      alert('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    try {
      const updateData: any = {
        name: editUser.name,
        role: editUser.role
      }

      if (editUser.resetPassword && editUser.newPassword) {
        updateData.password = editUser.newPassword
      }

      const response = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        fetchUsers()
        setShowEditUserForm(false)
        setEditUser({
          id: '',
          name: '',
          email: '',
          role: '',
          resetPassword: false,
          newPassword: ''
        })
        alert('อัพเดทข้อมูลผู้ใช้สำเร็จ')
      } else {
        const error = await response.text()
        alert(`เกิดข้อผิดพลาด: ${error}`)
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('เกิดข้อผิดพลาดในการอัพเดทข้อมูลผู้ใช้')
    }
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

  const usersByRole = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-content">
          <div className="admin-logo">
            <div className="icon-container">👑</div>
            <div className="admin-info">
              <h1>แผงควบคุม SUPER ADMIN</h1>
              <p>จัดการระบบทั้งหมด มรม.</p>
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
                onClick={handleSignOut}
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
              <div className="stat-icon orange">⚙️</div>
              <div className="stat-info">
                <h3>กิจกรรมที่กำลังจะมา</h3>
                <p>{upcomingEvents}</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon purple">👤</div>
              <div className="stat-info">
                <h3>ผู้ใช้ทั้งหมด</h3>
                <p>{users.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            onClick={() => setActiveTab('events')}
            className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
          >
            📅 จัดการกิจกรรม
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          >
            👥 จัดการผู้ใช้
          </button>
        </div>

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="tab-content">
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
            onClick={() => router.push("/calendar")}
            className="action-button secondary"
          >
            <span>📅</span>
            <span>ดูปฏิทินกิจกรรมรวม</span>
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
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            {/* User Stats */}
            <div className="user-stats">
              <h3>สถิติผู้ใช้ตามบทบาท</h3>
              <div className="role-stats-grid">
                {Object.entries(usersByRole).map(([role, count]) => (
                  <div key={role} className="role-stat-item">
                    <span className="role-name">{role}</span>
                    <span className="role-count">{count} คน</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button
                onClick={() => setShowUserForm(true)}
                className="action-button primary"
              >
                <span>👤</span>
                <span>เพิ่มผู้ใช้ใหม่</span>
              </button>
            </div>

            {/* Users List */}
            <div className="users-table-container">
              <div className="table-header">
                <h2>รายการผู้ใช้ทั้งหมด</h2>
              </div>
              
              <div style={{overflowX: 'auto'}}>
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ชื่อ</th>
                      <th>อีเมล</th>
                      <th>บทบาท</th>
                      <th>วันที่สร้าง</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{textAlign: 'center', padding: '2rem', color: '#6b7280'}}>
                          ยังไม่มีผู้ใช้
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                              className="role-select"
                              disabled={user.email === session?.user?.email}
                            >
                              <option value="ADMIN">ADMIN</option>
                              <option value="CIO">CIO</option>
                              <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <div className="action-buttons-cell">
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="icon-button edit"
                                title="แก้ไขข้อมูล"
                              >
                                ✏️
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id, user.email)}
                                className="icon-button delete"
                                title="ลบผู้ใช้"
                                disabled={user.email === session?.user?.email}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      {showEventForm && (
        <EventForm
          onClose={handleCloseForm}
          onSuccess={handleFormSuccess}
          editEvent={editingEvent}
        />
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="event-form-overlay">
          <div className="event-form-container">
            <div className="event-form-header">
              <h3>เพิ่มผู้ใช้ใหม่</h3>
              <button onClick={() => setShowUserForm(false)} className="close-button">×</button>
            </div>
            
            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-group">
                <label>ชื่อ:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>อีเมล:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>รหัสผ่าน:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label>บทบาท:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="CIO">CIO</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowUserForm(false)} className="btn-cancel">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-submit">
                  สร้างผู้ใช้
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Form Modal */}
      {showEditUserForm && (
        <div className="event-form-overlay">
          <div className="event-form-container">
            <div className="event-form-header">
              <h3>แก้ไขข้อมูลผู้ใช้</h3>
              <button onClick={() => setShowEditUserForm(false)} className="close-button">×</button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="user-form">
              <div className="form-group">
                <label>ชื่อ:</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => setEditUser({...editUser, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>อีเมล:</label>
                <input
                  type="email"
                  value={editUser.email}
                  disabled
                  className="disabled-input"
                />
                <small>ไม่สามารถเปลี่ยนอีเมลได้</small>
              </div>
              
              <div className="form-group">
                <label>บทบาท:</label>
                <select
                  value={editUser.role}
                  onChange={(e) => setEditUser({...editUser, role: e.target.value})}
                  disabled={editUser.email === session?.user?.email}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="CIO">CIO</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
                {editUser.email === session?.user?.email && (
                  <small>ไม่สามารถเปลี่ยนบทบาทของตัวเองได้</small>
                )}
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={editUser.resetPassword}
                    onChange={(e) => setEditUser({...editUser, resetPassword: e.target.checked, newPassword: ''})}
                  />
                  รีเซ็ตรหัสผ่าน
                </label>
              </div>
              
              {editUser.resetPassword && (
                <div className="form-group">
                  <label>รหัสผ่านใหม่:</label>
                  <input
                    type="password"
                    value={editUser.newPassword}
                    onChange={(e) => setEditUser({...editUser, newPassword: e.target.value})}
                    required={editUser.resetPassword}
                    minLength={6}
                    placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  />
                </div>
              )}
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditUserForm(false)} className="btn-cancel">
                  ยกเลิก
                </button>
                <button type="submit" className="btn-submit">
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
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

        .logout-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .logout-button:hover {
          background: #dc2626;
        }

        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .tab-navigation {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          border-bottom: 2px solid #e5e7eb;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-button.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-button:hover {
          color: #3b82f6;
        }

        .tab-content {
          margin-top: 2rem;
        }

        .stat-icon.orange {
          background: #f97316;
        }

        .stat-icon.purple {
          background: #8b5cf6;
        }

        .user-stats {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .user-stats h3 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .role-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .role-stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }

        .role-name {
          font-weight: 500;
          color: #374151;
        }

        .role-count {
          font-weight: bold;
          color: #3b82f6;
        }

        .users-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th,
        .users-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .users-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }

        .users-table tr:hover {
          background: #f9fafb;
        }

        .role-select {
          padding: 0.25rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .role-select:disabled {
          background: #f3f4f6;
          color: #6b7280;
          cursor: not-allowed;
        }

        .user-form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .btn-cancel {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-cancel:hover {
          background: #f9fafb;
        }

        .btn-submit {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .btn-submit:hover {
          background: #2563eb;
        }

        .disabled-input {
          background: #f3f4f6 !important;
          color: #6b7280 !important;
          cursor: not-allowed !important;
        }

        .form-group small {
          display: block;
          margin-top: 0.25rem;
          color: #6b7280;
          font-size: 0.75rem;
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0 !important;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto !important;
          margin: 0 !important;
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

          .tab-navigation {
            flex-direction: column;
          }

          .tab-button {
            width: 100%;
            text-align: left;
          }

          .role-stats-grid {
            grid-template-columns: 1fr;
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