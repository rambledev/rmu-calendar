// app/api/public/events/route.ts - Fixed version
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all events for public access (no authentication required)
export async function GET(request: NextRequest) {
  try {
    console.log("=== GET PUBLIC EVENTS API START ===")
    
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event')
    
    if (eventId) {
      // Get specific event
      console.log("🔍 Fetching specific event:", eventId)
      
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      })

      if (!event) {
        return NextResponse.json(
          { error: "ไม่พบกิจกรรม" },
          { status: 404 }
        )
      }

      console.log("✅ Specific event found:", event.title)
      console.log("=== GET PUBLIC EVENTS API END (SUCCESS) ===")
      return NextResponse.json([event]) // Return as array for consistency
    }

    // Get all events for public display
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: 'asc'
      }
    })
    
    console.log("📅 Public events found:", events.length)
    console.log("=== GET PUBLIC EVENTS API END (SUCCESS) ===")
    return NextResponse.json(events)

  } catch (error) {
    console.error("💥 Error fetching public events:", error)
    console.log("=== GET PUBLIC EVENTS API END (ERROR) ===")
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" },
      { status: 500 }
    )
  }
}