// src/app/calendar/share/page.tsx
"use client"

import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import { useState, useEffect } from "react"

export default function CalendarSharePage() {
  const [events, setEvents] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("โหลด events ล้มเหลว:", err))
  }, [])

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        locale="th"
        events={events}
        height="100%"
      />
    </div>
  )
}
