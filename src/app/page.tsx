"use client"

import { useState, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  // ตรวจสอบว่าอยู่ใน client-side หรือไม่
  useEffect(() => {
    setMounted(true)
  }, [])

  // โหลด event จาก API
  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("โหลด events ล้มเหลว:", err))
  }, [])

  // ฟังก์ชันแชร์ปฏิทิน
  const handleShare = async () => {
    if (typeof window === 'undefined') return
    
    const iframeCode = `<iframe src="${window.location.origin}/calendar/share" style="width:100%; height:600px; border:none; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.1);"></iframe>`

    try {
      await navigator.clipboard.writeText(iframeCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error("ไม่สามารถคัดลอกโค้ดได้:", err)
      alert("คัดลอกไม่สำเร็จ กรุณาคัดลอกด้วยตัวเอง")
    }
  }

  // คำนวณ aspectRatio สำหรับ FullCalendar
  const getAspectRatio = () => {
    if (typeof window === 'undefined') return 1.35
    return window.innerWidth < 768 ? 0.8 : 1.35
  }

  // แสดง loading หรือ placeholder ขณะที่ยังไม่ mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Title */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="flex-shrink-0">
                <img 
                  src="/public/100.png" 
                  alt="Logo" 
                  className="h-8 w-8 sm:h-10 sm:w-10 object-contain rounded-lg shadow-sm"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  ปฏิทินกิจกรรม
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  จัดการกิจกรรมของคุณอย่างมีประสิทธิภาพ
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Calendar Container */}
        <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden mb-6 sm:mb-8">
          <div className="p-3 sm:p-6">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              locale="th"
              events={events}
              height="auto"
              aspectRatio={getAspectRatio()}
              firstDay={1}
              weekends={true}
              dayMaxEvents={2}
              moreLinkText="เพิ่มเติม"
              eventDisplay="block"
              displayEventTime={true}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: ''
              }}
              buttonText={{
                today: 'วันนี้',
                month: 'เดือน',
                week: 'สัปดาห์'
              }}
              eventDidMount={(info) => {
                // Custom styling for events
                info.el.style.borderRadius = '6px'
                info.el.style.border = 'none'
                info.el.style.fontSize = '0.875rem'
                info.el.style.fontWeight = '500'
              }}
            />
          </div>
        </div>

        {/* Share Section */}
        <div className="w-full max-w-2xl">
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-white text-center">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  📤 แชร์ปฏิทินของคุณ
                </h3>
                <p className="text-indigo-100 text-sm sm:text-base">
                  คัดลอกโค้ดฝังเพื่อแชร์ปฏิทินไปยังเว็บไซต์อื่น
                </p>
              </div>
              <div>
                <button
                  onClick={handleShare}
                  className={`inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-sm sm:text-base transition-all transform hover:scale-105 active:scale-95 ${
                    copied 
                      ? "bg-green-500 hover:bg-green-600" 
                      : "bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      คัดลอกแล้ว!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      คัดลอกโค้ดฝัง
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="w-full max-w-4xl mt-6 sm:mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200/50 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 text-xl mb-3">
                  📱
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Responsive</h4>
                <p className="text-gray-600 text-sm">
                  ใช้งานได้ทุกอุปกรณ์ ทั้งมือถือและคอมพิวเตอร์
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200/50 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-xl mb-3">
                  ⚡
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">ใช้งานง่าย</h4>
                <p className="text-gray-600 text-sm">
                  อินเทอร์เฟซเรียบง่าย เข้าใจได้ในพริบตา
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200/50 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-xl mb-3">
                  🎨
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">สวยงาม</h4>
                <p className="text-gray-600 text-sm">
                  ดีไซน์ทันสมัย สีสันสบายตา
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .fc-toolbar-title {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
          color: #1f2937 !important;
        }
        
        .fc-button-primary {
          background-color: #4f46e5 !important;
          border-color: #4f46e5 !important;
          color: white !important;
          border-radius: 8px !important;
          font-weight: 500 !important;
          padding: 0.5rem 1rem !important;
          transition: all 0.2s !important;
        }
        
        .fc-button-primary:hover {
          background-color: #4338ca !important;
          border-color: #4338ca !important;
          transform: translateY(-1px) !important;
        }
        
        .fc-button-primary:disabled {
          background-color: #9ca3af !important;
          border-color: #9ca3af !important;
        }
        
        .fc-day-today {
          background-color: #eff6ff !important;
        }
        
        .fc-event {
          background-color: #4f46e5 !important;
          border: none !important;
          margin: 2px !important;
        }
        
        .fc-daygrid-event {
          padding: 4px 6px !important;
        }
        
        .fc-col-header-cell {
          background-color: #f8fafc !important;
          font-weight: 600 !important;
          color: #374151 !important;
          padding: 12px 0 !important;
        }
        
        .fc-scrollgrid {
          border-color: #e5e7eb !important;
          border-radius: 12px !important;
          overflow: hidden !important;
        }
        
        .fc-daygrid-day-number {
          color: #374151 !important;
          font-weight: 500 !important;
          padding: 8px !important;
        }
        
        @media (max-width: 768px) {
          .fc-toolbar-title {
            font-size: 1.25rem !important;
          }
          
          .fc-button-primary {
            padding: 0.4rem 0.8rem !important;
            font-size: 0.875rem !important;
          }
          
          .fc-col-header-cell {
            padding: 8px 0 !important;
            font-size: 0.875rem !important;
          }
          
          .fc-daygrid-day-number {
            font-size: 0.875rem !important;
            padding: 6px !important;
          }
        }
      `}</style>
    </div>
  )
}