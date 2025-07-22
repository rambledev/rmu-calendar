"use client"

import { useState } from "react"

interface EventFormProps {
  onClose: () => void
  onSuccess: () => void
  editEvent?: {
    id: string
    title: string
    description: string | null
    startDate: string
    endDate: string
    location: string
    organizer: string
  } | null
}

export default function EventForm({ onClose, onSuccess, editEvent }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: editEvent?.title || "",
    description: editEvent?.description || "",
    startDate: editEvent ? new Date(editEvent.startDate).toISOString().slice(0, 16) : "",
    endDate: editEvent ? new Date(editEvent.endDate).toISOString().slice(0, 16) : "",
    location: editEvent?.location || "",
    organizer: editEvent?.organizer || ""
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.location || !formData.organizer) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน")
      setLoading(false)
      return
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError("วันที่เริ่มต้องมาก่อนวันที่สิ้นสุด")
      setLoading(false)
      return
    }

    try {
      const url = editEvent ? `/api/events/${editEvent.id}` : "/api/events"
      const method = editEvent ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        onSuccess()
        onClose()
      } else {
        setError(data.error || "เกิดข้อผิดพลาด")
      }
    } catch (error) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="event-form-overlay">
      <div className="event-form-container">
        <div className="event-form-header">
          <h3 className="event-form-title">
            {editEvent ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรมใหม่"}
          </h3>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          {/* Title */}
          <div className="form-group">
            <label className="form-label">ชื่อกิจกรรม *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="กรอกชื่อกิจกรรม"
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">รายละเอียด</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="กรอกรายละเอียดกิจกรรม"
              rows={4}
            />
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">วันที่เริ่ม *</label>
              <input
                type="datetime-local"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">วันที่สิ้นสุด *</label>
              <input
                type="datetime-local"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">สถานที่จัดกิจกรรม *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="เช่น หอประชุมมหาวิทยาลัย, อาคาร 1 ชั้น 2"
            />
          </div>

          {/* Organizer */}
          <div className="form-group">
            <label className="form-label">จัดโดย *</label>
            <input
              type="text"
              name="organizer"
              value={formData.organizer}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="เช่น คณะครุศาสตร์, งานกิจการนักศึกษา"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <span>{editEvent ? "💾" : "➕"}</span>
                  <span>{editEvent ? "บันทึกการแก้ไข" : "สร้างกิจกรรม"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}