"use client"

import { useState, useEffect, useMemo } from "react"
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

interface CurrentUser {
  id: string
  email: string
  role: string
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [events, setEvents] = useState<Event[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showEventForm, setShowEventForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [activeTab, setActiveTab] = useState<'events' | 'users'>('events')

  // Search & Sort - Events
  const [eventSearch, setEventSearch] = useState('')
  const [eventSortBy, setEventSortBy] = useState<'date-asc' | 'date-desc' | 'status' | 'title'>('date-asc')
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all')

  // Search & Sort - Users
  const [userSearch, setUserSearch] = useState('')
  const [userSortBy, setUserSortBy] = useState<'name' | 'email' | 'role' | 'date-asc' | 'date-desc'>('date-desc')
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'ADMIN' | 'CIO' | 'SUPERADMIN'>('all')

  // User Form States
  const [showUserForm, setShowUserForm] = useState(false)
  const [showEditUserForm, setShowEditUserForm] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'ADMIN' })
  const [editUser, setEditUser] = useState({
    id: '', name: '', email: '', role: '', resetPassword: false, newPassword: ''
  })

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push('/auth/signin')
  }

  useEffect(() => { fetchCurrentUser() }, [])

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (!res.ok) { router.push("/auth/signin"); return }
      const data = await res.json()
      if (data.role !== "SUPER-ADMIN" && data.role !== "SUPERADMIN") {
        router.push("/auth/signin"); return
      }
      setCurrentUser(data)
    } catch { router.push("/auth/signin") }
    finally { setAuthLoading(false) }
  }

  useEffect(() => {
    if (!authLoading && currentUser) { fetchEvents(); fetchUsers() }
  }, [authLoading, currentUser])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) setEvents(await response.json())
    } catch (error) { console.error("Error fetching events:", error) }
    finally { setLoading(false) }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) setUsers(await response.json())
    } catch (error) { console.error("Error fetching users:", error) }
  }

  const getStatusKey = (event: Event): 'ongoing' | 'upcoming' | 'completed' => {
    const now = new Date()
    if (now < new Date(event.startDate)) return 'upcoming'
    if (now <= new Date(event.endDate)) return 'ongoing'
    return 'completed'
  }

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    if (now < new Date(startDate)) return { text: "ยังไม่ถึงวันจัดกิจกรรม", className: "status-badge upcoming" }
    if (now <= new Date(endDate)) return { text: "อยู่ระหว่างจัดกิจกรรม", className: "status-badge ongoing" }
    return { text: "จัดกิจกรรมแล้ว", className: "status-badge completed" }
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  // Filtered & Sorted Events
  const filteredEvents = useMemo(() => {
    let result = [...events]
    if (eventStatusFilter !== 'all') result = result.filter(e => getStatusKey(e) === eventStatusFilter)
    if (eventSearch.trim()) {
      const q = eventSearch.toLowerCase()
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q)
      )
    }
    const statusOrder: Record<string, number> = { ongoing: 0, upcoming: 1, completed: 2 }
    switch (eventSortBy) {
      case 'date-asc': result.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()); break
      case 'date-desc': result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()); break
      case 'status': result.sort((a, b) => statusOrder[getStatusKey(a)] - statusOrder[getStatusKey(b)]); break
      case 'title': result.sort((a, b) => a.title.localeCompare(b.title, 'th')); break
    }
    return result
  }, [events, eventSearch, eventSortBy, eventStatusFilter])

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    let result = [...users]
    if (userRoleFilter !== 'all') result = result.filter(u => u.role === userRoleFilter)
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase()
      result = result.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      )
    }
    switch (userSortBy) {
      case 'name': result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th')); break
      case 'email': result.sort((a, b) => a.email.localeCompare(b.email)); break
      case 'role': result.sort((a, b) => a.role.localeCompare(b.role)); break
      case 'date-asc': result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case 'date-desc': result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
    }
    return result
  }, [users, userSearch, userSortBy, userRoleFilter])

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("คุณต้องการลบกิจกรรมนี้หรือไม่?")) {
      try {
        const response = await fetch(`/api/events/${eventId}`, { method: "DELETE" })
        if (response.ok) fetchEvents()
      } catch (error) { console.error("Error deleting event:", error) }
    }
  }

  const handleFormSuccess = () => { fetchEvents(); setShowEventForm(false); setEditingEvent(null) }
  const handleEditEvent = (event: Event) => { setEditingEvent(event); setShowEventForm(true) }
  const handleAddNewEvent = () => { setEditingEvent(null); setShowEventForm(true) }
  const handleCloseForm = () => { setShowEventForm(false); setEditingEvent(null) }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUser.name || !newUser.email || !newUser.password) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return }
    try {
      const response = await fetch('/api/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newUser),
      })
      if (response.ok) {
        fetchUsers(); setShowUserForm(false)
        setNewUser({ name: '', email: '', password: '', role: 'ADMIN' })
        alert('สร้างผู้ใช้ใหม่สำเร็จ')
      } else { const data = await response.json(); alert(`เกิดข้อผิดพลาด: ${data.error}`) }
    } catch { alert('เกิดข้อผิดพลาดในการสร้างผู้ใช้') }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === currentUser?.email) { alert('ไม่สามารถลบบัญชีของตัวเองได้'); return }
    if (confirm(`คุณต้องการลบผู้ใช้ ${userEmail} หรือไม่?`)) {
      try {
        const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' })
        if (response.ok) { fetchUsers(); alert('ลบผู้ใช้สำเร็จ') }
        else { const data = await response.json(); alert(`เกิดข้อผิดพลาด: ${data.error}`) }
      } catch { alert('เกิดข้อผิดพลาดในการลบผู้ใช้') }
    }
  }

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) fetchUsers()
      else { const data = await response.json(); alert(`เกิดข้อผิดพลาด: ${data.error}`) }
    } catch { alert('เกิดข้อผิดพลาดในการอัพเดทบทบาท') }
  }

  const handleEditUser = (user: User) => {
    setEditUser({ id: user.id, name: user.name || '', email: user.email, role: user.role, resetPassword: false, newPassword: '' })
    setShowEditUserForm(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editUser.name) { alert('กรุณากรอกชื่อ'); return }
    if (editUser.resetPassword && (!editUser.newPassword || editUser.newPassword.length < 6)) {
      alert('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร'); return
    }
    try {
      const updateData: { name: string; role: string; password?: string } = { name: editUser.name, role: editUser.role }
      if (editUser.resetPassword && editUser.newPassword) updateData.password = editUser.newPassword
      const response = await fetch(`/api/users/${editUser.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updateData),
      })
      if (response.ok) {
        fetchUsers(); setShowEditUserForm(false)
        setEditUser({ id: '', name: '', email: '', role: '', resetPassword: false, newPassword: '' })
        alert('อัพเดทข้อมูลผู้ใช้สำเร็จ')
      } else { const data = await response.json(); alert(`เกิดข้อผิดพลาด: ${data.error}`) }
    } catch { alert('เกิดข้อผิดพลาดในการอัพเดทข้อมูลผู้ใช้') }
  }

  if (authLoading || loading) {
    return <div className="loading-container"><div className="loading-spinner"></div></div>
  }

  const ongoingEvents = events.filter(e => getStatusKey(e) === 'ongoing').length
  const upcomingEvents = events.filter(e => getStatusKey(e) === 'upcoming').length
  const usersByRole = users.reduce((acc, user) => { acc[user.role] = (acc[user.role] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="admin-container">
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
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon green">📅</div>
              <div className="stat-info"><h3>กิจกรรมทั้งหมด</h3><p>{events.length}</p></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon blue">🔄</div>
              <div className="stat-info"><h3>กำลังจัด</h3><p>{ongoingEvents}</p></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon orange">⏰</div>
              <div className="stat-info"><h3>กำลังจะมา</h3><p>{upcomingEvents}</p></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon purple">👤</div>
              <div className="stat-info"><h3>ผู้ใช้ทั้งหมด</h3><p>{users.length}</p></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-navigation">
          <button onClick={() => setActiveTab('events')} className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}>
            📅 จัดการกิจกรรม ({events.length})
          </button>
          <button onClick={() => setActiveTab('users')} className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}>
            👥 จัดการผู้ใช้ ({users.length})
          </button>
        </div>

        {/* ===== EVENTS TAB ===== */}
        {activeTab === 'events' && (
          <div className="tab-content">
            <div className="action-buttons">
              <button onClick={handleAddNewEvent} className="action-button primary">
                <span>➕</span><span>เพิ่มกิจกรรมใหม่</span>
              </button>
              <button onClick={() => router.push("/calendar")} className="action-button secondary">
                <span>📅</span><span>ดูปฏิทินกิจกรรมรวม</span>
              </button>
            </div>

            <div className="search-filter-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อกิจกรรม, หน่วยงาน, สถานที่..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="search-input"
                />
                {eventSearch && <button className="clear-btn" onClick={() => setEventSearch('')}>✕</button>}
              </div>
              <div className="filter-controls">
                <select value={eventStatusFilter} onChange={(e) => setEventStatusFilter(e.target.value as typeof eventStatusFilter)} className="filter-select">
                  <option value="all">🔘 ทุกสถานะ</option>
                  <option value="ongoing">🟢 กำลังจัด</option>
                  <option value="upcoming">🔵 กำลังจะมา</option>
                  <option value="completed">⚫ จัดแล้ว</option>
                </select>
                <select value={eventSortBy} onChange={(e) => setEventSortBy(e.target.value as typeof eventSortBy)} className="filter-select">
                  <option value="date-asc">📅 วันที่ เก่า→ใหม่</option>
                  <option value="date-desc">📅 วันที่ ใหม่→เก่า</option>
                  <option value="status">🔄 เรียงตามสถานะ</option>
                  <option value="title">🔤 เรียงตามชื่อ</option>
                </select>
              </div>
            </div>

            <div className="result-count">
              แสดง {filteredEvents.length} จาก {events.length} กิจกรรม
              {(eventSearch || eventStatusFilter !== 'all') && (
                <button className="reset-filter-btn" onClick={() => { setEventSearch(''); setEventStatusFilter('all') }}>ล้างตัวกรอง ✕</button>
              )}
            </div>

            <div className="events-table-container">
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
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                          {eventSearch || eventStatusFilter !== 'all' ? '🔍 ไม่พบกิจกรรมที่ค้นหา' : 'ยังไม่มีกิจกรรม'}
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((event) => {
                        const status = getEventStatus(event.startDate, event.endDate)
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
                            <td><span className={status.className}>{status.text}</span></td>
                            <td>
                              <div className="action-buttons-cell">
                                <button onClick={() => handleEditEvent(event)} className="icon-button edit" title="แก้ไข">✏️</button>
                                <button onClick={() => handleDeleteEvent(event.id)} className="icon-button delete" title="ลบ">🗑️</button>
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

        {/* ===== USERS TAB ===== */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="user-stats">
              <h3>สถิติผู้ใช้ตามบทบาท — คลิกเพื่อกรอง</h3>
              <div className="role-stats-grid">
                <div className={`role-stat-item clickable-stat ${userRoleFilter === 'all' ? 'active-stat' : ''}`} onClick={() => setUserRoleFilter('all')}>
                  <span className="role-name">ทั้งหมด</span>
                  <span className="role-count">{users.length} คน</span>
                </div>
                {Object.entries(usersByRole).map(([role, count]) => (
                  <div key={role} className={`role-stat-item clickable-stat ${userRoleFilter === role ? 'active-stat' : ''}`} onClick={() => setUserRoleFilter(role as typeof userRoleFilter)}>
                    <span className="role-name">{role}</span>
                    <span className="role-count">{count} คน</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="action-buttons">
              <button onClick={() => setShowUserForm(true)} className="action-button primary">
                <span>👤</span><span>เพิ่มผู้ใช้ใหม่</span>
              </button>
            </div>

            <div className="search-filter-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="ค้นหาชื่อ, อีเมล, บทบาท..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="search-input"
                />
                {userSearch && <button className="clear-btn" onClick={() => setUserSearch('')}>✕</button>}
              </div>
              <div className="filter-controls">
                <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value as typeof userRoleFilter)} className="filter-select">
                  <option value="all">👥 ทุกบทบาท</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="CIO">CIO</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
                <select value={userSortBy} onChange={(e) => setUserSortBy(e.target.value as typeof userSortBy)} className="filter-select">
                  <option value="date-desc">📅 ใหม่→เก่า</option>
                  <option value="date-asc">📅 เก่า→ใหม่</option>
                  <option value="name">🔤 เรียงตามชื่อ</option>
                  <option value="email">📧 เรียงตามอีเมล</option>
                  <option value="role">🏷️ เรียงตามบทบาท</option>
                </select>
              </div>
            </div>

            <div className="result-count">
              แสดง {filteredUsers.length} จาก {users.length} ผู้ใช้
              {(userSearch || userRoleFilter !== 'all') && (
                <button className="reset-filter-btn" onClick={() => { setUserSearch(''); setUserRoleFilter('all') }}>ล้างตัวกรอง ✕</button>
              )}
            </div>

            <div className="users-table-container">
              <div style={{ overflowX: 'auto' }}>
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
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                          {userSearch || userRoleFilter !== 'all' ? '🔍 ไม่พบผู้ใช้ที่ค้นหา' : 'ยังไม่มีผู้ใช้'}
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name || '-'}</td>
                          <td>{user.email}</td>
                          <td>
                            <select value={user.role} onChange={(e) => handleUpdateUserRole(user.id, e.target.value)} className="role-select" disabled={user.email === currentUser?.email}>
                              <option value="ADMIN">ADMIN</option>
                              <option value="CIO">CIO</option>
                              <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <div className="action-buttons-cell">
                              <button onClick={() => handleEditUser(user)} className="icon-button edit" title="แก้ไขข้อมูล">✏️</button>
                              <button onClick={() => handleDeleteUser(user.id, user.email)} className="icon-button delete" title="ลบผู้ใช้" disabled={user.email === currentUser?.email}>🗑️</button>
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

      {showEventForm && <EventForm onClose={handleCloseForm} onSuccess={handleFormSuccess} editEvent={editingEvent} />}

      {showUserForm && (
        <div className="event-form-overlay">
          <div className="event-form-container">
            <div className="event-form-header">
              <h3>เพิ่มผู้ใช้ใหม่</h3>
              <button onClick={() => setShowUserForm(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleCreateUser} className="user-form">
              <div className="form-group"><label>ชื่อ:</label><input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required /></div>
              <div className="form-group"><label>อีเมล:</label><input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></div>
              <div className="form-group"><label>รหัสผ่าน:</label><input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required minLength={6} /></div>
              <div className="form-group">
                <label>บทบาท:</label>
                <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  <option value="ADMIN">ADMIN</option><option value="CIO">CIO</option><option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowUserForm(false)} className="btn-cancel">ยกเลิก</button>
                <button type="submit" className="btn-submit">สร้างผู้ใช้</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUserForm && (
        <div className="event-form-overlay">
          <div className="event-form-container">
            <div className="event-form-header">
              <h3>แก้ไขข้อมูลผู้ใช้</h3>
              <button onClick={() => setShowEditUserForm(false)} className="close-button">×</button>
            </div>
            <form onSubmit={handleUpdateUser} className="user-form">
              <div className="form-group"><label>ชื่อ:</label><input type="text" value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} required /></div>
              <div className="form-group">
                <label>อีเมล:</label>
                <input type="email" value={editUser.email} disabled className="disabled-input" />
                <small>ไม่สามารถเปลี่ยนอีเมลได้</small>
              </div>
              <div className="form-group">
                <label>บทบาท:</label>
                <select value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })} disabled={editUser.email === currentUser?.email}>
                  <option value="ADMIN">ADMIN</option><option value="CIO">CIO</option><option value="SUPERADMIN">SUPERADMIN</option>
                </select>
                {editUser.email === currentUser?.email && <small>ไม่สามารถเปลี่ยนบทบาทของตัวเองได้</small>}
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={editUser.resetPassword} onChange={(e) => setEditUser({ ...editUser, resetPassword: e.target.checked, newPassword: '' })} />
                  รีเซ็ตรหัสผ่าน
                </label>
              </div>
              {editUser.resetPassword && (
                <div className="form-group">
                  <label>รหัสผ่านใหม่:</label>
                  <input type="password" value={editUser.newPassword} onChange={(e) => setEditUser({ ...editUser, newPassword: e.target.value })} required minLength={6} placeholder="อย่างน้อย 6 ตัวอักษร" />
                </div>
              )}
              <div className="form-actions">
                <button type="button" onClick={() => setShowEditUserForm(false)} className="btn-cancel">ยกเลิก</button>
                <button type="submit" className="btn-submit">บันทึกการเปลี่ยนแปลง</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .search-filter-bar { display: flex; gap: 1rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; background: white; padding: 1rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .search-box { flex: 1; min-width: 240px; position: relative; display: flex; align-items: center; }
        .search-icon { position: absolute; left: 0.75rem; font-size: 1rem; pointer-events: none; }
        .search-input { width: 100%; padding: 0.5rem 2.5rem 0.5rem 2.25rem; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.875rem; outline: none; transition: border-color 0.2s; }
        .search-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .clear-btn { position: absolute; right: 0.5rem; background: none; border: none; cursor: pointer; color: #9ca3af; font-size: 0.875rem; padding: 0.25rem; }
        .clear-btn:hover { color: #374151; }
        .filter-controls { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .filter-select { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 0.875rem; color: #374151; background: white; cursor: pointer; outline: none; }
        .filter-select:focus { border-color: #3b82f6; }
        .result-count { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.75rem; }
        .reset-filter-btn { background: #fee2e2; color: #dc2626; border: none; padding: 0.25rem 0.75rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; }
        .reset-filter-btn:hover { background: #fecaca; }
        .clickable-stat { cursor: pointer; transition: all 0.2s; }
        .clickable-stat:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.12); }
        .active-stat { border-left-color: #2563eb !important; background: #eff6ff !important; }
        .admin-actions { display: flex; align-items: center; gap: 0.75rem; }
        .change-password-button { display: flex; align-items: center; gap: 0.5rem; background: #3b82f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s; }
        .change-password-button:hover { background: #2563eb; }
        .logout-button { display: flex; align-items: center; gap: 0.5rem; background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .logout-button:hover { background: #dc2626; }
        .admin-user-info { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .tab-navigation { display: flex; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; }
        .tab-button { padding: 0.75rem 1.5rem; border: none; background: none; cursor: pointer; font-weight: 500; color: #6b7280; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s; }
        .tab-button.active { color: #3b82f6; border-bottom-color: #3b82f6; }
        .tab-button:hover { color: #3b82f6; }
        .tab-content { margin-top: 1.5rem; }
        .stat-icon.orange { background: #f97316; }
        .stat-icon.purple { background: #8b5cf6; }
        .user-stats { margin-bottom: 1.5rem; padding: 1.25rem; background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .user-stats h3 { margin: 0 0 1rem 0; color: #1f2937; font-size: 1rem; }
        .role-stats-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
        .role-stat-item { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 1rem; background: #f9fafb; border-radius: 6px; border-left: 4px solid #3b82f6; min-width: 150px; }
        .role-name { font-weight: 500; color: #374151; font-size: 0.875rem; }
        .role-count { font-weight: bold; color: #3b82f6; font-size: 0.875rem; }
        .users-table-container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .users-table { width: 100%; border-collapse: collapse; }
        .users-table th, .users-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .users-table th { background: #f9fafb; font-weight: 600; color: #374151; font-size: 0.875rem; }
        .users-table tr:hover { background: #f9fafb; }
        .role-select { padding: 0.25rem 0.5rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.875rem; }
        .role-select:disabled { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
        .user-form { padding: 1.5rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #374151; }
        .form-group input, .form-group select { width: 100%; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.875rem; box-sizing: border-box; }
        .form-group input:focus, .form-group select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }
        .btn-cancel { padding: 0.5rem 1rem; border: 1px solid #d1d5db; background: white; color: #374151; border-radius: 6px; cursor: pointer; font-size: 0.875rem; }
        .btn-cancel:hover { background: #f9fafb; }
        .btn-submit { padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem; font-weight: 500; }
        .btn-submit:hover { background: #2563eb; }
        .disabled-input { background: #f3f4f6 !important; color: #6b7280 !important; cursor: not-allowed !important; }
        .form-group small { display: block; margin-top: 0.25rem; color: #6b7280; font-size: 0.75rem; }
        .checkbox-label { display: flex !important; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0 !important; }
        .checkbox-label input[type="checkbox"] { width: auto !important; margin: 0 !important; }
        @media (max-width: 768px) {
          .admin-header-content { flex-direction: column; gap: 1rem; text-align: center; }
          .admin-user-info { flex-direction: column; gap: 0.5rem; }
          .admin-actions { flex-direction: column; gap: 0.5rem; width: 100%; }
          .change-password-button, .logout-button { width: 100%; justify-content: center; }
          .tab-navigation { flex-direction: column; }
          .tab-button { width: 100%; text-align: left; }
          .search-filter-bar { flex-direction: column; }
          .search-box { min-width: unset; width: 100%; }
          .filter-controls { width: 100%; }
          .filter-select { flex: 1; }
          .role-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}