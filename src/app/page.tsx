"use client"

import { useState, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  // โหลด event จาก API (คุณปรับ endpoint ตามโปรเจคจริงได้เลย)
  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("โหลด events ล้มเหลว:", err))
  }, [])

  // ฟังก์ชันแชร์ปฏิทิน
  const handleShare = async () => {
    const iframeCode = `<iframe src="${window.location.origin}/calendar/share" style="width:100%; height:600px; border:none;"></iframe>`

    try {
      await navigator.clipboard.writeText(iframeCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("ไม่สามารถคัดลอกโค้ดได้:", err)
      alert("คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตัวเอง")
    }
  }

  return (
    <main style={{ padding: "1rem" }}>
      <h1 style={{ marginBottom: "1rem" }}>📅 ปฏิทินกิจกรรม</h1>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        locale="th"
        events={events}
        height="80vh"
        firstDay={1}
        weekends={true}
        dayMaxEvents={3}
        moreLinkText="เพิ่มเติม"
        eventDisplay="block"
        displayEventTime={true}
      />

      <div style={{ marginTop: "1rem" }}>
        <button
          onClick={handleShare}
          style={{
            padding: "0.6rem 1.2rem",
            border: "none",
            borderRadius: "8px",
            background: copied ? "#4caf50" : "#1976d2",
            color: "#fff",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "background 0.3s"
          }}
        >
          {copied ? "✅ คัดลอกโค้ดฝังแล้ว" : "📤 Share Calendar"}
        </button>
      </div>
    </main>
  )
}
