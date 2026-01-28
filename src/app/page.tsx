"use client"

import { useState, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"

export default function HomePage() {
  const [events, setEvents] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetch("/api/events")
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error("โหลด events ล้มเหลว:", err))
  }, [])

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

  const getAspectRatio = () => {
    if (typeof window === 'undefined') return 1.35
    return window.innerWidth < 768 ? 0.9 : window.innerWidth < 1024 ? 1.2 : 1.5
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-indigo-600/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-gray-700 font-medium animate-pulse">กำลังโหลดปฏิทิน...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-blue-50 to-indigo-100">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                <div className="relative flex-shrink-0 bg-white rounded-xl p-1.5 shadow-md">
                  <img 
                    src="/public/100.png" 
                    alt="Logo" 
                    className="h-7 w-7 sm:h-9 sm:w-9 object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  ปฏิทินกิจกรรม
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:block">
                  จัดการกิจกรรมของคุณอย่างมีประสิทธิภาพ
                </p>
              </div>
            </div>
            
            {/* Quick Stats Badge */}
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-2 rounded-full border border-indigo-200/50">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-700">{events.length}</span>
              </div>
              <span className="text-xs text-gray-600">กิจกรรม</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        
        {/* Calendar Section */}
        <div className="mb-8 sm:mb-12">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/60 overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    ปฏิทินรายเดือน
                  </h2>
                  <p className="text-indigo-100 text-xs sm:text-sm mt-1">
                    ดูและจัดการกิจกรรมทั้งหมดของคุณ
                  </p>
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <p className="text-white text-sm font-semibold">{events.length} Events</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Body */}
            <div className="p-4 sm:p-6 lg:p-8">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale="th"
                events={events}
                height="auto"
                aspectRatio={getAspectRatio()}
                firstDay={1}
                weekends={true}
                dayMaxEvents={3}
                moreLinkText={(n) => `+${n} เพิ่มเติม`}
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
                  info.el.style.borderRadius = '8px'
                  info.el.style.border = 'none'
                  info.el.style.fontSize = '0.875rem'
                  info.el.style.fontWeight = '600'
                  info.el.style.padding = '6px 10px'
                  info.el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                  info.el.style.transition = 'all 0.2s'
                  
                  info.el.addEventListener('mouseenter', () => {
                    info.el.style.transform = 'translateY(-2px)'
                    info.el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'
                  })
                  
                  info.el.addEventListener('mouseleave', () => {
                    info.el.style.transform = 'translateY(0)'
                    info.el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
                  })
                }}
              />
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="mb-8 sm:mb-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl sm:rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-xl">
              <div className="text-center space-y-6">
                <div className="inline-block">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 mb-4">
                    <span className="text-5xl sm:text-6xl">📤</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3">
                    แชร์ปฏิทินของคุณ
                  </h3>
                  <p className="text-indigo-100 text-base sm:text-lg max-w-2xl mx-auto">
                    คัดลอกโค้ดฝังเพื่อแชร์ปฏิทินไปยังเว็บไซต์อื่น พร้อมดีไซน์สวยงาม
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleShare}
                    className={`group relative inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-base sm:text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg ${
                      copied 
                        ? "bg-green-500 hover:bg-green-600" 
                        : "bg-white text-indigo-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="absolute inset-0 rounded-xl bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    {copied ? (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        คัดลอกสำเร็จ!
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        คัดลอกโค้ดฝัง
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {[
            {
              icon: "📱",
              title: "Responsive Design",
              description: "ใช้งานได้ทุกอุปกรณ์ ทั้งมือถือ แท็บเล็ต และคอมพิวเตอร์",
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-50 to-cyan-50"
            },
            {
              icon: "⚡",
              title: "ใช้งานง่าย",
              description: "อินเทอร์เฟซสวยงาม เข้าใจง่าย ใช้งานได้ทันที",
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-50 to-emerald-50"
            },
            {
              icon: "🎨",
              title: "ดีไซน์สวยงาม",
              description: "ดีไซน์ทันสมัย สีสันสบายตา UI/UX ที่ยอดเยี่ยม",
              gradient: "from-purple-500 to-pink-500",
              bgGradient: "from-purple-50 to-pink-50"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-200/60 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div 
  className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}
></div>
              
              <div className="relative">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                  {feature.icon}
                </div>
                
                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 transition-all">
                  {feature.title}
                </h4>
                
                <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-md border border-gray-200/60">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 font-medium">
              ระบบทำงานปกติ • อัพเดทล่าสุด: วันนี้
            </span>
          </div>
        </div>
      </main>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        /* FullCalendar Custom Styles */
        .fc-toolbar-title {
          font-size: 1.75rem !important;
          font-weight: 800 !important;
          color: #1f2937 !important;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
          -webkit-background-clip: text !important;
          -webkit-text-fill-color: transparent !important;
          background-clip: text !important;
        }
        
        .fc-button-primary {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
          border: none !important;
          color: white !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
          padding: 0.625rem 1.25rem !important;
          transition: all 0.3s !important;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2) !important;
        }
        
        .fc-button-primary:hover {
          background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important;
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 12px rgba(79, 70, 229, 0.3) !important;
        }
        
        .fc-button-primary:active {
          transform: translateY(0) !important;
        }
        
        .fc-button-primary:disabled {
          background: #d1d5db !important;
          box-shadow: none !important;
          transform: none !important;
        }
        
        .fc-day-today {
          background: linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%) !important;
          position: relative !important;
        }
        
        .fc-day-today::before {
          content: '';
          position: absolute;
          inset: 0;
          border: 2px solid #4f46e5;
          border-radius: 8px;
          pointer-events: none;
        }
        
        .fc-event {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
          border: none !important;
          margin: 3px !important;
          cursor: pointer !important;
        }
        
        .fc-daygrid-event {
          padding: 6px 10px !important;
        }
        
        .fc-col-header-cell {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
          font-weight: 700 !important;
          color: #374151 !important;
          padding: 14px 0 !important;
          border-bottom: 2px solid #e5e7eb !important;
        }
        
        .fc-scrollgrid {
          border-color: #e5e7eb !important;
          border-radius: 16px !important;
          overflow: hidden !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05) !important;
        }
        
        .fc-daygrid-day-number {
          color: #374151 !important;
          font-weight: 600 !important;
          padding: 10px !important;
          transition: all 0.2s !important;
        }
        
        .fc-daygrid-day:hover .fc-daygrid-day-number {
          color: #4f46e5 !important;
          transform: scale(1.1) !important;
        }
        
        .fc-daygrid-day-frame {
          padding: 4px !important;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
          .fc-toolbar-title {
            font-size: 1.25rem !important;
          }
          
          .fc-button-primary {
            padding: 0.5rem 1rem !important;
            font-size: 0.875rem !important;
            border-radius: 10px !important;
          }
          
          .fc-col-header-cell {
            padding: 10px 0 !important;
            font-size: 0.875rem !important;
          }
          
          .fc-daygrid-day-number {
            font-size: 0.875rem !important;
            padding: 8px !important;
          }
          
          .fc-daygrid-event {
            font-size: 0.75rem !important;
            padding: 4px 6px !important;
          }
        }
        
        @media (max-width: 640px) {
          .fc-toolbar-title {
            font-size: 1.125rem !important;
          }
          
          .fc-header-toolbar {
            flex-direction: column !important;
            gap: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  )
}